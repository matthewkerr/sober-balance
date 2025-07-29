const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
  // Primary colors 
  primary: '#5B8A72', // Green color
  primaryDark: '#6C7A6C',

  // Success/Error colors with high contrast
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',

  // Neutral colors
  background: '#F2F2F7',
  surface: '#FFFFFF',
  border: '#E5E5EA',

  // Text colors with high contrast
  text: '#000000',
  textSecondary: '#6C7B7F',
  textLight: '#8E8E93',

  // Accessibility
  highContrast: '#000000',
  lowContrast: '#F2F2F7',

  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
