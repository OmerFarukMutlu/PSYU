import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Card, Upload, Checkbox, Space, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../store/authContext';
import { useSocket } from '../socket/SocketContext';

const { Text } = Typography;

const EditComment = () => {
  const { commentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // yeni/var olan dosya durumları
  const [currentFileUrl, setCurrentFileUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  useEffect(() => {
    const fetchComment = async () => {
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Yorum yüklenemedi');

        const c = data.result ?? data;
        form.setFieldsValue({ content: c.content ?? '' });

        // Backend’ine göre alan adlarını toleranslı oku
        const url =
          c.attachmentUrl ||
          c.fileUrl ||
          (c.attachmentPath ? `/${c.attachmentPath}` : null);

        setCurrentFileUrl(url || null);
      } catch (err) {
        message.error(err.message || 'Yorum yüklenemedi');
      }
    };

    if (user?.token) fetchComment();
  }, [commentId, form, user?.token]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // ➜ FormData ile gönder (Content-Type setleme!)
      const fd = new FormData();
      fd.append('content', values.content || '');
      if (file) fd.append('attachment', file);
      fd.append('removeAttachment', removeAttachment ? 'true' : 'false');

      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH', // PUT kullanıyorsan burada PUT bırak
        headers: { Authorization: `Bearer ${user?.token}` },
        body: fd,
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.message || 'Yorum güncellenemedi');

      // WS yayın (senin socket.js'inde updateComment olayı var)
      socket?.emit('updateComment', updated.comment ?? updated);

      message.success('Yorum başarıyla güncellendi');
      navigate(-1);
    } catch (err) {
      message.error(err.message || 'Yorum güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Yorumu Düzenle" style={{ maxWidth: 600, margin: '40px auto' }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Yorum İçeriği" name="content">
          <Input.TextArea rows={8} placeholder="Yorum içeriği..." />
        </Form.Item>

        {/* Mevcut dosya bilgisi + kaldır seçeneği */}
        {currentFileUrl && !file && !removeAttachment && (
          <Space direction="vertical" style={{ marginBottom: 12 }}>
            <a href={currentFileUrl} target="_blank" rel="noreferrer">
              Mevcut dosyayı görüntüle
            </a>
            <Checkbox
              checked={removeAttachment}
              onChange={(e) => setRemoveAttachment(e.target.checked)}
            >
              Dosyayı kaldır
            </Checkbox>
          </Space>
        )}

        {/* Yeni dosya seç (Upload otomatik upload etmez) */}
        <Form.Item label="Dosya (isteğe bağlı)">
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              setRemoveAttachment(false); // yeni dosya seçince kaldırmayı iptal et
              return false; // otomatik upload yok
            }}
            maxCount={1}
            showUploadList={!!file}
            onRemove={() => setFile(null)}
          >
            <Button icon={<UploadOutlined />}>Dosya Seç</Button>
          </Upload>
          {file && <Text type="secondary">{file.name}</Text>}
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Kaydet
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate(-1)}>
            İptal
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditComment;
