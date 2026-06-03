import { useEffect } from 'react';
import useStore from '../store/useStore';

export function useFiles(parentId) {
  const { items, isLoading, error, loadItems } = useStore();

  useEffect(() => {
    loadItems(parentId);
  }, [parentId]);

  return { items, isLoading, error, reload: () => loadItems(parentId) };
}
