// src/components/Login.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e, isSignUp) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = isSignUp
                ? await supabase.auth.signUp({ email, password })
                : await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;
            if (!isSignUp) navigate('/studio'); // Send to studio on login
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-black font-mono overflow-hidden relative flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-tactical-grid opacity-60 pointer-events-none" />
            <div className="absolute inset-0 z-10 bg-noise pointer-events-none" />
            <div className="absolute inset-0 z-10 vignette pointer-events-none" />
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                <div className="h-[1px] w-full bg-cyan-500 animate-scanline shadow-[0_0_20px_#06b6d4] opacity-70" />
            </div>

            {/* Login Terminal */}
            <div className="relative z-30 w-full max-w-md backdrop-blur-xl bg-black/80 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col">
                {/* Terminal Header */}
                <div className="p-4 border-b border-cyan-500/50 bg-gradient-to-r from-white/[0.03] to-transparent flex justify-between items-center relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    <div>
                        <p className="text-[9px] tracking-[0.5em] text-zinc-500 mb-1">NARRATIVE_OS</p>
                        <p className="text-sm tracking-widest font-bold text-cyan-400 drop-shadow-[0_0_8px_currentColor]">SECURE_UPLINK</p>
                    </div>
                </div>

                {/* Auth Form */}
                <form className="p-6 flex flex-col gap-6">
                    {error && (
                        <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-xs tracking-widest uppercase animate-pulse">
                            [ERR] {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] tracking-[0.4em] text-zinc-500 mb-2">OPERATIVE_ID (EMAIL)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950/80 border border-white/10 px-4 py-3 text-cyan-400 text-xs tracking-widest focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                            placeholder="Enter credentials..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] tracking-[0.4em] text-zinc-500 mb-2">PASSPHRASE</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950/80 border border-white/10 px-4 py-3 text-cyan-400 text-xs tracking-widest focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={(e) => handleAuth(e, false)}
                            disabled={loading}
                            className="btn-glitch flex-1 py-3 bg-cyan-500/10 border border-cyan-500 text-cyan-400 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-cyan-500/20 transition-all"
                        >
                            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                        </button>
                        <button
                            onClick={(e) => handleAuth(e, true)}
                            disabled={loading}
                            className="flex-1 py-3 bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-white/5 transition-all"
                        >
                            REGISTER
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}