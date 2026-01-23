import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// ============================================================================
// LICENSING - SaaS & One-Time License Management
// ============================================================================

/**
 * License types and tiers for the PeopleFlow HR Suite platform
 */
export const licenses = pgTable("licenses", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Organization relationship
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),

	// License type
	type: text("type")
		.notNull()
		.$type<"saas_monthly" | "saas_yearly" | "on_prem_perpetual">(),

	// License tier
	tier: text("tier")
		.notNull()
		.$type<"starter" | "professional" | "enterprise">(),

	// License key (for on-prem deployments)
	licenseKey: text("license_key").unique(),

	// Seat count (max number of employees)
	seats: integer("seats").notNull().default(10),
	usedSeats: integer("used_seats").notNull().default(0),

	// Pricing
	price: integer("price"), // In cents (e.g., $49.00 = 4900)
	currency: text("currency").default("USD"),

	// Validity
	isActive: boolean("is_active").notNull().default(true),
	startDate: timestamp("start_date").notNull().defaultNow(),
	expiresAt: timestamp("expires_at"), // NULL for perpetual licenses

	// Contact tracking (for enterprise/on-prem inquiries)
	contactedAt: timestamp("contacted_at"),
	salesNotes: text("sales_notes"),

	// Metadata
	settings: jsonb("settings").$type<{
		// Feature flags
		enabledFeatures?: string[];
		customBranding?: boolean;
		apiAccessEnabled?: boolean;
		ssoEnabled?: boolean;

		// Support level
		supportLevel?: "community" | "email" | "priority" | "dedicated";
		dedicatedAccountManager?: boolean;

		// On-prem specific
		deploymentType?: "cloud" | "on_prem" | "hybrid";
		maintenanceExpiresAt?: string;
	}>(),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * SaaS subscriptions - tracks recurring billing
 */
export const subscriptions = pgTable("subscriptions", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Organization and license
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	licenseId: uuid("license_id").references(() => licenses.id, {
		onDelete: "set null",
	}),

	// Subscription details
	plan: text("plan")
		.notNull()
		.$type<
			| "starter_monthly"
			| "starter_yearly"
			| "pro_monthly"
			| "pro_yearly"
			| "enterprise"
		>(),
	status: text("status")
		.notNull()
		.$type<"active" | "canceled" | "past_due" | "trialing" | "paused">()
		.default("active"),

	// Billing
	billingCycle: text("billing_cycle").notNull().$type<"monthly" | "yearly">(),
	amount: integer("amount").notNull(), // In cents
	currency: text("currency").notNull().default("USD"),

	// Dates
	currentPeriodStart: timestamp("current_period_start").notNull(),
	currentPeriodEnd: timestamp("current_period_end").notNull(),
	cancelAt: timestamp("cancel_at"),
	canceledAt: timestamp("canceled_at"),
	trialStart: timestamp("trial_start"),
	trialEnd: timestamp("trial_end"),

	// Payment provider
	stripeSubscriptionId: text("stripe_subscription_id").unique(),
	stripeCustomerId: text("stripe_customer_id"),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * License inquiries - for enterprise/on-prem sales leads
 */
export const licenseInquiries = pgTable("license_inquiries", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Contact information
	name: text("name").notNull(),
	email: text("email").notNull(),
	company: text("company"),
	phone: text("phone"),

	// Inquiry details
	inquiryType: text("inquiry_type")
		.notNull()
		.$type<"on_prem" | "enterprise" | "custom" | "partner">(),
	employeeCount: integer("employee_count"),
	message: text("message"),

	// Status tracking
	status: text("status")
		.notNull()
		.$type<"new" | "contacted" | "in_progress" | "converted" | "closed">()
		.default("new"),

	// Assignment
	assignedToUserId: uuid("assigned_to_user_id"),
	contactedAt: timestamp("contacted_at"),

	// Notes and follow-up
	salesNotes: text("sales_notes"),
	followUpDate: timestamp("follow_up_date"),

	// Conversion tracking
	convertedToOrganizationId: uuid("converted_to_organization_id").references(
		() => organizations.id,
		{ onDelete: "set null" }
	),
	convertedAt: timestamp("converted_at"),

	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Payment history - tracks all payments
 */
export const paymentHistory = pgTable("payment_history", {
	id: uuid("id").primaryKey().defaultRandom(),

	// Organization and subscription
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
		onDelete: "set null",
	}),

	// Payment details
	amount: integer("amount").notNull(),
	currency: text("currency").notNull().default("USD"),
	status: text("status")
		.notNull()
		.$type<"succeeded" | "pending" | "failed" | "refunded">(),

	// Payment method
	paymentMethod: text("payment_method").$type<
		"card" | "bank_transfer" | "paypal" | "other"
	>(),

	// Provider details
	stripePaymentId: text("stripe_payment_id"),
	stripeInvoiceId: text("stripe_invoice_id"),

	// Failure handling
	failureReason: text("failure_reason"),
	retryCount: integer("retry_count").default(0),

	// Metadata
	metadata: jsonb("metadata").$type<{
		description?: string;
		invoiceNumber?: string;
		receiptUrl?: string;
	}>(),

	// Timestamps
	paidAt: timestamp("paid_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const licensesRelations = relations(licenses, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [licenses.organizationId],
		references: [organizations.id],
	}),
	subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	organization: one(organizations, {
		fields: [subscriptions.organizationId],
		references: [organizations.id],
	}),
	license: one(licenses, {
		fields: [subscriptions.licenseId],
		references: [licenses.id],
	}),
}));

export const licenseInquiriesRelations = relations(
	licenseInquiries,
	({ one }) => ({
		convertedOrganization: one(organizations, {
			fields: [licenseInquiries.convertedToOrganizationId],
			references: [organizations.id],
		}),
	})
);

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
	organization: one(organizations, {
		fields: [paymentHistory.organizationId],
		references: [organizations.id],
	}),
	subscription: one(subscriptions, {
		fields: [paymentHistory.subscriptionId],
		references: [subscriptions.id],
	}),
}));

// ============================================================================
// TYPES
// ============================================================================

export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type LicenseInquiry = typeof licenseInquiries.$inferSelect;
export type NewLicenseInquiry = typeof licenseInquiries.$inferInsert;

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type NewPaymentHistory = typeof paymentHistory.$inferInsert;
