require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!admin) return console.log('No admin found for:', process.env.ADMIN_EMAIL);
  console.log('Found admin:', admin.email);
  const match = await admin.comparePassword(process.env.ADMIN_PASSWORD);
  console.log('Password match:', match);
  await mongoose.disconnect();
})();
