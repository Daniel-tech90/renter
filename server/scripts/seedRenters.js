require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Renter = require('../models/Renter');
const Admin = require('../models/Admin');

const renters = [
  { name: 'Aarav Sharma',   phone: '9876543201', roomNumber: '101', rentAmount: 6000, dueDate: 5,  email: 'aarav@rentportal.com',   password: 'Aarav@123' },
  { name: 'Priya Verma',    phone: '9876543202', roomNumber: '102', rentAmount: 5500, dueDate: 5,  email: 'priya@rentportal.com',   password: 'Priya@123' },
  { name: 'Rohit Gupta',    phone: '9876543203', roomNumber: '103', rentAmount: 7000, dueDate: 7,  email: 'rohit@rentportal.com',   password: 'Rohit@123' },
  { name: 'Sneha Patel',    phone: '9876543204', roomNumber: '104', rentAmount: 5000, dueDate: 7,  email: 'sneha@rentportal.com',   password: 'Sneha@123' },
  { name: 'Vikram Singh',   phone: '9876543205', roomNumber: '105', rentAmount: 6500, dueDate: 10, email: 'vikram@rentportal.com',  password: 'Vikram@123' },
  { name: 'Anjali Yadav',   phone: '9876543206', roomNumber: '106', rentAmount: 5800, dueDate: 10, email: 'anjali@rentportal.com',  password: 'Anjali@123' },
  { name: 'Karan Mehta',    phone: '9876543207', roomNumber: '107', rentAmount: 6200, dueDate: 12, email: 'karan@rentportal.com',   password: 'Karan@123' },
  { name: 'Pooja Joshi',    phone: '9876543208', roomNumber: '108', rentAmount: 5500, dueDate: 12, email: 'pooja@rentportal.com',   password: 'Pooja@123' },
  { name: 'Amit Tiwari',    phone: '9876543209', roomNumber: '109', rentAmount: 7500, dueDate: 15, email: 'amit@rentportal.com',    password: 'Amit@123' },
  { name: 'Neha Dubey',     phone: '9876543210', roomNumber: '110', rentAmount: 6000, dueDate: 15, email: 'neha@rentportal.com',    password: 'Neha@123' },
  { name: 'Suresh Kumar',   phone: '9876543211', roomNumber: '111', rentAmount: 5200, dueDate: 20, email: 'suresh@rentportal.com',  password: 'Suresh@123' },
  { name: 'Meena Rawat',    phone: '9876543212', roomNumber: '112', rentAmount: 5800, dueDate: 20, email: 'meena@rentportal.com',   password: 'Meena@123' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await Admin.findOne();
  if (!admin) { console.error('No admin found!'); process.exit(1); }

  let added = 0;
  for (const data of renters) {
    const exists = await Renter.findOne({ email: data.email });
    if (exists) { console.log(`Skip (exists): ${data.name}`); continue; }
    const r = new Renter({ ...data, adminId: admin._id });
    await r.save();
    console.log(`Added: ${data.name} — Room ${data.roomNumber}`);
    added++;
  }

  console.log(`\nDone! ${added} renters added.`);
  await mongoose.disconnect();
})();
