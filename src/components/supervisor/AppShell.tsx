import { useMemo } from "react";
import { format } from "date-fns";
import {
  Activity,
  Bot,
  Sparkles,
  Radio,
  UserCheck,
  ShieldCheck,
  BarChart3,
  FileClock,
  Settings2,
  Package,
  ArrowRight,
} from "lucide-react";
import { SupervisorProvider, useSupervisor } from "@/lib/supervisor-store";
import { Timeline } from "./Timeline";
import { LLMInspector } from "./LLMInspector";
import { ReviewQueue } from "./ReviewQueue";
import { ConfigPanel } from "./ConfigPanel";
import { AnalyticsDashboard } from "./Analytics";
import { AuditTrail } from "./AuditTrail";
import { EventInjector } from "./EventInjector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function OrderHeader() {
  const { state } = useSupervisor();
  const { order } = state;
  const pending = state.items.filter((i) => i.type === "review" && i.status === "pending").length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{order.id}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
            <span className="font-medium">{order.customer}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            ₹{order.total.toLocaleString("en-IN")} · {order.items}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {pending > 0 && (
          <Badge variant="outline" className="bg-status-review-soft text-status-review border-status-review/25 gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            {pending} awaiting review
          </Badge>
        )}
        <EventInjector />
      </div>
    </div>
  );
}

function LiveFeed() {
  const { state, select } = useSupervisor();

  const feed = useMemo(() => {
    return [...state.items]
      .filter((i) => i.type === "event" || i.type === "ai_decision" || i.type === "execution" || i.type === "review")
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 12);
  }, [state.items]);

  const events = feed.filter((i) => i.type === "event");
  const actions = feed.filter((i) => i.type !== "event");

  const Row = ({ item, tone }: { item: typeof feed[number]; tone: string }) => (
    <button
      onClick={() => select(item.id)}
      className={cn(
        "flex w-full items-start gap-2 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:bg-accent/50",
        state.selectedId === item.id && "border-primary/30 bg-primary/5"
      )}
    >
      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full bg-status-${tone}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.title}</div>
        <div className="text-[11px] text-muted-foreground">{format(item.ts, "HH:mm:ss")}</div>
      </div>
    </button>
  );

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-4 w-4 text-status-executed" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-status-executed animate-pulse" />
          </div>
          <h3 className="font-medium text-sm">Live feed</h3>
        </div>
        <span className="text-xs text-muted-foreground">Latest 12</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="p-3">
          <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3 w-3" /> Events
          </div>
          <div className="space-y-1">
            {events.slice(0, 6).map((e) => <Row key={e.id} item={e} tone="event" />)}
            {events.length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">No events yet.</p>
            )}
          </div>
        </div>
        <div className="p-3">
          <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" /> AI Actions
          </div>
          <div className="space-y-1">
            {actions.slice(0, 6).map((a) => (
              <Row key={a.id} item={a}
                tone={a.type === "review" ? "review" : a.type === "execution" ? "executed" : "ai"} />
            ))}
            {actions.length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">Nothing to do yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <SupervisorProvider>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">Sagepilot Order Supervisor</div>
                <div className="text-[11px] text-muted-foreground">AI operations dashboard</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-status-executed/20 bg-status-executed-soft px-3 py-1 text-xs font-medium text-status-executed md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-status-executed animate-pulse" />
              Supervisor online
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-5 md:px-6">
          <OrderHeader />

          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 md:w-auto md:inline-grid">
              <TabsTrigger value="timeline" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <FileClock className="h-4 w-4" />
                <span className="hidden sm:inline">Audit</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-0">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-4">
                  <LiveFeed />
                  <div className="h-[720px] rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
                    <Timeline />
                  </div>
                </div>
                <div className="h-[720px] lg:sticky lg:top-20">
                  <LLMInspector />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="h-[720px] rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
                  <ReviewQueue />
                </div>
                <div className="h-[720px]">
                  <LLMInspector />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <AnalyticsDashboard />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="audit" className="mt-0">
              <div className="h-[720px]">
                <AuditTrail />
              </div>
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <ConfigPanel />
            </TabsContent>
          </Tabs>

          <footer className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Frontend prototype · simulated data
            </div>
            <div>Every AI decision is recorded for transparency.</div>
          </footer>
        </main>
      </div>
    </SupervisorProvider>
  );
}
