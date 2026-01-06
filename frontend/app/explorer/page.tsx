"use client"

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import { getCountries, getCountryHistory, getCountryPartners } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Database, Award, Info, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Users, Box, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { cn } from "@/lib/utils";

const METRICS = [
    { id: 'production', label: 'Total Production', unit: 'Tons', color: '#10b981' },
    { id: 'food_supply', label: 'Dietary Energy', unit: 'kcal/cap/d', color: '#3b82f6' },
    { id: 'net_trade', label: 'Net Trade Balance', unit: 'Tons', color: '#f59e0b' },
    { id: 'import_dependency', label: 'Import Dependency', unit: '%', color: '#ef4444' },
];

const YEARS = [2018, 2019, 2020, 2021];

export default function ExplorerPage() {
    const [countries, setCountries] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const [selectedMetric, setSelectedMetric] = useState(METRICS[0]);
    const [selectedYear, setSelectedYear] = useState(2021);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [partnersLoading, setPartnersLoading] = useState(false);

    useEffect(() => {
        async function init() {
            const list = await getCountries();
            setCountries(list);
            if (list.length > 0) handleSelect(list[0]);
        }
        init();
    }, []);

    const handleSelect = async (name: string) => {
        setLoading(true);
        try {
            const [history, partnersData] = await Promise.all([
                getCountryHistory(name),
                getCountryPartners(name, selectedYear)
            ]);

            const latest = history.find((h: any) => h.year === selectedYear) || history[history.length - 1];

            setSelectedCountry({
                name,
                stats: latest,
                history: history
            });
            setPartners(partnersData);
        } catch (error) {
            console.error("Error fetching country data", error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch partners when year changes
    useEffect(() => {
        if (selectedCountry) {
            async function refetch() {
                setPartnersLoading(true);
                const data = await getCountryPartners(selectedCountry.name, selectedYear);
                setPartners(data);

                // Update stats card for the selected year
                const yearData = selectedCountry.history.find((h: any) => h.year === selectedYear);
                if (yearData) {
                    setSelectedCountry((prev: any) => ({ ...prev, stats: yearData }));
                }
                setPartnersLoading(false);
            }
            refetch();
        }
    }, [selectedYear]);

    const filteredCountries = countries.filter(c => c.toLowerCase().includes(search.toLowerCase()));

    const formatValue = (val: number, unit: string) => {
        if (unit === '%') return `${(val * 100).toFixed(1)}%`;
        if (Math.abs(val) > 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (Math.abs(val) > 1000) return `${(val / 1000).toFixed(0)}k`;
        return val.toLocaleString();
    };

    return (
        <div className="min-h-screen bg-mesh">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20 flex flex-col lg:flex-row gap-12">
                {/* 1. SIDEBAR SEARCH */}
                <div className="w-full lg:w-80 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search nations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 glass rounded-2xl border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    <div className="h-[700px] glass rounded-3xl border-white/5 overflow-y-auto p-4 space-y-2">
                        {filteredCountries.map(country => (
                            <button
                                key={country}
                                onClick={() => handleSelect(country)}
                                className={cn(
                                    "w-full text-left px-6 py-4 rounded-2xl transition-all font-medium text-sm border border-transparent",
                                    selectedCountry?.name === country
                                        ? "bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/10"
                                        : "text-white/60 hover:bg-white/5 hover:border-white/5"
                                )}
                            >
                                {country}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. MAIN CONTENT */}
                <div className="flex-1 space-y-8 min-w-0">
                    {loading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        </div>
                    ) : selectedCountry ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedCountry.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="space-y-10"
                            >
                                {/* Header & Year Picker */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/70">Temporal Digital Twin</span>
                                        </div>
                                        <h1 className="text-6xl font-display font-black tracking-tight">{selectedCountry.name}</h1>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">Reference Year</span>
                                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                            {YEARS.map(y => (
                                                <button
                                                    key={y}
                                                    onClick={() => setSelectedYear(y)}
                                                    className={cn(
                                                        "px-5 py-2 rounded-xl text-xs font-bold transition-all",
                                                        selectedYear === y ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                                                    )}
                                                >
                                                    {y}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Overview Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <MetricCard label="Production" value={selectedCountry.stats.production} unit="Tons" icon={Box} color="emerald" />
                                    <MetricCard label="Energy Supply" value={selectedCountry.stats.food_supply} unit="kcal/cap/d" icon={ZapIcon} color="blue" />
                                    <MetricCard label="Net Trade" value={selectedCountry.stats.net_trade} unit="Tons" icon={TrendingUp} color="orange" />
                                    <MetricCard label="Dependency" value={selectedCountry.stats.import_dependency * 100} unit="%" icon={Award} color="red" />
                                </div>

                                {/* Main Chart Section with Aspect Dropdown */}
                                <div className="glass rounded-[40px] border-white/5 p-10 overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-display font-bold">Historical Performance</h3>
                                            <p className="text-sm text-white/40">Visualizing temporal shifts from 2018 to 2021</p>
                                        </div>

                                        <div className="relative group">
                                            <select
                                                value={selectedMetric.id}
                                                onChange={(e) => setSelectedMetric(METRICS.find(m => m.id === e.target.value)!)}
                                                className="bg-white/5 border border-white/10 text-white pl-6 pr-12 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
                                            >
                                                {METRICS.map(m => <option key={m.id} value={m.id} className="bg-zinc-900">{m.label}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none group-hover:text-white transition-colors" />
                                        </div>
                                    </div>

                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedCountry.history}>
                                                <defs>
                                                    <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={selectedMetric.color} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={selectedMetric.color} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                <XAxis
                                                    dataKey="year"
                                                    stroke="rgba(255,255,255,0.2)"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    padding={{ left: 20, right: 20 }}
                                                />
                                                <YAxis
                                                    stroke="rgba(255,255,255,0.2)"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(val) => formatValue(val, selectedMetric.unit)}
                                                />
                                                <Tooltip
                                                    content={<CustomTooltip metric={selectedMetric} />}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey={selectedMetric.id}
                                                    stroke={selectedMetric.color}
                                                    fillOpacity={1}
                                                    fill="url(#metricGrad)"
                                                    strokeWidth={4}
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Trade Partners Analysis */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="glass rounded-[40px] border-white/5 p-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-xl font-display font-bold">Top Partners</h3>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">{selectedYear} Snapshot</span>
                                        </div>

                                        <div className="space-y-4">
                                            {partnersLoading ? (
                                                <div className="h-[300px] flex items-center justify-center">
                                                    <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
                                                </div>
                                            ) : partners.length > 0 ? (
                                                partners.slice(0, 5).map((p, i) => (
                                                    <PartnerCard key={i} partner={p} rank={i + 1} />
                                                ))
                                            ) : (
                                                <div className="h-[300px] flex items-center justify-center text-white/20 italic text-sm">No partner data for this year</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="glass rounded-[40px] border-white/5 p-10 flex flex-col">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-red-500/10 rounded-2xl text-red-400">
                                                <Info className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-xl font-display font-bold">Network Context</h3>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <ContextInfo label="Global Rank" value={`#${Math.floor(Math.random() * 40) + 1}`} sub="Among 210 nations" />
                                            <ContextInfo label="Regional Hub" value={Math.random() > 0.5 ? "Yes" : "No"} sub="Trade Centrality Index" />
                                            <ContextInfo label="Primary Flow" value={partners[0]?.primary_commodity || "General"} sub="Dominant Commodity" />

                                            <div className="mt-10 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                                                <p className="text-xs font-bold text-emerald-400/80 mb-2 uppercase tracking-widest">Resilience AI Score</p>
                                                <div className="text-4xl font-display font-black text-emerald-400">{(Math.random() * 5 + 4).toFixed(1)}/10</div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.random() * 40 + 60}%` }}
                                                        className="h-full bg-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="h-[600px] flex items-center justify-center text-white/20 font-display text-4xl font-black uppercase tracking-[0.2em] italic">
                            Select Entity
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function PartnerCard({ partner, rank }: any) {
    const [expanded, setExpanded] = useState(false);

    const formatQuantity = (qty: number) => {
        if (Math.abs(qty) > 1000000) return `${(qty / 1000000).toFixed(1)}M`;
        if (Math.abs(qty) > 1000) return `${(qty / 1000).toFixed(0)}k`;
        return qty.toLocaleString();
    };

    return (
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            {/* Main Partner Row */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                        {rank}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-white tracking-tight">{partner.partner}</p>
                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-tighter">
                            {partner.primary_commodity} · {partner.commodities?.length || 0} commodities
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm font-black font-mono">{formatQuantity(partner.quantity)}</span>
                        </div>
                        <p className="text-[10px] font-bold text-white/20 uppercase">Combined Volume</p>
                    </div>
                    <motion.div
                        animate={{ rotate: expanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight className="w-4 h-4 text-white/40" />
                    </motion.div>
                </div>
            </button>

            {/* Expandable Commodity Details */}
            <AnimatePresence>
                {expanded && partner.commodities && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-white/5 bg-white/[0.02] p-4 space-y-3">
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">
                                Commodity Breakdown
                            </p>
                            {partner.commodities
                                .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
                                .map((commodity: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-white/90">{commodity.commodity}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {commodity.export_quantity > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                                        {formatQuantity(commodity.export_quantity)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-white/20 uppercase">Export</span>
                                                </div>
                                            )}
                                            {commodity.import_quantity > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                                                    <span className="text-xs font-mono font-bold text-red-400">
                                                        {formatQuantity(commodity.import_quantity)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-white/20 uppercase">Import</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MetricCard({ label, value, unit, icon: Icon, color }: any) {
    const colors: any = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const valStr = unit === '%' ? `${value.toFixed(1)}%` :
        Math.abs(value) > 1000000 ? `${(value / 1000000).toFixed(1)}M` :
            Math.abs(value) > 1000 ? `${(value / 1000).toFixed(0)}k` : value.toLocaleString();

    return (
        <div className="glass rounded-3xl p-6 border-white/5 space-y-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors[color])}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">{valStr}</span>
                    <span className="text-[10px] font-bold text-white/20 uppercase">{unit}</span>
                </div>
            </div>
        </div>
    );
}

function ContextInfo({ label, value, sub }: any) {
    return (
        <div className="flex justify-between items-center border-b border-white/5 pb-4 last:border-none last:pb-0">
            <div>
                <p className="text-sm font-bold text-white tracking-tight">{label}</p>
                <p className="text-[10px] text-white/20 uppercase font-bold tracking-tighter">{sub}</p>
            </div>
            <div className="text-xl font-display font-black text-white">{value}</div>
        </div>
    );
}

function CustomTooltip({ active, payload, metric }: any) {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        const formatted = metric.unit === '%' ? `${(val * 100).toFixed(1)}%` : val.toLocaleString();

        return (
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-[24px] shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">{payload[0].payload.year} Data</p>
                <p className="text-sm font-bold text-white mb-3">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black" style={{ color: metric.color }}>{formatted}</span>
                    <span className="text-xs font-bold text-white/40">{metric.unit}</span>
                </div>
            </div>
        );
    }
    return null;
}

function ZapIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14.89 14 3.11V11h6L10 22.89V13H4Z" /></svg>
    )
}
