"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setError("Invalid username or password");
                return;
            }

            router.push("/");
        } catch (err) {
            setError("Something went wrong. Please check your API backend.");
        } finally {
            setLoading(false);
        }
    };

    const fillMockCredentials = () => {
        setUsername("bgvuser");
        setPassword("bgvpass");
        setError("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-radial from-brand-navy-light to-brand-navy px-4 select-none relative overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="w-full max-w-md bg-white/95 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-800 animate-scale-in">
                
                {/* Logo & Brand */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <img 
                        src="/bharat-logo.png" 
                        alt="BharatGreenVolt" 
                        className="h-16 w-auto object-contain mb-3"
                    />
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                        Hero Fleet Console
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 text-center animate-shake">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1.5 ml-1">
                            Fleet Username
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. admin"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-brand-navy dark:text-white font-medium transition-all"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1.5 ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-brand-navy dark:text-white font-medium transition-all"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-green/20 hover:shadow-lg hover:shadow-brand-green/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                        {loading ? "Authenticating..." : "Sign In to Dashboard"}
                    </button>
                </form>

                {/* Helper Auto-Fill for Testing */}
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Need quick testing credentials?
                    </p>
                    <button
                        onClick={fillMockCredentials}
                        className="mt-2 text-xs text-brand-green hover:text-brand-green-hover font-bold border-b border-dashed border-brand-green hover:border-brand-green-hover transition-colors cursor-pointer"
                    >
                        Auto-fill Demo Admin Account
                    </button>
                </div>

                {/* Footer text */}
                <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-8">
                    Asset Tracker v2.0
                </p>
            </div>
        </div>
    );
}