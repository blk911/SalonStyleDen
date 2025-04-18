declare module 'd3-force' {
  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
  }

  export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
    source: NodeDatum | string | number;
    target: NodeDatum | string | number;
    index?: number;
  }

  export interface Simulation<NodeDatum extends SimulationNodeDatum> {
    restart(): this;
    stop(): this;
    tick(): this;
    nodes(): NodeDatum[];
    nodes(nodes: NodeDatum[]): this;
    alpha(): number;
    alpha(alpha: number): this;
    alphaMin(): number;
    alphaMin(min: number): this;
    alphaDecay(): number;
    alphaDecay(decay: number): this;
    alphaTarget(): number;
    alphaTarget(target: number): this;
    velocityDecay(): number;
    velocityDecay(decay: number): this;
    force(name: string): Force<NodeDatum>;
    force(name: string, force: Force<NodeDatum> | null): this;
    find(x: number, y: number, radius?: number): NodeDatum | undefined;
    on(typenames: string): (this: this, event: any, d: NodeDatum) => void;
    on(typenames: string, listener: null): this;
    on(typenames: string, listener: (this: this, event: any, d: NodeDatum) => void): this;
  }

  export interface Force<NodeDatum extends SimulationNodeDatum> {
    (alpha: number): void;
    initialize?(nodes: NodeDatum[]): void;
  }

  export function forceSimulation<NodeDatum extends SimulationNodeDatum>(nodes?: NodeDatum[]): Simulation<NodeDatum>;
  
  export interface ForceLink<NodeDatum extends SimulationNodeDatum, LinkDatum extends SimulationLinkDatum<NodeDatum>> extends Force<NodeDatum> {
    links(): LinkDatum[];
    links(links: LinkDatum[]): this;
    id(): (d: NodeDatum) => string | number;
    id(id: (d: NodeDatum) => string | number): this;
    distance(): (d: LinkDatum) => number;
    distance(distance: number | ((d: LinkDatum) => number)): this;
    strength(): (d: LinkDatum) => number;
    strength(strength: number | ((d: LinkDatum) => number)): this;
    iterations(): number;
    iterations(iterations: number): this;
  }

  export function forceLink<NodeDatum extends SimulationNodeDatum, LinkDatum extends SimulationLinkDatum<NodeDatum>>(links?: LinkDatum[]): ForceLink<NodeDatum, LinkDatum>;
  
  export interface ForceManyBody<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    strength(): (d: NodeDatum) => number;
    strength(strength: number | ((d: NodeDatum) => number)): this;
    theta(): number;
    theta(theta: number): this;
    distanceMin(): number;
    distanceMin(distance: number): this;
    distanceMax(): number;
    distanceMax(distance: number): this;
  }

  export function forceManyBody<NodeDatum extends SimulationNodeDatum>(): ForceManyBody<NodeDatum>;
  
  export interface ForceCenter<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    x(): number;
    x(x: number): this;
    y(): number;
    y(y: number): this;
  }

  export function forceCenter<NodeDatum extends SimulationNodeDatum>(x?: number, y?: number): ForceCenter<NodeDatum>;
  
  export interface ForceX<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    x(): (d: NodeDatum) => number;
    x(x: number | ((d: NodeDatum) => number)): this;
    strength(): (d: NodeDatum) => number;
    strength(strength: number | ((d: NodeDatum) => number)): this;
  }

  export function forceX<NodeDatum extends SimulationNodeDatum>(x?: number | ((d: NodeDatum) => number)): ForceX<NodeDatum>;
  
  export interface ForceY<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    y(): (d: NodeDatum) => number;
    y(y: number | ((d: NodeDatum) => number)): this;
    strength(): (d: NodeDatum) => number;
    strength(strength: number | ((d: NodeDatum) => number)): this;
  }

  export function forceY<NodeDatum extends SimulationNodeDatum>(y?: number | ((d: NodeDatum) => number)): ForceY<NodeDatum>;
  
  export function drag(): any;
}