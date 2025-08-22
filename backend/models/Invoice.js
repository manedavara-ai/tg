const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  invoiceNo: String,
  billDate: Date,
  billedTo: {
    name: String,
    phone: String,
    email: String,
    address: String,
    stateCode: String
  },
  creator: {
    name: String,
    pan: String,
    gstin: String,
    address: String,
    stateCode: String
  },
  description: String,
  price: Number,
  igst: Number,
  igstAmt: Number,
  cgst: Number,
  cgstAmt: Number,
  sgst: Number,
  sgstAmt: Number,
  total: Number,
  transactionId: String,
  pdfPath: String
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
