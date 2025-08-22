// const express = require('express');
// const { createPaymentLink, createPaymentLinkWithRetry, checkPaymentStatus, handlePaymentWebhook } = require('../services/cashfreeService');
// const PaymentLink = require('../models/paymentLinkModel');

// const router = express.Router();

// // Create payment link endpoint
// // router.post('/create-payment-link', async (req, res) => {
// //   try {
// //     const { customer_id, phone, amount, plan_id, plan_name } = req.body;
// //     console.log(req.body);
    

// //     // Validation
// //     if (!customer_id || !phone || !amount) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Missing required fields: customer_id, phone, amount'
// //       });
// //     }

// //     if (amount <= 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Amount must be greater than 0'
// //       });
// //     }

// //     // Create payment link
// //     const paymentResponse = await createPaymentLinkWithRetry({
// //       customer_id,
// //       phone,
// //       amount,
// //       plan_id,
// //       plan_name
// //     });

// //     res.json({
// //       success: true,
// //       paymentLink: paymentResponse.link_url,
// //       orderId: paymentResponse.link_id,
// //       message: 'Payment link created successfully'
// //     });

// //   } catch (error) {
// //     console.error('Payment link creation error:', error.message);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to create payment link',
// //       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
// //     });
// //   }
// // });
// router.post('/create-payment-link', async (req, res) => {
//   try {
//     const { customer_id, phone, amount, plan_id, plan_name, userid } = req.body;

//     // Validation
//     if (!customer_id || !phone || !amount || !userid) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: customer_id, phone, amount, userid'
//       });
//     }

//     if (amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Amount must be greater than 0'
//       });
//     }

//     // Create payment link using Cashfree
//     const paymentResponse = await createPaymentLinkWithRetry({
//       customer_id,
//       phone,
//       amount,
//       plan_id,
//       plan_name
//     });

//     // Save in MONGODB
//     const newPayment = new PaymentLink({
//       userid,
//       link_id: paymentResponse.link_id,
//       link_url: paymentResponse.link_url,
//       customer_id,
//       phone,
//       amount,
//       plan_id,
//       plan_name,
//       status: 'PENDING'
//     });

//     await newPayment.save();

//     // Response
//     res.json({
//       success: true,
//       paymentLink: paymentResponse.link_url,
//       orderId: paymentResponse.link_id,
//       message: 'Payment link created and saved successfully'
//     });

//   } catch (error) {
//     console.error('Payment link creation error:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create payment link',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// });


// // Check payment status endpoint
// router.get('/status/:linkId', async (req, res) => {
//   try {
//     const { linkId } = req.params;

//     if (!linkId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Link ID is required'
//       });
//     }

//     const paymentStatus = await checkPaymentStatus(linkId);

//     res.json({
//       success: true,
//       data: paymentStatus
//     });

//   } catch (error) {
//     console.error('Payment status check error:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to check payment status',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// });

// // Webhook endpoint
// router.post('/webhook', async (req, res) => {
//   try {
//     const webhookData = req.body;
//     const result = await handlePaymentWebhook(webhookData); // <-- now async

//     res.status(200).json({
//       success: true,
//       message: 'Webhook processed successfully',
//       ...result
//     });
//   } catch (error) {
//     console.error('Webhook processing error:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Webhook processing failed'
//     });
//   }
// });

// module.exports = router;


// routes/paymentRoutes.js
const express = require('express');
const { createPaymentLinkWithRetry, checkPaymentStatus, handlePaymentWebhook } = require('../services/cashfreeService');
const PaymentLink = require('../models/paymentLinkModel');
const paymentController = require('../controllers/paymentController');
const axios = require('axios');
const User = require('../models/user.model'); // Added User model import

const router = express.Router();

router.post('/create-payment-link', async (req, res) => {
  try {
    const { 
      customer_id, 
      phone, 
      amount, 
      plan_id, 
      plan_name, 
      userid, 
      purchase_datetime,
      expiry_date,
      duration 
    } = req.body;

    console.log('Received payment request:', {
      customer_id,
      phone,
      amount,
      plan_id,
      plan_name,
      userid,
      purchase_datetime,
      expiry_date,
      duration
    });

    // Enhanced validation
    const missingFields = [];
    if (!customer_id) missingFields.push('customer_id');
    if (!phone) missingFields.push('phone');
    if (!amount) missingFields.push('amount');
    if (!userid) missingFields.push('userid');
    if (!expiry_date) missingFields.push('expiry_date');
    if (!duration) missingFields.push('duration');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedData: { customer_id, phone, amount, userid, expiry_date, duration }
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
        receivedAmount: amount
      });
    }

    console.log('Creating payment link with Cashfree...');
    const paymentResponse = await createPaymentLinkWithRetry({
      customer_id,
      phone,
      amount,
      plan_id,
      plan_name
    });

    console.log('Payment link created successfully:', {
      link_id: paymentResponse.link_id,
      link_url: paymentResponse.link_url
    });

    console.log('Saving payment to database...');
    const newPayment = new PaymentLink({
      userid,
      link_id: paymentResponse.link_id,
      link_url: paymentResponse.link_url,
      customer_id,
      phone,
      amount,
      plan_id,
      plan_name,
      status: 'PENDING',
      purchase_datetime: purchase_datetime || new Date().toISOString(),
      expiry_date: new Date(expiry_date),
      duration
    });

    const savedPayment = await newPayment.save();
    console.log('Payment saved to database:', savedPayment._id);

    res.json({
      success: true,
      paymentLink: paymentResponse.link_url,
      orderId: paymentResponse.link_id,
      message: 'Payment link created and saved'
    });

  } catch (error) {
    console.error('Payment link creation error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create payment link';
    if (error.message.includes('Missing Cashfree API configuration')) {
      errorMessage = 'Payment gateway configuration error. Please contact support.';
    } else if (error.message.includes('authentication failed')) {
      errorMessage = 'Payment gateway authentication error. Please contact support.';
    } else if (error.message.includes('rate limit exceeded')) {
      errorMessage = 'Payment gateway is busy. Please try again in a few minutes.';
    } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      errorMessage = 'Payment gateway connection error. Please check your internet connection and try again.';
    } else if (error.message.includes('validation error')) {
      errorMessage = 'Invalid payment data. Please check your information and try again.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add a new endpoint to check subscription status
router.get('/subscription-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const activeSubscription = await PaymentLink.findOne({
      userid: userId,
      status: 'SUCCESS',
      expiry_date: { $gt: new Date() }
    }).sort({ expiry_date: -1 });

    if (!activeSubscription) {
      return res.json({
        success: true,
        hasActiveSubscription: false,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      hasActiveSubscription: true,
      subscription: {
        planName: activeSubscription.plan_name,
        expiryDate: activeSubscription.expiry_date,
        duration: activeSubscription.duration
      }
    });

  } catch (error) {
    console.error('Subscription status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
      error: error.message
    });
  }
});

