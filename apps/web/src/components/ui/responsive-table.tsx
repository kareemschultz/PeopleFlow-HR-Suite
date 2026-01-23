/**
 * Responsive Table Component
 * Provides mobile-friendly table rendering with card layout fallback
 */

import type { ReactNode } from "react";

import { Card } from "./card";

interface Column<T> {
	key: string;
	header: string;
	render: (item: T) => ReactNode;
	hideOnMobile?: boolean;
	mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
	columns: Column<T>[];
	data: T[];
	keyExtractor: (item: T) => string;
	emptyMessage?: string;
	onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T>({
	columns,
	data,
	keyExtractor,
	emptyMessage = "No data available",
	onRowClick,
}: ResponsiveTableProps<T>) {
	if (data.length === 0) {
		return (
			<div className="py-12 text-center">
				<p className="text-muted-foreground">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<>
			{/* Desktop Table View */}
			<div className="hidden overflow-x-auto md:block">
				<table className="w-full">
					<thead className="border-border border-b">
						<tr>
							{columns.map((column) => (
								<th
									className="px-4 py-3 text-left font-semibold text-sm"
									key={column.key}
								>
									{column.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.map((item) => (
							<tr
								className={`border-border border-b transition-colors last:border-0 ${
									onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
								}`}
								key={keyExtractor(item)}
								onClick={() => onRowClick?.(item)}
							>
								{columns.map((column) => (
									<td className="px-4 py-3" key={column.key}>
										{column.render(item)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile Card View */}
			<div className="space-y-3 md:hidden">
				{data.map((item) => (
					<Card
						className={`p-4 ${onRowClick ? "cursor-pointer" : ""}`}
						key={keyExtractor(item)}
						onClick={() => onRowClick?.(item)}
					>
						<div className="space-y-2">
							{columns
								.filter((column) => !column.hideOnMobile)
								.map((column) => (
									<div className="flex justify-between gap-4" key={column.key}>
										<span className="font-medium text-muted-foreground text-sm">
											{column.mobileLabel ?? column.header}
										</span>
										<span className="text-right text-sm">
											{column.render(item)}
										</span>
									</div>
								))}
						</div>
					</Card>
				))}
			</div>
		</>
	);
}
