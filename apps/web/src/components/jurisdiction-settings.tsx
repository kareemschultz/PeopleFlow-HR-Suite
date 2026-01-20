import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add01Icon as Plus } from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

interface Jurisdiction {
	id: string;
	name: string;
	code: string;
	country: string;
	currency: string;
	currencySymbol: string;
	fiscalYearStart: number;
	isActive: boolean;
}

export function JurisdictionSettings() {
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState("");
	const [countryCode, setCountryCode] = useState("");
	const [currency, setCurrency] = useState("");
	const [currencySymbol, setCurrencySymbol] = useState("");
	const [timezone, setTimezone] = useState("UTC");

	const queryClient = useQueryClient();
	const { data: jurisdictions, isLoading } = useQuery(
		orpc.taxJurisdictions.listJurisdictions.queryOptions({})
	);

	const createMutation = useMutation(
		orpc.taxJurisdictions.createJurisdiction.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.taxJurisdictions.listJurisdictions.key(),
				});
				setIsOpen(false);
				toast.success("Jurisdiction created successfully");
				resetForm();
			},
			onError: (error: Error) => {
				toast.error(`Failed to create jurisdiction: ${error.message}`);
			},
		})
	);

	const resetForm = () => {
		setName("");
		setCountryCode("");
		setCurrency("");
		setCurrencySymbol("");
		setTimezone("UTC");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate({
			name,
			code: countryCode,
			country: countryCode,
			currency,
			currencySymbol,
			timezone,
			fiscalYearStart: 1,
		});
	};

	function renderLoadingRows() {
		return Array.from({ length: 3 }).map((_, i) => (
			<TableRow key={`skeleton-${i.toString()}`}>
				<TableCell>
					<Skeleton className="h-4 w-[150px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[50px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[50px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[100px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[60px]" />
				</TableCell>
			</TableRow>
		));
	}

	function renderEmptyRow() {
		return (
			<TableRow>
				<TableCell
					className="h-24 text-center text-muted-foreground"
					colSpan={5}
				>
					No jurisdictions found. Add one to get started.
				</TableCell>
			</TableRow>
		);
	}

	function renderJurisdictionRows() {
		return (jurisdictions as Jurisdiction[])?.map((j) => (
			<TableRow key={j.id}>
				<TableCell className="font-medium">{j.name}</TableCell>
				<TableCell>{j.country}</TableCell>
				<TableCell>
					{j.currency} ({j.currencySymbol})
				</TableCell>
				<TableCell>Month {j.fiscalYearStart}</TableCell>
				<TableCell>
					<Badge variant={j.isActive ? "default" : "secondary"}>
						{j.isActive ? "Active" : "Inactive"}
					</Badge>
				</TableCell>
			</TableRow>
		));
	}

	function renderTableContent() {
		if (isLoading) {
			return renderLoadingRows();
		}
		if (!jurisdictions || jurisdictions.length === 0) {
			return renderEmptyRow();
		}
		return renderJurisdictionRows();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Tax Jurisdictions</h3>
					<p className="text-muted-foreground text-sm">
						Manage tax jurisdictions and their associated rules.
					</p>
				</div>
				<Dialog onOpenChange={setIsOpen} open={isOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Jurisdiction
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Tax Jurisdiction</DialogTitle>
						</DialogHeader>
						<form className="space-y-4" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. United Kingdom"
									required
									value={name}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="code">Country Code (ISO 2)</Label>
									<Input
										id="code"
										maxLength={2}
										onChange={(e) =>
											setCountryCode(e.target.value.toUpperCase())
										}
										placeholder="GB"
										required
										value={countryCode}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="timezone">Timezone</Label>
									<Input
										id="timezone"
										onChange={(e) => setTimezone(e.target.value)}
										placeholder="Europe/London"
										required
										value={timezone}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="currency">Currency (ISO 3)</Label>
									<Input
										id="currency"
										maxLength={3}
										onChange={(e) => setCurrency(e.target.value.toUpperCase())}
										placeholder="GBP"
										required
										value={currency}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="symbol">Symbol</Label>
									<Input
										id="symbol"
										onChange={(e) => setCurrencySymbol(e.target.value)}
										placeholder="£"
										required
										value={currencySymbol}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button disabled={createMutation.isPending} type="submit">
									{createMutation.isPending
										? "Creating..."
										: "Create Jurisdiction"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Country</TableHead>
							<TableHead>Currency</TableHead>
							<TableHead>Fiscal Year Start</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>{renderTableContent()}</TableBody>
				</Table>
			</div>
		</div>
	);
}
