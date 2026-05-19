import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { deleteAccount, getProfile, updateProfile } from '../services/api';

/**
 * Owns profile fetch / edit / delete state for ProfileScreen.
 *  - `editName/editPhone` belong to the edit modal (kept here to centralize
 *    the optimistic update on save).
 *  - `onLoggedOut` runs after a successful account deletion (caller can use
 *    it to navigate to Login or run useLogout's redirect).
 */
export default function useProfile({ onLoggedOut } = {}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        if (!cancelled) setProfile(data);
      } catch {
        // For now mirror the original behavior (silent on initial load).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openEditModal = useCallback(() => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setEditModalVisible(true);
  }, [profile]);

  const closeEditModal = useCallback(() => setEditModalVisible(false), []);
  const openDeleteModal = useCallback(() => setDeleteModalVisible(true), []);
  const closeDeleteModal = useCallback(() => setDeleteModalVisible(false), []);

  const saveEdit = useCallback(async () => {
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ tên và số điện thoại');
      return;
    }
    setLoading(true);
    try {
      await updateProfile(editName, editPhone);
      setProfile((prev) =>
        prev ? { ...prev, name: editName, phone: editPhone } : prev
      );
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert('Lỗi', e?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [editName, editPhone]);

  const confirmDelete = useCallback(async () => {
    setLoading(true);
    try {
      await deleteAccount();
      setDeleteModalVisible(false);
      if (typeof onLoggedOut === 'function') onLoggedOut();
    } catch (e) {
      Alert.alert('Lỗi', e?.message || 'Không thể xóa tài khoản');
    } finally {
      setLoading(false);
    }
  }, [onLoggedOut]);

  return {
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
  };
}
