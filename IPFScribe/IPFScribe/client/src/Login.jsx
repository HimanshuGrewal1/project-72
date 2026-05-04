// client/src/Login.jsx
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const domain = window.location.host;
const origin = window.location.origin;

export default function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    async function signIn() {
        setLoading(true);
        try {
            // 1. Connect to Wallet
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // 2. Fetch Nonce from Backend
            const rec = await axios.get('http://localhost:3001/api/nonce');
            const nonce = rec.data;
            
            // 3. Prepare SIWE Message
            const message = new SiweMessage({
                domain,
                address,
                statement: 'Sign in to The Zero-Knowledge Librarian.',
                uri: origin,
                version: '1',
                chainId: 11155111,
                nonce: nonce,
            });

            const preparedMessage = message.prepareMessage();

            // 4. Sign the Message
            const signature = await signer.signMessage(preparedMessage);

            // 5. Verify with Backend
            const { data } = await axios.post('http://localhost:3001/api/verify', {
                message: preparedMessage,
                signature: signature
            });

            // 6. Save Data & Redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('address', address); // Save address for the dashboard greeting
            
            console.log("Authenticated! Token:", data.token);
            navigate('/dashboard'); // Direct to dashboard!

        } catch (error) {
            console.error("Login failed", error);
            alert("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <button onClick={()=>navigate("./dashboard")} >dashboard</button>
            <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full transform transition-all hover:scale-105">
                <div className="text-6xl mb-4">📚</div>
                <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">
                    ZK Librarian
                </h1>
                <p className="text-gray-600 mb-8 font-medium">
                    Your decentralized, zero-knowledge workspace.
                </p>

                <button 
                    onClick={signIn} 
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg transform transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="animate-pulse">Connecting...</span>
                    ) : (
                        <>
                            <span>🦊</span> Connect MetaMask
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}