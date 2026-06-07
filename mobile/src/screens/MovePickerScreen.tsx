import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api, getApiError } from '../api/client';
import { useTheme } from '../theme';
import Breadcrumbs from '../components/Breadcrumbs';
import type { FileItem, Breadcrumb } from '../types';

interface Props {
  route: { params: { itemId: number } };
  navigation: any;
}

const MovePickerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { colors } = useTheme();
  const [items, setItems] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | 'root' | null>('root');
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    loadFolder('root');
  }, []);

  const loadFolder = async (folderId: number | 'root' | null) => {
    setLoading(true);
    try {
      const params = folderId && folderId !== 'root' ? { parent_id: folderId } : {};
      const { data } = await api.get('/files', { params });
      // Only show folders
      const folders = (data.items || []).filter((i: FileItem) => i.is_folder);
      setItems(folders);
      setBreadcrumbs(data.breadcrumbs || []);
      setCurrentFolderId(folderId ?? 'root');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: getApiError(err) });
    }
    setLoading(false);
  };

  const handleMoveHere = async (targetId: number | null) => {
    setMoving(true);
    try {
      await api.put(`/files/${itemId}`, { parent_id: targetId });
      Toast.show({ type: 'success', text1: 'Moved', text2: 'Item moved successfully' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: getApiError(err) });
    }
    setMoving(false);
  };

  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={[styles.folderItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={() => loadFolder(item.id)}
    >
      <MaterialCommunityIcons name="folder" size={28} color="#FFA726" />
      <Text style={[styles.folderName, { color: colors.onSurface }]}>{item.name}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={(id) => loadFolder(id === 'root' ? 'root' : id)} />

      <TouchableOpacity
        style={[styles.moveHereBtn, { backgroundColor: colors.primary }]}
        onPress={() => {
          const targetId = currentFolderId === 'root' ? null : (currentFolderId as number);
          handleMoveHere(targetId);
        }}
        disabled={moving}
      >
        {moving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <MaterialCommunityIcons name="file-move" size={20} color={colors.onPrimary} />
            <Text style={[styles.moveHereText, { color: colors.onPrimary }]}>Move Here</Text>
          </>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No subfolders</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    moveHereBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 16,
      height: 50,
      borderRadius: 14,
      gap: 8,
    },
    moveHereText: {
      fontSize: 16,
      fontWeight: '600',
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      padding: 16,
    },
    folderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 6,
      gap: 12,
    },
    folderName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 15,
      marginTop: 8,
    },
  });

export default MovePickerScreen;
