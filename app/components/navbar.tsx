"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import RegisterModal from "@/app/components/registerModal";


export default function Navbar() {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
            router.push("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <>
            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-4 py-3 flex justify-between items-center">

                {/* Logo */}
                <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    BatteryMonitor
                </h1>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-3">

                    {/* ➕ Add Battery */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                        + Add
                    </button>

                    <ThemeToggle />

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                        Logout
                    </button>
                </div>

                {/* Mobile Actions */}
                <div className="flex sm:hidden items-center gap-2">
                    <ThemeToggle />
                </div>
            </nav>

            {/* 📱 Floating Add Button (Mobile Only) */}
            <button
                onClick={() => setShowModal(true)}
                className="sm:hidden fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-50 active:scale-90 transition"
            >
                +
            </button>

            {/* Modal */}
            {showModal && (
                <RegisterModal onClose={() => setShowModal(false)} />
            )}
        </>
    );
}