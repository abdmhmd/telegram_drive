export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getMimeCategory = (mimeType: string): string => {
  if (!mimeType) return 'unknown';
  const primary = mimeType.split('/')[0];
  const secondary = mimeType.split('/')[1] || '';
  if (primary === 'image') return 'image';
  if (primary === 'video') return 'video';
  if (primary === 'audio') return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (primary === 'text') return 'text';
  if (secondary.includes('zip') || secondary.includes('rar') || secondary.includes('tar') || secondary.includes('7z') || secondary.includes('gzip')) return 'archive';
  if (primary === 'application') return 'document';
  return 'unknown';
};
