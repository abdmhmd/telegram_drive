import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  loading: boolean;
  onDismiss: () => void;
  onCreateLink: (expiresInHours: number | null) => Promise<void>;
  linkResult: { url: string; expires_at: string | null } | null;
}

const EXPIRY_OPTIONS = [
  { label: 'No expiry', value: null },
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
];

const ShareModal: React.FC<Props> = ({ visible, loading, onDismiss, onCreateLink, linkResult }) => {
  const { colors } = useTheme();
  const [selectedExpiry, setSelectedExpiry] = useState<number | null>(null);
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    await onCreateLink(selectedExpiry);
    setCreated(true);
  };

  const handleCopy = () => {
    if (linkResult?.url) {
      Clipboard.setString(linkResult.url);
      Toast.show({ type: 'success', text1: 'Copied', text2: 'Share link copied to clipboard' });
    }
  };

  const handleClose = () => {
    setCreated(false);
    setSelectedExpiry(null);
    onDismiss();
  };

  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.onSurface }]}>Share Link</Text>

          {!created ? (
            <>
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Set expiration (optional)</Text>
              <View style={styles.options}>
                {EXPIRY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selectedExpiry === opt.value ? `${colors.primary}15` : colors.surfaceVariant,
                        borderColor: selectedExpiry === opt.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedExpiry(opt.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: selectedExpiry === opt.value ? colors.primary : colors.onSurface },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.createBtnText, { color: colors.onPrimary }]}>Create Link</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.linkBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.linkUrl, { color: colors.onSurface }]} numberOfLines={2}>
                  {linkResult?.url}
                </Text>
              </View>
              {linkResult?.expires_at && (
                <Text style={[styles.expiryText, { color: colors.onSurfaceVariant }]}>
                  Expires: {new Date(linkResult.expires_at).toLocaleString()}
                </Text>
              )}
              <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.primary }]} onPress={handleCopy}>
                <MaterialCommunityIcons name="content-copy" size={20} color={colors.onPrimary} />
                <Text style={[styles.copyBtnText, { color: colors.onPrimary }]}>Copy Link</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={[styles.cancelText, { color: colors.onSurfaceVariant }]}>Close</Text>
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
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      marginBottom: 16,
    },
    options: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    option: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    createBtn: {
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createBtnText: {
      fontSize: 16,
      fontWeight: '600',
    },
    linkBox: {
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      marginBottom: 8,
    },
    linkUrl: {
      fontSize: 13,
      lineHeight: 20,
    },
    expiryText: {
      fontSize: 12,
      marginBottom: 16,
      textAlign: 'center',
    },
    copyBtn: {
      flexDirection: 'row',
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    copyBtnText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelBtn: {
      alignItems: 'center',
      paddingVertical: 16,
      marginTop: 4,
    },
    cancelText: {
      fontSize: 16,
    },
  });

export default ShareModal;
