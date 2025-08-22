const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import bot functionality
const TelegramBot = require('node-telegram-bot-api');
const PaymentLink = require('./models/paymentLinkModel');
const User = require('./models/user.model');

// Import routes
const digioRoutes = require('./routes/digio.routes');
const inviteRoute = require('./routes/invite.route');
const invoiceRoutes = require('./routes/invoiceRoutes');
const kycRoutes = require('./routes/kycRoutes');
const otpRoutes = require('./routes/otpRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const planRoutes = require('./routes/planRoutes');
const groupRoutes = require('./routes/groupRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { seedSuperAdmin } = require('./controllers/adminController');
const telegramRoutes = require('./routes/telegramRoutes');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MONGODB Connection
mongoose.connect(process.env.MONGODB_URI || 'MONGODB://localhost:27017/telegram-bot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MONGODB connected successfully'))
.catch(err => {
    console.error('MONGODB connection error:', err);
    console.log('Server will continue without MONGODB connection');
  });

// MONGODB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MONGODB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MONGODB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MONGODB reconnected');
  });

// // Socket.IO connection handling
// io.on('connection', (socket) => {
//   console.log('Client connected to main server');
  
//   // Send kicked users data when requested
//   socket.on('getKickedUsers', () => {
//     socket.emit('kickedUsersData', kickedUsers);
//   });
  
//   // Send kicked users data immediately on connection
//   socket.emit('kickedUsersData', kickedUsers);

//   socket.on('disconnect', () => {
//     console.log('Client disconnected from main server');
//   });
// });

// Routes
app.use('/api/digio', digioRoutes);
app.use('/api/invite', inviteRoute);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/plans', planRoutes);

// Test authentication endpoint
app.get('/api/test-auth', (req, res) => {
  const authHeader = req.header('Authorization');
  res.json({ 
    message: 'Auth test endpoint',
    hasAuthHeader: !!authHeader,
    authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'None'
  });
});

app.use('/api/groups', groupRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/admin', adminRoutes);

// Manual trigger for plan expiry updates
// app.post('/api/admin/update-plan-expiry', async (req, res) => {
//     try {
//         if (mongoose.connection.readyState !== 1) {
//             return res.status(500).json({ error: 'MONGODB not connected' });
//         }
        
//         console.log('MANUAL_TRIGGER: Starting plan expiry date updates...');
        
//         // Find all successful payments that need expiry date calculation
//         const payments = await PaymentLink.find({
//             status: 'SUCCESS',
//             $or: [
//                 { expiry_date: { $exists: false } },
//                 { expiry_date: null }
//             ]
//         }).populate('userid');
        
//         let updatedCount = 0;
//         const updatedPayments = [];
        
//         for (const payment of payments) {
//             try {
//                 // Get plan details
//                 const planDetails = await getPlanExpiryDetails(payment.plan_id);
                
//                 // Calculate expiry date
//                 const expiryDate = calculateExpiryDate(
//                     payment.purchase_datetime,
//                     planDetails.duration,
//                     planDetails.durationType
//                 );
                
//                 // Update payment link with calculated expiry date
//                 await PaymentLink.findByIdAndUpdate(payment._id, {
//                     expiry_date: expiryDate,
//                     duration: planDetails.duration
//                 });
                
//                 updatedPayments.push({
//                     userId: payment.userid?._id,
//                     userName: `${payment.userid?.firstName} ${payment.userid?.lastName}`,
//                     planName: payment.plan_name,
//                     expiryDate: expiryDate.toISOString(),
//                     duration: planDetails.duration
//                 });
                
//                 updatedCount++;
                
//             } catch (error) {
//                 console.error(`MANUAL_TRIGGER: Error updating payment ${payment._id}:`, error);
//             }
//         }
        
//         res.json({
//             success: true,
//             message: `Updated ${updatedCount} payment expiry dates`,
//             updatedPayments,
//             totalUpdated: updatedCount
//         });
        
//     } catch (error) {
//         console.error('MANUAL_TRIGGER: Error in manual plan expiry update:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// // Manual trigger for kick expired users
// app.post('/api/admin/trigger-kick-job', async (req, res) => {
//     try {
//         if (mongoose.connection.readyState !== 1) {
//             return res.status(500).json({ error: 'MONGODB not connected' });
//         }
        
//         if (!bot) {
//             return res.status(500).json({ error: 'Telegram bot not configured' });
//         }
        
//         console.log('MANUAL_TRIGGER: Starting kick expired users job...');
        
//         // Call the kick function directly
//         await kickExpiredUsers();
        
//         res.json({
//             success: true,
//             message: 'Kick expired users job completed successfully',
//             timestamp: new Date().toISOString()
//         });
        
//     } catch (error) {
//         console.error('MANUAL_TRIGGER: Error in manual kick job:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    botStatus: bot ? 'Running' : 'Not configured'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Import and start expiry job
require('./jobs/expireUsersJob');

// Initialize Telegram Integration Service
const telegramIntegrationService = require('./services/telegramIntegrationService');

// Seed Super Admin on startup if not exists and env provided
(async () => {
  // Fixed default credentials (can be overridden by env)
  const seedEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@tg.local';
  const seedPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@12345';
  try {
    const result = await seedSuperAdmin({ email: seedEmail, password: seedPassword });
    if (result.seeded) {
      console.log('Super admin seeded:', result.email);
    } else if (result.message) {
      console.log(result.message);
    } else if (result.error) {
      console.error('Super admin seed error:', result.error);
    }
  } catch (e) {
    console.error('Super admin seed exception:', e.message);
  }
})();
