# Sagepilot: AI Order Supervisor Dashboard

> ### 👀 Psst... before you read all this
> **Your AI coworker is already on the job.** Click below to watch it handle angry customers, failed payments, and shipping disasters without breaking a sweat.
>
> [![Live Demo](https://img.shields.io/badge/🚀%20See%20it%20Live-Click%20Here-orange?style=for-the-badge)](https://sagepilot-order-supervisor.pages.dev)
>
> *No sign-up. No install. Just vibes and AI.* ✨

---

Sagepilot is an interactive high-fidelity frontend prototype of an AI-assisted operations cockpit. Designed for customer support and order operations teams, Sagepilot demonstrates how AI agent exception handling can be combined with human-in-the-loop oversight to manage order lifecycle exceptions (e.g., payment failures, shipment delays, refund approvals) with complete transparency.

---

## 📖 Problem Statement
Modern customer support and order operations teams handle thousands of anomalies daily. Rule-based automation struggles with complex, multi-variable edge cases, while fully manual workflows create severe operational bottlenecks. 

Furthermore, existing AI solutions often operate as "black boxes," preventing human operators from understanding, trust-auditing, or correcting AI decisions. Sagepilot bridges this gap by creating a human-in-the-loop interface that highlights exactly what context the AI evaluated, why it proposed an action, its confidence level, and when it requires human approval.

---

## ✨ Key Features

### 1. Interactive Exception Injection
* **Simulated Exception Lifecycle**: Instantly inject common order exception events (e.g. payment failed, angry customer, chargeback threat, wrong item delivered).
* **Live Feed & Time Travel Timeline**: Follows the sequential lifecycle from initial event trigger, through AI reasoning, down to the final system execution or human intervention card.

### 2. Observable AI Inspector
* **System Prompt View**: Inspect the context payload (Current Event, Order State, Memory Summary, operational Policies, and Output Schema).
* **Transparent Reasoning**: Read raw AI responses and confidence ratings explaining the proposed resolutions.
* **Message Preview**: Verify context-specific outbound email, WhatsApp, or Slack communications before dispatch.

### 3. Human-in-the-Loop Queue
* **Manual Approvals**: High-risk actions (such as high-value refunds or potential disputes) are flagged and held in a review queue until explicitly approved or rejected by an operator.

### 4. Interactive Configuration & Analytics
* **Operational Rules**: Configure auto-approval refund thresholds and AI model parameters (temperature) dynamically.
* **Hourly Trend Metrics**: View interactive graphs mapping escalation trends and hourly exceptions.
* **Audit Trails**: Inspect a transparent, chronological record of every system action and human decision.

---

## 🛠️ Technology Stack
* **Frontend Library**: React 19 + TypeScript
* **State Management**: Context-based custom reducer store for fully reactive state updates
* **Routing**: TanStack Router / TanStack Start
* **Styling**: Tailwind CSS v4 + custom scrollbar utilities for smooth UX
* **Charts**: Recharts (fully customized intervals and axes)
* **Icons**: Lucide React
* **Deployment**: Cloudflare Pages + Workers (SSR via Nitro with cloudflare-module preset)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and Bun (or npm) installed on your system.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Sagepilot_Order_Supervisor.git
   cd Sagepilot_Order_Supervisor
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

### Development
Start the local development server:
   ```bash
   bun run dev
   # or
   npm run dev
   ```
Open `http://localhost:3000` in your browser to view the interactive dashboard.

### Build
To compile the production build:
   ```bash
   bun run build
   # or
   npm run build
   ```

---

## 🎨 Design System & Aesthetics
* **Color System**: Clean, premium HSL-tailored palette supporting light and dark modes. Uses soft semantic color indicators (Green for executed, Amber for pending review, Red for failures).
* **Micro-interactions**: Auto-hiding horizontal scrollbars on multi-column layouts, rotating chevron states, and spring-loaded slide down containers for invoice details.
