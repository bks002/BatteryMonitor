"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/app/components/navbar";
import Link from "next/link";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const hideNavbar = pathname === "/login";

    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("bgv_sidebar_pinned");
        if (stored) {
            setIsPinned(stored === "true");
        }
    }, []);

    const handleToggleSidebar = () => {
        const nextState = !isPinned;
        setIsPinned(nextState);
        localStorage.setItem("bgv_sidebar_pinned", String(nextState));
    };

    const isExpanded = isPinned || isHovered;

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="bg-[#f8fafc] dark:bg-[#090d16] text-[#0f172a] dark:text-[#f1f5f9] transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

            {hideNavbar ? (
                <main>{children}</main>
            ) : (
                <div className="flex flex-col min-h-screen">
                    <Navbar onToggleSidebar={handleToggleSidebar} isSidebarPinned={isPinned} />
                    
                    <div className="flex flex-1 pt-[73px]">
                        {/* Left Sidebar Navigation (Desktop) */}
                        <aside 
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className={`hidden md:flex flex-col fixed top-[73px] bottom-0 left-0 bg-sidebar-bg text-sidebar-text border-r border-gray-200 dark:border-gray-800 z-30 justify-between transition-all duration-300 ease-in-out ${
                                isExpanded ? "w-64" : "w-16"
                            }`}
                        >
                            <div 
                                className="flex flex-col gap-6 transition-all duration-300"
                                style={{
                                    padding: isExpanded ? "24px" : "24px 12px"
                                }}
                            >
                                {/* Sidebar Navigation Tabs */}
                                <nav className="flex flex-col gap-1">
                                    <Link
                                        href="/"
                                        className={`saas-sidebar-item ${pathname === "/" ? "active" : ""} ${
                                            isExpanded ? "gap-3" : "gap-0 justify-center"
                                        }`}
                                        style={{
                                            padding: isExpanded ? "10px 16px" : "10px 0px"
                                        }}
                                        title={!isExpanded ? "Dashboard" : undefined}
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21.75h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21.75h7.5" />
                                        </svg>
                                        <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                            isExpanded ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
                                        }`}>
                                            Dashboard
                                        </span>
                                    </Link>
                                    <Link
                                        href="/onboarding"
                                        className={`saas-sidebar-item ${pathname === "/onboarding" ? "active" : ""} ${
                                            isExpanded ? "gap-3" : "gap-0 justify-center"
                                        }`}
                                        style={{
                                            padding: isExpanded ? "10px 16px" : "10px 0px"
                                        }}
                                        title={!isExpanded ? "Onboard Drivers" : undefined}
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                        </svg>
                                        <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                            isExpanded ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
                                        }`}>
                                            Onboard Drivers
                                        </span>
                                    </Link>
                                    <Link
                                        href="/usertypes"
                                        className={`saas-sidebar-item ${pathname === "/usertypes" ? "active" : ""} ${
                                            isExpanded ? "gap-3" : "gap-0 justify-center"
                                        }`}
                                        style={{
                                            padding: isExpanded ? "10px 16px" : "10px 0px"
                                        }}
                                        title={!isExpanded ? "Manage Roles" : undefined}
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                        </svg>
                                        <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                            isExpanded ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
                                        }`}>
                                            Manage Roles
                                        </span>
                                    </Link>
                                    <Link
                                        href="/loans"
                                        className={`saas-sidebar-item ${pathname === "/loans" ? "active" : ""} ${
                                            isExpanded ? "gap-3" : "gap-0 justify-center"
                                        }`}
                                        style={{
                                            padding: isExpanded ? "10px 16px" : "10px 0px"
                                        }}
                                        title={!isExpanded ? "EMI Loans" : undefined}
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                                        </svg>
                                        <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                            isExpanded ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
                                        }`}>
                                            EMI Loans
                                        </span>
                                    </Link>
                                    <Link
                                        href="/track"
                                        className={`saas-sidebar-item ${pathname === "/track" ? "active" : ""} ${
                                            isExpanded ? "gap-3" : "gap-0 justify-center"
                                        }`}
                                        style={{
                                            padding: isExpanded ? "10px 16px" : "10px 0px"
                                        }}
                                        title={!isExpanded ? "Track Vehicles" : undefined}
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                        </svg>
                                        <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                            isExpanded ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
                                        }`}>
                                            Track Vehicles
                                        </span>
                                    </Link>
                                </nav>
                            </div>
                            
                            {/* Bottom profile info inside sidebar */}
                            <div 
                                className="border-t border-gray-200 dark:border-slate-800 transition-all duration-300"
                                style={{
                                    padding: isExpanded ? "24px" : "24px 12px"
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center font-bold text-sm shrink-0 animate-pulse">
                                        BG
                                    </div>
                                    <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                        isExpanded ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
                                    }`}>
                                        <p className="text-xs font-bold text-slate-850 dark:text-white leading-tight">Admin Console</p>
                                        <p className="text-[10px] text-slate-500 leading-tight">BharatGreenVolt</p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content Area */}
                        <div className={`flex-1 transition-all duration-300 ease-in-out flex flex-col min-h-screen ${
                            isPinned ? "md:pl-64" : "md:pl-16"
                        }`}>
                            <main className="flex-1 bg-brand-gray-light dark:bg-gray-950">
                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            )}

        </ThemeProvider>
        </body>
        </html>
    );
}