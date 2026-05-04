import { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAndDecrypt } from '../utils/zkDecrypt';

export default function DocumentList() {
  const [docs, setDocs] = useState([]);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    // Fetch metadata (CIDs and Lit Hashes) from your MongoDB
    const fetchDocs = async () => {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/docs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocs(data);
    };
    fetchDocs();
  }, []);

  const handleDownload = async (doc) => {
    setIsDecrypting(true);
    try {
      const decryptedFile = await fetchAndDecrypt(doc);
      
      // Create a temporary URL to view/download the PDF
      const url = window.URL.createObjectURL(decryptedFile);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decryptedFile.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Decryption failed! Are you the owner?", err);
      alert("Decryption Failed: You might not have the required NFT/Access.");
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Your Private Library</h2>
      <div className="grid gap-4">
        {docs.map((doc) => (
          <div key={doc._id} className="p-4 border rounded flex justify-between items-center">
            <span>{doc.fileName}</span>
            <button 
              onClick={() => handleDownload(doc)}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={isDecrypting}
            >
              {isDecrypting ? "Decrypting..." : "Decrypt & Open"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}