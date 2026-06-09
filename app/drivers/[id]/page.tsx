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

            // Fetch telemetry and GPS if device is linked
            if (found.Devices && found.Devices.length > 0) {
                const deviceNum = found.Devices[0].DeviceId.trim();
                
                const devRes = await fetch(`/api/vehicle-data?vehicle_number=${deviceNum}`);
                if (devRes.ok) {
                    const devData = await devRes.json();
                    if (devData.status === "success" && devData.results && devData.results.length > 0) {
                        setTelemetry(devData.results[0]);
                    }
                }

                try {
                    const gpsRes = await fetch(`/api/gps-data?vehicle_number=${deviceNum}`);
                    if (gpsRes.ok) {
                        const gpsData = await gpsRes.json();
                        if (gpsData.status === "success" && gpsData.results && gpsData.results.length > 0) {
                            setGps(gpsData.results[0]);
                        } else {
                            setGps(null);
                        }
                    } else {
                        setGps(null);
                    }
                } catch (gpsErr) {
                    console.error("Error fetching GPS details:", gpsErr);
                    setGps(null);
                }
            }

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

    useEffect(() => {
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
            setTelemetry(null);
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

    const device = driver.Devices && driver.Devices.length > 0 ? driver.Devices[0].DeviceId.trim() : "";

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

                    {/* EMI Schedule Card */}
                    <div className="saas-card p-6 space-y-6">
                        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                            <h3 className="text-xs font-black uppercase text-gray-455 tracking-wider">EMI Loan Ledger</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-xs">
                            <div className="space-y-3.5 flex-1">
                                <div>
                                    <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Monthly Installment</span>
                                    <span className="text-lg font-black text-brand-navy dark:text-white block mt-0.5">₹ 5,500</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-gray-400">Due Schedule:</span>
                                    <span className="text-brand-navy dark:text-white">25th of Current Month</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-gray-400">Paid Installments:</span>
                                    <span className="text-brand-green">{paidMonths} / 12 Months</span>
                                </div>
                            </div>

                            {/* Circular gauge */}
                            <div className="w-24 h-24 flex items-center justify-center relative select-none mx-auto sm:mx-0">
                                <svg viewBox="0 0 36 36" className="circular-chart w-full h-full">
                                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path 
                                        className="circle stroke-brand-green" 
                                        strokeDasharray={`${Math.round((paidMonths / 12) * 100)}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <span className="text-[8px] text-gray-400 font-bold block uppercase">Pending</span>
                                    <span className="text-[10px] font-black text-brand-navy dark:text-white leading-tight">₹{pendingBalance.toLocaleString()}</span>
                                    <span className="text-[7.5px] text-gray-400 font-bold block">{12 - paidMonths} Months</span>
                                </div>
                            </div>
                        </div>

                        {/* Paid dots schedule */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block pl-1">Payment Timeline</span>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-955 rounded-xl border border-gray-150 dark:border-gray-800">
                                {Array.from({ length: 12 }, (_, i) => (
                                    <span 
                                        key={i} 
                                        title={`Month ${i+1}: ${i < paidMonths ? "Paid" : "Pending"}`}
                                        className={`w-3.5 h-3.5 rounded-full flex-1 transition-all ${
                                            i < paidMonths 
                                                ? "bg-brand-green shadow-sm shadow-brand-green/20" 
                                                : "bg-gray-200 dark:bg-gray-800"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setUpiId(`${driver.FirstName.toLowerCase()}@upi`);
                                setCardNumber("4312 9980 1455 5337");
                                setPaymentSuccess(false);
                                setPaymentLoading(false);
                                setShowPaymentGate(true);
                            }}
                            disabled={pendingBalance <= 0}
                            className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] cursor-pointer text-center disabled:opacity-50"
                        >
                            {pendingBalance <= 0 ? "Ledger Fully Paid" : "Collect EMI Payment"}
                        </button>
                    </div>

                </div>

            </div>
            </div>

            {/* Payment Gateway Modal (Razorpay Mockup) */}
            {showPaymentGate && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[100] flex items-center justify-center p-4 transition-opacity animate-fade-in">
                    
                    {/* Simulator Card Box */}
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 text-xs font-semibold animate-scale-in z-50">
                        
                        {/* Razorpay Brand Header */}
                        <div className="bg-blue-600 text-white p-5 flex justify-between items-center">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Razorpay Checkout</span>
                                <h3 className="text-sm font-black">BharatGreenVolt Solutions</h3>
                            </div>
                            <button 
                                onClick={() => setShowPaymentGate(false)}
                                className="text-white hover:opacity-85 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Payment Details Container */}
                        <div className="p-5 space-y-5">
                            
                            {/* Amount Summary */}
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-855">
                                <div>
                                    <span className="text-[9px] text-gray-400 block font-bold uppercase">Installment EMI</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">{driver.FirstName} {driver.LastName} (FB{driver.UserId})</span>
                                </div>
                                <span className="text-lg font-black text-blue-650 dark:text-blue-400">₹5,500</span>
                            </div>

                            {paymentLoading ? (
                                <div className="py-8 flex flex-col items-center justify-center space-y-4">
                                    <div className="relative w-10 h-10">
                                        <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-955/40" />
                                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                                    </div>
                                    <p className="text-xs text-gray-400 font-bold">Securing transaction through Razorpay network...</p>
                                </div>
                            ) : paymentSuccess ? (
                                <div className="py-8 flex flex-col items-center justify-center space-y-3 animate-scale-in">
                                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                                        ✓
                                    </div>
                                    <h4 className="text-xs font-black text-green-600 block mt-2 text-center">Payment Authorized!</h4>
                                    <p className="text-[9px] text-gray-400 font-bold text-center">Reference: TXN-{Date.now().toString().slice(-8)}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Tabs */}
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-955 rounded-xl border border-gray-150 dark:border-gray-850">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("upi")}
                                            className={`py-2 rounded-lg font-bold text-center cursor-pointer transition-all ${
                                                paymentMethod === "upi"
                                                    ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600"
                                                    : "text-gray-400 hover:text-gray-600"
                                            }`}
                                        >
                                            UPI / PayTM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("card")}
                                            className={`py-2 rounded-lg font-bold text-center cursor-pointer transition-all ${
                                                paymentMethod === "card"
                                                    ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600"
                                                    : "text-gray-400 hover:text-gray-600"
                                            }`}
                                        >
                                            Card Details
                                        </button>
                                    </div>

                                    {/* Tab: UPI */}
                                    {paymentMethod === "upi" && (
                                        <div className="space-y-2 text-xs">
                                            <label className="text-[9px] font-bold uppercase text-gray-405 block pl-1">VPA Handler Address</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. driver@upi"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    {/* Tab: Card */}
                                    {paymentMethod === "card" && (
                                        <div className="space-y-3 text-xs">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold uppercase text-gray-405 block pl-1">Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="XXXX XXXX XXXX XXXX"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-955 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold uppercase text-gray-450 block pl-1">Expiry</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-955 text-center focus:outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold uppercase text-gray-450 block pl-1">CVV</label>
                                                    <input
                                                        type="password"
                                                        placeholder="•••"
                                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-955 text-center focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleExecutePayment}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer text-center text-xs"
                                    >
                                        Authorize Payment ₹5,500
                                    </button>
                                </div>
                            )}

                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-955 border-t border-gray-100 dark:border-gray-855 text-center text-[9px] text-gray-400 block font-bold uppercase tracking-wider">
                            🛡️ PCI-DSS SECURED GATEWAY
                        </div>

                    </div>
                </div>
            )}

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
