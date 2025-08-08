import { Form, Input, Button, Card, Typography, Alert } from "antd";
import { useAuth } from "../store/authContext";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";

const { Title, Text } = Typography;

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg(null);

    if (!isValidEmail(values.email)) {
      setErrorMsg("Lütfen geçerli bir e-posta adresi giriniz");
      setLoading(false);
      return;
    }

    try {
      await register(values);
      navigate("/");
    } catch (err) {
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Kayıt sırasında bir hata oluştu";
      setErrorMsg(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ maxWidth: 520, width: "100%", padding: "36px 0" }}>
        <Title
          level={1}
          style={{ textAlign: "center", fontSize: 44, marginBottom: 24 }}
        >
          Kayıt Ol
        </Title>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            style={{ marginBottom: 24, marginLeft: 24, marginRight: 24 }}
          />
        )}

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          validateTrigger={['onBlur', 'onChange']}   // ✅ anlık doğrulama
        >
          <Form.Item
            label="Kullanıcı Adı"
            name="username"
            colon={false}
            hasFeedback                                 // ✅ ikonlar
            rules={[{ required: true, message: "Kullanıcı adı gerekli" }]}
          >
            <Input size="large" placeholder="Kullanıcı adınızı girin" allowClear />
          </Form.Item>

          <Form.Item
            label="Ad Soyad"
            name="fullname"
            colon={false}
            hasFeedback
            rules={[{ required: true, message: "Ad soyad gerekli" }]}
          >
            <Input size="large" placeholder="Adınızı ve soyadınızı girin" allowClear />
          </Form.Item>

          <Form.Item
            label="E-posta"
            name="email"
            colon={false}
            hasFeedback
            rules={[
              { required: true, message: "E-posta gerekli" },
              { type: "email", message: "Geçerli bir e-posta girin" },
            ]}
          >
            <Input size="large" placeholder="E-posta adresinizi girin" allowClear />
          </Form.Item>

          <Form.Item
            label="Şifre"
            name="password"
            colon={false}
            hasFeedback
            rules={[{ required: true, message: "Şifre gerekli" }]}
          >
            <Input.Password size="large" placeholder="Şifrenizi girin" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              Kayıt Ol
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Text>Hesabın var mı? </Text>
          <Link to="/login">
            <b>Giriş Yap</b>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
