import { memo } from 'react'
import * as React from 'react'
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Position,
  Handle,
  getBezierPath,
  type EdgeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './architecture-flow.css'
import { motion } from 'motion/react'

// Custom Node Components
const RedditNode = memo(() => {
  return (
    <>
      <div className="wrapper gradient">
        <div className="inner">
          <div className="body">
            <svg viewBox="0 -4 48 48" className="node-icon">
              <path fill="#FF5700" d="M31.14,32.325803 C29.346,32.325803 27.8385,30.884067 27.8385,29.106421 C27.8385,27.328775 29.346,25.839477 31.14,25.839477 C32.934,25.839477 34.389,27.328775 34.389,29.106421 C34.389,30.884067 32.934,32.325803 31.14,32.325803 M31.902,38.574316 C30.231,40.228597 27.654,41.032699 24.024,41.032699 C24.0165,41.032699 24.0075,41.031213 23.9985,41.031213 C23.991,41.031213 23.982,41.032699 23.973,41.032699 C20.343,41.032699 17.7675,40.228597 16.098,38.574316 C15.585,38.065993 15.585,37.244055 16.098,36.737218 C16.6095,36.23038 17.439,36.23038 17.952,36.737218 C19.104,37.878716 21.0735,38.434602 23.973,38.434602 C23.982,38.434602 23.991,38.436088 23.9985,38.436088 C24.0075,38.436088 24.0165,38.434602 24.024,38.434602 C26.9235,38.434602 28.8945,37.878716 30.048,36.737218 C30.561,36.228894 31.3905,36.23038 31.902,36.737218 C32.4135,37.245541 32.4135,38.067479 31.902,38.574316 M13.611,29.106421 C13.611,27.330262 15.1155,25.839477 16.908,25.839477 C18.702,25.839477 20.157,27.330262 20.157,29.106421 C20.157,30.884067 18.702,32.325803 16.908,32.325803 C15.1155,32.325803 13.611,30.884067 13.611,29.106421 M39.996,8.598098 C41.211,8.598098 42.1995,9.577586 42.1995,10.780024 C42.1995,11.983948 41.211,12.963436 39.996,12.963436 C38.781,12.963436 37.7925,11.983948 37.7925,10.780024 C37.7925,9.577586 38.781,8.598098 39.996,8.598098 M48,25.570452 C48,22.417955 45.4125,19.854043 42.231,19.854043 C40.854,19.854043 39.5895,20.335612 38.5965,21.136742 C35.079,18.945898 30.615,17.62604 25.83,17.346611 L28.326,9.527051 L35.1855,11.127824 C35.3655,13.602556 37.4535,15.561534 39.996,15.561534 C42.6555,15.561534 44.82,13.416766 44.82,10.780024 C44.82,8.144768 42.6555,6 39.996,6 C38.136,6 36.519,7.049346 35.7135,8.581748 L27.7425,6.722354 C27.075,6.56629 26.4,6.94679 26.193,7.594828 L23.094,17.300535 C17.9385,17.425386 13.092,18.749703 9.3165,21.068371 C8.337,20.308859 7.1055,19.854043 5.769,19.854043 C2.5875,19.854043 0,22.417955 0,25.570452 C0,27.519025 0.99,29.241677 2.4975,30.273187 C2.4345,30.726516 2.4015,31.182818 2.4015,31.645065 C2.4015,35.585315 4.713,39.250595 8.91,41.964625 C12.933,44.567182 18.258,46 23.9025,46 C29.547,46 34.872,44.567182 38.895,41.964625 C43.092,39.250595 45.4035,35.585315 45.4035,31.645065 C45.4035,31.224435 45.375,30.806778 45.3225,30.392093 C46.9305,29.376932 48,27.594828 48,25.570452"/>
            </svg>
            <div>
              <div className="title">Reddit</div>
            </div>
          </div>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </>
  )
})

