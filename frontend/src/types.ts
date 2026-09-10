export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  preferences: {
    routine_learning?: boolean;
    location_analysis?: boolean;
    photo_analysis?: boolean;
    ai_personalization?: boolean;
    morning_briefing?: boolean;
  };
  created_at: string;
}

export interface StatusHistoryItem {
  status: string;
  progress: number;
  message: string;
  timestamp: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  input_type: "text" | "voice" | "photo";
  title?: string;
  raw_text?: string;
  transcript?: string;
  media_path?: string;
  photo_urls: string[];
  generated_content?: string;
  category: string;
  mood?: string;
  status: string;
  confidence: number;
  status_history: StatusHistoryItem[];
  disambiguation?: {
    entity: string;
    question: string;
    options: string[];
  };
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface Commitment {
  id: string;
  user_id: string;
  diary_entry_id?: string;
  description: string;
  project?: string;
  due_date?: string;
  confidence: number;
  status: "PENDING" | "COMPLETED" | "RESCHEDULED" | "DISMISSED";
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  activity: string;
  location?: string;
  pattern: string;
  frequency: string;
  details?: string;
  occurrence_count: number;
  confidence: number;
  last_observed: string;
  is_active: boolean;
  deviation_prompt?: string;
  deviation_active: boolean;
}

export interface InsightsData {
  routines: Routine[];
  total_memories: number;
  mood_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  top_people: Array<{ name: string; count: number }>;
  top_places: Array<{ name: string; count: number }>;
  commitments_summary: {
    pending: number;
    completed: number;
    total: number;
  };
  ai_observations: string[];
}


export interface GraphNode {
  id: string;
  label: string;
  type: "User" | "Person" | "Place" | "Project" | "Commitment" | "Activity";
  attributes?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
}

export interface LifeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ForgettingItem {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  priority: string;
  source_entry_id?: string;
  days_ago_mentioned: number;
  reason: string;
}

export interface ForgettingResponse {
  headline: string;
  items: ForgettingItem[];
}

export interface ConversationalAnswer {
  query: string;
  answer: string;
  source_entry_id?: string;
  related_entries: Array<{
    entry_id: string;
    title: string;
    snippet: string;
    category: string;
    date: string;
    score: number;
  }>;
  related_entities: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  channel: string;
  is_read: boolean;
  created_at: string;
}

export interface SystemMetrics {
  total_users: number;
  total_entries: number;
  total_commitments: number;
  active_routines: number;
  avg_processing_latency_ms: number;
  ai_success_rate: number;
  stt_success_rate: number;
  queue_depth: number;
  failed_jobs_count: number;
  routine_false_positive_rate: number;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface PhotoItem {
  id: string;
  entry_id: string;
  url: string;
  title: string;
  date: string;
  category: string;
  mood?: string;
  caption?: string;
}

export interface PersonEntity {
  name: string;
  type: string;
  count: number;
  last_seen: string;
  memories: Array<{ id: string; title: string; date: string; photos?: string[] }>;
  relationships: string[];
}

export interface PlaceEntity {
  name: string;
  type: string;
  count: number;
  last_visited: string;
  memories: Array<{ id: string; title: string; date: string; photos?: string[] }>;
  photos: string[];
}

export interface PeopleAndPlacesData {
  people: PersonEntity[];
  places: PlaceEntity[];
}

export interface CalendarDayEntry {
  id: string;
  title: string;
  category: string;
  mood?: string;
  generated_content?: string;
  raw_text?: string;
  photo_urls: string[];
  entry_date: string;
}

export interface CalendarDayCommitment {
  id: string;
  description: string;
  project?: string;
  status: string;
  due_date?: string;
  priority?: string;
}

export interface CalendarDayData {
  date: string;
  day: number;
  has_entry: boolean;
  entries_count: number;
  dominant_mood?: string | null;
  is_special: boolean;
  special_badge?: string | null;
  entries: CalendarDayEntry[];
  commitments_count: number;
  commitments: CalendarDayCommitment[];
}

export interface SpecialMemoryItem {
  id: string;
  title: string;
  date: string;
  badge: string;
  summary: string;
  photo_url: string;
  category: string;
  mood: string;
  people: string[];
}

export interface CalendarResponse {
  year: number;
  month: number;
  month_name: string;
  first_weekday: number;
  days: CalendarDayData[];
  monthly_specials: SpecialMemoryItem[];
  yearly_specials: SpecialMemoryItem[];
  annual_story: string;
}

