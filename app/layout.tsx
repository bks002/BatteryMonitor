"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
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

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="bg-[#f8fafc] dark:bg-[#090d16] text-[#0f172a] dark:text-[#f1f5f9] transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

            {hideNavbar ? (
                <main>{children}</main>
            ) : (
                <div className="flex min-h-screen">
                    {/* Left Sidebar Navigation (Desktop) */}
                    <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-sidebar-bg text-sidebar-text border-r border-gray-200 dark:border-gray-800 z-30 justify-between">
                        <div className="p-6 flex flex-col gap-6">
                            {/* Logo & Brand */}
                            <div 
                                onClick={() => router.push("/")}
                                className="flex flex-col cursor-pointer group select-none gap-1"
                            >
                                <img 
                                    src="/bharat-logo.png" 
                                    alt="BharatGreenVolt" 
                                    className="h-10 w-auto object-contain transition-transform group-hover:scale-[1.02] self-start"
                                />
                                <span className="text-[9.5px] font-black text-brand-green tracking-widest pl-1">
                                    POWERING GREEN MILES
                                </span>
                            </div>

                            {/* Sidebar Navigation Tabs */}
                            <nav className="flex flex-col gap-1">
                                <Link
                                    href="/"
                                    className={`saas-sidebar-item ${pathname === "/" ? "active" : ""}`}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21.75h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21.75h7.5" />
                                    </svg>
                                    Dashboard
                                </Link>
                                <Link
                                    href="/onboarding"
                                    className={`saas-sidebar-item ${pathname === "/onboarding" ? "active" : ""}`}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                    </svg>
                                    Onboard Drivers
                                </Link>
                                <Link
                                    href="/usertypes"
                                    className={`saas-sidebar-item ${pathname === "/usertypes" ? "active" : ""}`}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                    </svg>
                                    Manage Roles
                                </Link>
                                <Link
                                    href="/track"
                                    className={`saas-sidebar-item ${pathname === "/track" ? "active" : ""}`}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                    </svg>
                                    Track Vehicles
                                </Link>
                            </nav>
                        </div>
                        
                        {/* Bottom profile info inside sidebar */}
                        <div className="p-6 border-t border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center font-bold text-sm">
                                    BG
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-850 dark:text-white leading-tight">Admin Console</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">BharatGreenVolt</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                        <Navbar />
                        <main className="flex-1 bg-brand-gray-light dark:bg-gray-950">
                            {children}
                        </main>
                    </div>
                </div>
            )}

        </ThemeProvider>
        </body>
        </html>
    );
}