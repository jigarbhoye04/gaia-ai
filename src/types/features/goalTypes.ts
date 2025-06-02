export interface GoalData {
  id: string;
  created_at: Date;
  title: string;
  description: string;
  progress: number;
  roadmap: {
    title?: string;
    description?: string;
    nodes?: Array<NodeType>;
    edges?: Array<EdgeType>;
  };
}

export interface EdgeType extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
}

export interface NodeType {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData extends Record<string, unknown> {
  id: string;
  goalId?: string;
  label: string;
  details: string[];
  estimatedTime: string[];
  resources: string[];
  isComplete: boolean;
}
