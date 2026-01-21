"use client"

import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { cn } from '@/lib/utils';
import { isWebGLAvailable } from '@/lib/gpu-utils';

// Neo4j-inspired stylesheet with better visual hierarchy
const stylesheet: any[] = [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'background-color': 'data(color)',
            'color': '#fff',
            'font-size': '14px',
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-outline-color': '#000',
            'text-outline-width': 2,
            'width': 'mapData(production, 0, 1000, 40, 100)',
            'height': 'mapData(production, 0, 1000, 40, 100)',
            'border-width': 3,
            'border-color': '#064e3b',
            'overlay-padding': '8px',
            'z-index': 10,
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'min-zoomed-font-size': 8 // Performance: Don't render text when small
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 'mapData(quantity, 0, 1000000, 2, 12)',
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7,
            'arrow-scale': 1.5
        }
    },
    {
        selector: 'node:selected',
        style: {
            'background-color': '#f59e0b',
            'border-color': '#78350f',
            'border-width': 5
        }
    },
    {
        selector: 'edge:selected',
        style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'opacity': 1
        }
    },
    {
        selector: 'node:active',
        style: {
            'overlay-opacity': 0.2,
            'overlay-color': '#10b981'
        }
    }
];

interface GraphProps {
    data: {
        nodes: any[];
        edges: any[];
    };
    className?: string;
}

