export interface FileItem {
  id: number;
  telegram_message_id?: number;
  telegram_document_id?: string;
  name: string;
  size: number;
  mime_type: string;
  is_folder: number;
  parent_id: number | null;
  owner_phone: string;
  access_hash?: string;
  file_reference?: string;
  dc_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Breadcrumb {
  id: number | 'root';
  name: string;
}

export interface Stats {
  files: number;
  folders: number;
  usedSpace: number;
}

export interface FilesResponse {
  items: FileItem[];
  breadcrumbs: Breadcrumb[];
  stats: Stats;
}

export interface Account {
  user_phone: string;
  created_at: string;
}

export interface ShareLink {
  token: string;
  url: string;
  expires_at: string | null;
}

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  speed: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export type SortField = 'name' | 'size' | 'updated_at';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type ThemeMode = 'light' | 'dark' | 'system';
