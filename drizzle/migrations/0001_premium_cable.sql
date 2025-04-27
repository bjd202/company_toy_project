CREATE TABLE "snack_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"snack_id" integer NOT NULL,
	"action" varchar(20) NOT NULL,
	"change_quantity" integer,
	"before_quantity" integer,
	"after_quantity" integer,
	"userId" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "snack_requests" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "snack_logs" ADD CONSTRAINT "snack_logs_snack_id_snacks_id_fk" FOREIGN KEY ("snack_id") REFERENCES "public"."snacks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snack_logs" ADD CONSTRAINT "snack_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snacks" ADD CONSTRAINT "snacks_name_unique" UNIQUE("name");