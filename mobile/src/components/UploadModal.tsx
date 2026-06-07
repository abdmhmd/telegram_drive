import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface UploadOption {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const UPLOAD_OPTIONS: UploadOption[] = [
  { key: 'gallery', label: 'Photo Gallery', icon: 'image-multiple' },
  { key: 'camera', label: 'Camera', icon: 'camera' },
  { key: 'document', label: 'Document', icon: 'file-document' },
];

interface Props {
  visible: boolean;
  uploading: boolean;
  uploadQueue: { id: string; fileName: string; progress: number; speed: string; status: string; error?: string }[];
  onSelectOption: (key: string) => void;
  onDismiss: () => void;
  onRemoveUpload: (id: string) => void;
}

const UploadModal: React.FC<Props> = ({
  visible,
  uploading,
  uploadQueue,
  onSelectOption,
  onDismiss,
  onRemoveUpload,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.onSurface }]}>Add Files</Text>

          <View style={styles.optionsRow}>
            {UPLOAD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.option, { backgroundColor: colors.surfaceVariant }, uploading && styles.optionDisabled]}
                onPress={() => { if (!uploading) onSelectOption(opt.key); }}
                activeOpacity={uploading ? 1 : 0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}15` }]}>
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialCommunityIcons name={opt.icon} size={28} color={colors.primary} />
                  )}
                </View>
                <Text style={[styles.optionLabel, { color: uploading ? colors.onSurfaceVariant : colors.onSurface }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.folderBtn, { backgroundColor: colors.surfaceVariant }, uploading && styles.optionDisabled]}
            onPress={() => { if (!uploading) onSelectOption('folder'); }}
            activeOpacity={uploading ? 1 : 0.7}
          >
            <MaterialCommunityIcons name="folder-plus" size={22} color={uploading ? colors.onSurfaceVariant : colors.primary} />
            <Text style={[styles.folderBtnText, { color: uploading ? colors.onSurfaceVariant : colors.primary }]}>Create Folder</Text>
          </TouchableOpacity>

          {uploadQueue.length > 0 && (
            <View style={styles.queue}>
              <Text style={[styles.queueTitle, { color: colors.onSurface }]}>Uploads</Text>
              {uploadQueue.map((u) => (
                <View key={u.id} style={[styles.queueItem, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={styles.queueInfo}>
                    <Text style={[styles.queueName, { color: colors.onSurface }]} numberOfLines={1}>
                      {u.fileName}
                    </Text>
                    <Text style={[styles.queueStatus, { color: colors.onSurfaceVariant }]}>
                      {u.status === 'uploading'
                        ? `${u.progress}% · ${u.speed}`
                        : u.status === 'done'
                        ? 'Complete'
                        : u.status === 'error'
                        ? u.error || 'Failed'
                        : 'Waiting...'}
                    </Text>
                  </View>
                  {u.status === 'uploading' && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                  {(u.status === 'done' || u.status === 'error') && (
                    <TouchableOpacity onPress={() => onRemoveUpload(u.id)}>
                      <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                  {u.status === 'pending' && (
                    <TouchableOpacity onPress={() => onRemoveUpload(u.id)}>
                      <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
            <Text style={[styles.cancelText, { color: colors.onSurfaceVariant }]}>{uploading ? 'Close' : 'Cancel'}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      maxHeight: '80%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 20,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    option: {
      flex: 1,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionLabel: {
      fontSize: 13,
      fontWeight: '500',
    },
    optionDisabled: {
      opacity: 0.5,
    },
    folderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      height: 50,
      gap: 8,
      marginBottom: 12,
    },
    folderBtnText: {
      fontSize: 15,
      fontWeight: '600',
    },
    queue: {
      marginTop: 8,
    },
    queueTitle: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 8,
    },
    queueItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
    },
    queueInfo: {
      flex: 1,
      marginRight: 8,
    },
    queueName: {
      fontSize: 13,
      fontWeight: '500',
    },
    queueStatus: {
      fontSize: 11,
      marginTop: 2,
    },
    cancelBtn: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    cancelText: {
      fontSize: 16,
    },
  });

export default UploadModal;