const XNode = memo(() => {
  return (
    <>
      <div className="wrapper gradient">
        <div className="inner">
          <div className="body">
            <svg viewBox="0 0 48 48" className="node-icon">
              <path fill="#E0E0E0" fillRule="evenodd" d="M38,42H10c-2.209,0-4-1.791-4-4V10c0-2.209,1.791-4,4-4h28c2.209,0,4,1.791,4,4v28C42,40.209,40.209,42,38,42z" clipRule="evenodd"/>
              <path fill="#fff" d="M34.257,34h-6.437L13.829,14h6.437L34.257,34z M28.587,32.304h2.563L19.499,15.696h-2.563L28.587,32.304z"/>
              <polygon fill="#fff" points="15.866,34 23.069,25.656 22.127,24.407 13.823,34"/>
              <polygon fill="#fff" points="24.45,21.721 25.355,23.01 33.136,14 31.136,14"/>
            </svg>
            <div>
              <div className="title">X</div>
            </div>
          </div>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </>
  )
})

type TurboNodeData = {
  title: string
  subtitle?: string
}

const TurboNode = memo(({ data }: NodeProps<TurboNodeData>) => {
  return (
    <>
      <div className="wrapper gradient">
        <div className="inner">
          <div className="body">
            <div>
              <div className="title">{data.title}</div>
              {data.subtitle && <div className="subtitle">{data.subtitle}</div>}
            </div>
          </div>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </>
  )
})

const nodeTypes = {
  reddit: RedditNode,
  x: XNode,
  turbo: TurboNode,
}

// Custom Edge - solid line
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const xEqual = sourceX === targetX
  const yEqual = sourceY === targetY

  const [edgePath] = getBezierPath({
    sourceX: xEqual ? sourceX + 0.0001 : sourceX,
    sourceY: yEqual ? sourceY + 0.0001 : sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
    />
  )
}

// Flowing Dotted Edge
function FlowingDottedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const xEqual = sourceX === targetX
  const yEqual = sourceY === targetY

  const [edgePath] = getBezierPath({
    sourceX: xEqual ? sourceX + 0.0001 : sourceX,
    sourceY: yEqual ? sourceY + 0.0001 : sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <path
      id={id}
      className="react-flow__edge-path flowing-dotted-edge"
      d={edgePath}
      markerEnd={markerEnd}
    />
  )
}

const edgeTypes = {
  turbo: CustomEdge,
  dotted: FlowingDottedEdge,
}

// Social Media Pipeline
const socialMediaNodes: Node[] = [
  {
    id: 'reddit',
    type: 'reddit',
    position: { x: 0, y: 0 },
    data: { title: '' },
  },
  {
    id: 'x',
    type: 'x',
    position: { x: 0, y: 120 },
    data: { title: '' },
  },
  {
    id: 'social-feed',
    type: 'turbo',
    position: { x: 250, y: 60 },
    data: { title: 'Social Media Feed', subtitle: 'real-time' },
  },
  {
    id: 'sentiment',
    type: 'turbo',
    position: { x: 520, y: 60 },
    data: { title: 'Sentiment Analysis', subtitle: 'customer happiness' },
  },
]

// Outage Detection Pipeline
const outageNodes: Node<TurboNodeData>[] = [
  {
    id: 'down-detector',
    type: 'turbo',
    position: { x: 50, y: 80 },
    data: { title: 'Down Detector', subtitle: 'monitor' },
  },
  {
    id: 'priority-queue',
    type: 'turbo',
    position: { x: 320, y: 80 },
    data: { title: 'Priority Queue', subtitle: 'organize' },
  },
  {
    id: 'outage-map',
    type: 'turbo',
    position: { x: 590, y: 80 },
    data: { title: 'Outage Map', subtitle: 'visualize' },
  },
]

// Customer Insights Pipeline
const customerInsightsNodes: Node<TurboNodeData>[] = [
  {
    id: 'trustpilot',
    type: 'turbo',
    position: { x: 50, y: 80 },
    data: { title: 'TrustPilot', subtitle: 'reviews' },
  },
  {
    id: 'zero-shot',
    type: 'turbo',
    position: { x: 320, y: 80 },
    data: { title: 'AI Analysis', subtitle: 'zero-shot' },
  },
  {
    id: 'customer-issues',
    type: 'turbo',
    position: { x: 590, y: 80 },
    data: { title: 'Issues & Churn', subtitle: 'insights' },
  },
]

