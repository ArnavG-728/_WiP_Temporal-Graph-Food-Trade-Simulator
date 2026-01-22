"use client"

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import { getSimulationOptions, runSimulation } from "@/lib/api";
import { motion } from "framer-motion";
import { FlaskConical, Play, RefreshCcw, AlertTriangle, TrendingDown, ArrowRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationOptions {
    countries: string[];
    commodities: string[];
}

interface CascadeEffect {
    type: string;
    flow: string;
    change: string;
    reason: string;
}

interface SimulationResult {
    intervention: {
        exporter: string;
        importer: string;
        commodity: string;
        year: number;
        pct_change: number;
        before_vol: number;
        after_vol: number;
        delta: number;
    };
    cascades: CascadeEffect[];
}

export default function SimulatorPage() {
    const [options, setOptions] = useState<SimulationOptions>({ countries: [], commodities: [] });
    const [loading, setLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);

    // Simulation parameters
    const [year, setYear] = useState(2021);
    const [exporter, setExporter] = useState("");
    const [importer, setImporter] = useState("");
    const [commodity, setCommodity] = useState("");
    const [pctChange, setPctChange] = useState(-100);

    useEffect(() => {
        async function init() {
            try {
                const opts = await getSimulationOptions();
                setOptions(opts);
                // Set defaults
                if (opts.countries.length > 0) {
                    setExporter(opts.countries.find((c: string) => c.includes("Armenia")) || opts.countries[0]);
                    setImporter(opts.countries.find((c: string) => c.includes("Iraq")) || opts.countries[1]);
                }
                if (opts.commodities.length > 0) {
                    setCommodity(opts.commodities[0]);
                }
            } catch (error) {
                console.error("Error loading options:", error);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setResult(null);
        try {
            const res = await runSimulation({
                year,
                exporter,
                importer,
                commodity,
                pct_change: pctChange / 100 // Convert percentage to decimal
            });
            setResult(res);
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setIsSimulating(false);
        }
    };

    const resetSimulation = () => {
        setResult(null);
        setPctChange(-100);
    };

    return (
        <div className="min-h-screen bg-mesh selection:bg-orange-500/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                {/* Hero Section */}
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase mb-6"
                    >
                        <FlaskConical className="w-3 h-3" />
                        TGNN-Powered Simulation
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6"
                    >
                        Trade Disruption
                        <br />
                        <span className="text-orange-500">Simulator</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-3xl text-lg text-white/60 leading-relaxed font-medium mb-8"
                    >
                        Simulate trade disruptions and observe cascading effects predicted by our Temporal Graph Neural Network.
                        See how the global food trade network adapts when relationships change.
                    </motion.p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass rounded-3xl border-white/5 p-8">
                            <h2 className="text-xl font-display font-bold mb-6">Simulation Controls</h2>

                            <div className="space-y-6">
                                {/* Year */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                                        Year
                                    </label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        className="w-full p-4 glass rounded-2xl border-white/10 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-bold"
                                    />
                                </div>

                                {/* Exporter */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                                        Exporter
                                    </label>
                                    <select
                                        value={exporter}
                                        onChange={(e) => setExporter(e.target.value)}
                                        className="w-full p-4 glass rounded-2xl border-white/10 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none font-bold"
                                    >
                                        {options.countries.map(c => (
                                            <option key={c} value={c} className="bg-zinc-900">
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Importer */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                                        Importer
                                    </label>
                                    <select
                                        value={importer}
                                        onChange={(e) => setImporter(e.target.value)}
                                        className="w-full p-4 glass rounded-2xl border-white/10 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none font-bold"
                                    >
                                        {options.countries.map(c => (
                                            <option key={c} value={c} className="bg-zinc-900">
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Commodity */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                                        Commodity
                                    </label>
                                    <select
                                        value={commodity}
                                        onChange={(e) => setCommodity(e.target.value)}
                                        className="w-full p-4 glass rounded-2xl border-white/10 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none font-bold"
                                    >
                                        {options.commodities.map(c => (
                                            <option key={c} value={c} className="bg-zinc-900">
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Percentage Change */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                                            Change
                                        </label>
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-xs font-bold",
                                            pctChange > 0 ? "bg-emerald-500/20 text-emerald-400" :
                                                pctChange < 0 ? "bg-red-500/20 text-red-400" :
                                                    "bg-white/10 text-white/60"
                                        )}>
                                            {pctChange > 0 ? '+' : ''}{pctChange}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-100}
                                        max={100}
                                        step={10}
                                        value={pctChange}
                                        onChange={(e) => setPctChange(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    <p className="text-xs text-white/40">
                                        {pctChange < 0 ? 'Decrease' : pctChange > 0 ? 'Increase' : 'No change'} in trade flow
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={handleRunSimulation}
                                        disabled={isSimulating || !exporter || !importer || !commodity}
                                        className="w-full py-4 rounded-2xl bg-orange-500 text-black font-bold flex items-center justify-center gap-2 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-orange-500/20"
                                    >
                                        {isSimulating ? (
                                            <RefreshCcw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Play className="w-5 h-5" />
                                        )}
                                        {isSimulating ? "Running..." : "Run Simulation"}
                                    </button>

                                    <button
                                        onClick={resetSimulation}
                                        className="w-full py-3 rounded-2xl bg-white/5 text-white/70 font-bold hover:bg-white/10 transition-all"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Info Panel */}
                        <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-orange-300 mb-1">Simulation Notice</p>
                                <p className="text-[10px] text-orange-200/80 leading-relaxed font-medium">
                                    Results are predicted by our Temporal Graph Neural Network trained on historical FAOSTAT data.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-2">
                        {result ? (
                            <div className="space-y-6">
                                {/* Intervention Summary */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass rounded-3xl border-white/5 p-8"
                                >
                                    <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                                        <TrendingDown className="w-6 h-6 text-orange-500" />
                                        Intervention
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-lg">
                                            <span className="font-bold">{result.intervention.commodity}</span>
                                            <span className="text-white/40">from</span>
                                            <span className="font-bold text-orange-400">{result.intervention.exporter}</span>
                                            <ArrowRight className="w-4 h-4 text-white/40" />
                                            <span className="font-bold text-orange-400">{result.intervention.importer}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 pt-4">
                                            <div className="p-4 bg-white/5 rounded-xl">
                                                <p className="text-xs text-white/40 mb-1">Before</p>
                                                <p className="text-2xl font-bold">{result.intervention.before_vol.toLocaleString()}</p>
                                                <p className="text-xs text-white/40">tons</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl">
                                                <p className="text-xs text-white/40 mb-1">After</p>
                                                <p className="text-2xl font-bold">{result.intervention.after_vol.toLocaleString()}</p>
                                                <p className="text-xs text-white/40">tons</p>
                                            </div>
                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <p className="text-xs text-red-300 mb-1">Delta</p>
                                                <p className="text-2xl font-bold text-red-400">{result.intervention.delta.toLocaleString()}</p>
                                                <p className="text-xs text-red-300">tons</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Cascade Effects */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass rounded-3xl border-white/5 p-8"
                                >
                                    <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                                        <Package className="w-6 h-6 text-emerald-500" />
                                        Cascade Effects
                                        <span className="ml-auto text-sm font-normal text-white/40">
                                            {result.cascades.length} compensating flows
                                        </span>
                                    </h2>

                                    {result.cascades.length > 0 ? (
                                        <div className="space-y-3">
                                            {result.cascades.map((cascade, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 + idx * 0.05 }}
                                                    className={cn(
                                                        "p-4 rounded-xl border",
                                                        cascade.type === "COMPENSATION"
                                                            ? "bg-emerald-500/5 border-emerald-500/20"
                                                            : "bg-red-500/5 border-red-500/20"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="font-bold text-white mb-1">{cascade.flow}</p>
                                                            <p className="text-xs text-white/50">{cascade.reason}</p>
                                                        </div>
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap",
                                                            cascade.type === "COMPENSATION"
                                                                ? "bg-emerald-500/20 text-emerald-400"
                                                                : "bg-red-500/20 text-red-400"
                                                        )}>
                                                            {cascade.change}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                            <p className="text-white/40">No significant cascade effects predicted</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        ) : (
                            <div className="glass rounded-3xl border-white/5 p-12 h-full flex items-center justify-center">
                                <div className="text-center max-w-md">
                                    <FlaskConical className="w-16 h-16 text-white/20 mx-auto mb-4" />
                                    <p className="text-xl font-bold text-white/40 mb-2">Ready to Simulate</p>
                                    <p className="text-sm text-white/30">
                                        Configure your scenario on the left and click "Run Simulation" to see predicted cascade effects.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
