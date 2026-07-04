# TrainArduino Project Instructions

## Project Overview

TrainArduino is an interactive Arduino learning platform built with a Duolingo-style gamification approach. The project uses a single linear curriculum with an adaptive placement test, where users progress through modules with sequential unlocking based on gamification elements (XP, levels, badges).

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **Code Editor**: Monaco Editor (to be integrated)
- **Simulator**: Wokwi (iframe integration)
- **AI Correction**: Claude or Gemini API via server routes
- **Deployment**: Vercel

## Project Structure

```
app/
├── (auth)/         # Authentication routes
├── (dashboard)/    # User dashboard
├── (modules)/      # Modules, lessons, exercises
└── layout.tsx

components/        # Reusable React components
lib/               # Utilities and clients (e.g., supabase.ts)
public/            # Static assets
styles/            # Additional stylesheets
.env.local         # Environment variables (Supabase credentials)
```

## Database Schema

The Supabase database includes the following tables:

- **profiles**: User data (pseudo, level, xp_total)
- **modules**: Course modules with order and test level
- **lessons**: Theoretical content per module
- **exercises**: Code exercises with grading criteria
- **submissions**: User code submissions with AI feedback
- **progress**: User progress tracking per module
- **positioning_test_results**: Initial placement test results

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the app.

### Building for Production

```bash
npm run build
npm start
```

### Running Linter

```bash
npm run lint
```

## Key Guidelines

1. **File Organization**: Keep components organized in `/components`, utilities in `/lib`, and API routes in `/app/api`.
2. **TypeScript**: All files should be `.ts` or `.tsx` to maintain type safety.
3. **Styling**: Use Tailwind CSS classes for all styling. Custom CSS goes in `/styles` or component files.
4. **Supabase Integration**: Use the client from `lib/supabase.ts` for all database operations.
5. **Environment Variables**: Store sensitive data in `.env.local` (not committed).
6. **Route Organization**: Use grouped routes (parentheses) for better organization.

## Features to Implement

- [ ] Supabase Auth integration (login/signup)
- [ ] Database schema setup
- [ ] Adaptive placement test
- [ ] Dashboard with progress tracking
- [ ] Lesson content pages
- [ ] Code editor with Monaco
- [ ] Wokwi simulator integration
- [ ] AI-powered code review
- [ ] Gamification system (XP, levels, badges)
- [ ] Video upload for practical modules

## Environment Setup

1. Create a Supabase project at https://supabase.com
2. Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Add them to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

## Notes

- This project uses the **App Router** (not Pages Router)
- All routes are organized using **grouped routes** with parentheses
- Type safety is enforced with **TypeScript**
- Styling is done exclusively with **Tailwind CSS**

---

**Last Updated**: 2026-07-03  
**Status**: Initial setup complete ✅
