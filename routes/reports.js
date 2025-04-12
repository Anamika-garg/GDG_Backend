// routes/reports.js
const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const router = express.Router();


// Get weekly summary
router.get('/weekly', auth, async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const transactions = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: oneWeekAgo },
          type: 'expense'
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);
    
    // Calculate total expenses for the week
    const totalExpenses = transactions.reduce((sum, category) => sum + category.total, 0);
    
    // Add percentage for each category
    const report = transactions.map(category => ({
      category: category._id,
      total: category.total,
      count: category.count,
      percentage: Math.round((category.total / totalExpenses) * 100)
    }));
    
    res.json({
      startDate: oneWeekAgo,
      endDate: new Date(),
      totalExpenses,
      categories: report
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monthly summary by category
router.get('/monthly', auth, async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const transactions = await Transaction.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          date: { $gte: oneMonthAgo },
          type: 'expense'
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            week: { $week: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          weeklyData: {
            $push: {
              week: '$_id.week',
              total: '$total'
            }
          },
          total: { $sum: '$total' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);
    
    res.json({
      startDate: oneMonthAgo,
      endDate: new Date(),
      categories: transactions
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;