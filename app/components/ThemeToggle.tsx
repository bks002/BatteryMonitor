"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Fix hydration issue
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
        >
            {theme === "dark" ? "🌙" : "☀️"}
        </button>
    );
}