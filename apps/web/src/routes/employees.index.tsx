import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search01Icon } from "hugeicons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/employees/")({
	component: EmployeesPage,
});

function EmployeesPage() {
	const [search, setSearch] = useState("");
	const {
		organizationId,
		isLoading: isOrgLoading,
		hasOrganization,
	} = useOrganization();

	// Fetch employees list
	const { data: employees, isLoading: isEmployeesLoading } = useQuery({
		...orpc.employees.list.queryOptions({
			organizationId,
			search: search || undefined,
			limit: 50,
			offset: 0,
		}),
		enabled: hasOrganization,
	});

	const isLoading = isOrgLoading || isEmployeesLoading;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Employees</h1>
					<p className="text-muted-foreground">
						Manage your organization's employees
					</p>
				</div>
				<Link to="/employees/new">
					<Button>Add Employee</Button>
				</Link>
			</div>

			{/* Search */}
			<div className="mb-6">
				<div className="relative">
					<Search01Icon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
					<Input
						className="pl-10"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by name, email, or employee number..."
						type="search"
						value={search}
					/>
				</div>
			</div>

			{/* Employees Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{isLoading ? (
					// Loading skeletons
					Array.from({ length: 6 }).map((_, i) => (
						<Card className="p-6" key={i}>
							<div className="flex items-center gap-4">
								<Skeleton className="h-12 w-12 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-3 w-2/3" />
								</div>
							</div>
						</Card>
					))
				) : employees && employees.length > 0 ? (
					employees.map((employee) => (
						<Link
							key={employee.id}
							params={{ employeeId: employee.id }}
							to="/employees/$employeeId"
						>
							<Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
								<div className="flex items-start gap-4">
									{employee.avatar ? (
										<img
											alt={`${employee.firstName} ${employee.lastName}`}
											className="h-12 w-12 rounded-full object-cover"
											src={employee.avatar}
										/>
									) : (
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
											<span className="font-semibold text-lg text-primary">
												{employee.firstName.charAt(0)}
												{employee.lastName.charAt(0)}
											</span>
										</div>
									)}
									<div className="min-w-0 flex-1">
										<h3 className="truncate font-semibold">
											{employee.firstName} {employee.lastName}
										</h3>
										<p className="truncate text-muted-foreground text-sm">
											{employee.email}
										</p>
										<div className="mt-2 flex items-center gap-2">
											<span className="rounded bg-primary/10 px-2 py-1 text-primary text-xs">
												{employee.employeeNumber}
											</span>
											<span
												className={`rounded px-2 py-1 text-xs ${
													employee.employmentStatus === "active"
														? "bg-green-100 text-green-700"
														: "bg-gray-100 text-gray-700"
												}`}
											>
												{employee.employmentStatus}
											</span>
										</div>
									</div>
								</div>
							</Card>
						</Link>
					))
				) : (
					<div className="col-span-full py-12 text-center">
						<p className="text-muted-foreground">
							{search
								? "No employees found matching your search."
								: "No employees yet. Add your first employee to get started."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
