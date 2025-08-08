import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Input, Button, message, Modal, Spin } from 'antd';
import { useAuth } from '../store/authContext';
import { useSocket } from '../socket/SocketContext';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const IssueComments = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [commentText, setCommentText] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [issue, setIssue] = useState(null);       // { id, projectId, description, ... }
  const [loadingIssue, setLoadingIssue] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  // 🔧 file input'u temizlemek için ref
  const fileInputRef = useRef(null);

  const fetchIssueDetails = async () => {
    setLoadingIssue(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Görev bilgisi alınamadı');
      setIssue(data.result);
      setNewDescription(data.result?.description || '');
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoadingIssue(false);
    }
  };

  const canEditDescription = () => {
    if (!user || !issue) return false;
    const globalRoles = ['admin', 'admin_helper', 'project_manager'];
    if (globalRoles.includes(user.role)) return true;
    if (issue.projectRole === 'team_lead') return true;
    if (issue.createdBy === user.id) return true;
    return false;
  };

  const handleDescriptionUpdate = async () => {
    const trimmed = newDescription.trim();
    if (!trimmed) {
      message.warning('Açıklama boş olamaz.');
      return;
    }
    if (trimmed === issue.description) {
      message.info('Herhangi bir değişiklik yapılmadı.');
      setEditModalOpen(false);
      return;
    }

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ description: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Açıklama güncellenemedi');

      // 🟢 Kendi ekranımı hemen güncelle
      setIssue((prev) => ({ ...prev, description: trimmed }));
      setNewDescription(trimmed);
      setEditModalOpen(false);
      message.success('Açıklama güncellendi');

      // 🟢 Yayın (server odalara dağıtacak)
      if (socket) {
        socket.emit('updateIssueDescription', {
          projectId: issue?.projectId ?? null,
          issueId,
          description: trimmed,
        });
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!commentText.trim() && !file) {
      message.error('Yorum veya dosya eklemelisiniz.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', commentText);
      if (file) formData.append('attachment', file);

      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Yorum eklenemedi');

      message.success('Yorum eklendi');
      setCommentText('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // 🔧 dosya adını sıfırla

      // Socket yayını (sunucu issue/proje odasına dağıtır)
      if (data.result?.issueId && socket) {
        socket.emit('newComment', data.result);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { fetchIssueDetails(); }, [issueId]);

  // 🔌 Odaya katıl + açıklama güncellemesini dinle
  useEffect(() => {
    if (!socket) return;

    // Issue odasına katıl (projectId olmasa bile garanti)
    socket.emit('joinIssue', issueId);

    // Proje bilgisi geldiyse proje odasına da katıl
    if (issue?.projectId) {
      socket.emit('joinProject', issue.projectId);
    }

    const onIssueDesc = ({ issueId: iid, description }) => {
      if (String(iid) !== String(issueId)) return;
      setIssue((prev) => ({ ...prev, description }));
      setNewDescription(description);
    };

    // Geriye dönük (eski payload'ı da dinle)
    const onLegacyDesc = ({ id, description }) => {
      if (String(id) !== String(issueId)) return;
      setIssue((prev) => ({ ...prev, description }));
      setNewDescription(description);
    };

    socket.on('issueDescriptionUpdated', onIssueDesc);
    socket.on('descriptionUpdated', onLegacyDesc);

    return () => {
      socket.off('issueDescriptionUpdated', onIssueDesc);
      socket.off('descriptionUpdated', onLegacyDesc);
    };
  }, [socket, issue?.projectId, issueId]);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12 }}>
      {loadingIssue ? (
        <Spin tip="Görev yükleniyor..." />
      ) : (
        <>
          {issue && (
            <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
              <Title level={5}>Görev Açıklaması</Title>
              <Paragraph>{issue.description || 'Açıklama yok'}</Paragraph>
              {canEditDescription() && (
                <Button type="link" onClick={() => setEditModalOpen(true)}>
                  Açıklamayı Düzenle
                </Button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Görev Yorumları ve Dosya Ekle</Title>
            <Button type="default" onClick={() => navigate(`/my-comments/${issueId}`)}>
              Yorumları Gör
            </Button>
          </div>

          <TextArea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Yorum yaz..."
            style={{ marginTop: 20 }}
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: 8 }}
          />
          <Button
            type="primary"
            block
            style={{ marginTop: 12 }}
            loading={submitting}
            onClick={handleSubmit}
          >
            Gönder
          </Button>

          <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
            ← Geri Dön
          </Button>

          <Modal
            title="Görev Açıklamasını Düzenle"
            open={editModalOpen}
            onOk={handleDescriptionUpdate}
            onCancel={() => setEditModalOpen(false)}
            okText="Kaydet"
            cancelText="İptal"
          >
            <TextArea rows={4} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </Modal>
        </>
      )}
    </div>
  );
};

export default IssueComments;
