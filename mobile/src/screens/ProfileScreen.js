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
            <ActivityIndicator size="large" color={colors.brand} />
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
              <Text style={styles.modalHint}>Cập nhật họ tên và số điện thoại của bạn</Text>
              <TextInput
                style={styles.input}
                placeholder="Họ tên"
                placeholderTextColor={colors.muted}
                value={editName}
                onChangeText={setEditName}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor={colors.muted}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={closeEditModal} disabled={loading} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} disabled={loading} style={styles.modalSaveBtn}>
                  <Text style={styles.modalSaveText}>
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
                <TouchableOpacity onPress={closeDeleteModal} disabled={loading} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDelete} disabled={loading} style={styles.modalDeleteBtn}>
                  <Text style={styles.modalDeleteText}>
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
    backgroundColor: colors.brand,
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
    backgroundColor: 'rgba(79,124,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.35)',
  },
  editBtnText: {
    color: colors.brand,
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
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 18, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
  },
  modalHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  modalBody: {
    color: 'rgba(234,240,255,0.78)',
    marginVertical: spacing.md,
    lineHeight: 20,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalCancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  modalSaveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  modalSaveText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  modalDeleteBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
  },
  modalDeleteText: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
});
