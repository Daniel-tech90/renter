require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Admin.deleteMany({});
  await Admin.create({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  console.log('Admin reset to:', process.env.ADMIN_EMAIL);
  await mongoose.disconnect();
})();
