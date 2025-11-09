import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Node {
  id: string;
  label: string;
  group: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface ConceptGraphProps {
  data: GraphData;
}

interface SimulationNode extends Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimulationLink extends Link {
  source: SimulationNode;
  target: SimulationNode;
}

// Simple physics simulation for node positioning
class ForceSimulation {
  nodes: SimulationNode[];
  links: SimulationLink[];
  width: number;
  height: number;
  alpha: number = 1;
  alphaDecay: number = 0.02;

  constructor(nodes: Node[], links: Link[], width: number, height: number) {
    this.width = width;
    this.height = height;

    // Initialize nodes with random positions
    this.nodes = nodes.map((node) => ({
      ...node,
      x: node.x ?? Math.random() * width,
      y: node.y ?? Math.random() * height,
      vx: node.vx ?? 0,
      vy: node.vy ?? 0,
    }));

    // Convert links to use node references
    this.links = links.map((link) => ({
      ...link,
      source: this.nodes.find(
        (n) =>
          n.id ===
          (typeof link.source === "string" ? link.source : link.source.id)
      )!,
      target: this.nodes.find(
        (n) =>
          n.id ===
          (typeof link.target === "string" ? link.target : link.target.id)
      )!,
    }));
  }

  tick() {
    if (this.alpha < 0.01) return false;

    // Apply forces
    this.applyLinkForce();
    this.applyChargeForce();
    this.applyCenterForce();
    this.applyPositionVerlet();

    this.alpha -= this.alphaDecay;
    return true;
  }

  private applyLinkForce() {
    const linkDistance = 100;
    const linkStrength = 0.1;

    this.links.forEach((link) => {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (distance - linkDistance) * linkStrength;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      link.source.vx += fx;
      link.source.vy += fy;
      link.target.vx -= fx;
      link.target.vy -= fy;
    });
  }

  private applyChargeForce() {
    const strength = -250;

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = strength / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        nodeA.vx += fx;
        nodeA.vy += fy;
        nodeB.vx -= fx;
        nodeB.vy -= fy;
      }
    }
  }

  private applyCenterForce() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const strength = 0.01;

    this.nodes.forEach((node) => {
      node.vx += (centerX - node.x) * strength;
      node.vy += (centerY - node.y) * strength;
    });
  }

  private applyPositionVerlet() {
    const damping = 0.9;

    this.nodes.forEach((node) => {
      if (node.fx !== null && node.fx !== undefined) {
        node.x = node.fx;
        node.vx = 0;
      } else {
        node.vx *= damping;
        node.x += node.vx;
      }

      if (node.fy !== null && node.fy !== undefined) {
        node.y = node.fy;
        node.vy = 0;
      } else {
        node.vy *= damping;
        node.y += node.vy;
      }

      // Keep nodes within bounds
      node.x = Math.max(20, Math.min(this.width - 20, node.x));
      node.y = Math.max(20, Math.min(this.height - 20, node.y));
    });
  }

  restart() {
    this.alpha = 1;
  }

  stop() {
    this.alpha = 0;
  }
}

export function ConceptGraph({ data }: ConceptGraphProps) {
  const [dimensions] = useState({ width: 800, height: 400 });
  const [nodes, setNodes] = useState<SimulationNode[]>([]);
  const [links, setLinks] = useState<SimulationLink[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<ForceSimulation | null>(null);

  // Colors for different groups - using CSS variables
  const gradients = [
    ["var(--chart-1)", "var(--chart-4)"],
    ["var(--chart-2)", "var(--chart-6)"],
    ["var(--chart-3)", "var(--chart-5)"],
    ["var(--chart-8)", "var(--chart-5)"],
    ["var(--chart-4)", "var(--chart-1)"],
  ];

  useEffect(() => {
    if (!data?.nodes?.length) return;

    const sim = new ForceSimulation(
      data.nodes,
      data.links,
      dimensions.width,
      dimensions.height
    );
    setSimulation(sim);
    setNodes([...sim.nodes]);
    setLinks([...sim.links]);

    // Animation loop
    const animate = () => {
      if (sim.tick()) {
        setNodes([...sim.nodes]);
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      sim.stop();
    };
  }, [data, dimensions]);

  const handleMouseDown = useCallback(
    (nodeId: string, event: React.MouseEvent) => {
      event.preventDefault();
      setDraggedNode(nodeId);
      if (simulation) {
        simulation.restart();
      }
    },
    [simulation]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!draggedNode || !simulation) return;

      const rect = (
        event.currentTarget as SVGSVGElement
      ).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const node = simulation.nodes.find((n) => n.id === draggedNode);
      if (node) {
        node.fx = x;
        node.fy = y;
      }
    },
    [draggedNode, simulation]
  );

  const handleMouseUp = useCallback(() => {
    if (!draggedNode || !simulation) return;

    const node = simulation.nodes.find((n) => n.id === draggedNode);
    if (node) {
      node.fx = null;
      node.fy = null;
    }

    setDraggedNode(null);
  }, [draggedNode, simulation]);

  // const getNodeColor = (group: number) => {
  //   const colorIndex = (group - 1) % 5;
  //   return gradients[colorIndex];
  // };

  return (
    <Card className="glass-surface border border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-foreground">
          Interactive Concept Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <svg
          className="w-full h-[400px]"
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {gradients.map((colors, index) => (
              <linearGradient
                key={`grad${index + 1}`}
                id={`grad${index + 1}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={colors[0]} />
                <stop offset="100%" stopColor={colors[1]} />
              </linearGradient>
            ))}
          </defs>

          {/* Links */}
          <g>
            {links.map((link, index) => (
              <line
                key={index}
                x1={link.source.x}
                y1={link.source.y}
                x2={link.target.x}
                y2={link.target.y}
                stroke="var(--muted-foreground)"
                strokeWidth={Math.sqrt(link.value) * 2}
              />
            ))}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  r={14}
                  fill={`url(#grad${((node.group - 1) % 5) + 1})`}
                  stroke="var(--border)"
                  strokeWidth={2}
                  style={{
                    filter: "drop-shadow(0 2px 4px var(--glass-shadow))",
                    cursor: "grab",
                  }}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                />
                <text
                  x={18}
                  y={4}
                  fill="var(--foreground)"
                  fontSize="12px"
                  fontWeight="500"
                  style={{
                    textShadow: "0 1px 2px oklch(100% 0 0 / 0.8)",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {node.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}
