# Privacy Impact Assessment 

Privacy Impact Assessment (PIA) System


# Tech Stack
Backend: Node.js + Express
Templating Engine: EJS
Database: MySQL
ORM: Prisma
Other Tools: Nodemon (development)

# Local development setup
1. Clone the repository and enter the project directory.
2. Run `npm ci`.
3. Create a local `.env` with a `DATABASE_URL` pointing to a development database and a `SESSION_SECRET`.
4. Run `npm run generate`.
5. For a new development database, apply migrations with `npx prisma migrate deploy`.
6. Start the development server with `npm run dev`.

# Database changes
When changing `prisma/schema.prisma` during development, create and test a migration with:

```sh
npm run migrate:dev -- --name describe_the_change
npm run generate
```

Commit the schema and the complete new migration directory under `prisma/migrations/`.
Do not edit or omit migration SQL after it has been applied to a shared database.

`npm run migrate:reset` and `npm run migrate:fresh` reset the database and delete its
data. Use them only on disposable development databases. Do not run them on a
production database. Run `npm run seed` only when intentionally seeding a database.

# Updating a deployed instance
Before deploying, back up the production database and confirm the `.env` on the
server has the correct `DATABASE_URL`, a strong `SESSION_SECRET`, and production
values for `NODE_ENV`, `PORT`, and `APP_URL`. Keep that `.env` and uploaded files
on the server; they are not deployment code.

From the project directory on a Windows PowerShell server, after the changes have
been pushed:

```powershell
git pull --ff-only
npm ci
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
```

Then restart the app using the process manager/service already used by the server.
The repository currently defines `npm run dev` for development, not a production
start script. `node server.js` can be used to start it directly, but a production
deployment should run it under the existing service/process manager. Do not run
`npm run migrate:dev`, `npm run migrate:reset`, `npm run migrate:fresh`, or
`npm run seed` as routine production deployment steps.