declare module 'd3-selection' {
  export interface BaseType {}

  export interface Selection<GElement extends BaseType = BaseType, 
                           PDatum = any, 
                           PElement extends BaseType = BaseType, 
                           PDocument extends BaseType = BaseType> {
    attr(name: string): string;
    attr(name: string, value: null): this;
    attr(name: string, value: string | number | boolean): this;
    attr(name: string, value: (datum: PDatum, index: number, nodes: PElement[]) => string | number | boolean | null): this;

    style(name: string): string;
    style(name: string, value: null): this;
    style(name: string, value: string | number | boolean): this;
    style(name: string, value: (datum: PDatum, index: number, nodes: PElement[]) => string | number | boolean | null): this;

    property(name: string): any;
    property(name: string, value: null): this;
    property(name: string, value: any): this;
    property(name: string, value: (datum: PDatum, index: number, nodes: PElement[]) => any): this;

    classed(names: string): boolean;
    classed(names: string, value: boolean): this;
    classed(names: string, value: (datum: PDatum, index: number, nodes: PElement[]) => boolean): this;

    text(): string;
    text(value: null): this;
    text(value: string | number | boolean): this;
    text(value: (datum: PDatum, index: number, nodes: PElement[]) => string | number | boolean): this;

    html(): string;
    html(value: null): this;
    html(value: string): this;
    html(value: (datum: PDatum, index: number, nodes: PElement[]) => string): this;

    append<K extends keyof ElementTagNameMap>(type: K): Selection<ElementTagNameMap[K], PDatum, PElement, PDocument>;
    append(type: string): Selection<BaseType, PDatum, PElement, PDocument>;
    append(type: (datum: PDatum, index: number, nodes: PElement[]) => BaseType): Selection<BaseType, PDatum, PElement, PDocument>;

    remove(): this;

    data(): PDatum[];
    data<NewDatum>(data: NewDatum[]): Selection<GElement, NewDatum, PElement, PDocument>;
    data<NewDatum>(data: (datum: PDatum, index: number, nodes: GElement[]) => NewDatum): Selection<GElement, NewDatum, PElement, PDocument>;

    enter(): Selection<GElement, PDatum, PElement, PDocument>;
    exit(): Selection<GElement, PDatum, PElement, PDocument>;
    merge(other: Selection<GElement, PDatum, PElement, PDocument>): Selection<GElement, PDatum, PElement, PDocument>;
    
    call(fn: (selection: this, ...args: any[]) => void, ...args: any[]): this;

    selectAll(selector: string): Selection<BaseType, PDatum, GElement, PDocument>;
    
    select(selector: string): Selection<BaseType, PDatum, PElement, PDocument>;
    select(selector: (datum: PDatum, index: number, nodes: GElement[]) => BaseType): Selection<BaseType, PDatum, PElement, PDocument>;
  }

  export function select<GElement extends BaseType = BaseType>(selector: string | GElement): Selection<GElement, null, null, null>;
  export function selectAll<GElement extends BaseType = BaseType>(selector: string): Selection<GElement, null, null, null>;

  export interface DragBehavior<GElement extends BaseType, Datum, Subject> {
    (selection: Selection<GElement, Datum, any, any>): void;

    on(typenames: string): (this: GElement, event: any, d: Datum) => void;
    on(typenames: string, listener: null): this;
    on(typenames: string, listener: (this: GElement, event: any, d: Datum) => void): this;
  }

  export function drag<GElement extends BaseType, Datum, Subject>(): DragBehavior<GElement, Datum, Subject>;
}