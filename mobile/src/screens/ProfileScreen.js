import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useLogout } from '../hooks/useLogout';
import useProfile from '../hooks/useProfile';
import { colors, spacing } from '../theme/theme';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function ProfileScreen({ navigation }) {
  const { logout } = useLogout();
  const {
    profile,
    loading,
    editName,
    setEditName,
    editPhone,
    setEditPhone,
    editModalVisible,
    deleteModalVisible,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    saveEdit,
    confirmDelete,
  } = useProfile({ onLoggedOut: logout });

  if (!profile) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </GlassCard>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <View style={styles.header}>
            {navigation?.canGoBack?.() && (
              <Text style={styles.backBtn} onPress={() => navigation.goBack()}>
                ←
              </Text>
            )}
            <Text style={styles.title}>Hồ sơ cá nhân</Text>
            <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
              <Text style={styles.editBtnText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Họ tên</Text>
            <Text style={styles.value}>{profile.name}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Số điện thoại</Text>
            <Text style={styles.value}>{profile.phone || 'Chưa cập nhật'}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={openDeleteModal}>
            <Text style={styles.deleteBtnText}>Xóa tài khoản</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Đăng xuất"
            onPress={logout}
            style={styles.logoutBtn}
          />
        </GlassCard>

        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeEditModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
              <TextInput
                style={styles.input}
                placeholder="Họ tên"
                value={editName}
                onChangeText={setEditName}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={closeEditModal} disabled={loading}>
                  <Text style={[styles.modalBtn, { color: colors.muted }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} disabled={loading}>
                  <Text style={[styles.modalBtn, { color: colors.primary, marginLeft: 24 }]}>
                    {loading ? 'Đang lưu...' : 'Lưu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deleteModalVisible}
          animationType="fade"
          transparent
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Xác nhận xóa tài khoản?</Text>
              <Text style={styles.modalBody}>
                Bạn chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={closeDeleteModal} disabled={loading}>
                  <Text style={[styles.modalBtn, { color: colors.muted }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDelete} disabled={loading}>
                  <Text style={[styles.modalBtn, { color: colors.error, marginLeft: 24 }]}>
                    {loading ? 'Đang xóa...' : 'Xóa'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  infoBox: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  editBtn: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  editBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  deleteBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,0,0,0.07)',
  },
  deleteBtnText: {
    color: colors.error || '#e53935',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 12,
  },
  modalBody: {
    color: colors.muted,
    marginVertical: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalBtn: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fafbfc',
  },
});
