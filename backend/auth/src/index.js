const express=require('express');
const cors=require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
 const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json());
const dotenv=require('dotenv');
dotenv.config();
 app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'auth-service running' });
});
app.use(errorHandler);

const PORT=process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Working auth');
});
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
  });
};

start();