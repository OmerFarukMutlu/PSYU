import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';

const { Option } = Select;

const EditIssueModal = ({ open, onClose, issue, onSuccess, projectId }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId && open) {
      fetch(`/api/projects/${projectId}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setMembers(data.result || []))
        .catch(() => setMembers([]));
    }
  }, [projectId, open]);

  useEffect(() => {
    if (issue && open) {
      form.setFieldsValue({
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId || null,
      });
    }
  }, [issue, open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/issues/${issue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Güncelleme başarısız');
      message.success('Görev güncellendi');
      onSuccess?.(data);
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Görevi Düzenle"
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="title" label="Başlık" rules={[{ required: true, message: 'Başlık zorunludur' }]}> 
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Açıklama">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="status" label="Durum" rules={[{ required: true }]}> 
          <Select>
            <Option value="todo">Yapılacak</Option>
            <Option value="in_progress">Devam Ediyor</Option>
            <Option value="done">Tamamlandı</Option>
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="Öncelik" rules={[{ required: true }]}> 
          <Select>
            <Option value="low">Düşük</Option>
            <Option value="medium">Orta</Option>
            <Option value="high">Yüksek</Option>
          </Select>
        </Form.Item>

        <Form.Item name="assigneeId" label="Atanan Kullanıcı">
          <Select allowClear>
            {members.map((m) => (
              <Option key={m.userId} value={m.userId}>{m.username}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Güncelle
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditIssueModal;
