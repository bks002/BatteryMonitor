"use client";

import { useState } from "react";

type Props = {
    onClose: () => void;
    onSave?: (name: string) => void;
};

export default function RegisterModal({ onClose, onSave }: Props) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Battery name is required");
            return;
        }

        try {
            const res = await fetch("/api/register-device", {
                method: "POST",
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error();

            // Notify dashboard of newly registered battery
            window.dispatchEvent(new Event("battery-registered"));

            if (onSave) {
                onSave(name);
            }
            onClose();
        } catch {
            setError("Failed to save battery registration");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">

            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-150 dark:border-gray-800 animate-scale-in">

                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-base font-black text-brand-navy dark:text-white uppercase tracking-tight">
                        Register New Battery Pack
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-brand-navy dark:hover:text-white cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Input */}
                <input
                    type="text"
                    placeholder="e.g. CCLN26B0153"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-xs font-semibold text-brand-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                />

                {/* Error */}
                {error && (
                    <p className="text-[11px] text-red-500 font-semibold mt-2.5">{error}</p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2.5 mt-6">

                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 text-xs bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-brand-green/20"
                    >
                        Save Battery
                    </button>

                </div>
            </div>
        </div>
    );
}