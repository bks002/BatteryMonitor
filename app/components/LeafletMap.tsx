"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";

interface LeafletMapProps {
    vehicleLat: number;
    vehicleLng: number;
    vehicleName?: string;
    isSimulating?: boolean;
}

export default function LeafletMap({
    vehicleLat,
    vehicleLng,
    vehicleName = "Vehicle",
    isSimulating = false
}: LeafletMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const vehicleMarkerRef = useRef<L.Marker | null>(null);

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    // CartoDB tile layers look extremely clean and premium
    const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    const lightTileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const tileUrl = isDark ? darkTileUrl : lightTileUrl;

    // Custom CSS/HTML vehicle marker for a premium look
    const createVehicleIcon = () => {
        return L.divIcon({
            className: "custom-vehicle-marker-container",
            html: `
                <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white shadow-xl border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                        <path d="M23.5 12c0-.3-.1-.5-.2-.7l-2.3-4.5c-.3-.6-.9-1-1.6-1H4.6c-.7 0-1.3.4-1.6 1L.7 11.3c-.1.2-.2.5-.2.7v6c0 .8.7 1.5 1.5 1.5h1c.8 0 1.5-.7 1.5-1.5v-.5h15v.5c0 .8.7 1.5 1.5 1.5h1c.8 0 1.5-.7 1.5-1.5v-6zM5.5 15c-.8 0-1.5-.7-1.5-1.5S4.7 12 5.5 12s1.5.7 1.5 1.5S6.3 15 5.5 15zm13 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
                    </svg>
                    <div class="absolute -inset-1.5 rounded-full border-2 border-blue-500/40 animate-ping" style="animation-duration: 2s;"></div>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
    };

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [vehicleLat, vehicleLng],
            zoom: 15,
            zoomControl: false, // added manually at bottom-right
            attributionControl: false
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const tileLayer = L.tileLayer(tileUrl, {
            maxZoom: 19
        }).addTo(map);

        // Add Vehicle marker
        const vehMarker = L.marker([vehicleLat, vehicleLng], {
            icon: createVehicleIcon()
        }).addTo(map).bindPopup(`<b>${vehicleName}</b><br/>Current Location`);

        mapRef.current = map;
        tileLayerRef.current = tileLayer;
        vehicleMarkerRef.current = vehMarker;

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update Theme Tiles
    useEffect(() => {
        if (tileLayerRef.current) {
            tileLayerRef.current.setUrl(tileUrl);
        }
    }, [tileUrl]);

    // Update Vehicle Location and center the map on it
    useEffect(() => {
        if (!mapRef.current) return;

        const pos = L.latLng(vehicleLat, vehicleLng);

        // Update vehicle marker position
        if (vehicleMarkerRef.current) {
            vehicleMarkerRef.current.setLatLng(pos);
            vehicleMarkerRef.current.setPopupContent(`<b>${vehicleName}</b><br/>Current Location`);
        }

        // Center map on the updated vehicle coordinates
        mapRef.current.setView(pos, mapRef.current.getZoom(), { animate: true, duration: 0.5 });
    }, [vehicleLat, vehicleLng, vehicleName]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden z-10" />
            <style jsx global>{`
                /* Ensure Leaflet controls styles fit the SaaS layout */
                .leaflet-bar {
                    border: 1px solid var(--brand-border) !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                    border-radius: 8px !important;
                    overflow: hidden;
                }
                .leaflet-bar a {
                    background-color: var(--card-bg) !important;
                    color: var(--foreground) !important;
                    border-bottom: 1px solid var(--brand-border) !important;
                    transition: all 0.15s ease;
                }
                .leaflet-bar a:hover {
                    background-color: var(--brand-gray-light) !important;
                    color: var(--brand-green) !important;
                }
                .leaflet-popup-content-wrapper {
                    background-color: var(--card-bg) !important;
                    color: var(--foreground) !important;
                    border: 1px solid var(--brand-border) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
                    font-family: inherit !important;
                }
                .leaflet-popup-tip {
                    background-color: var(--card-bg) !important;
                    border: 1px solid var(--brand-border) !important;
                }
            `}</style>
        </div>
    );
}
