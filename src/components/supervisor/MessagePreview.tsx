import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/supervisor-types";

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return { copied, copy };
}

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopy();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1.5 px-2 text-xs"
      onClick={() => copy(text)}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function MessagePreview({ message, customer }: { message: Message; customer: string }) {
  if (message.channel === "whatsapp") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-[oklch(0.96_0.03_150)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between bg-[oklch(0.42_0.09_155)] px-4 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
              {customer[0]}
            </div>
            <div>
              <div className="text-sm font-semibold">{customer}</div>
              <div className="text-[10px] opacity-80">online</div>
            </div>
          </div>
          <div className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">WhatsApp</div>
        </div>
        <div className="min-h-[120px] space-y-2 bg-[oklch(0.94_0.02_100)] p-4">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[oklch(0.88_0.09_150)] px-3 py-2 text-sm shadow-sm text-[oklch(0.2_0_0)]">
            {message.body}
            <div className="mt-1 text-right text-[10px] text-[oklch(0.4_0_0)]">just now ✓✓</div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-surface px-3 py-2">
          <span className="text-xs text-muted-foreground">To {message.to}</span>
          <CopyButton text={message.body} />
        </div>
      </div>
    );
  }

  if (message.channel === "email") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
        <div className="border-b border-border bg-surface-muted px-4 py-3">
          <div className="grid grid-cols-[70px_1fr] gap-y-1 text-sm">
            <span className="text-muted-foreground">From</span>
            <span>Order Supervisor &lt;support@company.com&gt;</span>
            <span className="text-muted-foreground">To</span>
            <span>{message.to}</span>
            <span className="text-muted-foreground">Subject</span>
            <span className="font-medium">{message.subject ?? "Update on your order"}</span>
          </div>
        </div>
        <div className="min-h-[120px] whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed">
          {message.body}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-surface-muted px-3 py-2">
          <span className="text-xs text-muted-foreground">Email preview</span>
          <CopyButton text={message.body} />
        </div>
      </div>
    );
  }

  // Slack
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">#</span>
          <span className="font-medium">{message.to.replace(/^#/, "")}</span>
        </div>
        <div className="rounded bg-[oklch(0.55_0.19_290)] px-1.5 py-0.5 text-[10px] text-white">
          Slack
        </div>
      </div>
      <div className="min-h-[120px] space-y-3 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
            AI
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm">Order Supervisor</span>
              <span className="text-[10px] text-muted-foreground">APP</span>
              <span className="text-[10px] text-muted-foreground">just now</span>
            </div>
            <div className={cn(
              "mt-1 rounded-md border-l-4 border-status-review bg-status-review-soft/50 p-3 text-sm"
            )}>
              {message.body}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <button className="hover:underline">Reply in thread</button>
              <button className="hover:underline">Acknowledge</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-surface-muted px-3 py-2">
        <span className="text-xs text-muted-foreground">Slack preview</span>
        <CopyButton text={message.body} />
      </div>
    </div>
  );
}
