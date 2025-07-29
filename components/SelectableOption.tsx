import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface SelectableOptionProps {
  title: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const SelectableOption: React.FC<SelectableOptionProps> = ({
  title,
  selected,
  onPress,
  style
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.option,
        selected && styles.selectedOption,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.optionText,
        selected && styles.selectedOptionText
      ]}>
        {selected ? '✓ ' : ''}{title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  option: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginVertical: 8,
    minHeight: 70,
    justifyContent: 'center',
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  optionText: {
    ...Fonts.body,
    color: Colors.text,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: Colors.surface,
    fontWeight: '600',
  },
});
