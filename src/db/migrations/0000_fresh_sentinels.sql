CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"nonce" text NOT NULL,
	"username" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	"is_admin" boolean DEFAULT false,
	CONSTRAINT "users_address_unique" UNIQUE("address"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"bettor" text NOT NULL,
	"option_id" integer NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed" boolean DEFAULT false,
	"tx_hash" text NOT NULL,
	"source_chain" text
);
--> statement-breakpoint
CREATE TABLE "prediction_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"option_id" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" integer NOT NULL,
	"creator" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"stake" numeric(36, 18) NOT NULL,
	"total_bets" numeric(36, 18) NOT NULL,
	"resolved_option" integer DEFAULT -1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"chain_id" integer NOT NULL,
	"tx_hash" text NOT NULL,
	CONSTRAINT "predictions_prediction_id_unique" UNIQUE("prediction_id")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_bets" integer DEFAULT 0,
	"total_wins" integer DEFAULT 0,
	"total_staked" numeric(36, 18) DEFAULT '0',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_options" ADD CONSTRAINT "prediction_options_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;