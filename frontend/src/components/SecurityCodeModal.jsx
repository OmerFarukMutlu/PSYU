import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, message, Typography } from 'antd';

const { Text } = Typography;

const SecurityCodeModal = ({ visible, onClose, forceCreate }) => {
  const [currentCode, setCurrentCode] = useState(null);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Mevcut kodu getir
  const fetchCode = async () => {
    console.log('🔹 [SecurityCodeModal] fetchCode() çalıştı');
    try {
      console.log('📡 GET /api/security-code çağrılıyor...');
      const res = await fetch('/api/security-code', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      console.log('📡 GET status:', res.status);
      const data = await res.json().catch(() => ({}));
      console.log('📥 GET cevabı:', data);

      if (!data.success || res.status === 404) {
        setCurrentCode(null);
        return;
      }

      setCurrentCode(data.code || null);
    } catch (err) {
      console.error('❌ Kod getirme hatası:', err);
      setCurrentCode(null);
    }
  };

  // Kod kaydet / güncelle
  const saveCode = async () => {
    console.log('🔹 [SecurityCodeModal] saveCode() çalıştı');
    console.log('📤 Gönderilecek kod:', newCode);

    if (!newCode.trim()) {
      return message.error('Güvenlik kodu gerekli');
    }
    setLoading(true);
    try {
      console.log('📡 POST /api/security-code body:', { code: newCode });
      const res = await fetch('/api/security-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code: newCode })
      });

      console.log('📡 POST status:', res.status);
      const data = await res.json().catch(() => ({}));
      console.log('📥 POST cevabı:', data);

      if (!data.success) {
        throw new Error(data.message || 'Kod kaydedilemedi');
      }

      message.success(data.message || 'Güvenlik kodu kaydedildi');
      setCurrentCode(data.code || newCode);
      setNewCode('');

      // forceCreate değilse modal kapat
      if (!forceCreate) {
        console.log('🔹 Modal kapatılıyor...');
        onClose();
      }
    } catch (err) {
      console.error('❌ Kod kaydetme hatası:', err);
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      console.log('🔹 Modal açıldı, fetchCode() tetikleniyor...');
      fetchCode();
    }
  }, [visible]);

  return (
    <Modal
      title={forceCreate ? 'Güvenlik Kodu Oluştur' : 'Güvenlik Kodu'}
      open={visible}
      onCancel={forceCreate ? null : onClose}
      footer={null}
      closable={!forceCreate}
      maskClosable={!forceCreate}
    >
      {currentCode ? (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Mevcut Kod:</Text>
          <div
            style={{
              padding: 8,
              background: '#f5f5f5',
              borderRadius: 4,
              userSelect: 'all',
              cursor: 'pointer'
            }}
            onClick={() => {
              navigator.clipboard.writeText(currentCode);
              message.success('Kod kopyalandı');
            }}
          >
            {currentCode}
          </div>
        </div>
      ) : (
        <Text type="secondary">Henüz güvenlik kodu oluşturulmamış</Text>
      )}

      <Input
        placeholder="Yeni güvenlik kodu girin"
        value={newCode}
        onChange={(e) => setNewCode(e.target.value)}
        style={{ marginTop: 16 }}
      />
      <Button
        type="primary"
        block
        style={{ marginTop: 12 }}
        loading={loading}
        onClick={saveCode}
      >
        Kaydet
      </Button>
      <Button
  style={{ marginTop: 8 }}
  block
  onClick={() => {
    onClose(); // Modalı kapat
    window.location.href = '/dashboard'; // Dashboard'a yönlendir
  }}
>
  Dashboard’a Dön
</Button>

    </Modal>
  );
};

export default SecurityCodeModal;
