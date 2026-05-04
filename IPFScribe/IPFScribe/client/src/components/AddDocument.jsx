import { useState } from 'react';
import { uploadEncryptedFile, processAndEncryptChunks } from '../utils/zkStorage';
import axios from 'axios';

export default function AddDocument({ projectId, authSig, onComplete }) {
  const [loading, setLoading] = useState(false);
  const userAddress = localStorage.getItem('address');

  const handleAppend = async (e) => {
    const file = e.target.files[0];
    if (!authSig || !projectId) return alert("Session missing!");

    setLoading(true);
    try {
      // 1. IPFS Upload
      const ipfsMetadata = await uploadEncryptedFile(file, userAddress, authSig);

      // 2. Local Encryption & Chunking
      const fileText = await file.text();
      const encryptedChunks = await processAndEncryptChunks(fileText, userAddress, authSig);

      // 3. Append to Existing Project on Backend
      await axios.post(`http://localhost:5000/api/projects/${projectId}/append`, {
        cid: ipfsMetadata.cid,
        litHash: ipfsMetadata.litHash,
        chunks: encryptedChunks
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      alert("New knowledge integrated into the graph!");
      if (onComplete) onComplete(); // Trigger graph refresh
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <input type="file" id="append-file" className="hidden" onChange={handleAppend} disabled={loading} />
      <label 
        htmlFor="append-file" 
        className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-500 transition-colors block text-center"
      >
        {loading ? "Adding Knowledge..." : "+ Add More Data to Project"}
      </label>
    </div>
  );
}