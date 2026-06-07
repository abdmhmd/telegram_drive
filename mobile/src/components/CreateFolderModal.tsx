import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  loading: boolean;
  onDismiss: () => void;
  onCreate: (name: string) => Promise<void>;
}

const CreateFolderModal: React.FC<Props> = ({ visible, loading, onDismiss, onCreate }) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Folder name is required' });
      return;
    }
    await onCreate(name.trim());
    setName('');
    onDismiss();
  };

  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="folder-plus" size={40} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onSurface }]}>Create Folder</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.border }]}
            placeholder="Folder name"
            placeholderTextColor={colors.onSurfaceVariant}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onDismiss}>
              <Text style={[styles.btnText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.createBtn, { backgroundColor: colors.primary }]}
              onPress={handleCreate}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: colors.onPrimary }]}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: 32,
    },
    dialog: {
      width: '100%',
      borderRadius: 20,
      padding: 28,
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 12,
      marginBottom: 20,
    },
    input: {
      width: '100%',
      height: 50,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      borderWidth: 1,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      width: '100%',
    },
    btn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: 'transparent',
    },
    createBtn: {
      elevation: 2,
    },
    btnText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default CreateFolderModal;
