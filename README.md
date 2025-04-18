# Four Twenty

A Next.js 14 application with TypeScript, Tailwind CSS, shadcn/ui, and Supabase integration.

## Features

- Age verification gate (RU21)
- Responsive UI with Tailwind CSS
- Supabase authentication and database
- Ready for deployment on Vercel
- AI-powered ChatGPT-style chat interface with image analysis
- Floating chat assistant across the entire application

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth & Postgres), Vercel Edge Functions
- **APIs**: OpenAI GPT-4V for image analysis, GPT-3.5 for chat, Yelp Fusion, and Google Maps
- **Image Storage**: ImgBB API integration for image uploads

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:

   ```bash
   # If you're using Vercel and have linked your project
   vercel env pull .env.local

   # OR manually copy the example file and add your keys
   cp .env.local.example .env.local
   ```

4. Add your API keys to `.env.local` file (Google Maps, Yelp, OpenAI, ImgBB, Supabase)
5. Run the development server:
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
  - `ChatInterface.tsx`: ChatGPT-style interface with image upload
  - `ChatButton.tsx`: Floating chat button component
- `lib/`: Utility functions and shared code
- `supabase/`: Supabase schema and configuration
- `api/`: Server-side API routes and edge functions
  - `api/chat/`: OpenAI streaming chat API with GPT-4V support
  - `api/upload/`: Image upload API using ImgBB

## Documentation

- See [TOOLS.md](./TOOLS.md) for a list of all tools and packages used in this project
- See [TASKS.md](./TASKS.md) for a checklist of MVP tasks

## License

MIT
