"use client"

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import GraphVisualization from "@/components/GraphVisualization";
import { getGraphSnapshot, getAreas, runSimulation } from "@/lib/api";
import { motion } from "framer-motion";
import { FlaskConical, Play, RefreshCcw, AlertTriangle, TrendingUp, Zap, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SimulatorPage() {
    const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
    const [originalGraphData, setOriginalGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
    const [areas, setAreas] = useState<string[]>([]);
    const [selectedArea, setSelectedArea] = useState("India");
    const [loading, setLoading] = useState(true);

    // Simulation params
    const [prodChange, setProdChange] = useState(0);
    const [importDep, setImportDep] = useState(0);
    const [climateStress, setClimateStress] = useState(0.5);
    const [commodity, setCommodity] = useState("Total");
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                const areaList = await getAreas();
                setAreas(areaList);
                const snapshot = await getGraphSnapshot(2021);
                const snapshotWithColors = {
                    ...snapshot,
                    nodes: snapshot.nodes.map((n: any) => ({ ...n, color: '#10b981' })),
                    edges: snapshot.edges.map((e: any) => ({ ...e, color: '#3b82f6' }))
                };
                setGraphData(snapshotWithColors);
                setOriginalGraphData(snapshotWithColors);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        try {
            const results = await runSimulation({
                area: selectedArea,
                year: 2021,
                commodity: commodity,
                production_change: prodChange,
                import_change: importDep,
                climate_stress: climateStress
            });

            // Map the results to include visual markers for affected nodes
            const processedNodes = results.nodes.map((n: any) => {
                let color = '#10b981'; // Default
                if (n.id === selectedArea) {
                    color = '#f59e0b'; // Target node (Orange)
                } else if (n.is_affected) {
                    color = n.impact_severity === 'high' ? '#ef4444' : '#fbbf24'; // Red for high, Amber for medium
                }
                return { ...n, color };
            });

            setGraphData({
                nodes: processedNodes,
                edges: results.edges.map((e: any) => ({
                    ...e,
                    // If source is target, style the edge specially
                    color: e.source === selectedArea ? '#f59e0b' : '#3b82f6'
                }))
            });
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setIsSimulating(false);
        }
    };

    const resetSimulation = () => {
        setGraphData(originalGraphData);
        setProdChange(0);
        setImportDep(0);
        setClimateStress(0.5);
        setCommodity("Total");
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
                        Digital Twin Simulator
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6"
                    >
                        Network <br />
                        <span className="text-orange-500">Simulation</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-3xl text-lg text-white/60 leading-relaxed font-medium mb-8"
                    >
                        Run scenario-based simulations to test the resilience of the global food trade network.
                        Adjust production, climate stress, and import dependencies to see real-time impacts.
                    </motion.p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            icon={Target}
                            label="Target Area"
                            value={selectedArea}
                            color="orange"
                            delay={0.3}
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Production Change"
                            value={`${prodChange > 0 ? '+' : ''}${prodChange}%`}
                            color="emerald"
                            delay={0.4}
                        />
                        <StatCard
                            icon={Zap}
                            label="Climate Stress"
                            value={`${(climateStress * 100).toFixed(0)}%`}
                            color="blue"
                            delay={0.5}
                        />
                        <StatCard
                            icon={Activity}
                            label="Simulation Status"
                            value={isSimulating ? "Running" : "Ready"}
                            color="purple"
                            delay={0.6}
                        />
                    </div>
                </div>

                {/* Graph Visualization Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-display font-bold">Network Visualization</h2>
                        <div className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold border",
                            isSimulating
                                ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                            {isSimulating ? "Processing Simulation..." : "Ready for Simulation"}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="h-[600px]"
                    >
                        {graphData.nodes.length > 0 ? (
                            <GraphVisualization data={graphData} />
                        ) : (
                            <div className="w-full h-full glass rounded-3xl flex items-center justify-center">
                                <div className="text-center">
                                    <FlaskConical className="w-16 h-16 text-white/20 mx-auto mb-4" />
                                    <p className="text-xl font-bold text-white/40 mb-2">Loading Network Data</p>
                                    <p className="text-sm text-white/30">Preparing simulation environment...</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Simulation Controls Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-display font-bold mb-6">Simulation Controls</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Parameter Controls */}
                        <div className="lg:col-span-2">
                            <div className="glass rounded-3xl border-white/5 p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Target Area Selection */}
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                                            Select Target Area
                                        </label>
                                        <select
                                            value={selectedArea}
                                            onChange={(e) => setSelectedArea(e.target.value)}
                                            className="w-full p-4 glass rounded-2xl border-white/10 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none font-bold"
                                        >
                                            {areas.map(c => (
                                                <option key={c} value={c} className="bg-zinc-900">
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Commodity selection */}
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                                            Commodity (e.g. Wheat, Maize, Total)
                                        </label>
                                        <input
                                            type="text"
                                            value={commodity}
                                            onChange={(e) => setCommodity(e.target.value)}
                                            placeholder="Enter commodity name..."
                                            className="w-full p-4 glass rounded-2xl border-white/10 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-bold"
                                        />
                                    </div>

                                    {/* Sliders */}
                                    <SimulationSlider
                                        label="Production Change"
                                        value={prodChange}
                                        onChange={setProdChange}
                                        min={-50}
                                        max={50}
                                        unit="%"
                                    />

                                    <SimulationSlider
                                        label="Import Dependency"
                                        value={importDep}
                                        onChange={setImportDep}
                                        min={0}
                                        max={100}
                                        unit="%"
                                    />

                                    <div className="md:col-span-2">
                                        <SimulationSlider
                                            label="Climate Stress Level"
                                            value={climateStress}
                                            onChange={setClimateStress}
                                            min={0}
                                            max={1}
                                            step={0.1}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Panel */}
                        <div className="space-y-6">
                            <div className="glass rounded-3xl border-white/5 p-8 space-y-4">
                                <h3 className="text-lg font-display font-bold mb-6">Actions</h3>

                                <button
                                    onClick={handleRunSimulation}
                                    disabled={isSimulating}
                                    className="w-full py-4 rounded-2xl bg-orange-500 text-black font-bold flex items-center justify-center gap-2 hover:bg-orange-400 disabled:opacity-50 transition-all shadow-xl shadow-orange-500/20"
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
                                    className="w-full py-4 rounded-2xl bg-white/5 text-white/70 font-bold hover:bg-white/10 transition-all"
                                >
                                    Reset Parameters
                                </button>
                            </div>

                            <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-orange-300 mb-1">Simulation Notice</p>
                                    <p className="text-[10px] text-orange-200/80 leading-relaxed font-medium">
                                        Results are derived from predictive temporal models and may deviate based on market volatility.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="mt-20">
                    <h2 className="text-2xl font-display font-bold mb-8">Simulation Capabilities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard
                            title="Shock Scenarios"
                            desc="Simulate production shocks, trade disruptions, and climate events to test network resilience."
                        />
                        <FeatureCard
                            title="Real-time Impact"
                            desc="Visualize immediate effects on trade flows, dependencies, and vulnerability scores."
                        />
                        <FeatureCard
                            title="Predictive Models"
                            desc="Powered by Temporal Graph Neural Networks trained on historical FAOSTAT data."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, delay }: any) {
    const colors: any = {
        emerald: "from-emerald-500/20 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5",
        blue: "from-blue-500/20 border-blue-500/20 text-blue-400 shadow-blue-500/5",
        purple: "from-purple-500/20 border-purple-500/20 text-purple-400 shadow-purple-500/5",
        orange: "from-orange-500/20 border-orange-500/20 text-orange-400 shadow-orange-500/5",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className={cn("p-6 glass rounded-2xl border-l-4 bg-gradient-to-br to-transparent", colors[color])}
        >
            <div className="flex items-center gap-4 mb-3">
                <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold opacity-70">{label}</span>
            </div>
            <div className="text-3xl font-display font-bold text-white">{value}</div>
        </motion.div>
    );
}

function FeatureCard({ title, desc }: any) {
    return (
        <div className="p-8 glass rounded-3xl hover:bg-white/[0.05] transition-colors border-white/5 text-left">
            <h3 className="text-lg font-display font-bold mb-3">{title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function SimulationSlider({ label, value, onChange, min, max, unit = "", step = 1 }: any) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-white/80">{label}</label>
                <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold",
                    value > 0 ? "bg-emerald-500/20 text-emerald-400" : value < 0 ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/60"
                )}>
                    {value > 0 ? '+' : ''}{value}{unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
        </div>
    );
}
