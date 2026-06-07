import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import type { Breadcrumb } from '../types';

interface Props {
  breadcrumbs: Breadcrumb[];
  onNavigate: (id: number | 'root' | null) => void;
}

const Breadcrumbs: React.FC<Props> = ({ breadcrumbs, onNavigate }) => {
  const { colors } = useTheme();

  if (!breadcrumbs.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      contentContainerStyle={styles.content}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const itemId = crumb.id === 'root' ? 'root' : crumb.id;
        return (
          <TouchableOpacity
            key={`${crumb.id}-${index}`}
            onPress={() => onNavigate(itemId)}
            disabled={isLast}
            activeOpacity={0.6}
            style={styles.crumb}
          >
            {index === 0 && (
              <MaterialCommunityIcons name="home" size={16} color={isLast ? colors.onSurface : colors.primary} />
            )}
            {index > 0 && (
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.onSurfaceVariant} />
            )}
            <Text
              style={[
                styles.text,
                {
                  color: isLast ? colors.onSurface : colors.primary,
                  fontWeight: isLast ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {crumb.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  crumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 14,
    maxWidth: 120,
  },
});

export default Breadcrumbs;
