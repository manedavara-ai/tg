const { string } = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true, sparse: true },
  panNumber: { type: String },
  dob: { type: String },
  City: { type: String },
  State: { type: String },
  stateCode: { type: Number },
  phone: { type: String },
  telegramUserId: { type: String, unique: true, sparse: true },
  telegramJoinStatus: { 
    type: String, 
    enum: ['pending', 'joined', 'kicked', 'expired'], 
    default: 'pending' 
  },
  telegramJoinedAt: { type: Date },
  transactionId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
