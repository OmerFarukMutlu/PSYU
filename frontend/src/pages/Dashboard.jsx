// ↪️ Bu satırları koru
import React, { useState, useEffect } from 'react';
import { Button, Typography, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import SecurityCodeModal from '../components/SecurityCodeModal'; // Yeni modal component

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [modalVisible, setModalVisible] = useState(false);
  const [forceCreate, setForceCreate] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ✅ Admin yetkisi kontrolü (sadece buton için)
  const isAdmin = user?.role === 'admin' || user?.role === 'admin_helper';

  // Kullanıcının güvenlik kodu var mı kontrol et
  const checkSecurityCode = async () => {
    try {
      const res = await fetch('/api/security-code', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 404) {
        setForceCreate(true);
        setModalVisible(true);
      }
    } catch (err) {
      message.error('Güvenlik kodu kontrolü yapılamadı');
    }
  };

  useEffect(() => {
    checkSecurityCode();
  }, []);

  const handleModalClose = () => {
    setModalVisible(false);
    setForceCreate(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f5f7',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          position: 'relative'
        }}
        bodyStyle={{ padding: '40px 32px', textAlign: 'center' }}
      >
        {/* Sağ üst Güvenlik Kodu butonu */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <Button size="small" onClick={() => setModalVisible(true)}>
            Güvenlik Kodu
          </Button>
        </div>

        <Title level={3} style={{ fontWeight: 600, marginBottom: 16 }}>
          Hoş geldin{user?.fullname ? `, ${user.fullname}` : ''}!
        </Title>

        {/* Kullanıcı bilgileri kutusu */}
        <Card
          size="small"
          style={{
            background: '#fafafa',
            borderRadius: 8,
            marginBottom: 24,
            textAlign: 'left',
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Text strong>Ad Soyad:</Text> <Text>{user?.fullname || '-'}</Text><br />
          <Text strong>Email:</Text> <Text>{user?.email || '-'}</Text><br />
          <Text strong>Rol:</Text> <Text>{user?.role || '-'}</Text>
        </Card>

        {user?.role === 'user' ? (
          <Paragraph type="danger" style={{ fontSize: 16 }}>
            Hiçbir şeye erişiminiz yok. Yetkili kullanıcı size rol verene kadar bekleyiniz.
          </Paragraph>
        ) : (
          <>
            <Paragraph type="secondary" style={{ marginBottom: 24, fontSize: 16 }}>
              Takım projelerini yönetmeye başlamak için aşağıdan devam et.
            </Paragraph>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button
                type="primary"
                size="large"
                style={{ fontWeight: 500 }}
                onClick={() => navigate('/projects')}
              >
                Projeleri Gör
              </Button>

              {/* ✅ Admin ve yardımcısına özel panel butonu */}
              {isAdmin && (
                <Button
                  size="large"
                  type="default"
                  style={{ fontWeight: 500 }}
                  onClick={() => navigate('/admin/users')}
                >
                  Admin Kontrol Paneli
                </Button>
              )}
            </div>
          </>
        )}

        <Button
          type="default"
          danger
          size="large"
          onClick={handleLogout}
          style={{ marginTop: 20 }}
        >
          Çıkış Yap
        </Button>
      </Card>

      {/* Güvenlik kodu modal */}
      <SecurityCodeModal
        visible={modalVisible}
        onClose={handleModalClose}
        forceCreate={forceCreate}
      />
    </div>
  );
};

export default Dashboard;
