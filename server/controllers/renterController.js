const Renter = require('../models/Renter');
const Payment = require('../models/Payment');
const { sendWhatsApp } = require('../services/whatsappService');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { adminId: req.adminId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const renters = await Renter.find(filter).sort({ isActive: -1, createdAt: -1 });
    res.json(renters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const renter = await Renter.findOne({ _id: req.params.id, adminId: req.adminId });
    if (!renter) return res.status(404).json({ message: 'Renter not found' });
    res.json(renter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const renter = new Renter({ ...req.body, adminId: req.adminId });
    await renter.save();
    await sendWhatsApp(
      renter.phone,
      `Hello ${renter.name},\nWelcome to Ramesh Rental Portal\n\nRoom: ${renter.roomNumber}\nRent: ₹${renter.rentAmount}\n\nThank you!`
    );
    res.status(201).json(renter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const renter = await Renter.findOne({ _id: req.params.id, adminId: req.adminId });
    if (!renter) return res.status(404).json({ message: 'Renter not found' });
    const { password, ...rest } = req.body;
    Object.assign(renter, rest);
    // If renter was marked as left, restore them as active
    if (!renter.isActive) { renter.isActive = true; renter.leftAt = null; }
    if (password && password.trim()) renter.password = password.trim();
    await renter.save();
    res.json(renter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Renter.findOneAndUpdate({ _id: req.params.id, adminId: req.adminId }, { isActive: false, leftAt: new Date() });
    res.json({ message: 'Renter removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadGovtId = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const renter = await Renter.findOneAndUpdate(
      { _id: req.params.id, adminId: req.adminId },
      { govtIdDocUrl: req.file.path },
      { new: true }
    );
    if (!renter) return res.status(404).json({ message: 'Renter not found' });
    res.json({ govtIdDocUrl: renter.govtIdDocUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markLeft = async (req, res) => {
  try {
    const renter = await Renter.findOne({ _id: req.params.id, adminId: req.adminId });
    if (!renter) return res.status(404).json({ message: 'Renter not found' });
    renter.isActive = false;
    renter.leftAt = new Date();
    await renter.save();
    res.json({ message: `${renter.name} marked as left` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
