type Props = {
    device: any;
    telemetry?: {
        soc?: number;
        voltage?: number;
        current?: number;
    };
    onClick: (device: any) => void; // ✅ add this
};

export default function BatteryCard({ device, telemetry, onClick }: Props) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-4 transition hover:shadow-lg">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="font-semibold text-base text-gray-800 dark:text-white">
                    {device.name}
                </h2>

                <span
                    className={`text-xs px-2 py-1 rounded-full ${
                        device.state === "online"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
          {device.state}
        </span>
            </div>

            {/* Device Info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p><strong>IMEI:</strong> {device.uniqueid}</p>

                <p>
                    <strong>Last:</strong>{" "}
                    {new Date(device.lastupdate).toLocaleString()}
                </p>

                {device.latitude && device.longitude ? (
                    <p>
                        <strong>Lat/Lng:</strong>{" "}
                        {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
                    </p>
                ) : (
                    <p>No location</p>
                )}
            </div>

            {/* Action */}
            <button
                onClick={() => onClick(device)}  // ✅ FIX HERE
                className="w-full mt-2 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 transition"
            >
                View Details
            </button>
        </div>
    );
}