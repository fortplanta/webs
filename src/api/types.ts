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

export interface FragmentSlot {
  type: "body" | "image" | "tags" | "list" | "disclaimer";
  content?: string;   // body text, image url, or disclaimer text
  items?: string[];   // tags array or list items array
}

export interface Fragment {
  id: string;
  type: FragmentType;
  layout: LayoutType;    // assigned client-side via LAYOUT_FOR_TYPE, not by API
  title: string;
  slots: FragmentSlot[];
  createdAtZoom: number; // zoom level at time of creation
  starred: boolean;
}

export interface Cluster {
  id: string;
  x: number;             // canvas-space position
  y: number;
  title: string;
  isSeed: boolean;
  fragments: Fragment[];
}

export interface Edge {
  id: string;
  sourceClusterId: string;
  targetClusterId: string;
  label: string;         // verb phrase: "shaped by", "resulted in", etc.
}

export interface CanvasState {
  clusters: Cluster[];
  edges: Edge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  query: string;
  createdAt: number;
}

// Shape of each session stored in localStorage
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
    source: string;  // cluster title
    target: string;  // cluster title
    label: string;
  }>;
}
