const mongoose = require('mongoose');

const paymentLinkSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  link_id: {
    type: String,
    required: true,
    unique: true
  },
  link_url: {
    type: String,
    required: true
  },
  customer_id: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  plan_id: String,
  plan_name: String,
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'],
    default: 'PENDING'
  },
  purchase_datetime: {
    type: Date,
    default: Date.now
  },
  expiry_date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentLink', paymentLinkSchema);