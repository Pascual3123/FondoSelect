export type AspectRatioType = '16:9' | '9:16' | '21:9';

export type WallpaperCategory = 
  | 'todos'
  | 'minimalista'
  | 'nord'
  | 'gruvbox'
  | 'oled'
  | 'paisajes'
  | 'cyber'
  | 'arquitectura'
  | 'abstracto'
  | 'calm';

export interface Wallpaper {
  id: string;
  title: string;
  category: WallpaperCategory;
  aspectRatio: AspectRatioType;
  resolution: string; // e.g. "3840 × 2160"
  tags: string[];
  author: string;
  authorHandle: string;
  sourceRepo?: string;
  downloads: number;
  likes: number;
  fileSize: string;
  palette: string[]; // hex codes
  imageUrl: string;
  accentColor: string;
  deviceType: 'desktop' | 'mobile' | 'ultrawide';
}

export interface CuratedPack {
  id: string;
  title: string;
  description: string;
  category: WallpaperCategory;
  wallpaperIds: string[];
  itemCount: number;
  coverImage: string;
  accent: string;
  totalSize: string;
  author: string;
}

export interface PackItem {
  wallpaper: Wallpaper;
  addedAt: number;
}
