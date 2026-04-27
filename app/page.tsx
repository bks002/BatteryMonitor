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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch ThingsUp devices
        const deviceRes = await fetch("/api/devices", {
          cache: "no-store",
        });

        if (!deviceRes.ok) throw new Error("Failed devices");

        const deviceData = await deviceRes.json();
        const apiDevices: Device[] = deviceData.items || [];

        // 2️⃣ Fetch registered names from Google Sheet
        const regRes = await fetch("/api/get-registered-devices");

        if (!regRes.ok) throw new Error("Failed registered");

        const registered = await regRes.json();

        console.log("Registered 👉", registered);

        // Extract battery names
        const registeredNames = registered.map(
            (r: any) => r.batteryName
        );

        // 3️⃣ Filter by name
        const filtered = apiDevices.filter((device) =>
            registeredNames.includes(device.name)
        );

        setDevices(filtered);

      } catch (err) {
        console.error(err);
        setError("Unable to load devices");
      } finally {
        setLoading(false);
      }
    };

    load();

    // const interval = setInterval(load, 15000);
    // return () => clearInterval(interval);
  }, []);

  return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Batteries
          </h1>
        </div>

        {/* States */}
        {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : error ? (
            <p className="text-red-500">{error}</p>
        ) : devices.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No registered batteries found
            </p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {devices.map((device) => (
                  <BatteryCard
                      key={device.uniqueid}
                      device={device}
                      onClick={setSelectedDevice}
                  />
              ))}
            </div>
        )}

        {/* Modal */}
        {selectedDevice && (
            <DeviceModal
                device={selectedDevice}
                onClose={() => setSelectedDevice(null)}
            />
        )}
      </div>
  );
}