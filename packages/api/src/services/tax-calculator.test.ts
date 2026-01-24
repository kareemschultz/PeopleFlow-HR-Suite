import { describe, expect, it } from "vitest";
import { evaluateFormula } from "./tax-calculator";

describe("Tax Calculator - Formula Evaluator", () => {
	describe("evaluateFormula", () => {
		it("should evaluate MAX function correctly", () => {
			const result = evaluateFormula("MAX(1000, 2000)", {});
			expect(result).toBe(2000);
		});

		it("should evaluate MIN function correctly", () => {
			const result = evaluateFormula("MIN(1000, 2000)", {});
			expect(result).toBe(1000);
		});

		it("should use variable substitution", () => {
			const result = evaluateFormula("{gross} * 0.1", { gross: 1000 });
			expect(result).toBe(100);
		});

		it("should handle MAX with variables", () => {
			const result = evaluateFormula("MAX(0, {bonus})", {
				bonus: 1000,
			});
			expect(result).toBe(1000);
		});

		it("should handle multiple variables", () => {
			const result = evaluateFormula("{gross} - {deduction}", {
				gross: 5000,
				deduction: 500,
			});
			expect(result).toBe(4500);
		});

		it("should handle MIN with variables", () => {
			const result = evaluateFormula("MIN({gross}, 10000)", {
				gross: 8000,
			});
			expect(result).toBe(8000);
		});

		it("should handle arithmetic operations", () => {
			const result = evaluateFormula("({base} + {bonus}) * {rate}", {
				base: 5000,
				bonus: 1000,
				rate: 0.1,
			});
			expect(result).toBe(600);
		});

		it("should handle edge case with zero values", () => {
			const result = evaluateFormula("MAX(0, {value})", { value: -100 });
			expect(result).toBe(0);
		});
	});
});
