import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Select, message, Alert } from 'antd';
import { useSocket } from '../socket/SocketContext';

const { Option } = Select;

const NewIssueModal = ({ open, onClose, onSuccess, projectId }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const socket = useSocket();

  useEffect(() => {
    if (!projectId || !open) return;

    fetch(`/api/projects/${projectId}/members`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMembers(data.result || []))
      .catch(() => setMembers([]));

    setErrorMessage(null);
  }, [projectId, open]);
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();

    if (values.assigneeId) {
      values.assigneeId = Number(values.assigneeId);
    } else {
      delete values.assigneeId;
    }

    setLoading(true);

    const res = await fetch(`/api/projects/${projectId}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    console.log('🧪 API Response:', data);

    if (!res.ok || !data.issue) {
      const msg = data.message || data.error || 'Görev eklenemedi';
      if (msg.includes('mevcut')) {
        setErrorMessage('⚠️ Bu ada sahip görev zaten mevcut');
      } else {
        setErrorMessage(msg);
      }
      return;
    }

    // ✅ Uyarı mesajını sıfırla
    setErrorMessage(null);

    message.success('Görev başarıyla oluşturuldu');
    form.resetFields();
    onClose();

    const payload = {
      issue: data.issue,
      projectId: String(projectId),
    };

    console.log('🟧 [MODAL EMIT] newIssue:', payload);
    socket?.emit('newIssue', payload);

    // ✅ Kendinde de anlık göster
    onSuccess?.(data.issue);

  } catch (err) {
    if (err?.errorFields) return;
    setErrorMessage(err.message || 'Görev oluşturulurken bir hata oluştu');
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal
      open={open}
      title="Yeni Görev Ekle"
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      {errorMessage && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        colon={false}
        requiredMark={false}
      >
        <Form.Item
          name="title"
          label="Başlık"
          rules={[{ required: true, message: 'Başlık gerekli' }]}
        >
          <Input placeholder="Görev başlığı..." autoFocus />
        </Form.Item>

        <Form.Item name="description" label="Açıklama">
          <Input.TextArea rows={3} placeholder="Kısa açıklama..." />
        </Form.Item>

        <Form.Item
          name="status"
          label="Durum"
          rules={[{ required: true, message: 'Durum gerekli' }]}
        >
          <Select placeholder="Seçiniz">
            <Option value="todo">Yapılacak</Option>
            <Option value="in_progress">Devam Ediyor</Option>
            <Option value="done">Tamamlandı</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="Öncelik"
          rules={[{ required: true, message: 'Öncelik gerekli' }]}
        >
          <Select placeholder="Seçiniz">
            <Option value="low">Düşük</Option>
            <Option value="medium">Orta</Option>
            <Option value="high">Yüksek</Option>
          </Select>
        </Form.Item>

        <Form.Item name="assigneeId" label="Atanacak Kullanıcı">
          <Select
            placeholder="Bir kullanıcı seçin (isteğe bağlı)"
            allowClear
            disabled={members.length === 0}
          >
            {members.map((m) => (
              <Option key={m.userId} value={m.userId}>
                {m.user?.fullname || m.user?.username || `#${m.userId}`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Görev Oluştur
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewIssueModal;
