import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type {
  AIDecision,
  AuditRecord,
  Config,
  EventKind,
  LLMTrace,
  TimelineItem,
  ToolName,
} from "./supervisor-types";
import { EVENT_META, TOOL_META } from "./supervisor-types";

let __idc = 0;
const nid = (p = "id") => `${p}_${Date.now().toString(36)}_${(++__idc).toString(36)}`;

interface State {
  order: {
    id: string;
    customer: string;
    total: number;
    items: string;
    channel: string;
  };
  items: TimelineItem[];
  audit: AuditRecord[];
  selectedId: string | null;
  processingEventId: string | null;
  config: Config;
}

type Action =
  | { type: "SELECT"; id: string | null }
  | { type: "ADD_ITEM"; item: TimelineItem }
  | { type: "UPDATE_ITEM"; id: string; patch: Partial<TimelineItem> }
  | { type: "ADD_AUDIT"; rec: AuditRecord }
  | { type: "SET_PROCESSING"; id: string | null }
  | { type: "SET_CONFIG"; patch: Partial<Config> }
  | { type: "RESET"; state: State };

const defaultConfig: Config = {
  refundThreshold: 2500,
  escalation: "medium",
  wakeInterval: 8,
  temperature: 0.3,
  scenario: "default",
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "SELECT":
      return { ...s, selectedId: a.id };
    case "ADD_ITEM":
      return { ...s, items: [...s.items, a.item] };
    case "UPDATE_ITEM":
      return {
        ...s,
        items: s.items.map((it) => (it.id === a.id ? { ...it, ...a.patch } : it)),
      };
    case "ADD_AUDIT":
      return { ...s, audit: [...s.audit, a.rec] };
    case "SET_PROCESSING":
      return { ...s, processingEventId: a.id };
    case "SET_CONFIG":
      return { ...s, config: { ...s.config, ...a.patch } };
    case "RESET":
      return a.state;
  }
}

// ------------------------------------------------------------------
// Decision engine: maps an event to a simulated AI decision + trace.
// ------------------------------------------------------------------

const POLICIES = [
  "Refunds ≤ auto-approval threshold may be issued without review.",
  "Angry-customer signals trigger empathetic reply within 1 hour.",
  "Chargeback risk always requires human review.",
  "Delayed shipments notify logistics + apologise to customer.",
  "Wrong-item deliveries require replacement + partial credit.",
];

const SCHEMA = `{
  "tool": "notify_customer | issue_refund | escalate_to_human | notify_logistics | create_internal_note | close_ticket",
  "reasoning": "string",
  "confidence": "number (0-1)",
  "message": { "channel": "whatsapp|email|slack", "to": "string", "body": "string" },
  "amount": "number?"
}`;

