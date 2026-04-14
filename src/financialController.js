const FinancialData = require('./FinancialData');
const ocrService = require('./ocrService');
const financialEngine = require('./financialEngine');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    const results = await Promise.all(req.files.map(async (file) => {
      // 1. Extract Data
      const extractedData = await ocrService.processDocument(file.path);

      // 2. Save to DB
      const financialDoc = new FinancialData({
        documentId: file.filename,
        originalFilename: file.originalname,
        ...extractedData
      });
      await financialDoc.save();
      return financialDoc;
    }));

    res.status(201).json({
      message: 'Documents processed successfully',
      data: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getFinancialData = async (req, res) => {
  try {
    const doc = await FinancialData.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const kpis = financialEngine.calculateKPIs(doc.toObject());

    res.json({
      data: doc,
      kpis
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.fetchStcReport = async (req, res) => {
  const { year, quarter } = req.body;
  if (!year || !quarter) return res.status(400).json({ message: 'Year and Quarter required' });

  try {
    const targetUrl = 'https://www.stc.com/content/stcgroupwebsite/sa/en/investors/financial-reports/financial-statement.html';
    const { data: html } = await axios.get(targetUrl);

    // Regex to find PDF links in the HTML
    const linkRegex = /<a[^>]+href="([^"]+\.pdf)"[^>]*>(.*?)<\/a>/gi;
    let match;
    let pdfUrl = null;

    // Keywords to match the selected quarter
    const qKeywords = {
      'Q1': ['Q1', '1st Quarter', 'First Quarter', 'March'],
      'Q2': ['Q2', '2nd Quarter', 'Second Quarter', 'June'],
      'Q3': ['Q3', '3rd Quarter', 'Third Quarter', 'September'],
      'Q4': ['Q4', '4th Quarter', 'Fourth Quarter', 'Annual', 'December']
    };
    const keywords = qKeywords[quarter] || [];

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2];
      const combined = (href + text).toLowerCase();
      
      if (combined.includes(year.toString()) && keywords.some(k => combined.includes(k.toLowerCase()))) {
        pdfUrl = href;
        break;
      }
    }

    if (!pdfUrl) {
       return res.status(404).json({ message: `Could not find ${quarter} ${year} report on STC website.` });
    }

    if (!pdfUrl.startsWith('http')) {
      const baseUrl = 'https://www.stc.com';
      pdfUrl = baseUrl + (pdfUrl.startsWith('/') ? '' : '/') + pdfUrl;
    }

    const response = await axios({ url: pdfUrl, method: 'GET', responseType: 'arraybuffer' });
    const filename = `stc_${year}_${quarter}_${Date.now()}.pdf`;
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, response.data);

    const extractedData = await ocrService.processDocument(filePath);
    const financialDoc = new FinancialData({
      documentId: filename,
      originalFilename: `STC ${year} ${quarter} Report.pdf`,
      ...extractedData
    });
    await financialDoc.save();

    res.status(201).json({ message: 'STC Report fetched and processed', data: [financialDoc] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch STC report', error: error.message });
  }
};

exports.getAllFinancials = async (req, res) => {
  try {
    const docs = await FinancialData.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteFinancialData = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await FinancialData.findById(id);
    
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Delete file from filesystem if it exists
    if (doc.documentId) {
      const filePath = path.join(__dirname, '..', 'uploads', doc.documentId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await FinancialData.findByIdAndDelete(id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};