const { createPaymentLink, checkPaymentStatus } = require('../services/cashfreeService');
const PaymentLink = require('../models/paymentLinkModel');


const createLink = async (req, res) => {
  try {
    const { customer_id, phone, amount, plan_id, plan_name } = req.body;
    const userid = req.user?.id || req.body.userid; // Get from JWT or request body

    if (!userid || !customer_id || !phone || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = await createPaymentLink({ customer_id, phone, amount, plan_id, plan_name });

    // Save to MONGODB
    const newPayment = new PaymentLink({
      userid,
      link_id: data.link_id,
      link_url: data.link_url,
      customer_id,
      phone,
      amount,
      plan_id,
      plan_name,
      status: 'PENDING'
    });

    await newPayment.save();

    res.status(200).json({
      success: true,
      paymentLink: data.link_url,
      linkId: data.link_id,
      message: 'Payment link created and saved'
    });

  } catch (error) {
    console.error('Payment Link Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment link creation failed' });
  }
};
const getStatus = async (req, res) => {
  try {
    const { linkId } = req.params;
    const data = await checkPaymentStatus(linkId);
    res.status(200).json({ status: data.link_status, data });
  } catch (error) {
    console.error('Status Check Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
};

// Get total revenue (sum of all successful payments)
const getTotalRevenue = async (req, res) => {
  try {
    const result = await PaymentLink.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const total = result[0]?.total || 0;
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get total transactions (count of all successful payments)
const getTotalTransactions = async (req, res) => {
  try {
    const count = await PaymentLink.countDocuments({ status: 'SUCCESS' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get active users (unique userids with a successful, non-expired payment)
const getActiveUsers = async (req, res) => {
  try {
    const now = new Date();
    const result = await PaymentLink.aggregate([
      { $match: { status: 'SUCCESS', expiry_date: { $gt: now } } },
      { $group: { _id: "$userid" } },
      { $count: "activeUsers" }
    ]);
    const count = result[0]?.activeUsers || 0;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get recent successful transactions (with user info if possible)
const getRecentSuccessfulTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const transactions = await PaymentLink.find({ status: 'SUCCESS' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    // Optionally, fetch user info for each transaction
    // (Assuming you want to show user name or email)
    // If you want to join with User, you can use aggregation or populate if ref is set
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createLink,
  getStatus,
  getTotalRevenue,
  getTotalTransactions,
  getActiveUsers,
  getRecentSuccessfulTransactions
};
