-- Step 1: Drop all foreign key constraints that reference users.id
ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "carts_userId_users_id_fk";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_userId_users_id_fk";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_userId_users_id_fk";
ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "stores_ownerId_users_id_fk";
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_userId_users_id_fk";
ALTER TABLE "wishlists" DROP CONSTRAINT IF EXISTS "wishlists_userId_users_id_fk";
ALTER TABLE "addresses" DROP CONSTRAINT IF EXISTS "addresses_userId_users_id_fk";
ALTER TABLE "payment_methods" DROP CONSTRAINT IF EXISTS "payment_methods_userId_users_id_fk";

-- Step 2: Drop foreign key constraints that reference stores.id
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_storeId_stores_id_fk";
ALTER TABLE "store_settings" DROP CONSTRAINT IF EXISTS "store_settings_storeId_stores_id_fk";

-- Step 3: Handle users.id - create new column, copy data, then replace
ALTER TABLE "users" ADD COLUMN "id_new" varchar(255);
UPDATE "users" SET "id_new" = "id"::text;
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "users" ADD PRIMARY KEY ("id");

-- Step 4: Handle stores.id - create new column, copy data, then replace
ALTER TABLE "stores" ADD COLUMN "id_new" varchar(255);
UPDATE "stores" SET "id_new" = "id"::text;
ALTER TABLE "stores" DROP CONSTRAINT "stores_pkey";
ALTER TABLE "stores" DROP COLUMN "id";
ALTER TABLE "stores" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "stores" ADD PRIMARY KEY ("id");

-- Step 5: Change all foreign key columns to varchar
ALTER TABLE "accounts" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "addresses" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "carts" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "orders" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "payment_methods" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "products" ALTER COLUMN "storeId" SET DATA TYPE varchar(255);
ALTER TABLE "reviews" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "sessions" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "store_settings" ALTER COLUMN "storeId" SET DATA TYPE varchar(255);
ALTER TABLE "stores" ALTER COLUMN "ownerId" SET DATA TYPE varchar(255);
ALTER TABLE "user_profiles" ALTER COLUMN "userId" SET DATA TYPE varchar(255);
ALTER TABLE "wishlists" ALTER COLUMN "userId" SET DATA TYPE varchar(255);

-- Step 6: Recreate foreign key constraints
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE;
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE;