CREATE INDEX "products_store_id_idx" ON "products" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "reviews" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "stores_name_idx" ON "stores" USING btree ("name");--> statement-breakpoint
CREATE INDEX "stores_created_at_idx" ON "stores" USING btree ("createdAt");