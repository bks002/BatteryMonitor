"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserType {
    UserTypeId: number;
    UserTypeName: string;
    IsActive: boolean;
    CreatedAt: string;
}

export default function UserTypesPage() {
    const router = useRouter();
    const [userTypes, setUserTypes] = useState<UserType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form Drawer State
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [roleName, setRoleName] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Notification Toast State
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const fetchUserTypes = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/bgvusers/usertypes");
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to load user types");
            }
            const data = await res.json();
            setUserTypes(data || []);
        } catch (err: any) {
            console.error("Error fetching user types:", err);
            setError(err.message || "Could not retrieve user types from backend database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserTypes();
    }, []);

    // Auto-dismiss Toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Open drawer to Create
    const openCreateForm = () => {
        setEditingId(null);
        setRoleName("");
        setFormError(null);
        setIsOpen(true);
    };

    // Open drawer to Edit
    const openEditForm = (ut: UserType) => {
        setEditingId(ut.UserTypeId);
        setRoleName(ut.UserTypeName);
        setFormError(null);
        setIsOpen(true);
    };

    // Handle form submit (POST / PUT)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName.trim()) {
            setFormError("Role name is required");
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            if (editingId !== null) {
                // Edit / PUT
                const res = await fetch(`/api/bgvusers/usertypes/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: roleName.trim() }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to update role");
                }

                setToast({ message: `Successfully updated role: ${roleName.trim()}`, type: "success" });
                setIsOpen(false);
                fetchUserTypes();
            } else {
                // Create / POST
                const res = await fetch("/api/bgvusers/usertypes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: roleName.trim() }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to create role");
                }

                setToast({ message: `Successfully registered new role: ${roleName.trim()}`, type: "success" });
                setIsOpen(false);
                fetchUserTypes();
            }
        } catch (err: any) {
            console.error("Error saving user type:", err);
            setFormError(err.message || "An error occurred while saving the role.");
        } finally {
            setSaving(false);
        }
    };

    // Delete User Type (DELETE)
    const handleDelete = async (ut: UserType) => {
        if (!confirm(`Are you sure you want to delete/deactivate the user role "${ut.UserTypeName}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/bgvusers/usertypes/${ut.UserTypeId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to delete role");
            }

            setToast({ message: `Successfully deactivated role: ${ut.UserTypeName}`, type: "info" });
            fetchUserTypes();
        } catch (err: any) {
            console.error("Error deleting user type:", err);
            setToast({ message: err.message || "Failed to delete role.", type: "error" });
        }
    };

    // Filter list by search query
    const filteredTypes = userTypes.filter((ut) =>
        ut.UserTypeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Notification Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border transition-all transform animate-scale-in ${
                        toast.type === "success"
                            ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                            : toast.type === "error"
                            ? "bg-red-50 dark:bg-red-955/80 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                            : "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                    }`}
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                    <span className="text-xs font-black">{toast.message}</span>
                </div>
            )}

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <Link href="/" className="hover:text-brand-green transition-colors">Fleet Console</Link>
                        <span>/</span>
                        <span className="text-brand-green font-extrabold">Role Settings</span>
                    </div>
                    <h2 className="text-base font-black uppercase tracking-tight text-brand-navy dark:text-white">
                        User Types & Role Management
                    </h2>
                    <p className="text-[11px] text-gray-405">
                        Define administrative roles, access controls, and category configurations for drivers and staff.
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-hover active:scale-[0.98] text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-brand-green/20 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add User Type
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-gray-400">Loading BGV user roles...</p>
                </div>
            ) : error ? (
                <div className="saas-card p-12 text-center max-w-md mx-auto space-y-4">
                    <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-lg">⚠️</div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Connection Error</h3>
                    <p className="text-xs text-gray-500">{error}</p>
                    <button
                        onClick={fetchUserTypes}
                        className="text-xs bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-xl font-bold transition-all"
                    >
                        Retry Query
                    </button>
                </div>
            ) : (
                <div className="saas-card overflow-hidden">
                    {/* Filters */}
                    <div className="p-5 border-b border-gray-155 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30 dark:bg-gray-955/10">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-black uppercase text-brand-navy dark:text-white tracking-widest">
                                Role Definitions
                            </h3>
                            <span className="bg-brand-green/10 text-brand-green text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                {filteredTypes.length} Total
                            </span>
                        </div>

                        <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-450">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search roles by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 w-full sm:w-60 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-955 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-455 hover:text-gray-655"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        {filteredTypes.length === 0 ? (
                            <div className="p-16 text-center space-y-3">
                                <h4 className="text-sm font-bold text-gray-750 dark:text-gray-300">No user roles matching this search query</h4>
                                <p className="text-xs text-gray-500">Add a new user type or modify your search keyword.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <table className="hidden md:table saas-table saas-table-zebra">
                                    <thead>
                                        <tr>
                                            <th className="text-left pl-6">Role / User Type ID</th>
                                            <th className="text-left">Role Name</th>
                                            <th className="text-left">Status</th>
                                            <th className="text-left">Creation Date</th>
                                            <th className="text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-semibold text-brand-navy dark:text-gray-200">
                                        {filteredTypes.map((ut) => (
                                            <tr key={ut.UserTypeId}>
                                                <td className="pl-6 font-mono text-[11px] text-gray-400">
                                                    #{ut.UserTypeId}
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl ${
                                                        ut.UserTypeId === 1
                                                            ? "bg-purple-500/10 text-purple-650 dark:text-purple-405"
                                                            : ut.UserTypeId === 2
                                                            ? "bg-blue-500/10 text-blue-650 dark:text-blue-405"
                                                            : "bg-emerald-500/10 text-brand-green"
                                                    }`}>
                                                        {ut.UserTypeName}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                        ut.IsActive
                                                            ? "bg-green-500/10 text-brand-green"
                                                            : "bg-red-500/10 text-red-500"
                                                    }`}>
                                                        {ut.IsActive ? "Active" : "Deactivated"}
                                                    </span>
                                                </td>
                                                <td className="text-gray-500 text-[11px]">
                                                    {ut.CreatedAt ? new Date(ut.CreatedAt).toLocaleString() : "System Role"}
                                                </td>
                                                <td className="text-right pr-6 whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditForm(ut)}
                                                            title="Rename role"
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-green hover:bg-brand-green/5 dark:hover:bg-brand-green/10 cursor-pointer transition-colors"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(ut)}
                                                            title="Deactivate / Suspend role"
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

                                {/* Mobile Grid Cards */}
                                <div className="grid grid-cols-1 divide-y divide-gray-150 dark:divide-gray-800 md:hidden text-xs">
                                    {filteredTypes.map((ut) => (
                                        <div key={ut.UserTypeId} className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9px] font-mono text-gray-400 block">ID: #{ut.UserTypeId}</span>
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-0.5 rounded-lg mt-0.5 ${
                                                        ut.UserTypeId === 1
                                                            ? "bg-purple-500/10 text-purple-650 dark:text-purple-405"
                                                            : ut.UserTypeId === 2
                                                            ? "bg-blue-500/10 text-blue-650 dark:text-blue-405"
                                                            : "bg-emerald-500/10 text-brand-green"
                                                    }`}>
                                                        {ut.UserTypeName}
                                                    </span>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    ut.IsActive
                                                        ? "bg-green-500/10 text-brand-green"
                                                        : "bg-red-500/10 text-red-500"
                                                }`}>
                                                    {ut.IsActive ? "Active" : "Deactivated"}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-[10.5px] pt-1">
                                                <span className="text-gray-400 font-bold">Created: {ut.CreatedAt ? new Date(ut.CreatedAt).toLocaleDateString() : "System Default"}</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditForm(ut)}
                                                        className="px-2.5 py-1 rounded bg-gray-55 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 font-bold text-[10px] hover:text-brand-green"
                                                    >
                                                        Rename
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(ut)}
                                                        className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 font-bold text-[10px] text-red-650"
                                                    >
                                                        Delete
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
            )}

            {/* Sliding Form Drawer (Right Side) */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end transition-opacity">
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto transform transition-transform animate-slide-in border-l border-gray-150 dark:border-gray-800 z-50">
                        <div>
                            <div className="flex justify-between items-center pb-5 border-b border-gray-150 dark:border-gray-800">
                                <div>
                                    <h2 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-wider">
                                        {editingId !== null ? "Modify User Type" : "Create New User Type"}
                                    </h2>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        {editingId !== null ? "Rename role mapping properties in the database." : "Add a custom administrative or operator access role."}
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
                                {formError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 rounded-xl text-red-650 dark:text-red-400 font-bold text-[11px]">
                                        ⚠️ {formError}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-gray-405 block">Role / User Type Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        placeholder="e.g. Supervisor, Support Agent"
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                        Note: User Type name should be short, concise, and uppercase-equivalent (e.g. "Admin", "User", "Manager").
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-brand-green hover:bg-brand-green-hover disabled:opacity-50 text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] cursor-pointer mt-4"
                                >
                                    {saving ? "Processing Request..." : editingId !== null ? "Save Role Changes" : "Register New User Type"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
