import { useMemo } from "react";
import { format } from "date-fns";
import { Download, FileClock, Bot, User, Settings, ShoppingBag } from "lucide-react";
import { useSupervisor } from "@/lib/supervisor-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { AuditRecord } from "@/lib/supervisor-types";

function actorIcon(a: AuditRecord["actor"]) {
  switch (a) {
    case "AI Supervisor": return Bot;
    case "Human Reviewer": return User;
    case "Customer": return ShoppingBag;
    default: return Settings;
  }
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    active:   "bg-status-ai-soft text-status-ai border-status-ai/20",
    pending:  "bg-status-review-soft text-status-review border-status-review/25",
    executed: "bg-status-executed-soft text-status-executed border-status-executed/25",
    failed:   "bg-status-failed-soft text-status-failed border-status-failed/25",
    closed:   "bg-status-closed-soft text-status-closed border-status-closed/20",
  };
  return map[status] ?? map.closed;
}

export function AuditTrail() {
  const { state } = useSupervisor();
  const records = useMemo(
    () => [...state.audit].sort((a, b) => b.ts - a.ts),
    [state.audit]
  );

  const exportCsv = () => {
    const header = ["timestamp", "actor", "action", "reasoning", "status"];
    const rows = records.map((r) => [
      new Date(r.ts).toISOString(),
      r.actor,
      r.action.replace(/"/g, '""'),
      r.reasoning.replace(/"/g, '""'),
      r.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${state.order.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <FileClock className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Audit trail</h2>
            <p className="text-sm text-muted-foreground">
              Every action taken during this order's lifecycle.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Actor</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Reasoning</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const Icon = actorIcon(r.actor);
                return (
                  <tr key={r.id} className={i % 2 ? "bg-surface" : "bg-surface-muted/30"}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">
                      {format(r.ts, "HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{r.actor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.reasoning}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`border font-normal capitalize ${statusPill(r.status)}`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No audit records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
