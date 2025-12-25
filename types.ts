
export enum PresentationFramework {
  REVEAL_JS = 'Reveal.js',
  IMPRESS_JS = 'Impress.js',
  BESPOKE_JS = 'Bespoke.js',
  CUSTOM = 'Custom HTML',
}

export enum PrivacyMode {
  PUBLIC = 'Public',
  UNLISTED = 'Unlisted',
  PRIVATE = 'Private',
  SAMPLE_OBFUSCATED = 'Sample (Obfuscated)',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'Free' | 'Pro' | 'Team';
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  thumbnailUrl: string; // Placeholder or generated
  slides: string[]; // Array of HTML strings, one per slide
  framework: PresentationFramework;
  privacy: PrivacyMode;
  views: number;
  uploadedAt: string;
  tags: string[];
}

export interface AnalyticsData {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export interface SlideEngagement {
  slide: number;
  seconds: number;
}

export type ViewState = 'HOME' | 'UPLOAD' | 'PLAYER' | 'ANALYTICS';

// New Types for AI Creator
export interface AIOutlineItem {
  id: string;
  title: string;
  purpose: string;
  type: string;
}

export interface DesignSystem {
  summary: string;
  colorPalette: string[];
  typography: string;
}
