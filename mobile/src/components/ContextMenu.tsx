import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import type { FileItem } from '../types';

interface Action {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  destructive?: boolean;
}

const ACTIONS: Action[] = [
  { key: 'rename', label: 'Rename', icon: 'pencil' },
  { key: 'move', label: 'Move', icon: 'folder-swap' },
  { key: 'share', label: 'Share Link', icon: 'share-variant' },
  { key: 'delete', label: 'Delete', icon: 'delete', destructive: true },
];

interface Props {
  visible: boolean;
  item: FileItem | null;
  onDismiss: () => void;
  onAction: (action: string, item: FileItem) => void;
}

const ContextMenu: React.FC<Props> = ({ visible, item, onDismiss, onAction }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />
          <Text style={[styles.fileName, { color: colors.onSurface }]} numberOfLines={1}>
            {item.name}
          </Text>
          {ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[styles.actionItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                onDismiss();
                setTimeout(() => onAction(action.key, item), 200);
              }}
            >
              <MaterialCommunityIcons
                name={action.icon}
                size={22}
                color={action.destructive ? colors.error : colors.onSurface}
              />
              <Text
                style={[
                  styles.actionLabel,
                  { color: action.destructive ? colors.error : colors.onSurface },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    fileName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      gap: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    actionLabel: {
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default ContextMenu;
