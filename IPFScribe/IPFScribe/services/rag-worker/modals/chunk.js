import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema({
  projectId: String,
  
  // REPLACED `text` WITH ENCRYPTED BLOB AND LIT METADATA
  encryptedText: String, // The AES-GCM ciphertext from Lit
  litHash: String,       // Required to ask Lit for decryption shares
  acc: Array,            // Access Control Conditions (e.g., NFT ownership)
  
  embedding: [Number]    // Left unencrypted so Vector Search still works
});
export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);