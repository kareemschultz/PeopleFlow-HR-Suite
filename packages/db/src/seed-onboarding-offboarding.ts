/**
 * Seed Data: Onboarding & Offboarding Workflows
 * Production-quality workflow templates with realistic task breakdowns
 */

import { db } from ".";
import {
	type NewTaskTemplate,
	type NewWorkflowTemplate,
	taskTemplates,
	workflowTemplates,
} from "./schema/onboarding-offboarding";

/**
 * Workflow Template IDs (stable for FK relationships)
 */
const WORKFLOW_IDS = {
	onboarding_standard: "550e8400-e29b-41d4-a716-446655440001",
	onboarding_executive: "550e8400-e29b-41d4-a716-446655440002",
	offboarding_standard: "550e8400-e29b-41d4-a716-446655440003",
	offboarding_executive: "550e8400-e29b-41d4-a716-446655440004",
};

/**
 * Workflow Templates
 */
export const seedWorkflowTemplates: NewWorkflowTemplate[] = [
	{
		id: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001", // Acme Corp
		name: "Standard Employee Onboarding",
		type: "onboarding",
		description:
			"Comprehensive 30-day onboarding program for new employees covering documentation, equipment, training, and orientation.",
		durationDays: 30,
		isActive: true,
		isDefault: true,
	},
	{
		id: WORKFLOW_IDS.onboarding_executive,
		organizationId: "00000000-0000-0000-0000-000000000001",
		name: "Executive Onboarding",
		type: "onboarding",
		description:
			"Enhanced onboarding program for executives and senior leadership with strategic planning sessions and stakeholder introductions.",
		durationDays: 45,
		isActive: true,
		isDefault: false,
	},
	{
		id: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		name: "Standard Employee Offboarding",
		type: "offboarding",
		description:
			"Structured offboarding process ensuring smooth knowledge transfer, equipment return, and access revocation.",
		durationDays: 14,
		isActive: true,
		isDefault: true,
	},
	{
		id: WORKFLOW_IDS.offboarding_executive,
		organizationId: "00000000-0000-0000-0000-000000000001",
		name: "Executive Offboarding",
		type: "offboarding",
		description:
			"Extended offboarding for executives including board notifications, comprehensive transition planning, and strategic documentation handover.",
		durationDays: 30,
		isActive: true,
		isDefault: false,
	},
];

/**
 * Task Templates - Standard Onboarding
 */
