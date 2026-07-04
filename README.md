# TrainArduino 🚀

An interactive Arduino learning platform built with Duolingo-style gamification.

## Project Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **Code Editor**: Monaco Editor (upcoming)
- **Circuit Simulator**: Wokwi (upcoming)
- **AI Correction**: Claude/Gemini API (upcoming)
- **Deployment**: Vercel

## Project Structure

```
trainarduino/
├── app/
│   ├── (auth)/          # Login and signup pages
│   ├── (dashboard)/     # User dashboard
│   ├── (modules)/       # Lessons and exercises
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # Reusable React components
├── lib/
│   └── supabase.ts      # Supabase client
├── public/              # Static assets
├── styles/              # Additional styles
├── .env.local           # Environment variables (not committed)
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### 1. Environment Setup

Create a `.env.local` file in the root directory with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

### 4. Build for Production

```bash
npm run build
npm start
```

## Features (Roadmap)

- ✅ Project structure with App Router
- ✅ Authentication pages (UI only)
- ✅ Dashboard with gamification mockup
- ⏳ Supabase integration (Auth + Database)
- ⏳ Positioning test (adaptive)
- ⏳ Code editor with Monaco
- ⏳ Wokwi simulator integration
- ⏳ AI-powered code correction
- ⏳ XP, levels, badges system
- ⏳ Video upload validation
- ⏳ Lessons and exercises

## Database Schema

The project uses Supabase with PostgreSQL:

- **users** → profiles (pseudo, level, xp_total)
- **modules** → (id, title, description, order, test_level)
- **lessons** → (id, module_id, content, order)
- **exercises** → (id, module_id, prompt, correction_criteria, xp_reward, difficulty)
- **submissions** → (id, user_id, exercise_id, code, feedback, status, video_url, date)
- **progress** → (id, user_id, module_id, status, score)
- **positioning_test_results** → (id, user_id, level_reached, date)

## Development Notes

- Uses TypeScript for type safety
- Tailwind CSS for styling
- Next.js App Router for file-based routing
- Group routes with parentheses: `(auth)`, `(dashboard)`, `(modules)`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

## License

MIT
