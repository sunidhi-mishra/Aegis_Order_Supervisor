import { Bot, X, Sparkles, Cpu, FileJson, Wrench, Gauge, MessageSquare } from "lucide-react";
import { useSupervisor } from "@/lib/supervisor-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MessagePreview } from "./MessagePreview";
import { TOOL_META } from "@/lib/supervisor-types";
import { cn } from "@/lib/utils";

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Bot; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </section>
  );
}

function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full max-w-[calc(100vw-48px)] lg:max-w-[346px] overflow-x-auto rounded-xl bg-muted/60 custom-scrollbar", className)}>
      <pre className="min-w-max p-3 text-xs font-mono leading-relaxed text-foreground/90 whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

export function LLMInspector() {
  const { state, select } = useSupervisor();
  const item = state.items.find((i) => i.id === state.selectedId) ?? null;

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted p-10 text-center">
        <Bot className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium">AI Inspector</p>
          <p className="text-sm text-muted-foreground">
            Select any timeline card to inspect the AI's reasoning.
          </p>
        </div>
      </div>
    );
  }

  const d = item.decision;
  const t = item.trace;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      <header className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-status-ai">
            <Sparkles className="h-3.5 w-3.5" />
            AI Inspector
          </div>
          <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </p>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => select(null)}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      {d ? (
        <Tabs defaultValue="decision" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-4">
            <TabsTrigger value="decision">Decision</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="response">Raw JSON</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-4 pb-4 pt-3">
            <TabsContent value="decision" className="mt-0 space-y-5">
              <Section title="Parsed decision" icon={Wrench}>
                <div className="rounded-xl border border-border bg-surface-muted p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Selected tool</div>
                      <div className="mt-0.5 font-medium">{TOOL_META[d.tool].label}</div>
                    </div>
                    <Badge className="bg-status-ai-soft text-status-ai border-status-ai/25" variant="outline">
                      {(d.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">Reasoning</div>
                  <p className="mt-1 text-sm">{d.reasoning}</p>
                  {d.amount != null && (
                    <>
                      <div className="mt-3 text-xs text-muted-foreground">Amount</div>
                      <p className="mt-1 font-mono">₹{d.amount.toLocaleString("en-IN")}</p>
                    </>
                  )}
                </div>
              </Section>

              {t && (
                <Section title="Token usage" icon={Gauge}>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-border bg-surface-muted p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Input</div>
                      <div className="mt-1 font-mono text-sm">{t.inputTokens}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Output</div>
                      <div className="mt-1 font-mono text-sm">{t.outputTokens}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">~Cost</div>
                      <div className="mt-1 font-mono text-sm">
                        ${((t.inputTokens * 0.000003 + t.outputTokens * 0.000015)).toFixed(4)}
                      </div>
                    </div>
                  </div>
                </Section>
              )}
            </TabsContent>

            <TabsContent value="prompt" className="mt-0 space-y-5">
              {t && (
                <>
                  <Section title="Current event" icon={Cpu}>
                    <Code>{t.promptEvent}</Code>
                  </Section>
                  <Section title="Order state" icon={FileJson}>
                    <Code>{t.orderState}</Code>
                  </Section>
                  <Section title="Memory summary" icon={Bot}>
                    <Code>{t.memory}</Code>
                  </Section>
                  <Section title="Policies" icon={Wrench}>
                    <div className="w-full max-w-[calc(100vw-48px)] lg:max-w-[346px] overflow-x-auto rounded-xl bg-muted/60 custom-scrollbar">
                      <ul className="min-w-max space-y-1 p-3 text-xs">
                        {t.policies.map((p, i) => (
                          <li key={i} className="flex gap-2 whitespace-nowrap">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Section>
                  <Section title="Output schema" icon={FileJson}>
                    <Code>{t.schema}</Code>
                  </Section>
                </>
              )}
            </TabsContent>

            <TabsContent value="response" className="mt-0">
              {t && (
                <Section title="Raw AI response" icon={FileJson}>
                  <Code>{t.rawResponse}</Code>
                </Section>
              )}
            </TabsContent>

            <TabsContent value="message" className="mt-0">
              {d.message ? (
                <Section title={`${d.message.channel} preview`} icon={MessageSquare}>
                  <MessagePreview message={d.message} customer={state.order.customer} />
                </Section>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No message payload — this decision has no outbound communication.
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      ) : (
        <ScrollArea className="flex-1 p-4">
          <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Event</div>
            <p className="mt-1">{item.description}</p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            This step does not have an AI decision attached — it's a system or human event.
          </p>
        </ScrollArea>
      )}
    </div>
  );
}
