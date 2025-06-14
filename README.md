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
