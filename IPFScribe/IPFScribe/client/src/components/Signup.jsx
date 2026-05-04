// client/src/Signup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Signup() {
  const navigate = useNavigate();
  
  // UI State
  const [step, setStep] = useState(1); // 1 = Credentials, 2 = Wallet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
   const [name, setname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // STEP 1: Handle Email/Password Registration
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log('Submitting signup with:', { name, email, password });

    try {
      const res2 = await axios.post('http://localhost:8001/api/auth/signupf', { name,email, password });
       const res = await axios.post('http://localhost:5000/api/auth/signup', {email, password });
      // Save JWT to local storage
      localStorage.setItem('token', res.data.token);
      
      // Move to wallet linking step
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Handle Wallet Linking
  const handleLinkWallet = async () => {
    if (!window.ethereum) {
      return setError("MetaMask is not installed. Please install it to continue.");
    }

    setLoading(true);
    setError('');

    try {
      // 1. Ask user to connect wallet
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      // 2. Send wallet address to backend to map it to the email account
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/link-wallet', 
        { walletAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Save address locally and go to Dashboard
      localStorage.setItem('address', walletAddress);
      navigate('/dashboard');

    } catch (err) {
      console.error("Failed to link wallet:", err);
      setError("Failed to link wallet. Did you reject the request?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            {step === 1 ? 'Create Vault' : 'Secure Vault'}
          </h1>
          <p className="text-slate-500 font-medium">
            {step === 1 
              ? 'Enter your details to initialize your zero-knowledge workspace.' 
              : 'Link your Web3 wallet to generate your cryptographic master keys.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* STEP 1 VIEW: Email & Password */}
        {step === 1 && (
          <form onSubmit={handleSignup} className="space-y-5">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
              <input 
                type="text" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setname(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Master Password</label>
              <input 
                type="password" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-70 mt-4"
            >
              {loading ? 'Creating Account...' : 'Continue →'}
            </button>
          </form>
        )}

        {/* STEP 2 VIEW: Link Wallet */}
        {step === 2 && (
          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl shadow-inner border border-indigo-100">
              🦊
            </div>
            
            <button 
              onClick={handleLinkWallet}
              disabled={loading}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                'Waiting for approval...'
              ) : (
                <><span>🔗</span> Connect MetaMask</>
              )}
            </button>

            <button 
              onClick={() => navigate('/dashboard')}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-4"
            >
              I'll do this later (Read-Only Mode)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}