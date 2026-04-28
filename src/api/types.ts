// All core types for Webs. Single source of truth for data shapes.

export type FragmentType =
  | "person"
  | "concept"
  | "thesis"
  | "source"
  | "event"
  | "era"
  | "domain"
  | "quote";

export type LayoutType =
  | "vertical-flow"
  | "image-hero"
  | "quote-centered"
  | "card-split"
  | "timeline"
  | "list-prominent";

export type ConnectorType = "tether" | "weak" | "standard" | "strong";

export interface FragmentSlot {
  type: "body" | "image" | "tags" | "list" | "disclaimer";
  content?: string;
  items?: string[];
}

export interface Fragment {
  id: string;
  clusterId: string;       // logical parent — never changes
  x: number;              // own canvas-space position (center)
  y: number;
  type: FragmentType;
  layout: LayoutType;
  title: string;
  slots: FragmentSlot[];
  createdAtZoom: number;
  starred: boolean;
}

export interface Cluster {
  id: string;
  x: number;              // canvas-space position (center)
  y: number;
  label: string;
  isSeed: boolean;
}

export interface Connector {
  id: string;
  sourceId: string;       // fragment id or cluster id
  targetId: string;       // fragment id or cluster id
  type: ConnectorType;
  label: string;          // editable verb phrase, empty by default
}

export interface CanvasState {
  clusters: Cluster[];
  fragments: Fragment[];
  connectors: Connector[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  query: string;
  createdAt: number;
}

export interface SessionRecord {
  id: string;
  title: string;
  createdAt: number;
  state: CanvasState;
}

// Raw API response shape before client-side processing
export interface GenerateApiResponse {
  context: string;
  clusters: Array<{
    title: string;
    fragments: Array<{
      type: FragmentType;
      title: string;
      slots: FragmentSlot[];
    }>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label: string;
  }>;
}
