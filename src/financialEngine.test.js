const { calculateKPIs, compareInvestment } = require('./financialEngine');

describe('Financial Engine', () => {
  describe('calculateKPIs', () => {
    it('should calculate KPIs correctly with valid data', () => {
      const data = {
        revenue: 1000,
        grossProfit: 400,
        ebitda: 200,
        ebit: 150,
        netIncome: 100,
        totalAssets: 2000,
        equity: 1000,
        currentLiabilities: 500,
        cashflowOps: 300,
        capex: 50,
        interestExpense: 20,
        taxRate: 0.25,
        cash: 100,
        shortTermDebt: 200,
        longTermDebt: 300
      };

      const kpis = calculateKPIs(data);

      // ROE = 100 / 1000 = 10%
      expect(kpis.roe).toBeCloseTo(10);
      // ROA = 100 / 2000 = 5%
      expect(kpis.roa).toBeCloseTo(5);
      // ROCE = 150 / (2000 - 500) = 150 / 1500 = 10%
      expect(kpis.roce).toBeCloseTo(10);
      // NOPAT = 150 * (1 - 0.25) = 112.5
      expect(kpis.nopat).toBeCloseTo(112.5);
      // InvestedCapital = equity + totalDebt = 1000 + 200 + 300 = 1500
      expect(kpis.investedCapital).toBe(1500);
      // ROIC = 112.5 / 1500 = 0.075 -> 7.5%
      expect(kpis.roic).toBeCloseTo(7.5, 2);
      // FreeCashFlow = 300 + 20 - (20 * 0.25) - 50 = 300 + 20 - 5 - 50 = 265
      expect(kpis.freeCashFlow).toBe(265);
      // Gross Margin = 400 / 1000 = 40%
      expect(kpis.grossMargin).toBeCloseTo(40);
      // EBITDA Margin = 200 / 1000 = 20%
      expect(kpis.ebitdaMargin).toBeCloseTo(20);
      // Net Margin = 100 / 1000 = 10%
      expect(kpis.netMargin).toBeCloseTo(10);
    });

    it('should handle division by zero gracefully', () => {
      const data = {
        revenue: 0,
        equity: 0,
        totalAssets: 0,
        currentLiabilities: 0, // for ROCE denominator
        ebit: 100 // ensure numerator is not 0 to test div by zero
      };

      const kpis = calculateKPIs(data);

      expect(kpis.roe).toBe(0);
      expect(kpis.roa).toBe(0);
      expect(kpis.grossMargin).toBe(0);
      // ROCE denominator = 0 - 0 = 0
      expect(kpis.roce).toBe(0);
    });

    it('should handle missing data by defaulting to 0', () => {
      const kpis = calculateKPIs({});
      expect(kpis.roe).toBe(0);
      expect(kpis.roa).toBe(0);
      expect(kpis.roce).toBe(0);
      expect(kpis.nopat).toBe(0);
      expect(kpis.investedCapital).toBe(0);
      expect(kpis.roic).toBe(0);
      expect(kpis.freeCashFlow).toBe(0);
      expect(kpis.grossMargin).toBe(0);
      expect(kpis.ebitdaMargin).toBe(0);
      expect(kpis.netMargin).toBe(0);
    });
  });

  describe('compareInvestment', () => {
    it('should calculate deviations correctly', () => {
      const actual = { revenue: 120, ebitda: 60, netIncome: 15 };
      const investment = { revenue: 100, ebitda: 50, netIncome: 10 };

      const comparison = compareInvestment(actual, investment);

      // Revenue: (120 - 100) = 20, (20/100)*100 = 20%
      expect(comparison.revenue.deviation).toBe(20);
      expect(comparison.revenue.percent).toBe(20);

      // EBITDA: (60 - 50) = 10, (10/50)*100 = 20%
      expect(comparison.ebitda.deviation).toBe(10);
      expect(comparison.ebitda.percent).toBe(20);

      // Net Income: (15 - 10) = 5, (5/10)*100 = 50%
      expect(comparison.netIncome.deviation).toBe(5);
      expect(comparison.netIncome.percent).toBe(50);
    });

    it('should handle zero in investment case to avoid infinity', () => {
      const actual = { revenue: 100 };
      const investment = { revenue: 0 };

      const comparison = compareInvestment(actual, investment);

      // Deviation Amount = 100 - 0 = 100
      expect(comparison.revenue.deviation).toBe(100);
      expect(comparison.revenue.percent).toBe(0); // Percentage is incalculable, 0 is a safe fallback
    });

    it('should handle missing inputs', () => {
        const comparison = compareInvestment({}, {});
        expect(comparison.revenue.deviation).toBe(0);
        expect(comparison.revenue.percent).toBe(0);
    });
  });
});