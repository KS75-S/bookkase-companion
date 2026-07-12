import type { BookStatus, JourneyEntryType, ProgressType } from "./schema";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  total_pages: number | null;
  total_chapters: number | null;
  total_duration_seconds: number | null;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  progress_type: ProgressType | null;
  progress_value: string | null;
  updated_at: string;
  book?: Book | null;
}

export interface JourneyEntry {
  id: string;
  user_id: string;
  book_id: string | null;
  source: string;
  entry_type: JourneyEntryType;
  progress_type: ProgressType | null;
  progress_value: string | null;
  note: string | null;
  tags: string[] | null;
  moment_type: string | null;
  created_at: string;
  updated_at: string;
  book?: Book | null;
}

export interface ReadingPlanEntry {
  id: string;
  user_id: string;
  book_id: string;
  scheduled_month: number;
  scheduled_year: number;
  position?: number | null;
  created_at?: string | null;
  book?: Book | null;
}



