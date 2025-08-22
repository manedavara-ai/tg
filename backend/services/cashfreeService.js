const axios = require('axios');
const { v4: uuidv4 } = require('uuid');


const createPaymentLink = async ({ customer_id, phone, amount, plan_id, plan_name }) => {
  const linkId = `TG-${uuidv4()}`;

  // Validate required environment variables
  if (!process.env.CASHFREE_BASE_URL || !process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
    throw new Error('Missing Cashfree API configuration. Please check CASHFREE_BASE_URL, CASHFREE_CLIENT_ID, and CASHFREE_CLIENT_SECRET environment variables.');
  }

  // Validate required parameters
  if (!customer_id || !phone || !amount) {
    throw new Error('Missing required parameters: customer_id, phone, amount');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const requestPayload = {
    link_id: linkId,
    customer_details: {
      customer_id,
      customer_phone: phone
    },
    link_notify: {
      send_sms: true,
      send_email: false
    },
    link_meta: {
      return_url: `${process.env.FRONTEND_URL || 'https://telegram-bot-puce-phi.vercel.app'}/payment-success?status=success&order_id=${linkId}`,
      notify_url: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/payment/webhook`,
      plan_id: plan_id || '',
      customer_id: customer_id,
      plan_name: plan_name || 'Plan Purchase'
    },
    link_amount: amount,
    link_currency: 'INR',
    link_purpose: plan_name || 'Telegram Subscription',
    link_expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    link_minimum_partial_amount: amount
  };

  console.log('Creating payment link with payload:', JSON.stringify(requestPayload, null, 2));

  try {
    // Use the correct Cashfree API endpoint for creating payment links
    const apiUrl = `${process.env.CASHFREE_BASE_URL}/pg/links`;
    console.log('Making request to:', apiUrl);
    
    const response = await axios.post(
      apiUrl,
      requestPayload,
      {
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json'
        },
        timeout: 40000 // 30 second timeout
      }
    );

    console.log('Cashfree API response:', JSON.stringify(response.data, null, 2));

    return {
      ...response.data,
      link_id: linkId
    };
  } catch (error) {
    console.error('Cashfree API Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Request Payload:', JSON.stringify(requestPayload, null, 2));
    console.error('Headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      throw new Error('Cashfree API authentication failed. Please check your CLIENT_ID and CLIENT_SECRET.');
    } else if (error.response?.status === 400) {
      throw new Error(`Cashfree API validation error: ${JSON.stringify(error.response.data)}`);
    } else if (error.response?.status === 404) {
      throw new Error('Cashfree API endpoint not found. Please check your CASHFREE_BASE_URL configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('Cashfree API rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Cashfree API request timed out. Please try again.');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Unable to connect to Cashfree API. Please check your internet connection and CASHFREE_BASE_URL.');
    } else {
      throw new Error(`Cashfree API error: ${error.response?.data?.message || error.message}`);
    }
  }
};

const checkPaymentStatus = async (linkId) => {
  try {
    const response = await axios.get(
      `${process.env.CASHFREE_BASE_URL}/pg/links/${linkId}`,
      {
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Payment status check error:', error.response?.data || error.message);
    throw error;
  }
};

const handlePaymentWebhook = async (webhookData) => {
  try {
    console.log('Payment webhook received:', webhookData);
    
    const { type, data } = webhookData;
    
    switch (type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        console.log('Payment successful for order:', data.order?.order_id);
        await handlePaymentSuccess(data);
        break;
        
      case 'PAYMENT_FAILED_WEBHOOK':
        console.log('Payment failed for order:', data.order?.order_id);
        await handlePaymentFailure(data);
        break;
        
      default:
        console.log('Unknown webhook type:', type);
    }
    
    return { status: 'processed' };
  } catch (error) {
    console.error('Webhook processing error:', error);
    throw error;
  }
};

// Handle successful payment
const handlePaymentSuccess = async (data) => {
  const PaymentLink = require('../models/paymentLinkModel');
  const { generateAndStoreInviteLink } = require('./generateOneTimeInviteLink');
  
  try {
    const orderId = data.order?.order_id;
    if (!orderId) {
      console.error('No order ID found in webhook data');
      return;
    }

    // Update payment status in database
    const payment = await PaymentLink.findOneAndUpdate(
      { link_id: orderId },
      { status: 'SUCCESS' },
      { new: true }
    );

    if (!payment) {
      console.error(`Payment not found for order: ${orderId}`);
      return;
    }

    console.log(`✅ Payment marked as SUCCESS for user: ${payment.userid}`);

    // Generate Telegram invite link for this user
    try {
      const inviteLink = await generateAndStoreInviteLink(payment.userid, payment.duration || 86400);
      console.log(`🎫 Telegram invite link generated for user ${payment.userid}: ${inviteLink.link}`);
    } catch (error) {
      console.error(`Failed to generate Telegram invite link for user ${payment.userid}:`, error.message);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
};

// Handle failed payment
const handlePaymentFailure = async (data) => {
  const PaymentLink = require('../models/paymentLinkModel');
  
  try {
    const orderId = data.order?.order_id;
    if (!orderId) {
      console.error('No order ID found in webhook data');
      return;
    }

    // Update payment status in database
    const payment = await PaymentLink.findOneAndUpdate(
      { link_id: orderId },
      { status: 'FAILED' },
      { new: true }
    );

    if (payment) {
      console.log(`❌ Payment marked as FAILED for user: ${payment.userid}`);
    } else {
      console.error(`Payment not found for order: ${orderId}`);
    }

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

const createPaymentLinkWithRetry = async (paymentData, retries = 3) => {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${retries} to create payment link`);
      return await createPaymentLink(paymentData);
    } catch (error) {
      lastError = error;
      console.error(`Payment link creation attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('All retry attempts failed. Final error:', error.message);
        throw new Error(`Failed to create payment link after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = 1000 * Math.pow(2, i); // 1s, 2s, 4s
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

module.exports = {
  createPaymentLink,
  createPaymentLinkWithRetry,
  checkPaymentStatus,
  handlePaymentWebhook
};
