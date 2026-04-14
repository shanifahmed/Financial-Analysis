const fs = require('fs');
const pdfParseLib = require('pdf-parse');
const Tesseract = require('tesseract.js');

// Helper to clean string and convert to number
const parseCurrency = (str) => {
  if (!str) return 0;
  
  let value = str.trim();
  
  // Check if it's a negative number in parentheses like (1,000) or (1,000.00)
  const isNegative = value.startsWith('(') && value.endsWith(')');
  if (isNegative) {
    value = value.slice(1, -1); // Remove parentheses
  }
  
  // Remove all non-numeric characters except dots and hyphens (for negative numbers)
  let clean = value.replace(/[^0-9.-]/g, '');
  
  // Check for Million/Billion suffixes
  let multiplier = 1;
  const lowerStr = str.toLowerCase();
  
  if (lowerStr.includes('billion') || lowerStr.includes('bn') || lowerStr.includes('b ')) {
    multiplier = 1000000000;
  } else if (lowerStr.includes('million') || lowerStr.includes('mn') || lowerStr.includes('m ')) {
    multiplier = 1000000;
  } else if (lowerStr.includes('k')) {
    multiplier = 1000;
  }
  
  let num = parseFloat(clean) || 0;
  
  // Apply multiplier if found and number is reasonable (less than 1000)
  if (multiplier > 1 && num < 1000) {
    num = num * multiplier;
  }
  
  // Return negative if was in parentheses
  return isNegative ? -num : num;
};

// Regex part to match Note columns like "4", "(4)", "5,7,8", "[12]"
// Matches optional parentheses/brackets, digits, commas, followed by whitespace/pipe
const notePattern = '(?:(?:[\\(\\[]?[0-9,]+[\\)\\]]?)[\\s|]+)?';

