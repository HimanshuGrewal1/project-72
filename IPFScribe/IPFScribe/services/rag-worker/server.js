// server.js
import express from  'express';
import cors from  'cors';
import bodyParser from 'body-parser';
import ragrouter from './route/rag.js';
import authRoutes from './route/auth.js';
const app = express();
const PORT = 5000;

app.use(cors({
    origin:"*" // Allow requests from React frontend
}));
// Increase limit because PDF text can be large
app.use(bodyParser.json({ limit: '50mb' }));


app.use("/api/projects", ragrouter);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});