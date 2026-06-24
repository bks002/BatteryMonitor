"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function DriverDetailPage() {
    const params = useParams();
    const router = useRouter();
    const driverIdStr = params?.id as string;
    const driverId = driverIdStr ? Number(driverIdStr) : null;

    const [driver, setDriver] = useState<Driver | null>(null);
    const [telemetry, setTelemetry] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

    // EMI and Razorpay payment states
    const [paidMonths, setPaidMonths] = useState(4); // default mock
    const [pendingBalance, setPendingBalance] = useState(44000);
    const [showPaymentGate, setShowPaymentGate] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
    const [upiId, setUpiId] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [gps, setGps] = useState<any | null>(null);

    const loadDriverData = async () => {
        if (!driverId) return;
        try {
            setLoading(true);
            setError(null);
            
            const res = await fetch(`/api/bgvusers/${driverId}`);
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to load driver profile");
            }
            const found: Driver = await res.json();
            
            if (!found || !found.UserId) {
                throw new Error("Driver profile not found in database.");
            }

            // Fetch latest active devices directly from SQL database mapping API
            try {
                const devListRes = await fetch(`/api/bgvusers/${driverId}/devices`);
                if (devListRes.ok) {
                    const devices = await devListRes.json();
                    found.Devices = devices;
                }
            } catch (devErr) {
                console.error("Error fetching direct user devices:", devErr);
            }

            setDriver(found);

            // Sync dynamic mock EMI state based on User ID
            const storedPaid = localStorage.getItem(`bgv_emi_paid_${found.UserId}`);
            if (storedPaid) {
                const paidVal = Number(storedPaid);
                setPaidMonths(paidVal);
                setPendingBalance(66000 - (paidVal * 5500));
            } else {
                const defaultPaid = (found.UserId % 5) + 2;
                setPaidMonths(defaultPaid);
                setPendingBalance(66000 - (defaultPaid * 5500));
            }

        } catch (err: any) {
            console.error("Error loading driver details:", err);
            setError(err.message || "Unable to retrieve details");
        } finally {
            setLoading(false);
        }
    };

    const device = activeDeviceId || (driver?.Devices && driver.Devices.length > 0 ? driver.Devices[0].DeviceId.trim() : "");

    // Fetch telemetry and GPS when active device changes
    useEffect(() => {
        if (!device) {
            setTelemetry(null);
            setGps(null);
            return;
        }

        const fetchDeviceData = async () => {
            try {
                const devRes = await fetch(`/api/vehicle-data?vehicle_number=${device}`);
                if (devRes.ok) {
                    const devData = await devRes.json();
                    if (devData.status === "success" && devData.results && devData.results.length > 0) {
                        setTelemetry(devData.results[0]);
                    } else {
                        setTelemetry(null);
                    }
                }

                const gpsRes = await fetch(`/api/gps-data?vehicle_number=${device}`);
                if (gpsRes.ok) {
                    const gpsData = await gpsRes.json();
                    if (gpsData.status === "success" && gpsData.results && gpsData.results.length > 0) {
                        setGps(gpsData.results[0]);
                    } else {
                        setGps(null);
                    }
                }
            } catch (err) {
                console.error("Error fetching device data:", err);
            }
        };

        fetchDeviceData();
        const interval = setInterval(fetchDeviceData, 30000);
        return () => clearInterval(interval);
    }, [device]);

    useEffect(() => {
        setActiveDeviceId(null);
        loadDriverData();
    }, [driverId]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleExecutePayment = () => {
        if (!driver) return;
        setPaymentLoading(true);
        setTimeout(() => {
            setPaymentLoading(false);
            setPaymentSuccess(true);
            setTimeout(() => {
                const nextPaid = Math.min(12, paidMonths + 1);
                setPaidMonths(nextPaid);
                setPendingBalance(Math.max(0, 66000 - (nextPaid * 5500)));
                localStorage.setItem(`bgv_emi_paid_${driver.UserId}`, nextPaid.toString());
                
                setShowPaymentGate(false);
                setPaymentSuccess(false);
                setToast({ message: "EMI Payment Successful! Ledger updated.", type: "success" });
            }, 1200);
        }, 1500);
    };

    const handleLinkDevice = () => {
        setShowLinkModal(true);
    };

    const handleUnlinkDevice = async () => {
        if (!driver) return;
        const deviceRecord = driver.Devices && driver.Devices.length > 0 
            ? driver.Devices.find(d => d.DeviceId.trim().toUpperCase() === device.toUpperCase())
            : null;
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
            setActiveDeviceId(null);
            loadDriverData();
        } catch (err: any) {
            console.error(err);
            setToast({ message: `Unlink failed: ${err.message}`, type: "error" });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                </div>
                <p className="text-xs font-bold text-gray-400">Loading driver detail profile...</p>
            </div>
        );
    }

    if (error || !driver) {
        return (
            <div className="p-8 text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-lg">⚠️</div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Error Retrieving Profile</h3>
                <p className="text-xs text-gray-500">{error || "The profile could not be loaded."}</p>
                <Link href="/" className="inline-block text-xs bg-brand-green text-white px-4 py-2 rounded-xl font-bold">
                    Back to Fleet Console
                </Link>
            </div>
        );
    }

    // Active device is calculated above

    return (
        <>
            <div className="space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Toast Notifications */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border transition-all transform animate-scale-in ${
                    toast.type === "success" 
                        ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                        : toast.type === "error"
                        ? "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                        : "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                }`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span className="text-xs font-bold">{toast.message}</span>
                </div>
            )}

            {/* Breadcrumbs & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <Link href="/" className="hover:text-brand-green transition-colors">Fleet Console</Link>
                        <span>/</span>
                        <span className="text-gray-500 dark:text-gray-300">Drivers</span>
                        <span>/</span>
                        <span className="text-brand-green font-extrabold">Profile</span>
                    </div>
                    <h2 className="text-base font-black uppercase tracking-tight text-brand-navy dark:text-white">
                        {driver.FirstName} {driver.LastName}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-brand-navy dark:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                        ✕ Close Profile
                    </button>
                    {device && (
                        <Link
                            href={`/track?vehicle_number=${device}`}
                            className="bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                            🗺️ Track GPS
                        </Link>
                    )}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Driver Info & Device Mapping */}
                <div className="lg:col-span-6 space-y-8">
                    
                    {/* Profile Card */}
                    <div className="saas-card p-6 space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <div className="w-14 h-14 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-xl">
                                {(driver.FirstName[0] || "") + (driver.LastName[0] || "")}
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-brand-navy dark:text-white leading-tight">
                                    {driver.FirstName} {driver.LastName}
                                </h3>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] text-gray-400 font-bold">Partner ID: FB{driver.UserId}</span>
                                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        driver.IsActive 
                                            ? "bg-green-500/10 text-brand-green" 
                                            : "bg-amber-500/10 text-amber-500"
                                    }`}>
                                        {driver.IsActive ? "Verified Partner" : "Verification Pending"}
                                    </span>
                                    {driver.UserTypeName && (
                                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                            driver.UserTypeId === 1
                                                ? "bg-purple-500/10 text-purple-650 dark:text-purple-400"
                                                : "bg-gray-500/10 text-gray-550 dark:text-gray-405"
                                        }`}>
                                            {driver.UserTypeName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs leading-relaxed">
                            <div>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Mobile Contact</span>
                                <span className="font-extrabold text-brand-navy dark:text-white">+91 {driver.PhoneNumber}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Aadhar Number</span>
                                <span className="font-mono font-bold text-brand-navy dark:text-white">{driver.Aadhar || "Not Provided"}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Email Address</span>
                                <span className="font-semibold text-gray-600 dark:text-gray-300">{driver.Email || "No Email Registered"}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Operational Address</span>
                                <span className="font-semibold text-gray-550 dark:text-gray-405">{driver.Address || "Address not provided"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Device Mapping Card */}
                    <div className="saas-card p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                            <h3 className="text-xs font-black uppercase text-gray-450 tracking-wider">IoT Device Mappings</h3>
                            {device ? (
                                <button
                                    onClick={handleUnlinkDevice}
                                    className="text-[10px] font-black text-red-500 hover:underline cursor-pointer"
                                >
                                    Unlink Battery
                                </button>
                            ) : (
                                <button
                                    onClick={handleLinkDevice}
                                    className="text-[10px] font-black text-brand-green hover:underline cursor-pointer"
                                >
                                    + Link Battery
                                </button>
                            )}
                        </div>

                        {driver.Devices && driver.Devices.length > 1 && (
                            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-50/50 dark:bg-slate-950 rounded-2xl border border-gray-150 dark:border-gray-850 animate-fade-in">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 pl-2">Select Active Device:</span>
                                {driver.Devices.map(devRecord => {
                                    const devId = devRecord.DeviceId.trim();
                                    const isActive = devId.toUpperCase() === device.toUpperCase();
                                    return (
                                        <button
                                            key={devId}
                                            onClick={() => setActiveDeviceId(devId)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                                                isActive 
                                                    ? "bg-white text-brand-green shadow-xs border border-gray-200 dark:border-transparent dark:bg-gray-800 dark:text-white" 
                                                    : "text-gray-550 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                                            }`}
                                        >
                                            🔋 {devId}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {device ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-955 p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Battery Serial Code</span>
                                        <span className="font-mono font-bold text-brand-navy dark:text-white">{device}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${telemetry?.Alert ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-brand-green"}`}>
                                        {telemetry ? (telemetry.Alert ? "Critical Alert" : "Online Diagnostics") : "Offline Logs"}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest block pl-1">Recent System Logs</span>
                                    <div className="bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 p-3 rounded-xl space-y-2 text-[10.5px] font-semibold font-mono text-gray-500 dark:text-gray-400">
                                        <div className="flex items-start gap-2">
                                            <span className="text-emerald-500">✓</span>
                                            <span>[16:49:15] Telemetry packet sync success (SOC: {telemetry?.soc ?? 82}%)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-emerald-500">✓</span>
                                            <span>[16:15:02] Remote battery balance check nominal (Deviation: 0.015V)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-blue-500">i</span>
                                            <span>[15:30:11] Connected to Delhi NCR swap gateway station 04</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center space-y-3 bg-gray-50 dark:bg-gray-955 rounded-2xl border border-gray-150 dark:border-gray-800">
                                <p className="text-xs text-gray-400 font-bold">No active battery asset mapped to this driver</p>
                                <button 
                                    onClick={handleLinkDevice}
                                    className="text-xs bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-xl font-bold transition-all"
                                >
                                    Link Device Module
                                </button>
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Battery Telemetry & EMI Schedule */}
                <div className="lg:col-span-6 space-y-8">
                    
                    {/* Battery Telemetry Card */}
                    <div className="saas-card p-6 space-y-6">
                        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                            <h3 className="text-xs font-black uppercase text-gray-455 tracking-wider">Battery Diagnostics</h3>
                        </div>

                        {device && telemetry ? (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-extrabold">
                                        <span className="text-gray-400">State of Charge (SOC)</span>
                                        <span className={telemetry.soc < 20 ? "text-amber-500" : "text-brand-green"}>{telemetry.soc}%</span>
                                    </div>
                                    <div className="relative w-full h-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex items-center bg-gray-50 dark:bg-gray-950">
                                        <div className="absolute inset-0 soc-gradient-bg opacity-10" />
                                        <div 
                                            className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${telemetry.soc < 20 ? "bg-amber-500" : "bg-emerald-500"}`}
                                            style={{ width: `${telemetry.soc}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Pack Voltage</span>
                                        <span className="text-base font-black text-brand-navy dark:text-white mt-1 block">{telemetry.battery ? `${telemetry.battery.toFixed(1)} V` : "--"}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Operating Current</span>
                                        <span className="text-base font-black text-brand-navy dark:text-white mt-1 block">{telemetry.current !== undefined ? `${telemetry.current.toFixed(1)} A` : "--"}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Pack Temperature</span>
                                        <span className="text-base font-black text-brand-navy dark:text-white mt-1 block">{telemetry.cell_temperature_01 ? `${Math.round(telemetry.cell_temperature_01)}°C` : "--"}</span>
                                    </div>
                                    <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Est. Remaining Range</span>
                                        <span className="text-base font-black text-brand-green mt-1 block">{telemetry.soc ? `${Math.round(telemetry.soc * 1.05)} Km` : "--"}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs font-semibold text-gray-400">
                                Link an active IoT device first to view telemetry diagnostics.
                            </div>
                        )}
                    </div>

                    {/* Live GPS & Location Card */}
                    <div className="saas-card p-6 space-y-6">
                        <div className="border-b border-gray-100 dark:border-gray-800 pb-4 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase text-gray-455 tracking-wider">Live GPS & Location</h3>
                            <span className="flex items-center gap-1.5 font-bold text-[9px] text-gray-400">
                                <span className={`w-2 h-2 rounded-full ${gps ? "bg-brand-green animate-ping" : "bg-red-500"}`} /> 
                                {gps ? "GPS LOCK ESTABLISHED" : "NO GPS LOCK"}
                            </span>
                        </div>

                        {device && gps ? (
                            <div className="space-y-4 text-xs font-semibold">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Latitude</span>
                                        <span className="text-sm font-mono font-black text-brand-navy dark:text-white mt-1 block">{gps.lat}</span>
                                    </div>
                                    <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Longitude</span>
                                        <span className="text-sm font-mono font-black text-brand-navy dark:text-white mt-1 block">{gps.lng}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Current Speed</span>
                                        <span className="text-sm font-black text-brand-green mt-1 block">{gps.speed} km/h</span>
                                    </div>
                                    <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Odometer</span>
                                        <span className="text-sm font-black text-brand-navy dark:text-white mt-1 block">{(gps.odometer / 1000).toFixed(1)} km</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs font-semibold text-gray-400">
                                {device ? "No live GPS signal or coordinates unmapped." : "Link an active IoT device first to view GPS location."}
                            </div>
                        )}
                    </div>

                    {/* EMI Schedule Card (Simplified) */}
                    <div className="saas-card p-6 space-y-4">
                        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase text-gray-455 tracking-wider">EMI Loan Summary</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                pendingBalance <= 0 
                                    ? "bg-emerald-500/10 text-brand-green" 
                                    : "bg-amber-500/10 text-amber-500"
                            }`}>
                                {pendingBalance <= 0 ? "Fully Paid" : "Active Loan"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                            <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-150 dark:border-gray-800 rounded-xl">
                                <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Monthly Installment</span>
                                <span className="text-base font-black text-brand-navy dark:text-white mt-1 block">₹ 5,500</span>
                            </div>
                            <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-150 dark:border-gray-800 rounded-xl">
                                <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Paid Installments</span>
                                <span className="text-base font-black text-brand-green mt-1 block">{paidMonths} / 12 Months</span>
                            </div>
                            <div className="p-3 bg-gray-55 dark:bg-gray-955 border border-gray-150 dark:border-gray-800 rounded-xl col-span-2">
                                <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Remaining Balance</span>
                                <span className="text-base font-black text-brand-navy dark:text-white mt-1 block">₹ {pendingBalance.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link
                                href="/loans"
                                className="w-full inline-block text-center bg-brand-green hover:bg-brand-green-hover text-white py-2.5 rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer text-xs"
                            >
                                Manage in Loans Ledger →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            {showLinkModal && driver && (
                <LinkBatteryModal
                    userId={driver.UserId}
                    userName={`${driver.FirstName} ${driver.LastName}`}
                    onClose={() => setShowLinkModal(false)}
                    onSuccess={() => {
                        setToast({ message: "Linked battery successfully", type: "success" });
                        loadDriverData();
                    }}
                />
            )}
        </>
    );
}
