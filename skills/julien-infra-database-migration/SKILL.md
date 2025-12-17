---
name: database-migration
description: Manage Drizzle ORM database schema and migrations for the Jokers Hockey project. Use this when the user wants to modify the database schema, add tables, update columns, or sync database changes.
---

# Database Migration with Drizzle ORM

This skill manages database schema changes using Drizzle ORM for the Jokers Hockey website.

## When to Use This Skill

Activate when the user requests:
- "Add a table to the database"
- "Modify the database schema"
- "Create a migration"
- "Update database columns"
- "Sync the database"
- "Push schema changes"

## Database Configuration

### Current Setup
- **ORM**: Drizzle
- **Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts`
- **Config**: `drizzle.config.ts`
- **Production DB**: `jokers_prod` on localhost:5432
- **Connection**: Via `DATABASE_URL` environment variable

### Drizzle Config
```typescript
// drizzle.config.ts
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

## Schema Management Workflow

### 1. Define Schema Changes

Edit `shared/schema.ts` to add/modify tables:

```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Example: News table
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Example: Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "senior", "junior", etc.
  description: text("description"),
  imageUrl: text("image_url"),
});

// Example: Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
});
```

### 2. Push Schema Changes

Drizzle Kit supports two approaches:

**Approach A: Push (Recommended for Development)**
```bash
# Directly apply schema changes to database
npm run db:push

# This command:
# - Reads shared/schema.ts
# - Compares with current database state
# - Applies changes directly
# - No migration files generated
```

**Approach B: Generate Migrations (Production)**
```bash
# Generate migration SQL files
npx drizzle-kit generate

# Review generated migrations in ./migrations/

# Apply migrations
npx drizzle-kit migrate
```

### 3. Verify Changes

```bash
# Connect to database and verify
ssh automation@69.62.108.82
docker exec -it postgresql-shared psql -U postgres -d jokers_prod

# List tables
\dt

# Describe table structure
\d table_name

# Exit
\q
```

## Common Schema Patterns

### Adding a New Table

```typescript
export const tableName = pgTable("table_name", {
  id: serial("id").primaryKey(),
  field1: text("field1").notNull(),
  field2: text("field2"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Adding Relations

```typescript
import { relations } from "drizzle-orm";

export const newsRelations = relations(news, ({ one }) => ({
  author: one(users, {
    fields: [news.authorId],
    references: [users.id],
  }),
}));
```

### Adding Indexes

```typescript
export const news = pgTable("news", {
  // ... columns
}, (table) => ({
  titleIdx: index("title_idx").on(table.title),
  publishedAtIdx: index("published_at_idx").on(table.publishedAt),
}));
```

## Using Schema in Code

### Import Schema
```typescript
import { news, teams, products } from "@shared/schema";
```

### Query Examples (in server/routes.ts)
```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { news } from "../shared/schema";

const db = drizzle(process.env.DATABASE_URL!);

// Select all news
const allNews = await db.select().from(news);

// Insert news
await db.insert(news).values({
  title: "Match Result",
  content: "Jokers won 5-2!",
});

// Update news
await db.update(news)
  .set({ title: "Updated Title" })
  .where(eq(news.id, 1));

// Delete news
await db.delete(news)
  .where(eq(news.id, 1));
```

## Production Deployment

### Syncing Schema to Production

```bash
# SSH to server
ssh automation@69.62.108.82
cd /var/www/jokers

# Pull latest code with schema changes
git pull origin main

# Push schema changes
npm run db:push

# Restart application
pm2 restart jokers-hockey
```

### Database Backup Before Changes

```bash
# Backup database before major schema changes
docker exec postgresql-shared pg_dump -U postgres jokers_prod > backup_$(date +%Y%m%d).sql

# Restore if needed
docker exec -i postgresql-shared psql -U postgres jokers_prod < backup_20251203.sql
```

## Troubleshooting

### Schema Push Fails

**Check database connection:**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
docker exec postgresql-shared psql -U postgres -d jokers_prod -c "SELECT version();"
```

**Check for conflicts:**
- Ensure no manual database changes were made
- Check for column type mismatches
- Verify foreign key constraints

### Type Errors After Schema Changes

```bash
# Regenerate Drizzle types
npx drizzle-kit introspect

# Check TypeScript compilation
npm run check
```

### Migration File Issues

```bash
# Clear old migrations if needed
rm -rf migrations/*

# Regenerate fresh
npx drizzle-kit generate
```

## Best Practices

1. **Always backup before schema changes** in production
2. **Test schema changes locally** before deploying
3. **Use descriptive column names** in snake_case
4. **Add timestamps** (createdAt, updatedAt) to all tables
5. **Define indexes** for frequently queried columns
6. **Use NOT NULL** constraints where appropriate
7. **Document complex schemas** with comments
8. **Restart application** after schema changes

## Environment Variables

Ensure DATABASE_URL is set correctly:

**Development:**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/jokers_dev
```

**Production (server):**
```env
DATABASE_URL=postgresql://postgres:XkLjpn6QUtgTvoYf1p5EsavIBa7NY3V1u2WqNrC0@localhost:5432/jokers_prod
```

## Resources

- Drizzle ORM Docs: https://orm.drizzle.team/docs/overview
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Schema Definition: `shared/schema.ts`
- Config: `drizzle.config.ts`
