"use client"

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Terminal, ShieldAlert, Star, Navigation, Zap, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
    const [activeTab, setActiveTab] = useState('vulnerability');

    const vulnerabilityData = [
        { area: 'Egypt', score: 0.82, status: 'Critical', trend: '+4%' },
        { area: 'China', score: 0.45, status: 'Moderate', trend: '-2%' },
        { area: 'India', score: 0.38, status: 'Stable', trend: '+1%' },
        { area: 'Brazil', score: 0.21, status: 'Safe', trend: '-5%' },
        { area: 'USA', score: 0.18, status: 'Resilient', trend: '0%' },
    ];

    const criticalRoutes = [
        { from: 'Brazil', to: 'China', commodity: 'Soybeans', importance: 0.95 },
        { from: 'USA', to: 'Japan', commodity: 'Maize', importance: 0.88 },
        { from: 'Ukraine', to: 'Egypt', commodity: 'Wheat', importance: 0.82 },
        { from: 'India', to: 'UAE', commodity: 'Rice', importance: 0.74 },
    ];

    return (
        <div className="min-h-screen bg-mesh">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <header className="mb-12 space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <Terminal className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Resilience Analytics</span>
                    </div>
                    <h1 className="text-5xl font-display font-bold">Network <span className="text-emerald-500">Insights</span></h1>
                    <p className="text-white/40 max-w-2xl font-medium">
                        Automated intelligence identifying critical vulnerabilities and stability patterns across the global trade network using graph-theoretic centrality.
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-white/5 mb-10">
                    <TabButton
                        active={activeTab === 'vulnerability'}
                        onClick={() => setActiveTab('vulnerability')}
                        label="Vulnerability Rankings"
                        icon={ShieldAlert}
                    />
                    <TabButton
                        active={activeTab === 'routes'}
                        onClick={() => setActiveTab('routes')}
                        label="Critical Routes"
                        icon={Navigation}
                    />
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === 'vulnerability' ? (
                            <div className="glass rounded-[32px] border-white/5 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/5">
                                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/30">Area</th>
                                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/30">Vulnerability Score</th>
                                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/30">Risk Status</th>
                                            <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/30">YoY Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vulnerabilityData.map((row, i) => (
                                            <motion.tr
                                                key={row.area}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="border-b last:border-none border-white/5 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-8 py-6 font-display font-bold text-lg">{row.area}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden min-w-[100px]">
                                                            <div className="h-full bg-emerald-500" style={{ width: `${row.score * 100}%` }} />
                                                        </div>
                                                        <span className="font-mono font-bold text-sm text-emerald-400">{(row.score * 10).toFixed(1)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                                        row.status === 'Critical' ? "bg-red-500/20 text-red-400" :
                                                            row.status === 'Moderate' ? "bg-orange-500/20 text-orange-400" :
                                                                "bg-emerald-500/20 text-emerald-400"
                                                    )}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className={cn(
                                                    "px-8 py-6 font-bold text-sm",
                                                    row.trend.startsWith('+') ? "text-red-400" : "text-emerald-400"
                                                )}>{row.trend}</td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {criticalRoutes.map((route, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-8 glass rounded-[32px] border-white/5 space-y-6 relative group overflow-hidden"
                                    >
                                        <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                            <Star className="w-40 h-40 text-emerald-500" />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                                High Priority
                                            </div>
                                            <span className="text-white/20 font-bold text-xs italic">Route ID: #{Math.floor(Math.random() * 9000) + 1000}</span>
                                        </div>

                                        <div className="flex items-center gap-4 justify-between font-display font-bold text-2xl">
                                            <span>{route.from}</span>
                                            <div className="flex-1 border-t-2 border-dashed border-white/10 relative">
                                                <Navigation className="w-4 h-4 text-emerald-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                                            </div>
                                            <span>{route.to}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-white/40 font-medium text-sm">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-orange-400" />
                                                {route.commodity}
                                            </div>
                                            <div className="font-bold text-white">{(route.importance * 100).toFixed(0)}% Stability</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="space-y-6">
                        <div className="p-8 glass rounded-[32px] border-white/5 space-y-6">
                            <h3 className="text-lg font-display font-bold flex items-center gap-2">
                                <Filter className="w-4 h-4 text-emerald-500" />
                                Global Alert Log
                            </h3>
                            <div className="space-y-4">
                                <LogEntry date="JAN 12" title="Price Spike" desc="Ukraine wheat prices increased by 14%." risk="high" />
                                <LogEntry date="JAN 08" title="Supply Delay" desc="Logistics blockage in Panama Canal." risk="med" />
                                <LogEntry date="JAN 02" title="Belt Initiative" desc="China-Africa rice route stabilized." risk="low" />
                            </div>
                        </div>

                        <div className="p-8 bg-emerald-500 rounded-[32px] text-black">
                            <h3 className="text-xl font-display font-black mb-2 uppercase tracking-tight">AI Confidence</h3>
                            <p className="text-sm font-bold opacity-70 mb-6">Current predictive models show 94.2% accuracy on short-term trade disruptions.</p>
                            <div className="text-5xl font-display font-black">94.2%</div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-8 py-5 border-b-2 transition-all flex items-center gap-3 font-display font-bold text-lg",
                active ? "border-emerald-500 text-white" : "border-transparent text-white/30 hover:text-white/60"
            )}
        >
            <Icon className={cn("w-5 h-5", active ? "text-emerald-500" : "text-white/30")} />
            {label}
        </button>
    );
}

function LogEntry({ date, title, desc, risk }: any) {
    const riskColors: any = {
        high: "bg-red-500",
        med: "bg-orange-500",
        low: "bg-emerald-500"
    };

    return (
        <div className="flex gap-4">
            <div className="shrink-0 text-[10px] font-black text-white/20 pt-1 tracking-tighter">{date}</div>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", riskColors[risk])} />
                    <div className="text-sm font-bold">{title}</div>
                </div>
                <p className="text-xs text-white/40 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
