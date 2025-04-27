ALTER TABLE "snack_logs" RENAME TO "snack_histories";--> statement-breakpoint
ALTER TABLE "snack_histories" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "snack_histories" DROP CONSTRAINT "snack_logs_snack_id_snacks_id_fk";
--> statement-breakpoint
ALTER TABLE "snack_histories" DROP CONSTRAINT "snack_logs_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "snack_histories" ADD COLUMN "quantity" integer;--> statement-breakpoint
ALTER TABLE "snack_histories" ADD COLUMN "memo" text;--> statement-breakpoint
ALTER TABLE "snack_histories" ADD CONSTRAINT "snack_histories_snack_id_snacks_id_fk" FOREIGN KEY ("snack_id") REFERENCES "public"."snacks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snack_histories" ADD CONSTRAINT "snack_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snack_histories" DROP COLUMN "change_quantity";--> statement-breakpoint
ALTER TABLE "snack_histories" DROP COLUMN "before_quantity";--> statement-breakpoint
ALTER TABLE "snack_histories" DROP COLUMN "after_quantity";