-- Create follow_ups table if it doesn't exist
CREATE TABLE IF NOT EXISTS "follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"type" varchar(50) NOT NULL,
	"notes" text,
	"reminder" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'follow_ups_lead_id_leads_id_fk'
    ) THEN
        ALTER TABLE "follow_ups" 
        ADD CONSTRAINT "follow_ups_lead_id_leads_id_fk" 
        FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") 
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'follow_ups_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "follow_ups" 
        ADD CONSTRAINT "follow_ups_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
        ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
