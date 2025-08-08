import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Tag,
  message,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Switch,
  Popconfirm
} from "antd";
import { SearchOutlined, UserAddOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../store/authContext";
import { Navigate } from "react-router-dom";
import { useSocket } from "../socket/SocketContext";

const { Option } = Select;
const { Title } = Typography;

const roleColors = {
  admin: "volcano",
  admin_helper: "gold",
  project_manager: "geekblue",
  team_lead: "purple",
  developer: "cyan",
  tester: "green",
  user: "default",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [creating, setCreating] = useState(false);       // ✅ modal loading

  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "admin_helper";
  const socket = useSocket();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  useEffect(() => { fetchUsers(); }, []);

  // ✅ Realtime dinleyiciler (admin yayınları)
  useEffect(() => {
    if (!socket) return;

    const onRole = ({ userId, role }) =>
      setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, role } : u));
    const onActive = ({ userId, isActive }) =>
      setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, isActive } : u));
    const onCreated = ({ user }) =>
      setUsers(prev => [user, ...prev]);
    const onUpdated = ({ user }) =>
      setUsers(prev => prev.map(u => String(u.id) === String(user.id) ? { ...u, ...user } : u));
    const onDeleted = ({ userId }) =>
      setUsers(prev => prev.filter(u => String(u.id) !== String(userId)));

    const onConnect = () => fetchUsers();

    socket.on("admin:roleUpdated", onRole);
    socket.on("admin:activeUpdated", onActive);
    socket.on("admin:userCreated", onCreated);
    socket.on("admin:userUpdated", onUpdated);
    socket.on("admin:userDeleted", onDeleted);
    socket.on("connect", onConnect);

    return () => {
      socket.off("admin:roleUpdated", onRole);
      socket.off("admin:activeUpdated", onActive);
      socket.off("admin:userCreated", onCreated);
      socket.off("admin:userUpdated", onUpdated);
      socket.off("admin:userDeleted", onDeleted);
      socket.off("connect", onConnect);
    };
  }, [socket]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("/api/users/admin-panel", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.result || []);
    } catch (err) {
      console.error("Kullanıcılar alınamadı", err);
      setUsers([]);
    }
  };

  // ✅ Optimistic role
  const handleRoleChange = async (userId, newRole) => {
    const prev = users;
    setUsers(p => p.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/api/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success(`Rol güncellendi: ${newRole}`);
    } catch (err) {
      setUsers(prev);
      message.error("Rol güncellenemedi");
    }
  };

  // ✅ Optimistic active
  const handleToggleActive = async (userId, isActive) => {
    const prev = users;
    setUsers(p => p.map(u => (u.id === userId ? { ...u, isActive } : u)));
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/api/users/${userId}/activate`, { isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success(`Kullanıcı ${isActive ? "aktif" : "pasif"} hale getirildi`);
    } catch (err) {
      setUsers(prev);
      message.error("Aktiflik durumu güncellenemedi");
    }
  };

  // ✅ Create (alan altı hata)
  const handleCreateUser = async (values) => {
    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Token bulunamadı, lütfen tekrar giriş yapın.");
        return;
      }

      const payload = {
        ...values,
        fullname: values.fullname?.trim(),
        username: values.username?.trim(),
        email: values.email?.trim(),
      };

      const res = await axios.post("/api/users", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });

      message.success(res.data.message || "Kullanıcı oluşturuldu");
      setModalOpen(false);
      form.resetFields();
      // admin:userCreated soketten listeye düşecek
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Kullanıcı oluşturulamadı";

      const field = err?.response?.data?.field; // backend'de eklediğimiz field
      if (status === 409 && field) {
        form.setFields([{ name: field, errors: [msg] }]);
      } else if (status === 409) {
        form.setFields([
          { name: "username", errors: [msg] },
          { name: "email", errors: [msg] },
        ]);
      } else if (status === 400 && /e-?posta|email/i.test(msg)) {
        form.setFields([{ name: "email", errors: [msg] }]);
      }

      message.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (values) => {
    try {
      if (!selectedUser) {
        message.error("Güncellenecek kullanıcı seçilmedi.");
        return;
      }
      const token = localStorage.getItem("token");
      await axios.put(`/api/users/${selectedUser.id}`, values, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      message.success("Kullanıcı bilgileri güncellendi");
      setEditModalOpen(false);
      // admin:userUpdated event'ı listede güncelleyecek
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Kullanıcı güncellenemedi";

      const field = err?.response?.data?.field;
      if (status === 409 && field) {
        editForm.setFields([{ name: field, errors: [msg] }]);
      } else if (status === 409) {
        editForm.setFields([
          { name: "username", errors: [msg] },
          { name: "email", errors: [msg] },
        ]);
      }

      message.error(msg);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success("Kullanıcı silindi");
      // admin:userDeleted event'ı listeden kaldıracak
    } catch (err) {
      message.error("Kullanıcı silinemedi");
    }
  };

  const openEditModal = (record) => {
    setSelectedUser(record);
    setEditModalOpen(true);
    editForm.setFieldsValue(record);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch =
      (u.fullname || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const columns = [
    { title: "Kullanıcı Adı", dataIndex: "username", key: "username" },
    { title: "Ad Soyad", dataIndex: "fullname", key: "fullname" },
    { title: "E-posta", dataIndex: "email", key: "email" },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag color={roleColors[role] || "default"}>{role}</Tag>
    },
    {
      title: "Aktif mi?",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive, record) => (
        <Switch
          checked={!!isActive}
          disabled={record.isMainAdmin}
          onChange={(checked) => handleToggleActive(record.id, checked)}
        />
      ),
    },
    {
      title: "Rolü Değiştir",
      key: "changeRole",
      render: (_, record) => (
        <Select
          value={record.role}
          style={{ width: 180 }}
          onChange={(val) => handleRoleChange(record.id, val)}
          disabled={record.isMainAdmin}
        >
          {Object.keys(roleColors)
            .filter(r => r !== "admin")
            .map(r => (
              <Option key={r} value={r}>{r}</Option>
            ))}
        </Select>
      ),
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (_, record) =>
        (isAdmin && !record.isMainAdmin) && (
          <>
            <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>Düzenle</Button>
            <Popconfirm title="Kullanıcı silinsin mi?" onConfirm={() => handleDeleteUser(record.id)}>
              <Button danger icon={<DeleteOutlined />} style={{ marginLeft: 8 }}>Sil</Button>
            </Popconfirm>
          </>
        )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col><Title level={3}>Kullanıcı Yönetimi</Title></Col>
        {isAdmin && (
          <Col>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => setModalOpen(true)}>
              Yeni Kullanıcı Ekle
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Kullanıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
        </Col>
        <Col>
          <Select
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            placeholder="Role göre filtrele"
            allowClear
            style={{ width: 240 }}
          >
            {Object.keys(roleColors)
              .filter(r => r !== "admin")
              .map(r => <Option key={r} value={r}>{r}</Option>)}
          </Select>
        </Col>
      </Row>

      <Table
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        bordered
        pagination={false}
      />

      {/* Yeni Kullanıcı Modalı */}
      <Modal
        open={modalOpen}
        title="Yeni Kullanıcı Oluştur"
        onCancel={() => setModalOpen(false)}
        okText="Oluştur"
        confirmLoading={creating}
        onOk={async () => {
          try {
            const values = await form.validateFields();   // ✅ önce doğrula
            await handleCreateUser(values);
          } catch {
            /* alanlar kırmızı gösterilir */
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
          initialValues={{ isActive: true, role: "user" }}
        >
          <Form.Item
            name="fullname"
            label="Ad Soyad"
            rules={[{ required: true, message: "Ad soyad gerekli" }]}
            hasFeedback
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="username"
            label="Kullanıcı Adı"
            rules={[{ required: true, message: "Kullanıcı adı gerekli" }]}
            hasFeedback
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-posta"
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
            rules={[{ required: true, message: "Rol seçmelisiniz" }]}
          >
            <Select>
              {Object.keys(roleColors)
                .filter(r => r !== "admin")
                .map(r => (
                  <Option key={r} value={r}>{r}</Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Aktif mi?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Kullanıcı Düzenleme Modalı */}
      <Modal
        open={editModalOpen}
        title="Kullanıcı Düzenle"
        onCancel={() => setEditModalOpen(false)}
        okText="Kaydet"
        onOk={() => editForm.submit()}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
          requiredMark={false}
          validateTrigger={["onBlur", "onSubmit"]}
        >
          <Form.Item
            name="fullname"
            label="Ad Soyad"
            rules={[{ required: true, message: "Ad soyad gerekli" }]}
            hasFeedback
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
            label="Kullanıcı Adı"
            rules={[{ required: true, message: "Kullanıcı adı gerekli" }]}
            hasFeedback
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: "E-posta gerekli" },
              { type: "email", message: "Geçerli bir e-posta girin" },
            ]}
            hasFeedback
          >
            <Input inputMode="email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