function decisionFor(
  event: EventKind,
  order: State["order"],
  config: Config
): { decision: AIDecision; trace: LLMTrace } {
  let decision: AIDecision;

  const empathetic =
    `Hi ${order.customer.split(" ")[0]}, we're really sorry about this. ` +
    `We've flagged your order ${order.id} and our team is on it, and you'll hear from us shortly.`;

  switch (event) {
    case "payment_failed":
      decision = {
        tool: "notify_customer",
        reasoning:
          "Payment gateway returned a soft failure. Customer likely just needs to retry with a different method.",
        confidence: 0.86,
        needsReview: false,
        message: {
          channel: "whatsapp",
          to: order.customer,
          body: `Hi ${order.customer.split(" ")[0]}, your payment for order ${order.id} didn't go through. Tap here to retry (no need to re-enter your cart).`,
        },
      };
      break;
    case "shipment_delayed":
      decision = {
        tool: "notify_logistics",
        reasoning:
          "Courier ETA slipped by 36h. Logistics ops need to reassign the shipment before we tell the customer.",
        confidence: 0.78,
        needsReview: false,
        message: {
          channel: "slack",
          to: "#ops-logistics",
          body: `:warning: Order ${order.id} for ${order.customer} is delayed. Please reassign carrier and confirm new ETA.`,
        },
      };
      break;
    case "angry_customer":
      decision = {
        tool: "escalate_to_human",
        reasoning:
          "Tone analysis flagged high frustration + repeat contact within 24h. Requires empathetic human touch.",
        confidence: 0.62,
        needsReview: true,
        message: { channel: "email", to: order.customer, subject: `Re: your order ${order.id}`, body: empathetic },
      };
      break;
    case "refund_requested": {
      const amount = Math.min(order.total, Math.round(order.total * 0.8));
      const auto = amount <= config.refundThreshold;
      decision = {
        tool: "issue_refund",
        reasoning: auto
          ? `Refund of ₹${amount} is within the ₹${config.refundThreshold} auto-approval threshold and matches policy.`
          : `Refund of ₹${amount} exceeds the ₹${config.refundThreshold} auto-approval threshold, routing for human review.`,
        confidence: auto ? 0.91 : 0.68,
        needsReview: !auto,
        amount,
        message: {
          channel: "email",
          to: order.customer,
          subject: `Refund processed for order ${order.id}`,
          body: `Hi ${order.customer.split(" ")[0]}, we've initiated a refund of ₹${amount} for order ${order.id}. It should reflect in 3-5 business days.`,
        },
      };
      break;
    }
    case "chargeback_threat":
      decision = {
        tool: "escalate_to_human",
        reasoning:
          "Customer mentioned chargeback. Policy requires human review before any action to avoid disputes.",
        confidence: 0.55,
        needsReview: true,
      };
      break;
    case "wrong_item":
      decision = {
        tool: "escalate_to_human",
        reasoning:
          "Wrong item delivered, needs replacement dispatch + partial credit. Both actions require human confirmation.",
        confidence: 0.7,
        needsReview: true,
      };
      break;
    case "customer_followup":
      decision = {
        tool: "notify_customer",
        reasoning: "Straightforward status update, safe to send without review.",
        confidence: 0.94,
        needsReview: false,
        message: {
          channel: "whatsapp",
          to: order.customer,
          body: `Quick update on ${order.id}: we're still working on this and will confirm within 24h. Thanks for your patience!`,
        },
      };
      break;
    case "delivery_completed":
      decision = {
        tool: "close_ticket",
        reasoning: "Delivery confirmed by courier. No open issues, case can be closed.",
        confidence: 0.97,
        needsReview: false,
      };
      break;
    default:
      decision = {
        tool: "create_internal_note",
        reasoning: "Event logged for observability; no action needed right now.",
        confidence: 0.8,
        needsReview: false,
      };
  }

  const trace: LLMTrace = {
    promptEvent: `event=${event} order=${order.id} customer="${order.customer}" total=₹${order.total}`,
    orderState: `status=in_progress items=${order.items} channel=${order.channel}`,
    memory:
      "Last 5 interactions: 1 refund request, 1 delay notice, 2 status pings, 1 delivery confirmation.",
    policies: POLICIES,
    schema: SCHEMA,
    rawResponse: JSON.stringify(
      {
        tool: decision.tool,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        message: decision.message,
        amount: decision.amount,
      },
      null,
      2
    ),
    inputTokens: 820 + Math.floor(Math.random() * 260),
    outputTokens: 140 + Math.floor(Math.random() * 180),
  };

  return { decision, trace };
}

// ------------------------------------------------------------------
// Initial demo timeline
// ------------------------------------------------------------------

