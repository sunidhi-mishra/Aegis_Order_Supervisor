export type EventKind =
  | "payment_failed"
  | "shipment_delayed"
  | "angry_customer"
  | "refund_requested"
  | "chargeback_threat"
  | "wrong_item"
  | "customer_followup"
  | "delivery_completed"
  | "support_contact"
  | "logistics_notified"
  | "order_resolved";

export type ItemType =
  | "event"           // Customer / system event
  | "ai_reasoning"    // AI thinking
  | "ai_decision"     // AI proposed tool
  | "review"          // Awaiting human review
  | "execution"       // Executed action
  | "completed"       // Closed step
  | "note";           // Internal note

export type Channel = "whatsapp" | "email" | "slack";

export type ToolName =
  | "notify_customer"
  | "issue_refund"
  | "escalate_to_human"
  | "notify_logistics"
  | "create_internal_note"
  | "close_ticket";

export interface Message {
  channel: Channel;
  to: string;
  from?: string;
  subject?: string;
  body: string;
}

export interface AIDecision {
  tool: ToolName;
  reasoning: string;
  confidence: number; // 0-1
  message?: Message;
  amount?: number;
  needsReview: boolean;
}

export interface LLMTrace {
  promptEvent: string;
  orderState: string;
  memory: string;
  policies: string[];
  schema: string;
  rawResponse: string;
  inputTokens: number;
  outputTokens: number;
}

export type ItemStatus = "active" | "pending" | "executed" | "failed" | "closed";

export interface TimelineItem {
  id: string;
  ts: number;
  type: ItemType;
  status: ItemStatus;
  title: string;
  description: string;
  eventKind?: EventKind;
  decision?: AIDecision;
  trace?: LLMTrace;
  reviewed?: "approved" | "modified" | "declined" | "overridden";
  linkedId?: string; // links execution back to decision
}

export interface AuditRecord {
  id: string;
  ts: number;
  actor: "AI Supervisor" | "Human Reviewer" | "System" | "Customer";
  action: string;
  reasoning: string;
  status: ItemStatus;
}

export interface Config {
  refundThreshold: number; // 500 - 10000
  escalation: "low" | "medium" | "high";
  wakeInterval: 4 | 8 | 12 | 24;
  temperature: number; // 0 - 1
  scenario: string;
}

export const EVENT_META: Record<
  EventKind,
  { label: string; icon: string; description: string }
> = {
  payment_failed:      { label: "Payment Failed",       icon: "credit-card",   description: "Customer's payment did not go through" },
  shipment_delayed:    { label: "Shipment Delayed",     icon: "truck",         description: "Courier reported a delay" },
  angry_customer:      { label: "Angry Customer",       icon: "flame",         description: "Escalated tone detected on support" },
  refund_requested:    { label: "Refund Requested",     icon: "wallet",        description: "Customer asked for a refund" },
  chargeback_threat:   { label: "Chargeback Threat",    icon: "shield-alert",  description: "Customer mentioned chargeback" },
  wrong_item:          { label: "Wrong Item Delivered", icon: "package-x",     description: "Delivered item does not match order" },
  customer_followup:   { label: "Customer Follow-up",   icon: "message-circle",description: "Customer replied with an update" },
  delivery_completed:  { label: "Delivery Completed",   icon: "package-check", description: "Parcel delivered successfully" },
  support_contact:     { label: "Support Contact",      icon: "life-buoy",     description: "Customer contacted support" },
  logistics_notified:  { label: "Logistics Notified",   icon: "megaphone",     description: "Ops team informed about issue" },
  order_resolved:      { label: "Order Resolved",       icon: "check-circle",  description: "Case closed successfully" },
};

export const TOOL_META: Record<ToolName, { label: string; icon: string }> = {
  notify_customer:     { label: "Notify Customer",       icon: "send" },
  issue_refund:        { label: "Issue Refund",          icon: "wallet" },
  escalate_to_human:   { label: "Escalate for Review",   icon: "user-check" },
  notify_logistics:    { label: "Notify Logistics",      icon: "truck" },
  create_internal_note:{ label: "Create Internal Note",  icon: "sticky-note" },
  close_ticket:        { label: "Close Ticket",          icon: "check-circle" },
};
