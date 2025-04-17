CREATE TABLE "quote_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"quote_id" integer,
	CONSTRAINT "quote_cache_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "snack_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"approved_id" integer
);
--> statement-breakpoint
CREATE TABLE "snacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"expire_date" date,
	"quantity" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"created_id" integer,
	"updated_at" timestamp DEFAULT now(),
	"updated_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "quote_cache" ADD CONSTRAINT "quote_cache_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snack_requests" ADD CONSTRAINT "snack_requests_created_id_users_id_fk" FOREIGN KEY ("created_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snack_requests" ADD CONSTRAINT "snack_requests_approved_id_users_id_fk" FOREIGN KEY ("approved_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snacks" ADD CONSTRAINT "snacks_created_id_users_id_fk" FOREIGN KEY ("created_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snacks" ADD CONSTRAINT "snacks_updated_id_users_id_fk" FOREIGN KEY ("updated_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;