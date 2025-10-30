# LytbuB Supabase Shell

A comprehensive **Multi-Tenant React + Vite** application for AI Business Systems OS, built with **Supabase** for authentication, database, and storage. This enterprise-grade platform features complete **Stripe billing integration**, company-specific data isolation, AI agent orchestration, media generation, webhook automation, and advanced business management tools.

## 🚀 Features

### Core Modules

- **Mission Control**: Central dashboard and analytics
- **Operations Hub**: Job management and task orchestration
- **Financial Nexus**: Invoice management and payment processing
- **AI Lab**: AI agent configuration and management
- **Media Studio**: AI-powered media generation (Image/Video/Audio)
- **Knowledge Library**: Document management and RAG search
- **Compliance Panel**: Security policies, GDPR compliance, and data retention
- **Admin Portal**: Business analytics and client management
- **Admin Settings**: System configuration and webhook management

### AI & Automation

- **Multi-LLM Support**: OpenAI, Claude (Anthropic), and Gemini integration
- **AI Agent Orchestrator**: Task routing and delegation system
- **Media Generation**: AI-powered image, video, and audio creation
- **Webhook Automation**: Zapier and Tasker integration
- **Vector Search**: RAG implementation for document search

### Multi-Tenant Architecture

- **Company Isolation**: Complete data separation between clients
- **Row Level Security**: PostgreSQL RLS policies for secure access
- **Company-Specific Billing**: Individual usage tracking and limits
- **Stripe Customer Portal**: Self-service billing management

### Compliance & Security

- **Security Policies**: Company-specific security configurations
- **IP Access Control**: Restrict login access to approved IP ranges
- **API Key Management**: Encrypted storage with rotation policies
- **GDPR Compliance**: Data export, deletion, and access requests
- **Data Retention**: Automated cleanup of old data with configurable policies
- **Audit Logging**: Comprehensive security event tracking
- **Compliance Requests**: Self-service GDPR/CCPA request management

### Business Tools

