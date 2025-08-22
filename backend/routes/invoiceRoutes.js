const express = require("express");
const { createInvoice, downloadInvoice } = require("../controllers/invoiceController");
const router = express.Router();
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const Invoice = require("../models/Invoice");

router.post("/", createInvoice);
router.get("/download/:invoiceId", downloadInvoice);

// POST /api/invoices/download-zip
router.post('/download-zip', async (req, res) => {
  try {
    const { invoiceIds } = req.body;
    console.log('Received invoiceIds:', invoiceIds);

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({ error: 'No invoice IDs provided' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const invoiceId of invoiceIds) {
      const filePath = path.join(__dirname, '../invoices', `invoice_${invoiceId}.pdf`);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `invoice_${invoiceId}.pdf` });
      } else {
        console.log('File not found:', filePath);
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('ZIP download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all invoices for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const invoices = await Invoice.find({ userid: req.params.userId }).sort({ billDate: -1 });
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

module.exports = router;
