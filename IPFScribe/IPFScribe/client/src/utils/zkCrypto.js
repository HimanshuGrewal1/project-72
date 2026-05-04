import { PinataSDK } from "pinata";

// Note: Ensure your Pinata JWT is correctly configured here
const pinata = new PinataSDK({
  pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlNTM5OTYzMC04YWNiLTQ3MTYtYTIyZS1jY2I5NzQ1ZGNjMjIiLCJlbWFpbCI6InByaW5jZXJhajE1MDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjM2YzE2NDNiMjJmNTI0ZDcwNzIxIiwic2NvcGVkS2V5U2VjcmV0IjoiNTkwY2RjNzQ1MGRiOTU0MmZkMTA2MTc5ZTQ5NDZhYjljZTYxMDBjNzBiNzg2YmU4ZWNlMjU3M2FhODY0NGRiYyIsImV4cCI6MTgwOTQ1NDcxMX0.i_HON0zrEYM_jsjrQYNrLuGH_wxPhD4YRgl7oNswUA0", // Replace with your JWT
  pinataGateway: "violet-abstract-scallop-155.mypinata.cloud",
});

// --- HELPER FUNCTIONS ---
const chunkText = (text, size = 1000) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
};

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- CORE CRYPTO: DERIVE KEY FROM METAMASK SIGNATURE ---
const deriveKey = async (signature) => {
  const enc = new TextEncoder();
  // We use the signature as the raw key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(signature),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // A static salt for the project
  const salt = enc.encode("ZK-Librarian-Salt-2026");
  
  return await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// --- 1. ENCRYPT & UPLOAD FULL FILE TO PINATA ---
export const uploadEncryptedFile = async (file, signature) => {
  const key = await deriveKey(signature);
  const fileBuffer = await file.arrayBuffer();
  
  // Generate random 96-bit IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileBuffer
  );

  // Prepend IV to the file so we can decrypt it if downloaded later
  const combinedBuffer = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(ciphertextBuffer), iv.length);

  const blobFile = new File([combinedBuffer], `${file.name}.enc`, { type: "application/octet-stream" });
  const upload = await pinata.upload.public.file(blobFile);

  return {
    cid: upload.cid,
    litHash: "LOCAL_NATIVE_ENCRYPTION", 
    acc: [],
  };
};

// --- 2. ENCRYPT CHUNKS FOR MONGODB ---
export const processAndEncryptChunks = async (fullText, signature) => {
  const key = await deriveKey(signature);
  const chunks = chunkText(fullText);
  const processedChunks = [];

  for (const text of chunks) {
    // 1. Get Embedding/Graph from Backend (Stateless call)
    const aiResponse = await fetch("http://localhost:5000/api/projects/llm/generate-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textChunk: text })
    });
    const { embedding, graph } = await aiResponse.json();

    // 2. Encrypt the Text Chunk locally via WebCrypto
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(text)
    );

    // MAPPING HACK: We store the IV in the 'litHash' field to avoid changing the MongoDB Schema!
    processedChunks.push({
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      dataToEncryptHash: arrayBufferToBase64(iv), // IV goes to litHash
      acc: [], // Empty array for schema compatibility
      embedding, 
      graph      
    });
  }

  return processedChunks;
};

// --- 3. DECRYPT CHUNKS IN BROWSER ---
export const decryptTextChunk = async (chunk, signature) => {
  try {
    const key = await deriveKey(signature);
    
    // Retrieve IV from litHash and Ciphertext from encryptedText
    const iv = base64ToArrayBuffer(chunk.litHash); 
    const ciphertextBuffer = base64ToArrayBuffer(chunk.encryptedText);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertextBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error("Local decryption failed. Wrong signature?", error);
    return null;
  }
};