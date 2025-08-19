This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install Dependencies

Run the following command to install all dependencies (choose one):

```bash
bun install
# or
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root of the project and add your database connection string:

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your PostgreSQL credentials.

Follow [this link](https://orm.drizzle.team/docs/guides/postgresql-local-setup) for steps on how to setup a postgres database locally with docker.

### 3. Set Up the Database

If this is your first time running the project, you'll need to set up the database schema. You can do this using the following commands:

```bash
# Generate migration files (if you make schema changes)
bun run db:generate

# Apply migrations to your database
bun run db:push
```

You can also use the Drizzle Studio to inspect your database:

```bash
bun run db:studio
```

### 4. Run the Development Server

Start the development server with:

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

# Simple OAuth Setup

This is a minimal OAuth implementation that adds Google authentication to your existing app without major schema changes.

## What's Added

- **Google OAuth**: Sign in with Google accounts
- **NextAuth.js**: Authentication framework
- **Simple UI**: Basic sign in/sign up pages
- **Minimal Schema Changes**: Only adds NextAuth required tables

## Environment Variables

Create a `.env` file with:

```bash
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

## Generate NextAuth Secret

```bash
openssl rand -base64 32
```

## Database Migration

The schema only adds 3 new tables:

- `accounts` - OAuth account links
- `sessions` - User sessions
- `verification_tokens` - Email verification

Run the migration:

```bash
bun run db:generate
bun run db:push
```

## How It Works

1. **Google Sign In**: Users click "Continue with Google"
2. **User Creation**: If new user, creates entry in your existing `users` table
3. **Session Management**: NextAuth handles JWT sessions
4. **Integration**: Works with your existing user system

## Features

- ✅ Google OAuth authentication
- ✅ Automatic user creation
- ✅ Session management
- ✅ Minimal database changes
- ✅ Simple UI components
- ✅ Integrates with existing schema

## Routes

- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/api/auth/[...nextauth]` - NextAuth API

## Usage

The authentication is now integrated into your app header. Users can:

- Sign in with Google
- Sign out
- See their authentication status

This implementation keeps your existing user structure intact while adding OAuth capabilities.
