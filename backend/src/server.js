require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

// Import routes
const userRoutes = require('./routes/users');
const { router: claimRoutes, setEmitFunction } = require('./routes/claims');

// Import models
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/leaderboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  // Seed initial data if no users exist
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const initialUsers = [
      { name: 'Rahul', totalPoints: 0 },
      { name: 'Kamal', totalPoints: 0 },
      { name: 'Sanak', totalPoints: 0 },
      { name: 'Priya', totalPoints: 0 },
      { name: 'Amit', totalPoints: 0 },
      { name: 'Neha', totalPoints: 0 },
      { name: 'Vikram', totalPoints: 0 },
      { name: 'Sonia', totalPoints: 0 },
      { name: 'Raj', totalPoints: 0 },
      { name: 'Meera', totalPoints: 0 }
    ];
    
    await User.insertMany(initialUsers);
    console.log('Initial users seeded');
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/claims', claimRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Leaderboard backend running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Emit leaderboard updates
const emitLeaderboardUpdate = async () => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    const leaderboard = users.map((user, index) => ({
      id: user._id,
      name: user.name,
      totalPoints: user.totalPoints,
      rank: index + 1
    }));
    io.emit('leaderboardUpdate', leaderboard);
  } catch (error) {
    console.error('Error emitting leaderboard update:', error);
  }
};

// Set the emit function in the claims routes
setEmitFunction(emitLeaderboardUpdate);

module.exports = { app, server, io, emitLeaderboardUpdate }; 