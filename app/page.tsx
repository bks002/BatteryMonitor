"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LinkBatteryModal from "@/app/components/LinkBatteryModal";

interface Device {
    Id: number;
    UserId: number;
    DeviceId: string;
    DeviceName: string;
    IsActive?: boolean;
    CreatedAt?: string;
}

interface Driver {
    UserId: number;
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber: string;
    IsActive: boolean;
    Address: string;
    Aadhar: string;
    Devices: Device[];
    CreatedAt: string;
    UserTypeId?: number;
    UserTypeName?: string;
}

const PREDEFINED_BATTERIES = [
    "CIN25D0178",
    "CCLN26B0126",
    "CCLN26B0140",
    "CCLN26B0054",
    "CGF25F0077"
];

export default function Home() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [telemetryData, setTelemetryData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [selectedDriverDevices, setSelectedDriverDevices] = useState<Device[]>([]);
    const [linkDriver, setLinkDriver] = useState<Driver | null>(null);
    const [activeTab, setActiveTab] = useState<"telemetry" | "cells" | "profile">("telemetry");
    const [dashboardTab, setDashboardTab] = useState<"drivers" | "batteries">("drivers");
    const [sheetBatteries, setSheetBatteries] = useState<string[]>([]);
    const [assigningBattery, setAssigningBattery] = useState<string | null>(null);
    const [selectedDriverForBattery, setSelectedDriverForBattery] = useState<number | null>(null);

    // Load initial data and poll telemetry
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bgvusers");
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to load driver profiles");
            }
            const users: Driver[] = await res.json();

            // Fetch dynamically registered batteries from Google Sheet
            let sheetRegistered: string[] = [];
            try {
                const sheetRes = await fetch("/api/get-registered-devices");
                if (sheetRes.ok) {
                    const sheetData = await sheetRes.json();
                    if (Array.isArray(sheetData)) {
                        sheetData.forEach((item: any) => {
                            if (item.batteryName && typeof item.batteryName === "string") {
                                const cleanName = item.batteryName.trim().toUpperCase();
                                if (cleanName && !sheetRegistered.includes(cleanName)) {
                                    sheetRegistered.push(cleanName);
                                }
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching registered devices:", err);
            }
            setSheetBatteries(sheetRegistered);

            // Fetch telemetry details for all unique batteries (predefined, sheet-registered, and mapped)
            const telemetryMap: Record<string, any> = {};
            const allUniqueBatteries = Array.from(
                new Set([
                    ...PREDEFINED_BATTERIES,
                    ...sheetRegistered,
                    ...users
                        .map(u => u.Devices ? u.Devices.map(d => d.DeviceId.trim().toUpperCase()).filter(Boolean) : [])
                        .flat()
                ])
            );

            const telemetryPromises = allUniqueBatteries.map(async (deviceNum) => {
                try {
                    const devRes = await fetch(`/api/vehicle-data?vehicle_number=${deviceNum}`);
                    if (devRes.ok) {
                        const devData = await devRes.json();
                        if (devData.status === "success" && devData.results && devData.results.length > 0) {
                            telemetryMap[deviceNum] = devData.results[0];
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching telemetry for ${deviceNum}:`, err);
                }
            });

            await Promise.all(telemetryPromises);
            setDrivers(users);
            setTelemetryData(telemetryMap);
        } catch (err: any) {
            console.error("Dashboard load exception:", err);
            setError(err.message || "Unable to load fleet dashboard details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000);

        const handleBatteryRegistered = () => {
            loadDashboardData();
        };

        window.addEventListener("battery-registered", handleBatteryRegistered);

        return () => {
            clearInterval(interval);
            window.removeEventListener("battery-registered", handleBatteryRegistered);
        };
    }, []);

    // Fetch latest devices when selected driver changes
    useEffect(() => {
        if (!selectedDriverId) {
            setSelectedDriverDevices([]);
            return;
        }

        const fetchDevices = async () => {
            try {
                const res = await fetch(`/api/bgvusers/${selectedDriverId}/devices`);
                if (res.ok) {
                    const data = await res.json();
                    setSelectedDriverDevices(data);
                }
            } catch (err) {
                console.error("Error fetching devices for selected driver:", err);
            }
        };

        fetchDevices();
        setActiveTab("telemetry"); // Reset tab to first tab on modal open
    }, [selectedDriverId]);

    // Dismiss toast helper
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Handle Link Device
    const handleLinkDevice = (driver: Driver) => {
        setLinkDriver(driver);
    };

    // Handle Unlink Device
    const handleUnlinkDevice = async (driver: Driver) => {
        const deviceRecord = driver.Devices && driver.Devices.length > 0 ? driver.Devices[0] : null;
        if (!deviceRecord) return;
        if (!confirm(`Are you sure you want to unlink the battery asset ${deviceRecord.DeviceId}?`)) return;

        try {
            const res = await fetch(`/api/bgvusers/remove-device/${deviceRecord.Id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || errData.message || "Failed to unlink device");
            }

            setToast({ message: "Device unlinked successfully", type: "info" });
            setSelectedDriverId(null);
            loadDashboardData();
        } catch (err: any) {
            console.error(err);
            setToast({ message: `Unlink failed: ${err.message}`, type: "error" });
        }
    };

    // Handle Unlink Battery by Battery ID
    const handleUnlinkBatteryById = async (batteryId: string, driver: Driver) => {
        const deviceRecord = driver.Devices && driver.Devices.length > 0 
            ? driver.Devices.find(dev => dev.DeviceId.trim().toUpperCase() === batteryId.toUpperCase())
            : null;
            
        if (!deviceRecord) return;
        if (!confirm(`Are you sure you want to unlink battery ${batteryId} from driver ${driver.FirstName} ${driver.LastName}?`)) return;

        try {
            const res = await fetch(`/api/bgvusers/remove-device/${deviceRecord.Id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || errData.message || "Failed to unlink device");
            }

            setToast({ message: `Unlinked battery ${batteryId} successfully`, type: "info" });
            loadDashboardData();
        } catch (err: any) {
            console.error(err);
            setToast({ message: `Unlink failed: ${err.message}`, type: "error" });
        }
    };

    // Handle Assign Battery to Driver
    const handleAssignBatteryToDriver = async () => {
        if (!assigningBattery || !selectedDriverForBattery) {
            setToast({ message: "Please select a driver", type: "error" });
            return;
        }

        try {
            const targetDriver = drivers.find(d => d.UserId === selectedDriverForBattery);
            if (!targetDriver) return;

            const res = await fetch("/api/bgvusers/add-device", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Id: 0,
                    UserId: selectedDriverForBattery,
                    DeviceId: assigningBattery,
                    DeviceName: assigningBattery,
                    IsActive: true,
                    CreatedAt: new Date().toISOString()
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || "Failed to register battery linkage");
            }

            setToast({ message: `Battery ${assigningBattery} assigned to ${targetDriver.FirstName} ${targetDriver.LastName}`, type: "success" });
            setAssigningBattery(null);
            setSelectedDriverForBattery(null);
            loadDashboardData();
        } catch (err: any) {
            console.error(err);
            setToast({ message: `Assignment failed: ${err.message}`, type: "error" });
        }
    };

    // Derived stats
    const totalDrivers = drivers.length;
    const activeDevicesCount = drivers.filter(d => d.Devices && d.Devices.length > 0).length;
    const onlineTelemetry = Object.values(telemetryData);
    const averageSoc = onlineTelemetry.length > 0
        ? Math.round(onlineTelemetry.reduce((acc, curr) => acc + (curr.soc || 0), 0) / onlineTelemetry.length)
        : 0;
    const activeAlertsCount = onlineTelemetry.filter(b => b.Alert !== null).length;

    // Filter drivers
    const filteredDrivers = drivers.filter(d => {
        const query = searchQuery.toLowerCase();
        return (
            d.FirstName.toLowerCase().includes(query) ||
            d.LastName.toLowerCase().includes(query) ||
            d.PhoneNumber.includes(query) ||
            (d.Devices && d.Devices.some(dev => dev.DeviceId.toLowerCase().includes(query)))
        );
    });

    // Combine predefined and sheet-registered batteries
    const allBatteries = Array.from(new Set([...PREDEFINED_BATTERIES, ...sheetBatteries]));

    // Build mapping: batteryId -> driver who has it assigned
    const batteryAssignmentMap: Record<string, Driver> = {};
    drivers.forEach(driver => {
        if (driver.Devices && Array.isArray(driver.Devices)) {
            driver.Devices.forEach(dev => {
                const cleanId = dev.DeviceId.trim().toUpperCase();
                if (cleanId) {
                    batteryAssignmentMap[cleanId] = driver;
                }
            });
        }
    });

    // Filter batteries based on search query (battery name or assigned driver's name/phone)
    const filteredBatteries = allBatteries.filter(batteryId => {
        const query = searchQuery.toLowerCase();
        const assignedDriver = batteryAssignmentMap[batteryId];
        const batteryNameMatch = batteryId.toLowerCase().includes(query);
        
        if (!assignedDriver) {
            return batteryNameMatch || "unassigned".includes(query) || "available".includes(query);
        }

        const driverNameMatch = `${assignedDriver.FirstName} ${assignedDriver.LastName}`.toLowerCase().includes(query);
        const driverPhoneMatch = assignedDriver.PhoneNumber.includes(query);

        return batteryNameMatch || driverNameMatch || driverPhoneMatch;
    });

    // Selected Driver Context (for modal)
    const currentDriver = selectedDriverId ? (drivers.find(d => d.UserId === selectedDriverId) || null) : null;
    const devicesToUse = currentDriver
        ? (selectedDriverDevices.length > 0 ? selectedDriverDevices : (currentDriver.Devices || []))
        : [];
    const deviceId = devicesToUse.length > 0 
        ? devicesToUse[0].DeviceId.trim() 
        : "";
    const tel = deviceId ? telemetryData[deviceId] : null;

    // Determine driver status badge
    const getDriverStatus = (d: Driver) => {
        if (!d.Devices || d.Devices.length === 0) return { label: "No Device", color: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" };
        const device = d.Devices[0].DeviceId.trim();
        const t = telemetryData[device];
        if (!t) return { label: "Offline", color: "bg-gray-150 dark:bg-gray-800/50 text-gray-400" };
        if (t.Alert) return { label: "Alert", color: "bg-red-500/10 text-red-500" };
        if (t.soc < 20) return { label: "Low SOC", color: "bg-amber-500/10 text-amber-500" };
        return { label: "Active", color: "bg-emerald-500/10 text-emerald-500" };
    };

    // Generate cell voltages fallback
    const generateCellVoltages = (batteryVolts: number | undefined, hasAlert: boolean) => {
        const nominal = batteryVolts ? (batteryVolts / 16) : 3.28;
        return Array.from({ length: 16 }, (_, i) => {
            let variance = (Math.sin(i * 1.5) * 0.015) + (Math.cos(i * 2.2) * 0.008);
            if (hasAlert && i === 7) {
                variance = -0.42;
            }
            return Number((nominal + variance).toFixed(3));
        });
    };

    // Safely extract telemetry fields from tel
    const soc = tel?.soc !== undefined ? Number(tel.soc) : 0;
    const soh = tel?.soh !== undefined ? Number(tel.soh) : 100;
    const current = tel?.current !== undefined ? Number(tel.current) : 0;
    const allowCharging = tel?.allow_charging !== undefined ? Number(tel.allow_charging) : 1;
    const allowDischarging = tel?.allow_discharging !== undefined ? Number(tel.allow_discharging) : 1;
    const chargeCycle = tel?.charge_cycle !== undefined ? Number(tel.charge_cycle) : 0;
    const alertMsg = tel?.Alert !== undefined ? tel.Alert : null;
    const packVoltage = tel?.Battery_Pack_voltage !== undefined 
        ? Number(tel.Battery_Pack_voltage) 
        : (tel?.battery !== undefined ? Number(tel.battery) : 0);

    const temp1 = tel?.cell_temperature_01 !== undefined ? Number(tel.cell_temperature_01) : 0;
    const temp2 = tel?.cell_temperature_02 !== undefined ? Number(tel.cell_temperature_02) : 0;
    const temp3 = tel?.cell_temperature_03 !== undefined ? Number(tel.cell_temperature_03) : 0;
    const temp4 = tel?.cell_temperature_04 !== undefined ? Number(tel.cell_temperature_04) : 0;

    const getRealCells = (t: any) => {
        if (!t) return [];
        const arr = [];
        for (let i = 1; i <= 16; i++) {
            const key = `cell_voltage_${i.toString().padStart(2, '0')}`;
            if (t[key] !== undefined) {
                arr.push(Number(t[key]));
            }
        }
        return arr;
    };

    const realCells = getRealCells(tel);
    const cells = realCells.length === 16 
        ? realCells.map(v => Number(v.toFixed(3)))
        : generateCellVoltages(packVoltage, !!alertMsg);

    const getEstimateTime = (socVal: number, currentVal: number) => {
        if (currentVal === 0) return "Standby";
        if (currentVal > 0) {
            const remainingAh = (100 - socVal) * 1.0;
            const hours = remainingAh / currentVal;
            if (hours <= 0) return "Fully Charged";
            const totalSecs = Math.floor(hours * 3600);
            const hh = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
            const mm = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
            const ss = (totalSecs % 60).toString().padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        } else {
            const dischargeCurrent = Math.abs(currentVal);
            const availableAh = socVal * 1.0;
            const hours = availableAh / dischargeCurrent;
            if (hours <= 0) return "Empty";
            const totalSecs = Math.floor(hours * 3600);
            const hh = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
            const mm = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
            const ss = (totalSecs % 60).toString().padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        }
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Toast Alerts */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border transition-all transform animate-scale-in bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span className="text-xs font-bold">{toast.message}</span>
                </div>
            )}

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Total Drivers</span>
                        <h3 className="text-2xl font-black text-brand-navy dark:text-white leading-tight">{totalDrivers}</h3>
                        <p className="text-[10px] text-gray-405">Registered Hero Partners</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center transition-transform group-hover:scale-110">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>

                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Active Devices</span>
                        <h3 className="text-2xl font-black text-brand-navy dark:text-white leading-tight">{activeDevicesCount}</h3>
                        <p className="text-[10px] text-gray-405">Mapped IoT Modules</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center transition-transform group-hover:scale-110">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>

                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Fleet Avg. SOC</span>
                        <h3 className="text-2xl font-black text-brand-navy dark:text-white leading-tight">{averageSoc}%</h3>
                        <p className="text-[10px] text-gray-405">Mean Battery Charge</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center transition-transform group-hover:scale-110">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                    </div>
                </div>

                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Active Alerts</span>
                        <h3 className={`text-2xl font-black leading-tight ${activeAlertsCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {activeAlertsCount}
                        </h3>
                        <p className="text-[10px] text-gray-450">{activeAlertsCount > 0 ? "Requires Diagnostics" : "All Systems Healthy"}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        activeAlertsCount > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Full Width Grid Layout */}
            <div className="space-y-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setDashboardTab("drivers")}
                            className={`pb-2 border-b-2 font-black uppercase text-xs tracking-tight transition-all cursor-pointer ${
                                dashboardTab === "drivers"
                                    ? "border-brand-green text-brand-green"
                                    : "border-transparent text-gray-450 hover:text-brand-navy dark:hover:text-white"
                            }`}
                        >
                            👥 Driver Fleet ({filteredDrivers.length})
                        </button>
                        <button
                            onClick={() => setDashboardTab("batteries")}
                            className={`pb-2 border-b-2 font-black uppercase text-xs tracking-tight transition-all cursor-pointer ${
                                dashboardTab === "batteries"
                                    ? "border-brand-green text-brand-green"
                                    : "border-transparent text-gray-450 hover:text-brand-navy dark:hover:text-white"
                            }`}
                        >
                            🔋 Battery Inventory ({filteredBatteries.length})
                        </button>
                    </div>
                    
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder={dashboardTab === "drivers" ? "Search drivers or devices..." : "Search batteries or assigned drivers..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2.5 w-full sm:w-64 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {loading && drivers.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="relative w-8 h-8 mx-auto mb-3">
                            <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400">Syncing with fleet network...</p>
                    </div>
                ) : dashboardTab === "drivers" ? (
                    filteredDrivers.length === 0 ? (
                        <div className="py-20 text-center text-xs font-semibold text-gray-400">
                            No active drivers match your search queries.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDrivers.map(d => {
                                const status = getDriverStatus(d);
                                const dev = d.Devices && d.Devices.length > 0 ? d.Devices[0].DeviceId.trim() : "";
                                const tData = dev ? telemetryData[dev] : null;

                                return (
                                    <div
                                        key={d.UserId}
                                        onClick={() => setSelectedDriverId(d.UserId)}
                                        className="saas-card p-5 cursor-pointer flex flex-col justify-between gap-5 relative overflow-hidden group select-none hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105">
                                                    {(d.FirstName[0] || "") + (d.LastName[0] || "")}
                                                </div>
                                                <div>
                                                    <h4 className="font-extrabold text-xs text-brand-navy dark:text-white leading-tight group-hover:text-brand-green transition-colors">
                                                        {d.FirstName} {d.LastName}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 font-medium">FB{d.UserId} • +91 {d.PhoneNumber}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${status.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${status.label === "Active" ? "animate-pulse" : ""}`} />
                                                    {status.label}
                                                </span>
                                                {d.UserTypeName && (
                                                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        d.UserTypeId === 1
                                                            ? "bg-purple-500/10 text-purple-650 dark:text-purple-400"
                                                            : "bg-gray-500/10 text-gray-550 dark:text-gray-405"
                                                    }`}>
                                                        {d.UserTypeName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400 font-bold uppercase text-[9px]">Battery ID</span>
                                                <span className="font-mono font-bold text-gray-750 dark:text-gray-300">
                                                    {dev || <span className="text-gray-405 italic font-normal">Unmapped</span>}
                                                </span>
                                            </div>

                                            {dev && tData ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-gray-400">Charge (SOC)</span>
                                                        <span className={tData.soc < 20 ? "text-amber-500" : "text-brand-green"}>{tData.soc}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${tData.soc < 20 ? "bg-amber-500 animate-pulse" : "bg-brand-green"}`}
                                                            style={{ width: `${tData.soc}%` }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                                                        <div>
                                                            <span>Voltage: </span>
                                                            <strong className="text-brand-navy dark:text-white">
                                                                {tData.Battery_Pack_voltage ? `${Number(tData.Battery_Pack_voltage).toFixed(1)}V` : `${Number(tData.battery ?? 0).toFixed(1)}V`}
                                                            </strong>
                                                        </div>
                                                        <div className="text-right">
                                                            <span>Temp: </span>
                                                            <strong className="text-brand-navy dark:text-white">
                                                                {tData.cell_temperature_01 ? `${Math.round(tData.cell_temperature_01)}°C` : "--"}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-[11px] text-gray-400 italic">
                                                    No live telemetry signal.
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10.5px]">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDriverId(d.UserId);
                                                }}
                                                className="py-2.5 text-center bg-brand-green/15 text-brand-green hover:bg-brand-green hover:text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                            >
                                                ⚡ Diagnostics
                                            </button>
                                            
                                            {dev ? (
                                                <Link
                                                    href={`/track?vehicle_number=${dev}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="py-2.5 text-center bg-gray-50 hover:bg-gray-105 dark:bg-gray-800 dark:hover:bg-gray-750 text-brand-navy dark:text-white rounded-xl font-bold transition-all border border-gray-200 dark:border-transparent flex items-center justify-center gap-1"
                                                >
                                                    🗺️ Track GPS
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLinkDevice(d);
                                                    }}
                                                    className="py-2.5 text-center bg-gray-50 hover:bg-gray-105 dark:bg-gray-800 dark:hover:bg-gray-750 text-brand-navy dark:text-white rounded-xl font-bold transition-all border border-gray-200 dark:border-transparent cursor-pointer flex items-center justify-center gap-1"
                                                >
                                                    + Link Battery
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    filteredBatteries.length === 0 ? (
                        <div className="py-20 text-center text-xs font-semibold text-gray-450">
                            No batteries found matching your search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBatteries.map(batteryId => {
                                const driver = batteryAssignmentMap[batteryId];
                                const tData = telemetryData[batteryId];
                                const isAssigned = !!driver;
                                
                                let statusLabel = "Available";
                                let statusColor = "bg-emerald-500/10 text-emerald-500";
                                
                                if (isAssigned) {
                                    statusLabel = `In Use`;
                                    statusColor = "bg-blue-500/10 text-blue-500";
                                }
                                
                                const batterySoc = tData?.soc !== undefined ? Number(tData.soc) : null;
                                const batteryVolt = tData?.Battery_Pack_voltage !== undefined 
                                    ? Number(tData.Battery_Pack_voltage) 
                                    : (tData?.battery !== undefined ? Number(tData.battery) : null);
                                const batteryTemp = tData?.cell_temperature_01 !== undefined 
                                    ? Number(tData.cell_temperature_01) 
                                    : null;

                                return (
                                    <div
                                        key={batteryId}
                                        className="saas-card p-5 flex flex-col justify-between gap-5 relative overflow-hidden group select-none hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm">
                                                    🔋
                                                </div>
                                                <div>
                                                    <h4 className="font-mono font-extrabold text-xs text-brand-navy dark:text-white leading-tight tracking-tight">
                                                        {batteryId}
                                                    </h4>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                                                        {PREDEFINED_BATTERIES.includes(batteryId) ? "Predefined Asset" : "Dynamic Registry"}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${statusColor}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${!isAssigned ? "animate-pulse" : ""}`} />
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="py-2 px-3 rounded-2xl bg-gray-50/50 dark:bg-gray-950 border border-gray-150 dark:border-gray-850 flex items-center justify-between text-[11px] font-semibold">
                                            <div className="space-y-0.5">
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Assigned To</span>
                                                {isAssigned ? (
                                                    <span className="font-extrabold text-brand-navy dark:text-white">
                                                        {driver.FirstName} {driver.LastName}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-450 italic">Unassigned (Available)</span>
                                                )}
                                            </div>
                                            {isAssigned && (
                                                <span className="text-[10px] text-gray-400">
                                                    +91 {driver.PhoneNumber}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                                            {batterySoc !== null ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-gray-400">Charge (SOC)</span>
                                                        <span className={batterySoc < 20 ? "text-amber-500" : "text-brand-green"}>
                                                            {batterySoc}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${batterySoc < 20 ? "bg-amber-500 animate-pulse" : "bg-brand-green"}`}
                                                            style={{ width: `${batterySoc}%` }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                                                        <div>
                                                            <span>Voltage: </span>
                                                            <strong className="text-brand-navy dark:text-white">
                                                                {batteryVolt !== null ? `${batteryVolt.toFixed(1)}V` : "--"}
                                                            </strong>
                                                        </div>
                                                        <div className="text-right">
                                                            <span>Temp: </span>
                                                            <strong className="text-brand-navy dark:text-white">
                                                                {batteryTemp !== null ? `${Math.round(batteryTemp)}°C` : "--"}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-[11px] text-gray-400 italic bg-gray-50/20 dark:bg-gray-950/20 rounded-2xl border border-dashed border-gray-150 dark:border-gray-850">
                                                    No live telemetry signal.
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10.5px]">
                                            {isAssigned ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDriverId(driver.UserId);
                                                        }}
                                                        className="py-2.5 text-center bg-brand-green/15 text-brand-green hover:bg-brand-green hover:text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                                    >
                                                        ⚡ Diagnostics
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUnlinkBatteryById(batteryId, driver);
                                                        }}
                                                        className="py-2.5 text-center bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 dark:text-red-400 rounded-xl font-bold transition-all cursor-pointer border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-1 active:scale-[0.98]"
                                                    >
                                                        ✕ Unlink
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAssigningBattery(batteryId);
                                                        setSelectedDriverForBattery(null);
                                                    }}
                                                    className="col-span-2 py-2.5 text-center bg-brand-green hover:bg-brand-green-hover text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs active:scale-[0.98]"
                                                >
                                                    + Assign Driver
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
            </div>

            {/* Unified Modal Dialog: Telemetry Control Room */}
            {selectedDriverId && currentDriver && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all animate-fade-in"
                    onClick={() => setSelectedDriverId(null)}
                >
                    <div 
                        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-brand-green text-white p-6 relative select-none">
                            <button 
                                onClick={() => setSelectedDriverId(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white text-lg bg-black/15 hover:bg-black/25 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
                                title="Close Diagnostics Console"
                            >
                                ✕
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold text-xl border border-white/10 shadow-inner">
                                    {(currentDriver.FirstName[0] || "") + (currentDriver.LastName[0] || "")}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black leading-none">{currentDriver.FirstName} {currentDriver.LastName}</h3>
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-gold text-brand-navy shadow-xs">
                                            Verified Partner
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-white/70 mt-1.5">
                                        Partner ID: FB{currentDriver.UserId} • Linked Battery Asset: {deviceId || "No Device Linked"}
                                    </p>
                                </div>
                            </div>

                            {/* Tab Selectors inside Header */}
                            <div className="flex gap-2.5 mt-6 border-t border-white/10 pt-4 text-[11px] font-bold">
                                <button
                                    onClick={() => setActiveTab("telemetry")}
                                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                        activeTab === "telemetry" 
                                            ? "bg-white text-brand-green shadow-md" 
                                            : "text-white hover:bg-white/10"
                                    }`}
                                >
                                    ⚡ Diagnostics Telemetry
                                </button>
                                <button
                                    onClick={() => setActiveTab("cells")}
                                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                        activeTab === "cells" 
                                            ? "bg-white text-brand-green shadow-md" 
                                            : "text-white hover:bg-white/10"
                                    }`}
                                >
                                    🔋 16S Cell Balances
                                </button>
                                <button
                                    onClick={() => setActiveTab("profile")}
                                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                        activeTab === "profile" 
                                            ? "bg-white text-brand-green shadow-md" 
                                            : "text-white hover:bg-white/10"
                                    }`}
                                >
                                    👤 Partner Metadata
                                </button>
                            </div>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 dark:bg-slate-950">
                            
                            {/* Tab 1: Diagnostics Telemetry */}
                            {activeTab === "telemetry" && (
                                deviceId ? (
                                    tel ? (
                                        <div className="space-y-6">
                                            {/* Gauge and Systems Flags */}
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                
                                                {/* Circular Gauge Card */}
                                                <div className="md:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                                                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                                            <circle 
                                                                cx="50" 
                                                                cy="50" 
                                                                r="42" 
                                                                fill="transparent" 
                                                                stroke="rgba(19, 92, 15, 0.08)" 
                                                                strokeWidth="8" 
                                                            />
                                                            <circle 
                                                                cx="50" 
                                                                cy="50" 
                                                                r="42" 
                                                                fill="transparent" 
                                                                stroke="url(#socGradient)" 
                                                                strokeWidth="8" 
                                                                strokeDasharray={`${2.639 * soc} 264`}
                                                                strokeLinecap="round"
                                                            />
                                                            <defs>
                                                                <linearGradient id="socGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#10b981" />
                                                                    <stop offset="100%" stopColor="#e5b23b" />
                                                                </linearGradient>
                                                            </defs>
                                                        </svg>
                                                        
                                                        <div className="absolute text-center flex flex-col items-center justify-center">
                                                            <span className="text-2xl font-black text-brand-navy dark:text-white tracking-tight leading-none">{soc}%</span>
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">SOC</span>
                                                            {current > 0 && (
                                                                <svg className="w-4 h-4 text-brand-green mt-1 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 flex-1 w-full text-xs">
                                                        <div>
                                                            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Estimated Runtime</span>
                                                            <span className="text-xl font-black text-brand-navy dark:text-white tracking-tight mt-0.5 block">
                                                                {getEstimateTime(soc, current)}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-gray-100 dark:border-gray-800">
                                                            <div>
                                                                <span className="text-gray-400 font-bold uppercase text-[9px] block">State</span>
                                                                <span className={`font-bold uppercase tracking-wide text-[10.5px] block mt-0.5 ${
                                                                    current > 0 ? "text-brand-green animate-pulse" : current < 0 ? "text-amber-500" : "text-gray-400"
                                                                }`}>
                                                                    {current > 0 ? "Charging" : current < 0 ? "Discharging" : "Standby"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400 font-bold uppercase text-[9px] block">Health (SOH)</span>
                                                                <span className="text-brand-green font-extrabold text-[10.5px] block mt-0.5">{soh}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* System Flags */}
                                                <div className="md:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-4">
                                                    <h3 className="text-xs font-black uppercase text-gray-450 tracking-wider">Device System Flags</h3>
                                                    
                                                    <div className="space-y-2.5">
                                                        <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-950 p-2 px-3 rounded-xl border border-gray-100 dark:border-gray-850">
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Charging Switch</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${allowCharging === 1 ? "bg-emerald-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"}`} />
                                                                <span className="text-[10px] font-black uppercase">{allowCharging === 1 ? "ON" : "OFF"}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-955 p-2 px-3 rounded-xl border border-gray-100 dark:border-gray-850">
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Discharging Switch</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${allowDischarging === 1 ? "bg-emerald-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"}`} />
                                                                <span className="text-[10px] font-black uppercase">{allowDischarging === 1 ? "ON" : "OFF"}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-955 p-2 px-3 rounded-xl border border-gray-100 dark:border-gray-855">
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Cell Balancing</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${!alertMsg ? "bg-emerald-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"}`} />
                                                                <span className="text-[10px] font-black uppercase">{!alertMsg ? "ON" : "OFF"}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-955 p-2 px-3 rounded-xl border border-gray-100 dark:border-gray-855">
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Fault Protection</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${alertMsg ? "bg-red-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"}`} />
                                                                <span className="text-[10px] font-black uppercase">{alertMsg ? "ON" : "OFF"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Core Metrics Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between group">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">TotalVolt</span>
                                                        <h4 className="text-base font-black text-brand-navy dark:text-white leading-tight">{packVoltage.toFixed(2)} V</h4>
                                                        <p className="text-[9px] text-gray-450">Pack Voltage</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between group">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Current</span>
                                                        <h4 className={`text-base font-black leading-tight ${current < 0 ? "text-amber-500" : current > 0 ? "text-brand-green" : "text-brand-navy dark:text-white"}`}>{current.toFixed(1)} A</h4>
                                                        <p className="text-[9px] text-gray-455">Amperage Rate</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a6 6 0 0012 0M3 12h3m12 0h3" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between group">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Power</span>
                                                        <h4 className="text-base font-black text-brand-navy dark:text-white leading-tight">
                                                            {Math.abs(packVoltage * current).toFixed(1)} W
                                                        </h4>
                                                        <p className="text-[9px] text-gray-455">
                                                            {current < 0 ? "Output Load" : current > 0 ? "Input Charging" : "No Load"}
                                                        </p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between group">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">AveVol</span>
                                                        <h4 className="text-base font-black text-brand-navy dark:text-white leading-tight">{(packVoltage / 16).toFixed(3)} V</h4>
                                                        <p className="text-[9px] text-gray-450">Avg Cell Voltage</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9c4.333-4 8.667-4 13 0m-13 4c4.333-4 8.667-4 13 0M4 17c4.333-4 8.667-4 13 0" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between group">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Cycle-Index</span>
                                                        <h4 className="text-base font-black text-brand-navy dark:text-white leading-tight">{chargeCycle}</h4>
                                                        <p className="text-[9px] text-gray-450">Charge Cycles</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between group">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Health (SOH)</span>
                                                        <h4 className="text-base font-black text-brand-green leading-tight">{soh}%</h4>
                                                        <p className="text-[9px] text-gray-455">State of Health</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Temperature Center */}
                                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="space-y-4 flex-1 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temperature Center</span>
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-500">
                                                            Diagnostics Active
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-150 dark:border-gray-800 rounded-2xl">
                                                            <span className="text-[9px] text-gray-400 font-bold block uppercase">Cell Temp 01</span>
                                                            <span className="text-xs font-black text-brand-navy dark:text-white mt-1 block">
                                                                {temp1.toFixed(1)}°C <span className="text-[10px] text-gray-455 font-normal">/ {((temp1 * 9/5) + 32).toFixed(1)}°F</span>
                                                            </span>
                                                        </div>
                                                        <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-155 dark:border-gray-800 rounded-2xl">
                                                            <span className="text-[9px] text-gray-400 font-bold block uppercase">Cell Temp 02</span>
                                                            <span className="text-xs font-black text-brand-navy dark:text-white mt-1 block">
                                                                {temp2.toFixed(1)}°C <span className="text-[10px] text-gray-455 font-normal">/ {((temp2 * 9/5) + 32).toFixed(1)}°F</span>
                                                            </span>
                                                        </div>
                                                        <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-155 dark:border-gray-800 rounded-2xl">
                                                            <span className="text-[9px] text-gray-400 font-bold block uppercase">Cell Temp 03</span>
                                                            <span className="text-xs font-black text-brand-navy dark:text-white mt-1 block">
                                                                {temp3.toFixed(1)}°C <span className="text-[10px] text-gray-455 font-normal">/ {((temp3 * 9/5) + 32).toFixed(1)}°F</span>
                                                            </span>
                                                        </div>
                                                        <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-155 dark:border-gray-800 rounded-2xl">
                                                            <span className="text-[9px] text-gray-400 font-bold block uppercase">Cell Temp 04</span>
                                                            <span className="text-xs font-black text-brand-navy dark:text-white mt-1 block">
                                                                {temp4.toFixed(1)}°C <span className="text-[10px] text-gray-455 font-normal">/ {((temp4 * 9/5) + 32).toFixed(1)}°F</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0 select-none bg-gray-55 dark:bg-gray-955 p-4 rounded-3xl border border-gray-150 dark:border-gray-800 w-full sm:w-auto">
                                                    <div className="relative h-12 w-6 flex items-center justify-center">
                                                        <svg viewBox="0 0 24 48" className="h-full w-auto">
                                                            <path 
                                                                d="M12 4a3 3 0 00-3 3v21.17a6 6 0 106 0V7a3 3 0 00-3-3z" 
                                                                fill="none" 
                                                                stroke="#cbd5e1" 
                                                                strokeWidth="2.5" 
                                                                strokeLinecap="round" 
                                                            />
                                                            <circle cx="12" cy="38" r="3.5" fill="#f59e0b" />
                                                            <line x1="12" y1="38" x2="12" y2="15" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-gray-455 font-bold block uppercase">Avg Temp</span>
                                                        <h5 className="text-sm font-black text-brand-navy dark:text-white leading-tight">
                                                            {((temp1 + temp2 + temp3 + temp4) / 4).toFixed(1)}°C
                                                        </h5>
                                                        <span className="text-[10px] text-gray-400">
                                                            {((((temp1 + temp2 + temp3 + temp4) / 4) * 9/5) + 32).toFixed(1)}°F
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center text-xs font-semibold text-gray-405 flex flex-col items-center justify-center gap-4">
                                            <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span>Mapped device is offline or no telemetry signal received.</span>
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center text-xs font-semibold text-gray-405 flex flex-col items-center justify-center gap-4 animate-fade-in">
                                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                                        </svg>
                                        <span>No active battery asset mapped to this driver.</span>
                                        <button 
                                            onClick={() => handleLinkDevice(currentDriver)}
                                            className="bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs"
                                        >
                                            Link Battery Module
                                        </button>
                                    </div>
                                )
                            )}

                            {/* Tab 2: Cell Balances */}
                            {activeTab === "cells" && (
                                deviceId ? (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-4 shadow-xs animate-fade-in">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                                            <h3 className="text-xs font-black uppercase text-gray-455 tracking-wider">16S Cell Voltage Balance</h3>
                                            <div className="flex gap-4 text-[9.5px] text-gray-400 font-bold">
                                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30" /> Balanced (3.2V - 3.4V)</div>
                                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/10 border border-red-500/40" /> Out of Balance (&lt; 3.0V)</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                                            {cells.map((volt, idx) => {
                                                const isLow = volt < 3.0;
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className={`p-2.5 rounded-2xl border text-center font-mono transition-all flex flex-col justify-between items-center ${
                                                            isLow 
                                                                ? "bg-red-500/10 border-red-500 text-red-555 animate-pulse shadow-sm" 
                                                                : "bg-emerald-500/5 border-emerald-500/20 text-emerald-650 dark:text-emerald-450"
                                                        }`}
                                                    >
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">C{idx+1}</span>
                                                        <span className="text-xs font-black block mt-1">{volt}V</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="text-[10px] font-semibold text-gray-400 flex justify-between pt-2">
                                            <span>Max Deviation: <strong className="text-brand-navy dark:text-white font-black">{(Math.max(...cells) - Math.min(...cells)).toFixed(3)} V</strong></span>
                                            <span>Balancing status: <strong className={alertMsg ? "text-red-550 font-black" : "text-brand-green font-black"}>{alertMsg ? "Fault Restriction" : "Passive Balancing Active"}</strong></span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center text-xs font-semibold text-gray-405 flex flex-col items-center justify-center gap-4 animate-fade-in">
                                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>No active battery asset mapped to this driver.</span>
                                    </div>
                                )
                            )}

                            {/* Tab 3: Partner Metadata */}
                            {activeTab === "profile" && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
                                        <h3 className="text-xs font-black uppercase text-gray-450 tracking-wider">Owner Contact Details</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-950 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-850">
                                                <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Mobile Number</span>
                                                    <span className="text-xs font-black text-brand-navy dark:text-white">+91 {currentDriver.PhoneNumber}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-850">
                                                <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Email Address</span>
                                                    <span className="text-xs font-semibold text-gray-650 dark:text-gray-300">{currentDriver.Email || "No Email Provided"}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-850">
                                                <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Aadhar Verification ID</span>
                                                    <span className="text-xs font-mono font-bold text-brand-navy dark:text-white">{currentDriver.Aadhar}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-955 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-850">
                                                <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Operational Address</span>
                                                    <span className="text-xs font-semibold text-gray-650 dark:text-gray-300 leading-normal">{currentDriver.Address || "Address Not Registered"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mappings & Actions */}
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
                                        <h3 className="text-xs font-black uppercase text-gray-450 tracking-wider">Asset Mappings & Administration</h3>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Battery Attachment</span>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                    {deviceId ? `Currently mapped to battery: ${deviceId}` : "No battery asset linked to driver."}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                {deviceId ? (
                                                    <button
                                                        onClick={() => handleUnlinkDevice(currentDriver)}
                                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl font-bold transition-all text-xs border border-red-100 dark:border-red-900/30 cursor-pointer"
                                                    >
                                                        Unlink Battery
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleLinkDevice(currentDriver)}
                                                        className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl font-bold transition-all text-xs cursor-pointer"
                                                    >
                                                        Link Device Module
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Link
                                                href={`/drivers/${currentDriver.UserId}`}
                                                className="flex-1 py-3 text-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-brand-navy dark:text-white rounded-2xl font-bold transition-all border border-gray-200 dark:border-transparent cursor-pointer flex items-center justify-center gap-1"
                                                onClick={() => setSelectedDriverId(null)}
                                            >
                                                Edit Driver Profile
                                            </Link>
                                            {deviceId && (
                                                <Link
                                                    href={`/track?vehicle_number=${deviceId}`}
                                                    className="flex-1 py-3 text-center bg-brand-green hover:bg-brand-green-hover text-white rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                                    onClick={() => setSelectedDriverId(null)}
                                                >
                                                    Track Live GPS
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {linkDriver && (
                <LinkBatteryModal
                    userId={linkDriver.UserId}
                    userName={`${linkDriver.FirstName} ${linkDriver.LastName}`}
                    onClose={() => setLinkDriver(null)}
                    onSuccess={() => {
                        setToast({ message: `Linked battery successfully`, type: "success" });
                        setSelectedDriverId(null);
                        loadDashboardData();
                    }}
                />
            )}

            {/* Assign Driver Modal */}
            {assigningBattery && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] px-4 animate-fade-in text-xs font-semibold">
                    <div className="absolute inset-0" onClick={() => setAssigningBattery(null)} />
                    
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-150 dark:border-gray-800 animate-scale-in">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Assign Battery Pack</span>
                                <h2 className="text-base font-black text-brand-navy dark:text-white uppercase tracking-tight">
                                    Assign {assigningBattery} to Driver
                                </h2>
                            </div>
                            <button
                                onClick={() => setAssigningBattery(null)}
                                className="p-1 rounded bg-gray-55 dark:bg-gray-800 text-gray-400 hover:text-brand-navy dark:hover:text-white cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-gray-400 block pl-1">Select Driver</label>
                                
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {drivers.filter(d => !d.Devices || d.Devices.length === 0).length === 0 ? (
                                        <p className="text-center py-6 text-gray-400 italic">
                                            No available unassigned drivers. Onboard a driver first!
                                        </p>
                                    ) : (
                                        drivers
                                            .filter(d => !d.Devices || d.Devices.length === 0)
                                            .map((driver) => {
                                                const isSelected = selectedDriverForBattery === driver.UserId;

                                                return (
                                                    <div
                                                        key={driver.UserId}
                                                        onClick={() => setSelectedDriverForBattery(driver.UserId)}
                                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                                            isSelected
                                                                ? "border-brand-green bg-brand-green/5 text-brand-green"
                                                                : "border-gray-200 dark:border-gray-800 bg-white hover:bg-gray-50/50 dark:bg-gray-955 dark:hover:bg-gray-850 text-brand-navy dark:text-white"
                                                        }`}
                                                    >
                                                        <div className="space-y-1">
                                                            <span className="font-black text-xs">
                                                                {driver.FirstName} {driver.LastName}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-gray-400">
                                                                <span>Phone: +91 {driver.PhoneNumber}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center shrink-0">
                                                            {isSelected ? (
                                                                <span className="text-lg">✓</span>
                                                            ) : (
                                                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-450 px-2 py-0.5 rounded font-black">SELECT</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setAssigningBattery(null)}
                                    className="px-4 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-955 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignBatteryToDriver}
                                    disabled={!selectedDriverForBattery}
                                    className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl active:scale-[0.97] transition-all cursor-pointer shadow-md shadow-brand-green/20 disabled:opacity-50"
                                >
                                    Assign Battery
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}