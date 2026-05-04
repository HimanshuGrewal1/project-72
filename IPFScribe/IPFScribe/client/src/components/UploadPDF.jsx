import { useState, useEffect } from 'react';
import { uploadEncryptedFile, processAndEncryptChunks } from '../utils/zkCrypto';
import axios from 'axios';
import SecureChat from './SecureChat';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker via CDN to avoid bundler configuration issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function UploadPDF({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [authSig, setAuthSig] = useState(null);
  const userAddress = localStorage.getItem('address');

  useEffect(() => {
    const getLocalSignature = async () => {
      if (!window.ethereum || !userAddress) return;
      try {
        const message = "Sign this message to unlock your Zero-Knowledge Librarian Vault.\n\nThis signature never leaves your browser and generates your local encryption key.";
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, userAddress]
        });
        setAuthSig(signature);
      } catch (err) {
        console.error("User denied signature", err);
      }
    };
    getLocalSignature();
  }, [userAddress]);

  // --- NEW: Helper function to extract text from PDF ---
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Loop through each page to extract text
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';
    }
    
    return fullText;
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") return alert("Please upload a PDF file.");
    if (!authSig) return alert("Please sign the MetaMask message to generate your keys!");
    
    setLoading(true);
    try {
      // 1. Upload the FULL encrypted binary PDF to IPFS (unchanged)
      const ipfsMetadata = await uploadEncryptedFile(file, authSig);
      
      // 2. Extract actual readable text from the PDF using pdfjs-dist
      const fileText = await extractTextFromPDF(file); 
      
      // 3. Pass the extracted text into your chunking & encryption pipeline (unchanged)
      const encryptedChunks = await processAndEncryptChunks(fileText, authSig);

      // 4. Save to DB (unchanged)
      await axios.post(`http://localhost:5000/api/projects/${projectId}/store-secure`, {
        cid: ipfsMetadata.cid,
        litHash: ipfsMetadata.litHash,
        encryptedChunks : encryptedChunks 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      alert("Zero-Knowledge Librarian has secured your data locally! 🔒🚀");
    } catch (err) {
      console.error(err);
      alert("Processing failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Data Source</h2>
          {authSig ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Keys Generated
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Waiting for Signature...
            </span>
          )}
        </div>

        <div className={`relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 group ${
          loading ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50 cursor-pointer'
        }`}>
          <input 
            type="file" 
            accept="application/pdf" // Restrict file picker to PDFs
            onChange={handleUpload} 
            disabled={loading} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            id="file-upload" 
          />
          <div className="flex flex-col items-center pointer-events-none">
            <div className="w-14 h-14 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl transform transition-transform group-hover:-translate-y-1">
              {loading ? "⏳" : "📄"}
            </div>
            <span className="text-indigo-700 font-bold text-sm text-center">
              {loading ? "Parsing & Encrypting Locally..." : "Click or drag PDF here"}
            </span>
            <span className="text-xs text-slate-400 mt-2 font-medium">
              E2E Encrypted via WebCrypto API
            </span>
          </div>
        </div>
      </div>
      <SecureChat projectId={projectId} authSig={authSig} />
    </div>
  );
}