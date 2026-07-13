import { useState } from "react";
import { Plus, Sparkles, RotateCcw } from "lucide-react";
import type { EventKind } from "@/lib/supervisor-types";
import { EVENT_META } from "@/lib/supervisor-types";
import { useSupervisor } from "@/lib/supervisor-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const injectable: EventKind[] = [
  "payment_failed",
  "shipment_delayed",
  "angry_customer",
  "refund_requested",
  "chargeback_threat",
  "wrong_item",
  "customer_followup",
  "delivery_completed",
];

export function EventInjector() {
  const { injectEvent, resetDemo } = useSupervisor();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Inject event
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Test scenarios
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {injectable.map((k) => (
            <DropdownMenuItem
              key={k}
              onClick={() => injectEvent(k)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className="font-medium">{EVENT_META[k].label}</span>
              <span className="text-xs text-muted-foreground">
                {EVENT_META[k].description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="ghost" onClick={resetDemo} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Reset demo
      </Button>
    </div>
  );
}
