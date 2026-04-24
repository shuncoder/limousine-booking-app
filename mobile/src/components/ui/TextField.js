import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "../../theme/theme";

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize = "none",
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit = true,
}) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    color: "rgba(234,240,255,0.88)",
    marginBottom: spacing.xs,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 15,
  },
});

