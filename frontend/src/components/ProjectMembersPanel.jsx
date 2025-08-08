import React, { useEffect, useState } from 'react';
import {
  Drawer, List, Typography, Button, message, Select, Popconfirm, Divider, Tag, Alert
} from 'antd';
import { useAuth } from '../store/authContext';
import { useSocket } from '../socket/SocketContext'; // 🔌 WebSocket

const { Title, Text } = Typography;
const roles = ['team_lead', 'developer', 'tester'];

const ProjectMembersPanel = ({ open, onClose, projectId }) => {
  const { user } = useAuth();
  const socket = useSocket();

  const allowedRoles = ['admin', 'admin_helper', 'project_manager'];
  const canModifyMembers = user && allowedRoles.includes(user.role);

  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('developer');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setMembers(data.result || []);
    } catch {
      message.error('Üyeler yüklenemedi', 3);
    }
  };

  const fetchUsers = async () => {
    if (!canModifyMembers) return;
    try {
      const res = await fetch(`/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setUsers(data.result || []);
    } catch {
      message.error('Kullanıcılar alınamadı', 3);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchUsers();
    }
  }, [open]);

  // ✅ WebSocket ile gelen güncelleme → anlık member listesi yenile
useEffect(() => {
  if (!socket || !projectId) return;

  const handleProjectMemberUpdated = ({ project }) => {
    if (!project || project.id.toString() !== projectId.toString()) return;
    console.log('📡 projectMemberUpdated alındı (rol değişti)');
    fetchMembers(); // güncelle
  };

  socket.on('projectMemberUpdated', handleProjectMemberUpdated);

  return () => {
    socket.off('projectMemberUpdated', handleProjectMemberUpdated);
  };
}, [socket, projectId]);



  const handleAdd = async () => {
    if (!canModifyMembers || !selectedUser) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId: selectedUser, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data?.message || 'Ekleme başarısız');
        return;
      }

      message.success('Üye başarıyla eklendi');
      setSelectedUser(null);
      // ❌ Artık emit yok, sunucu zaten emit ediyor
    } catch {
      setErrorMessage('Sunucu hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!canModifyMembers) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      message.success('Üye kaldırıldı');
      // ❌ Artık emit yok, sunucu zaten emit ediyor
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!canModifyMembers) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Rol değiştirilemedi');
      message.success('Rol güncellendi');
      // ❌ Artık emit yok, sunucu zaten emit ediyor
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <Drawer
      title={<Title level={4} style={{ margin: 0 }}>Proje Üyeleri</Title>}
      width={460}
      onClose={onClose}
      open={open}
    >
      {canModifyMembers && <Divider>Üye Ekle</Divider>}

      {errorMessage && (
        <Alert type="warning" message={errorMessage} showIcon style={{ marginBottom: 16 }} />
      )}

      {canModifyMembers && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Select
            style={{ flex: 2 }}
            placeholder="Kullanıcı seç"
            value={selectedUser}
            onChange={setSelectedUser}
            showSearch
            optionFilterProp="children"
          >
            {users.map((u) => (
              <Select.Option key={u.id} value={u.id}>
                {(u.fullname || u.username) + ' (' + u.username + ')'}
              </Select.Option>
            ))}
          </Select>

          <Select
            style={{ flex: 1 }}
            value={selectedRole}
            onChange={setSelectedRole}
          >
            {roles.map((r) => (
              <Select.Option key={r} value={r}>{r}</Select.Option>
            ))}
          </Select>

          <Button type="primary" onClick={handleAdd} loading={loading}>Ekle</Button>
        </div>
      )}

      <Divider>Mevcut Üyeler</Divider>
      <List
        dataSource={members}
        locale={{ emptyText: 'Üye yok' }}
        renderItem={(item) => (
          <List.Item
            actions={[
              canModifyMembers && (
                <Popconfirm
                  title="Bu üyeyi kaldırmak istediğinize emin misiniz?"
                  onConfirm={() => handleRemove(item.userId)}
                  okText="Evet"
                  cancelText="Hayır"
                >
                  <Button size="small" danger>Sil</Button>
                </Popconfirm>
              )
            ]}
          >
            <Text>{item.user?.username}</Text>
            {canModifyMembers ? (
              <Select
                value={item.role}
                onChange={(val) => handleRoleChange(item.userId, val)}
                style={{ width: 120 }}
              >
                {roles.map(r => (
                  <Select.Option key={r} value={r}>{r}</Select.Option>
                ))}
              </Select>
            ) : (
              <Tag>{item.role}</Tag>
            )}
          </List.Item>
        )}
      />
    </Drawer>
  );
};

export default ProjectMembersPanel;
