"use client"

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import GraphVisualization from "@/components/GraphVisualization";
import { getGraphSnapshot, getCountries } from "@/lib/api";
import { motion } from "framer-motion";
import { FlaskConical, Play, RefreshCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SimulatorPage() {
    const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
    const [countries, setCountries] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState("India");

    // Simulation params
    const [prodChange, setProdChange] = useState(0);
    const [importDep, setImportDep] = useState(0);
    const [climateStress, setClimateStress] = useState(0.5);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        async function init() {
            const countryList = await getCountries();
            setCountries(countryList);
            const snapshot = await getGraphSnapshot(2021);
            setGraphData(snapshot);
        }
        init();
    }, []);

    const handleRunSimulation = () => {
        setIsSimulating(true);
        // Simulate API delay
        setTimeout(() => {
            // In a real scenario, we'd call /simulation/run
            // For now, we manually "perturb" the state locally for visualization
            const updatedNodes = graphData.nodes.map((n: any) => {
                if (n.id === selectedCountry) {
                    return { ...n, production: n.production * (1 + prodChange / 100), color: '#f59e0b' };
                }
                return n;
            });
            setGraphData({ ...graphData, nodes: updatedNodes });
            setIsSimulating(false);
        }, 1500);
    };

    const resetSimulation = async () => {
        const snapshot = await getGraphSnapshot(2021);
        setGraphData(snapshot);
        setProdChange(0);
        setImportDep(0);
    };

    return (
        <div className="min-h-screen bg-mesh overflow-hidden">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 h-[calc(100vh-2rem)] pb-10 flex flex-col lg:flex-row gap-8">
                {/* Left Column: Controls */}
                <motion.aside
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-96 flex flex-col gap-6"
                >
                    <div className="p-8 glass rounded-[32px] border-white/10 flex flex-col h-full overflow-y-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                                <FlaskConical className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-display font-bold">Simulator Controls</h2>
                        </div>

                        <div className="space-y-8 flex-1">
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Select Target Entity</label>
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    className="w-full p-4 glass rounded-2xl border-white/5 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                                >
                                    {countries.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                                </select>
                            </div>

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

                            <SimulationSlider
                                label="Climate Stress Level"
                                value={climateStress}
                                onChange={setClimateStress}
                                min={0}
                                max={1}
                                step={0.1}
                            />

                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <button
                                    onClick={handleRunSimulation}
                                    disabled={isSimulating}
                                    className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20"
                                >
                                    {isSimulating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                    Run Digital Twin
                                </button>
                                <button
                                    onClick={resetSimulation}
                                    className="w-full py-4 rounded-2xl bg-white/5 text-white/70 font-bold hover:bg-white/10 transition-all"
                                >
                                    Reset Parameters
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                            <p className="text-[10px] text-orange-200/80 leading-relaxed font-medium capitalize">
                                Simulation metrics are derived from predictive temporal models. Results may deviate based on market volatility.
                            </p>
                        </div>
                    </div>
                </motion.aside>

                {/* Right Column: Visualization */}
                <motion.section
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 relative flex flex-col gap-6"
                >
                    <div className="absolute top-6 left-6 z-10 p-3 glass rounded-xl text-[10px] font-bold text-white/50 tracking-widest uppercase border-white/5">
                        Real-time Projection State: {isSimulating ? 'Processing...' : 'Ready'}
                    </div>
                    <GraphVisualization data={graphData} className="flex-1" />
                </motion.section>
            </main>
        </div>
    );
}

function SimulationSlider({ label, value, onChange, min, max, unit = "", step = 1 }: any) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-white/80">{label}</label>
                <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold",
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
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
        </div>
    );
}
