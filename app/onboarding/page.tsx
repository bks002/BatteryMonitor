"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BatteryOwner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    aadhar: string;
    mobile: string;
    address: string;
    status: "Verified" | "Pending";
    linkedDevices: string[];
    createdDate: string;
    raw?: any;
}

export default function OnboardingPage() {
    const [owners, setOwners] = useState<BatteryOwner[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Verified" | "Pending">("All");
    
    // Form Drawer State
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [aadhar, setAadhar] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [linkedDeviceInput, setLinkedDeviceInput] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    
    // Notification Toast State
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    // Device Details Dialog States
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [deviceDetails, setDeviceDetails] = useState<any | null>(null);
    const [isDeviceLoading, setIsDeviceLoading] = useState(false);
    const [deviceError, setDeviceError] = useState<string | null>(null);

    const handleOpenDeviceDetails = async (deviceNumber: string) => {
        setSelectedDevice(deviceNumber);
        setDeviceDetails(null);
        setDeviceError(null);
        setIsDeviceLoading(true);

        try {
            const res = await fetch(`/api/vehicle-data?vehicle_number=${deviceNumber}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || "Failed to fetch vehicle data");
            }
            const data = await res.json();
            if (data.status === "success" && data.results && data.results.length > 0) {
                setDeviceDetails(data.results[0]);
            } else {
                throw new Error("No telemetry logs found for this vehicle number.");
            }
        } catch (err: any) {
            console.error("Error fetching device details:", err);
            setDeviceError(err.message || "An error occurred while fetching device details");
        } finally {
            setIsDeviceLoading(false);
        }
    };

    // Load initial data from database API
    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/bgvusers");
            if (!res.ok) throw new Error("Failed to load users");
            const data = await res.json();
            
            if (data && data.length > 0) {
                const parsedOwners: BatteryOwner[] = data.map((user: any) => {
                    let aadharVal = user.Aadhar || user.PasswordHash || "";
                    let linkedDevices: string[] = [];

                    // Map Devices list items to string IDs
                    if (user.Devices && Array.isArray(user.Devices)) {
                        linkedDevices = user.Devices.map((d: any) => d.DeviceId.trim()).filter(Boolean);
                    }

                    return {
                        id: user.UserId.toString(),
                        firstName: user.FirstName || "",
                        lastName: user.LastName || "",
                        email: user.Email && user.Email.endsWith("@bgv.placeholder") ? "" : (user.Email || ""),
                        aadhar: aadharVal,
                        mobile: user.PhoneNumber || "",
                        address: user.Address || "",
                        status: user.IsActive === false ? "Pending" : "Verified",
                        linkedDevices: linkedDevices,
                        createdDate: user.CreatedAt ? new Date(user.CreatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                        raw: user
                    };
                });
                setOwners(parsedOwners);
            } else {
                setOwners([]);
            }
        } catch (err) {
            console.error("Error fetching owners:", err);
            setToast({ message: "Could not connect to database.", type: "error" });
            setOwners([]);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Auto-dismiss Toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Handle Aadhar Formatting (XXXX-XXXX-XXXX)
    const handleAadharChange = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 12);
        let formatted = "";
        for (let i = 0; i < digits.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += "-";
            formatted += digits[i];
        }
        setAadhar(formatted);
        if (formErrors.aadhar) {
            setFormErrors(prev => {
                const copy = { ...prev };
                delete copy.aadhar;
                return copy;
            });
        }
    };

    // Handle Mobile Change (Max 10 digits)
    const handleMobileChange = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setMobile(digits);
        if (formErrors.mobile) {
            setFormErrors(prev => {
                const copy = { ...prev };
                delete copy.mobile;
                return copy;
            });
        }
    };

    // Form Validation
    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!firstName.trim()) errors.firstName = "First name is required";
        if (email.trim() && !/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
        
        const aadharDigits = aadhar.replace(/-/g, "");
        if (aadharDigits.length !== 12) errors.aadhar = "Aadhar card number must be exactly 12 digits";
        if (mobile.length !== 10) errors.mobile = "Mobile number must be exactly 10 digits";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Open form drawer to Create
    const openCreateForm = () => {
        setEditingId(null);
        setFirstName("");
        setLastName("");
        setEmail("");
        setAadhar("");
        setMobile("");
        setAddress("");
        setLinkedDeviceInput("");
        setFormErrors({});
        setIsOpen(true);
    };

    // Open form drawer to Edit
    const openEditForm = (owner: BatteryOwner) => {
        setEditingId(owner.id);
        setFirstName(owner.firstName);
        setLastName(owner.lastName);
        setEmail(owner.email || "");
        setAadhar(owner.aadhar);
        setMobile(owner.mobile);
        setAddress(owner.address);
        setLinkedDeviceInput(owner.linkedDevices.join(", "));
        setFormErrors({});
        setIsOpen(true);
    };

    // Save / Submit Owner Form (POST / PUT)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setToast({ message: "Please resolve the form validation flags", type: "error" });
            return;
        }

                const deviceList = linkedDeviceInput.split(",").map(d => d.trim().toUpperCase()).filter(Boolean);
        const devicesArray = deviceList.map((devId) => {
            const existingDev = editingId 
                ? (owners.find(o => o.id === editingId)?.raw?.Devices || []).find((d: any) => d.DeviceId.trim().toUpperCase() === devId) 
                : null;
            return {
                Id: existingDev ? existingDev.Id : 0,
                UserId: editingId ? Number(editingId) : 0,
                DeviceId: devId,
                DeviceName: devId,
                IsActive: existingDev ? existingDev.IsActive : true,
                CreatedAt: existingDev ? existingDev.CreatedAt : new Date().toISOString()
            };
        });

        if (editingId) {
            const owner = owners.find(o => o.id === editingId);
            const rawUser = owner?.raw || {};

            const updatedOwnerPayload = {
                UserId: Number(editingId),
                FirstName: firstName.trim(),
                LastName: lastName.trim(),
                Email: email.trim(),
                PasswordHash: rawUser.PasswordHash || null,
                PhoneNumber: mobile,
                IsActive: owner?.status === "Verified",
                CreatedAt: rawUser.CreatedAt || new Date().toISOString(),
                UpdatedAt: new Date().toISOString(),
                CreatedBy: rawUser.CreatedBy || null,
                UpdatedBy: 1,
                Address: address.trim(),
                Photo: rawUser.Photo || "",
                Aadhar: aadhar,
                Devices: devicesArray
            };

            try {
                const res = await fetch(`/api/bgvusers/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedOwnerPayload)
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || errData.message || "Failed to update driver partner on backend");
                }

                setToast({ message: `Updated profile for ${firstName.trim()}`, type: "success" });
                setIsOpen(false);
                fetchUsers();
            } catch (err: any) {
                console.error("Error updating owner:", err);
                setToast({ message: `Update failed: ${err.message}`, type: "error" });
            }
        } else {
            const newOwnerPayload = {
                UserId: 0,
                FirstName: firstName.trim(),
                LastName: lastName.trim(),
                Email: email.trim(),
                PasswordHash: null,
                PhoneNumber: mobile,
                IsActive: true,
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString(),
                CreatedBy: 1,
                UpdatedBy: 0,
                Address: address.trim(),
                Photo: "",
                Aadhar: aadhar,
                Devices: devicesArray
            };

            try {
                const res = await fetch("/api/bgvusers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newOwnerPayload)
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || errData.message || "Failed to register driver partner");
                }

                setToast({ message: `Registered driver partner ${firstName.trim()}`, type: "success" });
                setIsOpen(false);
                fetchUsers();
            } catch (err: any) {
                console.error("Error creating owner:", err);
                setToast({ message: `Registration failed: ${err.message}`, type: "error" });
            }
        }
    };

    // Delete Owner (DELETE)
    const handleDelete = async (id: string) => {
        const owner = owners.find(o => o.id === id);
        const name = owner ? `${owner.firstName} ${owner.lastName}` : "this owner";
        if (window.confirm(`Are you sure you want to deactivate profile for ${name}?`)) {
            try {
                const res = await fetch(`/api/bgvusers/${id}`, {
                    method: "DELETE"
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || errData.message || "Failed to deactivate driver");
                }

                setToast({ message: `Deactivated profile for: ${name}`, type: "info" });
                fetchUsers();
            } catch (err: any) {
                console.error("Error deleting owner:", err);
                setToast({ message: `Deactivation failed: ${err.message}`, type: "error" });
            }
        }
    };

    // Link Device action with POST persistence
    const handleLinkDevice = async (id: string) => {
        const owner = owners.find(o => o.id === id);
        if (!owner) return;
        
        const devNum = prompt(`Link battery ID/vehicle code to ${owner.firstName} ${owner.lastName} (e.g. CCLN26B0153):`);
        if (devNum === null) return;
        
        if (!devNum.trim()) {
            setToast({ message: "Device ID cannot be empty", type: "error" });
            return;
        }

        const cleanDev = devNum.trim().toUpperCase();

        try {
            const res = await fetch("/api/bgvusers/add-device", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Id: 0,
                    UserId: Number(id),
                    DeviceId: cleanDev,
                    DeviceName: cleanDev,
                    IsActive: true,
                    CreatedAt: new Date().toISOString()
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || errData.message || "Failed to save device linkage");
            }

            setToast({ message: `Linked device ${cleanDev} to ${owner.firstName}`, type: "success" });
            fetchUsers();
        } catch (err: any) {
            console.error("Error linking device:", err);
            setToast({ message: `Link failed: ${err.message}`, type: "error" });
        }
    };

    // Filter Owners based on search & status
    const filteredOwners = owners.filter(o => {
        const matchesSearch = 
            o.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.aadhar.includes(searchQuery) ||
            o.mobile.includes(searchQuery);
            
        const matchesStatus = 
            statusFilter === "All" ||
            o.status === statusFilter;
            
        return matchesSearch && matchesStatus;
    });

    // Stats calculations
    const totalOwnersCount = owners.length;
    const verifiedOwnersCount = owners.filter(o => o.status === "Verified").length;
    const totalLinkedDevices = owners.reduce((acc, o) => acc + o.linkedDevices.length, 0);

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            
            {/* Notification Toast */}
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

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-brand-navy dark:text-white">Onboard Drivers & Assets</h2>
                    <p className="text-[11px] text-gray-405">Register new EV driver partners, upload identity proofs, and link battery diagnostic modules.</p>
                </div>
                
                <button
                    onClick={openCreateForm}
                    className="inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-hover active:scale-[0.98] text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-brand-green/20 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Register Driver Partner
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="saas-card p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-405 uppercase tracking-widest">Total Registered Drivers</p>
                        <h3 className="mt-1 text-2xl font-black text-brand-navy dark:text-white">{totalOwnersCount}</h3>
                        <p className="mt-0.5 text-[10px] text-gray-400">Last-Mile Operations</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>

                <div className="saas-card p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-405 uppercase tracking-widest">Verified Accounts</p>
                        <h3 className="mt-1 text-2xl font-black text-brand-navy dark:text-white">
                            {verifiedOwnersCount}
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">/ {totalOwnersCount}</span>
                        </h3>
                        <p className="mt-0.5 text-[10px] text-gray-400">Identity Checks Clear</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                </div>

                <div className="saas-card p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-405 uppercase tracking-widest">Active Battery Mappings</p>
                        <h3 className="mt-1 text-2xl font-black text-brand-navy dark:text-white">{totalLinkedDevices}</h3>
                        <p className="mt-0.5 text-[10px] text-gray-400">Telemetry Modules Mapped</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* List Console */}
            <div className="saas-card overflow-hidden">
                {/* Filters */}
                <div className="p-5 border-b border-gray-155 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30 dark:bg-gray-955/10">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black uppercase text-brand-navy dark:text-white tracking-widest">Profiles Directory</h3>
                        <span className="bg-brand-green/10 text-brand-green text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            {filteredOwners.length} Matches
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-450">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search Name, Aadhar, Mobile..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 w-full sm:w-60 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-955 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-455 hover:text-gray-650"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Segmented status filter */}
                        <div className="flex items-center bg-white dark:bg-gray-955 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                            {(["All", "Verified", "Pending"] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        statusFilter === status
                                            ? "bg-gray-100 dark:bg-gray-800 shadow-sm text-brand-green"
                                            : "text-gray-455 hover:text-brand-navy dark:hover:text-white"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto">
                    {filteredOwners.length === 0 ? (
                        <div className="p-16 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                                🔍
                            </div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No driver profiles match your search filters</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Try adjusting your keywords or clearing the search box.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <table className="hidden md:table saas-table saas-table-zebra">
                                <thead>
                                    <tr>
                                        <th className="pl-6">Driver Profile</th>
                                        <th>Registered Email</th>
                                        <th>Aadhar Identity</th>
                                        <th>Mobile Contact</th>
                                        <th>Physical Address</th>
                                        <th>Linked Assets</th>
                                        <th className="text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="font-semibold text-brand-navy dark:text-gray-200">
                                    {filteredOwners.map((owner) => (
                                        <tr key={owner.id}>
                                            <td className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-xs">
                                                        {(owner.firstName[0] || "") + (owner.lastName[0] || "")}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-xs text-brand-navy dark:text-white leading-tight">{owner.firstName} {owner.lastName}</h4>
                                                        <span className={`inline-flex items-center gap-1.5 mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                            owner.status === "Verified"
                                                                ? "bg-green-500/10 text-brand-green"
                                                                : "bg-amber-500/10 text-amber-500"
                                                        }`}>
                                                            {owner.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="text-gray-550 dark:text-gray-400 font-medium">
                                                {owner.email || "No Email linked"}
                                            </td>

                                            <td className="font-mono text-gray-600 dark:text-gray-300 text-[11px]">
                                                {owner.aadhar}
                                            </td>

                                            <td className="text-gray-600 dark:text-gray-300">
                                                +91 {owner.mobile}
                                            </td>

                                            <td className="max-w-[200px] text-gray-550 dark:text-gray-400 truncate" title={owner.address}>
                                                {owner.address || "Address not provided"}
                                            </td>

                                            <td>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {owner.linkedDevices.map((dev) => (
                                                        <button 
                                                            key={dev}
                                                            onClick={() => handleOpenDeviceDetails(dev)}
                                                            title={`Run Live Diagnostic test on ${dev}`}
                                                            className="text-[10px] bg-brand-green/5 hover:bg-brand-green/10 border border-brand-green/20 text-brand-green px-2.5 py-0.5 rounded font-bold cursor-pointer transition-all"
                                                        >
                                                            {dev}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => handleLinkDevice(owner.id)}
                                                        className="text-[10px] text-brand-green hover:underline font-bold cursor-pointer ml-1"
                                                    >
                                                        + Link Asset
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="text-right pr-6 whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditForm(owner)}
                                                        title="Edit profile parameters"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-green hover:bg-brand-green/5 dark:hover:bg-brand-green/10 cursor-pointer transition-colors"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(owner.id)}
                                                        title="Suspend driver record"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 cursor-pointer transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile Grid Cards View */}
                            <div className="grid grid-cols-1 divide-y divide-gray-150 dark:divide-gray-800 md:hidden text-xs">
                                {filteredOwners.map((owner) => (
                                    <div key={owner.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-xs">
                                                    {(owner.firstName[0] || "") + (owner.lastName[0] || "")}
                                                </div>
                                                <div>
                                                    <h4 className="font-extrabold text-brand-navy dark:text-white leading-tight">{owner.firstName} {owner.lastName}</h4>
                                                    <p className="text-[10px] text-gray-405 leading-tight mt-0.5">{owner.email || "No Email"}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                owner.status === "Verified"
                                                    ? "bg-green-500/10 text-brand-green"
                                                    : "bg-amber-500/10 text-amber-500"
                                            }`}>
                                                {owner.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-3 rounded-xl border border-gray-150 dark:border-gray-800 text-[11px] font-semibold">
                                            <div>
                                                <span className="text-[9px] font-bold uppercase text-gray-400 block mb-0.5">Aadhar Number</span>
                                                <span className="font-mono text-gray-700 dark:text-gray-300">{owner.aadhar}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold uppercase text-gray-400 block mb-0.5">Mobile Phone</span>
                                                <span className="text-gray-700 dark:text-gray-300">+91 {owner.mobile}</span>
                                            </div>
                                            <div className="col-span-2 pt-1 border-t border-gray-100 dark:border-gray-855">
                                                <span className="text-[9px] font-bold uppercase text-gray-400 block mb-0.5">Address</span>
                                                <span className="text-gray-550 dark:text-gray-450 block truncate">{owner.address || "Address not provided"}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                            <div className="flex flex-wrap items-center gap-1">
                                                {owner.linkedDevices.map((dev) => (
                                                    <button 
                                                        key={dev}
                                                        onClick={() => handleOpenDeviceDetails(dev)}
                                                        className="text-[9px] bg-brand-green/5 border border-brand-green/10 text-brand-green px-2 py-0.5 rounded font-bold cursor-pointer"
                                                    >
                                                        {dev}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => handleLinkDevice(owner.id)}
                                                    className="text-[9px] text-brand-green font-bold hover:underline cursor-pointer"
                                                >
                                                    + Link
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => openEditForm(owner)}
                                                    className="px-2.5 py-1 rounded bg-gray-55 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 text-[10px] font-bold hover:text-brand-green"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(owner.id)}
                                                    className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 text-[10px] font-bold text-red-650"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Sliding Drawer Form (Right side) */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end transition-opacity">
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
                    
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto transform transition-transform animate-slide-in border-l border-gray-150 dark:border-gray-800 z-50">
                        <div>
                            <div className="flex justify-between items-center pb-5 border-b border-gray-150 dark:border-gray-800">
                                <div>
                                    <h2 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-wider">
                                        {editingId ? "Modify Driver Profile" : "Register EV Driver Partner"}
                                    </h2>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        {editingId ? "Modify identification fields and linked devices." : "Onboard a new last-mile driver into the dashboard fleet network."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-navy dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-855 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs font-semibold">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-gray-405 block">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                                        />
                                        {formErrors.firstName && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.firstName}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-gray-405 block">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-gray-405 block">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="driver@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-955 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    />
                                    {formErrors.email && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.email}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-gray-405 block">Aadhar Card (12-Digit) *</label>
                                        <input
                                            type="text"
                                            placeholder="XXXX-XXXX-XXXX"
                                            required
                                            value={aadhar}
                                            onChange={(e) => handleAadharChange(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-955 font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-brand-green"
                                        />
                                        {formErrors.aadhar && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.aadhar}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-gray-405 block">Mobile No. (10-Digit) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 inset-y-0 flex items-center text-gray-400">+91</span>
                                            <input
                                                type="tel"
                                                required
                                                value={mobile}
                                                onChange={(e) => handleMobileChange(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-955 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                                            />
                                        </div>
                                        {formErrors.mobile && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.mobile}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-gray-405 block">Home / Operational Address</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Full address details"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-955 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-gray-405 block">Linked Battery Devices (Comma Separated)</label>
                                    <input
                                        type="text"
                                        placeholder="CCLN26B0153, CHG-2287A"
                                        value={linkedDeviceInput}
                                        onChange={(e) => setLinkedDeviceInput(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-955 font-mono focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium">Mapped IoT telemetry codes for active tracking.</p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] cursor-pointer mt-4"
                                >
                                    {editingId ? "Save Profile Changes" : "Register & Verify Driver"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* IoT Live Diagnostic Dialog */}
            {selectedDevice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setSelectedDevice(null)} />
                    
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-155 dark:border-gray-800 text-xs font-semibold animate-scale-in z-50">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">IoT Telemetry Diagnostics</span>
                                <h3 className="text-sm font-black text-brand-navy dark:text-white font-mono">{selectedDevice}</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedDevice(null)} 
                                className="p-1 rounded bg-gray-55 dark:bg-gray-800 text-gray-400 hover:text-brand-navy dark:hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {isDeviceLoading ? (
                            <div className="py-12 text-center space-y-3">
                                <div className="relative w-8 h-8 mx-auto">
                                    <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                                    <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                                </div>
                                <p className="text-xs text-gray-400 font-bold">Querying IoT diagnostic servers...</p>
                            </div>
                        ) : deviceError ? (
                            <div className="py-8 text-center text-red-500 font-bold">
                                ⚠️ {deviceError}
                            </div>
                        ) : deviceDetails ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-955 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 font-mono text-[11px]">
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-gray-400 block mb-0.5">State of Charge</span>
                                        <span className={`text-base font-black ${deviceDetails.soc < 20 ? "text-amber-500" : "text-brand-green"}`}>{deviceDetails.soc}%</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-gray-400 block mb-0.5">Current Flow</span>
                                        <span className="text-base font-black text-brand-navy dark:text-white">{deviceDetails.current?.toFixed(1) ?? "--"} A</span>
                                    </div>
                                    <div className="col-span-2 border-t border-gray-100 dark:border-gray-855 pt-2">
                                        <span className="text-[9px] font-bold uppercase text-gray-400 block mb-0.5">Pack Volt / Temp</span>
                                        <span className="text-xs font-black text-brand-navy dark:text-white">{deviceDetails.battery?.toFixed(1) ?? "--"} V @ {deviceDetails.cell_temperature_01 ? `${Math.round(deviceDetails.cell_temperature_01)}°C` : "--"}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold uppercase text-gray-400 pl-1">Device Attributes</h4>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-955 border border-gray-150 dark:border-gray-800 rounded-xl space-y-1.5 font-medium leading-relaxed">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Alarm Status:</span>
                                            <span className={`font-bold ${deviceDetails.Alert ? "text-red-500" : "text-brand-green"}`}>{deviceDetails.Alert ?? "Normal"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">GPS Signal Quality:</span>
                                            <span className="text-brand-navy dark:text-white font-bold">Excellent</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Last Telemetry Packet:</span>
                                            <span className="text-gray-500 font-mono text-[10px]">{new Date(deviceDetails.device_time).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-8">No diagnostics available for this module.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
