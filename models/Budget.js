const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  limit: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    required: true,
    enum: ['Weekly', 'Monthly', 'Yearly'],
    default: 'Monthly'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Budget', BudgetSchema); 