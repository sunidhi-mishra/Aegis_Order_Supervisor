import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Flame,
  LifeBuoy,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  PackageCheck,
  PackageX,
  Send,
  ShieldAlert,
  StickyNote,
  Truck,
  UserCheck,
  Wallet,
  Zap,
} from "lucide-react";
import type { ItemStatus, ItemType, TimelineItem } from "@/lib/supervisor-types";
import { useSupervisor } from "@/lib/supervisor-store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const eventIcon = (name?: string) => {
  switch (name) {
    case "credit-card": return CreditCard;
    case "truck": return Truck;
    case "flame": return Flame;
    case "wallet": return Wallet;
    case "shield-alert": return ShieldAlert;
    case "package-x": return PackageX;
    case "message-circle": return MessageCircle;
    case "package-check": return PackageCheck;
    case "life-buoy": return LifeBuoy;
    case "megaphone": return Megaphone;
    case "check-circle": return CheckCircle2;
    case "send": return Send;
    case "sticky-note": return StickyNote;
    case "user-check": return UserCheck;
    default: return Package;
  }
};

const typeMeta: Record<
  ItemType,
  { label: string; Icon: typeof Bot; tone: string }
> = {
  event:        { label: "Event",         Icon: Activity,     tone: "event" },
  ai_reasoning: { label: "AI Reasoning",  Icon: Bot,          tone: "ai" },
  ai_decision:  { label: "AI Decision",   Icon: Zap,          tone: "ai" },
  review:       { label: "Review",        Icon: UserCheck,    tone: "review" },
  execution:    { label: "Executed",      Icon: CheckCircle2, tone: "executed" },
  completed:    { label: "Completed",     Icon: CheckCircle2, tone: "closed" },
  note:         { label: "Note",          Icon: StickyNote,   tone: "event" },
};

const statusLabel: Record<ItemStatus, string> = {
  active: "Active",
  pending: "Pending review",
  executed: "Executed",
  failed: "Failed",
  closed: "Closed",
};

function toneClasses(tone: string) {
  // Uses semantic tokens — bg-status-*-soft + text-status-* defined in styles.css
  return {
    ring: `ring-status-${tone}/20`,
    bg: `bg-status-${tone}-soft`,
    text: `text-status-${tone}`,
    border: `border-status-${tone}/25`,
  };
}

function statusPill(status: ItemStatus) {
  const map: Record<ItemStatus, string> = {
    active:   "bg-status-ai-soft text-status-ai border-status-ai/20",
    pending:  "bg-status-review-soft text-status-review border-status-review/25",
    executed: "bg-status-executed-soft text-status-executed border-status-executed/25",
    failed:   "bg-status-failed-soft text-status-failed border-status-failed/25",
    closed:   "bg-status-closed-soft text-status-closed border-status-closed/20",
  };
  return map[status];
}

function TimelineCard({ item, selected }: { item: TimelineItem; selected: boolean }) {
  const { select } = useSupervisor();
  const meta = typeMeta[item.type];
  const tone = toneClasses(meta.tone);
  const EIcon = item.eventKind ? eventIcon(undefined) : meta.Icon;
  const Icon = item.eventKind
    ? eventIcon(item.eventKind ? undefined : undefined)
    : meta.Icon;
  const ResolvedIcon = item.eventKind
    ? eventIcon((["credit-card","truck","flame","wallet","shield-alert","package-x","message-circle","package-check","life-buoy","megaphone","check-circle"] as const).find(k =>
        // map from EVENT_META icon values indirectly
        false
      ) || (
        {
          payment_failed: "credit-card",
          shipment_delayed: "truck",
          angry_customer: "flame",
          refund_requested: "wallet",
          chargeback_threat: "shield-alert",
          wrong_item: "package-x",
          customer_followup: "message-circle",
          delivery_completed: "package-check",
          support_contact: "life-buoy",
          logistics_notified: "megaphone",
          order_resolved: "check-circle",
        } as Record<string, string>
      )[item.eventKind])
    : meta.Icon;

  // Silence unused
  void EIcon; void Icon;

  return (
    <button
      onClick={() => select(item.id)}
      className={cn(
        "group relative w-full text-left rounded-2xl border bg-surface p-4 transition-all",
        "hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5",
        selected
          ? "border-primary/40 shadow-[var(--shadow-lift)] ring-2 ring-primary/15"
          : "border-border shadow-[var(--shadow-soft)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            tone.bg,
            tone.text,
            tone.border
          )}
        >
          <ResolvedIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-[11px] font-medium uppercase tracking-wider", tone.text)}>
              {meta.label}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground">
              {format(item.ts, "HH:mm")}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.ts, { addSuffix: true })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <h4 className="truncate font-semibold text-foreground">{item.title}</h4>
            <Badge
              variant="outline"
              className={cn("border font-normal", statusPill(item.status))}
            >
              {statusLabel[item.status]}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
          {item.decision && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className="h-3.5 w-3.5" />
              <span>
                Confidence{" "}
                <span className="font-medium text-foreground">
                  {(item.decision.confidence * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          )}
        </div>
        <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

export function Timeline() {
  const { state } = useSupervisor();
  const items = [...state.items].sort((a, b) => a.ts - b.ts);
  const processing = state.processingEventId;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-1 pb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Order Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Chronological view of everything that happened to this order.
          </p>
        </div>
        {processing && (
          <div className="flex items-center gap-2 rounded-full border border-status-ai/25 bg-status-ai-soft px-3 py-1.5 text-xs font-medium text-status-ai animate-fade-in">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            AI Supervisor is thinking…
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 pr-2">
        <ol className="relative space-y-3 pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" aria-hidden />
          {items.map((it) => (
            <li key={it.id} className="relative animate-fade-in">
              <div
                className={cn(
                  "absolute -left-4 top-6 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                  it.status === "pending" ? "bg-status-review" :
                  it.status === "executed" ? "bg-status-executed" :
                  it.status === "failed" ? "bg-status-failed" :
                  it.status === "active" ? "bg-status-ai" : "bg-status-closed"
                )}
              />
              <TimelineCard item={it} selected={state.selectedId === it.id} />
            </li>
          ))}
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Clock className="h-8 w-8 opacity-40" />
              <p className="text-sm">No events yet. Inject one to start the demo.</p>
            </div>
          )}
        </ol>
      </ScrollArea>
      <div className="flex items-center gap-2 pt-3 text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        Click any card to open the AI inspector on the right.
      </div>
    </div>
  );
}
