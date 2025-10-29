CREATE TABLE "product_tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"productId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_tags_product_tag_unique" UNIQUE("productId","tagId")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_tags_product_idx" ON "product_tags" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "product_tags_tag_idx" ON "product_tags" USING btree ("tagId");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "tags";