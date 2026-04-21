"use client";

import { useEffect, useState } from "react";
import BatteryCard from "./components/batteryCard";
import DeviceModal from "@/app/components/DeviceModal";

/* ✅ Define Device type */
type Device = {
  uniqueid: string;
  name: string;
  state: string;
  lastupdate: string;
  latitude?: number;
  longitude?: number;
};

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  /* ✅ Fetch devices */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/devices", {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch devices");

        const data = await res.json();

        console.log("DATA 👉", data);

        setDevices(data.items || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load devices");
      } finally {
        setLoading(false);
      }
    };

    load();

    // 🔄 Auto refresh every 15 sec
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4">

        {/* States */}
        {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : error ? (
            <p className="text-red-500">{error}</p>
        ) : devices.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No devices found
            </p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {devices.map((device) => (
                  <BatteryCard
                      key={device.uniqueid}
                      device={device}
                      onClick={setSelectedDevice} // ✅ open modal
                  />
              ))}
            </div>
        )}

        {/* ✅ Modal */}
        {selectedDevice && (
            <DeviceModal
                device={selectedDevice}
                onClose={() => setSelectedDevice(null)}
            />
        )}
      </div>
  );
}