export default function GraphVisualization({ data, className }: GraphProps) {
    const [elements, setElements] = useState<any[]>([]);
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [layoutName, setLayoutName] = useState<string>('cose');
    const cyRef = useRef<cytoscape.Core | null>(null);
    const previousNodesRef = useRef<Set<string>>(new Set());

    // Register fcose extension
    useEffect(() => {
        let mounted = true;
        try {
            if (typeof window !== 'undefined') {
                import('cytoscape-fcose').then((fcose) => {
                    if (mounted) {
                        try {
                            cytoscape.use(fcose.default);
                            setLayoutName('fcose');
                        } catch (e) {
                            console.warn("Already registered or error", e);
                            setLayoutName('fcose'); // Try setting it anyway if it's just a double-register warning
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to register fcose extension:', error);
        }
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const nodes = data.nodes.map(n => ({
            data: { ...n, id: n.id, label: n.label }
        }));

        const edges = data.edges.map(e => ({
            data: { ...e, source: e.source, target: e.target }
        }));

        setElements([...nodes, ...edges]);

        // Track which nodes are new
        const currentNodeIds = new Set(nodes.map(n => n.data.id));
        const newNodes = Array.from(currentNodeIds).filter(id => !previousNodesRef.current.has(id));

        // If we have new nodes and an existing graph, run incremental layout
        if (cyRef.current && newNodes.length > 0 && previousNodesRef.current.size > 0) {
            setTimeout(() => {
                if (cyRef.current) {
                    // Optimized layout run for incremental updates
                    const layout = cyRef.current.layout({
                        name: layoutName, // Use currently active layout
                        animate: true,
                        animationDuration: 800,
                        animationEasing: 'ease-out',
                        fit: false, // Don't refit on incremental update
                        padding: 50,
                        randomize: false,
                        nodeRepulsion: 4500,
                        idealEdgeLength: 100,
                        edgeElasticity: 0.45,
                        nestingFactor: 0.1,
                        gravity: 0.25,
                        numIter: 2500,
                        tile: true,
                        tilingPaddingVertical: 10,
                        tilingPaddingHorizontal: 10,
                        gravityRangeCompound: 1.5,
                        gravityCompound: 1.0,
                        gravityRange: 3.8,
                        initialEnergyOnIncremental: 0.3
                    } as any);
                    layout.run();
                }
            }, 100);
        }

        previousNodesRef.current = currentNodeIds;
    }, [data, layoutName]);

    // Determine performance mode based on graph size
    const isLargeGraph = elements.length > 500;
    const isVeryLargeGraph = elements.length > 1500;

    // Optimized Layout Configuration
    const layout = {
        name: layoutName,
        quality: isVeryLargeGraph ? 'proof' : 'default',
        randomize: true,
        animate: !isVeryLargeGraph, // Disable animation for very large graphs
        animationDuration: 1000,
        animationEasing: 'ease-out',
        fit: true,
        padding: 50,
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        step: "all",

        // Physics parameters (tuned for stability and speed)
        samplingType: true,
        sampleSize: 25,
        nodeSeparation: 75,
        piTol: 0.0000002,
        nodeRepulsion: (node: any) => 4500,
        idealEdgeLength: (edge: any) => 100,
        edgeElasticity: (edge: any) => 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        tile: true,
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10,
        gravityRangeCompound: 1.5,
        gravityCompound: 1.0,
        gravityRange: 3.8,
        initialEnergyOnIncremental: 0.3
    };

    const formatValue = (val: number) => {
        if (Math.abs(val) > 1000000) return `${(val / 1000000).toFixed(2)}M`;
        if (Math.abs(val) > 1000) return `${(val / 1000).toFixed(1)}k`;
        return val.toLocaleString();
    };

    return (
        <div className={cn("relative w-full h-full glass rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/5", className)}>
            <CytoscapeComponent
                elements={elements}
                style={{ width: '100%', height: '100%' }}
                stylesheet={stylesheet}
                layout={layout}
                // Optimized configuration
                minZoom={0.2}
                maxZoom={3}
                wheelSensitivity={0.3}
                pixelRatio={isVeryLargeGraph ? 1 : 'auto'} // Reduce pixel ratio for very large graphs
                // @ts-ignore - renderer is a valid cytoscape option but might be missing from react-cytoscapejs types
                renderer={isWebGLAvailable() ? {
                    name: 'webgl',
                    // Optimization flags for WebGL renderer if supported
                    textureOnViewport: isLargeGraph,
                    motionBlur: false
                } : {
                    name: 'canvas',
                    // Optimization flags for Canvas renderer
                    hideEdgesOnViewport: isLargeGraph,
                    textureOnViewport: isLargeGraph,
                    pixelRatio: isVeryLargeGraph ? 1 : 'auto',
                    motionBlur: false
                }}
                cy={(cy) => {
                    cyRef.current = cy;

                    // Enable panning and zooming like Neo4j
                    cy.userPanningEnabled(true);
                    cy.userZoomingEnabled(true);
                    cy.boxSelectionEnabled(true);

                    // Performance: Hide things while manipulating
                    if (isLargeGraph) {
                        // @ts-ignore
                        cy.on('viewport', () => {
                            // Optional: logic to simplify view during pan/zoom if really needed
                        });
                    }

                    // Node interaction handlers
                    cy.on('tap', 'node', (evt) => {
                        const node = evt.target;
                        console.log('Tapped node', node.data());

                        // Highlight connected edges
                        cy.elements().removeClass('highlighted');
                        node.addClass('highlighted');
                        node.connectedEdges().addClass('highlighted');

                        // Set selected element for info panel
                        setSelectedElement({
                            type: 'node',
                            data: node.data()
                        });
                    });

                    // Edge interaction handlers
                    cy.on('tap', 'edge', (evt) => {
                        const edge = evt.target;
                        console.log('Tapped edge', edge.data());

                        // Highlight the edge
                        cy.elements().removeClass('highlighted');
                        edge.addClass('highlighted');

                        // Set selected element for info panel
                        setSelectedElement({
                            type: 'edge',
                            data: edge.data()
                        });
                    });

                    // Background tap to deselect
                    cy.on('tap', (evt) => {
                        if (evt.target === cy) {
                            cy.elements().removeClass('highlighted');
                            setSelectedElement(null);
                        }
                    });
                }}
                className="bg-black/40"
            />

            {/* Renderer Info Indicator */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <div className="px-3 py-1 rounded-full glass border border-white/10 text-[10px] font-mono text-white/50 pointer-events-none flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isWebGLAvailable() ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-orange-500")} />
                    {isWebGLAvailable() ? "GPU ACCELERATED" : "CPU RENDERER"}
                </div>
                {isLargeGraph && (
                    <div className="px-3 py-1 rounded-full glass border border-white/10 text-[10px] font-mono text-yellow-500/80 pointer-events-none flex items-center gap-2">
                        <span>⚡ HIGH PERF MODE</span>
                    </div>
                )}
            </div>

            {/* Neo4j-style Information Panel */}
            {selectedElement && (
                <div className="absolute top-6 left-6 w-80 glass rounded-2xl p-6 border border-white/10 animate-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-3 h-3 rounded-full",
                                selectedElement.type === 'node' ? "bg-emerald-500" : "bg-blue-500"
                            )} />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
                                {selectedElement.type === 'node' ? 'Area Node' : 'Trade Flow'}
                            </h3>
                        </div>
                        <button
                            onClick={() => setSelectedElement(null)}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {selectedElement.type === 'node' ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Name</p>
                                <p className="text-lg font-bold text-white">{selectedElement.data.label || selectedElement.data.id}</p>
                            </div>
                            {selectedElement.data.production !== undefined && (
                                <div>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Production</p>
                                    <p className="text-sm font-mono text-emerald-400">{formatValue(selectedElement.data.production)} Tons</p>
                                </div>
                            )}
                            {selectedElement.data.food_supply !== undefined && (
                                <div>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Food Supply</p>
                                    <p className="text-sm font-mono text-blue-400">{formatValue(selectedElement.data.food_supply)} kcal/cap/d</p>
                                </div>
                            )}
                            {selectedElement.data.net_trade !== undefined && (
                                <div>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Net Trade</p>
                                    <p className={cn(
                                        "text-sm font-mono",
                                        selectedElement.data.net_trade >= 0 ? "text-emerald-400" : "text-red-400"
                                    )}>
                                        {selectedElement.data.net_trade >= 0 ? '+' : ''}{formatValue(selectedElement.data.net_trade)} Tons
                                    </p>
                                </div>
                            )}
                            {selectedElement.data.import_dependency !== undefined && (
                                <div>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Import Dependency</p>
                                    <p className="text-sm font-mono text-orange-400">{(selectedElement.data.import_dependency * 100).toFixed(1)}%</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">From</p>
                                <p className="text-sm font-bold text-white">{selectedElement.data.source}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">To</p>
                                <p className="text-sm font-bold text-white">{selectedElement.data.target}</p>
                            </div>
                            {selectedElement.data.commodity && (
                                <div>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Commodity</p>
                                    <p className="text-sm font-bold text-emerald-400">{selectedElement.data.commodity}</p>
                                </div>
                            )}
                            {selectedElement.data.quantity !== undefined && (
                                <div>
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Quantity</p>
                                    <p className="text-sm font-mono text-blue-400">{formatValue(selectedElement.data.quantity)} Tons</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Legend & Controls Overlay */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 p-4 glass rounded-xl pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-white/70 font-medium">Areas (Size = Production)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-white/70 font-medium">Trade Flows (Width = Volume)</span>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
                <button
                    onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
                    className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white font-bold text-lg"
                >
                    +
                </button>
                <button
                    onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
                    className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white font-bold text-lg"
                >
                    −
                </button>
                <button
                    onClick={() => cyRef.current?.fit(undefined, 50)}
                    className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white text-xs font-bold"
                >
                    ⊡
                </button>
            </div>
        </div>
    );
}
