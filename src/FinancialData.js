const mongoose = require('mongoose');

const FinancialDataSchema = new mongoose.Schema({
  documentId: { type: String, required: true },
  originalFilename: String,
  // Extracted Fields
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
  // Extra fields needed for specific formulas in prompt
  cash: Number, 
  nonInterestCurrentLiabilities: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FinancialData', FinancialDataSchema);