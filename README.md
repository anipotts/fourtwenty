# 420 Social App

A social application that helps users discover nearby food options and connect with friends.

## Features

- **Eats Map**: Discover restaurants and food options in your area
- **Chat**: Connect with friends through real-time messaging
- **Cloud**: Create and join social events with other users
- **Profile**: Manage your user profile and preferences

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Maps Integration**: Google Maps API
- **Restaurant Data**: Yelp API
- **AI Features**: OpenAI API
- **Database & Auth**: Supabase
- **Image Hosting**: ImgBB

## Recent Updates

- **Codebase Optimization**:

  - Removed duplicate components to reduce redundancy
  - Improved naming consistency across the application
  - Eliminated unused components to streamline the codebase

- **Security Enhancements**:
  - Implemented secure environment variable handling
  - Added scripts for purging sensitive data from git history
  - Created documentation for security best practices
  - Updated example environment files to use placeholders instead of real keys

## Development

### Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and add your API keys
3. Install dependencies:

```
npm install
```

4. Run the development server:

```
npm run dev
```

### Environment Variables

See the `.env.example` file for required environment variables. For security guidance, refer to the `SECURITY.md` file.

## Deployment

This project is configured for deployment on Vercel. Make sure to add all required environment variables in your Vercel project settings before deploying.

## Security

Please read the `SECURITY.md` file for important security guidelines, especially regarding the handling of API keys and sensitive information.
