import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDashboard, AGENT_REGISTRY } from '../store';
import './ProcedureMap.css';
import {
  REECE_PROCEDURE_SPECS,
  REECE_PROCEDURE_SHORT,
  type ReeceProcedureSpec,
} from './reece-procedure-graphs';

interface AgentNodeData {
  label: string;
  icon: string;
  role: string;
  description: string;
  tools: string[];
  linkedAgents: string[];
  callCount: number;
  [key: string]: unknown;
}

interface StepNodeData {
  label: string;
  stepNumber: number;
  description: string;
  mandatory: boolean;
  longDesc?: string;
  tools?: string[];
  guardrails?: string[];
  examples?: string[];
  outputs?: string[];
  accent?: string;
  [key: string]: unknown;
}

interface PhaseNodeData {
  label: string;
  phase: string;
  color: string;
  [key: string]: unknown;
}

type ProcedureViewId = 'janus-core' | string;

function AgentNode({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const d = data as AgentNodeData;
  return (
    <div className={`pm-node pm-node--agent ${selected ? 'pm-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="pm-handle" />
      <div className="pm-node__header">
        <span className="pm-node__icon">{d.icon}</span>
        <span className="pm-node__label">{d.label}</span>
        {d.callCount > 0 && <span className="pm-node__badge">{d.callCount}</span>}
      </div>
      <div className="pm-node__role">{d.role}</div>
      {d.tools.length > 0 && (
        <div className="pm-node__tools">
          {d.tools.map(t => <span key={t} className="pm-node__tool">{t}</span>)}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="pm-handle" />
      <Handle type="source" position={Position.Right} id="right" className="pm-handle" />
      <Handle type="target" position={Position.Left} id="left" className="pm-handle" />
    </div>
  );
}

function StepNode({ data, selected }: NodeProps<Node<StepNodeData>>) {
  const d = data as StepNodeData;
  const hasDetail = !!(d.longDesc || (d.tools && d.tools.length) || (d.guardrails && d.guardrails.length) || (d.examples && d.examples.length) || (d.outputs && d.outputs.length));
  const accent = d.accent;
  const accentStyle = accent ? { borderColor: accent } : undefined;
  return (
    <div
      className={`pm-node pm-node--step ${d.mandatory ? 'pm-node--mandatory' : ''} ${selected ? 'pm-node--selected' : ''} ${hasDetail ? 'pm-node--has-detail' : ''}`}
      style={accentStyle}
    >
      {accent ? <span className="pm-node__accent-bar" style={{ background: accent }} /> : null}
      <Handle type="target" position={Position.Top} className="pm-handle" />
      <div className="pm-node__step-header">
        <span className="pm-node__step-num" style={accent ? { background: accent, color: '#06051a' } : undefined}>{d.stepNumber}</span>
        <span className="pm-node__label">{d.label}</span>
        {hasDetail ? <span className="pm-node__info">i</span> : null}
      </div>
      <div className="pm-node__step-desc">{d.description}</div>
      <Handle type="source" position={Position.Bottom} className="pm-handle" />
      <Handle type="source" position={Position.Right} id="right" className="pm-handle" />
      <Handle type="target" position={Position.Left} id="left" className="pm-handle" />
    </div>
  );
}

function PhaseNode({ data }: NodeProps<Node<PhaseNodeData>>) {
  const d = data as PhaseNodeData;
  return (
    <div className="pm-node pm-node--phase" style={{ borderColor: d.color }}>
      <div className="pm-node__phase-label" style={{ color: d.color }}>{d.label}</div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  step: StepNode,
  phase: PhaseNode,
};

function buildJanusProcedureGraph(agentCounts: Record<string, number>): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const phases = [
    { id: 'phase-dispatch', label: 'JANUS DISPATCH', phase: 'dispatch', color: '#5fd4d4', x: 400, y: -60 },
    { id: 'phase-agents', label: 'AGENT POOL', phase: 'agents', color: '#5fd47a', x: 400, y: 520 },
    { id: 'phase-verify', label: 'VERIFICATION', phase: 'verify', color: '#d4a55f', x: 1100, y: -60 },
    { id: 'phase-output', label: 'OUTPUT ROUTING', phase: 'output', color: '#a77bdb', x: 1100, y: 520 },
  ];

  for (const p of phases) {
    nodes.push({
      id: p.id,
      type: 'phase',
      position: { x: p.x, y: p.y },
      data: { label: p.label, phase: p.phase, color: p.color },
      draggable: false,
      selectable: false,
    });
  }

  const dispatchSteps = [
    { id: 'step-think', num: 0, label: 'THINK FIRST', desc: 'Reason before acting on non-trivial work', mandatory: true, x: 100, y: 20 },
    { id: 'step-identify', num: 1, label: 'IDENTIFY', desc: 'Classify task, risk, and needed context', mandatory: true, x: 350, y: 20 },
    { id: 'step-dispatch', num: 2, label: 'DISPATCH', desc: 'Read relevant agent file before acting', mandatory: true, x: 600, y: 20 },
    { id: 'step-lookup', num: 3, label: 'LOOKUP', desc: 'Check registries, memory, and project files', mandatory: true, x: 350, y: 140 },
    { id: 'step-execute', num: 4, label: 'EXECUTE', desc: 'Do the work with repo and tool context', mandatory: true, x: 600, y: 140 },
    { id: 'step-verify', num: 5, label: 'VERIFY', desc: 'Run applicable verification layers', mandatory: true, x: 850, y: 80 },
    { id: 'step-output', num: 6, label: 'OUTPUT', desc: 'Route result to repo, vault, memory, or user', mandatory: true, x: 1100, y: 80 },
  ];

  for (const s of dispatchSteps) {
    nodes.push({
      id: s.id,
      type: 'step',
      position: { x: s.x, y: s.y },
      data: { label: s.label, stepNumber: s.num, description: s.desc, mandatory: s.mandatory },
    });
  }

  const stepEdges: [string, string][] = [
    ['step-think', 'step-identify'],
    ['step-identify', 'step-dispatch'],
    ['step-dispatch', 'step-lookup'],
    ['step-lookup', 'step-execute'],
    ['step-execute', 'step-verify'],
    ['step-verify', 'step-output'],
  ];
  for (const [source, target] of stepEdges) {
    edges.push({
      id: `e-${source}-${target}`,
      source,
      target,
      sourceHandle: source === 'step-dispatch' || source === 'step-execute' ? 'right' : undefined,
      targetHandle: target === 'step-execute' ? 'left' : undefined,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#5fd4d4', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#5fd4d4', width: 16, height: 12 },
    });
  }

  const cols = 5;
  const agentStartX = 40;
  const agentStartY = 300;
  const colGap = 240;
  const rowGap = 200;

  AGENT_REGISTRY.forEach((agent, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes.push({
      id: agent.id,
      type: 'agent',
      position: { x: agentStartX + col * colGap, y: agentStartY + row * rowGap },
      data: {
        label: agent.name,
        icon: agent.icon,
        role: agent.role,
        description: agent.description,
        tools: agent.tools,
        linkedAgents: agent.linkedAgents,
        callCount: agentCounts[agent.name] || 0,
      },
    });
  });

  edges.push({
    id: 'e-dispatch-pool',
    source: 'step-dispatch',
    target: 'a-dev',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#5fd47a', strokeWidth: 1.5, strokeDasharray: '6 3' },
    label: 'routes to agent',
    labelStyle: { fill: '#5fd47a', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
    labelBgStyle: { fill: 'rgba(6, 5, 20, 0.8)' },
  });

  for (const agent of AGENT_REGISTRY) {
    for (const linked of agent.linkedAgents) {
      const exists = edges.find(e => e.id === `e-link-${linked}-${agent.id}`);
      if (!exists) {
        edges.push({
          id: `e-link-${agent.id}-${linked}`,
          source: agent.id,
          target: linked,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'smoothstep',
          style: { stroke: 'rgba(167, 125, 219, 0.4)', strokeWidth: 1, strokeDasharray: '4 4' },
        });
      }
    }
  }

  const verifyLayers = [
    { id: 'v-code', label: 'Code Review', desc: 'Read changed files before reporting done', y: -20 },
    { id: 'v-server', label: 'Server Start', desc: 'Confirm app starts cleanly when relevant', y: 60 },
    { id: 'v-visual', label: 'Visual Check', desc: 'Desktop and mobile where UI changed', y: 140 },
    { id: 'v-func', label: 'Functional Test', desc: 'Click through changed workflows', y: 220 },
    { id: 'v-cross', label: 'Cross-Env', desc: 'Check shared surfaces when touched', y: 300 },
    { id: 'v-security', label: 'Security Gate', desc: 'Auth, data, and external API review', y: 380 },
  ];

  for (const v of verifyLayers) {
    nodes.push({
      id: v.id,
      type: 'step',
      position: { x: 1050, y: v.y },
      data: { label: v.label, stepNumber: 0, description: v.desc, mandatory: true },
    });
    edges.push({
      id: `e-verify-${v.id}`,
      source: 'step-verify',
      target: v.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'smoothstep',
      style: { stroke: '#d4a55f', strokeWidth: 1 },
    });
  }

  const outputs = [
    { id: 'o-github', label: 'GitHub', desc: 'Code, configs, markdown', y: -20 },
    { id: 'o-drive', label: 'Google Drive', desc: 'Client deliverables', y: 60 },
    { id: 'o-r2', label: 'Cloudflare R2', desc: 'Media and generated assets', y: 140 },
    { id: 'o-vault', label: 'Vault', desc: 'Learnings, concepts, procedures', y: 220 },
  ];

  for (const o of outputs) {
    nodes.push({
      id: o.id,
      type: 'step',
      position: { x: 1320, y: o.y },
      data: { label: o.label, stepNumber: 0, description: o.desc, mandatory: false },
    });
    edges.push({
      id: `e-output-${o.id}`,
      source: 'step-output',
      target: o.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'smoothstep',
      style: { stroke: '#a77bdb', strokeWidth: 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a77bdb', width: 12, height: 10 },
    });
  }

  return { nodes, edges };
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="pm-detail__section">
      <div className="pm-detail__section-title">{title}</div>
      <ul className="pm-detail__list">
        {items.map((item, i) => <li key={`${title}-${i}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function FlowDetailPanel({ node, onClose }: { node: Node | null; onClose: () => void }) {
  if (!node) return null;
  const d = node.data as Record<string, unknown>;
  const accent = (d.accent as string | undefined) || '#5fd4d4';

  const isAgent = node.type === 'agent';
  const isStep = node.type === 'step';

  return (
    <div className="pm-detail" style={{ borderColor: accent }}>
      <div className="pm-detail__header" style={{ borderBottomColor: accent }}>
        <div className="pm-detail__title">
          {isAgent && d.icon ? <span className="pm-detail__icon">{String(d.icon)}</span> : null}
          {isStep && typeof d.stepNumber === 'number' && d.stepNumber > 0 ? (
            <span className="pm-detail__step-num" style={{ background: accent }}>{d.stepNumber as number}</span>
          ) : null}
          <span>{String(d.label)}</span>
        </div>
        <button className="pm-detail__close" onClick={onClose}>x</button>
      </div>

      {d.role ? <div className="pm-detail__role">{String(d.role)}</div> : null}

      {isStep && d.longDesc ? (
        <div className="pm-detail__desc pm-detail__desc--lead">{String(d.longDesc)}</div>
      ) : d.description ? (
        <div className="pm-detail__desc">{String(d.description)}</div>
      ) : null}

      {Array.isArray(d.tools) && (d.tools as string[]).length > 0 && (
        <div className="pm-detail__section">
          <div className="pm-detail__section-title">Tools</div>
          <div className="pm-detail__tags">
            {(d.tools as string[]).map(t => (
              <span key={t} className="pm-detail__tag">{t}</span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(d.guardrails) && (d.guardrails as string[]).length > 0 && (
        <DetailList title="Guardrails" items={d.guardrails as string[]} />
      )}

      {Array.isArray(d.examples) && (d.examples as string[]).length > 0 && (
        <DetailList title="Examples" items={d.examples as string[]} />
      )}

      {Array.isArray(d.outputs) && (d.outputs as string[]).length > 0 && (
        <DetailList title="Output" items={d.outputs as string[]} />
      )}

      {Array.isArray(d.linkedAgents) && (d.linkedAgents as string[]).length > 0 && (
        <div className="pm-detail__section">
          <div className="pm-detail__section-title">Linked Agents</div>
          <div className="pm-detail__tags">
            {(d.linkedAgents as string[]).map(a => {
              const agent = AGENT_REGISTRY.find(r => r.id === a);
              return <span key={a} className="pm-detail__tag pm-detail__tag--agent">{agent?.name || a}</span>;
            })}
          </div>
        </div>
      )}

      {typeof d.callCount === 'number' && (d.callCount as number) > 0 && (
        <div className="pm-detail__stat">
          <span className="pm-detail__stat-label">Session calls</span>
          <span className="pm-detail__stat-value">{d.callCount as number}</span>
        </div>
      )}

      {isStep && d.mandatory ? <div className="pm-detail__mandatory">Mandatory step</div> : null}
    </div>
  );
}

function buildReeceFlowGraph(spec: ReeceProcedureSpec): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const p of spec.phases) {
    nodes.push({
      id: `phase-${p.id}`,
      type: 'phase',
      position: { x: p.x, y: p.y },
      data: { label: p.label, phase: p.id, color: p.color },
      draggable: false,
      selectable: false,
    });
  }

  for (const s of spec.steps) {
    nodes.push({
      id: s.id,
      type: 'step',
      position: { x: s.x, y: s.y },
      data: {
        label: s.label,
        stepNumber: s.stepNumber,
        description: s.shortDesc,
        longDesc: s.longDesc,
        tools: s.tools || [],
        guardrails: s.guardrails || [],
        examples: s.examples || [],
        outputs: s.outputs || [],
        mandatory: !!s.mandatory,
        accent: spec.accent,
      },
    });
  }

  for (const e of spec.edges) {
    const color = e.color || spec.accent;
    edges.push({
      id: `e-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: 'smoothstep',
      animated: !e.branch,
      label: e.label,
      style: { stroke: color, strokeWidth: e.branch ? 1 : 2, strokeDasharray: e.branch ? '4 4' : undefined },
      labelStyle: e.label ? { fill: color, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' } : undefined,
      labelBgStyle: e.label ? { fill: 'rgba(6, 5, 20, 0.8)' } : undefined,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 11 },
    });
  }

  return { nodes, edges };
}

function ReeceFlow({ spec }: { spec: ReeceProcedureSpec }) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => { setInfoOpen(false); setSelectedNode(null); }, [spec.id]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildReeceFlowGraph(spec),
    [spec]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: MouseEvent, node: Node) => {
    if (node.type === 'phase') return;
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
        minZoom={0.15}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        className="pm-flow"
        key={spec.id}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="pm-bg" />
        <Controls showInteractive={false} className="pm-controls" />
        <MiniMap className="pm-minimap" />
        <Panel position="top-right" className="pm-info-anchor">
          <InfoToggle open={infoOpen} onToggle={() => setInfoOpen(o => !o)} accent={spec.accent} />
        </Panel>
        {infoOpen && (
          <Panel position="top-left" className="pm-title-panel" style={{ borderColor: spec.accent }}>
            <div className="pm-title-row">
              <span className="pm-account-pill" style={{ borderColor: spec.accent, color: spec.accent }}>REECE</span>
              <span className="pm-level-pill">{spec.level}</span>
            </div>
            <div className="pm-title">{spec.title}</div>
            <div className="pm-subtitle">{spec.subtitle}</div>
            <div className="pm-objective">{spec.objective}</div>
            <div className="pm-objective pm-objective--automation">
              <span className="pm-objective__label">Automation:</span> {spec.automation}
            </div>
            <div className="pm-board__path">{spec.file}</div>
          </Panel>
        )}
      </ReactFlow>

      <FlowDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </>
  );
}

interface ProcedureOption {
  id: ProcedureViewId;
  account: 'Janus' | 'Reece';
  label: string;
  subtitle?: string;
  accent?: string;
}

const PROCEDURE_OPTIONS: ProcedureOption[] = [
  { id: 'janus-core', account: 'Janus', label: 'Core dispatch', subtitle: 'Agent pool + verification layers', accent: '#5fd4d4' },
  ...REECE_PROCEDURE_SPECS.map(p => ({
    id: p.id,
    account: 'Reece' as const,
    label: REECE_PROCEDURE_SHORT[p.id] || p.title,
    subtitle: p.subtitle,
    accent: p.accent,
  })),
];

function ViewPicker({ active, onChange }: { active: ProcedureViewId; onChange: (id: ProcedureViewId) => void }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const current = PROCEDURE_OPTIONS.find(o => o.id === active) || PROCEDURE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: globalThis.MouseEvent) => {
      const target = e.target as globalThis.Node | null;
      if (target && !wrapperRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groups: Array<{ name: ProcedureOption['account']; options: ProcedureOption[] }> = [
    { name: 'Janus', options: PROCEDURE_OPTIONS.filter(o => o.account === 'Janus') },
    { name: 'Reece', options: PROCEDURE_OPTIONS.filter(o => o.account === 'Reece') },
  ];

  return (
    <div className="pm-picker" ref={wrapperRef}>
      <button
        type="button"
        className={`pm-picker__trigger ${open ? 'pm-picker__trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={current.accent ? { borderColor: current.accent } : undefined}
      >
        <span className="pm-picker__account">{current.account}</span>
        <span className="pm-picker__label" style={current.accent ? { color: current.accent } : undefined}>
          {current.label}
        </span>
        <span className={`pm-picker__chevron ${open ? 'pm-picker__chevron--open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="pm-picker__menu" role="listbox">
          {groups.map(group => (
            <div key={group.name} className="pm-picker__group">
              <div className="pm-picker__group-label">{group.name}</div>
              {group.options.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={opt.id === active}
                  className={`pm-picker__option ${opt.id === active ? 'pm-picker__option--active' : ''}`}
                  onClick={() => { onChange(opt.id); setOpen(false); }}
                >
                  <span className="pm-picker__option-dot" style={{ background: opt.accent || 'var(--color-text-muted)' }} />
                  <span className="pm-picker__option-text">
                    <span className="pm-picker__option-label">{opt.label}</span>
                    {opt.subtitle ? <span className="pm-picker__option-sub">{opt.subtitle}</span> : null}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoToggle({
  open, onToggle, accent,
}: { open: boolean; onToggle: () => void; accent?: string }) {
  return (
    <button
      type="button"
      className={`pm-info-toggle ${open ? 'pm-info-toggle--open' : ''}`}
      onClick={onToggle}
      title={open ? 'Hide procedure info' : 'Show procedure info'}
      aria-label={open ? 'Hide procedure info' : 'Show procedure info'}
      style={accent ? { borderColor: accent, color: accent } : undefined}
    >
      {open ? 'x' : 'i'}
    </button>
  );
}

function JanusFlow({ agentCounts }: { agentCounts: Record<string, number> }) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const accent = '#5fd4d4';

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildJanusProcedureGraph(agentCounts),
    [agentCounts]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: MouseEvent, node: Node) => {
    if (node.type === 'phase') return;
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
        minZoom={0.15}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        className="pm-flow"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="pm-bg" />
        <Controls showInteractive={false} className="pm-controls" />
        <MiniMap className="pm-minimap" />
        <Panel position="top-right" className="pm-info-anchor">
          <InfoToggle open={infoOpen} onToggle={() => setInfoOpen(o => !o)} accent={accent} />
        </Panel>
        {infoOpen && (
          <Panel position="top-left" className="pm-title-panel" style={{ borderColor: accent }}>
            <div className="pm-title-row">
              <span className="pm-account-pill" style={{ borderColor: accent, color: accent }}>JANUS</span>
              <span className="pm-level-pill">Core</span>
            </div>
            <div className="pm-title">Janus Core Procedure</div>
            <div className="pm-subtitle">General dispatch protocol, agent pool, verification layers</div>
          </Panel>
        )}
      </ReactFlow>

      <FlowDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </>
  );
}

export function ProcedureMap() {
  const { centerView, setCenterView, agentCounts } = useDashboard();
  const [procedureView, setProcedureView] = useState<ProcedureViewId>('janus-core');
  const activeReeceSpec = REECE_PROCEDURE_SPECS.find(p => p.id === procedureView);

  return (
    <div className={`pm-container ${activeReeceSpec ? 'pm-container--reece' : 'pm-container--janus'}`}>
      <ViewPicker active={procedureView} onChange={setProcedureView} />

      {activeReeceSpec ? (
        <ReeceFlow spec={activeReeceSpec} />
      ) : (
        <JanusFlow agentCounts={agentCounts} />
      )}

      <div className="constellation__view-toggle">
        {(['constellation', 'brain', 'procedures', 'files'] as const).map(v => (
          <button
            key={v}
            className={`constellation__view-btn ${centerView === v ? 'constellation__view-btn--active' : ''}`}
            onClick={() => setCenterView(v)}
          >
            {v === 'files' ? 'Live' : v === 'constellation' ? 'Projects' : v === 'procedures' ? 'Procedures' : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