// Enhanced regex patterns for financial terms - more flexible matching
const patterns = {
  revenue: new RegExp(`(?:(?<!Cost of\\s)(?:Revenues?|Sales|Turnover|Total Revenues?|Gross Revenues?|Operating Revenues?))[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  grossProfit: new RegExp(`(?:Gross Profit|Gross [Pp]rofit|Gross Margin|Gross Income)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  ebitda: new RegExp(`(?:EBITDA|Earnings Before Interest|Operating Profit Before Depreciation)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  ebit: new RegExp(`(?:EBIT|Operating Income|Operating [Pp]rofit|Profit [Ff]rom [Oo]perations|OPERATING PROFIT)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  netIncome: new RegExp(`(?:Net Income|Net Profit|Profit for the [Pp]eriod|Net [Ee]arnings|Profit [Ff]or [Tt]he [Yy]ear|Comprehensive Income)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  totalAssets: new RegExp(`(?:Total Assets)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  equity: new RegExp(`(?:Total Equity|Shareholders Equity|Total [Ss]tockholders? [Ee]quity)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  currentLiabilities: new RegExp(`(?:Total Current Liabilities|Current Liabilities)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  cashflowOps: new RegExp(`(?:Cashflow from Operations|Operating Cash Flow|Cash [Ff]low [Ff]rom [Oo]perating [Aa]ctivities|Net [Cc]ash [Ff]rom [Oo]perating [Aa]ctivities|Net cash generated from operating activities)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  capex: new RegExp(`(?:CAPEX|Capital Expenditure|Capital [Ee]xpenditures?|Purchase of property, plant and equipment|Purchase of property and equipment)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  interestExpense: new RegExp(`(?:Interest Expense|Interest [Pp]ayable|Finance [Cc]osts?|Finance [Ee]xpenses?)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  taxRate: new RegExp(`(?:Tax Rate|Effective Tax Rate|Income Tax [Rr]ate)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?)`, 'i'),
  // Extra fields for calculation
  cash: new RegExp(`(?:Cash and [Ee]quivalents?|Cash|[Cc]ash [Aa]t [Bb]ank)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  depreciation: new RegExp(`(?:Depreciation|Amortization|Depreciation, amortization and impairment)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  shortTermDebt: new RegExp(`(?:Short term borrowings|Current portion of long term borrowings|Loans and borrowings)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i'),
  longTermDebt: new RegExp(`(?:Long term borrowings|Non-current borrowings)[\\s:.,|]*${notePattern}[$€£¥]?\\s*([\\(\\)-]?[\\d,]+(?:\\.\\d{1,2})?[\\)\\%]?[KMB]?)`, 'i')
};

// Helper function to find the best match in text
const findBestMatch = (text, regex) => {
  const matches = text.match(new RegExp(regex, 'gi'));
  if (!matches || matches.length === 0) return null;
  
  // Try to get the last match which is often the total/summary value in financial documents
  // But also check for matches that have actual numbers
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    // Extract the number part
    const numMatch = match.match(/[\(\)-]?[\d,]+(?:\.\d{1,2})?/);
    if (numMatch && numMatch[0] && numMatch[0].replace(/[,\(\)-]/g, '').length > 0) {
      return match;
    }
  }
  
  // If no good match found, return first match with number
  return matches[0];
};

const extractDataFromText = (text) => {
  const data = {};
  
  for (const [key, regex] of Object.entries(patterns)) {
    // Try to find the best match
    const matchStr = findBestMatch(text, regex.source);
    
    if (matchStr) {
      // Extract the numeric part using the specific regex to ensure we capture suffixes like M/B/%
      const match = matchStr.match(regex);
      // match[1] corresponds to the capture group in the patterns above
      if (match && match[1]) {
        data[key] = parseCurrency(match[1]);
        console.log(`[OCR] Matched ${key}: ${matchStr} => ${data[key]}`);
      } else {
        data[key] = 0;
      }
    } else {
      data[key] = 0; // Default to 0 if not found
    }
  }
  
  // Normalize Tax Rate to decimal if it looks like a percentage (e.g. 25 -> 0.25)
  // or if it's between 0 and 1, keep it as is
  if (data.taxRate > 1) {
    data.taxRate = data.taxRate / 100;
  }
  
  // Ensure taxRate is between 0 and 1
  if (data.taxRate > 1) {
    data.taxRate = 0;
  }

  // Ensure CAPEX is positive magnitude
  if (data.capex < 0) {
    data.capex = Math.abs(data.capex);
  }

  // Ensure Depreciation is positive magnitude (it's often negative in statements)
  if (data.depreciation < 0) {
    data.depreciation = Math.abs(data.depreciation);
  }

  return data;
};

const processDocument = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  
  try {
    // Debug: Log file being processed
    console.log(`[OCR] Processing file: ${filePath}`);
    
    // 1. Try PDF Parse (fast, for text-based PDFs)
    let pdfParse = pdfParseLib;
    let text = '';

    if (typeof pdfParse !== 'function' && typeof pdfParse.default === 'function') {
      pdfParse = pdfParse.default;
    }

    if (typeof pdfParse === 'function') {
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text || '';
    }

    // Debug: Log extracted text length
    console.log(`[OCR] Extracted ${text.length} characters from PDF`);
    if (text.trim().length > 0) {
      console.log(`[OCR] Sample text (first 200 chars): ${text.substring(0, Math.min(200, text.length))}`);
    }

    // 2. If text is sparse, assume scanned and use Tesseract
    if (text.trim().length < 50) {
      console.log('[OCR] Text sparse (<50 chars), switching to Tesseract...');
      try {
        const { data: { text: ocrText } } = await Tesseract.recognize(filePath, 'eng');
        text = ocrText;
        console.log(`[OCR] Tesseract returned ${text.length} characters`);
      } catch (tessError) {
        console.warn('Tesseract OCR failed (likely due to PDF format), falling back to extracted text:', tessError.message);
        // Fallback: keep the original text from pdf-parse
      }
    }

    // Debug: Log before extraction
    console.log('[OCR] Starting data extraction...');
    const result = extractDataFromText(text);
    
    // Debug: Log extracted data
    console.log('[OCR] Extracted data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to process document');
  }
};
module.exports = { processDocument };