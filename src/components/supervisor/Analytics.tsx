import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Bot,
  CheckCircle2,
  DollarSign,
  Repeat,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { useSupervisor } from "@/lib/supervisor-store";
import { TOOL_META } from "@/lib/supervisor-types";

function KPI({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Bot;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "ai" | "executed" | "review";
}) {
  const toneClass =
    tone === "ai"
      ? "bg-status-ai-soft text-status-ai"
      : tone === "executed"
      ? "bg-status-executed-soft text-status-executed"
      : tone === "review"
      ? "bg-status-review-soft text-status-review"
      : "bg-accent text-accent-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-0.5 text-2xl font-semibold">{value}</div>
        </div>
      </div>
      {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AnalyticsDashboard() {
  const { state } = useSupervisor();

  const stats = useMemo(() => {
    const items = state.items;
    const decisions = items.filter((i) => !!i.decision);
    const executions = items.filter((i) => i.type === "execution");
    const reviews = items.filter((i) => i.type === "review");
    const approved = reviews.filter((r) => r.reviewed === "approved" || r.reviewed === "modified");
    const overridden = reviews.filter((r) => r.reviewed === "overridden");
    const declined = reviews.filter((r) => r.reviewed === "declined");
    const decidedReviews = approved.length + overridden.length + declined.length;

    const byTool: Record<string, number> = {};
    decisions.forEach((d) => {
      const k = d.decision!.tool;
      byTool[k] = (byTool[k] ?? 0) + 1;
    });
    const toolData = Object.entries(byTool).map(([k, v]) => ({
      name: TOOL_META[k as keyof typeof TOOL_META]?.label ?? k,
      value: v,
    }));

    const humanDecisions = approved.length + overridden.length + declined.length;
    const llmDecisions = Math.max(decisions.length - humanDecisions, 0);
    const splitData = [
      { name: "LLM", value: llmDecisions },
      { name: "Human", value: humanDecisions },
    ];

    // Escalation trend over the last 6 buckets
    const bucketSize = 15 * 60 * 1000;
    const now = Date.now();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const end = now - (5 - i) * bucketSize;
      const start = end - bucketSize;
      const count = items.filter(
        (it) => it.type === "review" && it.ts >= start && it.ts < end
      ).length;
      return {
        name: `-${(5 - i) * 15}m`,
        escalations: count,
      };
    });

    const totalTokens = decisions.reduce(
      (acc, d) => acc + (d.trace?.inputTokens ?? 0) + (d.trace?.outputTokens ?? 0),
      0
    );
    const estCost = decisions.reduce(
      (acc, d) =>
        acc +
        ((d.trace?.inputTokens ?? 0) * 0.000003 + (d.trace?.outputTokens ?? 0) * 0.000015),
      0
    );

    return {
      total: decisions.length,
      executions: executions.length,
      approvalRate: decidedReviews ? approved.length / decidedReviews : 1,
      overrideRate: decidedReviews ? overridden.length / decidedReviews : 0,
      llmDecisions,
      humanDecisions,
      toolData,
      splitData,
      buckets,
      totalTokens,
      estCost,
    };
  }, [state.items]);

  const chartColors = [
    "oklch(0.55 0.15 285)",
    "oklch(0.62 0.13 160)",
    "oklch(0.68 0.15 65)",
    "oklch(0.6 0.13 265)",
    "oklch(0.6 0.2 25)",
    "oklch(0.55 0.02 260)",
  ];

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          A calm summary of how the supervisor is performing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI icon={Zap} label="Total decisions" value={String(stats.total)} tone="ai" />
        <KPI icon={CheckCircle2} label="Executed" value={String(stats.executions)} tone="executed" />
        <KPI
          icon={UserCheck}
          label="Approval rate"
          value={`${(stats.approvalRate * 100).toFixed(0)}%`}
          tone="executed"
        />
        <KPI
          icon={Repeat}
          label="Override rate"
          value={`${(stats.overrideRate * 100).toFixed(0)}%`}
          tone="review"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">Decisions by tool</h3>
            <span className="text-xs text-muted-foreground">Volume</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.toolData} margin={{ left: -10, right: 6, top: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "oklch(0.96 0.008 250)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.toolData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">LLM vs Human decisions</h3>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.splitData} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {stats.splitData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: chartColors[0] }} />
              LLM ({stats.llmDecisions})
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: chartColors[1] }} />
              Human ({stats.humanDecisions})
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">Escalation trend</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.buckets} margin={{ left: -10, right: 6, top: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="escalations"
                  stroke={chartColors[3]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: chartColors[3] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-3">
          <KPI
            icon={Activity}
            label="Decision volume"
            value={String(stats.total)}
            hint="Includes both auto-executed and human-approved decisions."
          />
          <KPI
            icon={DollarSign}
            label="Estimated AI cost"
            value={`$${stats.estCost.toFixed(4)}`}
            hint={`${stats.totalTokens.toLocaleString()} tokens across this order's lifecycle.`}
          />
        </div>
      </div>
    </div>
  );
}