function buildInitialState(): State {
  const order = {
    id: "ORD-38271",
    customer: "Aditi Sharma",
    total: 3480,
    items: "1x Wireless Headphones, 1x Phone Case",
    channel: "web",
  };

  const now = Date.now();
  const t = (mins: number) => now - mins * 60_000;
  let seq = 0;
  const mk = (p: Partial<TimelineItem> & { title: string }): TimelineItem => ({
    id: `seed_${++seq}`,
    ts: t(0),
    type: "event",
    status: "closed",
    description: "",
    ...p,
  });

  const items: TimelineItem[] = [
    mk({ ts: t(38), type: "event", status: "closed", title: "Payment Failed", description: "Gateway returned SOFT_DECLINE on ₹3,480 charge.", eventKind: "payment_failed" }),
    mk({ ts: t(37), type: "ai_reasoning", status: "closed", title: "AI Supervisor woke up", description: "Analysed failure code and recent order context." }),
    mk({ ts: t(36), type: "ai_decision", status: "closed", title: "Send retry link via WhatsApp", description: "Confidence 86% (within auto-approval band)." }),
    mk({ ts: t(35), type: "execution", status: "executed", title: "WhatsApp sent to Aditi Sharma", description: "Message delivered · read at 12:14" }),
    mk({ ts: t(28), type: "event", status: "closed", title: "Customer contacted support", description: "Aditi replied: \"I paid but the order still shows failed?\"", eventKind: "support_contact" }),
    mk({ ts: t(27), type: "note", status: "closed", title: "Internal note created", description: "Cross-check payment webhook: potential race condition." }),
    mk({ ts: t(20), type: "event", status: "closed", title: "Shipment Delayed", description: "Courier ETA slipped by 36 hours.", eventKind: "shipment_delayed" }),
    mk({ ts: t(19), type: "ai_decision", status: "closed", title: "Notify logistics on Slack", description: "Confidence 78% (auto-executed)." }),
    mk({ ts: t(18), type: "execution", status: "executed", title: "Slack posted to #ops-logistics", description: "Ops acknowledged in 3 min." }),
    mk({ ts: t(9), type: "event", status: "active", title: "Refund Requested", description: "Customer requested a refund of ₹2,784.", eventKind: "refund_requested" }),
    mk({ ts: t(8), type: "ai_reasoning", status: "closed", title: "AI evaluated refund", description: "Amount above configured threshold, flagging for review." }),
    mk({ ts: t(7), type: "review", status: "pending", title: "Awaiting human review", description: "Issue refund of ₹2,784 (pending approval)." }),
  ];

  // Attach decision + trace to the pending review card so the inspector works.
  const reviewItem = items[items.length - 1];
  const { decision, trace } = decisionFor("refund_requested", order, defaultConfig);
  reviewItem.decision = decision;
  reviewItem.trace = trace;

  // Attach decision/trace to earlier ai_decision cards too.
  const attach = (idx: number, kind: EventKind) => {
    const { decision: d, trace: tr } = decisionFor(kind, order, defaultConfig);
    items[idx].decision = d;
    items[idx].trace = tr;
  };
  attach(2, "payment_failed");
  attach(7, "shipment_delayed");

  const audit: AuditRecord[] = [
    { id: nid("aud"), ts: t(35), actor: "AI Supervisor", action: "Sent retry link via WhatsApp", reasoning: "Payment soft-declined; retry is safe.", status: "executed" },
    { id: nid("aud"), ts: t(27), actor: "AI Supervisor", action: "Created internal note", reasoning: "Potential webhook race.", status: "closed" },
    { id: nid("aud"), ts: t(18), actor: "AI Supervisor", action: "Notified logistics on Slack", reasoning: "Courier ETA slipped by 36h.", status: "executed" },
    { id: nid("aud"), ts: t(7), actor: "AI Supervisor", action: "Requested human review", reasoning: "Refund above auto-approval threshold.", status: "pending" },
  ];

  return {
    order,
    items,
    audit,
    selectedId: reviewItem.id,
    processingEventId: null,
    config: defaultConfig,
  };
}

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

interface Ctx {
  state: State;
  select: (id: string | null) => void;
  injectEvent: (kind: EventKind) => void;
  approveReview: (id: string) => void;
  declineReview: (id: string) => void;
  modifyReview: (id: string, message: string) => void;
  overrideReview: (id: string, tool: ToolName) => void;
  updateConfig: (patch: Partial<Config>) => void;
  resetDemo: () => void;
}