- **Client Management**: Multi-company support with admin oversight
- **Invoice System**: Automated invoicing with Stripe integration
- **Job Management**: Company-scoped task creation and tracking
- **Document Management**: Company-specific file organization
- **Payment Processing**: Complete Stripe billing workflow

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- API keys for desired AI providers (optional)

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider APIs (Optional - for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key

# Webhook Configuration (Optional - for automation)
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
VITE_ZAPIER_API_KEY=your_zapier_api_key
VITE_TASKER_WEBHOOK_URL=https://your-tasker-webhook-url
VITE_TASKER_API_KEY=your_tasker_api_key

# Stripe Configuration (Required for billing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_CONFIG_ID=... # From Stripe Customer Portal settings
```

### 3. Database Setup

Run the setup script to create all required tables:

```bash
npm run setup-db
```

This creates the following multi-tenant tables:

- `public.profiles` - User profiles and authentication
- `public.companies` - Client/company management with Stripe customer IDs
- `public.services` - Company-scoped service offerings and billing
- `public.invoices` - Company-specific invoice and payment tracking
- `public.jobs` - Company-scoped task and job management
- `public.documents` - Company-specific document storage and metadata
- `public.media_assets` - Company-scoped AI-generated media storage
- `public.company_config` - Company-specific configuration settings
- `public.company_plans` - Billing plans and usage limits per company
- `public.settings` - Application settings
- `public.ai_agents` - Company-scoped AI agent configurations
- `public.agent_logs` - Company-specific AI interaction logging
- `public.api_usage` - Company-specific API usage tracking
- `public.security_policies` - Company-specific security and compliance policies
- `public.compliance_requests` - GDPR/CCPA compliance request tracking
- `public.data_retention_logs` - Automated data cleanup monitoring
- `public.api_keys` - Encrypted API key storage with rotation tracking
- `public.audit_logs` - Comprehensive security event logging

### 4. Supabase Configuration

1. **Create Storage Buckets:**

   ```bash
   node create_media_bucket.js
   node create_docs_bucket.js
   ```

2. **Set up Authentication:**

   ```bash
   node setup_auth.js
   ```

3. **Deploy Edge Functions:**

   ```bash
   # Deploy Stripe integration functions
   supabase functions deploy stripe-webhook
   supabase functions deploy create-checkout-session
   supabase functions deploy create-stripe-customer
   supabase functions deploy create-customer-portal-session
   ```

4. **Configure Vector Search (Optional):**
   - Run the vector search migration for RAG functionality

### 5. Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

## 📁 Project Structure

```
src/
├── agents/                 # AI agent orchestration system
│   ├── api.ts             # Agent management API
│   ├── llm.ts             # LLM provider integrations
│   ├── orchestrator.ts    # Task routing and delegation
│   └── README.md          # Agent system documentation
├── api/                   # Backend API functions
│   ├── companies.ts       # Company/client management
│   ├── invoices.ts        # Invoice operations
│   ├── services.ts        # Service management
│   ├── mediaAssets.ts     # Media asset management
│   ├── companyConfig.ts   # Configuration management
│   ├── compliance.ts      # Security policies and GDPR compliance
│   ├── security.ts        # API key management and audit logging
│   ├── hooks.ts          # Webhook automation system
│   └── hooks.example.ts  # Integration examples
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── switch.tsx    # Toggle switches
│   │   ├── tabs.tsx      # Tabbed interfaces
│   │   └── ...
│   ├── Auth.tsx          # Authentication component
│   ├── CosmicBackground.tsx # Animated background
│   ├── RadialMenu.tsx    # Navigation menu
│   └── ProtectedRoute.tsx # Route protection
├── context/              # React context providers
│   └── UserContext.tsx   # User authentication context
├── lib/                  # Utility libraries
│   ├── supabaseClient.ts # Supabase client configuration
│   └── utils.ts          # Helper functions
├── pages/                # Page components
│   ├── AdminPortal.tsx   # Admin dashboard
│   ├── AdminSettings.tsx # System configuration
│   ├── Compliance.tsx    # Security policies and GDPR compliance
│   ├── SecurityPanel.tsx # API key management and audit logs
│   ├── MediaStudio.tsx   # AI media generation
│   ├── AiLab.tsx        # AI agent management
│   ├── FinancialNexus.tsx # Financial management
│   ├── OperationsHub.tsx  # Operations dashboard
│   ├── KnowledgeLibrary.tsx # Document management
│   ├── MissionControl.tsx   # Main dashboard
│   └── ...
└── utils/                # Utility functions
    ├── rag.ts           # RAG search implementation
    ├── dataRetentionJob.ts # Automated data cleanup and compliance jobs
    └── ...
```

## 🎨 UI Components

The application uses a custom **Cosmic Theme** with:

- **Cosmic Background**: Animated starfield background
- **Radial Menu**: Circular navigation system
- **shadcn/ui**: Modern, accessible UI components
- **Tailwind CSS**: Utility-first styling
- **Responsive Design**: Mobile-first approach

## 🤖 AI Features

### Agent Orchestration

- **Multi-Provider Support**: OpenAI, Claude, Gemini
- **Task Delegation**: Chief agents can delegate to specialists
- **Role-Based Routing**: Route tasks to appropriate agents
- **Interaction Logging**: Track all AI conversations

### Media Generation

- **Image Generation**: MidJourney/Ideogram integration stubs
- **Video Generation**: HeyGen/Sora integration stubs
- **Audio Generation**: ElevenLabs integration stubs
- **Asset Management**: Save and organize generated media

### Knowledge Library

- **Vector Search**: Semantic search with embeddings
- **Document Upload**: Support for multiple file types
- **RAG Implementation**: Context-aware AI responses

## 🔗 Automation & Webhooks

### Zapier Integration

- Trigger Zaps on business events
- Automate notifications and workflows
- Connect with 5,000+ apps

### Tasker Integration

- Android automation support
- Receive notifications on mobile
- Trigger phone-based automations

### Supported Events

- Client creation
- Invoice creation/overdue
- Job creation/completion
- Document uploads
- Media generation

## 💰 Multi-Tenant Billing & Payment Integration

### Stripe Integration Features

- **Multi-Tenant Customer Management**: Automatic Stripe customer creation per company
- **Company-Specific Billing**: Individual usage tracking and budget limits
- **Stripe Customer Portal**: Self-service billing management for clients
- **Automated Invoice Processing**: Webhook-driven payment status updates
- **Checkout Sessions**: Secure payment processing with company context
- **Usage-Based Billing**: Real-time API usage tracking and limits
- **Plan Management**: Flexible pricing tiers (Starter, Professional, Enterprise, Custom)

### Billing Workflow

1. **Company Creation**: Auto-creates Stripe customer with company metadata
2. **Plan Assignment**: Admins assign billing plans with usage limits
3. **Usage Tracking**: Real-time monitoring of API costs and usage
4. **Invoice Generation**: Automated invoicing with Stripe checkout links
5. **Payment Processing**: Secure webhook-based payment completion
6. **Customer Portal**: Clients manage billing, payments, and subscriptions

### Stripe Webhooks

- **Checkout Session Completion**: Updates invoice status and creates transactions
- **Customer Portal Events**: Handles subscription and payment method changes
- **Company Context**: All webhooks include company_id for proper isolation
- **Security**: Signature verification and company ownership validation

## 🗄️ Database Schema

### Core Tables (Multi-Tenant)

- **profiles**: User authentication and roles with company_id
- **companies**: Client/company management with stripe_customer_id
- **company_plans**: Billing plans and usage limits per company
- **services**: Company-scoped service offerings with billing
- **invoices**: Company-specific invoice tracking and payments
- **jobs**: Company-scoped task and job management
- **documents**: Company-specific file storage and metadata
- **media_assets**: Company-scoped AI-generated media storage
- **company_config**: Company-specific configuration settings
- **api_usage**: Company-specific API usage tracking and costs
- **ai_agents**: Company-scoped AI agent configurations
- **agent_logs**: Company-specific AI interaction logs
- **transactions**: Payment transaction records

### Row Level Security (RLS)

All tables implement comprehensive RLS policies:

- **Admin Access**: Full read/write access to all companies
- **Company Isolation**: Users can only access their company's data
- **Agent Restrictions**: Limited access based on roles
- **Secure Queries**: All queries include company_id validation

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run setup-db     # Run database setup
npm run setup-auth   # Configure authentication
node seed_security_data.js    # Seed security panel data
node seed_compliance_data.js  # Seed compliance policies and data
```

### Key Dependencies

- **React 18**: Frontend framework
- **Vite**: Build tool and dev server
- **Supabase**: Backend as a service
- **Tailwind CSS**: Styling framework
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library

## 🚀 Deployment

### Supabase Deployment

1. Connect your repository to Supabase
2. Deploy edge functions for webhooks
3. Configure environment variables
4. Set up storage buckets

### Environment Variables for Production

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (if using)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_AI_API_KEY=...

# Webhooks (if using)
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/...
VITE_TASKER_WEBHOOK_URL=https://your-tasker-url

# Stripe (Required for multi-tenant billing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_CONFIG_ID=... # Configure in Stripe Customer Portal settings
```

## 📚 Documentation

### Core Systems

- **[Agent System](./src/agents/README.md)**: AI agent orchestration details
- **[Multi-Tenant Architecture](./MULTI_TENANT_README.md)**: Company isolation and RLS
- **[Compliance & Security](./COMPLIANCE_README.md)**: Security policies and GDPR compliance
- **[Stripe Billing Integration](./STRIPE_BILLING_README.md)**: Payment processing guide

### Feature Modules

- **[Security Panel](./src/pages/SecurityPanel.tsx)**: API key management and audit logs
- **[Webhook System](./HOOKS_README.md)**: Automation and webhook setup
- **[Media Studio](./MEDIA_STUDIO_ENHANCED_README.md)**: AI media generation guide
- **[Knowledge Library](./KNOWLEDGE_LIBRARY_README.md)**: Document management
- **[Vector Search](./VECTOR_SEARCH_README.md)**: RAG implementation details

### API & Integrations

- **[Stripe Webhooks](./supabase/functions/stripeWebhook/README.md)**: Payment integration
- **[Checkout Sessions](./supabase/functions/create-checkout-session/README.md)**: Payment processing
- **[Customer Portal](./supabase/functions/create-customer-portal-session/README.md)**: Billing management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation in the `docs/` folder
- Review the individual README files for specific modules
- Create an issue in the repository for bugs or feature requests

---

Built with ❤️ using React, Vite, and Supabase
