import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/supervisor/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sagepilot Order Supervisor: AI operations dashboard" },
      {
        name: "description",
        content:
          "A calm, interactive prototype showing how an AI supervisor monitors orders, proposes actions, and hands off to humans when it matters.",
      },
      { property: "og:title", content: "Sagepilot Order Supervisor: AI operations dashboard" },
      {
        property: "og:description",
        content:
          "Timeline, live feed, human review queue, LLM inspector, analytics, and audit trail for an AI-powered order operations tool.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <AppShell />;
}
