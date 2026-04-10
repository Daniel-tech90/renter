require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');
const { startCronJobs } = require('./services/cronService');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/renters', require('./routes/renters'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((_, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, _, res, __) => res.status(500).json({ message: err.message }));

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdmin();
  startCronJobs();
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Close the other process and try again.`);
      process.exit(1);
    }
  });
});
