from typing import List, Dict, Any

# Bangladeshi Land Unit standard conversions (decimal baseline)
DECIMAL_PER_BIGHA = 33.0
DECIMAL_PER_KATHA = 1.65
DECIMAL_PER_ACRE = 100.0
DECIMAL_PER_HECTARE = 247.1

class ExpenseService:
    @staticmethod
    def normalize_to_bigha(area_value: float, unit: str) -> float:
        unit = unit.lower()
        if "bigha" in unit or "বিঘা" in unit:
            return area_value
        elif "decimal" in unit or "শতক" in unit or "শতাংশ" in unit:
            return area_value / DECIMAL_PER_BIGHA
        elif "katha" in unit or "কাঠা" in unit:
            return (area_value * DECIMAL_PER_KATHA) / DECIMAL_PER_BIGHA
        elif "acre" in unit or "একর" in unit:
            return (area_value * DECIMAL_PER_ACRE) / DECIMAL_PER_BIGHA
        return area_value

    @staticmethod
    def calculate_farm_financials(expenses: List[Dict[str, Any]], harvests: List[Dict[str, Any]], land_bigha: float = 3.5) -> Dict[str, Any]:
        total_expense = sum(e.get("amount", 0.0) for e in expenses)
        total_income = sum(h.get("total_sale_amount", 0.0) for h in harvests)
        total_yield_kg = sum(h.get("crop_yield_kg", 0.0) for h in harvests)

        # Categorize expenses
        category_breakdown = {}
        for exp in expenses:
            cat = exp.get("category", "অন্যান্য")
            category_breakdown[cat] = category_breakdown.get(cat, 0.0) + exp.get("amount", 0.0)

        # Unit economics
        land_bigha = max(land_bigha, 0.01)
        cost_per_bigha = round(total_expense / land_bigha, 2)
        cost_per_decimal = round(total_expense / (land_bigha * DECIMAL_PER_BIGHA), 2)
        
        net_profit = round(total_income - total_expense, 2)
        roi_percent = round((net_profit / total_expense * 100), 1) if total_expense > 0 else 0.0
        
        # Break-even price per kg / maund (1 maund = 40 kg in Bangladesh)
        break_even_per_kg = round(total_expense / total_yield_kg, 2) if total_yield_kg > 0 else 0.0
        break_even_per_maund = round(break_even_per_kg * 40.0, 2)

        return {
            "total_land_bigha": land_bigha,
            "total_land_decimal": round(land_bigha * DECIMAL_PER_BIGHA, 1),
            "total_expense_bdt": round(total_expense, 2),
            "total_income_bdt": round(total_income, 2),
            "net_profit_loss_bdt": net_profit,
            "is_profitable": net_profit >= 0,
            "roi_percent": roi_percent,
            "cost_per_bigha_bdt": cost_per_bigha,
            "cost_per_decimal_bdt": cost_per_decimal,
            "total_yield_kg": total_yield_kg,
            "break_even_per_kg": break_even_per_kg,
            "break_even_per_maund": break_even_per_maund,
            "category_breakdown": category_breakdown
        }
