import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';
import FileItemComponent from '../components/FileItem';
import Breadcrumbs from '../components/Breadcrumbs';
import StorageBar from '../components/StorageBar';
import SearchBar from '../components/SearchBar';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import ContextMenu from '../components/ContextMenu';
import ShareModal from '../components/ShareModal';
import type { FileItem } from '../types';
import { getApiUrl } from '../api/client';

type Props = {
  navigation: any;
  route: any;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLS = SCREEN_WIDTH > 600 ? 4 : 2;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    items,
    breadcrumbs,
    stats,
    loading,
    uploading,
    uploadQueue,
    viewMode,
    currentFolderId,
    loadFolder,
    uploadFiles,
    deleteItem,
    renameItem,
    moveItem,
    createFolder,
    createShareLink,
    search,
    clearSearch,
    searchQuery,
    searchResults,
    isSearching,
    setViewMode,
    removeUpload,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [contextItem, setContextItem] = useState<FileItem | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [shareResult, setShareResult] = useState<{ url: string; expires_at: string | null } | null>(null);
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    loadFolder('root');
  }, []);

  const onRefresh = useCallback(async () => {
    console.log('[Dashboard] onRefresh — refreshing folder');
    setRefreshing(true);
    try {
      await loadFolder();
      console.log('[Dashboard] onRefresh — done');
    } catch (err: any) {
      console.error('[Dashboard] onRefresh — error:', err.message);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to refresh' });
    }
    setRefreshing(false);
  }, [currentFolderId]);

  const handleNavigate = (id: number | 'root' | null) => {
    console.log('[Dashboard] handleNavigate — to:', id);
    clearSearch();
    setLocalSearch('');
    loadFolder(id === 'root' ? 'root' : id);
  };

  const handleFilePress = (item: FileItem) => {
    console.log('[Dashboard] handleFilePress —', item.is_folder ? 'folder' : 'file', item.id, item.name);
    if (item.is_folder) {
      handleNavigate(item.id);
    } else {
      navigation.navigate('Preview', { itemId: item.id });
    }
  };

  const handleContextAction = async (action: string, item: FileItem) => {
    console.log('[Dashboard] handleContextAction —', action, 'on', item.id, item.name);
    switch (action) {
      case 'rename':
        setRenamingItem(item);
        setRenameValue(item.name);
        break;
      case 'move':
        navigation.navigate('MovePicker', { itemId: item.id });
        break;
      case 'delete':
        Alert.alert(
          'Delete',
          `Are you sure you want to delete "${item.name}"?${item.is_folder ? ' All contents will be deleted.' : ''}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('[Dashboard] delete confirmed —', item.id);
                  await deleteItem(item.id);
                  Toast.show({ type: 'success', text1: 'Deleted' });
                } catch (err: any) {
                  console.error('[Dashboard] delete failed —', err.message);
                  Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete' });
                }
              },
            },
          ]
        );
        break;
      case 'share':
        setShareResult(null);
        setShowShareModal(true);
        setContextItem(item);
        break;
    }
  };

  const handleRename = async () => {
    if (!renamingItem || !renameValue.trim()) return;
    console.log('[Dashboard] handleRename —', renamingItem.id, '->', renameValue.trim());
    try {
      await renameItem(renamingItem.id, renameValue.trim());
      setRenamingItem(null);
      Toast.show({ type: 'success', text1: 'Renamed' });
    } catch (err: any) {
      console.error('[Dashboard] handleRename failed —', err.message);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to rename' });
    }
  };

  const handleCreateShareLink = async (expiresInHours: number | null) => {
    if (!contextItem) return;
    console.log('[Dashboard] handleCreateShareLink — item:', contextItem.id, 'expiresInHours:', expiresInHours);
    setSharingLoading(true);
    try {
      const result = await createShareLink(contextItem.id, expiresInHours);
      console.log('[Dashboard] handleCreateShareLink — result:', result);
      setShareResult(result);
    } catch (err: any) {
      console.error('[Dashboard] handleCreateShareLink failed —', err.message);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create share link' });
    }
    setSharingLoading(false);
  };

  const prevUploadQueueRef = React.useRef(uploadQueue);

  useEffect(() => {
    const prev = prevUploadQueueRef.current;
    prevUploadQueueRef.current = uploadQueue;

    // Detect newly errored items and show a toast
    for (const item of uploadQueue) {
      const was = prev.find((p) => p.id === item.id);
      if (item.status === 'error' && (!was || was.status !== 'error')) {
        Toast.show({ type: 'error', text1: 'Upload failed', text2: item.fileName + ': ' + (item.error || 'Unknown error') });
      }
    }

    // Auto-close modal when all uploads finish (no pending/uploading items left)
    if (uploadQueue.length > 0 && !uploadQueue.some((u) => u.status === 'pending' || u.status === 'uploading')) {
      const allDone = uploadQueue.every((u) => u.status === 'done');
      setTimeout(() => {
        setShowUploadModal(false);
        if (allDone) {
          Toast.show({ type: 'success', text1: 'Upload complete', text2: `${uploadQueue.filter((u) => u.status === 'done').length} file(s) uploaded` });
        }
        // Clear done/error items after a brief pause
        uploadQueue.forEach((u) => removeUpload(u.id));
      }, 1500);
    }
  }, [uploadQueue]);

  const handleUploadOption = async (option: string) => {
    console.log('[Dashboard] handleUploadOption — option:', option);

    if (option === 'folder') {
      setShowUploadModal(false);
      setShowCreateFolder(true);
      return;
    }

    try {
      let files: { uri: string; name: string; mimeType: string }[] = [];

      if (option === 'gallery') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: true,
          quality: 1,
        });
        if (!result.canceled) {
          files = result.assets.map((a) => ({
            uri: a.uri,
            name: a.fileName || `photo_${Date.now()}.jpg`,
            mimeType: a.mimeType || 'image/jpeg',
          }));
        }
      } else if (option === 'camera') {
        const result = await ImagePicker.launchCameraAsync({
          quality: 1,
        });
        if (!result.canceled) {
          const asset = result.assets[0];
          files = [{
            uri: asset.uri,
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
          }];
        }
      } else if (option === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          multiple: true,
          copyToCacheDirectory: true,
        });
        if (!result.canceled) {
          files = result.assets.map((a) => ({
            uri: a.uri,
            name: a.name,
            mimeType: a.mimeType || 'application/octet-stream',
          }));
        }
      }

      console.log('[Dashboard] handleUploadOption — picked', files.length, 'files');
      if (files.length > 0) {
        const parentId = currentFolderId === 'root' ? null : (currentFolderId as number);
        uploadFiles(files, parentId);
      }
    } catch (err: any) {
      console.error('[Dashboard] handleUploadOption — error picking files:', err.message);
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to pick file' });
    }
  };

  const handleSearch = async () => {
    console.log('[Dashboard] handleSearch — query:', localSearch.trim());
    if (localSearch.trim()) {
      await search(localSearch.trim());
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    clearSearch();
  };

  const isSearchMode = searchQuery.length > 0;
  const displayItems = isSearchMode ? searchResults : items;

  const renderItem = ({ item }: { item: FileItem }) => (
    <FileItemComponent
      item={item}
      viewMode={isSearchMode ? 'list' : viewMode}
      onPress={handleFilePress}
      onMenuPress={(i) => {
        setContextItem(i);
        setShowContextMenu(true);
      }}
    />
  );

  const renderHeader = () => (
    <>
      <SearchBar
        value={localSearch}
        onChangeText={setLocalSearch}
        onSubmit={handleSearch}
        onClear={handleClearSearch}
        placeholder="Search files and folders..."
      />
      {!isSearchMode && (
        <>
          <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleNavigate} />
          {stats && <StorageBar usedSpace={stats.usedSpace} files={stats.files} folders={stats.folders} />}
        </>
      )}
      {isSearchMode && (
        <View style={[styles.searchHeader, { backgroundColor: colors.primaryContainer }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.primary} />
          <Text style={[styles.searchHeaderText, { color: colors.primary }]}>
            Search results for "{searchQuery}"
          </Text>
          <TouchableOpacity onPress={handleClearSearch}>
            <Text style={[styles.clearBtn, { color: colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isSearchMode && viewMode === 'grid' && (
        <View style={[styles.viewToggle, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <MaterialCommunityIcons name="view-list" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}
      {!isSearchMode && viewMode === 'list' && (
        <View style={[styles.viewToggle, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setViewMode('grid')}>
            <MaterialCommunityIcons name="grid" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name={isSearchMode ? 'file-search-outline' : 'folder-open-outline'} size={64} color={colors.onSurfaceVariant} />
        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {isSearchMode ? 'No results found' : 'This folder is empty'}
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
          {isSearchMode ? 'Try a different search term' : 'Tap + to upload files or create folders'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={displayItems}
          key={viewMode === 'grid' && !isSearchMode ? `grid-${GRID_COLS}` : 'list'}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={viewMode === 'grid' && !isSearchMode ? GRID_COLS : 1}
          contentContainerStyle={[
            styles.list,
            displayItems.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            !isSearchMode ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        />
      )}

      {/* FAB */}
      {!isSearchMode && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: uploading ? colors.onSurfaceVariant : colors.primary }]}
          onPress={() => { if (!uploading) setShowUploadModal(true); }}
          activeOpacity={uploading ? 1 : 0.8}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
          )}
        </TouchableOpacity>
      )}

      {/* Rename dialog */}
      {renamingItem && (
        <View style={styles.renameOverlay}>
          <View style={[styles.renameDialog, { backgroundColor: colors.surface }]}>
            <Text style={[styles.renameTitle, { color: colors.onSurface }]}>Rename</Text>
            <View style={[styles.renameInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <TextInput
                style={{ flex: 1, fontSize: 16, color: colors.onSurface }}
                value={renameValue}
                onChangeText={setRenameValue}
                autoFocus
              />
            </View>
            <View style={styles.renameButtons}>
              <TouchableOpacity onPress={() => setRenamingItem(null)} style={styles.renameBtn}>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename} style={[styles.renameBtn, { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 }]}>
                <Text style={{ color: colors.onPrimary, fontSize: 16, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modals */}
      <UploadModal
        visible={showUploadModal}
        uploading={uploading}
        uploadQueue={uploadQueue}
        onSelectOption={handleUploadOption}
        onDismiss={() => setShowUploadModal(false)}
        onRemoveUpload={removeUpload}
      />

      <CreateFolderModal
        visible={showCreateFolder}
        loading={false}
        onDismiss={() => setShowCreateFolder(false)}
        onCreate={async (name) => {
          const parentId = currentFolderId === 'root' ? null : (currentFolderId as number);
          await createFolder(name, parentId);
        }}
      />

      <ContextMenu
        visible={showContextMenu}
        item={contextItem}
        onDismiss={() => setShowContextMenu(false)}
        onAction={handleContextAction}
      />

      <ShareModal
        visible={showShareModal}
        loading={sharingLoading}
        onDismiss={() => {
          setShowShareModal(false);
          setShareResult(null);
        }}
        onCreateLink={handleCreateShareLink}
        linkResult={shareResult}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 8,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  renameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  renameDialog: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  renameInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    justifyContent: 'center',
  },
  renameButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  renameBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardScreen;
