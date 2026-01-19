import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building06, Search } from "hugeicons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "../utils/orpc";

export const Route = createFileRoute("/departments/")({
	component: DepartmentsPage,
});

function DepartmentsPage() {
	const [search, setSearch] = useState("");
	const [organizationId] = useState(""); // TODO: Get from auth context

	// Fetch departments list
	const { data: departments, isLoading } = useQuery(
		orpc.departments.list.queryOptions({
			organizationId,
			search: search || undefined,
			limit: 50,
			offset: 0,
		})
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Departments</h1>
					<p className="text-muted-foreground">
						Manage your organization's departments
					</p>
				</div>
				<Link to="/departments/new">
					<Button>Add Department</Button>
				</Link>
			</div>

			{/* Search */}
			<div className="mb-6">
				<div className="relative">
					<Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
					<Input
						className="pl-10"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search departments..."
						type="search"
						value={search}
					/>
				</div>
			</div>

			{/* Departments Grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{isLoading ? (
					// Loading skeletons
					Array.from({ length: 6 }).map((_, i) => (
						<Card className="p-6" key={i}>
							<div className="flex items-center gap-4">
								<Skeleton className="h-12 w-12 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-3 w-2/3" />
								</div>
							</div>
						</Card>
					))
				) : departments && departments.length > 0 ? (
					departments.map((department) => (
						<Link
							key={department.id}
							params={{ departmentId: department.id }}
							to="/departments/$departmentId"
						>
							<Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
								<div className="flex items-start gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<Building06 className="h-6 w-6 text-primary" />
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="truncate font-semibold">
											{department.name}
										</h3>
										<p className="truncate text-muted-foreground text-sm">
											{department.code}
										</p>
										{department.description && (
											<p className="mt-2 line-clamp-2 text-muted-foreground text-xs">
												{department.description}
											</p>
										)}
										<div className="mt-2 flex items-center gap-2">
											{department.location && (
												<span className="rounded bg-primary/10 px-2 py-1 text-primary text-xs">
													{department.location}
												</span>
											)}
											<span
												className={`rounded px-2 py-1 text-xs ${
													department.isActive
														? "bg-green-100 text-green-700"
														: "bg-gray-100 text-gray-700"
												}`}
											>
												{department.isActive ? "Active" : "Inactive"}
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
								? "No departments found matching your search."
								: "No departments yet. Add your first department to get started."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
