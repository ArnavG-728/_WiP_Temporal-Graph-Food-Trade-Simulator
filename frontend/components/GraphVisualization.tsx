"use client"

import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { cn } from '@/lib/utils';

// Neo4j-inspired stylesheet with better visual hierarchy
const stylesheet: any[] = [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'background-color': '#10b981',
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
            'text-max-width': '120px'
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 'mapData(quantity, 0, 1000000, 2, 12)',
            'line-color': '#3b82f6',
            'target-arrow-color': '#3b82f6',
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
    const cyRef = useRef<cytoscape.Core | null>(null);
    const previousNodesRef = useRef<Set<string>>(new Set());

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
                    // Run layout only on new nodes to prevent overlap
                    const layout = cyRef.current.layout({
                        name: 'cose',
                        animate: true,
                        animationDuration: 1000,
                        animationEasing: 'ease-out',
                        fit: true,
                        padding: 50,
                        randomize: false,
                        nodeRepulsion: 8000000,
                        idealEdgeLength: 150,
                        edgeElasticity: 200,
                        nestingFactor: 1.2,
                        gravity: 1,
                        numIter: 1000,
                        initialTemp: 1000,
                        coolingFactor: 0.99,
                        minTemp: 1.0
                    });
                    layout.run();
                }
            }, 100);
        }

        previousNodesRef.current = currentNodeIds;
    }, [data]);

    // Neo4j-like layout configuration with better physics
    const layout = {
        name: 'cose',
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out',
        fit: true,
        padding: 50,
        randomize: true,
        componentSpacing: 150,
        nodeRepulsion: 8000000,
        idealEdgeLength: 150,
        edgeElasticity: 200,
        nestingFactor: 1.2,
        gravity: 1,
        numIter: 1000,
        initialTemp: 1000,
        coolingFactor: 0.99,
        minTemp: 1.0,
        nodeOverlap: 40
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
                cy={(cy) => {
                    cyRef.current = cy;

                    // Enable panning and zooming like Neo4j
                    cy.userPanningEnabled(true);
                    cy.userZoomingEnabled(true);
                    cy.boxSelectionEnabled(true);

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
