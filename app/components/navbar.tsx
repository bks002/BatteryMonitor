"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import RegisterModal from "@/app/components/registerModal";

interface NavbarProps {
    onToggleSidebar?: () => void;
    isSidebarPinned?: boolean;
}

export default function Navbar({ onToggleSidebar, isSidebarPinned }: NavbarProps = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [showModal, setShowModal] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [lang, setLang] = useState<"en" | "hi">("en");
    const [mounted, setMounted] = useState(false);
    const [copied, setCopied] = useState(false);
    const [adminName, setAdminName] = useState<string>("Admin");

    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem("bgv_lang") as "en" | "hi";
        if (savedLang) {
            setLang(savedLang);
        }

        const fetchAdminName = async () => {
            try {
                const res = await fetch("/api/bgvusers");
                if (res.ok) {
                    const users = await res.json();
                    const adminUser = users.find((u: any) => u.UserTypeId === 1 || u.UserTypeName?.toLowerCase() === "admin");
                    if (adminUser) {
                        const fullName = `${adminUser.FirstName} ${adminUser.LastName}`.trim();
                        if (fullName) {
                            setAdminName(fullName);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch admin name:", err);
            }
        };
        fetchAdminName();
    }, []);

    const handleLangChange = (newLang: "en" | "hi") => {
        setLang(newLang);
        localStorage.setItem("bgv_lang", newLang);
        window.dispatchEvent(new Event("bgv_lang_changed"));
    };

    const handleCopyAccountId = () => {
        navigator.clipboard.writeText("f6aed599b531");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleTheme = () => {
        const currentTheme = resolvedTheme || theme;
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        if (nextTheme === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
    const isHindi = lang === "hi";

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
        if (pathname === "/loans") return "EMI Loan Ledger";
        if (pathname === "/track") return "Live Tracking";
        if (pathname.startsWith("/drivers/")) return "Driver Profile";
        return "Console";
    };

    return (
        <>
            {/* TOP HEADER BAR */}
            <nav className="fixed top-0 left-0 right-0 h-[73px] z-40 bg-sidebar-bg/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center transition-colors">
                
                {/* Left side: Page Title (Desktop) & Logo (Mobile) */}
                <div className="flex items-center gap-4">
                    {/* Hamburger Button (Desktop only) */}
                    <button
                        onClick={onToggleSidebar}
                        className="hidden md:flex p-2 rounded-xl bg-gray-50/50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-brand-green hover:border-brand-green/30 dark:hover:border-brand-green/30 transition-all cursor-pointer items-center justify-center active:scale-95"
                        title={isSidebarPinned ? "Collapse Sidebar" : "Pin Sidebar"}
                    >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    {/* Desktop Logo */}
                    <div 
                        onClick={() => router.push("/")}
                        className="hidden md:flex flex-col cursor-pointer select-none gap-0.5 items-start"
                    >
                        <img 
                            src="/bharat-logo.png" 
                            alt="BharatGreenVolt" 
                            className="h-8.5 w-auto object-contain"
                        />
                        <span className="text-[8px] font-black text-brand-green tracking-widest pl-0.5 mt-[-1px] uppercase">
                            POWERING GREEN MILES
                        </span>
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
                            href="/loans"
                            title="EMI Loans"
                            className={`p-1.5 rounded-lg transition-colors ${
                                pathname === "/loans"
                                    ? "bg-brand-green/10 text-brand-green"
                                    : "text-gray-400 hover:text-brand-green"
                            }`}
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
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
                        <span>{isHindi ? "बैटरी जोड़ें" : "Add Battery"}</span>
                    </button>

                    {/* Notifications Button */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="p-2 rounded-xl bg-gray-55 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-brand-green transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-4 z-50 text-xs font-semibold animate-scale-in">
                                <h3 className="font-extrabold mb-2 text-brand-navy dark:text-white uppercase tracking-wider text-[10px]">{isHindi ? "सूचनाएं" : "Notifications"}</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                        <p className="text-brand-navy dark:text-white text-[11px] leading-snug">{isHindi ? "नया ड्राइवर रोहन शर्मा ने आधार सत्यापन पूरा किया।" : "New driver Rohan Sharma completed Aadhar verification."}</p>
                                        <span className="text-[9px] text-gray-400 mt-1 block">5m ago</span>
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                        <p className="text-brand-navy dark:text-white text-[11px] leading-snug">{isHindi ? "बैटरी CCLN26B0153 का SOC 15% से कम हो गया।" : "Battery CCLN26B0153 SOC dropped below 15%."}</p>
                                        <span className="text-[9px] text-gray-400 mt-1 block">1h ago</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-1.5 p-1 pr-2 rounded-full bg-blue-50/50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-755 transition-all cursor-pointer border border-gray-200 dark:border-gray-800 active:scale-95 shrink-0"
                            title={isHindi ? `${adminName === "Mudit Sharma" ? "मुदित शर्मा" : adminName} खाता` : `${adminName} Account`}
                        >
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {userDropdownOpen && (
                            <div className="absolute right-0 mt-2.5 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-4 z-50 text-xs font-semibold animate-scale-in">
                                {/* Dropdown Header */}
                                <div className="pb-3.5 border-b border-gray-100 dark:border-gray-800 space-y-1">
                                    <h4 className="font-extrabold text-[12.5px] text-brand-navy dark:text-white leading-tight">
                                        {isHindi ? `नमस्ते, ${adminName === "Mudit Sharma" ? "मुदित शर्मा" : adminName}` : `Hi, ${adminName}`}
                                    </h4>
                                    <div className="flex items-center justify-between text-gray-400 dark:text-gray-500 font-normal">
                                        <span className="text-[10px] font-mono leading-none">
                                            {isHindi ? "खाता आईडी: " : "Account ID: "}f6aed599b531
                                        </span>
                                        <button 
                                            onClick={handleCopyAccountId}
                                            className="text-blue-500 hover:text-blue-600 cursor-pointer p-0.5 rounded transition-colors"
                                            title="Copy Account ID"
                                        >
                                            {copied ? (
                                                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-3a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M16.5 7.5h3.375c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H16.5" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="pt-2 space-y-1">
                                    {/* Account Details */}
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-200 transition-colors cursor-pointer select-none">
                                        <svg className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                        <span>{isHindi ? "खाता विवरण" : "Account Details"}</span>
                                    </div>

                                    {/* Dark Mode Toggle */}
                                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-700 dark:text-gray-200">
                                            <svg className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                            <span>{isHindi ? "डार्क मोड" : "Dark Mode"}</span>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                isDark ? "bg-brand-green" : "bg-gray-255 dark:bg-gray-700"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    isDark ? "translate-x-4" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Language Switcher */}
                                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-700 dark:text-gray-200">
                                            <svg className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m-4-3h1.5a1 1 0 011 1v1.5a1 1 0 001 1h2m-4-3a2 2 0 00-2 2v1a2 2 0 01-2 2h-1" />
                                            </svg>
                                            <span>{isHindi ? "भाषा" : "Language"}</span>
                                        </div>
                                        <select
                                            value={lang}
                                            onChange={(e) => handleLangChange(e.target.value as "en" | "hi")}
                                            className="bg-transparent border-none text-slate-800 dark:text-gray-200 font-bold focus:outline-none text-[11px] cursor-pointer text-right"
                                        >
                                            <option value="en" className="bg-white dark:bg-gray-900 text-brand-navy dark:text-white">English</option>
                                            <option value="hi" className="bg-white dark:bg-gray-900 text-brand-navy dark:text-white">हिंदी</option>
                                        </select>
                                    </div>

                                    {/* Log Out */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 transition-colors cursor-pointer text-left font-bold"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>{isHindi ? "लॉग आउट करें" : "Log Out"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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