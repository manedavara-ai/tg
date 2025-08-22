const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail, isActive: true });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({ token, admin: { id: admin._id, email: admin.email, role: admin.role } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    // Only super-admin should reach here; roleMiddleware enforces
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Admin with this email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email: normalizedEmail, password: hashed, role: 'admin' });
    res.status(201).json({ id: admin._id, email: admin.email, role: admin.role });
  } catch (error) {
    res.status(500).json({ message: 'Create admin failed', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.admin || {};
    const admin = await Admin.findById(id).select('_id email role isActive createdAt');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ id: admin._id, email: admin.email, role: admin.role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

exports.listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).select('_id email role isActive createdAt').sort({ createdAt: -1 });
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'Failed to list admins', error: error.message });
  }
};

exports.updateAdminEmail = async (req, res) => {
  try {
    const { id } = req.params;
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    email = String(email).trim().toLowerCase();

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (admin.role === 'superadmin') return res.status(403).json({ message: 'Cannot modify Super Admin' });

    const exists = await Admin.findOne({ email, _id: { $ne: id } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    admin.email = email;
    await admin.save();
    res.json({ id: admin._id, email: admin.email, role: admin.role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update email', error: error.message });
  }
};

exports.updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (admin.role === 'superadmin') return res.status(403).json({ message: 'Cannot modify Super Admin' });

    const hashed = await bcrypt.hash(password, 10);
    admin.password = hashed;
    await admin.save();
    res.json({ id: admin._id, email: admin.email, role: admin.role, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (admin.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete Super Admin' });

    await Admin.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete admin', error: error.message });
  }
};

exports.seedSuperAdmin = async ({ email, password }) => {
  // to be called on server start
  try {
    const exists = await Admin.findOne({ role: 'superadmin' });
    if (exists) return { seeded: false, message: 'Super admin already exists' };
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email, password: hashed, role: 'superadmin' });
    return { seeded: true, id: admin._id, email: admin.email };
  } catch (e) {
    return { seeded: false, error: e.message };
  }
};


