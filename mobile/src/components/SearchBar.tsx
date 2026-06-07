import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<Props> = ({ value, onChangeText, onSubmit, onClear, placeholder }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
      <TextInput
        style={[styles.input, { color: colors.onSurface }]}
        placeholder={placeholder || 'Search files...'}
        placeholderTextColor={colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    height: '100%',
  },
});

export default SearchBar;
