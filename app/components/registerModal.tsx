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

            onClose();
        } catch {
            setError("Failed to save");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">

            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Register Battery
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Input */}
                <input
                    type="text"
                    placeholder="Enter battery name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Error */}
                {error && (
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-6">

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        Save
                    </button>

                </div>
            </div>
        </div>
    );
}