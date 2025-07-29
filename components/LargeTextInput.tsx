import React from 'react';
import { TextInput, StyleSheet, TextStyle, TextInputProps } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface LargeTextInputProps extends TextInputProps {
  style?: TextStyle;
}

export const LargeTextInput: React.FC<LargeTextInputProps> = ({ style, ...props }) => {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={Colors.textLight}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    ...Fonts.body,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 70,
    color: Colors.text,
    fontSize: 22, // Extra large for easy reading
  },
});