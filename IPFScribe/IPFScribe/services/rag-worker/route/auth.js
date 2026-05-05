// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../modals/user.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-zk-key";

// Step 1: Create Account
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
    console.log("Signup attempt for email:", email);
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use." });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User (walletAddress is initially null)
    const newUser = await User.create({ email, password: hashedPassword });

    // Generate token
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: "Account created", token });
  } catch (err) {
    console.error("Signup failed:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Step 2: Link Wallet to Account
router.post('/link-wallet', async (req, res) => {
  const { walletAddress } = req.body;

  console.log("Wallet linking attempt for address:", walletAddress);
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Verify the user is logged in
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if wallet is already used by someone else
    // const walletExists = await User.findOne({ walletAddress });
    // if (walletExists && walletExists._id.toString() !== decoded.id) {
    //   return res.status(400).json({ error: "Wallet already linked to another account." });
    // }

    // Update the user's document with their wallet
    await User.findByIdAndUpdate(decoded.id, { walletAddress });

    res.status(200).json({ message: "Wallet linked successfully!" });
  } catch (err) {
    console.error("Wallet linking failed:", err);
    res.status(500).json({ error: "Failed to link wallet" });
  }
});

// Add this below your signup route in routes/auth.js

// Step 3: Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 2. Check the password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 3. Generate Token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // 4. Return token and wallet status
    res.status(200).json({ 
      message: "Login successful", 
      token,
      walletAddress: user.walletAddress || null // Let frontend know if a wallet is linked
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;