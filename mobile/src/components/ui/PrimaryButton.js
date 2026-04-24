import React from "react";
import { Pressable, StyleSheet, Text, ActivityIndicator } from "react-native";
import { colors, radius, spacing } from "../../theme/theme";

export default function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "brand",
}) {
  const bg = variant === "success" ? colors.brand2 : colors.brand;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled || loading ? 0.58 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});

