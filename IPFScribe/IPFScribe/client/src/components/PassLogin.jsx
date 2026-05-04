import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PassLogin() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:8001/api/auth/login', { email, password });
      
      // 1. Save the auth token
      localStorage.setItem('token', res.data.token);
      
      // 2. If they already linked a wallet, save it so the dashboard knows who they are
      if (res.data.walletAddress) {
        localStorage.setItem('address', res.data.walletAddress);
      } else {
        // Optional: If you want to force them to link a wallet on login, you could redirect to a /link-wallet page here
        localStorage.removeItem('address');
      }

      // 3. Go to Dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
            📚
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">
            Log in to access your Zero-Knowledge Vault.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-slate-700">Master Password</label>
            </div>
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
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-70 mt-2"
          >
            {loading ? 'Decrypting Vault...' : 'Log In →'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-slate-500 font-medium">
            Don't have an account yet?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="text-indigo-600 font-bold hover:text-indigo-500 transition-colors"
            >
              Create Vault
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}