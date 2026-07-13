import { Settings2, Sliders, ShieldCheck, Timer, Thermometer, FlaskConical } from "lucide-react";
import { useSupervisor } from "@/lib/supervisor-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Row({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Sliders;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{hint}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ConfigPanel() {
  const { state, updateConfig } = useSupervisor();
  const c = state.config;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Settings2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Fine-tune how the AI Supervisor makes and escalates decisions.
          </p>
        </div>
      </div>

      {/* Row 1: Refund threshold + Escalation sensitivity */}
      <div className="grid grid-cols-2 gap-4">
        <Row
          icon={Sliders}
          title="Refund auto-approval threshold"
          hint="Refunds at or below this amount are approved automatically. Larger refunds route to human review."
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">₹500</span>
            <span className="font-mono text-lg font-semibold">₹{c.refundThreshold.toLocaleString("en-IN")}</span>
            <span className="text-sm text-muted-foreground">₹10,000</span>
          </div>
          <Slider
            className="mt-3"
            value={[c.refundThreshold]}
            min={500}
            max={10000}
            step={100}
            onValueChange={([v]) => updateConfig({ refundThreshold: v })}
          />
        </Row>

        <Row
          icon={ShieldCheck}
          title="Escalation sensitivity"
          hint="How eagerly the AI hands off to a human for grey-area decisions."
        >
          <RadioGroup
            value={c.escalation}
            onValueChange={(v) => updateConfig({ escalation: v as "low" | "medium" | "high" })}
            className="grid grid-cols-3 gap-2"
          >
            {(["low", "medium", "high"] as const).map((v) => (
              <label
                key={v}
                className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm capitalize transition-colors ${
                  c.escalation === v
                    ? "border-primary/50 bg-primary/5 text-foreground"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <RadioGroupItem value={v} className="sr-only" />
                {v}
              </label>
            ))}
          </RadioGroup>
        </Row>
      </div>

      {/* Row 2: Wake interval + LLM temperature */}
      <div className="grid grid-cols-2 gap-4">
        <Row
          icon={Timer}
          title="Scheduled wake interval"
          hint="How often the AI proactively checks orders when nothing has happened."
        >
          <div className="grid grid-cols-4 gap-2">
            {([4, 8, 12, 24] as const).map((v) => (
              <button
                key={v}
                onClick={() => updateConfig({ wakeInterval: v })}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  c.wakeInterval === v
                    ? "border-primary/50 bg-primary/5 text-foreground font-medium"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                {v}h
              </button>
            ))}
          </div>
        </Row>

        <Row
          icon={Thermometer}
          title="LLM temperature"
          hint="Lower is more deterministic; higher gives the AI more creative latitude."
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">0.0</span>
            <span className="font-mono text-lg font-semibold">{c.temperature.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">1.0</span>
          </div>
          <Slider
            className="mt-3"
            value={[c.temperature]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={([v]) => updateConfig({ temperature: v })}
          />
        </Row>
      </div>

      {/* Row 3: Test scenario: full width */}
      <Row
        icon={FlaskConical}
        title="Test scenario"
        hint="Preloaded edge cases you can run against the current order."
      >
        <Select value={c.scenario} onValueChange={(v) => updateConfig({ scenario: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (payment retry & delay)</SelectItem>
            <SelectItem value="chargeback">Aggressive chargeback threat</SelectItem>
            <SelectItem value="wrong_item">Wrong item + partial refund</SelectItem>
            <SelectItem value="vip">VIP customer, high-value refund</SelectItem>
            <SelectItem value="stalled">Stalled shipment (5 days)</SelectItem>
          </SelectContent>
        </Select>
      </Row>
    </div>
  );
}
