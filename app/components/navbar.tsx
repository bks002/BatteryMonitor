"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import RegisterModal from "@/app/components/registerModal";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [showModal, setShowModal] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
            router.push("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // Determine page title based on path
    const getPageTitle = () => {
        if (pathname === "/") return "Fleet Console";
        if (pathname === "/onboarding") return "Driver Onboarding";
        if (pathname === "/usertypes") return "Role Settings";
        if (pathname === "/track") return "Live Tracking";
        if (pathname.startsWith("/drivers/")) return "Driver Profile";
        return "Console";
    };

    return (
        <>
            {/* TOP HEADER BAR */}
            <nav className="sticky top-0 z-40 bg-sidebar-bg/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center transition-colors">
                
                {/* Left side: Page Title (Desktop) & Logo (Mobile) */}
                <div className="flex items-center gap-4">
                    {/* Desktop Title */}
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            BharatGreenVolt
                        </span>
                        <h1 className="text-base font-black text-brand-navy dark:text-white tracking-tight">
                            {getPageTitle()}
                        </h1>
                    </div>

                    {/* Mobile Logo */}
                    <div 
                        onClick={() => router.push("/")}
                        className="flex md:hidden items-center cursor-pointer"
                    >
                        <img 
                            src="/bharat-logo.png" 
                            alt="BharatGreenVolt" 
                            className="h-8 w-auto object-contain"
                        />
                    </div>
                </div>

                {/* Right side Actions */}
                <div className="flex items-center gap-3">
                    {/* Navigation for Mobile */}
                    <div className="flex md:hidden items-center gap-1.5 mr-2 bg-gray-50 dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                        <Link
                            href="/"
                            title="Dashboard"
                            className={`p-1.5 rounded-lg transition-colors ${
                                pathname === "/"
                                    ? "bg-brand-green/10 text-brand-green"
                                    : "text-gray-400 hover:text-brand-green"
                            }`}
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21.75h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21.75h7.5" />
                            </svg>
                        </Link>
                        <Link
                            href="/onboarding"
                            title="Onboard Drivers"
                            className={`p-1.5 rounded-lg transition-colors ${
                                pathname === "/onboarding"
                                    ? "bg-brand-green/10 text-brand-green"
                                    : "text-gray-400 hover:text-brand-green"
                            }`}
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                            </svg>
                        </Link>
                        <Link
                            href="/usertypes"
                            title="Manage Roles"
                            className={`p-1.5 rounded-lg transition-colors ${
                                pathname === "/usertypes"
                                    ? "bg-brand-green/10 text-brand-green"
                                    : "text-gray-400 hover:text-brand-green"
                            }`}
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                            </svg>
                        </Link>
                        <Link
                            href="/track"
                            title="Track Vehicles"
                            className={`p-1.5 rounded-lg transition-colors ${
                                pathname === "/track"
                                    ? "bg-brand-green/10 text-brand-green"
                                    : "text-gray-400 hover:text-brand-green"
                            }`}
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                            </svg>
                        </Link>
                    </div>

                    {/* Add Battery */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-xs bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1 active:scale-[0.97] transition-all shadow-md shadow-brand-green/10 cursor-pointer"
                    >
                        <span>Add Battery</span>
                    </button>

                    {/* Notifications Button */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-brand-green transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-4 z-50 text-xs font-semibold animate-scale-in">
                                <h3 className="font-extrabold mb-2 text-brand-navy dark:text-white uppercase tracking-wider text-[10px]">Notifications</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                        <p className="text-brand-navy dark:text-white text-[11px] leading-snug">New driver Rohan Sharma completed Aadhar verification.</p>
                                        <span className="text-[9px] text-gray-400 mt-1 block">5m ago</span>
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                        <p className="text-brand-navy dark:text-white text-[11px] leading-snug">Battery CCLN26B0153 SOC dropped below 15%.</p>
                                        <span className="text-[9px] text-gray-400 mt-1 block">1h ago</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 px-3.5 py-2 rounded-xl font-bold active:scale-[0.97] transition-all cursor-pointer border border-red-100 dark:border-red-900/30"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Floating Add Button (Mobile Only) */}
            <button
                onClick={() => setShowModal(true)}
                className="sm:hidden fixed bottom-6 right-6 bg-brand-green hover:bg-brand-green-hover text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-40 active:scale-95 transition-all shadow-brand-green/20"
            >
                +
            </button>

            {/* Register Modal */}
            {showModal && (
                <RegisterModal onClose={() => setShowModal(false)} />
            )}
        </>
    );
}