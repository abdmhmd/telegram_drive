import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { getFileIcon, getFileColor } from '../utils/icons';
import { formatSize, formatDate } from '../utils/formatters';
import type { FileItem } from '../types';

interface Props {
  item: FileItem;
  viewMode: 'grid' | 'list';
  onPress: (item: FileItem) => void;
  onLongPress?: (item: FileItem) => void;
  onMenuPress?: (item: FileItem) => void;
}

const FileItemComponent: React.FC<Props> = ({ item, viewMode, onPress, onLongPress, onMenuPress }) => {
  const { colors } = useTheme();
  const iconName = getFileIcon(item);
  const iconColor = getFileColor(item);

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <MaterialCommunityIcons name={iconName} size={36} color={iconColor} />
        </View>
        <Text style={[styles.gridName, { color: colors.onSurface }]} numberOfLines={2}>
          {item.name}
        </Text>
        {!item.is_folder && (
          <Text style={[styles.gridSize, { color: colors.onSurfaceVariant }]}>
            {formatSize(item.size)}
          </Text>
        )}
        {onMenuPress && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => onMenuPress(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.listIcon, { backgroundColor: `${iconColor}15` }]}>
        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: colors.onSurface }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.listMeta, { color: colors.onSurfaceVariant }]}>
          {item.is_folder ? 'Folder' : formatSize(item.size)}
          {' · '}
          {formatDate(item.updated_at || item.created_at)}
        </Text>
      </View>
      {onMenuPress && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onMenuPress(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    position: 'relative',
    maxWidth: '47%',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  gridSize: {
    fontSize: 11,
    marginTop: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: '500',
  },
  listMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    padding: 4,
  },
});

export default FileItemComponent;
