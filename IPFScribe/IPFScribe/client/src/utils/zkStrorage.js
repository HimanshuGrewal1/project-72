import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptFile , encryptString } from "@lit-protocol/encryption"; // Correct import for 2026
import { checkAndSignAuthMessage } from "@lit-protocol/lit-node-client";
import { PinataSDK } from "pinata";
import { getLitClient } from "./litClient";

// Helper to chunk text (Simple character-based for now
const chunkText = (text, size = 1000) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
};

export const processAndEncryptChunks = async (fullText, userAddress, authSig) => {
  const litNodeClient = await getLitClient();

  const chunks = chunkText(fullText);
  const processedChunks = [];

  for (const text of chunks) {
    // 1. Get Embedding from Backend (Stateless call)
    const aiResponse = await fetch("http://localhost:5000/api/projects/llm/generate-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textChunk: text })
    });
    console.log("ai response status:", aiResponse);
    const { embedding, graph } = await aiResponse.json();
    console.log("Received embedding and graph for chunk:", { embedding, graph });
    // 2. Encrypt the Text Chunk locally
    const accessControlConditions = [{
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: { comparator: "=", value: userAddress },
    }];

    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        accessControlConditions,
        authSig,
        chain: "ethereum",
        dataToEncrypt: text,
      },
      litNodeClient
    );

    processedChunks.push({
      ciphertext,
      dataToEncryptHash,
      acc: accessControlConditions,
      embedding, // Numerical vector (Safe to store in plain sight)
      graph      // Extracted nodes/edges for this chunk
    });
  }

  return processedChunks;
};



const pinata = new PinataSDK({
  pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlNTM5OTYzMC04YWNiLTQ3MTYtYTIyZS1jY2I5NzQ1ZGNjMjIiLCJlbWFpbCI6InByaW5jZXJhajE1MDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijk3ZDQ5Nzc0OWI1MDU0NTEwNGVjIiwic2NvcGVkS2V5U2VjcmV0IjoiYmEwOTlmZTQ3OTQ1MjIxN2NlNzhhMzhhYWQ4YTVmMGYwYTc2YmFiZDczOTMzN2Q0NjVmOTg4ZGJkNjIyMTI5MSIsImV4cCI6MTgwNjY4NzMxMX0.OEtFGL1lf_Kj8OR4vJFL2FldCfm-BlWxY8dzlFZos3k", 
  pinataGateway: "violet-abstract-scallop-155.mypinata.cloud",
});

/*
API Key: 97d497749b50545104ec
API Secret: ba099fe479452217ce78a38aad8a5f0f0a76babd739337d465f988dbd6221291
JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlNTM5OTYzMC04YWNiLTQ3MTYtYTIyZS1jY2I5NzQ1ZGNjMjIiLCJlbWFpbCI6InByaW5jZXJhajE1MDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijk3ZDQ5Nzc0OWI1MDU0NTEwNGVjIiwic2NvcGVkS2V5U2VjcmV0IjoiYmEwOTlmZTQ3OTQ1MjIxN2NlNzhhMzhhYWQ4YTVmMGYwYTc2YmFiZDczOTMzN2Q0NjVmOTg4ZGJkNjIyMTI5MSIsImV4cCI6MTgwNjY4NzMxMX0.OEtFGL1lf_Kj8OR4vJFL2FldCfm-BlWxY8dzlFZos3k
*/


export const uploadEncryptedFile = async (file, userAddress,authSig ) => {
  // 1. Initialize & Connect to Lit
  const litNodeClient = await getLitClient();

  // 2. Get AuthSig (Required to prove identity to the nodes)
  // Since you are done with login, you can pass the existing signer or trigger this:
  // const authSig = await checkAndSignAuthMessage({
  //   chain: "ethereum",
  // });

  // 3. Define Access Control Conditions
  const accessControlConditions = [{
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "",
    parameters: [":userAddress"],
    returnValueTest: { comparator: "=", value: userAddress },
  }];

  // 4. Encrypt the file locally
  // In v7/v8, encryptFile is a standalone function that takes the client
  const { ciphertext, dataToEncryptHash } = await encryptFile(
    { 
      file, 
      accessControlConditions, 
      chain: "ethereum",
      authSig // Include authSig for node verification
    }, 
    litNodeClient
  );

  // 5. Upload Encrypted Blob to IPFS via Pinata
  // We use application/octet-stream because it is no longer a readable PDF
  const blobFile = new File([ciphertext], `${file.name}.enc`, { type: "application/octet-stream" });
  
  const upload = await pinata.upload.public.file(blobFile);

  return {
    cid: upload.cid,
    litHash: dataToEncryptHash,
    acc: accessControlConditions,
  };
};