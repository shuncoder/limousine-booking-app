import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';

const PassengerSelector = ({ visible, onClose, onConfirm, initialCount }) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount, visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Số lượng khách</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity style={styles.counterButton} onPress={() => setCount(Math.max(1, count - 1))}>
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{count}</Text>
            <TouchableOpacity style={styles.counterButton} onPress={() => setCount(Math.min(10, count + 1))}>
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={() => { onConfirm(count); onClose(); }}>
              <Text style={[styles.modalButtonText, styles.modalButtonConfirmText]}>Chọn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  counterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  counterButton: { width: 44, height: 44, backgroundColor: '#f0f0f0', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  counterButtonText: { fontSize: 24, fontWeight: 'bold' },
  counterValue: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 20, minWidth: 40, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, paddingVertical: 10, marginHorizontal: 5, borderRadius: 8, alignItems: 'center', backgroundColor: '#e0e0e0' },
  modalButtonConfirm: { backgroundColor: '#2196F3' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  modalButtonConfirmText: { color: '#fff' },
});

export default PassengerSelector;