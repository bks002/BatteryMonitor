"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(
    () => import("../components/LeafletMap"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center space-y-3">
                <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                </div>
                <p className="text-[11px] font-bold text-gray-400">Loading interactive satellite map...</p>
            </div>
        )
    }
);

interface Device {
    Id: number;
    UserId: number;
    DeviceId: string;
    DeviceName: string;
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
}

function TrackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const targetVehicle = searchParams.get("vehicle_number");

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [telemetry, setTelemetry] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDevice, setSelectedDevice] = useState<string>("");

    // Simulation coordinates
    const startGPS = { lat: 28.4550, lng: 77.3100 }; // Sector 37 Faridabad
    const endGPS = { lat: 28.3889, lng: 77.3150 };   // Sector 12 Faridabad Swap Station

    // Simulation states
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentCoord, setCurrentCoord] = useState<{ lat: number; lng: number }>(startGPS);
    const [distanceLeft, setDistanceLeft] = useState(8.6);
    const [timeLeft, setTimeLeft] = useState(18);
    const [toast, setToast] = useState<string | null>(null);
    const [gpsData, setGpsData] = useState<any | null>(null);

    useEffect(() => {
        const fetchDriversAndSetupActive = async () => {
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
                setDrivers(users);

                // Determine active device
                let activeDev = targetVehicle || "";
                if (!activeDev) {
                    const firstWithDevice = users.find(u => u.Devices && u.Devices.length > 0);
                    if (firstWithDevice) {
                        activeDev = firstWithDevice.Devices[0].DeviceId.trim();
                    }
                }

                if (activeDev) {
                    setSelectedDevice(activeDev);
                }
            } catch (err) {
                console.error("Tracking load error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDriversAndSetupActive();
    }, [targetVehicle]);

    // Live GPS and Telemetry Sync Interval
    useEffect(() => {
        if (!selectedDevice || isNavigating) return;

        const syncTelemetryAndGps = async () => {
            try {
                // Fetch device telemetry
                const devRes = await fetch(`/api/vehicle-data?vehicle_number=${selectedDevice}`);
                if (devRes.ok) {
                    const devData = await devRes.json();
                    if (devData.status === "success" && devData.results && devData.results.length > 0) {
                        setTelemetry(devData.results[0]);
                    }
                }

                // Fetch device GPS data
                const gpsRes = await fetch(`/api/gps-data?vehicle_number=${selectedDevice}`);
                if (gpsRes.ok) {
                    const gData = await gpsRes.json();
                    if (gData.status === "success" && gData.results && gData.results.length > 0) {
                        const firstGps = gData.results[0];
                        setGpsData(firstGps);
                        
                        // Parse coordinates if they exist
                        const latVal = Number(firstGps.lat);
                        const lngVal = Number(firstGps.lng);
                        if (!isNaN(latVal) && !isNaN(lngVal) && latVal !== 0 && lngVal !== 0) {
                            setCurrentCoord({ lat: latVal, lng: lngVal });
                        }
                    } else {
                        setGpsData(null);
                    }
                } else {
                    setGpsData(null);
                }
            } catch (gpsErr) {
                console.error("Error fetching telemetry & GPS:", gpsErr);
                setGpsData(null);
            }
        };

        // Perform initial fetch
        syncTelemetryAndGps();

        const timer = setInterval(syncTelemetryAndGps, 5000);
        return () => clearInterval(timer);
    }, [selectedDevice, isNavigating]);

    // Handle simulation movement
    useEffect(() => {
        let animFrame: any;
        if (isNavigating) {
            let progress = 0;
            const animate = () => {
                progress += 0.003;
                if (progress >= 1) {
                    setCurrentCoord(endGPS);
                    setDistanceLeft(0);
                    setTimeLeft(0);
                    setIsNavigating(false);
                    setToast("Vehicle has arrived at Faridabad Swap Hub!");
                } else {
                    const lat = startGPS.lat + (endGPS.lat - startGPS.lat) * progress;
                    const lng = startGPS.lng + (endGPS.lng - startGPS.lng) * progress;
                    setCurrentCoord({ lat, lng });

                    const dist = 8.6 * (1 - progress);
                    setDistanceLeft(Number(dist.toFixed(1)));
                    setTimeLeft(Math.round(18 * (1 - progress)));
                    animFrame = requestAnimationFrame(animate);
                }
            };
            animFrame = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(animFrame);
    }, [isNavigating]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSelectDevice = (dev: string) => {
        setIsNavigating(false);
        setCurrentCoord(startGPS);
        setDistanceLeft(8.6);
        setTimeLeft(18);
        setSelectedDevice(dev);
        router.push(`/track?vehicle_number=${dev}`);
    };

    const activeDriver = drivers.find(u => u.Devices && u.Devices.some(dev => dev.DeviceId === selectedDevice));

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border bg-green-50 dark:bg-green-950/85 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 animate-scale-in">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-brand-navy dark:text-white">Live Route Tracking</h2>
                    <p className="text-[11px] text-gray-455">Monitor GPS coordinates, simulate route navigation, and review swap station targets.</p>
                </div>
                {activeDriver && (
                    <Link
                        href={`/drivers/${activeDriver.UserId}`}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-brand-navy dark:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 text-center"
                    >
                        👤 View driver profile
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="py-20 text-center space-y-3">
                    <div className="relative w-9 h-9 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-gray-455">Synching GPS telemetry feeds...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Pane: Route map */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="saas-card overflow-hidden">
                            {/* Map header */}
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-955/20 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center text-xs">
                                <span className="font-extrabold text-brand-navy dark:text-white">Faridabad Swap Circle Sector 12</span>
                                <span className="flex items-center gap-1.5 font-bold text-[10px] text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" /> GPS LOCK ESTABLISHED
                                </span>
                            </div>

                            {/* Map Area */}
                            <div className="relative w-full h-[450px] bg-slate-100 dark:bg-slate-950 overflow-hidden">
                                <LeafletMap 
                                    vehicleLat={currentCoord.lat}
                                    vehicleLng={currentCoord.lng}
                                    vehicleName={selectedDevice}
                                    isSimulating={isNavigating}
                                />

                                {/* Map Legend floating overlay */}
                                <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-3 rounded-xl space-y-2 text-[10px] font-bold z-[1000]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded bg-blue-500" />
                                        <span className="text-brand-navy dark:text-white">Active vehicle ({selectedDevice})</span>
                                    </div>
                                    {gpsData && (
                                        <div className="text-[9px] text-gray-500 font-mono pl-5 space-y-0.5">
                                            <div>Lat: {currentCoord.lat.toFixed(5)}</div>
                                            <div>Lng: {currentCoord.lng.toFixed(5)}</div>
                                            <div>Speed: {gpsData.speed} km/h</div>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-150 dark:border-gray-800 pt-2 text-[9px] text-gray-400 flex flex-col gap-0.5">
                                        <span className="uppercase font-extrabold tracking-wider text-[8px]">Target Swap Destination:</span>
                                        <span className="text-brand-navy dark:text-white font-bold text-[9.5px]">Faridabad Swap Hub (Sector 12)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Pane: Navigation statistics */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Device selector */}
                        <div className="saas-card p-5 space-y-3.5">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1 block">Switch Mapped Vehicle</span>
                            <div className="flex gap-2">
                                <select
                                    value={selectedDevice}
                                    onChange={(e) => handleSelectDevice(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-green cursor-pointer"
                                >
                                    <option value="" disabled>Select vehicle...</option>
                                    {drivers.filter(d => d.Devices && d.Devices.length > 0).flatMap(d => 
                                        d.Devices.map(devRecord => {
                                            const dev = devRecord.DeviceId.trim();
                                            return (
                                                <option key={`${d.UserId}-${dev}`} value={dev}>
                                                    {dev} - {d.FirstName} {d.LastName}
                                                </option>
                                            );
                                        })
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Telemetry diagnostics stats */}
                        {selectedDevice ? (
                            <div className="saas-card p-6 space-y-6">
                                <div className="border-b border-gray-100 dark:border-gray-800 pb-4 space-y-1">
                                    <span className="text-[9.5px] font-black uppercase text-gray-455 tracking-wider">Navigation console</span>
                                    {activeDriver && (
                                        <h3 className="font-extrabold text-sm text-brand-navy dark:text-white leading-tight">
                                            {activeDriver.FirstName} {activeDriver.LastName}
                                        </h3>
                                    )}
                                </div>

                                {/* Metrics panel */}
                                <div className="bg-gray-50 dark:bg-gray-955 border border-gray-150 dark:border-gray-800 p-4 rounded-2xl text-xs space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Remaining Distance</span>
                                        <span className="font-black text-brand-navy dark:text-white text-sm">{distanceLeft} Km</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Estimated Duration (ETA)</span>
                                        <span className="font-black text-brand-navy dark:text-white text-sm">{timeLeft} Min</span>
                                    </div>
                                    <div className="flex justify-between items-start border-t border-gray-200 dark:border-gray-800 pt-3">
                                        <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider pt-0.5">Target station</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300 text-right leading-tight max-w-[150px]">Faridabad Delhi Swap Center, Delhi Gate</span>
                                    </div>
                                </div>

                                {/* Telemetry snapshot */}
                                <div className="space-y-3 text-xs border-t border-gray-100 dark:border-gray-800 pt-4">
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block pl-1">Telemetry Snapshot</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                            <span className="text-[8px] text-gray-400 block font-bold uppercase">SOC</span>
                                            <span className="text-xs font-black text-brand-green block mt-0.5">{telemetry?.soc ?? 82}%</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                            <span className="text-[8px] text-gray-400 block font-bold uppercase">Operating Temp</span>
                                            <span className="text-xs font-black text-brand-navy dark:text-white block mt-0.5">{telemetry?.cell_temperature_01 ? `${Math.round(telemetry.cell_temperature_01)}°C` : "32°C"}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* GPS Snapshot */}
                                <div className="space-y-3 text-xs border-t border-gray-100 dark:border-gray-800 pt-4">
                                    <span className="text-[9px] font-black uppercase text-gray-455 tracking-wider block pl-1">Live GPS Coordinates</span>
                                    {selectedDevice ? (
                                        <div className="space-y-2.5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-2.5 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                                    <span className="text-[8px] text-gray-405 block font-bold uppercase">Latitude</span>
                                                    <span className="text-xs font-mono font-bold text-brand-navy dark:text-white block mt-0.5">{currentCoord.lat.toFixed(6)}</span>
                                                </div>
                                                <div className="p-2.5 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                                    <span className="text-[8px] text-gray-405 block font-bold uppercase">Longitude</span>
                                                    <span className="text-xs font-mono font-bold text-brand-navy dark:text-white block mt-0.5">{currentCoord.lng.toFixed(6)}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-2.5 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                                    <span className="text-[8px] text-gray-405 block font-bold uppercase">Speed</span>
                                                    <span className="text-xs font-black text-brand-green block mt-0.5">{gpsData?.speed ?? (isNavigating ? 28 : 0)} km/h</span>
                                                </div>
                                                <div className="p-2.5 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                                    <span className="text-[8px] text-gray-405 block font-bold uppercase">Odometer</span>
                                                    <span className="text-xs font-bold text-brand-navy dark:text-white block mt-0.5">
                                                        {gpsData ? (gpsData.odometer / 1000).toFixed(1) : "12.4"} km
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 text-center text-gray-400 italic bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl">
                                            No GPS signal or unmapped.
                                        </div>
                                    )}
                                </div>

                                {/* Navigation trigger button */}
                                {distanceLeft > 0 ? (
                                    <button
                                        onClick={() => setIsNavigating(true)}
                                        disabled={isNavigating}
                                        className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer text-center text-xs"
                                    >
                                        {isNavigating ? "Simulating GPS movement..." : "Start Route Simulation"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setCurrentCoord(startGPS);
                                            setDistanceLeft(8.6);
                                            setTimeLeft(18);
                                            setIsNavigating(false);
                                        }}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] cursor-pointer text-center text-xs"
                                    >
                                        Reset Route simulation
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="saas-card p-6 text-center text-xs font-semibold text-gray-455">
                                No active telemetry mapped to this route selection.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TrackPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                </div>
                <p className="text-xs font-bold text-gray-400">Loading tracking console...</p>
            </div>
        }>
            <TrackContent />
        </Suspense>
    );
}
