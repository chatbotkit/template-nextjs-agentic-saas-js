# Agentic SaaS Template for Next.js / ChatBotKit / JS

A production-ready agentic SaaS template where your customers sign up, connect their integrations, and an AI agent works for them continuously. Built with Next.js, ChatBotKit SDK, next-auth, Stripe, and shadcn/ui.

> **Note:** This template is deliberately bare-bones. It provides the minimal structure and wiring needed to get a working app, intentionally leaving styling, layout, and architectural choices open so you can build on top without fighting existing opinions.

## Why ChatBotKit?

Building an AI-powered product typically means sourcing models, a conversation layer, background processing, storage, a tested abilities catalogue, authentication, security, monitoring, and more from separate systems. The cost adds up fast - not just in money, but in engineering time.

ChatBotKit brings all of this into one platform. This template gets you started with a working SaaS app that connects to a single API for managed bots, conversation persistence, secret management, streaming, and more - so you can focus on your product.

## Features

- **Google OAuth** authentication via next-auth
- **Stripe billing** with subscriptions, trials, and billing portal
- **Single-purpose agent** configured once on ChatBotKit, served to all customers
- **Auto-discovered connections** that detect which integrations the agent needs
- **OAuth integration flows** that let customers authenticate with required services
- **Chat interface** for direct interaction with the agent
- **Conversation history** with sidebar navigation and message persistence
- **Responsive design** using shadcn/ui and Tailwind CSS

## Technology Stack

| Layer          | Technology                     |
| -------------- | ------------------------------ |
| Framework      | Next.js (App Router)           |
| AI Platform    | ChatBotKit SDK                 |
| Authentication | next-auth (Google OAuth)       |
| Billing        | Stripe (subscriptions + trial) |
| UI             | shadcn/ui + Tailwind CSS       |
| Language       | JavaScript / JSX               |

## Setup

### 1. Clone and install

```bash
npx create-next-app@latest my-agentic-saas --example https://github.com/chatbotkit/cbk-platform/tree/master/templates/template-nextjs-agentic-saas-js
cd my-agentic-saas
npm install
```

### 2. Configure ChatBotKit

