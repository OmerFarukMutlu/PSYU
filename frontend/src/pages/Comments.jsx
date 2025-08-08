import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  List,
  Avatar,
  Typography,
  Button,
  message,
  Popconfirm,
  Tooltip,
  Space,
} from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../store/authContext';
import { useSocket } from '../socket/SocketContext';

const { Title } = Typography;

const MyComments = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const socket = useSocket();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCommentId, setHoveredCommentId] = useState(null);

  const token = localStorage.getItem('token') || '';

  // helpers
  const upsertById = (arr, item) => {
    if (!item || item.id == null) return arr;
    const i = arr.findIndex(x => x.id === item.id);
    if (i === -1) return [item, ...arr];
    const next = [...arr];
    next[i] = { ...next[i], ...item };
    return next;
  };
  const uniqById = (arr) => {
    const seen = new Set();
    return arr.filter(x => {
      if (!x || x.id == null) return false;
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    });
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Yorumlar yüklenemedi');
      setComments(uniqById(data.result || []));
    } catch (e) {
      message.error(e.message || 'Yorumlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const prev = comments;
    setComments(prev.filter(c => c.id !== id));
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Silme işlemi başarısız (HTTP ${res.status})`);
      }
      socket?.emit('commentDeleted', id);
      message.success('Yorum silindi ✅');
    } catch (err) {
      setComments(prev);
      message.error(err.message || 'Yorum silinirken hata oluştu');
    }
  };

  // 🔧 Dosyayı token ile getir ve görüntüle
  const handleViewFile = async (att) => {
    try {
      const res = await fetch(`/api/comments/files/view/${att.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Dosya alınamadı');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      message.error(e.message || 'Dosya görüntülenemedi');
    }
  };

  // 🔧 Dosyayı token ile indir
  const handleDownloadFile = async (att) => {
    try {
      const res = await fetch(`/api/comments/files/download/${att.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Dosya indirilemedi');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.originalName || 'dosya';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      message.error(e.message || 'Dosya indirilemedi');
    }
  };

  const canEditComment = (comment) => {
    const editGlobalRoles = ['admin', 'admin_helper'];
    const isOwner = currentUser?.id === comment.author?.id;
    return isOwner || editGlobalRoles.includes(currentUser?.role) || editGlobalRoles.includes(comment.globalRole);
  };

  const canDeleteComment = (comment) => {
    const deleteGlobalRoles = ['admin', 'admin_helper', 'project_manager'];
    return deleteGlobalRoles.includes(currentUser?.role) ||
           deleteGlobalRoles.includes(comment.globalRole) ||
           comment.projectRole === 'team_lead';
  };

  useEffect(() => { fetchComments(); }, [issueId]);

  useEffect(() => {
    if (!socket) return;

    // Yalnızca ilgili issue yayınlarını al
    socket.emit('joinIssue', issueId);

    const onNew = (c) => {
      if (!c || String(c.issueId) !== String(issueId)) return;
      setComments(prev => upsertById(prev, c));
    };
    const onUpdate = (u) => {
      if (!u || String(u.issueId) !== String(issueId)) return;
      setComments(prev => upsertById(prev, u));
    };
    const onDelete = (deletedId) => {
      setComments(prev => prev.filter(c => c.id !== deletedId));
    };

    socket.on('receiveComment', onNew);
    socket.on('updateComment', onUpdate);
    socket.on('commentDeleted', onDelete);

    return () => {
      socket.off('receiveComment', onNew);
      socket.off('updateComment', onUpdate);
      socket.off('commentDeleted', onDelete);
    };
  }, [socket, issueId]);

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 12 }}>
      <Title level={4}>Görev Yorumları</Title>

      <List
        loading={loading}
        itemLayout="vertical"
        dataSource={comments}
        locale={{ emptyText: 'Yorum bulunamadı' }}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            onMouseEnter={() => setHoveredCommentId(item.id)}
            onMouseLeave={() => setHoveredCommentId(null)}
            style={{
              backgroundColor: String(hoveredCommentId) === String(item.id) ? '#f5f5f5' : 'transparent',
              borderRadius: 8,
              transition: 'all 0.2s ease',
              boxShadow: String(hoveredCommentId) === String(item.id) ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
            actions={
              String(hoveredCommentId) === String(item.id)
                ? [
                    canEditComment(item) && (
                      <Tooltip title="Yorumu Düzenle" key="edit">
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/comments/${item.id}/edit`)}
                        />
                      </Tooltip>
                    ),
                    canDeleteComment(item) && (
                      <Tooltip title="Yorumu Sil" key="delete">
                        <Popconfirm
                          title="Yorumu silmek istediğine emin misin?"
                          onConfirm={() => handleDelete(item.id)}
                          okText="Evet"
                          cancelText="İptal"
                        >
                          <Button type="link" icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                      </Tooltip>
                    ),
                  ].filter(Boolean)
                : []
            }
          >
            <List.Item.Meta
              avatar={<Avatar>{item.author?.username?.[0] || '?'}</Avatar>}
              title={<strong>{item.author?.username || 'Bilinmeyen Kullanıcı'}</strong>}
              description={
                <>
                  <div
                    style={{
                      whiteSpace: 'pre-line',
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#333',
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {item.content}
                  </div>

                  {item.attachment && (
                    <Space size="middle" style={{ marginBottom: 8 }}>
                      <Button
                        size="small"
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewFile(item.attachment)}
                      >
                        Görüntüle
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownloadFile(item.attachment)}
                      >
                        İndir
                      </Button>
                    </Space>
                  )}

                  {item.metadata && (
                    <pre style={{ background: '#f6f6f6', padding: 8, borderRadius: 4, marginTop: 8 }}>
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
                  )}

                  <div style={{ fontSize: 12, color: '#999' }}>
                    {new Date(item.createdAt).toLocaleString('tr-TR')}
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default MyComments;
