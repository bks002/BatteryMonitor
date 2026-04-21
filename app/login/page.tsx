"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setError("Invalid credentials");
                return;
            }

            router.push("/");
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">

            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">

                {/* Title */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Login to access your dashboard
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 text-sm text-red-500 text-center">
                        {error}
                    </div>
                )}

                {/* Username */}
                <input
                    type="text"
                    placeholder="Username"
                    className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {/* Password */}
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Button */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? "Signing in..." : "Login"}
                </button>

                {/* Footer */}
                <p className="text-xs text-center text-gray-400 mt-4">
                    IOT Dashboard
                </p>
            </div>
        </div>
    );
}