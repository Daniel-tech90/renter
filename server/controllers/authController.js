const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Renter = require('../models/Renter');

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Admin login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(admin._id, 'admin'), email: admin.email, role: 'admin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Renter login
exports.renterLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const renter = await Renter.findOne({ email, isActive: true });
    if (!renter || !renter.password)
      return res.status(401).json({ message: 'Invalid credentials' });

    const match = await renter.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      token: signToken(renter._id, 'renter'),
      role: 'renter',
      renter: {
        id: renter._id,
        name: renter.name,
        email: renter.email,
        phone: renter.phone,
        roomNumber: renter.roomNumber,
        rentAmount: renter.rentAmount,
        dueDate: renter.dueDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.seedAdmin = async () => {
  const admins = [
    { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    { email: process.env.ADMIN2_EMAIL, password: process.env.ADMIN2_PASSWORD },
  ].filter((a) => a.email && a.password);

  for (const { email, password } of admins) {
    const exists = await Admin.findOne({ email });
    if (!exists) {
      await Admin.create({ email, password });
      console.log('Admin seeded:', email);
    }
  }
};
