# Security Best Practices

This document outlines security best practices for this project, particularly focused on how to handle sensitive information like API keys and environment variables.

## Environment Variables

### Local Development

1. **Use `.env.local` files**:

   - Copy `.env.example` to `.env.local` and add your real API keys
   - Never commit `.env.local` files to the repository (they are already gitignored)

2. **Exposed vs. Protected Keys**:
   - `NEXT_PUBLIC_*` variables are exposed to the browser and should only contain non-sensitive data
   - All other variables (like API keys for external services) are only available on the server

### Deployment

1. **Vercel Deployment**:

   - Add all environment variables in the Vercel dashboard
   - For production, use the Environment Variables section in your project settings
   - For preview/development branches, use the appropriate environment settings

2. **API Keys Rotation**:
   - Regularly rotate API keys for production environments
   - Use different API keys for development and production

## Secrets Management

### Accidental Exposure

If you accidentally commit sensitive information:

1. Run the `purge-secrets.sh` script to clean the repository history
2. Immediately invalidate and rotate any exposed credentials
3. Push the cleaned repository with `git push origin --force`

### API Keys Security

Ensure all API operations that require sensitive keys happen on the server side:

- Use API routes (`app/api/*`) for operations requiring private keys
- Never use sensitive API keys directly in client-side code
- Use appropriate role-based access control in services like Supabase

## Development Guidelines

1. **Pull Requests**:

   - Always review code for accidental inclusion of secrets before submitting PRs
   - Use GitHub's secret scanning to prevent accidental commits

2. **API Usage**:

   - Set appropriate rate limits for API consumption
   - Use the minimum required permissions for API keys
   - Consider implementing proxy endpoints for third-party APIs

3. **Client-Side Security**:
   - Never store sensitive user data in local storage
   - Implement proper CORS headers for API routes
   - Use HTTPS for all connections

## Security Contacts

If you discover a security vulnerability in this project, please report it responsibly by contacting the project maintainers.
