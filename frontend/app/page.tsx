"use client"

import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import GraphVisualization from "@/components/GraphVisualization";
import { getCountries, getGraphSnapshot, getGlobalStats } from "@/lib/api";
import { motion } from "framer-motion";
import { TrendingUp, Globe, Box, Users, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OverviewPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
  const [fullGraphData, setFullGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2021);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['India']);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [graph, globalStats, countryList] = await Promise.all([
          getGraphSnapshot(selectedYear),
          getGlobalStats(),
          getCountries()
        ]);
        setFullGraphData(graph);
        setStats(globalStats);
        setCountries(countryList);
      } catch (error) {
        console.error("Error fetching dynamic data, using demo data", error);
        // Fallback for demo if backend isn't running
        const demoGraph = {
          nodes: [
            { id: 'USA', label: 'USA', production: 800 },
            { id: 'CHN', label: 'China', production: 950 },
            { id: 'IND', label: 'India', production: 700 },
            { id: 'BRA', label: 'Brazil', production: 600 },
            { id: 'EGY', label: 'Egypt', production: 200 },
          ],
          edges: [
            { source: 'USA', target: 'CHN', commodity: 'Soybeans', quantity: 500000 },
            { source: 'BRA', target: 'CHN', commodity: 'Soybeans', quantity: 700000 },
            { source: 'USA', target: 'EGY', commodity: 'Wheat', quantity: 300000 },
            { source: 'IND', target: 'EGY', commodity: 'Rice', quantity: 200000 },
          ]
        };
        setFullGraphData(demoGraph);
        setStats({
          country_count: 210,
          total_production: 2845000,
          avg_food_supply: 2850,
        });
        setCountries(['USA', 'China', 'India', 'Brazil', 'Egypt']);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedYear]);

  // Filter graph data based on selected countries
  useEffect(() => {
    if (selectedCountries.length === 0) {
      setGraphData({ nodes: [], edges: [] });
      return;
    }

    const filteredNodes = fullGraphData.nodes.filter(node =>
      selectedCountries.includes(node.label) || selectedCountries.includes(node.id)
    );

    const selectedIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = fullGraphData.edges.filter(edge =>
      selectedIds.has(edge.source) && selectedIds.has(edge.target)
    );

    setGraphData({ nodes: filteredNodes, edges: filteredEdges });
  }, [selectedCountries, fullGraphData]);

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const filteredCountries = countries.filter(c =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-mesh selection:bg-emerald-500/30">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-6"
          >
            <TrendingUp className="w-3 h-3" />
            Live Digital Twin
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6"
          >
            Global Food <br />
            <span className="text-emerald-500">Temporal Graph</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl text-lg text-white/60 leading-relaxed font-medium mb-8"
          >
            Visualize and simulate the resilience of the global food trade network using state-of-the-art
            Temporal Graph Neural Networks and real-world FAOSTAT data.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Globe}
              label="Total Countries"
              value={stats?.country_count || "..."}
              color="emerald"
              delay={0.3}
            />
            <StatCard
              icon={Box}
              label="Global Production"
              value={stats ? `${(stats.total_production / 1000000).toFixed(1)}M Tons` : "..."}
              color="blue"
              delay={0.4}
            />
            <StatCard
              icon={Users}
              label="Selected Countries"
              value={selectedCountries.length}
              color="purple"
              delay={0.5}
            />
            <StatCard
              icon={Filter}
              label="Active Nodes"
              value={graphData.nodes.length}
              color="orange"
              delay={0.6}
            />
          </div>
        </div>

        {/* Graph Visualization Section - Full Width */}
        <div className="mt-12 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Network Visualization</h2>
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
              {[2018, 2019, 2020, 2021].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
                    selectedYear === year ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-white/60 hover:text-white"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Country Selection Panel */}
            <div className="lg:col-span-1">
              <div className="glass rounded-3xl border-white/5 p-6 sticky top-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Filter className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-display font-bold">Filter Countries</h3>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedCountries(countries)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedCountries(countries.slice(0, 10))}
                    className="flex-1 px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Top 10
                  </button>
                  <button
                    onClick={() => setSelectedCountries([])}
                    className="flex-1 px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Country Checkboxes */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCountries.map((country) => (
                    <label
                      key={country}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(country)}
                        onChange={() => toggleCountry(country)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                        {country}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-white/40">
                    {selectedCountries.length} of {countries.length} countries selected
                  </p>
                </div>
              </div>
            </div>

            {/* Graph Visualization - Full Width */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 h-[700px]"
            >
              {graphData.nodes.length > 0 ? (
                <GraphVisualization data={graphData} />
              ) : (
                <div className="w-full h-full glass rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <Filter className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-xl font-bold text-white/40 mb-2">No Countries Selected</p>
                    <p className="text-sm text-white/30">Select countries from the panel to visualize the trade network</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20">
          <h2 className="text-2xl font-display font-bold mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Graph Connectivity"
              desc="Analysis of node centrality and betweenness in the 2021 snapshot."
            />
            <FeatureCard
              title="Trade Resilience"
              desc="Impact assessment of simulated shocks on wheat and maize routes."
            />
            <FeatureCard
              title="Vulnerability Index"
              desc="Real-time calculation of country-level food security risks."
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
