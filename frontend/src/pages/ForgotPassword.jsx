import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [form] = Form.useForm();

  const handleVerifyCode = async (values) => {
    setLoading(true);
    try {
      const res = await fetch('/api/password-reset/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        // Alan bazlı hata gösterimi
        if (data.message?.toLowerCase().includes('kullanıcı bulunamadı')) {
          form.setFields([
            {
              name: 'email',
              errors: ['Bu e-posta adresi sistemde kayıtlı değil.'],
            },
          ]);
        } else if (data.message?.toLowerCase().includes('güvenlik kodu hatalı')) {
          form.setFields([
            {
              name: 'code',
              errors: ['Güvenlik kodu hatalı.'],
            },
          ]);
        } else {
          message.error(data.message || 'Doğrulama başarısız');
        }
        return;
      }

      message.success('Kod doğrulandı, yeni şifre belirleyebilirsiniz');
      setUserId(data.userId);
      setStep(2);
    } catch (err) {
      message.error(err.message || 'Sunucu hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (values) => {
    setLoading(true);
    try {
      const res = await fetch('/api/password-reset/set-new-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: values.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Şifre güncellenemedi');

      message.success('Şifre başarıyla güncellendi, giriş yapabilirsiniz');
      navigate('/login');
    } catch (err) {
      message.error(err.message || 'Sunucu hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f4f5f7',
        padding: 24,
      }}
    >
      <Card style={{ maxWidth: 400, width: '100%', padding: '24px 16px' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          {step === 1 ? 'Şifremi Unuttum' : 'Yeni Şifre Belirle'}
        </Title>

        {step === 1 ? (
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={handleVerifyCode}
          >
            <Form.Item
              label="E-posta"
              name="email"
              rules={[
                { required: true, message: 'E-posta gerekli' },
                { type: 'email', message: 'Geçerli bir e-posta girin' },
              ]}
            >
              <Input size="large" placeholder="E-posta adresinizi girin" />
            </Form.Item>

            <Form.Item
              label="Güvenlik Kodu"
              name="code"
              rules={[{ required: true, message: 'Güvenlik kodu gerekli' }]}
            >
              <Input size="large" placeholder="Güvenlik kodunuzu girin" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
              >
                Doğrula
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={handleSetNewPassword}
          >
            <Form.Item
              label="Yeni Şifre"
              name="newPassword"
              rules={[{ required: true, message: 'Yeni şifre gerekli' }]}
            >
              <Input.Password
                size="large"
                placeholder="Yeni şifrenizi girin"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
              >
                Şifreyi Güncelle
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
