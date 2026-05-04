import express from 'express';
import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Hashed password
  walletAddress: { type: String, unique: true, sparse: true }, // Linked wallet
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);