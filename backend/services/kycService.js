// const User = require('../models/user.model');

// exports.createUser = async (userData) => {
//   const user = new User(userData);  // 👈 create a new User instance
//   return await user.save();         // ✅ now safe to call save()
// };


// exports.getAllUsers = async () => {
//   return await User.find().populate("Invoice");
// };

// exports.getUserById = async (id) => {
//   return await User.findById(id);
// };

// exports.updateUserById = async (id, updateData) => {
//   return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
// };

// exports.deleteUserById = async (id) => {
//   return await User.findByIdAndDelete(id);
// };
const User = require('../models/user.model');

exports.upsertUserByEmail = async (userData) => {
  try {
    // If userid is not provided, create a new user
    if (!userData.userid) {
      const newUser = new User(userData);
      return await newUser.save();
    }

    // If userid is provided, try to update existing user
    return await User.findByIdAndUpdate(
      userData.userid,
      { $set: userData },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Error in upsertUserByEmail: ${error.message}`);
  }
};
exports.getAllUsers = async () => {
  return await User.find();
};

exports.getUserById = async (id) => {
  return await User.findById(id);
};

exports.updateUserById = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

exports.deleteUserById = async (id) => {
  return await User.findByIdAndDelete(id);
};

exports.getTodayUsers = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return await User.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
};
