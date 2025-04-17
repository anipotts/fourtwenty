# Four Twenty

A Next.js 14 application with TypeScript, Tailwind CSS, shadcn/ui, and Supabase integration.

## Features

- Age verification gate (RU21)
- Responsive UI with Tailwind CSS
- Supabase authentication and database
- Ready for deployment on Vercel

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth & Postgres), Vercel Edge Functions
- **APIs**: Prepared for OpenAI, Yelp Fusion, and Google Maps

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and add your environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for easy deployment to Vercel:

```bash
npm run deploy
```

## Project Structure

- `app/`: Next.js app directory (App Router)
- `components/`: Reusable React components
  - `ui/`: shadcn/ui components
- `lib/`: Utility functions and shared code
- `supabase/`: Supabase schema and configuration

## Documentation

- See [TOOLS.md](./TOOLS.md) for a list of all tools and packages used in this project
- See [TASKS.md](./TASKS.md) for a checklist of MVP tasks

## License

MIT
