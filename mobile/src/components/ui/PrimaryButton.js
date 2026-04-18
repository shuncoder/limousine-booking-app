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
        { backgroundColor: bg, opacity: disabled || loading ? 0.6 : pressed ? 0.9 : 1 },
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
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});