export const seedTaskTemplatesOnboardingStandard: NewTaskTemplate[] = [
	// Pre-start tasks (negative day offset)
	{
		id: "650e8400-e29b-41d4-a716-446655440001",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Prepare welcome package",
		description:
			"Assemble welcome kit with company swag, employee handbook, and first-day schedule.",
		category: "hr",
		assigneeRole: "hr_manager",
		dayOffset: -3, // 3 days before start
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 1,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440002",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Order equipment (laptop, monitor, peripherals)",
		description:
			"Request and configure hardware according to role requirements. Include laptop, monitor, keyboard, mouse, headset.",
		category: "equipment",
		assigneeRole: "it_admin",
		dayOffset: -5,
		estimatedMinutes: 90,
		isRequired: true,
		requiresApproval: true,
		order: 2,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440003",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Setup email account and workspace access",
		description:
			"Create company email, Slack account, Google Workspace access, and assign to appropriate teams/channels.",
		category: "it_access",
		assigneeRole: "it_admin",
		dayOffset: -2,
		estimatedMinutes: 45,
		isRequired: true,
		requiresApproval: false,
		order: 3,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440004",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Configure application access (GitHub, Jira, etc.)",
		description:
			"Provision access to relevant tools based on role: development tools, project management, design tools, etc.",
		category: "it_access",
		assigneeRole: "it_admin",
		dayOffset: -1,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 4,
	},

	// Day 1 tasks
	{
		id: "650e8400-e29b-41d4-a716-446655440005",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Complete employment contract",
		description:
			"Review and sign employment agreement, non-disclosure agreement, and code of conduct.",
		category: "documentation",
		assigneeRole: "employee",
		dayOffset: 0,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: true,
		order: 5,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440006",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Complete tax forms (W-4, state forms)",
		description:
			"Fill out federal and state tax withholding forms. Provide banking details for direct deposit.",
		category: "documentation",
		assigneeRole: "employee",
		dayOffset: 0,
		estimatedMinutes: 30,
		isRequired: true,
		requiresApproval: false,
		order: 6,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440007",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Receive equipment and verify functionality",
		description:
			"Check all hardware is working correctly. Sign equipment assignment form acknowledging receipt.",
		category: "equipment",
		assigneeRole: "employee",
		dayOffset: 0,
		estimatedMinutes: 30,
		isRequired: true,
		requiresApproval: false,
		order: 7,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440008",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Company orientation session",
		description:
			"Attend company overview presentation covering mission, values, structure, products/services, and culture.",
		category: "training",
		assigneeRole: "employee",
		dayOffset: 0,
		estimatedMinutes: 120,
		isRequired: true,
		requiresApproval: false,
		order: 8,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440009",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Meet with direct manager - expectations & goals",
		description:
			"Initial 1:1 with manager to discuss role expectations, team dynamics, and 30-60-90 day goals.",
		category: "hr",
		assigneeRole: "direct_manager",
		dayOffset: 0,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 9,
	},

	// Week 1 tasks
	{
		id: "650e8400-e29b-41d4-a716-446655440010",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Security awareness training",
		description:
			"Complete mandatory cybersecurity training covering password policies, phishing awareness, data handling, and incident reporting.",
		category: "compliance",
		assigneeRole: "employee",
		dayOffset: 2,
		estimatedMinutes: 90,
		isRequired: true,
		requiresApproval: false,
		order: 10,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440011",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Harassment prevention training",
		description:
			"Complete workplace harassment prevention and diversity/inclusion training module.",
		category: "compliance",
		assigneeRole: "employee",
		dayOffset: 3,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 11,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440012",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Team introductions and onboarding buddy assignment",
		description:
			"Meet team members in group setting. Assign onboarding buddy for first 30 days to answer questions and provide guidance.",
		category: "hr",
		assigneeRole: "direct_manager",
		dayOffset: 1,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 12,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440013",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Complete benefits enrollment",
		description:
			"Select health insurance, dental, vision, 401(k) contribution, and other benefits. Review PTO policy.",
		category: "documentation",
		assigneeRole: "employee",
		dayOffset: 5,
		estimatedMinutes: 90,
		isRequired: true,
		requiresApproval: false,
		order: 13,
	},

	// Week 2-3 tasks
	{
		id: "650e8400-e29b-41d4-a716-446655440014",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Role-specific technical training",
		description:
			"Complete training on tools, systems, and processes specific to job role. Includes hands-on labs and shadowing.",
		category: "technical",
		assigneeRole: "employee",
		dayOffset: 10,
		estimatedMinutes: 480, // 2 days
		isRequired: true,
		requiresApproval: false,
		order: 14,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440015",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Review codebase/systems architecture (if technical role)",
		description:
			"For technical roles: guided tour of codebase, architecture diagrams, deployment process, and dev environment setup.",
		category: "technical",
		assigneeRole: "direct_manager",
		dayOffset: 12,
		estimatedMinutes: 120,
		isRequired: false,
		requiresApproval: false,
		order: 15,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440016",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Shadow team members",
		description:
			"Spend time observing experienced team members to understand workflows, collaboration patterns, and best practices.",
		category: "training",
		assigneeRole: "employee",
		dayOffset: 14,
		estimatedMinutes: 240,
		isRequired: true,
		requiresApproval: false,
		order: 16,
	},

	// Week 4 (30-day) tasks
	{
		id: "650e8400-e29b-41d4-a716-446655440017",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "30-day check-in with manager",
		description:
			"Review progress on initial goals, discuss challenges, provide/receive feedback, and adjust expectations as needed.",
		category: "hr",
		assigneeRole: "direct_manager",
		dayOffset: 30,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 17,
	},
	{
		id: "650e8400-e29b-41d4-a716-446655440018",
		workflowTemplateId: WORKFLOW_IDS.onboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Complete onboarding survey",
		description:
			"Provide feedback on onboarding experience to help improve process for future hires.",
		category: "hr",
		assigneeRole: "employee",
		dayOffset: 30,
		estimatedMinutes: 15,
		isRequired: false,
		requiresApproval: false,
		order: 18,
	},
];

/**
 * Task Templates - Standard Offboarding
 */
