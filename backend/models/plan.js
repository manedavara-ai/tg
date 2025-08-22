const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  mrp: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Base', 'Pro', 'Enterprise'],
    default: 'Base'
  },
  duration: {
    type: String,
    enum: ['week', 'month', 'year'],
    default: 'month'
  },
  highlight: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
