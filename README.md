# Privacy Impact Assessment 

Privacy Impact Assessment (PIA) System


# Tech Stack
Backend: Node.js + Express
Templating Engine: EJS
Database: MySQL
ORM: Prisma
Other Tools: Nodemon (development)

# Set-up Installation
1. Clone the repository:
2. git clone https://gitlab.com/2215699/privacy-impact-assessment.git
3. cd project or Choose Folder

# Install dependencies:
4. npm install
5. Setup environment variables:
6. DATABASE_URL="mysql://root@localhost:3306/pia_db"
7. Generate Prisma Client: npm run generate
8. Run Prisma migrations: npm run migrate:reset || npm run migrate:fresh
9. npx prisma migrate dev
10. Start the server: npm run dev
11. 


# Commands
    When Editing the Schema of the database:
      1. prisma migrate reset = npm run migrate:reset || npm run migrate:fresh 
      2. prisma migrate dev = npm run migrate:dev -- --name "create_answers_table"
      3. prisma generate = npm run generate

    When resetting your db
      prisma migrate reset = npm run migrate:reset || npm run migrate:fresh 

    When migrating latest/newly added mmigration in your db
      npx prisma migrate dev = npm run migrate:dev

    Command to create your Prisma Client:
      prisma generate = npm run generate

    Command for running seeds:
      prisma db seed = npm run seed