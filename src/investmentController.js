const InvestmentCase = require('./InvestmentCase');
const FinancialData = require('./FinancialData');
const financialEngine = require('./financialEngine');
const yahooFinance = require('yahoo-finance2').default;

exports.createInvestmentCase = async (req, res) => {
  try {
    const investment = new InvestmentCase(req.body);
    await investment.save();
    res.status(201).json(investment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.fetchMarketData = async (req, res) => {
  try {
    console.log('Received fetch request for ticker:', req.body.ticker);
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ message: 'Ticker is required' });

    // Fetch financial data using yahoo-finance2 library
    const modules = [
      'financialData',
      'defaultKeyStatistics',
      'incomeStatementHistory',
      'balanceSheetHistory',
      'cashflowStatementHistory'
    ];

    // Try with additional options for yahoo-finance2
    const result = await yahooFinance.quoteSummary(ticker, { 
      modules,
      validateOptions: false 
    }).catch(err => {
      console.error('Yahoo Finance API Error:', err.message);
      throw new Error(`Failed to fetch data for ${ticker}: ${err.message}`);
    });

    if (!result) {
      throw new Error(`No data found for ticker: ${ticker}`);
    }

    const val = (obj) => (obj && obj.raw) || 0;

    const financialData = result.financialData || {};
    const income = result.incomeStatementHistory?.incomeStatementHistory?.[0] || {};
    const balance = result.balanceSheetHistory?.balanceSheetStatements?.[0] || {};
    const cashflow = result.cashflowStatementHistory?.cashflowStatements?.[0] || {};

    // Calculate Tax Rate
    let taxRate = 0;
    const incomeBeforeTax = val(income.incomeBeforeTax);
    const incomeTaxExpense = val(income.incomeTaxExpense);
    if (incomeBeforeTax !== 0) {
      taxRate = incomeTaxExpense / incomeBeforeTax;
    }

    // Map Yahoo Finance data to our model
    const mappedData = {
      name: `Bloomberg/Market - ${ticker.toUpperCase()}`,
      source: 'Bloomberg/Yahoo',
      revenue: val(income.totalRevenue) || val(financialData.totalRevenue),
      grossProfit: val(income.grossProfit) || val(financialData.grossProfits),
      ebitda: val(financialData.ebitda) || val(income.ebit),
      ebit: val(income.ebit) || val(income.operatingIncome),
      netIncome: val(income.netIncome) || val(income.netIncomeCommonStockholders),
      totalAssets: val(balance.totalAssets),
      equity: val(balance.totalStockholderEquity),
      currentLiabilities: val(balance.totalCurrentLiabilities),
      cashflowOps: val(cashflow.totalCashFromOperatingActivities),
      capex: -val(cashflow.capitalExpenditures),
      interestExpense: val(income.interestExpense),
      taxRate: taxRate,
      cash: val(balance.cash) || val(financialData.totalCash),
    };

    res.json(mappedData);
  } catch (error) {
    console.error('Market Data Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch market data', error: error.message });
  }
};

exports.getAllInvestments = async (req, res) => {
  try {
    const investments = await InvestmentCase.find().sort({ createdAt: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getComparison = async (req, res) => {
  try {
    const { financialId, investmentId } = req.params;

    const financial = await FinancialData.findById(financialId);
    const investment = await InvestmentCase.findById(investmentId);

    if (!financial || !investment) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const comparison = financialEngine.compareInvestment(financial.toObject(), investment.toObject());

    res.json({
      financial,
      investment,
      comparison
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};