"use client";

import { useEffect, useState } from "react";

export default function DeviceModal({ device, onClose }: any) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(
                    `/api/device-details?uniqueid=${device.uniqueid}`
                );
                const data = await res.json();
                setDetails(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [device.uniqueid]);

    const attr = details?.attributehistory;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white rounded-xl p-6 w-[90%] max-w-md relative">

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-3 text-gray-400"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-4">{device.name}</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="space-y-3 text-sm">
                        <p>IMEI: {device.uniqueid}</p>

                        <p>SOC: {attr?.SOC?.value ?? "--"} %</p>
                        <p>
                            Voltage:{" "}
                            {attr?.battVoltage?.value ||
                                attr?.battery?.value ||
                                "--"}{" "}
                            V
                        </p>
                        <p>
                            Current: {attr?.battCurrent?.value ?? "--"} A
                        </p>

                        <p>Power: {attr?.power?.value ?? "--"} W</p>
                        <p>Temp: {attr?.battTemp?.value ?? "--"} °C</p>

                        <p>RSSI: {attr?.rssi?.value ?? "--"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}