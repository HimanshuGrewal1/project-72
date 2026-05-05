// client/src/Signup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Signup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const name = `${firstName} ${lastName}`.trim();

  const getStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strengthColor = (score) => {
    if (score <= 1) return 'bg-red-400';
    if (score <= 2) return 'bg-orange-400';
    return 'bg-green-400';
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    setError('');
    try {
      const res2 = await axios.post('http://localhost:8001/api/auth/signupf', { name, email, password });
      const res = await axios.post('http://localhost:5000/api/auth/signup', { email, password });
      localStorage.setItem('token', res.data.token);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!window.ethereum) return setError('MetaMask is not installed. Please install it to continue.');
    setLoading(true);
    setError('');
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/auth/link-wallet',
        { walletAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('address', walletAddress);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to link wallet:', err);
      setError('Failed to link wallet. Did you reject the request?');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl flex rounded-2xl overflow-hidden border border-slate-200 shadow-sm">

        {/* ── Sidebar ── */}
        <div className="w-52 flex-shrink-0 bg-indigo-950 flex flex-col justify-between p-6">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L12 4v6L7 13 2 10V4L7 1z" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-medium text-indigo-100">ZeroVault</span>
            </div>

            {/* Steps */}
            <div className="flex flex-col">
              {[
                { num: 1, label: 'Your details', sub: 'Name, email & password' },
                { num: 2, label: 'Connect wallet', sub: 'Link your Web3 identity' },
              ].map(({ num, label, sub }) => {
                const done = step > num;
                const active = step === num;
                return (
                  <div key={num} className="flex items-start gap-2.5 py-3.5 border-b border-white/[0.07] last:border-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium
                      ${done ? 'bg-indigo-500 text-white' : active ? 'bg-white text-indigo-950' : 'bg-white/10 text-white/30'}`}>
                      {done ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : num}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${active ? 'text-indigo-100' : done ? 'text-indigo-300/50' : 'text-white/30'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-white/25 mt-0.5">{sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-white/20 leading-relaxed">
            End-to-end encrypted.<br />Zero knowledge. Non-custodial.
          </p>
        </div>

        {/* ── Main Panel ── */}
        <div className="flex-1 bg-white p-8 flex flex-col justify-center">

          {error && (
            <div className="mb-5 px-3 py-2.5 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleSignup}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Create your account</h2>
                <p className="text-sm text-slate-400">Start your zero-knowledge workspace in seconds.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">First name</label>
                  <input
                    type="text" required placeholder="Jane" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Last name</label>
                  <input
                    type="text" required placeholder="Smith" value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email address</label>
                <input
                  type="email" required placeholder="jane@university.edu" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Master password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required placeholder="min. 8 characters" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition-all"
                  />
                  <button
                    type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </button>
                </div>
                {password && (
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${i <= strength ? strengthColor(strength) : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account…' : 'Continue →'}
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                Already have a vault?{' '}
                <a href="/login" className="text-indigo-500 font-medium hover:underline">Sign in</a>
              </p>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Connect your wallet</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Your wallet generates the cryptographic keys that protect your vault. We never store your private key.
                </p>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['Non-custodial', 'Zero-knowledge', 'E2E encrypted'].map((b) => (
                  <span key={b} className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 text-slate-500 rounded-full">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {b}
                  </span>
                ))}
              </div>

              {/* MetaMask */}
              <button
                onClick={handleLinkWallet} disabled={loading}
                className="w-full flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-slate-50 transition-all group mb-2.5 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 32 32">
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
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700">MetaMask</p>
                  <p className="text-xs text-slate-400">Browser extension wallet</p>
                </div>
                <svg className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* WalletConnect — disabled placeholder */}
              <button
                disabled
                className="w-full flex items-center gap-3 p-3.5 border border-slate-100 rounded-xl opacity-40 cursor-not-allowed mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 32 32">
                    <path d="M9.6 11.2c3.5-3.5 9.3-3.5 12.8 0l.4.4 2.1-2.1-.4-.5C19.6 4.1 12.4 4.1 7.5 9l-.4.5 2.1 2.1.4-.4z" fill="#3b99fc" />
                    <path d="M16 14.4l-1.7-1.7c-.9-.9-2.4-.9-3.4 0l-5.5 5.5 2.1 2.1 5.5-5.5.9.9.9-.9 5.5 5.5 2.1-2.1-5.5-5.5c-1-.9-2.4-.9-3.4 0L16 14.4z" fill="#3b99fc" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700">
                    WalletConnect <span className="text-xs font-normal text-slate-400 ml-1">coming soon</span>
                  </p>
                  <p className="text-xs text-slate-400">Mobile & desktop wallets</p>
                </div>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-300">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 text-sm text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                Skip for now — continue in read-only mode
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
