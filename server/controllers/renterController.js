const Renter = require('../models/Renter');
const Payment = require('../models/Payment');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const renters = await Renter.find(filter).sort({ createdAt: -1 });
    res.json(renters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const renter = await Renter.findById(req.params.id);
    if (!renter) return res.status(404).json({ message: 'Renter not found' });
    res.json(renter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const renter = await Renter.create(req.body);
    res.status(201).json(renter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const renter = await Renter.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!renter) return res.status(404).json({ message: 'Renter not found' });
    res.json(renter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Renter.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Renter removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
