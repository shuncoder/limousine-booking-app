import React from "react";
import { View, StyleSheet } from "react-native";
import { radius, spacing } from "../../theme/theme";

export default function GlassCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
});