const defaultEdgeOptions = {
  type: 'turbo',
  markerEnd: 'edge-circle',
}

const socialMediaEdges: Edge[] = [
  { id: 'e1-1', source: 'reddit', target: 'social-feed', type: 'dotted' },
  { id: 'e1-2', source: 'x', target: 'social-feed', type: 'dotted' },
  { id: 'e1-3', source: 'social-feed', target: 'sentiment' },
]

const outageEdges: Edge[] = [
  { id: 'e2-1', source: 'down-detector', target: 'priority-queue', type: 'dotted' },
  { id: 'e2-2', source: 'priority-queue', target: 'outage-map' },
]

const customerInsightsEdges: Edge[] = [
  { id: 'e3-1', source: 'trustpilot', target: 'zero-shot', type: 'dotted' },
  { id: 'e3-2', source: 'zero-shot', target: 'customer-issues' },
]

function FlowDiagram({ nodes, edges }: { nodes: Node[], edges: Edge[] }) {
  const [nodesState, , onNodesChange] = useNodesState(nodes)
  const [edgesState, , onEdgesChange] = useEdgesState(edges)

  return (
    <div className="h-[420px] w-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="var(--border)"
          gap={20}
          size={1}
        />
        <svg>
          <defs>
            <linearGradient id="edge-gradient">
              <stop offset="0%" stopColor="#E20074" />
              <stop offset="100%" stopColor="#2a8af6" />
            </linearGradient>
            <marker
              id="edge-circle"
              viewBox="-5 -5 10 10"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <circle stroke="#2a8af6" strokeOpacity="0.75" r="2" cx="0" cy="0" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  )
}

export function ArchitectureSection() {
  const [activeTab, setActiveTab] = React.useState('social')

  return (
    <section className="relative min-h-screen py-20 px-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto mb-16 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 mb-6">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">System Architecture</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Built for{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
            Scale & Speed
          </span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Our intelligent data pipeline processes real-time information from multiple sources
          to provide actionable insights instantly.
        </p>
      </motion.div>

      {/* Architecture Diagram with Custom Tabs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        {/* Custom Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveTab('social')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'social'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Social Media
            </button>
            <button
              onClick={() => setActiveTab('outage')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'outage'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Outage Detection
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'insights'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Customer Insights
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'social' && (
            <>
              <div className="rounded-2xl border-2 border-border bg-card/50 backdrop-blur overflow-hidden shadow-2xl">
                <FlowDiagram nodes={socialMediaNodes} edges={socialMediaEdges} />
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Real-time sentiment tracking from Reddit and X (Twitter) to monitor customer happiness
                </p>
              </div>
            </>
          )}

          {activeTab === 'outage' && (
            <>
              <div className="rounded-2xl border-2 border-border bg-card/50 backdrop-blur overflow-hidden shadow-2xl">
                <FlowDiagram nodes={outageNodes} edges={outageEdges} />
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Automated outage detection with priority response queue for rapid resolution
                </p>
              </div>
            </>
          )}

          {activeTab === 'insights' && (
            <>
              <div className="rounded-2xl border-2 border-border bg-card/50 backdrop-blur overflow-hidden shadow-2xl">
                <FlowDiagram nodes={customerInsightsNodes} edges={customerInsightsEdges} />
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  AI-powered zero-shot analysis identifies customer issues and churn risk patterns
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Key Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div className="p-6 rounded-xl bg-card border border-border card-matte">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-2xl">🔄</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Real-time Processing</h3>
          <p className="text-muted-foreground">
            Continuous monitoring and instant data processing for up-to-the-minute insights.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border card-matte">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
          <p className="text-muted-foreground">
            Advanced machine learning models analyze sentiment and detect patterns automatically.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border card-matte">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Actionable Insights</h3>
          <p className="text-muted-foreground">
            Transform raw data into clear, actionable insights to improve customer experience.
          </p>
        </div>
      </motion.div>
    </section>
  )
}
