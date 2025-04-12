// routes/transactions.js
const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Add new transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, description, category, type, date } = req.body;
    
    const transaction = new Transaction({
      user: req.user.id,
      amount,
      description,
      category,
      type,
      date: date || Date.now()
    });
    
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, description, category, type, date } = req.body;
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { amount, description, category, type, date },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;