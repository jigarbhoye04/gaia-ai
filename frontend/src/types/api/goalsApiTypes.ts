export interface Goal {
  id: string;
  title: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoalCreate {
  title: string;
  description?: string;
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  status?: string;
  roadmap?: unknown;
}
