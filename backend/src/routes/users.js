const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all users with rankings
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    const usersWithRank = users.map((user, index) => ({
      id: user._id,
      name: user.name,
      totalPoints: user.totalPoints,
      rank: index + 1
    }));
    res.json(usersWithRank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new user
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this name already exists' });
    }
    
    const user = new User({
      name: name.trim(),
      totalPoints: 0
    });
    
    const savedUser = await user.save();
    res.status(201).json({
      id: savedUser._id,
      name: savedUser.name,
      totalPoints: savedUser.totalPoints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboard (top users)
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 }).limit(10);
    const leaderboard = users.map((user, index) => ({
      id: user._id,
      name: user.name,
      totalPoints: user.totalPoints,
      rank: index + 1
    }));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 