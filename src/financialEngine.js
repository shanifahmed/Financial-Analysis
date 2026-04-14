const calculateKPIs = (data) => {
  // Helper to safely handle division by zero
  const safeDiv = (a, b) => (b === 0 || !b ? 0 : a / b);

  // Destructure with defaults to 0
  const {
    revenue = 0,
    grossProfit = 0,
    ebitda = 0,
    ebit = 0,
    netIncome = 0,
    totalAssets = 0,
    equity = 0,
    currentLiabilities = 0,
    cashflowOps = 0,
    capex = 0,
    interestExpense = 0,
    taxRate = 0,
    cash = 0,
    nonInterestCurrentLiabilities = 0,
    depreciation = 0,
    shortTermDebt = 0,
    longTermDebt = 0
  } = data;

  // Calculate EBITDA if missing but EBIT and Depreciation are available
  const calculatedEbitda = ebitda !== 0 ? ebitda : (ebit + depreciation);

  // Calculate Total Debt
  const totalDebt = shortTermDebt + longTermDebt;

  // 1. ROE = Net Income / Equity
  const roe = safeDiv(netIncome, equity);

  // 2. ROA = Net Income / Total Assets
  const roa = safeDiv(netIncome, totalAssets);

  // 3. ROCE = EBIT / (Total Assets - Current Liabilities)
  const roce = safeDiv(ebit, (totalAssets - currentLiabilities));

  // 4. NOPAT = EBIT * (1 - taxRate)
  // Assuming taxRate is decimal (e.g., 0.25 for 25%)
  const nopat = ebit * (1 - taxRate);

  // 5. InvestedCapital
  // Preferred: Equity + Total Debt
  // Fallback: Total Assets - (Current Liabilities - Short Term Debt) - Cash
  const investedCapital = (equity + totalDebt) > 0 
    ? (equity + totalDebt) 
    : (totalAssets - (currentLiabilities - shortTermDebt) - cash);

  // 6. ROIC = NOPAT / InvestedCapital
  const roic = safeDiv(nopat, investedCapital);

  // 7. FreeCashFlow = CashflowOps + InterestExpense - (InterestExpense * taxRate) - CAPEX
  const freeCashFlow = cashflowOps + interestExpense - (interestExpense * taxRate) - capex;

  // Margins
  const grossMargin = safeDiv(grossProfit, revenue);
  const ebitdaMargin = safeDiv(calculatedEbitda, revenue);
  const netMargin = safeDiv(netIncome, revenue);

  return {
    roe: roe * 100, // Return as percentage
    roa: roa * 100,
    roce: roce * 100,
    nopat,
    investedCapital,
    roic: roic * 100,
    freeCashFlow,
    grossMargin: grossMargin * 100,
    ebitdaMargin: ebitdaMargin * 100,
    netMargin: netMargin * 100
  };
};

const compareInvestment = (actual, investment) => {
  const actualKPIs = calculateKPIs(actual);
  const investmentKPIs = calculateKPIs(investment);

  const calcDev = (act, inv) => {
    const valAct = act || 0;
    const valInv = inv || 0;
    if (valInv === 0) {
      return { amount: valAct - valInv, percent: 0 };
    }
    return {
      amount: valAct - valInv,
      percent: ((valAct - valInv) / valInv) * 100
    };
  };

  // Define the metrics we want to compare
  const metrics = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'grossProfit', label: 'Gross Profit' },
    { key: 'ebitda', label: 'EBITDA' },
    { key: 'ebit', label: 'EBIT' },
    { key: 'netIncome', label: 'Net Income' },
    { key: 'totalAssets', label: 'Total Assets' },
    { key: 'equity', label: 'Total Equity' },
    { key: 'cashflowOps', label: 'Operating Cash Flow' },
    { key: 'capex', label: 'CAPEX' },
    { key: 'freeCashFlow', label: 'Free Cash Flow', isKpi: true },
    { key: 'grossMargin', label: 'Gross Margin %', isKpi: true, isPercent: true },
    { key: 'ebitdaMargin', label: 'EBITDA Margin %', isKpi: true, isPercent: true },
    { key: 'netMargin', label: 'Net Margin %', isKpi: true, isPercent: true },
    { key: 'roe', label: 'ROE %', isKpi: true, isPercent: true },
    { key: 'roic', label: 'ROIC %', isKpi: true, isPercent: true },
  ];

  const results = {};

  metrics.forEach(m => {
    const actVal = m.isKpi ? actualKPIs[m.key] : (actual[m.key] || 0);
    const invVal = m.isKpi ? investmentKPIs[m.key] : (investment[m.key] || 0);
    const dev = calcDev(actVal, invVal);
    
    results[m.key] = {
      label: m.label,
      actual: actVal,
      benchmark: invVal,
      deviation: dev.amount,
      percent: dev.percent,
      isPercent: m.isPercent
    };
  });

  return results;
};

module.exports = { calculateKPIs, compareInvestment };