const express = require('express');
const fs = require('fs');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const financialController = require('./financialController');
const investmentController = require('./investmentController');

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Financial Routes
router.post('/upload', upload.array('documents', 12), financialController.uploadDocument);
router.get('/financial/:id', financialController.getFinancialData);
router.get('/financial', financialController.getAllFinancials);
router.delete('/financial/:id', financialController.deleteFinancialData);
router.post('/financial/stc', financialController.fetchStcReport);

// Investment Routes
router.post('/investment/fetch', investmentController.fetchMarketData);
router.post('/investment', investmentController.createInvestmentCase);
router.get('/investment', investmentController.getAllInvestments);

// Comparison Routes
router.get('/comparison/:financialId/:investmentId', investmentController.getComparison);

module.exports = router;