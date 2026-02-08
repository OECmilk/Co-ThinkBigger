---
name: Supabase & Prisma Best Practices
description: Guidelines for avoiding common errors when working with Supabase and Prisma, specifically regarding defaults and triggers.
---

# Supabase & Prisma Integration Rules

## 1. Handling `updatedAt` and `@updatedAt`
**Problem:**
Prisma's `@updatedAt` attribute handles updating the timestamp **at the application level** (in the Prisma Client). It does **NOT** automatically set a database-level `DEFAULT` value (like `DEFAULT now()`) or a database trigger for updates.
If you insert data using raw SQL (e.g., via Supabase SQL Editor, Triggers, or direct API calls bypassing Prisma), the `updatedAt` column will be `NULL`, causing a `not-null constraint violation`.

**Solution:**
Always create a migration or run a SQL command to set the default value for `updatedAt` columns.

```sql
ALTER TABLE "YourTable" ALTER COLUMN "updatedAt" SET DEFAULT now();
```

## 2. Handling IDs
**Problem:**
Similar to `updatedAt`, if you rely on Prisma's `@default(uuid())`, it guarantees UUID generation **only within Prisma Client**.
If you insert data via raw SQL or Triggers, you must explicitly generate the UUID.

**Solution:**
- **In SQL/Triggers:** Use `gen_random_uuid()` (PostgreSQL 13+) or `uuid_generate_v4()`.
- **In Tables:** Ensure the column has a default value if you want DB-level generation:
  ```sql
  ALTER TABLE "YourTable" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
  ```

## 3. Row Level Security (RLS) & Triggers
**Problem:**
When using Supabase Auth Triggers (e.g., `on_auth_user_created`), the trigger executes with the privileges of the role defined (usually `security definer`).
If RLS is enabled on the target table (e.g., `Profile`), standard inserts might fail if not handled correctly.

**Solution:**
- Triggers are effective for bridging `auth.users` and public tables.
- Ensure `updatedAt` and `createdAt` are populated in the trigger function to avoid constraint errors.

## 4. Checklist for New Tables
When creating a new table with Prisma for Supabase:
1. [ ] Define schema in `schema.prisma`.
2. [ ] If using `db push` isn't possible and you use SQL scripts:
   - [ ] Add `DEFAULT now()` to `createdAt`.
   - [ ] Add `DEFAULT now()` to `updatedAt` (Critical!).
   - [ ] Add `DEFAULT gen_random_uuid()` to `id`.
3. [ ] Verify constraints (Unique, Not Null) are satisfied by defaults.
