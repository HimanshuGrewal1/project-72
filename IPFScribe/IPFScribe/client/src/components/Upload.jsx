import { useState } from 'react';
import { uploadEncryptedFile } from '../utils/zkStrorage.js';

export default function Upload({ userAddress , authSig}){
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setLoading(true);

    try {
      // Step A: Encrypt and Upload to IPFS
      const metadata = await uploadEncryptedFile(file, userAddress , authSig);

      // Step B: Notify your MERN Backend
      await fetch("http://localhost:5000/api/docs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...metadata,
          fileName: file.name,
          owner: userAddress
        }),
      });
      alert("Uploaded Zero-Knowledge Style! 🔒");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-2 border-dashed border-blue-500 rounded-lg">
      <input type="file" onChange={handleUpload} disabled={loading} />
      {loading && <p className="mt-2 animate-pulse">Encrypting & Uploading...</p>}
    </div>
  );
}