import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Check,
  Pencil,
  Repeat2,
  ShieldX,
  UserCheck,
  Wallet,
  Send,
  Truck,
  StickyNote,
  CheckCircle2,
} from "lucide-react";
import { useSupervisor } from "@/lib/supervisor-store";
import type { ToolName } from "@/lib/supervisor-types";
import { TOOL_META } from "@/lib/supervisor-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toolIcon: Record<ToolName, typeof Wallet> = {
  notify_customer: Send,
  issue_refund: Wallet,
  escalate_to_human: UserCheck,
  notify_logistics: Truck,
  create_internal_note: StickyNote,
  close_ticket: CheckCircle2,
};

export function ReviewQueue() {
  const { state, approveReview, declineReview, modifyReview, overrideReview, select } =
    useSupervisor();

  const reviews = useMemo(
    () => state.items.filter((i) => i.type === "review" && i.status === "pending"),
    [state.items]
  );

  const [modifyOpen, setModifyOpen] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [overrideTool, setOverrideTool] = useState<ToolName>("notify_customer");

  const openModify = (id: string, current: string) => {
    setMessageDraft(current);
    setModifyOpen(id);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Human Review Queue</h2>
          <p className="text-sm text-muted-foreground">
            Decisions the AI flagged for human judgement.
          </p>
        </div>
        <Badge variant="outline" className="bg-status-review-soft text-status-review border-status-review/25">
          {reviews.length} pending
        </Badge>
      </div>

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3">
          {reviews.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-10 text-center">
              <Check className="mx-auto h-8 w-8 text-status-executed" />
              <p className="mt-3 font-medium">You're all caught up</p>
              <p className="text-sm text-muted-foreground">
                No decisions currently need a human.
              </p>
            </div>
          )}

          {reviews.map((r) => {
            const d = r.decision!;
            const Icon = toolIcon[d.tool];
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-status-review/25 bg-surface p-5 shadow-[var(--shadow-soft)] animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-review-soft text-status-review">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{TOOL_META[d.tool].label}</h3>
                      <p className="text-xs text-muted-foreground">
                        Proposed {format(r.ts, "HH:mm")} · Order {state.order.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Confidence
                    </div>
                    <div className="text-lg font-semibold text-status-review">
                      {(d.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-xl bg-muted/50 p-3 text-sm">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Situation
                    </div>
                    <p className="mt-1">{r.description}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      AI reasoning
                    </div>
                    <p className="mt-1">{d.reasoning}</p>
                  </div>
                  {d.amount && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Amount
                      </div>
                      <p className="mt-1 font-mono">₹{d.amount.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {d.message && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Proposed message
                      </div>
                      <p className="mt-1 rounded-lg bg-surface px-3 py-2 text-sm">
                        {d.message.body}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => approveReview(r.id)} className="gap-1.5">
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  {d.message && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModify(r.id, d.message!.body)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-4 w-4" /> Modify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOverrideTool(d.tool);
                      setOverrideOpen(r.id);
                    }}
                    className="gap-1.5"
                  >
                    <Repeat2 className="h-4 w-4" /> Override
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => declineReview(r.id)}
                    className="gap-1.5 text-status-failed hover:text-status-failed"
                  >
                    <ShieldX className="h-4 w-4" /> Decline
                  </Button>
                  <div className="ml-auto">
                    <Button size="sm" variant="ghost" onClick={() => select(r.id)}>
                      Inspect →
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!modifyOpen} onOpenChange={(o) => !o && setModifyOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify message before approval</DialogTitle>
          </DialogHeader>
          <Textarea
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            rows={6}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModifyOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (modifyOpen) modifyReview(modifyOpen, messageDraft);
                setModifyOpen(null);
              }}
            >
              Save & approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!overrideOpen} onOpenChange={(o) => !o && setOverrideOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override AI decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a different tool for the AI to execute.
            </p>
            <Select value={overrideTool} onValueChange={(v) => setOverrideTool(v as ToolName)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOOL_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOverrideOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (overrideOpen) overrideReview(overrideOpen, overrideTool);
                setOverrideOpen(null);
              }}
            >
              Override & execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
