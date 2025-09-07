# AI OS Supabase Shell

A comprehensive **React + Vite** application for AI Business Systems OS, built with **Supabase** for authentication, database, and storage. This modular platform includes AI agent orchestration, media generation, webhook automation, and business management tools.

## 🚀 Features

### Core Modules

- **Mission Control**: Central dashboard and analytics
- **Operations Hub**: Job management and task orchestration
- **Financial Nexus**: Invoice management and payment processing
- **AI Lab**: AI agent configuration and management
- **Media Studio**: AI-powered media generation (Image/Video/Audio)
- **Knowledge Library**: Document management and RAG search
- **Admin Portal**: Business analytics and client management
- **Admin Settings**: System configuration and webhook management

### AI & Automation

- **Multi-LLM Support**: OpenAI, Claude (Anthropic), and Gemini integration
- **AI Agent Orchestrator**: Task routing and delegation system
- **Media Generation**: AI-powered image, video, and audio creation
- **Webhook Automation**: Zapier and Tasker integration
- **Vector Search**: RAG implementation for document search

### Business Tools

- **Client Management**: Company profiles and contact management
- **Invoice System**: Automated invoicing with Stripe integration
- **Job Management**: Task creation and tracking
- **Document Management**: File upload and organization
- **Payment Processing**: Stripe webhook integration

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

# Stripe Configuration (Optional - for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Database Setup

Run the setup script to create all required tables:

```bash
npm run setup-db
```

This creates the following tables:

- `public.profiles` - User profiles and authentication
- `public.companies` - Client/company management
- `public.services` - Service offerings and billing
- `public.invoices` - Invoice and payment tracking
- `public.jobs` - Task and job management
- `public.documents` - Document storage and metadata
- `public.media_assets` - AI-generated media storage
- `public.company_config` - System configuration settings
- `public.settings` - Application settings
- `public.ai_agents` - AI agent configurations
- `public.agent_logs` - AI interaction logging

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

3. **Configure Vector Search (Optional):**
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
│   ├── MediaStudio.tsx   # AI media generation
│   ├── AiLab.tsx        # AI agent management
│   ├── FinancialNexus.tsx # Financial management
│   ├── OperationsHub.tsx  # Operations dashboard
│   ├── KnowledgeLibrary.tsx # Document management
│   ├── MissionControl.tsx   # Main dashboard
│   └── ...
└── utils/                # Utility functions
    └── rag.ts           # RAG search implementation
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

## 💰 Payment Integration

### Stripe Webhooks

- Automated invoice status updates
- Transaction record creation
- Secure webhook signature verification
- Payment completion handling

## 🗄️ Database Schema

### Core Tables

- **profiles**: User authentication and roles
- **companies**: Client and company management
- **services**: Service offerings with billing
- **invoices**: Invoice tracking and payments
- **jobs**: Task and job management
- **documents**: File storage and metadata
- **media_assets**: AI-generated media storage
- **company_config**: System configuration
- **ai_agents**: AI agent configurations
- **agent_logs**: AI interaction logs

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run setup-db     # Run database setup
npm run lint         # Run ESLint
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

# Stripe (if using payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📚 Documentation

- **[Agent System](./src/agents/README.md)**: AI agent orchestration details
- **[Webhook System](./HOOKS_README.md)**: Automation and webhook setup
- **[Media Studio](./MEDIA_STUDIO_SETUP.md)**: AI media generation guide
- **[Vector Search](./VECTOR_SEARCH_README.md)**: RAG implementation details
- **[Stripe Webhooks](./supabase/functions/stripeWebhook/README.md)**: Payment integration

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
