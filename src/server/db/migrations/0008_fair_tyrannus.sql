CREATE TABLE "zero_trust_verifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "zero_trust_verifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"paymentData" text NOT NULL,
	"riskScore" integer NOT NULL,
	"riskFactors" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"verifiedAt" timestamp,
	"expiresAt" timestamp NOT NULL,
	"userEmail" varchar(255) NOT NULL,
	"emailSent" boolean DEFAULT false NOT NULL,
	"emailSentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "zero_trust_verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "zero_trust_verifications" ADD CONSTRAINT "zero_trust_verifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;