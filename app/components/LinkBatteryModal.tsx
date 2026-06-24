"use client";

import { useState, useEffect } from "react";

type Props = {
    userId: number;
    userName: string;
    onClose: () => void;
    onSuccess: () => void;
};


interface BatteryStatus {
    deviceId: string;
    inUseByUserId: number | null;
    inUseByUserName: string | null;
    deviceRecordId: number | null;
}

export default function LinkBatteryModal({ userId, userName, onClose, onSuccess }: Props) {
    const [batteryStatuses, setBatteryStatuses] = useState<BatteryStatus[]>([]);
    const [selectedBattery, setSelectedBattery] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchBatteryUsage = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bgvusers");
            if (!res.ok) throw new Error("Failed to load active fleet");
            const users = await res.json();

            // Analyze battery allocations
            const usageMap: Record<string, { userId: number; userName: string; deviceRecordId: number }> = {};
            users.forEach((user: any) => {
                if (user.Devices && Array.isArray(user.Devices)) {
                    user.Devices.forEach((dev: any) => {
                        const cleanId = dev.DeviceId.trim().toUpperCase();
                        usageMap[cleanId] = {
                            userId: user.UserId,
                            userName: `${user.FirstName} ${user.LastName}`.trim(),
                            deviceRecordId: dev.Id
                        };
                    });
                }
            });

            // Fetch catalog devices from database
            let catalogBatteries: string[] = [];
            try {
                const devListRes = await fetch("/api/bgvusers/devices");
                if (devListRes.ok) {
                    const devicesData = await devListRes.json();
                    if (Array.isArray(devicesData)) {
                        catalogBatteries = devicesData.map((d: any) => d.DeviceCode.trim().toUpperCase());
                    }
                }
            } catch (err) {
                console.error("Error fetching catalog devices:", err);
            }

            // Fetch dynamically registered batteries from Google Sheet
            let dynamicBatteries = [...catalogBatteries];
            try {
                const sheetRes = await fetch("/api/get-registered-devices");
                if (sheetRes.ok) {
                    const sheetData = await sheetRes.json();
                    if (Array.isArray(sheetData)) {
                        sheetData.forEach((item: any) => {
                            if (item.batteryName && typeof item.batteryName === "string") {
                                const cleanName = item.batteryName.trim().toUpperCase();
                                if (cleanName && !dynamicBatteries.includes(cleanName)) {
                                    dynamicBatteries.push(cleanName);
                                }
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching registered devices:", err);
            }

            // Map status of each battery
            const statuses = dynamicBatteries.map((deviceId) => {
                const usage = usageMap[deviceId.toUpperCase()];
                return {
                    deviceId,
                    inUseByUserId: usage ? usage.userId : null,
                    inUseByUserName: usage ? usage.userName : null,
                    deviceRecordId: usage ? usage.deviceRecordId : null
                };
            });

            setBatteryStatuses(statuses);
            
            // Auto-select first available or default
            const firstAvailable = statuses.find(s => s.inUseByUserId === null);
            if (firstAvailable) {
                setSelectedBattery(firstAvailable.deviceId);
            } else if (statuses.length > 0) {
                setSelectedBattery(statuses[0].deviceId);
            }
        } catch (err: any) {
            console.error("Error analyzing battery usage:", err);
            setError("Could not analyze current battery allocations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatteryUsage();
    }, []);

    const handleLink = async () => {
        if (!selectedBattery) {
            setError("Please select a battery to link");
            return;
        }

        setActionLoading(true);
        setError("");

        try {
            const targetStatus = batteryStatuses.find(s => s.deviceId === selectedBattery);

            // If the battery is already in use by someone else, we must unlink it first
            if (targetStatus && targetStatus.inUseByUserId !== null && targetStatus.deviceRecordId !== null) {
                // Confirm re-assignment
                const confirmReassign = window.confirm(
                    `Battery ${selectedBattery} is currently assigned to ${targetStatus.inUseByUserName}. Do you want to re-assign it to ${userName}?`
                );
                if (!confirmReassign) {
                    setActionLoading(false);
                    return;
                }

                // Delete linkage from old user
                const unlinkRes = await fetch(`/api/bgvusers/remove-device/${targetStatus.deviceRecordId}`, {
                    method: "DELETE"
                });
                if (!unlinkRes.ok) {
                    throw new Error("Failed to clear previous battery assignment");
                }
            }

            // Create new device linkage
            const res = await fetch("/api/bgvusers/add-device", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Id: 0,
                    UserId: userId,
                    DeviceId: selectedBattery,
                    DeviceName: selectedBattery,
                    IsActive: true,
                    CreatedAt: new Date().toISOString()
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || "Failed to register battery linkage");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Linking error:", err);
            setError(err.message || "Failed to complete battery assignment");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] px-4 animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-150 dark:border-gray-800 animate-scale-in text-xs font-semibold">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                    <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Assign Hardware Pack</span>
                        <h2 className="text-base font-black text-brand-navy dark:text-white uppercase tracking-tight">
                            Link Battery to {userName}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded bg-gray-55 dark:bg-gray-800 text-gray-400 hover:text-brand-navy dark:hover:text-white cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 text-center space-y-3">
                        <div className="relative w-8 h-8 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                        </div>
                        <p className="text-xs text-gray-405 font-bold">Checking battery availability...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 text-red-650 text-center font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-400 block pl-1">Select from Fleet Batteries</label>
                            
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {batteryStatuses.map((status) => {
                                    const inUse = status.inUseByUserId !== null;
                                    const isSelf = status.inUseByUserId === userId;
                                    const isSelected = selectedBattery === status.deviceId;

                                    return (
                                        <div
                                            key={status.deviceId}
                                            onClick={() => !isSelf && setSelectedBattery(status.deviceId)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                                isSelf
                                                    ? "opacity-50 cursor-not-allowed border-gray-100 bg-gray-50 dark:border-gray-850 dark:bg-gray-950 text-gray-400"
                                                    : isSelected
                                                    ? "border-brand-green bg-brand-green/5 text-brand-green"
                                                    : "border-gray-200 dark:border-gray-800 bg-white hover:bg-gray-50/50 dark:bg-gray-955 dark:hover:bg-gray-850 text-brand-navy dark:text-white"
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <span className="font-mono text-sm font-black tracking-tight">{status.deviceId}</span>
                                                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold">
                                                    {isSelf ? (
                                                        <span className="text-brand-green">Currently Assigned to this User</span>
                                                    ) : inUse ? (
                                                        <span className="text-amber-500">In Use by {status.inUseByUserName}</span>
                                                    ) : (
                                                        <span className="text-emerald-500">Available for Assignment</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center shrink-0">
                                                {isSelf ? (
                                                    <span className="text-lg">✓</span>
                                                ) : inUse ? (
                                                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-black">REASSIGN</span>
                                                ) : (
                                                    <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-black">FREE</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={onClose}
                                disabled={actionLoading}
                                className="px-4 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLink}
                                disabled={actionLoading || !selectedBattery}
                                className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-brand-green/20 disabled:opacity-50"
                            >
                                {actionLoading ? "Linking..." : "Assign Battery"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
