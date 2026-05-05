// client/src/PassLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PassLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });

      localStorage.setItem('token', res.data.token);

      if (res.data.walletAddress) {
        localStorage.setItem('address', res.data.walletAddress);
      } else {
        localStorage.removeItem('address');
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl flex rounded-2xl overflow-hidden border border-slate-200 shadow-sm">

        {/* ── Sidebar ── */}
        <div className="w-52 flex-shrink-0 bg-indigo-950 flex flex-col justify-between p-6">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L12 4v6L7 13 2 10V4L7 1z" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-medium text-indigo-100">ZeroVault</span>
            </div>

            {/* Decorative security blurbs */}
            <div className="flex flex-col gap-4">
              {[
                { icon: 'M12 1L2 5v4c0 5 4 9 10 10 6-1 10-5 10-10V5L12 1z', label: 'Zero-knowledge encryption', sub: 'Your data is never exposed' },
                { icon: 'M8 1a5 5 0 100 10A5 5 0 008 1zM3 8a5 5 0 0110 0', label: 'Non-custodial vault', sub: 'Only you hold the keys' },
                { icon: 'M1 8s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6z M8 6a2 2 0 100 4 2 2 0 000-4z', label: 'End-to-end private', sub: 'Encrypted at rest & transit' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d={icon} stroke="#a5b4fc" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-200">{label}</p>
                    <p className="text-xs text-white/25 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/20 leading-relaxed">
            End-to-end encrypted.<br />Zero knowledge. Non-custodial.
          </p>
        </div>

        {/* ── Main Panel ── */}
        <div className="flex-1 bg-white p-8 flex flex-col justify-center">

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-400">Log in to access your zero-knowledge vault.</p>
          </div>

          {error && (
            <div className="mb-5 px-3 py-2.5 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
              />
            </div>

            <div className="mb-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Master password
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                    {showPw && <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 mb-5">
              <input
                type="checkbox"
                id="remember"
                className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer select-none">
                Keep me signed in for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? 'Decrypting vault…' : 'Log in →'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* MetaMask login shortcut */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all group"
            onClick={() => navigate('/login')}
          >
            <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 32 32">
                <polygon points="27,5 17.5,11.8 19.4,7.6" fill="#E17726" />
                <polygon points="5,5 14.4,11.9 12.6,7.6" fill="#E27625" />
                <polygon points="23.4,21.6 20.8,25.7 26.5,27.3 28.2,21.7" fill="#E27625" />
                <polygon points="3.8,21.7 5.5,27.3 11.2,25.7 8.6,21.6" fill="#E27625" />
                <polygon points="10.9,14.5 9.2,17.1 14.8,17.4 14.6,11.3" fill="#E27625" />
                <polygon points="21.1,14.5 17.3,11.2 17.2,17.4 22.8,17.1" fill="#E27625" />
                <polygon points="11.2,25.7 14.4,24 11.6,21.7" fill="#E27625" />
                <polygon points="17.6,24 20.8,25.7 20.4,21.7" fill="#E27625" />
              </svg>
            </div>
            <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Continue with MetaMask</span>
            <svg className="ml-auto text-slate-300 group-hover:text-slate-400 transition-colors" width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <p className="text-center text-xs text-slate-400 mt-5">
            Don't have a vault?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-indigo-500 font-medium hover:underline"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}