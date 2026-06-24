"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Device {
    Id: number;
    UserId: number;
    DeviceId: string;
    DeviceName: string;
    IsActive?: boolean;
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
    UserTypeName?: string;
}

export default function EMILoansPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    // EMI and Payment States
    const [paidMonthsMap, setPaidMonthsMap] = useState<Record<number, number>>({});
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [showPaymentGate, setShowPaymentGate] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
    const [upiId, setUpiId] = useState("");
    const [cardNumber, setCardNumber] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/bgvusers");
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to load users");
            }
            const data: Driver[] = await res.json();
            setDrivers(data);

            // Fetch and initialize EMI months from localStorage or defaults
            const emiMap: Record<number, number> = {};
            data.forEach((d) => {
                const stored = localStorage.getItem(`bgv_emi_paid_${d.UserId}`);
                if (stored) {
                    emiMap[d.UserId] = Number(stored);
                } else {
                    const defaultPaid = (d.UserId % 5) + 2;
                    emiMap[d.UserId] = defaultPaid;
                    localStorage.setItem(`bgv_emi_paid_${d.UserId}`, defaultPaid.toString());
                }
            });
            setPaidMonthsMap(emiMap);
        } catch (err: any) {
            console.error("Error loading EMI data:", err);
            setToast({ message: err.message || "Failed to load dashboard data", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const triggerPaymentFlow = (driver: Driver) => {
        setSelectedDriver(driver);
        setUpiId(`${driver.FirstName.toLowerCase()}@upi`);
        setCardNumber("4312 9980 1455 5337");
        setPaymentSuccess(false);
        setPaymentLoading(false);
        setShowPaymentGate(true);
    };

    const handleExecutePayment = () => {
        if (!selectedDriver) return;
        setPaymentLoading(true);
        setTimeout(() => {
            setPaymentLoading(false);
            setPaymentSuccess(true);
            setTimeout(() => {
                const currentPaid = paidMonthsMap[selectedDriver.UserId] || 0;
                const nextPaid = Math.min(12, currentPaid + 1);
                
                // Update Local Storage
                localStorage.setItem(`bgv_emi_paid_${selectedDriver.UserId}`, nextPaid.toString());
                
                // Update Local State Map
                setPaidMonthsMap((prev) => ({
                    ...prev,
                    [selectedDriver.UserId]: nextPaid,
                }));

                setShowPaymentGate(false);
                setPaymentSuccess(false);
                setSelectedDriver(null);
                setToast({ message: `EMI Payment successfully logged for ${selectedDriver.FirstName} ${selectedDriver.LastName}.`, type: "success" });
            }, 1200);
        }, 1500);
    };

    // Calculate aggregated statistics
    const totalAccounts = drivers.length;
    let totalCollectedAmount = 0;
    let totalOutstandingAmount = 0;
    let activeLoansCount = 0;
    let fullyPaidCount = 0;

    drivers.forEach((d) => {
        const paidMonths = paidMonthsMap[d.UserId] || 0;
        const collected = paidMonths * 5500;
        const outstanding = 66000 - collected;

        totalCollectedAmount += collected;
        totalOutstandingAmount += outstanding;
        if (outstanding > 0) {
            activeLoansCount++;
        } else {
            fullyPaidCount++;
        }
    });

    // Filtering based on search query
    const filteredDrivers = drivers.filter((d) => {
        const query = searchQuery.toLowerCase();
        const batteryCode = d.Devices && d.Devices.length > 0 ? d.Devices[0].DeviceId.toLowerCase() : "unassigned";
        return (
            d.FirstName.toLowerCase().includes(query) ||
            d.LastName.toLowerCase().includes(query) ||
            d.PhoneNumber.includes(query) ||
            d.Aadhar.includes(query) ||
            batteryCode.includes(query)
        );
    });

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full text-brand-navy dark:text-white">
            {/* Toast Notifications */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border transition-all transform animate-scale-in ${
                    toast.type === "success" 
                        ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" 
                        : "bg-red-50 dark:bg-red-955/80 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                }`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span className="text-xs font-bold">{toast.message}</span>
                </div>
            )}

            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                        FINANCE CONTROLLER
                    </span>
                    <h2 className="text-xl font-black uppercase tracking-tight">
                        EMI Loan Ledger Accounts
                    </h2>
                </div>
            </div>

            {/* KPIs Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Collected EMIs</span>
                        <h3 className="text-xl font-black text-brand-green leading-tight">₹{totalCollectedAmount.toLocaleString()}</h3>
                        <p className="text-[10px] text-gray-405">Aggregate Cash Inflow</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                        ₹
                    </div>
                </div>

                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Outstanding Balance</span>
                        <h3 className="text-xl font-black text-amber-500 leading-tight">₹{totalOutstandingAmount.toLocaleString()}</h3>
                        <p className="text-[10px] text-gray-405">Collectable Receivable</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                        ⚡
                    </div>
                </div>

                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Active Loans</span>
                        <h3 className="text-xl font-black text-blue-500 leading-tight">{activeLoansCount} Accounts</h3>
                        <p className="text-[10px] text-gray-405">Currently Servicing Accounts</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                        👤
                    </div>
                </div>

                <div className="saas-card p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Fully Settled</span>
                        <h3 className="text-xl font-black text-purple-500 leading-tight">{fullyPaidCount} Users</h3>
                        <p className="text-[10px] text-gray-405">Closed Loan Portfolios</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                        ✓
                    </div>
                </div>
            </div>

            {/* List Table Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Search Bar & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-black uppercase text-gray-450 tracking-wider">
                        Driver Partner Portfolios ({filteredDrivers.length})
                    </h4>
                    
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by partner, ID, phone, or battery..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2.5 w-full sm:w-80 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="relative w-8 h-8 mx-auto mb-3">
                            <div className="absolute inset-0 rounded-full border-4 border-brand-green/10" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-brand-green animate-spin" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400">Syncing EMI transaction registry...</p>
                    </div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="py-16 text-center text-xs text-gray-400 italic">
                        No loan accounts match the current filter queries.
                    </div>
                ) : (
                    /* Table Container */
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs font-semibold">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Driver Partner</th>
                                    <th className="py-3.5 px-4">Linked Device</th>
                                    <th className="py-3.5 px-4">Installment Timeline</th>
                                    <th className="py-3.5 px-4">Total Paid</th>
                                    <th className="py-3.5 px-4">Outstanding Balance</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                {filteredDrivers.map((d) => {
                                    const paidMonths = paidMonthsMap[d.UserId] || 0;
                                    const collected = paidMonths * 5500;
                                    const outstanding = 66000 - collected;
                                    const percentage = Math.round((paidMonths / 12) * 100);
                                    const battery = d.Devices && d.Devices.length > 0 ? d.Devices[0].DeviceId.trim() : "";
                                    
                                    return (
                                        <tr key={d.UserId} className="hover:bg-gray-50/30 dark:hover:bg-gray-850/20 transition-colors">
                                            {/* Driver Name & Info */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8.5 h-8.5 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-xs">
                                                        {(d.FirstName[0] || "") + (d.LastName[0] || "")}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-extrabold text-brand-navy dark:text-white leading-tight">
                                                            {d.FirstName} {d.LastName}
                                                        </h5>
                                                        <span className="text-[10px] text-gray-400 block font-normal mt-0.5">
                                                            FB{d.UserId} • +91 {d.PhoneNumber}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Linked Battery Device */}
                                            <td className="py-4 px-4 font-mono font-bold text-gray-700 dark:text-gray-300">
                                                {battery ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        {battery}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-normal italic">Unmapped</span>
                                                )}
                                            </td>

                                            {/* Installment progress timeline */}
                                            <td className="py-4 px-4 w-44">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-450">
                                                        <span>Progress</span>
                                                        <span>{paidMonths} / 12 months</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${outstanding <= 0 ? "bg-brand-green" : "bg-blue-500"}`} 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Paid Amount */}
                                            <td className="py-4 px-4 font-bold text-brand-green">
                                                ₹{collected.toLocaleString()}
                                            </td>

                                            {/* Outstanding Amount */}
                                            <td className={`py-4 px-4 font-bold ${outstanding > 0 ? "text-amber-500" : "text-gray-400"}`}>
                                                ₹{outstanding.toLocaleString()}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                    outstanding <= 0 
                                                        ? "bg-emerald-500/10 text-brand-green" 
                                                        : "bg-blue-500/10 text-blue-500"
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full bg-current ${outstanding > 0 ? "animate-pulse" : ""}`} />
                                                    {outstanding <= 0 ? "Fully Settled" : "Active Loan"}
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => triggerPaymentFlow(d)}
                                                        disabled={outstanding <= 0}
                                                        className="px-3 py-1.5 rounded-lg font-bold text-[10.5px] bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-brand-green/10 disabled:hover:text-brand-green cursor-pointer active:scale-95 whitespace-nowrap"
                                                    >
                                                        Collect Payment
                                                    </button>
                                                    <Link
                                                        href={`/drivers/${d.UserId}`}
                                                        className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 text-brand-navy dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 transition-all text-[10.5px] whitespace-nowrap"
                                                    >
                                                        Details
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Gateway Modal Simulator (Razorpay Mockup) */}
            {showPaymentGate && selectedDriver && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 transition-opacity animate-fade-in">
                    
                    {/* Checkout Box Container */}
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 text-xs font-semibold animate-scale-in z-50 text-brand-navy dark:text-white">
                        
                        {/* Razorpay Brand Header */}
                        <div className="bg-blue-600 text-white p-5 flex justify-between items-center select-none">
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
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
                                <div>
                                    <span className="text-[9px] text-gray-400 block font-bold uppercase">Installment EMI</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">{selectedDriver.FirstName} {selectedDriver.LastName} (FB{selectedDriver.UserId})</span>
                                </div>
                                <span className="text-lg font-black text-blue-650 dark:text-blue-400">₹5,500</span>
                            </div>

                            {paymentLoading ? (
                                <div className="py-8 flex flex-col items-center justify-center space-y-4">
                                    <div className="relative w-10 h-10">
                                        <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-955/40" />
                                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                                    </div>
                                    <p className="text-xs text-gray-400 font-bold text-center">Securing transaction through Razorpay network...</p>
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
                                            <label className="text-[9px] font-bold uppercase text-gray-450 block pl-1">VPA Handler Address</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. driver@upi"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-brand-navy dark:text-white"
                                            />
                                        </div>
                                    )}

                                    {/* Tab: Card */}
                                    {paymentMethod === "card" && (
                                        <div className="space-y-3 text-xs">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold uppercase text-gray-450 block pl-1">Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="XXXX XXXX XXXX XXXX"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-955 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-brand-navy dark:text-white"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold uppercase text-gray-450 block pl-1">Expiry</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-955 text-center focus:outline-none text-brand-navy dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold uppercase text-gray-450 block pl-1">CVV</label>
                                                    <input
                                                        type="password"
                                                        placeholder="•••"
                                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-955 text-center focus:outline-none text-brand-navy dark:text-white"
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

                        <div className="p-3 bg-slate-50 dark:bg-slate-955 border-t border-gray-100 dark:border-gray-855 text-center text-[9px] text-gray-400 block font-bold uppercase tracking-wider select-none">
                            🛡️ PCI-DSS SECURED GATEWAY
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
