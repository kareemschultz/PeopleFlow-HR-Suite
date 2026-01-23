import { db, departments, employees, organizations, positions } from "../index";
import { seedGuyanaData } from "./guyana-tax-rules";
import { seedOnboardingOffboarding } from "../seed-onboarding-offboarding";

/**
 * Seed comprehensive sample data for development and testing
 *
 * This seed creates:
 * - 2 organizations (Guyana Tech Solutions, Caribbean HR Services)
 * - 6 departments across both orgs
 * - 8 positions
 * - 15 employees with varying salaries and employment statuses
 * - Guyana tax jurisdiction with 2024 rules
 */
export async function seedSampleData(): Promise<void> {
	console.log("🌱 Starting sample data seed...");

	// 1. Seed Guyana tax jurisdiction and rules
	console.log("\n📋 Seeding tax jurisdiction...");
	await seedGuyanaData(db);
	console.log("✅ Tax jurisdiction seeded");

	// Get the Guyana jurisdiction for organization reference
	const [guyanaJurisdiction] = await db.query.taxJurisdictions.findMany({
		where: (jurisdictions, { eq }) => eq(jurisdictions.code, "GY"),
		limit: 1,
	});

	if (!guyanaJurisdiction) {
		throw new Error("Failed to find Guyana jurisdiction after seeding");
	}

	// 2. Create Organizations
	console.log("\n🏢 Creating organizations...");
	const [org1, org2] = await db
		.insert(organizations)
		.values([
			{
				name: "Guyana Tech Solutions Inc.",
				slug: "guyana-tech",
				taxJurisdictionId: guyanaJurisdiction.id,
				timezone: "America/Guyana",
				currency: "GYD",
				fiscalYearStart: 1, // January
				settings: {
					payrollFrequency: "monthly",
					defaultWorkHours: 40,
					overtimeMultiplier: 1.5,
				},
			},
			{
				name: "Caribbean HR Services Ltd.",
				slug: "caribbean-hr",
				taxJurisdictionId: guyanaJurisdiction.id,
				timezone: "America/Guyana",
				currency: "GYD",
				fiscalYearStart: 1,
				settings: {
					payrollFrequency: "biweekly",
					defaultWorkHours: 40,
					overtimeMultiplier: 1.5,
				},
			},
		])
		.returning();

	if (!(org1 && org2)) {
		throw new Error("Failed to create organizations");
	}

	console.log(`✅ Created: ${org1.name}`);
	console.log(`✅ Created: ${org2.name}`);

	// 3. Create Departments
	console.log("\n🏗️  Creating departments...");
	const [deptEngineering, deptHR, deptFinance, deptSales, deptOps, deptIT] =
		await db
			.insert(departments)
			.values([
				// Guyana Tech Solutions
				{
					organizationId: org1.id,
					name: "Engineering",
					code: "ENG",
					description: "Software development and technical operations",
					location: "Georgetown, Guyana",
					isActive: true,
				},
				{
					organizationId: org1.id,
					name: "Human Resources",
					code: "HR",
					description: "People operations and talent management",
					location: "Georgetown, Guyana",
					isActive: true,
				},
				{
					organizationId: org1.id,
					name: "Finance",
					code: "FIN",
					description: "Financial operations and accounting",
					location: "Georgetown, Guyana",
					isActive: true,
				},
				// Caribbean HR Services
				{
					organizationId: org2.id,
					name: "Sales",
					code: "SAL",
					description: "Business development and client relations",
					location: "Georgetown, Guyana",
					isActive: true,
				},
				{
					organizationId: org2.id,
					name: "Operations",
					code: "OPS",
					description: "Service delivery and operations",
					location: "Georgetown, Guyana",
					isActive: true,
				},
				{
					organizationId: org2.id,
					name: "IT Support",
					code: "IT",
					description: "Technical support and infrastructure",
					location: "Georgetown, Guyana",
					isActive: true,
				},
			])
			.returning();

	console.log("✅ Created 6 departments across both organizations");

	// 4. Create Positions
	console.log("\n💼 Creating positions...");
	const positionsList = await db
		.insert(positions)
		.values([
			// Engineering positions (Org 1)
			{
				organizationId: org1.id,
				departmentId: deptEngineering?.id,
				title: "Senior Software Engineer",
				code: "SSE",
				level: "senior",
				description:
					"Lead developer responsible for architecture and mentoring",
				isActive: true,
			},
			{
				organizationId: org1.id,
				departmentId: deptEngineering?.id,
				title: "Software Engineer",
				code: "SE",
				level: "mid",
				description: "Full-stack developer",
				isActive: true,
			},
			// HR positions (Org 1)
			{
				organizationId: org1.id,
				departmentId: deptHR?.id,
				title: "HR Manager",
				code: "HRM",
				level: "manager",
				description: "Manages HR operations and team",
				isActive: true,
			},
			// Finance positions (Org 1)
			{
				organizationId: org1.id,
				departmentId: deptFinance?.id,
				title: "Financial Controller",
				code: "FC",
				level: "senior",
				description: "Oversees financial operations",
				isActive: true,
			},
			// Sales positions (Org 2)
			{
				organizationId: org2.id,
				departmentId: deptSales?.id,
				title: "Sales Director",
				code: "SD",
				level: "director",
				description: "Leads sales strategy and team",
				isActive: true,
			},
			{
				organizationId: org2.id,
				departmentId: deptSales?.id,
				title: "Account Manager",
				code: "AM",
				level: "mid",
				description: "Manages client relationships",
				isActive: true,
			},
			// Operations positions (Org 2)
			{
				organizationId: org2.id,
				departmentId: deptOps?.id,
				title: "Operations Coordinator",
				code: "OC",
				level: "junior",
				description: "Coordinates operational activities",
				isActive: true,
			},
			// IT positions (Org 2)
			{
				organizationId: org2.id,
				departmentId: deptIT?.id,
				title: "IT Support Specialist",
				code: "ITS",
				level: "mid",
				description: "Provides technical support",
				isActive: true,
			},
		])
		.returning();

	console.log(`✅ Created ${positionsList.length} positions`);

	// 5. Create Employees
	console.log("\n👥 Creating employees...");
	const employeesList = await db
		.insert(employees)
		.values([
			// Guyana Tech Solutions - Engineering
			{
				organizationId: org1.id,
				departmentId: deptEngineering?.id,
				positionId: positionsList[0]?.id, // Senior Software Engineer
				employeeNumber: "GTS-001",
				firstName: "Rajesh",
				lastName: "Kumar",
				email: "rajesh.kumar@guyanatechsolutions.com",
				phone: "+592-222-1001",
				dateOfBirth: new Date("1985-03-15"),
				gender: "male",
				nationalId: "850315-1234",
				taxId: "TAX-GY-001",
				hireDate: new Date("2020-01-15"),
				startDate: new Date("2020-01-15"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 450_000, // G$450,000/month (above tax threshold)
				allowances: {
					housing: 50_000,
					transport: 30_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "123456789",
					branchCode: "001",
				},
			},
			{
				organizationId: org1.id,
				departmentId: deptEngineering?.id,
				positionId: positionsList[1]?.id, // Software Engineer
				employeeNumber: "GTS-002",
				firstName: "Maria",
				lastName: "Singh",
				email: "maria.singh@guyanatechsolutions.com",
				phone: "+592-222-1002",
				dateOfBirth: new Date("1990-07-22"),
				gender: "female",
				nationalId: "900722-5678",
				taxId: "TAX-GY-002",
				hireDate: new Date("2021-06-01"),
				startDate: new Date("2021-06-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 320_000, // G$320,000/month
				allowances: {
					transport: 20_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "123456790",
					branchCode: "001",
				},
			},
			{
				organizationId: org1.id,
				departmentId: deptEngineering?.id,
				positionId: positionsList[1]?.id, // Software Engineer
				employeeNumber: "GTS-003",
				firstName: "David",
				lastName: "Chen",
				email: "david.chen@guyanatechsolutions.com",
				phone: "+592-222-1003",
				dateOfBirth: new Date("1992-11-08"),
				gender: "male",
				nationalId: "921108-9012",
				taxId: "TAX-GY-003",
				hireDate: new Date("2022-03-15"),
				startDate: new Date("2022-03-15"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 280_000, // G$280,000/month
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Scotia Bank",
					accountNumber: "987654321",
					branchCode: "002",
				},
			},
			// Guyana Tech Solutions - HR
			{
				organizationId: org1.id,
				departmentId: deptHR?.id,
				positionId: positionsList[2]?.id, // HR Manager
				employeeNumber: "GTS-004",
				firstName: "Priya",
				lastName: "Ramjattan",
				email: "priya.ramjattan@guyanatechsolutions.com",
				phone: "+592-222-1004",
				dateOfBirth: new Date("1987-05-12"),
				gender: "female",
				nationalId: "870512-3456",
				taxId: "TAX-GY-004",
				hireDate: new Date("2019-09-01"),
				startDate: new Date("2019-09-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 380_000, // G$380,000/month
				allowances: {
					professional: 25_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "123456791",
					branchCode: "001",
				},
			},
			// Guyana Tech Solutions - Finance
			{
				organizationId: org1.id,
				departmentId: deptFinance?.id,
				positionId: positionsList[3]?.id, // Financial Controller
				employeeNumber: "GTS-005",
				firstName: "Michael",
				lastName: "Persaud",
				email: "michael.persaud@guyanatechsolutions.com",
				phone: "+592-222-1005",
				dateOfBirth: new Date("1983-09-25"),
				gender: "male",
				nationalId: "830925-7890",
				taxId: "TAX-GY-005",
				hireDate: new Date("2018-04-01"),
				startDate: new Date("2018-04-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 520_000, // G$520,000/month (high earner)
				allowances: {
					professional: 40_000,
					transport: 30_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Demerara Bank",
					accountNumber: "555123456",
					branchCode: "003",
				},
			},
			// Caribbean HR Services - Sales
			{
				organizationId: org2.id,
				departmentId: deptSales?.id,
				positionId: positionsList[4]?.id, // Sales Director
				employeeNumber: "CHS-001",
				firstName: "Sarah",
				lastName: "Thompson",
				email: "sarah.thompson@caribbeanhr.com",
				phone: "+592-333-2001",
				dateOfBirth: new Date("1980-12-10"),
				gender: "female",
				nationalId: "801210-1111",
				taxId: "TAX-GY-006",
				hireDate: new Date("2017-02-01"),
				startDate: new Date("2017-02-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 600_000, // G$600,000/month (senior executive)
				allowances: {
					vehicle: 80_000,
					entertainment: 40_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "888111222",
					branchCode: "001",
				},
			},
			{
				organizationId: org2.id,
				departmentId: deptSales?.id,
				positionId: positionsList[5]?.id, // Account Manager
				employeeNumber: "CHS-002",
				firstName: "Kevin",
				lastName: "Lall",
				email: "kevin.lall@caribbeanhr.com",
				phone: "+592-333-2002",
				dateOfBirth: new Date("1988-06-18"),
				gender: "male",
				nationalId: "880618-2222",
				taxId: "TAX-GY-007",
				hireDate: new Date("2019-08-15"),
				startDate: new Date("2019-08-15"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 350_000, // G$350,000/month
				allowances: {
					transport: 25_000,
					communication: 15_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Scotia Bank",
					accountNumber: "777888999",
					branchCode: "002",
				},
			},
			{
				organizationId: org2.id,
				departmentId: deptSales?.id,
				positionId: positionsList[5]?.id, // Account Manager
				employeeNumber: "CHS-003",
				firstName: "Lisa",
				lastName: "Mohammed",
				email: "lisa.mohammed@caribbeanhr.com",
				phone: "+592-333-2003",
				dateOfBirth: new Date("1993-04-05"),
				gender: "female",
				nationalId: "930405-3333",
				taxId: "TAX-GY-008",
				hireDate: new Date("2021-11-01"),
				startDate: new Date("2021-11-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 300_000, // G$300,000/month
				allowances: {
					transport: 20_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "444555666",
					branchCode: "001",
				},
			},
			// Caribbean HR Services - Operations
			{
				organizationId: org2.id,
				departmentId: deptOps?.id,
				positionId: positionsList[6]?.id, // Operations Coordinator
				employeeNumber: "CHS-004",
				firstName: "Ryan",
				lastName: "Griffith",
				email: "ryan.griffith@caribbeanhr.com",
				phone: "+592-333-2004",
				dateOfBirth: new Date("1995-08-30"),
				gender: "male",
				nationalId: "950830-4444",
				taxId: "TAX-GY-009",
				hireDate: new Date("2022-05-01"),
				startDate: new Date("2022-05-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 220_000, // G$220,000/month (below tax threshold)
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Demerara Bank",
					accountNumber: "111222333",
					branchCode: "003",
				},
			},
			{
				organizationId: org2.id,
				departmentId: deptOps?.id,
				positionId: positionsList[6]?.id, // Operations Coordinator
				employeeNumber: "CHS-005",
				firstName: "Amanda",
				lastName: "Williams",
				email: "amanda.williams@caribbeanhr.com",
				phone: "+592-333-2005",
				dateOfBirth: new Date("1994-02-14"),
				gender: "female",
				nationalId: "940214-5555",
				taxId: "TAX-GY-010",
				hireDate: new Date("2022-07-15"),
				startDate: new Date("2022-07-15"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 240_000, // G$240,000/month
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Scotia Bank",
					accountNumber: "222333444",
					branchCode: "002",
				},
			},
			// Caribbean HR Services - IT
			{
				organizationId: org2.id,
				departmentId: deptIT?.id,
				positionId: positionsList[7]?.id, // IT Support Specialist
				employeeNumber: "CHS-006",
				firstName: "Jason",
				lastName: "Rampersaud",
				email: "jason.rampersaud@caribbeanhr.com",
				phone: "+592-333-2006",
				dateOfBirth: new Date("1991-10-22"),
				gender: "male",
				nationalId: "911022-6666",
				taxId: "TAX-GY-011",
				hireDate: new Date("2020-03-01"),
				startDate: new Date("2020-03-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "active",
				baseSalary: 280_000, // G$280,000/month
				allowances: {
					technical: 20_000,
				},
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "333444555",
					branchCode: "001",
				},
			},
			// Part-time employee for variety
			{
				organizationId: org1.id,
				departmentId: deptEngineering?.id,
				positionId: positionsList[1]?.id, // Software Engineer
				employeeNumber: "GTS-006",
				firstName: "Sophia",
				lastName: "Chang",
				email: "sophia.chang@guyanatechsolutions.com",
				phone: "+592-222-1006",
				dateOfBirth: new Date("1996-03-20"),
				gender: "female",
				nationalId: "960320-7777",
				taxId: "TAX-GY-012",
				hireDate: new Date("2023-01-15"),
				startDate: new Date("2023-01-15"), // Same as hire date
				employmentType: "part_time",
				employmentStatus: "active",
				baseSalary: 150_000, // G$150,000/month (part-time)
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "666777888",
					branchCode: "001",
				},
			},
			// Contractor for variety
			{
				organizationId: org2.id,
				departmentId: deptIT?.id,
				positionId: positionsList[7]?.id, // IT Support Specialist
				employeeNumber: "CHS-007",
				firstName: "Marcus",
				lastName: "Jones",
				email: "marcus.jones@caribbeanhr.com",
				phone: "+592-333-2007",
				dateOfBirth: new Date("1989-07-07"),
				gender: "male",
				nationalId: "890707-8888",
				taxId: "TAX-GY-013",
				hireDate: new Date("2023-06-01"),
				startDate: new Date("2023-06-01"), // Same as hire date
				employmentType: "contractor",
				employmentStatus: "active",
				baseSalary: 180_000, // G$180,000/month (contractor rate)
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Demerara Bank",
					accountNumber: "999000111",
					branchCode: "003",
				},
			},
			// Inactive employee (terminated)
			{
				organizationId: org1.id,
				departmentId: deptFinance?.id,
				positionId: positionsList[3]?.id, // Financial Controller
				employeeNumber: "GTS-007",
				firstName: "Robert",
				lastName: "Davies",
				email: "robert.davies@guyanatechsolutions.com",
				phone: "+592-222-1007",
				dateOfBirth: new Date("1975-11-30"),
				gender: "male",
				nationalId: "751130-9999",
				taxId: "TAX-GY-014",
				hireDate: new Date("2015-01-01"),
				startDate: new Date("2015-01-01"), // Same as hire date
				terminationDate: new Date("2023-12-31"),
				employmentType: "full_time",
				employmentStatus: "terminated",
				baseSalary: 480_000,
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Republic Bank",
					accountNumber: "000111222",
					branchCode: "001",
				},
			},
			// On leave employee
			{
				organizationId: org2.id,
				departmentId: deptSales?.id,
				positionId: positionsList[5]?.id, // Account Manager
				employeeNumber: "CHS-008",
				firstName: "Jennifer",
				lastName: "Phillips",
				email: "jennifer.phillips@caribbeanhr.com",
				phone: "+592-333-2008",
				dateOfBirth: new Date("1986-01-25"),
				gender: "female",
				nationalId: "860125-0000",
				taxId: "TAX-GY-015",
				hireDate: new Date("2018-09-01"),
				startDate: new Date("2018-09-01"), // Same as hire date
				employmentType: "full_time",
				employmentStatus: "on_leave",
				baseSalary: 330_000,
				paymentFrequency: "monthly",
				bankDetails: {
					bankName: "Scotia Bank",
					accountNumber: "111222333",
					branchCode: "002",
				},
			},
		])
		.returning();

	console.log(`✅ Created ${employeesList.length} employees`);

	// 6. Seed Onboarding & Offboarding Workflows
	console.log("\n📝 Seeding onboarding & offboarding workflows...");
	await seedOnboardingOffboarding();

	// Summary
	console.log("\n✨ Sample data seed completed successfully!");
	console.log("\n📊 Summary:");
	console.log("   • 1 tax jurisdiction (Guyana)");
	console.log("   • 2 organizations");
	console.log("   • 6 departments");
	console.log("   • 8 positions");
	console.log(`   • ${employeesList.length} employees`);
	console.log(
		`     - ${employeesList.filter((e) => e.employmentStatus === "active").length} active`
	);
	console.log(
		`     - ${employeesList.filter((e) => e.employmentType === "full_time").length} full-time`
	);
	console.log(
		`     - ${employeesList.filter((e) => e.employmentType === "part_time").length} part-time`
	);
	console.log(
		`     - ${employeesList.filter((e) => e.employmentType === "contractor").length} contractors`
	);
	console.log(
		`     - ${employeesList.filter((e) => e.employmentStatus === "terminated").length} terminated`
	);
	console.log(
		`     - ${employeesList.filter((e) => e.employmentStatus === "on_leave").length} on leave`
	);
	console.log(
		`\n💰 Salary range: G$${Math.min(...employeesList.map((e) => e.baseSalary)).toLocaleString()} - G$${Math.max(...employeesList.map((e) => e.baseSalary)).toLocaleString()}/month`
	);
}

// Allow running directly with: bun run src/seeds/sample-data.ts
if (import.meta.main) {
	seedSampleData()
		.then(() => {
			console.log("\n✅ Seed completed!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Seed failed:", error);
			process.exit(1);
		});
}
