require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Renter = require('../models/Renter');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const renters = [
    { email: 'mickey@rentportal.com', password: 'Mickey@123' },
    { email: 'dinesh@rentportal.com', password: 'Dinesh@123' },
    { email: 'boor232@gmail.com',     password: 'Boor@123' },
  ];

  for (const { email, password } of renters) {
    const r = await Renter.findOne({ email });
    if (r) {
      r.password = password;
      await r.save();
      console.log('Reset:', email);
    }
  }

  await mongoose.disconnect();
})();