// Check payment status
router.get('/status/by-link/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;

    if (!linkId) {
      return res.status(400).json({
        success: false,
        message: 'Link ID is required'
      });
    }

    const paymentStatus = await checkPaymentStatus(linkId);

    res.json({
      success: true,
      data: paymentStatus
    });

  } catch (error) {
    console.error('Status check error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// Get subscription status
router.get('/status/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the most recent payment for this user
    const payment = await PaymentLink.findOne({ userid: userId })
      .sort({ expiry_date: -1 })
      .populate('plan_id');
    
    if (!payment) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    res.json({
      plan_name: payment.plan_name,
      expiry_date: payment.expiry_date,
      status: new Date(payment.expiry_date) > new Date() ? 'active' : 'expired'
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Error fetching subscription status' });
  }
});

// Update user's Telegram User ID
router.post('/update-telegram-id', async (req, res) => {
  try {
    const { userId, telegramUserId } = req.body;
    
    if (!userId || !telegramUserId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and telegramUserId are required'
      });
    }

    // Update user's telegramUserId
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { telegramUserId: telegramUserId.toString() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`Updated telegramUserId for user ${userId}: ${telegramUserId}`);

    res.json({
      success: true,
      message: 'Telegram User ID updated successfully',
      user: {
        id: updatedUser._id,
        telegramUserId: updatedUser.telegramUserId
      }
    });

  } catch (error) {
    console.error('Error updating telegram user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating telegram user ID',
      error: error.message
    });
  }
});

// Webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    const result = await handlePaymentWebhook(webhookData);

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      ...result
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

router.get('/total-revenue', paymentController.getTotalRevenue);
router.get('/total-transactions', paymentController.getTotalTransactions);
router.get('/active-users', paymentController.getActiveUsers);
router.get('/recent-successful', paymentController.getRecentSuccessfulTransactions);

// Test endpoint to check Cashfree API configuration
router.get('/test-config', async (req, res) => {
  try {
    const config = {
      CASHFREE_BASE_URL: process.env.CASHFREE_BASE_URL,
      CASHFREE_CLIENT_ID: process.env.CASHFREE_CLIENT_ID ? '***SET***' : '***MISSING***',
      CASHFREE_CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET ? '***SET***' : '***MISSING***',
      FRONTEND_URL: process.env.FRONTEND_URL,
      BACKEND_URL: process.env.BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV
    };

    // Test if we can reach the Cashfree API
    let apiTest = 'Not tested';
    if (process.env.CASHFREE_BASE_URL && process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) {
      try {
        const response = await axios.get(`${process.env.CASHFREE_BASE_URL}/pg/links`, {
          headers: {
            'x-client-id': process.env.CASHFREE_CLIENT_ID,
            'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
            'x-api-version': '2022-09-01'
          },
          timeout: 10000
        });
        apiTest = 'Connection successful';
      } catch (error) {
        apiTest = `Connection failed: ${error.response?.status || error.code} - ${error.response?.data?.message || error.message}`;
      }
    }

    res.json({
      success: true,
      config,
      apiTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to create a minimal payment link
router.post('/test-create-link', async (req, res) => {
  try {
    const { customer_id, phone, amount } = req.body;
    
    if (!customer_id || !phone || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customer_id, phone, amount'
      });
    }

    console.log('Testing payment link creation with:', { customer_id, phone, amount });

    const testPaymentData = {
      customer_id,
      phone,
      amount: parseFloat(amount),
      plan_id: 'test-plan',
      plan_name: 'Test Plan'
    };

    const paymentResponse = await createPaymentLinkWithRetry(testPaymentData, 1); // Only 1 retry for testing

    res.json({
      success: true,
      paymentLink: paymentResponse.link_url,
      orderId: paymentResponse.link_id,
      message: 'Test payment link created successfully'
    });

  } catch (error) {
    console.error('Test payment link creation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Test payment link creation failed',
      error: error.message
    });
  }
});

module.exports = router;