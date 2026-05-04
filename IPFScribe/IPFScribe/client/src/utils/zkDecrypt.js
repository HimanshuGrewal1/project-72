import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { decryptToFile , decryptToString } from "@lit-protocol/encryption";
import { getLitClient } from "./litClient";

// Accept authSig as the second parameter
export const fetchAndDecrypt = async (docMetadata, authSig) => {
  const { ipfsCID, litHash, acc, fileName } = docMetadata;

  const litNodeClient = new LitNodeClient({ litNetwork: 'datil' });
  await litNodeClient.connect();

  // 1. Fetch the encrypted file from IPFS
  const response = await fetch(`https://violet-abstract-scallop-155.mypinata.cloud/ipfs/${ipfsCID}`);
  const encryptedBlob = await response.blob();

  // 2. Decrypt using the authSig PASSED FROM PROPS
  const decryptedFileArrayBuffer = await decryptToFile(
    {
      file: encryptedBlob,
      ciphertext: await encryptedBlob.arrayBuffer(),
      dataToEncryptHash: litHash,
      accessControlConditions: acc,
      chain: "ethereum",
      authSig, // <--- No new popup. It uses the signature from login!
    },
    litNodeClient
  );

  return new File([decryptedFileArrayBuffer], fileName.replace('.enc', ''), {
    type: "application/pdf",
  });
};

export const decryptTextChunk = async (chunk, authSig) => {
  const litNodeClient = await getLitClient();

  try {
    if(!authSig) throw new Error("No authSig provided for decryption!");
    console.log(chunk , "Attempting to decrypt with authSig:", authSig);
    // Decrypt the ciphertext back into a readable string
    const decryptedString = await decryptToString(
      {
        accessControlConditions: chunk.acc,
        ciphertext: chunk.encryptedText, // This is the encrypted string from MongoDB
        dataToEncryptHash: chunk.litHash,
        chain: "ethereum",
        authSig,
      },
      litNodeClient
    );
    console.log("Decrypted chunk:", decryptedString);
    return decryptedString;
  } catch (err) {
    console.error("Decryption failed for a chunk:", err);
    return null; 
  }
};