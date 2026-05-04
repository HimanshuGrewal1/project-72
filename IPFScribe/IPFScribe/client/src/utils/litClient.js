import { LitNodeClient } from "@lit-protocol/lit-node-client";

let litNodeClientInstance = null;

export const getLitClient = async () => {
  if (litNodeClientInstance && litNodeClientInstance.ready) {
    return litNodeClientInstance;
  }

  // Create instance if it doesn't exist
  if (!litNodeClientInstance) {
    litNodeClientInstance = new LitNodeClient({
      litNetwork: 'datil', // Ensure this is devnet
      debug: false,
      connectTimeout: 20000, // Give it 20 seconds
      checkNodeAttestation: false
    });
  }

  // Only connect if not already connecting
  try {
    await litNodeClientInstance.connect();
    return litNodeClientInstance;
  } catch (err) {
    console.error("Lit Handshake failed:", err);
    // Reset instance on failure so we can try again
    litNodeClientInstance = null;
    throw err;
  }
};