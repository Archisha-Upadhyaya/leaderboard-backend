const express = require('express');
const User = require('../models/User');
const Claim = require('../models/Claim');
const router = express.Router();

// Get the emitLeaderboardUpdate function
let emitLeaderboardUpdate;

// Function to set the emit function (called from server.js)
const setEmitFunction = (emitFn) => {
  emitLeaderboardUpdate = emitFn;
};

// Claim points for a user
router.post('/claim', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate random points (1-10)
    const points = Math.floor(Math.random() * 10) + 1;
    
    // Update user's total points
    user.totalPoints += points;
    await user.save();
    
    // Create claim record
    const claim = new Claim({
      userId: user._id,
      userName: user.name,
      points: points
    });
    await claim.save();
    
    // Emit leaderboard update to all connected clients
    if (emitLeaderboardUpdate) {
      emitLeaderboardUpdate();
    }
    
    res.json({
      success: true,
      points: points,
      totalPoints: user.totalPoints,
      claim: {
        id: claim._id,
        userId: claim.userId,
        userName: claim.userName,
        points: claim.points,
        claimedAt: claim.claimedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get claim history
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const claims = await Claim.find()
      .sort({ claimedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalClaims = await Claim.countDocuments();
    
    res.json({
      claims: claims.map(claim => ({
        id: claim._id,
        userId: claim.userId,
        userName: claim.userName,
        points: claim.points,
        claimedAt: claim.claimedAt
      })),
      pagination: {
        page,
        limit,
        total: totalClaims,
        pages: Math.ceil(totalClaims / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = { router, setEmitFunction }; 