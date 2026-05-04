import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { decryptTextChunk } from '../utils/zkCrypto'; // Updated Import

export default function SecureChat({ projectId, authSig }) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loadingStatus]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query) return alert("Enter query and Gemini API Key");
    if (!authSig) return alert("Missing local encryption keys. Please sign with MetaMask.");
    
    const userMsg = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    try {
      setLoadingStatus('Searching vector vault...');
      const { data } = await axios.post(`http://localhost:5000/api/projects/${projectId}/query-secure`, {
        query: userMsg
      });

      setLoadingStatus('Unlocking private context locally...');
      let decryptedContext = "";
      
      for (const chunk of data.encryptedContext) {
        // Pass the chunk and the MetaMask signature
        const text = await decryptTextChunk(chunk, authSig); 
        if (text) decryptedContext += text + "\n\n";
      }

      if (!decryptedContext) throw new Error("Could not unlock data. Invalid Signature or corrupted data.");

      setLoadingStatus('AI is analyzing decrypted context...');
      const genAI = new GoogleGenerativeAI('AIzaSyCbRaRjbIuGfrBMMYbNdok0BqpXHw4n_bQ');
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        You are the Zero-Knowledge Librarian. Answer the user's question using ONLY the provided private context. 
        If the answer isn't in the context, say you don't know.
        CONTEXT: ${decryptedContext}
        QUESTION: ${userMsg}
      `;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'error', text: err.message }]);
    } finally {
      setLoadingStatus('');
    }
  };
  return (
    <div className="flex flex-col h-[600px] bg-[#0f172a] rounded-3xl border border-slate-700 shadow-2xl overflow-hidden relative">
      {/* Chat Header */}
      <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-white font-bold flex items-center gap-2 text-sm">
          <span className="text-indigo-400">⚡</span> ZK-Librarian AI
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-slate-400 font-mono">Secure Session</span>
        </div>
      </div>

      {/* <div className="px-4 py-3 bg-slate-900/50">
        <input 
          type="password" 
          placeholder="Enter Gemini API Key (Local RAM only)" 
          className="w-full p-2.5 bg-[#1e293b] rounded-lg border border-slate-600 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
        />
      </div> */}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
            <span className="text-4xl">🔐</span>
            <p className="text-sm font-medium">Your data is zero-knowledge encrypted.</p>
            <p className="text-xs">Ask questions about your uploaded PDFs.</p>
          </div>
        )}
        
        {chatHistory.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3.5 rounded-2xl max-w-[85%] shadow-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : m.role === 'error'
                ? 'bg-red-900/50 border border-red-500/50 text-red-200 rounded-tl-sm'
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{m.text}</p>
            </div>
          </div>
        ))}
        
        {loadingStatus && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-sm text-xs text-indigo-300 font-mono flex items-center gap-2 shadow-sm">
              <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {loadingStatus}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleAsk} className="p-4 bg-slate-800/80 border-t border-slate-700">
        <div className="relative flex items-center">
          <input 
            type="text" 
            className="w-full py-3 pl-4 pr-14 bg-[#0f172a] text-slate-200 rounded-xl outline-none border border-slate-600 focus:border-indigo-500 shadow-inner transition-all placeholder-slate-500 text-sm"
            placeholder="Query your private graph..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!query}
            className="absolute right-2 bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
}