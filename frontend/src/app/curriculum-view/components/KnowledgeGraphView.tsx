'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES, type GraphNode, type GraphEdge } from '@/lib/mock/data'; // TODO(mock): no backend endpoint provides this data yet

const RELATION_COLORS: Record<GraphEdge['relation'], string> = {
  'builds-on': '#4f46e5',
  'cites': '#6e6e73',
  'contradicts': '#dc2626',
};

const MODULE_COLORS: Record<string, string> = {
  'mod-001': '#4f46e5',
  'mod-002': '#0d9488',
  'mod-003': '#dc2626',
  'mod-004': '#d97706',
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

export default function KnowledgeGraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0, moved: 0 });

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width || 800, height: rect.height || 500 });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Scale mock node coordinates to fit container ("world space", before pan/zoom)
  const scaleX = (x: number) => (x / 750) * dimensions.width;
  const scaleY = (y: number) => (y / 550) * dimensions.height;

  const zoomBy = (factor: number, center?: { x: number; y: number }) => {
    setView((v) => {
      const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.k * factor));
      const cx = center?.x ?? dimensions.width / 2;
      const cy = center?.y ?? dimensions.height / 2;
      const worldX = (cx - v.x) / v.k;
      const worldY = (cy - v.y) / v.k;
      return { k, x: cx - worldX * k, y: cy - worldY * k };
    });
  };

  const resetView = () => setView({ x: 0, y: 0, k: 1 });

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = 1 - e.deltaY * 0.001;
    zoomBy(factor, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsPanning(true);
    panRef.current = { startX: e.clientX, startY: e.clientY, originX: view.x, originY: view.y, moved: 0 };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    panRef.current.moved = Math.hypot(dx, dy);
    setView((v) => ({ ...v, x: panRef.current.originX + dx, y: panRef.current.originY + dy }));
  };

  const handlePointerUp = () => {
    if (isPanning && panRef.current.moved < 4) {
      setSelectedNode(null); // treat as a click on empty canvas
    }
    setIsPanning(false);
  };

  // Focus mode: hovering/selecting a node highlights its neighborhood, dims the rest
  const focusId = hoveredNode || selectedNode?.id || null;
  const connectedIds = useMemo(() => {
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    MOCK_GRAPH_EDGES.forEach((e) => {
      if (e.source === focusId) set.add(e.target);
      if (e.target === focusId) set.add(e.source);
    });
    return set;
  }, [focusId]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-black/6 flex-wrap">
        <span className="eyebrow">Relation types:</span>
        {Object.entries(RELATION_COLORS).map(([rel, color]) => (
          <div key={rel} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-mono text-[#6e6e73] capitalize">{rel}</span>
          </div>
        ))}

        <div className="flex items-center gap-3 pl-3 border-l border-black/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[3px] bg-[#6e6e73]" />
            <span className="text-[10px] font-mono text-[#6e6e73]">Paper</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rotate-45 bg-[#6e6e73]" />
            <span className="text-[10px] font-mono text-[#6e6e73]">Concept</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {['mod-001', 'mod-002', 'mod-003', 'mod-004'].map((mod, i) => (
            <div key={mod} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: MODULE_COLORS[mod] }} />
              <span className="text-[10px] font-mono text-[#6e6e73]">Module {i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ background: 'transparent', touchAction: 'none', cursor: isPanning ? 'grabbing' : 'grab' }}
          aria-label="Knowledge graph of research papers and concepts"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {Object.entries(RELATION_COLORS).map(([rel, color]) => (
              <marker
                key={rel}
                id={`arrow-${rel}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} opacity="0.7" />
              </marker>
            ))}
            {MOCK_GRAPH_NODES.map((node) => {
              const color = MODULE_COLORS[node.moduleId] || node.color;
              return (
                <linearGradient key={`grad-${node.id}`} id={`node-grad-${node.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.95" />
                  <stop offset="55%" stopColor={color} />
                  <stop offset="100%" stopColor={color} stopOpacity="0.75" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Pan/zoom layer */}
          <motion.g
            animate={{ x: view.x, y: view.y, scale: view.k }}
            transition={isPanning ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
            style={{ transformOrigin: '0px 0px' }}
          >
            {/* Edges — gentle curves instead of straight lines, easier to trace when they cross */}
            {MOCK_GRAPH_EDGES.map((edge) => {
              const source = MOCK_GRAPH_NODES.find((n) => n.id === edge.source);
              const target = MOCK_GRAPH_NODES.find((n) => n.id === edge.target);
              if (!source || !target) return null;
              const color = RELATION_COLORS[edge.relation];
              const isHighlighted = focusId != null && (edge.source === focusId || edge.target === focusId);
              const dimmed = focusId != null && !isHighlighted;

              const x1 = scaleX(source.x);
              const y1 = scaleY(source.y);
              const x2 = scaleX(target.x);
              const y2 = scaleY(target.y);
              const dx = x2 - x1;
              const dy = y2 - y1;
              const norm = Math.hypot(dx, dy) || 1;
              const bow = 16;
              const mx = (x1 + x2) / 2 - (dy / norm) * bow;
              const my = (y1 + y2) / 2 + (dx / norm) * bow;
              const path = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;

              return (
                <motion.path
                  key={edge.id}
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={edge.relation === 'contradicts' ? '4 3' : undefined}
                  markerEnd={`url(#arrow-${edge.relation})`}
                  animate={{ strokeOpacity: dimmed ? 0.06 : isHighlighted ? 0.85 : 0.3 }}
                  transition={{ duration: 0.2 }}
                />
              );
            })}

            {/* Nodes — rendered as elevated 3D tiles (papers) / diamonds (concepts), not flat circles */}
            {MOCK_GRAPH_NODES.map((node, i) => {
              const x = scaleX(node.x);
              const y = scaleY(node.y);
              const r = node.type === 'paper' ? 10 + node.weight * 1.5 : 8 + node.weight;
              const s = r * 1.7; // tile half-size
              const rot = node.type === 'concept' ? 45 : 0; // concepts render as diamonds, papers as tiles
              const color = MODULE_COLORS[node.moduleId] || node.color;
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;
              const lifted = isSelected || isHovered;
              const dimmed = connectedIds ? !connectedIds.has(node.id) : false;

              return (
                <motion.g
                  key={node.id}
                  className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: dimmed ? 0.25 : 1, y: lifted ? -4 : 0 }}
                  transition={{
                    opacity: { delay: i * 0.03, duration: 0.3 },
                    y: { type: 'spring', stiffness: 500, damping: 28 },
                  }}
                  style={{ cursor: 'pointer', outlineColor: color }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Graph node: ${node.label}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedNode(isSelected ? null : node);
                    }
                  }}
                >
                  {/* Ground shadow — anchors the tile, deepens on lift */}
                  <motion.ellipse
                    cx={x}
                    cy={y + s * 0.62}
                    rx={s * 0.75}
                    ry={s * 0.22}
                    fill="#000"
                    initial={{ opacity: 0.12 }}
                    animate={{ opacity: lifted ? 0.22 : 0.12, ry: lifted ? s * 0.26 : s * 0.2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />

                  {/* Glow ring when active */}
                  {lifted && (
                    <motion.rect
                      x={x - s * 0.5 - 6}
                      y={y - s * 0.5 - 6}
                      width={s + 12}
                      height={s + 12}
                      rx={rot ? 4 : 10}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeOpacity="0.35"
                      transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ transformOrigin: `${x}px ${y}px` }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Depth face — offset duplicate behind gives the tile a built-up, extruded edge */}
                  <rect
                    x={x - s * 0.5 + 3}
                    y={y - s * 0.5 + 4}
                    width={s}
                    height={s}
                    rx={rot ? 3 : 8}
                    fill={color}
                    opacity="0.4"
                    transform={rot ? `rotate(${rot} ${x + 3} ${y + 4})` : undefined}
                  />

                  {/* Top face */}
                  <motion.rect
                    x={x - s * 0.5}
                    y={y - s * 0.5}
                    width={s}
                    height={s}
                    rx={rot ? 3 : 8}
                    fill={`url(#node-grad-${node.id})`}
                    stroke="white"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}
                    animate={{ scale: lifted ? 1.14 : 1 }}
                    style={{ transformOrigin: `${x}px ${y}px`, filter: isSelected ? `drop-shadow(0 6px 10px ${color}70)` : 'none' }}
                    transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                  />

                  {/* Specular highlight — glassy sheen on the top-left */}
                  <rect
                    x={x - s * 0.5 + s * 0.12}
                    y={y - s * 0.5 + s * 0.12}
                    width={s * 0.5}
                    height={s * 0.22}
                    rx={4}
                    fill="white"
                    opacity="0.4"
                    transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}
                    style={{ pointerEvents: 'none' }}
                  />

                  {/* Label */}
                  {(isHovered || isSelected || node.weight >= 8) && (
                    <motion.text
                      x={x}
                      y={y + s * 0.5 + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="600"
                      fill="#1d1d1f"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                    </motion.text>
                  )}
                </motion.g>
              );
            })}
          </motion.g>
        </svg>

        {/* Zoom controls */}
        <div
          className="absolute bottom-4 right-4 flex flex-col gap-0.5 rounded-xl p-1 z-10"
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <button
            onClick={() => zoomBy(1.25)}
            className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
            aria-label="Zoom in"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => zoomBy(1 / 1.25)}
            className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
            aria-label="Zoom out"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors border-t border-black/6 mt-0.5 pt-1.5"
            aria-label="Reset view"
            title="Reset view"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {/* Selected node detail card */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              layoutId={`node-card-${selectedNode.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute bottom-4 left-4 w-72 rounded-2xl p-4 z-10"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
              }}
            >
              <div className="flex items-start gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                  style={{ background: MODULE_COLORS[selectedNode.moduleId] || selectedNode.color }}
                />
                <div>
                  <p className="text-xs font-semibold text-[#1d1d1f] leading-tight">{selectedNode.label}</p>
                  <p className="text-[10px] font-mono text-[#6e6e73] mt-0.5 capitalize">
                    {selectedNode.type} · {selectedNode.moduleId.replace('mod-', 'Module ')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="ml-auto text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                  aria-label="Close node detail"
                >
                  ×
                </button>
              </div>

              {/* Connected edges */}
              <div className="space-y-1">
                <p className="eyebrow mb-1.5">Connections</p>
                {MOCK_GRAPH_EDGES
                  .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                  .slice(0, 4)
                  .map((edge) => {
                    const other = MOCK_GRAPH_NODES.find((n) =>
                      n.id === (edge.source === selectedNode.id ? edge.target : edge.source)
                    );
                    return (
                      <div key={edge.id} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: RELATION_COLORS[edge.relation] }}
                        />
                        <span className="text-[10px] text-[#6e6e73] truncate">{other?.label}</span>
                        <span
                          className="text-[9px] font-mono ml-auto shrink-0"
                          style={{ color: RELATION_COLORS[edge.relation] }}
                        >
                          {edge.relation}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
