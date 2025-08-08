import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useSocket } from '../socket/SocketContext';

const NewProjectModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const socket = useSocket(); // şimdilik kullanmıyoruz ama yapıyı bozmayalım
  const [submitting, setSubmitting] = useState(false);

  // Proje adı benzersiz mi? (async validator)
  const validateUniqueName = async (_, value) => {
    const name = (value || '').trim();
    if (!name) return Promise.resolve();

    try {
      const res = await fetch(
        `/api/projects/check-name?name=${encodeURIComponent(name)}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Beklenen cevap: { exists: boolean }
      if (res.ok) {
        const data = await res.json();
        if (data?.exists) {
          return Promise.reject(new Error('Bu proje adı zaten kullanılıyor'));
        }
      }
      // Endpoint yoksa/başarısızsa validasyonu engellemeyelim (server submit’te yakalayacağız)
      return Promise.resolve();
    } catch {
      return Promise.resolve();
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(values),
      });

      // 409 => proje adı çakışması
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message || 'Bu proje adı zaten mevcut';
        form.setFields([{ name: 'name', errors: [msg] }]);
        message.error(msg);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.result) {
        throw new Error(data?.message || 'Proje oluşturulamadı');
      }

      message.success('✅ Proje başarıyla oluşturuldu');
      form.resetFields();
      onClose();

      // Anında ekle (socket beklemeye gerek yok)
      onSuccess?.(data.result);
    } catch (err) {
  console.error('🔥 Proje oluşturma hatası:', err);
  const msg = err?.response?.data?.message || err.message || 'Sunucu hatası';
  message.error({
    content: msg,
    icon: <ExclamationCircleOutlined style={{ color: 'red' }} />
  });
    }
  }
  return (
    <Modal
      title="Yeni Proje Oluştur"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      destroyOnClose  // ✅ doğru prop
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        validateFirst
      >
        <Form.Item
          name="name"
          label="Proje Adı"
          hasFeedback  // ✅ ikonları aç
          rules={[
            { required: true, message: 'Proje adı gerekli' },
            { validator: validateUniqueName }, // ✅ async benzersizlik kontrolü
          ]}
        >
          <Input placeholder="Proje adı girin" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Açıklama"
          hasFeedback  // istersen burada da ikon dursun
          rules={[{ required: true, message: 'Açıklama gerekli' }]}
        >
          <Input.TextArea placeholder="Açıklama girin" rows={4} />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              onClick={() => {
                form.resetFields();
                onClose();
              }}
            >
              İptal
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Oluştur
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewProjectModal;
