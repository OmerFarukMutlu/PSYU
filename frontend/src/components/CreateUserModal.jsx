import {
  Modal, Form, Input, Select, Switch, message,
} from "antd";
import { useState } from "react";
import axios from "axios";

const { Option } = Select;

const CreateUserModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...values,
        email: values.email?.trim(),
        username: values.username?.trim(),
        fullname: values.fullname?.trim(),
      };

      await axios.post("/api/users", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success("Kullanıcı başarıyla oluşturuldu");
      form.resetFields();
      onCreated?.();
      onClose?.();
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Kullanıcı eklenemedi";

      // ✅ Backend'in gönderdiği alanı doğrudan işaretle
      const conflictField = err?.response?.data?.field; // 'email' | 'username'
      if (status === 409 && conflictField) {
        form.setFields([{ name: conflictField, errors: [msg] }]);
      } else if (status === 409) {
        // alan gelmediyse iki alanı da işaretle
        form.setFields([
          { name: "username", errors: [msg] },
          { name: "email", errors: [msg] },
        ]);
      }

      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Yeni Kullanıcı Oluştur"
      onCancel={onClose}
      okText="Oluştur"
      confirmLoading={loading}
      destroyOnClose
      // ✅ önce validateFields, sonra submit → alan hataları görünür
      onOk={async () => {
        try {
          const values = await form.validateFields();
          await handleFinish(values);
        } catch {
          /* validateFields hata verirse alanlar zaten kırmızı olur */
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        validateTrigger={["onBlur", "onSubmit"]}
      >
        <Form.Item
          name="fullname"
          label="Ad Soyad"
          normalize={(v) => (v || "").trim()}
          rules={[{ required: true, message: "Ad soyad gerekli" }]}
          hasFeedback
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="username"
          label="Kullanıcı Adı"
          normalize={(v) => (v || "").trim()}
          rules={[{ required: true, message: "Kullanıcı adı gerekli" }]}
          hasFeedback
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="E-posta"
          normalize={(v) => (v || "").trim()}
          rules={[
            { required: true, message: "E-posta gerekli" },
            { type: "email", message: "Geçerli bir e-posta girin" },
          ]}
          hasFeedback
        >
          <Input inputMode="email" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Şifre"
          rules={[{ required: true, message: "Şifre gerekli" }]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="role"
          label="Rol"
          initialValue="user"
          rules={[{ required: true, message: "Rol seçmelisiniz" }]}
        >
          <Select placeholder="Rol seçin">
            <Option value="admin_helper">admin_helper</Option>
            <Option value="project_manager">project_manager</Option>
            <Option value="developer">developer</Option>
            <Option value="tester">tester</Option>
            <Option value="user">user</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Aktif mi?"
          valuePropName="checked"
          initialValue
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;
