import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const Dropdown = ({ label, value, options, open, setOpen, onSelect }) => {
  const resolvedOptions = Array.isArray(options)
    ? options.map((item) => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        }
        const optionLabel = String(item?.label ?? item?.value ?? '').trim();
        return { label: optionLabel, value: item?.value ?? item };
      })
    : [];

  const displayValue = (() => {
    if (!value) return 'Chọn';
    if (typeof value === 'string') return value;
    return String(value?.label ?? value?.name ?? '').trim() || 'Chọn';
  })();

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(!open)}>
        <Text>{displayValue}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          <ScrollView nestedScrollEnabled>
            {resolvedOptions.map((item) => (
              <TouchableOpacity
                key={`${item.label}`}
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
              >
                <Text>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: { marginBottom: 12 },
  label: { marginBottom: 4, color: '#fff', fontWeight: '700' },
  dropdown: { backgroundColor: '#fff', padding: 12, borderRadius: 10 },
  dropdownList: { maxHeight: 150, backgroundColor: '#fff', marginTop: 5, borderRadius: 10 },
  dropdownItem: { padding: 12 },
});

export default Dropdown;