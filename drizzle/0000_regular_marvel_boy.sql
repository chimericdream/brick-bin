CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."build_state" AS ENUM('sealed', 'opened', 'in_progress', 'built', 'disassembled', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."catalog_file_kind" AS ENUM('csv_archive', 'ldraw_zip', 'schema_svg', 'downloads_page');--> statement-breakpoint
CREATE TYPE "public"."catalog_run_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."instruction_kind" AS ENUM('file', 'link');--> statement-breakpoint
CREATE TYPE "public"."missing_kind" AS ENUM('part', 'minifig', 'other');--> statement-breakpoint
CREATE TYPE "public"."missing_resolution" AS ENUM('found', 'bought', 'substituted');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member', 'restricted');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_lego" boolean DEFAULT false NOT NULL,
	"website_url" text,
	"notes" text,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_files" (
	"url" text PRIMARY KEY NOT NULL,
	"kind" "catalog_file_kind" NOT NULL,
	"color_id" integer,
	"color_name" text,
	"remote_date" timestamp with time zone,
	"etag" text,
	"last_modified" text,
	"bytes" bigint,
	"fetched_at" timestamp with time zone,
	"extracted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "catalog_part_images" (
	"part_num" text NOT NULL,
	"color_id" integer NOT NULL,
	CONSTRAINT "catalog_part_images_part_num_color_id_pk" PRIMARY KEY("part_num","color_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "catalog_run_status" DEFAULT 'running' NOT NULL,
	"started_by_user_id" uuid,
	"source" text DEFAULT 'pasted' NOT NULL,
	"error" text,
	"step" text,
	"files_done" integer DEFAULT 0 NOT NULL,
	"files_total" integer DEFAULT 0 NOT NULL,
	"bytes_downloaded" bigint DEFAULT 0 NOT NULL,
	"files_downloaded" integer DEFAULT 0 NOT NULL,
	"files_skipped" integer DEFAULT 0 NOT NULL,
	"rows_loaded" bigint DEFAULT 0 NOT NULL,
	"notes" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"set_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"location_id" uuid,
	"build_state" "build_state" DEFAULT 'sealed' NOT NULL,
	"pieces_checked_on" date,
	"has_box" boolean DEFAULT true NOT NULL,
	"has_instructions" boolean DEFAULT true NOT NULL,
	"condition_notes" text,
	"acquired_on" date,
	"price_paid_cents" integer,
	"estimated_value_cents" integer,
	"valued_on" date,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copy_missing_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"copy_id" uuid NOT NULL,
	"kind" "missing_kind" NOT NULL,
	"rb_part_num" text,
	"rb_color_id" integer,
	"rb_fig_num" text,
	"quantity" integer NOT NULL,
	"snapshot_name" text,
	"snapshot_color_name" text,
	"snapshot_image" text,
	"description" text,
	"from_inventory" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid,
	"resolution" "missing_resolution",
	"notes" text,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_color_mappings" (
	"id" integer NOT NULL,
	"ext_system" text NOT NULL,
	"ext_id" text NOT NULL,
	"ext_descr" text,
	"is_export_id" boolean NOT NULL,
	"is_import_id" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_colors" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rgb" text NOT NULL,
	"is_trans" boolean NOT NULL,
	"num_parts" integer,
	"num_sets" integer,
	"y1" integer,
	"y2" integer
);
--> statement-breakpoint
CREATE TABLE "rb_elements" (
	"element_id" text NOT NULL,
	"part_num" text NOT NULL,
	"color_id" integer NOT NULL,
	"design_id" text
);
--> statement-breakpoint
CREATE TABLE "rb_inventories" (
	"id" integer PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"set_num" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_inventory_minifigs" (
	"inventory_id" integer NOT NULL,
	"fig_num" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_inventory_parts" (
	"inventory_id" integer NOT NULL,
	"part_num" text NOT NULL,
	"color_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"is_spare" boolean NOT NULL,
	"img_url" text
);
--> statement-breakpoint
CREATE TABLE "rb_inventory_sets" (
	"inventory_id" integer NOT NULL,
	"set_num" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_minifigs" (
	"fig_num" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"num_parts" integer,
	"img_url" text
);
--> statement-breakpoint
CREATE TABLE "rb_part_categories" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_part_mappings" (
	"part_num" text NOT NULL,
	"ext_system" text NOT NULL,
	"ext_id" text NOT NULL,
	"is_export_id" boolean NOT NULL,
	"is_import_id" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_part_relationships" (
	"rel_type" text NOT NULL,
	"child_part_num" text NOT NULL,
	"parent_part_num" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_parts" (
	"part_num" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"part_cat_id" integer,
	"part_material" text
);
--> statement-breakpoint
CREATE TABLE "rb_set_mappings" (
	"set_num" text NOT NULL,
	"ext_system" text NOT NULL,
	"ext_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rb_sets" (
	"set_num" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" integer,
	"theme_id" integer,
	"num_parts" integer,
	"img_url" text
);
--> statement-breakpoint
CREATE TABLE "rb_themes" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "set_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"set_id" uuid NOT NULL,
	"kind" "instruction_kind" NOT NULL,
	"label" text NOT NULL,
	"file_path" text,
	"file_bytes" bigint,
	"sha256" text,
	"url" text,
	"source_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "set_tags" (
	"household_id" uuid NOT NULL,
	"set_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "set_tags_set_id_tag_id_pk" PRIMARY KEY("set_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"set_number" text,
	"name" text NOT NULL,
	"theme_id" uuid,
	"year" integer,
	"piece_count" integer,
	"minifig_count" integer,
	"min_age" integer,
	"description" text,
	"retail_price_cents" integer,
	"cover_image" text,
	"rb_set_num" text,
	"rb_inventory_version" integer,
	"designer" text,
	"hidden_from_restricted" boolean DEFAULT false NOT NULL,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"brand_id" uuid,
	"rb_theme_id" integer,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"brand_id" uuid,
	"set_number" text,
	"rb_set_num" text,
	"cover_image" text,
	"url" text,
	"price_cents" integer,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_purchases" (
	"household_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"purchased_on" date NOT NULL,
	"note" text,
	"dismissed_at" timestamp with time zone,
	CONSTRAINT "wishlist_purchases_item_id_user_id_pk" PRIMARY KEY("item_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_runs" ADD CONSTRAINT "catalog_runs_started_by_user_id_users_id_fk" FOREIGN KEY ("started_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_set_id_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_missing_items" ADD CONSTRAINT "copy_missing_items_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_missing_items" ADD CONSTRAINT "copy_missing_items_copy_id_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."copies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_missing_items" ADD CONSTRAINT "copy_missing_items_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_missing_items" ADD CONSTRAINT "copy_missing_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_missing_items" ADD CONSTRAINT "copy_missing_items_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_instructions" ADD CONSTRAINT "set_instructions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_instructions" ADD CONSTRAINT "set_instructions_set_id_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_instructions" ADD CONSTRAINT "set_instructions_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_instructions" ADD CONSTRAINT "set_instructions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_instructions" ADD CONSTRAINT "set_instructions_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_tags" ADD CONSTRAINT "set_tags_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_tags" ADD CONSTRAINT "set_tags_set_id_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_tags" ADD CONSTRAINT "set_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_parent_id_themes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_purchases" ADD CONSTRAINT "wishlist_purchases_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_purchases" ADD CONSTRAINT "wishlist_purchases_item_id_wishlist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."wishlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_purchases" ADD CONSTRAINT "wishlist_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("household_id","entity_type","entity_id","at");--> statement-breakpoint
CREATE INDEX "audit_household_at_idx" ON "audit_log" USING btree ("household_id","at");--> statement-breakpoint
CREATE INDEX "brands_household_idx" ON "brands" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brands_name_unique" ON "brands" USING btree ("household_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_runs_one_running" ON "catalog_runs" USING btree ("status") WHERE "catalog_runs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "copies_household_idx" ON "copies" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "copies_set_idx" ON "copies" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "copies_location_idx" ON "copies" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "copy_missing_copy_idx" ON "copy_missing_items" USING btree ("copy_id");--> statement-breakpoint
CREATE INDEX "copy_missing_part_idx" ON "copy_missing_items" USING btree ("rb_part_num","rb_color_id");--> statement-breakpoint
CREATE UNIQUE INDEX "copy_missing_open_unique" ON "copy_missing_items" USING btree ("copy_id","kind",coalesce("rb_part_num", ''),coalesce("rb_color_id", -999999),coalesce("rb_fig_num", '')) WHERE "copy_missing_items"."resolved_at" is null and "copy_missing_items"."kind" <> 'other';--> statement-breakpoint
CREATE INDEX "locations_household_idx" ON "locations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "rb_elements_part_color_idx" ON "rb_elements" USING btree ("part_num","color_id");--> statement-breakpoint
CREATE INDEX "rb_inventories_set_idx" ON "rb_inventories" USING btree ("set_num");--> statement-breakpoint
CREATE INDEX "rb_inventory_minifigs_inv_idx" ON "rb_inventory_minifigs" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "rb_inventory_parts_inv_idx" ON "rb_inventory_parts" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "rb_inventory_sets_inv_idx" ON "rb_inventory_sets" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "rb_part_mappings_part_idx" ON "rb_part_mappings" USING btree ("part_num");--> statement-breakpoint
CREATE INDEX "rb_part_rel_parent_idx" ON "rb_part_relationships" USING btree ("parent_part_num");--> statement-breakpoint
CREATE INDEX "rb_part_rel_child_idx" ON "rb_part_relationships" USING btree ("child_part_num");--> statement-breakpoint
CREATE INDEX "rb_parts_name_idx" ON "rb_parts" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "rb_parts_cat_idx" ON "rb_parts" USING btree ("part_cat_id");--> statement-breakpoint
CREATE INDEX "rb_set_mappings_set_idx" ON "rb_set_mappings" USING btree ("set_num");--> statement-breakpoint
CREATE INDEX "rb_sets_name_idx" ON "rb_sets" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "set_instructions_set_idx" ON "set_instructions" USING btree ("set_id");--> statement-breakpoint
CREATE UNIQUE INDEX "set_instructions_sha_unique" ON "set_instructions" USING btree ("set_id","sha256") WHERE "set_instructions"."deleted_at" is null and "set_instructions"."sha256" is not null;--> statement-breakpoint
CREATE INDEX "sets_household_idx" ON "sets" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "sets_brand_idx" ON "sets" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sets_number_unique" ON "sets" USING btree ("household_id","brand_id",lower("set_number")) WHERE "sets"."deleted_at" is null and "sets"."set_number" is not null;--> statement-breakpoint
CREATE INDEX "tags_household_idx" ON "tags" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_unique" ON "tags" USING btree ("household_id",lower("name"));--> statement-breakpoint
CREATE INDEX "themes_household_idx" ON "themes" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "users_household_idx" ON "users" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "wishlist_household_idx" ON "wishlist_items" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "wishlist_requester_idx" ON "wishlist_items" USING btree ("requested_by_user_id");--> statement-breakpoint
CREATE INDEX "wishlist_purchases_user_idx" ON "wishlist_purchases" USING btree ("user_id");