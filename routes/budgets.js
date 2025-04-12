// routes/budgets.js
const express = require('express');
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Get all budgets for a user
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    
    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      // Determine date range based on period
      const now = new Date();
      let startDate = new Date();
      
      if (budget.period === 'Weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (budget.period === 'Monthly') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (budget.period === 'Yearly') {
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      // Calculate spent amount for this category in the period
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: req.user.id,
            category: budget.category,
            type: 'expense',
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const spentAmount = spent.length > 0 ? spent[0].total : 0;
      
      return {
        ...budget.toObject(),
        spent: spentAmount
      };
    }));
    
    res.json(budgetsWithSpent);
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, limit, period } = req.body;
    
    // Check if budget for this category already exists
    const existingBudget = await Budget.findOne({
      user: req.user.id,
      category
    });
    
    if (existingBudget) {
      return res.status(400).json({ message: 'Budget for this category already exists' });
    }
    
    const budget = new Budget({
      user: req.user.id,
      category,
      limit,
      period: period || 'Monthly'
    });
    
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update budget
router.put('/:id', auth, async (req, res) => {
  try {
    const { limit, period } = req.body;
    
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { limit, period },
      { new: true }
    );
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget removed' });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 