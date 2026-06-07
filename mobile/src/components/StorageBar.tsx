import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { formatSize } from '../utils/formatters';

interface Props {
  usedSpace: number;
  totalSpace?: number;
  files: number;
  folders: number;
}

const StorageBar: React.FC<Props> = ({ usedSpace, totalSpace = 0, files, folders }) => {
  const { colors } = useTheme();

  // Telegram accounts have 2GB cloud storage by default
  const limit = totalSpace || 2 * 1024 * 1024 * 1024;
  const pct = Math.min((usedSpace / limit) * 100, 100);

  const isHigh = pct > 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="file-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: colors.onSurfaceVariant }]}>{files} files</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="folder-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: colors.onSurfaceVariant }]}>{folders} folders</Text>
        </View>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barBg, { backgroundColor: colors.surfaceVariant }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pct}%`,
                backgroundColor: isHigh ? colors.error : colors.primary,
              },
            ]}
          />
        </View>
        <Text style={[styles.barText, { color: colors.onSurfaceVariant }]}>
          {formatSize(usedSpace)} / {formatSize(limit)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barText: {
    fontSize: 11,
    minWidth: 90,
    textAlign: 'right',
  },
});

export default StorageBar;
