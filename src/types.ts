export interface Book {
  id: string;
  title: string;
  author?: string;
  file_path: string;
  cover_path?: string;
  total_pages?: number;
  current_page: number;
  reading_progress: number;
  is_finished: boolean;
  date_added: string;
  last_opened?: string;
  google_drive_file_id?: string;
}

export interface Bookmark {
  id: number;
  book_id: string;
  page_number: number;
  percentage: number;
  note?: string;
  created_at: string;
}

export interface ReaderSettings {
  darkMode: boolean;
  fontSize: number;
  screenOrientation: 'auto' | 'portrait' | 'landscape';
  brightness?: number;
}

export interface FilterOptions {
  searchQuery: string;
  sortBy: 'recentlyAdded' | 'recentlyRead' | 'titleAsc' | 'titleDesc';
  showFinished: boolean;
}