1. Create an account at [chatbotkit.com](https://chatbotkit.com)
2. Create a bot with the desired backstory, model, skills, and datasets
3. If your bot uses abilities that require secrets (e.g., Google Calendar, Slack), configure those secrets on the platform
4. Generate an API token from [chatbotkit.com/tokens](https://chatbotkit.com/tokens)

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI

### 4. Configure Stripe (optional)

1. Get your secret key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Create subscription products/prices
3. Optionally set up a webhook for real-time billing updates

### 5. Set environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### 6. Run

```bash
npm run dev
```

## Environment Variables

| Variable                | Required | Description                                                 |
| ----------------------- | -------- | ----------------------------------------------------------- |
| `CHATBOTKIT_API_SECRET` | Yes      | API token from chatbotkit.com/tokens                        |
| `CHATBOTKIT_BOT_ID`     | Yes      | The bot ID that powers your agent                           |
| `NEXTAUTH_SECRET`       | Yes      | Random string for session encryption                        |
| `NEXTAUTH_URL`          | Yes      | App URL (e.g., `http://localhost:3000`)                     |
| `GOOGLE_CLIENT_ID`      | Yes      | Google OAuth client ID                                      |
| `GOOGLE_CLIENT_SECRET`  | Yes      | Google OAuth client secret                                  |
| `STRIPE_SECRET_KEY`     | No       | Stripe secret key (enables billing)                         |
| `STRIPE_PRICE_MONTHLY`  | No       | Stripe monthly price ID                                     |
| `STRIPE_PRICE_YEARLY`   | No       | Stripe yearly price ID                                      |
| `STRIPE_TRIAL_DAYS`     | No       | Trial period in days (default: 14)                          |
| `STRIPE_WEBHOOK_SECRET` | No       | Stripe webhook signing secret                               |
| `BILLING_REQUIRED`      | No       | Set to `true` to block access when Stripe is not configured |

### Setting Up ChatBotKit

1. Sign up or log in at [chatbotkit.com](https://chatbotkit.com)
2. Go to [chatbotkit.com/tokens](https://chatbotkit.com/tokens) and create an API token
3. Create a new bot and configure it with:
   - A **backstory** describing the agent's role and behavior
   - A **skillset** with the abilities your agent needs (e.g., Gmail, Google Calendar, Slack)
   - Any **datasets** for grounding the agent's knowledge
4. Copy the API token to `CHATBOTKIT_API_SECRET` and the bot ID to `CHATBOTKIT_BOT_ID` in your `.env` file

The app auto-discovers which connections (personal secrets) the bot's abilities require and prompts each user to authenticate them.

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set authorized redirect URI to `http://localhost:3000/api/auth/callback/google`
4. Copy the Client ID and Client Secret to your `.env` file

### Generating a NextAuth Secret

Run the following command and paste the output into your `.env` file:

```bash
openssl rand -base64 32
```

### Stripe Setup (Optional)

1. Create a [Stripe](https://stripe.com) account and get your secret key from the dashboard
2. Create monthly and yearly price objects in Stripe and copy their IDs
3. Set up a webhook endpoint at `https://your-domain.com/api/stripe/webhook` listening for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` events
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## How It Works

### Architecture

1. **Authentication** - Users sign in via Google OAuth. Unauthenticated users are redirected to `/auth/signin`.
2. **Billing Gate** - Users without an active subscription are redirected to `/billing` for Stripe checkout.
3. **Contact Resolution** - On first load, the user's email generates a deterministic contact on ChatBotKit.
4. **Connection Discovery** - The connections page automatically discovers which integrations the bot requires by querying the platform for available secrets.
5. **OAuth Flows** - Customers click "Connect" to authenticate with each service via OAuth popup.
6. **Agent Activation** - Once all required connections are authenticated, the agent starts working automatically using the connected services.
7. **Chat Interface** - Customers can also interact with the agent directly through the chat interface.
8. **Persistence** - Conversations are saved server-side and accessible via the history sidebar.

### User Flow

```
Sign In -> Billing -> Connections (setup) -> Agent Active -> Chat
```

### Stripe SaaS Billing Flow

1. When Stripe is not configured, all authenticated users get access by default. Set `BILLING_REQUIRED=true` to block access until Stripe is set up.
2. When Stripe is configured, users without an active or trialing subscription are redirected to `/billing`.
3. The billing page creates Stripe Checkout sessions in subscription mode with an optional free trial (`STRIPE_TRIAL_DAYS`, defaults to 14).
4. Returning subscribers can manage plans and cancellations through the Stripe Billing Portal.
5. A webhook at `/api/stripe/webhook` listens for subscription lifecycle events and revalidates cached pages so access changes take effect immediately.

## Project Structure

```
├── actions/
│   ├── billing.js           # Stripe checkout and portal actions
│   ├── connections.js        # Connection discovery and revocation
│   └── conversation.jsx      # Chat streaming and message persistence
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth API route
│   │   └── stripe/webhook/      # Stripe webhook handler
│   ├── auth/signin/          # Sign-in page
│   ├── billing/              # Subscription management
│   ├── chat/                 # Chat interface with agent
│   ├── connections/          # Integration management dashboard
│   ├── layout.jsx            # Root layout with providers
│   └── page.jsx              # Root redirect
├── components/
│   ├── chat/
│   │   ├── chat-area.jsx             # Chat message area with scroll
│   │   ├── chat-header.jsx           # Header with nav and user menu
│   │   ├── chat-input.jsx            # Message input field
│   │   ├── chat-messages.jsx         # Message list rendering
│   │   ├── conversation-provider.jsx # Shared conversation state (context)
│   │   └── conversation-sidebar.jsx  # Conversation history sidebar
│   ├── connections/          # Connection list components
│   ├── ui/                   # shadcn/ui primitives
│   └── providers.jsx         # NextAuth session provider
├── hooks/
│   └── useAutoRevert.js      # Auto-revert state hook
├── lib/
│   ├── auth-options.js       # NextAuth configuration
│   ├── billing.js            # Stripe billing utilities
│   ├── chatbotkit.js         # ChatBotKit SDK client
│   ├── contact.js            # Deterministic contact fingerprinting
│   ├── session.js            # Auth + billing session helper
│   ├── stripe.js             # Stripe client singleton
│   └── utils.js              # Tailwind merge utility
└── middleware.ts              # Auth middleware for protected routes
```

## Customization

### Changing the Agent

Update `CHATBOTKIT_BOT_ID` in your environment to point to a different bot. The bot's skills, datasets, and required secrets determine which connections appear on the connections page.

### Adding More Auth Providers

Edit `lib/auth-options.js` to add GitHub, email/password, or other providers supported by next-auth.

### Customizing the UI

All UI components use shadcn/ui and Tailwind CSS. Edit `app/globals.css` for theme variables, or modify individual components in `components/`.

### Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Set all environment variables in the Vercel dashboard.

## Learn More

- [ChatBotKit Documentation](https://chatbotkit.com/docs)
- [ChatBotKit SDK](https://github.com/chatbotkit/node-sdk)
- [Next.js Documentation](https://nextjs.org/docs)
- [next-auth Documentation](https://next-auth.js.org)
- [Stripe Documentation](https://docs.stripe.com)
- [shadcn/ui](https://ui.shadcn.com)
