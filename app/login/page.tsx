"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type LoginTab = "password" | "otp";

export default function LoginPage() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<LoginTab>("password");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Password Login State
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // OTP Login State
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [resendTimer, setResendTimer] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Countdown Timer logic for OTP
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [resendTimer]);

    const handlePasswordLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!username.trim() || !password) {
            setError("Both username and password are required.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error || "Invalid username/phone or password.");
                return;
            }

            setSuccessMsg("Access authorized. Redirecting to Fleet Console...");
            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch (err) {
            console.error(err);
            setError("Unable to communicate with authentication servers.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPhone = phoneNumber.replace(/\D/g, "");
        if (trimmedPhone.length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch("/api/login/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: trimmedPhone }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error || "Failed to send OTP. Account may not exist.");
                return;
            }

            setOtpSent(true);
            setResendTimer(60); // 60 seconds cooldown
            setSuccessMsg("A verification code has been dispatched to your mobile.");
        } catch (err) {
            console.error(err);
            setError("Connection failed. Check your network or API status.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPhone = phoneNumber.replace(/\D/g, "");
        if (trimmedPhone.length !== 10) {
            setError("Invalid mobile number.");
            return;
        }

        if (otpCode.trim().length !== 6) {
            setError("OTP must be exactly 6 digits.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch("/api/login/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: trimmedPhone, otp: otpCode.trim() }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error || "The OTP code entered is invalid or expired.");
                return;
            }

            setSuccessMsg("OTP Verified! Connecting to Admin Console...");
            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch (err) {
            console.error(err);
            setError("An error occurred during verification.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneChange = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setPhoneNumber(digits);
        if (error) setError("");
    };

    const handleOtpCodeChange = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 6);
        setOtpCode(digits);
        if (error) setError("");
    };

    const fillMockCredentials = () => {
        setUsername("abcd@gmail.com");
        setPassword("123456");
        setError("");
        setSuccessMsg("");
    };

    const resetOtpState = () => {
        setOtpSent(false);
        setOtpCode("");
        setError("");
        setSuccessMsg("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] text-slate-850 dark:text-white px-4 select-none relative overflow-hidden transition-colors">
            {/* Dynamic Glassmorphism Background Spheres */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/5 dark:bg-brand-green/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <div className="w-full max-w-md bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-gray-800 transition-all">
                {/* Logo & Brand Header */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <img
                        src="/bharat-logo.png"
                        alt="BharatGreenVolt"
                        className="h-14 w-auto object-contain mb-3"
                    />
                    <p className="text-[10px] font-black text-brand-green uppercase tracking-widest pl-0.5">
                        HERO FLEET CONSOLE
                    </p>
                </div>

                {/* Tab Controls */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-850 rounded-2xl mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("password");
                            setError("");
                            setSuccessMsg("");
                        }}
                        className={`py-2.5 rounded-xl font-bold text-xs text-center cursor-pointer transition-all ${
                            activeTab === "password"
                                ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                                : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
                        }`}
                    >
                        Password
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("otp");
                            setError("");
                            setSuccessMsg("");
                        }}
                        className={`py-2.5 rounded-xl font-bold text-xs text-center cursor-pointer transition-all ${
                            activeTab === "otp"
                                ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                                : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
                        }`}
                    >
                        SMS OTP
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400 text-center animate-shake">
                        ⚠️ {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-5 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-xs font-bold text-green-600 dark:text-green-400 text-center animate-fade-in">
                        ✓ {successMsg}
                    </div>
                )}

                {/* Tab: Password Login */}
                {activeTab === "password" && (
                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-455 block ml-1">
                                Fleet Username / Mobile / Email
                            </label>
                            <input
                                type="text"
                                placeholder="Email or 10-digit phone number"
                                required
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (error) setError("");
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-455 block ml-1">
                                Security Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError("");
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-955 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md shadow-brand-green/20 hover:shadow-lg hover:shadow-brand-green/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-4"
                        >
                            {loading ? "Authenticating..." : "Sign In to Dashboard"}
                        </button>
                    </form>
                )}

                {/* Tab: OTP Login */}
                {activeTab === "otp" && (
                    <div className="space-y-4">
                        {!otpSent ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-455 block ml-1">
                                        Registered Mobile Number
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 inset-y-0 flex items-center text-xs text-slate-500 dark:text-gray-450 font-bold">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            placeholder="Enter 10-digit number"
                                            required
                                            value={phoneNumber}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                                        />
                                    </div>
                                    <p className="text-[9.5px] text-slate-400 dark:text-gray-500 font-medium pl-1 leading-normal">
                                        We will send a 6-digit one-time passcode to this device.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md shadow-brand-green/20 hover:shadow-lg hover:shadow-brand-green/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-4"
                                >
                                    {loading ? "Requesting OTP..." : "Dispatch verification OTP"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-855 p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-white">
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] text-slate-400 dark:text-gray-500 block uppercase">Verifying Mobile</span>
                                        <span>+91 {phoneNumber}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={resetOtpState}
                                        className="text-[10px] text-brand-green hover:underline cursor-pointer"
                                    >
                                        Edit Number
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-455 block ml-1">
                                        One-Time Passcode (6 Digits)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="••••••"
                                        required
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => handleOtpCodeChange(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-955 text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-slate-900 dark:text-white transition-all placeholder:text-slate-450 dark:placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-gray-400 font-bold px-1 mt-1">
                                    {resendTimer > 0 ? (
                                        <span>Resend OTP in {resendTimer}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={loading}
                                            className="text-brand-green hover:underline font-bold cursor-pointer disabled:opacity-50"
                                        >
                                            Resend OTP Packet
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otpCode.trim().length !== 6}
                                    className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md shadow-brand-green/20 hover:shadow-lg hover:shadow-brand-green/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-2"
                                >
                                    {loading ? "Verifying OTP..." : "Verify & Authorize Access"}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Pre-filled credentials helper for testing */}
                {activeTab === "password" && (
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-gray-850 text-center animate-fade-in">
                        <p className="text-[10.5px] text-slate-400 dark:text-gray-500 font-semibold">
                            Developer Testing Account
                        </p>
                        <button
                            onClick={fillMockCredentials}
                            className="mt-2 text-xs text-brand-green hover:text-brand-green-hover font-bold border-b border-dashed border-brand-green hover:border-brand-green-hover transition-colors cursor-pointer"
                        >
                            Auto-fill Demo Admin Credentials
                        </button>
                    </div>
                )}

                {/* Footer text */}
                <p className="text-[9.5px] text-center text-slate-405 dark:text-gray-500 font-bold uppercase tracking-widest mt-8">
                    Asset Tracker v2.0
                </p>
            </div>
        </div>
    );
}