const SupervisorCtx = createContext<Ctx | null>(null);

export function SupervisorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const audit = useCallback(
    (rec: Omit<AuditRecord, "id" | "ts">) =>
      dispatch({ type: "ADD_AUDIT", rec: { id: nid("aud"), ts: Date.now(), ...rec } }),
    []
  );

  const executeDecision = useCallback(
    (decisionItemId: string, decision: AIDecision) => {
      const meta = TOOL_META[decision.tool];
      const execId = nid("exec");
      dispatch({
        type: "ADD_ITEM",
        item: {
          id: execId,
          ts: Date.now(),
          type: "execution",
          status: "executed",
          title: `${meta.label} executed`,
          description: decision.message
            ? `Delivered via ${decision.message.channel}${decision.message.to ? " → " + decision.message.to : ""}`
            : "Action completed successfully.",
          decision,
          linkedId: decisionItemId,
        },
      });
      audit({
        actor: "AI Supervisor",
        action: `${meta.label}`,
        reasoning: decision.reasoning,
        status: "executed",
      });
    },
    [audit]
  );

  const injectEvent = useCallback(
    (kind: EventKind) => {
      const meta = EVENT_META[kind];
      const order = stateRef.current.order;
      const config = stateRef.current.config;

      // 1. Add the event
      const eventId = nid("evt");
      dispatch({
        type: "ADD_ITEM",
        item: {
          id: eventId,
          ts: Date.now(),
          type: "event",
          status: "active",
          title: meta.label,
          description: meta.description,
          eventKind: kind,
        },
      });
      audit({
        actor: "Customer",
        action: `Event: ${meta.label}`,
        reasoning: meta.description,
        status: "active",
      });

      // 2. AI wakes up (reasoning card)
      dispatch({ type: "SET_PROCESSING", id: eventId });
      setTimeout(() => {
        const reasoningId = nid("rsn");
        dispatch({
          type: "ADD_ITEM",
          item: {
            id: reasoningId,
            ts: Date.now(),
            type: "ai_reasoning",
            status: "active",
            title: "AI Supervisor woke up",
            description: "Analysing event against order state, memory & policies…",
          },
        });

        // 3. AI decision
        setTimeout(() => {
          const { decision, trace } = decisionFor(kind, order, config);
          const meta2 = TOOL_META[decision.tool];
          const decisionId = nid("dec");
          dispatch({
            type: "UPDATE_ITEM",
            id: reasoningId,
            patch: { status: "closed", description: "Analysis complete." },
          });
          dispatch({
            type: "ADD_ITEM",
            item: {
              id: decisionId,
              ts: Date.now(),
              type: decision.needsReview ? "review" : "ai_decision",
              status: decision.needsReview ? "pending" : "active",
              title: decision.needsReview
                ? `Review needed: ${meta2.label}`
                : `${meta2.label}`,
              description: decision.reasoning,
              decision,
              trace,
            },
          });
          audit({
            actor: "AI Supervisor",
            action: decision.needsReview
              ? `Proposed ${meta2.label} (awaiting review)`
              : `Decided to ${meta2.label}`,
            reasoning: decision.reasoning,
            status: decision.needsReview ? "pending" : "active",
          });
          dispatch({ type: "SET_PROCESSING", id: null });

          // 4. Auto-execute if no review
          if (!decision.needsReview) {
            setTimeout(() => {
              executeDecision(decisionId, decision);
              dispatch({
                type: "UPDATE_ITEM",
                id: decisionId,
                patch: { status: "closed" },
              });
              dispatch({
                type: "UPDATE_ITEM",
                id: eventId,
                patch: { status: "closed" },
              });
            }, 900);
          }
          dispatch({ type: "SELECT", id: decisionId });
        }, 1400);
      }, 700);
    },
    [audit, executeDecision]
  );

  const approveReview = useCallback(
    (id: string) => {
      const item = stateRef.current.items.find((i) => i.id === id);
      if (!item?.decision) return;
      dispatch({
        type: "UPDATE_ITEM",
        id,
        patch: { status: "closed", reviewed: "approved" },
      });
      audit({
        actor: "Human Reviewer",
        action: `Approved: ${TOOL_META[item.decision.tool].label}`,
        reasoning: "Approved AI recommendation without changes.",
        status: "closed",
      });
      setTimeout(() => executeDecision(id, item.decision!), 500);
    },
    [audit, executeDecision]
  );

  const declineReview = useCallback(
    (id: string) => {
      const item = stateRef.current.items.find((i) => i.id === id);
      if (!item?.decision) return;
      dispatch({
        type: "UPDATE_ITEM",
        id,
        patch: { status: "failed", reviewed: "declined" },
      });
      audit({
        actor: "Human Reviewer",
        action: `Declined: ${TOOL_META[item.decision.tool].label}`,
        reasoning: "Reviewer declined the AI recommendation.",
        status: "failed",
      });
    },
    [audit]
  );

  const modifyReview = useCallback(
    (id: string, message: string) => {
      const item = stateRef.current.items.find((i) => i.id === id);
      if (!item?.decision?.message) return;
      const updated: AIDecision = {
        ...item.decision,
        message: { ...item.decision.message, body: message },
      };
      dispatch({
        type: "UPDATE_ITEM",
        id,
        patch: { status: "closed", reviewed: "modified", decision: updated },
      });
      audit({
        actor: "Human Reviewer",
        action: `Modified & approved: ${TOOL_META[updated.tool].label}`,
        reasoning: "Reviewer edited the message before sending.",
        status: "closed",
      });
      setTimeout(() => executeDecision(id, updated), 500);
    },
    [audit, executeDecision]
  );

  const overrideReview = useCallback(
    (id: string, tool: ToolName) => {
      const item = stateRef.current.items.find((i) => i.id === id);
      if (!item?.decision) return;
      const updated: AIDecision = { ...item.decision, tool, needsReview: false };
      dispatch({
        type: "UPDATE_ITEM",
        id,
        patch: { status: "closed", reviewed: "overridden", decision: updated },
      });
      audit({
        actor: "Human Reviewer",
        action: `Overrode to: ${TOOL_META[tool].label}`,
        reasoning: "Reviewer chose a different tool than the AI proposed.",
        status: "closed",
      });
      setTimeout(() => executeDecision(id, updated), 500);
    },
    [audit, executeDecision]
  );

  const updateConfig = useCallback(
    (patch: Partial<Config>) => dispatch({ type: "SET_CONFIG", patch }),
    []
  );

  const resetDemo = useCallback(() => {
    dispatch({ type: "RESET", state: buildInitialState() });
  }, []);

  // Simulated "scheduled wake" heartbeat: occasionally logs a passive check.
  useEffect(() => {
    const t = setInterval(() => {
      // Just an audit ping: non-intrusive.
      audit({
        actor: "System",
        action: "Scheduled wake check",
        reasoning: "No open events: supervisor sleeping.",
        status: "closed",
      });
    }, 45_000);
    return () => clearInterval(t);
  }, [audit]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      select: (id) => dispatch({ type: "SELECT", id }),
      injectEvent,
      approveReview,
      declineReview,
      modifyReview,
      overrideReview,
      updateConfig,
      resetDemo,
    }),
    [state, injectEvent, approveReview, declineReview, modifyReview, overrideReview, updateConfig, resetDemo]
  );

  return <SupervisorCtx.Provider value={value}>{children}</SupervisorCtx.Provider>;
}

export function useSupervisor() {
  const ctx = useContext(SupervisorCtx);
  if (!ctx) throw new Error("useSupervisor must be used inside SupervisorProvider");
  return ctx;
}
