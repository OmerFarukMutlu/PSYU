import React from 'react';
import { Modal, Input, Select } from 'antd';

const TaskEditModal = ({
  open,
  onCancel,
  onSave,
  editedTitle,
  setEditedTitle,
  editedAssignee,
  setEditedAssignee,
  editedPriority,
  setEditedPriority,
  projectMembers,
  user, // authContext'ten gelen giriş yapmış kullanıcı
  currentProjectMembers // proje üyeleri (role kontrolü için)
}) => {
  const globalAllowedRoles = ['admin', 'admin_helper', 'project_manager'];
  const projectAllowedRole = 'team_lead';

  // Kullanıcı yetkili mi?
  const canEdit = user && (
    globalAllowedRoles.includes(user.role) ||
    currentProjectMembers.some(
      member => member.userId === user.id && member.role === projectAllowedRole
    )
  );

  // 🔧 Üye seçeneklerini sağlam şekilde hazırla (userId || user.id), tekilleştir.
  const memberOptions = (projectMembers || [])
    .map(m => {
      const u = m.user || {};
      const id = u.id ?? m.userId; // <-- kritik: bazı kayıtlarda sadece user.id var
      return id == null
        ? null
        : {
            value: id,
            label: u.fullname || u.username || `Kullanıcı #${id}`,
          };
    })
    .filter(Boolean)
    .filter((opt, i, arr) => i === arr.findIndex(o => o.value === opt.value)); // tekilleştir

  return (
    <Modal
      title="Görevi Düzenle"
      open={open}
      onOk={canEdit ? onSave : onCancel} // Yetkisi yoksa kaydetme butonu iptal gibi çalışır
      onCancel={onCancel}
      okText={canEdit ? "Kaydet" : "Kapat"}
      cancelText="İptal"
    >
      <Input
        value={editedTitle}
        onChange={(e) => setEditedTitle(e.target.value)}
        placeholder="Görev başlığı"
        style={{ marginBottom: 12 }}
        disabled={!canEdit}
      />

      <Select
        showSearch
        allowClear
        value={editedAssignee}
        onChange={setEditedAssignee}
        placeholder="Atanacak kullanıcı"
        style={{ width: '100%', marginBottom: 12 }}
        optionFilterProp="label"
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        disabled={!canEdit}
        options={memberOptions}
      />

      <Select
        value={editedPriority}
        onChange={setEditedPriority}
        placeholder="Öncelik"
        style={{ width: '100%' }}
        disabled={!canEdit}
        options={[
          { label: 'Düşük', value: 'low' },
          { label: 'Orta', value: 'medium' },
          { label: 'Yüksek', value: 'high' }
        ]}
      />
    </Modal>
  );
};

export default TaskEditModal;
