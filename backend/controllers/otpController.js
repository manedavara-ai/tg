const amazeSmsService = require('../services/amazeSmsService');
const mockOtpService = require('../services/mockOtpService');
const OtpRequest = require('../models/otpModel'); // Import the OtpRequest model
const generateOTP = require('../db/generateOTP');
const User = require("../models/user.model")
const sendOtpController = async (req, res) => {
  console.log('OTP Controller - Request received:', { body: req.body, headers: req.headers });
  
  const { phone } = req.body;
  if (!phone) {
    console.log('OTP Controller - Phone number missing');
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    console.log('OTP Controller - Sending OTP to:', phone);
    
    let result = null;
    let serviceUsed = '';
    
    // Try AmazeSMS first for real SMS
    try {
      console.log('OTP Controller - Trying AmazeSMS for real SMS...');
      result = await amazeSmsService.sendOtp(phone);
      serviceUsed = 'AmazeSMS';
      console.log('OTP Controller - AmazeSMS result:', result);
    } catch (amazeError) {
      console.log('OTP Controller - AmazeSMS failed:', amazeError.message);
      
      // Fallback to Mock service
      try {
        console.log('OTP Controller - Using Mock service as fallback...');
        result = await mockOtpService.sendOtp(phone);
        serviceUsed = 'Mock';
        console.log('OTP Controller - Mock result:', result);
      } catch (mockError) {
        console.log('OTP Controller - Mock failed:', mockError.message);
        throw new Error(`Both services failed. AmazeSMS: ${amazeError.message}, Mock: ${mockError.message}`);
      }
    }
    
    if (result.success && result.otp) {
      // Save to DB
      await OtpRequest.create({ phone, otp: result.otp });
      await User.create({ phone: phone })

      console.log('OTP Controller - OTP saved to DB successfully');
      res.json({ 
        message: 'OTP sent and saved successfully', 
        smsData: result, 
        phone,
        serviceUsed 
      });
    } else {
      throw new Error('Failed to send OTP');
    }
  } catch (error) {
    console.error('OTP Controller - Error:', error);
    res.status(500).json({ message: 'OTP sent error', error: error.message });
  }
};

const verifyOtpController = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: 'Phone and OTP are required' });
  }

  try {
    // Find the most recent OTP entry for the phone
    const otpRecord = await OtpRequest.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(404).json({ message: 'OTP not found or expired' });
    }

    // Check if the OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    const user = await User.findOne({ phone: phone });
    // (Optional) Delete OTP after successful verification
    await OtpRequest.deleteOne({ _id: otpRecord._id });

    // OTP is correct
    return res.status(200).json({ message: 'OTP verified successfully', user });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const RESET_COOLDOWN_SECONDS = 60

const resetOtpController = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const existingOtp = await OtpRequest.findOne({ phone });

    if (existingOtp) {
      const now = new Date();
      const timeDiff = (now - existingOtp.createdAt) / 1000;

      if (timeDiff < RESET_COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(RESET_COOLDOWN_SECONDS - timeDiff);
        return res.status(429).json({
          message: `Please wait ${waitTime} second(s) before requesting a new OTP.`,
          cooldown: waitTime
        });
      }
    }

    // Generate and send new OTP via AmazeSMS
    const result = await sendOtp(phone);
    
    if (result.success && result.otp) {
      await OtpRequest.findOneAndUpdate(
        { phone },
        { otp: result.otp, createdAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      throw new Error('Failed to send new OTP');
    }

    res.status(200).json({
      message: 'OTP reset successfully and sent to user',
      smsResult: result,
      phone
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error resetting OTP',
      error: error.message
    });
  }
};

module.exports = { sendOtpController, verifyOtpController, resetOtpController };
