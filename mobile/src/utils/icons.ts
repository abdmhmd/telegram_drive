import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { FileItem } from '../types';
import { getMimeCategory } from './formatters';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export const getFileIcon = (item: FileItem): IconName => {
  if (item.is_folder) return 'folder';

  const category = getMimeCategory(item.mime_type);
  switch (category) {
    case 'image':
      return 'file-image';
    case 'video':
      return 'file-video';
    case 'audio':
      return 'file-music';
    case 'pdf':
      return 'file-pdf-box';
    case 'text':
      return 'file-document-edit';
    case 'archive':
      return 'zip-box';
    case 'document':
      return 'file-document';
    default:
      return 'file-outline';
  }
};

export const getFileColor = (item: FileItem): string => {
  if (item.is_folder) return '#FFA726';
  const category = getMimeCategory(item.mime_type);
  switch (category) {
    case 'image': return '#42A5F5';
    case 'video': return '#AB47BC';
    case 'audio': return '#FF7043';
    case 'pdf': return '#EF5350';
    case 'text': return '#66BB6A';
    case 'archive': return '#8D6E63';
    case 'document': return '#78909C';
    default: return '#90A4AE';
  }
};
