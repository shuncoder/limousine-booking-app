import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radius, spacing } from '../theme/theme';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import TextField from '../components/ui/TextField';
import PrimaryButton from '../components/ui/PrimaryButton';
import { createComplaint } from '../services/api';

export default function CreateComplaintScreen({ navigation, route }) {
  const { ticketId, tripId, defaultSubject } = route.params || {};
  const [subject, setSubject] = useState(defaultSubject || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề khiếu nại');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung chi tiết');
      return;
    }

    setLoading(true);
    try {
      const created = await createComplaint({
        subject: subject.trim(),
        message: message.trim(),
        ticketId,
        tripId,
      });
      Alert.alert('Thành công', 'Khiếu nại của bạn đã được gửi và lưu vào lịch sử.', [
        {
          text: 'Xem chi tiết',
          onPress: () => {
            navigation.replace('ComplaintDetail', { complaintId: created._id });
          },
        },
        {
          text: 'Đóng',
          style: 'cancel',
          onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.replace('Main');
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.msg || e?.message || 'Không thể gửi khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.card}>
            <Text style={styles.title}>Gửi khiếu nại</Text>
            <Text style={styles.subtle}>
              Mô tả vấn đề bạn gặp phải để chúng tôi hỗ trợ nhanh hơn.
            </Text>

            {ticketId ? (
              <View style={styles.contextBox}>
                <Text style={styles.contextLabel}>Liên quan vé</Text>
                <Text style={styles.contextValue}>#{String(ticketId).slice(-6).toUpperCase()}</Text>
              </View>
            ) : null}

            <TextField
              label="Tiêu đề"
              value={subject}
              onChangeText={setSubject}
              placeholder="VD: Tài xế đến trễ, ghế không đúng..."
              autoCapitalize="sentences"
            />

            <View style={styles.messageWrap}>
              <Text style={styles.messageLabel}>Nội dung chi tiết</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={styles.messageInput}
              />
            </View>

            <PrimaryButton
              title="Gửi khiếu nại"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  subtle: {
    color: 'rgba(234,240,255,0.72)',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  contextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.35)',
    backgroundColor: 'rgba(79,124,255,0.12)',
    marginBottom: spacing.md,
  },
  contextLabel: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  contextValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 14,
  },
  messageWrap: {
    marginBottom: spacing.lg,
  },
  messageLabel: {
    color: 'rgba(234,240,255,0.88)',
    marginBottom: spacing.xs,
    fontSize: 13,
    fontWeight: '700',
  },
  messageInput: {
    minHeight: 140,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