export const seedTaskTemplatesOffboardingStandard: NewTaskTemplate[] = [
	// Immediate tasks (Day 0 - when notice given)
	{
		id: "750e8400-e29b-41d4-a716-446655440001",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Schedule exit interview",
		description:
			"Arrange meeting with HR to discuss reasons for departure, company culture feedback, and improvement suggestions.",
		category: "hr",
		assigneeRole: "hr_manager",
		dayOffset: 0,
		estimatedMinutes: 30,
		isRequired: true,
		requiresApproval: false,
		order: 1,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440002",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Create knowledge transfer plan",
		description:
			"Document critical tasks, ongoing projects, key contacts, passwords/credentials, and process documentation.",
		category: "documentation",
		assigneeRole: "employee",
		dayOffset: 0,
		estimatedMinutes: 120,
		isRequired: true,
		requiresApproval: true,
		order: 2,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440003",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Update team access permissions",
		description:
			"Review and document all systems, files, and resources employee has access to for transition planning.",
		category: "it_access",
		assigneeRole: "it_admin",
		dayOffset: 1,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 3,
	},

	// Week 1 tasks
	{
		id: "750e8400-e29b-41d4-a716-446655440004",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Hand over ongoing projects",
		description:
			"Transfer ownership of projects to designated team members. Provide status updates, next steps, and context.",
		category: "documentation",
		assigneeRole: "employee",
		dayOffset: 5,
		estimatedMinutes: 240,
		isRequired: true,
		requiresApproval: true,
		order: 4,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440005",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Train replacement/team members",
		description:
			"Conduct training sessions on key responsibilities, processes, and systems. Create training materials if needed.",
		category: "training",
		assigneeRole: "employee",
		dayOffset: 7,
		estimatedMinutes: 360, // 1.5 days
		isRequired: true,
		requiresApproval: false,
		order: 5,
	},

	// Final week tasks
	{
		id: "750e8400-e29b-41d4-a716-446655440006",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Complete exit interview",
		description:
			"Formal exit interview with HR covering experience, reasons for leaving, and constructive feedback.",
		category: "hr",
		assigneeRole: "hr_manager",
		dayOffset: 12,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: false,
		order: 6,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440007",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Return all company equipment",
		description:
			"Return laptop, monitor, keyboard, mouse, headset, access cards, keys, and any other company property.",
		category: "equipment",
		assigneeRole: "employee",
		dayOffset: 14,
		estimatedMinutes: 30,
		isRequired: true,
		requiresApproval: true,
		order: 7,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440008",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Revoke all system access",
		description:
			"Disable email account, Slack, VPN, application access, building access, and all other credentials.",
		category: "it_access",
		assigneeRole: "it_admin",
		dayOffset: 14,
		estimatedMinutes: 45,
		isRequired: true,
		requiresApproval: false,
		order: 8,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440009",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Process final paycheck",
		description:
			"Calculate final compensation including unused PTO, expenses, bonuses. Arrange direct deposit or check.",
		category: "hr",
		assigneeRole: "hr_manager",
		dayOffset: 14,
		estimatedMinutes: 60,
		isRequired: true,
		requiresApproval: true,
		order: 9,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440010",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Provide COBRA/benefits information",
		description:
			"Deliver documentation on health insurance continuation options, 401(k) rollover, and final benefits reconciliation.",
		category: "documentation",
		assigneeRole: "hr_manager",
		dayOffset: 14,
		estimatedMinutes: 30,
		isRequired: true,
		requiresApproval: false,
		order: 10,
	},
	{
		id: "750e8400-e29b-41d4-a716-446655440011",
		workflowTemplateId: WORKFLOW_IDS.offboarding_standard,
		organizationId: "00000000-0000-0000-0000-000000000001",
		title: "Send departure announcement",
		description:
			"Coordinate with manager on internal/external announcement timing and messaging about employee departure.",
		category: "hr",
		assigneeRole: "hr_manager",
		dayOffset: 14,
		estimatedMinutes: 30,
		isRequired: false,
		requiresApproval: true,
		order: 11,
	},
];

/**
 * Seed function - Onboarding & Offboarding
 */
export async function seedOnboardingOffboarding(organizationId: string) {
	console.log("Seeding onboarding & offboarding workflows...");

	// Update organization IDs in workflow templates
	const templatesWithOrgId = seedWorkflowTemplates.map((template) => ({
		...template,
		organizationId,
	}));

	// Update organization IDs in task templates
	const onboardingTasksWithOrgId = seedTaskTemplatesOnboardingStandard.map(
		(task) => ({
			...task,
			organizationId,
		})
	);

	const offboardingTasksWithOrgId = seedTaskTemplatesOffboardingStandard.map(
		(task) => ({
			...task,
			organizationId,
		})
	);

	// Insert workflow templates
	console.log("  • Creating workflow templates...");
	await db.insert(workflowTemplates).values(templatesWithOrgId);
	console.log(`    ✓ Created ${templatesWithOrgId.length} workflow templates`);

	// Insert task templates for standard onboarding
	console.log("  • Creating task templates for standard onboarding...");
	await db.insert(taskTemplates).values(onboardingTasksWithOrgId);
	console.log(
		`    ✓ Created ${onboardingTasksWithOrgId.length} onboarding task templates`
	);

	// Insert task templates for standard offboarding
	console.log("  • Creating task templates for standard offboarding...");
	await db.insert(taskTemplates).values(offboardingTasksWithOrgId);
	console.log(
		`    ✓ Created ${offboardingTasksWithOrgId.length} offboarding task templates`
	);

	console.log("✓ Onboarding & offboarding seed data complete!\n");
}
