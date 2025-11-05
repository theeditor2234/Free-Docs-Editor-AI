import type { ReactNode } from 'react';
import type { ToolId } from './constants';

export interface Tool {
  id: ToolId;
  title: string;
  description: string;
  icon: ReactNode;
  accept: string;
  category: 'PDF' | 'Image' | 'AI Tools';
}
