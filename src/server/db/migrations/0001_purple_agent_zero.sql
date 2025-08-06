CREATE TYPE "public"."user_type" AS ENUM('customer', 'owner', 'admin');--> statement-breakpoint
ALTER TABLE "user_types" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_types" CASCADE;--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "userTypeId" TO "userType";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_userTypeId_user_types_id_fk";
