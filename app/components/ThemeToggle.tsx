"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Sync document class on initial mount based on localStorage or system preference
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        const currentTheme = resolvedTheme || theme;
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        
        // 1. Set next-themes state
        setTheme(nextTheme);
        
        // 2. Direct DOM manipulation fallback (bulletproof)
        if (nextTheme === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    if (!mounted) {
        return (
            <button className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-800">
                ☀️
            </button>
        );
    }

    const isDark = resolvedTheme === "dark" || theme === "dark";

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-150 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-500 hover:text-brand-green transition-all cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-800 w-9 h-9 active:scale-95"
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        >
            {isDark ? (
                // Moon Icon (Clean Premium SVG)
                <svg className="w-4.5 h-4.5 text-brand-gold fill-current" viewBox="0 0 24 24">
                    <path d="M21.752 15.002A9 9 0 0111.507 3.296 8 8 0 1021 14.502c-.102-.002-.204-.004-.3-.004-.326 0-.642.026-.948.077z" />
                </svg>
            ) : (
                // Sun Icon (Clean Premium SVG)
                <svg className="w-4.5 h-4.5 text-amber-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm9-7a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-15 0a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm14.364-5.364a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.343 17.657a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zm12.728 0a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM6.343 6.343a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
            )}
        </button>
    );
}