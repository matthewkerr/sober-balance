import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface LargeButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    disabled?: boolean;
    style?: ViewStyle;
}

export const LargeButton: React.FC<LargeButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    style
}) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'primary':
                return { backgroundColor: Colors.primary };
            case 'secondary':
                return { backgroundColor: Colors.textSecondary };
            case 'success':
                return { backgroundColor: Colors.success };
            case 'danger':
                return { backgroundColor: Colors.danger };
            default:
                return { backgroundColor: Colors.primary };
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                disabled && styles.disabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 70,
        marginVertical: 8,
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        ...Fonts.button,
        color: Colors.surface,
        textAlign: 'center',
    },
});
