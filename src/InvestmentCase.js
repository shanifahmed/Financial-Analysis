const mongoose = require('mongoose');

const InvestmentCaseSchema = new mongoose.Schema({
  name: String,
  source: { type: String, default: 'Bloomberg' },
  revenue: Number,
  grossProfit: Number,
  ebitda: Number,
  ebit: Number,
  netIncome: Number,
  totalAssets: Number,
  equity: Number,
  currentLiabilities: Number,
  cashflowOps: Number,
  capex: Number,
  interestExpense: Number,
  taxRate: Number,
  cash: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InvestmentCase', InvestmentCaseSchema);