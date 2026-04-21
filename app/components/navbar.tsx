"use client";

import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-4 py-3 flex justify-between items-center ">

            {/* Logo */}
            <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                BatteryMonitor
            </h1>

            {/* Right side */}
            <div className="flex items-center gap-3">

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Login Button */}
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                    Logout
                </button>
            </div>
        </nav>
    );
}