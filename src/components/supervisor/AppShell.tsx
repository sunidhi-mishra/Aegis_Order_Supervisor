import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  Bot,
  Zap,
  Radio,
  UserCheck,
  ShieldCheck,
  BarChart3,
  FileClock,
  Settings2,
  Package,
  ArrowRight,
  ChevronDown,
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
  const [isExpanded, setIsExpanded] = useState(false);
  const pending = state.items.filter((i) => i.type === "review" && i.status === "pending").length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Clickable summary block */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-left transition-all hover:opacity-85 group cursor-pointer focus:outline-none"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-[1.03]">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{order.id}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
              <span className="font-medium text-foreground">{order.customer}</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground/60 transition-transform duration-300", isExpanded && "rotate-180")} />
            </div>
            <div className="text-xs text-muted-foreground">
              ₹{order.total.toLocaleString("en-IN")} · {order.items}
            </div>
          </div>
        </button>

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

      {isExpanded && (
        <div className="mt-4 border-t border-border pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Main Grid split by vertical border on desktop */}
          <div className="grid gap-8 md:grid-cols-2 md:divide-x md:divide-border">
            
            {/* Left Column: Customer Profile & Order Specification */}
            <div className="space-y-6 md:pr-4">
              {/* Customer Profile */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Customer Profile</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">aditi.sharma@example.com</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium text-foreground">+91 98765 43210</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">New Delhi, India</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Segment</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-status-review">
                      <span className="h-1.5 w-1.5 rounded-full bg-status-review" />
                      Gold Loyalty Member
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* Order Specification */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Order Specification</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Channel</span>
                    <span className="font-medium text-foreground">Web Store</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Courier partner</span>
                    <span className="font-medium text-foreground">BlueDart Express</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Shipping address</span>
                    <span className="font-medium text-foreground">12 Connaught Place, New Delhi</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Order date & time</span>
                    <span className="font-medium text-foreground">12 Jul 2026, 4:42 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Payment method</span>
                    <span className="font-medium text-foreground">UPI</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Expected delivery</span>
                    <span className="font-medium text-foreground">15 Jul 2026</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tracking number</span>
                    <span className="font-medium text-foreground">BD48213097IN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Price Distribution & Cost Summary */}
            <div className="space-y-6 md:pl-8">
              {/* Price Distribution Grid Box */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Price Distribution</h4>
                <div className="grid grid-cols-2 rounded-xl border border-border bg-surface-muted/10 divide-x divide-border">
                  <div className="p-4">
                    <div className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Total Items</div>
                    <div className="text-lg font-bold text-foreground mt-1">2 Units</div>
                  </div>
                  <div className="p-4">
                    <div className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Avg. Item Value</div>
                    <div className="text-lg font-bold text-foreground mt-1">₹1,740.00</div>
                  </div>
                </div>
              </div>

              {/* Cost Summary (Capsules & Detailed Totals) */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Cost Summary</h4>
                
                {/* Item Capsules */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 rounded-xl border border-border/80 bg-surface hover:bg-surface-muted/20 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-primary/5 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                        1x
                      </span>
                      <span className="text-sm font-medium text-foreground">Wireless Headphones</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">₹2,499</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl border border-border/80 bg-surface hover:bg-surface-muted/20 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-primary/5 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                        1x
                      </span>
                      <span className="text-sm font-medium text-foreground">Phone Case</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">₹981</span>
                  </div>
                </div>

                {/* Final Cost Summary totals box */}
                <div className="rounded-xl border border-border bg-surface-muted/10 p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">₹3,480.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18% included)</span>
                    <span className="font-medium text-foreground">₹530.85</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping & delivery</span>
                    <span className="text-status-executed font-bold text-xs uppercase tracking-wider">Free</span>
                  </div>
                  
                  <hr className="border-border/60 my-1" />
                  
                  <div className="flex justify-between text-base font-bold text-foreground">
                    <span>Grand total</span>
                    <span>₹3,480.00</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
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
        {/* Events column */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-status-event-soft text-status-event">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Events</div>
                <div className="text-xs text-muted-foreground">Things that happened to the order</div>
              </div>
            </div>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
              {events.length}
            </span>
          </div>
          <div className="space-y-1">
            {events.slice(0, 6).map((e) => <Row key={e.id} item={e} tone="event" />)}
            {events.length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">No events yet.</p>
            )}
          </div>
        </div>
        {/* Actions column */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-status-ai-soft text-status-ai">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Actions</div>
                <div className="text-xs text-muted-foreground">What the AI or human decided to do</div>
              </div>
            </div>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
              {actions.length}
            </span>
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
