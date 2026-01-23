import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	Delete02Icon,
	PlusSignIcon,
} from "hugeicons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TaxBand {
	order: number;
	name: string;
	minAmount: number;
	maxAmount: number | null;
	rate: number;
	flatAmount?: number;
}

interface TaxBandEditorProps {
	/**
	 * Array of tax bands to edit
	 */
	bands: TaxBand[];

	/**
	 * Callback when bands are modified
	 */
	onChange: (bands: TaxBand[]) => void;

	/**
	 * Currency symbol to display
	 */
	currencySymbol?: string;

	/**
	 * Whether the editor is read-only
	 */
	readOnly?: boolean;

	/**
	 * Optional className for styling
	 */
	className?: string;
}

export function TaxBandEditor({
	bands: initialBands,
	onChange,
	currencySymbol = "$",
	readOnly = false,
	className,
}: TaxBandEditorProps) {
	const [bands, setBands] = useState<TaxBand[]>(
		initialBands.sort((a, b) => a.order - b.order)
	);

	const updateBand = (index: number, updates: Partial<TaxBand>) => {
		const newBands = [...bands];
		newBands[index] = { ...newBands[index], ...updates };
		setBands(newBands);
		onChange(newBands);
	};

	const addBand = () => {
		const lastBand = bands.at(-1);
		const newOrder =
			bands.length > 0 ? Math.max(...bands.map((b) => b.order)) + 1 : 1;
		const newMinAmount =
			lastBand?.maxAmount !== null ? (lastBand?.maxAmount ?? 0) + 1 : 0;

		const newBand: TaxBand = {
			order: newOrder,
			name: `Band ${newOrder}`,
			minAmount: newMinAmount,
			maxAmount: null,
			rate: 0,
		};

		const newBands = [...bands, newBand];
		setBands(newBands);
		onChange(newBands);
	};

	const removeBand = (index: number) => {
		const newBands = bands.filter((_, i) => i !== index);
		// Re-order remaining bands
		const reorderedBands = newBands.map((band, i) => ({
			...band,
			order: i + 1,
		}));
		setBands(reorderedBands);
		onChange(reorderedBands);
	};

	const moveBandUp = (index: number) => {
		if (index === 0) {
			return;
		}

		const newBands = [...bands];
		[newBands[index - 1], newBands[index]] = [
			newBands[index],
			newBands[index - 1],
		];

		// Update order values
		newBands[index - 1].order = index;
		newBands[index].order = index + 1;

		setBands(newBands);
		onChange(newBands);
	};

	const moveBandDown = (index: number) => {
		if (index === bands.length - 1) {
			return;
		}

		const newBands = [...bands];
		[newBands[index], newBands[index + 1]] = [
			newBands[index + 1],
			newBands[index],
		];

		// Update order values
		newBands[index].order = index + 1;
		newBands[index + 1].order = index + 2;

		setBands(newBands);
		onChange(newBands);
	};

	const formatCurrency = (amount: number | null) => {
		if (amount === null) {
			return "Unlimited";
		}
		return `${currencySymbol}${amount.toLocaleString()}`;
	};

	const calculateTaxForIncome = (income: number): number => {
		let totalTax = 0;

		for (const band of bands) {
			if (income <= band.minAmount) {
				break;
			}

			const taxableInThisBand =
				band.maxAmount === null
					? income - band.minAmount
					: Math.min(income - band.minAmount, band.maxAmount - band.minAmount);

			if (taxableInThisBand > 0) {
				const bandTax = taxableInThisBand * band.rate + (band.flatAmount ?? 0);
				totalTax += bandTax;
			}
		}

		return totalTax;
	};

	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">Tax Bands</h3>
					<p className="text-muted-foreground text-sm">
						Configure progressive tax rates for different income levels
					</p>
				</div>
				{!readOnly && (
					<Button onClick={addBand} size="sm">
						<PlusSignIcon className="mr-2 h-4 w-4" />
						Add Band
					</Button>
				)}
			</div>

			{bands.length === 0 ? (
				<Card className="p-12 text-center">
					<p className="text-muted-foreground">No tax bands configured</p>
					{!readOnly && (
						<Button className="mt-4" onClick={addBand} variant="outline">
							<PlusSignIcon className="mr-2 h-4 w-4" />
							Add First Band
						</Button>
					)}
				</Card>
			) : (
				<div className="space-y-3">
					{bands.map((band, index) => (
						<Card className="p-4" key={band.order}>
							<div className="space-y-4">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
											{index + 1}
										</div>
										<div>
											<p className="font-medium">{band.name}</p>
											<p className="text-muted-foreground text-xs">
												{formatCurrency(band.minAmount)} -{" "}
												{formatCurrency(band.maxAmount)}
											</p>
										</div>
									</div>

									{!readOnly && (
										<div className="flex items-center gap-1">
											<Button
												disabled={index === 0}
												onClick={() => moveBandUp(index)}
												size="icon"
												variant="ghost"
											>
												<ArrowUp01Icon className="h-4 w-4" />
											</Button>
											<Button
												disabled={index === bands.length - 1}
												onClick={() => moveBandDown(index)}
												size="icon"
												variant="ghost"
											>
												<ArrowDown01Icon className="h-4 w-4" />
											</Button>
											<Button
												onClick={() => removeBand(index)}
												size="icon"
												variant="ghost"
											>
												<Delete02Icon className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									)}
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
									<div className="space-y-2">
										<Label htmlFor={`name-${band.order}`}>Band Name</Label>
										<Input
											disabled={readOnly}
											id={`name-${band.order}`}
											onChange={(e) =>
												updateBand(index, { name: e.target.value })
											}
											value={band.name}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor={`minAmount-${band.order}`}>
											Min Amount ({currencySymbol})
										</Label>
										<Input
											disabled={readOnly}
											id={`minAmount-${band.order}`}
											min="0"
											onChange={(e) =>
												updateBand(index, {
													minAmount: Number.parseFloat(e.target.value) || 0,
												})
											}
											step="0.01"
											type="number"
											value={band.minAmount}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor={`maxAmount-${band.order}`}>
											Max Amount ({currencySymbol})
										</Label>
										<Input
											disabled={readOnly}
											id={`maxAmount-${band.order}`}
											min={band.minAmount}
											onChange={(e) => {
												const value = e.target.value;
												updateBand(index, {
													maxAmount:
														value === "" ? null : Number.parseFloat(value),
												});
											}}
											placeholder="Unlimited"
											step="0.01"
											type="number"
											value={band.maxAmount ?? ""}
										/>
										<p className="text-muted-foreground text-xs">
											Leave empty for unlimited
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor={`rate-${band.order}`}>Tax Rate (%)</Label>
										<Input
											disabled={readOnly}
											id={`rate-${band.order}`}
											max="100"
											min="0"
											onChange={(e) =>
												updateBand(index, {
													rate: Number.parseFloat(e.target.value) / 100 || 0,
												})
											}
											step="0.01"
											type="number"
											value={(band.rate * 100).toFixed(2)}
										/>
									</div>

									{band.flatAmount !== undefined && (
										<div className="space-y-2">
											<Label htmlFor={`flatAmount-${band.order}`}>
												Flat Amount ({currencySymbol})
											</Label>
											<Input
												disabled={readOnly}
												id={`flatAmount-${band.order}`}
												min="0"
												onChange={(e) =>
													updateBand(index, {
														flatAmount: Number.parseFloat(e.target.value) || 0,
													})
												}
												step="0.01"
												type="number"
												value={band.flatAmount}
											/>
											<p className="text-muted-foreground text-xs">
												Fixed amount added to band tax
											</p>
										</div>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Tax Calculator Preview */}
			{bands.length > 0 && (
				<Card className="p-4">
					<h4 className="mb-3 font-semibold text-sm">Quick Tax Calculator</h4>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						{[50_000, 100_000, 200_000].map((testIncome) => (
							<div className="rounded-lg border p-3" key={testIncome}>
								<p className="text-muted-foreground text-xs">
									Income: {formatCurrency(testIncome)}
								</p>
								<p className="mt-1 font-semibold">
									Tax: {formatCurrency(calculateTaxForIncome(testIncome))}
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									Effective Rate:{" "}
									{(
										(calculateTaxForIncome(testIncome) / testIncome) *
										100
									).toFixed(2)}
									%
								</p>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
