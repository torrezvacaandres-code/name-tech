# name-tech

A production-ready Next.js application with authentication, built with modern best practices.

## Tech Stack

- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with RLS
- **Validation**: Zod + React Hook Form
- **Rate Limiting**: Hybrid (in-memory dev, Upstash prod)
- **Security**: CSP, HSTS, comprehensive security headers

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Environment Setup

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. (Optional) For production rate limiting, add Upstash Redis credentials:
```env
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

See `RATE_LIMITING.md` for setup instructions.

### Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build & Production

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Linting

```bash
# Run ESLint
pnpm lint

# Auto-fix issues
pnpm lint -- --fix
```

## Project Structure

```
app/                   # Next.js App Router
  /                    # Login/Signup (main entry)
  /dashboard           # Protected dashboard
  /profile             # Protected user profile
  /auth/callback       # OAuth callback
  /auth/forgot-password # Password reset
  /api/profile         # Profile API with validation

lib/                   # Utilities
  logger.ts            # Structured logging
  rate-limit.ts        # Hybrid rate limiting
  supabase/            # Supabase clients (singleton)
  validations/         # Zod schemas

components/            # React components
  ui/                  # shadcn/ui components
  auth/                # Auth forms
  providers/           # React context providers
```

## Key Features

- ✅ **Authentication**: Email/password with Supabase
- ✅ **Authorization**: Row Level Security (RLS) policies
- ✅ **Validation**: Client + server-side with shared Zod schemas
- ✅ **Rate Limiting**: Hybrid system (dev/prod)
- ✅ **Logging**: Centralized structured logging
- ✅ **Security**: CSP, HSTS, comprehensive headers
- ✅ **Error Handling**: Global + route-specific error boundaries
- ✅ **Type Safety**: TypeScript strict mode + Supabase types

## Documentation

- **AGENTS.md** - Comprehensive guide for AI coding agents
- **RATE_LIMITING.md** - Rate limiting setup instructions
- **IMPROVEMENTS.md** - Detailed changelog of improvements

## Architecture Patterns

### Singleton Pattern
Supabase client uses singleton pattern to prevent multiple instances.

### Server-Side Validation
All API routes validate input with Zod, even with client validation.

### Structured Logging
Centralized logger with `info`, `warn`, `error`, `debug` levels.

### Fail-Fast Validation
Environment variables validated on startup with clear error messages.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/name-tech)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## License

MIT
