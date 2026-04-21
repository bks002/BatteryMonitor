"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";

import { usePathname } from "next/navigation";
import Navbar from "@/app/components/navbar";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // ❌ Hide navbar on login page
    const hideNavbar = pathname === "/login";

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="bg-gray-100 dark:bg-gray-950">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

            {!hideNavbar && <Navbar />}

            <main>{children}</main>

        </ThemeProvider>
        </body>
        </html>
    );
}