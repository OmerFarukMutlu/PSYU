import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const { Title, Text, Link } = Typography;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message?.toLowerCase().includes('kullanıcı')) {
          form.setFields([{ name: 'identity', errors: [data.message] }]);
        } else if (data.message?.toLowerCase().includes('şifre')) {
          form.setFields([{ name: 'password', errors: [data.message] }]);
        } else {
          message.error(data.message || 'Giriş başarısız');
        }
        return;
      }

      login(data.token);
      message.success('Giriş başarılı!');
      navigate('/dashboard');
    } catch (error) {
      message.error('Sunucuya ulaşılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: 380,
        margin: '80px auto',
        padding: 24,
        borderRadius: 12,
        background: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}
    >
      <Title level={2} style={{ marginBottom: 30 }}>
        Giriş Yap
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        validateTrigger={['onBlur', 'onChange']}   // ✅ anlık doğrulama
      >
        <Form.Item
          label="Kullanıcı Adı veya E-posta"
          name="identity"
          hasFeedback                                   // ✅ ikonlar
          rules={[{ required: true, message: 'Bu alan zorunludur' }]}
        >
          <Input size="large" allowClear autoComplete="username email" />
        </Form.Item>

        <Form.Item
          label="Şifre"
          name="password"
          hasFeedback
          rules={[{ required: true, message: 'Bu alan zorunludur' }]}
        >
          <Input.Password
            size="large"
            autoComplete="current-password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link href="/forgot-password">Şifremi Unuttum?</Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            style={{ fontWeight: 'bold' }}
          >
            Giriş Yap
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16 }}>
        <Text>Hesabın yok mu? </Text>
        <Link href="/register">Kayıt Ol</Link>
      </div>
    </div>
  );
};

export default Login;
