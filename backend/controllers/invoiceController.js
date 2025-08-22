const Invoice = require("../models/Invoice");
const { generatePDFBuffer } = require("../services/pdfService");
const { sendInvoiceEmail } = require("../services/emailService");
const cloudinary = require('../services/cloudinaryService');
const User = require("../models/user.model");
const PaymentLink = require("../models/paymentLinkModel");
const fs = require("fs");
const stream = require('stream');

exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNo,
      billDate,
      userid,
      description
    } = req.body;

    // Fetch user with required fields
    const user = await User.findOne({ _id: userid }, 'firstName middleName lastName phone email City stateCode amount transactionId');
    if (!user) return res.status(404).json({ error: "User not found" });
    const payment = await PaymentLink.findOne({ userid: userid })

    const basePrice = parseFloat(payment.amount);
    if (isNaN(basePrice)) {
      return res.status(400).json({ error: "Invalid amount in user data" });
    }

    const transactionId = payment?.link_id || payment?.transactionId || "";
    const taxPercent = 18;
    let total = basePrice;

    // Build invoice data
    const invoiceData = {
      invoiceNo,
      billDate,
      userid,
      billedTo: {
        name: `${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim(),
        phone: user.phone || "",
        email: user.email,
        address: user.City,
        stateCode: user.stateCode || ""
      },
      creator: {
        name: "VYOM RESEARCH LLP",
        pan: "AAYFV4090K",
        gstin: "24AAYFV4090K1ZE",
        address: "Shop no. 238 Services, Gujarat",
        stateCode: "24"
      },
      description,
      price: basePrice,
      transactionId
    };

    // GST logic (Always IGST)
    const igst = taxPercent;
    const igstAmt = parseFloat(((basePrice * igst) / 100).toFixed(2));
    invoiceData.igst = igst;
    invoiceData.igstAmt = igstAmt;
    total += igstAmt;
    invoiceData.total = parseFloat(total.toFixed(2));

    // Save to MONGODB
    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Update PaymentLink with invoiceId
    if (payment) {
      payment.invoiceId = invoice._id;
      await payment.save();
    }

    // Generate PDF as a buffer
    const pdfBuffer = await generatePDFBuffer(invoice);

    // Upload PDF buffer to Cloudinary and wait for completion
    await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', public_id: `invoices/invoice_${invoice._id}` },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            invoice.cloudinaryUrl = result.secure_url;
            await invoice.save();
            // Debug log before sending email
            console.log('Sending invoice email to', user.email, 'with URL:', result.secure_url);
            if (result.secure_url) {
              await sendInvoiceEmail(
                user.email,
                "Your Invoice from VYOM RESEARCH LLP",
                "Please find your invoice attached.",
                result.secure_url
              );
            } else {
              console.error('No secure_url from Cloudinary, not sending email. Result:', result);
            }
            resolve();
          }
        }
      );
      stream.Readable.from(pdfBuffer).pipe(uploadStream);
    });

    res.status(201).json({ message: "Invoice created and uploaded to Cloudinary", invoice });
  } catch (err) {
    console.error("Invoice creation error:", err);
    res.status(500).json({ error: "Invoice creation failed" });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const Invoice = require("../models/Invoice");
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice || !invoice.cloudinaryUrl) {
      return res.status(404).json({ error: "Invoice or Cloudinary PDF not found" });
    }
    // Redirect to Cloudinary URL
    res.redirect(invoice.cloudinaryUrl);
  } catch (err) {
    res.status(500).json({ error: "Error downloading invoice" });
  }
};

