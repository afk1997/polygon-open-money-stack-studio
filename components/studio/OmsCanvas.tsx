"use client";

import {
  Banknote,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Crosshair,
  Database,
  Expand,
  GitBranch,
  Layers3,
  LockKeyhole,
  Network,
  Route,
  Search,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent,
  type WheelEvent,
} from "react";
import type { OMSModule, Recommendation, StudioInput } from "@/lib/types";
import { formatMoney } from "@/lib/engine";
import { groupProvidersByModule } from "./useStudioModel";

type Point = { x: number; y: number };
type Rect = Point & { width: number; height: number };
type ViewState = Point & { scale: number };

const moduleIcons: Record<string, ComponentType<{ size?: number }>> = {
  "wallet-infra": WalletCards,
  crosschain: Network,
  "stablecoin-orchestration": Banknote,
  ramps: LockKeyhole,
  "cross-border": Route,
  "blockchain-integration": Database,
  cdk: Boxes,
  "compliance-security": ShieldCheck,
  "settlement-chain": Layers3,
  "yield-treasury": TrendingUp,
  "card-issuing": CreditCard,
  identity: BadgeCheck,
};

export function OmsCanvas({
  input,
  recommendation,
  requiredModules,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  requiredModules: OMSModule[];
}) {
  const groups = groupProvidersByModule(input.selectedProviderIds);
  const selectedProviders = groups.flatMap((group) =>
    group.providers
      .filter((provider) => !provider.polygonOwned)
      .map((provider) => ({ provider, module: group.module })),
  );
  const displayProviders = selectedProviders.slice(0, 10);
  const providerCount =
    recommendation.costModel.selectedProviderCount ||
    displayProviders.length ||
    input.vendorCount;
  const hiddenProviderCount = Math.max(selectedProviders.length - displayProviders.length, 0);
  const moduleCards = buildModuleCards(requiredModules, groups, recommendation);
  const polygonStackItems = useMemo(() => buildPolygonStackItems(requiredModules), [requiredModules]);
  const board = useMemo(() => ({ width: 1120, height: 820 }), []);
  const topOutcomes = buildOutcomes(input, recommendation);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{ start: Point; view: ViewState } | null>(null);
  const dragRef = useRef<{ id: string; start: Point; offset: Point } | null>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [locked, setLocked] = useState(false);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, Point>>({});

  const baseRects = useMemo<Record<string, Rect>>(() => {
    const moduleRects = Object.fromEntries(
      moduleCards.map(({ module }, index) => [
        `module-${module.id}`,
        { x: 300 + index * 166, y: 98, width: 152, height: 170 },
      ]),
    );

    return {
      current: { x: 42, y: 148, width: 188, height: 532 },
      core: { x: 436, y: 352, width: 430, height: 250 },
      controls: { x: 416, y: 656, width: 470, height: 132 },
      outcomes: { x: 918, y: 388, width: 200, height: 218 },
      ...moduleRects,
    };
  }, [moduleCards]);

  const getRect = useCallback(
    (id: string) => {
      const base = baseRects[id]!;
      const offset = nodeOffsets[id] ?? { x: 0, y: 0 };
      return { ...base, x: base.x + offset.x, y: base.y + offset.y };
    },
    [baseRects, nodeOffsets],
  );

  const currentRect = getRect("current");
  const coreRect = getRect("core");
  const controlsRect = getRect("controls");
  const outcomesRect = getRect("outcomes");
  const moduleRects = moduleCards.map(({ module }) => ({
    id: `module-${module.id}`,
    rect: getRect(`module-${module.id}`),
  }));
  const edgePaths = buildEdgePaths({
    currentRect,
    coreRect,
    controlsRect,
    outcomesRect,
    moduleRects,
    providerCount: displayProviders.length,
  });

  const fitView = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const scale = Math.min((bounds.width - 56) / board.width, (bounds.height - 56) / board.height, 1);
    setView({
      scale: Math.max(0.48, scale),
      x: Math.max(28, (bounds.width - board.width * scale) / 2),
      y: Math.max(28, (bounds.height - board.height * scale) / 2),
    });
  }, [board.height, board.width]);

  useEffect(() => {
    fitView();
  }, [fitView]);

  const centerRect = useCallback(
    (rect: Rect, scale = view.scale) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const bounds = viewport.getBoundingClientRect();
      setView({
        scale,
        x: bounds.width / 2 - (rect.x + rect.width / 2) * scale,
        y: bounds.height / 2 - (rect.y + rect.height / 2) * scale,
      });
    },
    [view.scale],
  );

  const zoomTo = useCallback((nextScale: number, anchor?: Point) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const point = anchor ?? { x: bounds.width / 2, y: bounds.height / 2 };
    const scale = clamp(nextScale, 0.5, 1.8);
    setView((current) => {
      const worldX = (point.x - current.x) / current.scale;
      const worldY = (point.y - current.y) / current.scale;
      return {
        scale,
        x: point.x - worldX * scale,
        y: point.y - worldY * scale,
      };
    });
  }, []);

  const exportCanvas = useCallback(() => {
    const svg = buildExportSvg({
      board,
      edgePaths,
      currentRect,
      coreRect,
      controlsRect,
      outcomesRect,
      modules: moduleCards.map((card) => ({
        label: shortModuleLabel(card.module.label),
        providers: card.providers.map((provider) => provider.name),
        rect: getRect(`module-${card.module.id}`),
      })),
      providers: displayProviders.map(({ provider }) => provider.name),
      outcomes: topOutcomes,
      controls: recommendation.compliance.slice(0, 6).map((control) => control.label),
      polygonStackItems: polygonStackItems.map((provider) => provider.name),
    });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "polygon-oms-canvas.svg";
    link.click();
    URL.revokeObjectURL(url);
  }, [
    board,
    edgePaths,
    currentRect,
    coreRect,
    controlsRect,
    outcomesRect,
    moduleCards,
    getRect,
    displayProviders,
    topOutcomes,
    recommendation.compliance,
    polygonStackItems,
  ]);

  useEffect(() => {
    window.addEventListener("oms:export-canvas", exportCanvas);
    return () => window.removeEventListener("oms:export-canvas", exportCanvas);
  }, [exportCanvas]);

  const onViewportPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    panRef.current = {
      start: { x: event.clientX, y: event.clientY },
      view,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Programmatic QA events may not have an active pointer; real pointer input still captures.
    }
  };

  const onViewportPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan) return;
    setView({
      ...pan.view,
      x: pan.view.x + event.clientX - pan.start.x,
      y: pan.view.y + event.clientY - pan.start.y,
    });
  };

  const stopPan = () => {
    panRef.current = null;
  };

  const onViewportWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    zoomTo(view.scale * (event.deltaY > 0 ? 0.92 : 1.08), {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

  const onNodePointerDown = (event: PointerEvent<HTMLElement>, id: string) => {
    if (locked || event.button !== 0) return;
    event.stopPropagation();
    dragRef.current = {
      id,
      start: { x: event.clientX, y: event.clientY },
      offset: nodeOffsets[id] ?? { x: 0, y: 0 },
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Programmatic QA events may not have an active pointer; real pointer input still captures.
    }
  };

  const onNodePointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaX = (event.clientX - drag.start.x) / view.scale;
    const deltaY = (event.clientY - drag.start.y) / view.scale;
    setNodeOffsets((current) => ({
      ...current,
      [drag.id]: { x: drag.offset.x + deltaX, y: drag.offset.y + deltaY },
    }));
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  return (
    <section className="canvasShell">
      <div className="canvasToolbar">
        <div className="canvasCrumb">
          <span className="miniMark" />
          <strong>Polygon OMS</strong>
          <em>Draft</em>
          <small>{providerCount} provider inputs priced</small>
        </div>
        <div className="canvasTools">
          <span>View</span>
          <button type="button">Logical <ChevronDown size={14} /></button>
          <span>Environment</span>
          <button type="button">Production <ChevronDown size={14} /></button>
          <button className="squareTool" type="button" onClick={fitView} aria-label="Fit view"><Expand size={15} /></button>
          <button className="squareTool" type="button" onClick={() => centerRect(coreRect, 1.08)} aria-label="Focus OMS core"><Search size={15} /></button>
          <button
            className={`squareTool ${locked ? "active" : ""}`}
            type="button"
            onClick={() => setLocked((current) => !current)}
            aria-label={locked ? "Unlock node dragging" : "Lock node dragging"}
          >
            <LockKeyhole size={15} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`canvasViewport ${locked ? "locked" : ""}`}
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        onWheel={onViewportWheel}
      >
        <div
          className="canvasWorld"
          style={{
            width: board.width,
            height: board.height,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          }}
        >
          <div className="canvasBoard">
            <svg className="canvasEdges" width={board.width} height={board.height} viewBox={`0 0 ${board.width} ${board.height}`} aria-hidden="true">
              {edgePaths.map((edge) => (
                <path key={edge.id} className={edge.className} d={edge.d} />
              ))}
            </svg>

            <motion.article
              className="stackNode currentStackNode draggableNode"
              style={nodeStyle(currentRect)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onPointerDown={(event) => onNodePointerDown(event, "current")}
              onPointerMove={onNodePointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <span className="nodeKicker">{input.mode === "launch" ? "Benchmark stack" : "Current stack"}</span>
              <small>{providerCount} providers</small>
              <div className="stackProviderList">
                {displayProviders.map(({ provider, module }) => {
                  const Icon = moduleIcons[module.id] ?? WalletCards;
                  return (
                    <span key={provider.id}><Icon size={14} />{provider.name}</span>
                  );
                })}
                {hiddenProviderCount > 0 && (
                  <span className="stackMore">+ {hiddenProviderCount} more selected</span>
                )}
                {displayProviders.length === 0 && (
                  <span className="stackEmpty">No point providers selected</span>
                )}
              </div>
            </motion.article>

            {moduleCards.map(({ module, providers, annualCost }, index) => {
              const Icon = moduleIcons[module.id] ?? Boxes;
              const rect = getRect(`module-${module.id}`);
              return (
                <motion.article
                  key={module.id}
                  className="stackNode moduleStackNode draggableNode"
                  style={nodeStyle(rect)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onPointerDown={(event) => onNodePointerDown(event, `module-${module.id}`)}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                >
                  <Icon size={18} />
                  <span>{shortModuleLabel(module.label)}</span>
                  <small>{providers.length} {providers.length === 1 ? "provider" : "providers"}{annualCost > 0 ? ` · ${formatMoney(annualCost)}/yr` : ""}</small>
                  {providers.slice(0, 2).map((provider) => (
                    <b key={provider.id}>{provider.name}</b>
                  ))}
                  {providers.length === 0 && (
                    <b className="modulePlaceholder">OMS module planned</b>
                  )}
                </motion.article>
              );
            })}

            <motion.article
              className="omsCoreNode draggableNode"
              style={nodeStyle(coreRect)}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onPointerDown={(event) => onNodePointerDown(event, "core")}
              onPointerMove={onNodePointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <div className="omsCoreTitle">
                <span className="miniMark" />
                <strong>Polygon OMS Orchestration</strong>
              </div>
              <div className="omsCoreGrid">
                <span><Crosshair size={15} />Policy & routing</span>
                <span><Database size={15} />Reconciliation</span>
                <span><WalletCards size={15} />Ledger & balances</span>
                <span><ShieldCheck size={15} />Risk & monitoring</span>
                <span><GitBranch size={15} />Counterparty mgmt</span>
                <span><Boxes size={15} />Workflow engine</span>
              </div>
              {polygonStackItems.length > 0 && (
                <div className="polygonStackStrip">
                  <small>Integrated Polygon stack</small>
                  <div>
                    {polygonStackItems.map((provider) => (
                      <span key={provider.id}>{provider.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.article>

            <motion.article
              className="controlsNode draggableNode"
              style={nodeStyle(controlsRect)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              onPointerDown={(event) => onNodePointerDown(event, "controls")}
              onPointerMove={onNodePointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <span className="nodeKicker"><ShieldCheck size={15} /> Compliance controls</span>
              <div>
                {recommendation.compliance.slice(0, 6).map((control) => (
                  <span key={control.id}>{control.label}</span>
                ))}
              </div>
            </motion.article>

            <motion.article
              className="outcomesNode draggableNode"
              style={nodeStyle(outcomesRect)}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 }}
              onPointerDown={(event) => onNodePointerDown(event, "outcomes")}
              onPointerMove={onNodePointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <span className="nodeKicker"><ShieldCheck size={15} /> Outcomes</span>
              {topOutcomes.map((item) => (
                <p key={item}><CheckCircle2 size={16} />{item}</p>
              ))}
            </motion.article>

          </div>
        </div>
        <div className="canvasZoom" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={fitView} aria-label="Fit canvas"><Expand size={14} /></button>
          <button type="button" onClick={() => zoomTo(view.scale - 0.1)} aria-label="Zoom out">−</button>
          <strong>{Math.round(view.scale * 100)}%</strong>
          <button type="button" onClick={() => zoomTo(view.scale + 0.1)} aria-label="Zoom in">+</button>
          <button
            type="button"
            className={locked ? "active" : ""}
            onClick={() => setLocked((current) => !current)}
            aria-label={locked ? "Unlock node dragging" : "Lock node dragging"}
          >
            <LockKeyhole size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function nodeStyle(rect: Rect) {
  return {
    left: rect.x,
    top: rect.y,
    width: rect.width,
  };
}

function buildEdgePaths({
  currentRect,
  coreRect,
  controlsRect,
  outcomesRect,
  moduleRects,
  providerCount,
}: {
  currentRect: Rect;
  coreRect: Rect;
  controlsRect: Rect;
  outcomesRect: Rect;
  moduleRects: Array<{ id: string; rect: Rect }>;
  providerCount: number;
}) {
  const coreIn = { x: coreRect.x, y: coreRect.y + 54 };
  const currentOut = { x: currentRect.x + currentRect.width, y: currentRect.y + 242 };
  const paths = [
    {
      id: "current-core",
      className: "softEdge",
      d: curve(currentOut, coreIn, 0.58),
    },
  ];

  for (let index = 0; index < Math.min(providerCount, 8); index += 1) {
    paths.push({
      id: `provider-${index}`,
      className: "dashedEdge",
      d: curve(
        {
          x: currentRect.x + currentRect.width,
          y: currentRect.y + 72 + index * 46,
        },
        coreIn,
        0.62,
      ),
    });
  }

  for (const item of moduleRects) {
    paths.push({
      id: item.id,
      className: "primaryEdge",
      d: curve(
        { x: item.rect.x + item.rect.width / 2, y: item.rect.y + item.rect.height },
        { x: coreRect.x + coreRect.width / 2, y: coreRect.y },
        0.34,
      ),
    });
  }

  paths.push(
    {
      id: "core-outcomes",
      className: "primaryEdge",
      d: curve(
        { x: coreRect.x + coreRect.width, y: coreRect.y + coreRect.height / 2 },
        { x: outcomesRect.x, y: outcomesRect.y + outcomesRect.height / 2 },
        0.5,
      ),
    },
    {
      id: "core-controls",
      className: "primaryEdge",
      d: curve(
        { x: coreRect.x + coreRect.width / 2, y: coreRect.y + coreRect.height },
        { x: controlsRect.x + controlsRect.width / 2, y: controlsRect.y },
        0.5,
      ),
    },
    {
      id: "core-controls-left",
      className: "softEdge",
      d: curve(
        { x: coreRect.x + coreRect.width * 0.28, y: coreRect.y + coreRect.height },
        { x: controlsRect.x + controlsRect.width * 0.28, y: controlsRect.y },
        0.45,
      ),
    },
    {
      id: "core-controls-right",
      className: "softEdge",
      d: curve(
        { x: coreRect.x + coreRect.width * 0.72, y: coreRect.y + coreRect.height },
        { x: controlsRect.x + controlsRect.width * 0.72, y: controlsRect.y },
        0.45,
      ),
    },
  );

  return paths;
}

function curve(start: Point, end: Point, tension: number) {
  const dx = Math.abs(end.x - start.x) * tension;
  const dy = Math.abs(end.y - start.y) * tension;
  const c1 = {
    x: start.x + (end.x >= start.x ? dx : -dx),
    y: start.y + (end.y === start.y ? 0 : dy * 0.18),
  };
  const c2 = {
    x: end.x - (end.x >= start.x ? dx : -dx),
    y: end.y - (end.y === start.y ? 0 : dy * 0.18),
  };
  return `M ${round(start.x)} ${round(start.y)} C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(end.x)} ${round(end.y)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function buildModuleCards(
  requiredModules: OMSModule[],
  groups: ReturnType<typeof groupProvidersByModule>,
  recommendation: Recommendation,
) {
  const byId = new Map<string, { module: OMSModule; providers: OMSModule["providers"]; annualCost: number }>();
  const moduleCost = new Map<string, number>();

  for (const line of recommendation.costModel.providerCostLines) {
    moduleCost.set(line.moduleId, (moduleCost.get(line.moduleId) ?? 0) + line.annualCost);
  }

  for (const module of requiredModules) {
    byId.set(module.id, {
      module,
      providers: module.providers.filter((provider) => provider.polygonOwned),
      annualCost: moduleCost.get(module.id) ?? 0,
    });
  }

  for (const group of groups) {
    byId.set(group.module.id, {
      module: group.module,
      providers: group.providers.filter((provider) => !provider.polygonOwned),
      annualCost: moduleCost.get(group.module.id) ?? 0,
    });
  }

  return Array.from(byId.values())
    .sort((a, b) => {
      const priorityDelta = modulePriority(a.module.id) - modulePriority(b.module.id);
      if (priorityDelta !== 0) return priorityDelta;
      return b.providers.length - a.providers.length;
    })
    .slice(0, 4);
}

function modulePriority(moduleId: string) {
  const order = [
    "wallet-infra",
    "stablecoin-orchestration",
    "ramps",
    "cross-border",
    "settlement-chain",
    "identity",
    "card-issuing",
    "yield-treasury",
    "crosschain",
    "blockchain-integration",
    "cdk",
    "compliance-security",
  ];
  const index = order.indexOf(moduleId);
  return index === -1 ? order.length : index;
}

function buildOutcomes(input: StudioInput, recommendation: Recommendation) {
  const cost = recommendation.costModel;
  const settlementText =
    input.settlementDays > 1
      ? `${input.settlementDays}-day settlement drag modeled`
      : "Same-day settlement target";
  return [
    settlementText,
    `${formatMoney(cost.feeDelta)} provider fee reduction`,
    `${cost.integrationComplexityReduction}% complexity reduction`,
    `${input.reconciliationFeeds} reconciliation feeds unified`,
    input.corridors ? `${compactCorridors(input.corridors)} corridors` : "Selected corridors covered",
  ];
}

function compactCorridors(corridors: string) {
  const parts = corridors
    .split(/,|→|->| to /i)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length <= 3) return corridors;
  return `${parts.slice(0, 3).join(", ")} +${parts.length - 3}`;
}

function shortModuleLabel(label: string) {
  return label
    .replace("Cash Ramps and On/Off-Ramp", "Cash Ramps")
    .replace("Cross-Border Payments", "Cross-Border Payments")
    .replace("Stablecoin Orchestration", "Stablecoin Orchestration")
    .replace("Wallet Infrastructure", "Wallet Infrastructure")
    .replace("Card Issuing / BaaS", "Card Issuing")
    .replace("Yield / Treasury", "Yield / Treasury")
    .replace("Settlement Chain", "Settlement Chain");
}

function buildPolygonStackItems(requiredModules: OMSModule[]) {
  const seen = new Set<string>();
  return requiredModules
    .flatMap((module) => module.providers.filter((provider) => provider.polygonOwned))
    .filter((provider) => {
      if (seen.has(provider.id)) return false;
      seen.add(provider.id);
      return true;
    })
    .sort((a, b) => polygonStackPriority(a.id) - polygonStackPriority(b.id))
    .slice(0, 8);
}

function polygonStackPriority(providerId: string) {
  const order = [
    "sequence",
    "coinme",
    "agglayer",
    "sequence-trails",
    "polygon-pos",
    "polygon-cdk",
    "vaultbridge",
    "polygon-id",
    "polygon-id-identity",
  ];
  const index = order.indexOf(providerId);
  return index === -1 ? order.length : index;
}

function buildExportSvg({
  board,
  edgePaths,
  currentRect,
  coreRect,
  controlsRect,
  outcomesRect,
  modules,
  providers,
  outcomes,
  controls,
  polygonStackItems,
}: {
  board: { width: number; height: number };
  edgePaths: Array<{ id: string; className: string; d: string }>;
  currentRect: Rect;
  coreRect: Rect;
  controlsRect: Rect;
  outcomesRect: Rect;
  modules: Array<{ label: string; providers: string[]; rect: Rect }>;
  providers: string[];
  outcomes: string[];
  controls: string[];
  polygonStackItems: string[];
}) {
  const node = (rect: Rect, title: string, lines: string[]) => `
    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="10" fill="#ffffff" stroke="#dce4f1"/>
    <text x="${rect.x + 16}" y="${rect.y + 26}" font-family="Arial" font-size="12" font-weight="700" fill="#64708a">${escapeXml(title)}</text>
    ${lines.slice(0, 8).map((line, index) => `
      <text x="${rect.x + 16}" y="${rect.y + 54 + index * 22}" font-family="Arial" font-size="13" fill="#172036">${escapeXml(line)}</text>
    `).join("")}
  `;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${board.width}" height="${board.height}" viewBox="0 0 ${board.width} ${board.height}">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#d7e2f5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#fbfdff"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  ${edgePaths.map((edge) => `<path d="${edge.d}" fill="none" stroke="${edge.className === "primaryEdge" ? "#6b3df4" : "#9eabd0"}" stroke-width="1.6" stroke-dasharray="${edge.className === "dashedEdge" ? "4 5" : "0"}"/>`).join("")}
  ${node(currentRect, "CURRENT STACK", providers)}
  ${modules.map((item) => node(item.rect, item.label.toUpperCase(), item.providers.length ? item.providers : ["OMS module planned"])).join("")}
  ${node(coreRect, "POLYGON OMS ORCHESTRATION", ["Policy & routing", "Reconciliation", "Ledger & balances", "Risk & monitoring", "Counterparty mgmt", "Workflow engine", ...polygonStackItems.slice(0, 4)])}
  ${node(controlsRect, "COMPLIANCE CONTROLS", controls)}
  ${node(outcomesRect, "OUTCOMES", outcomes)}
</svg>`.trim();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
