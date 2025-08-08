import React, { useEffect } from 'react';
import { Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import './landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Auth init bitmeden yönlendirme yapma
  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  // Yükleniyorsa fullscreen spinner
  if (loading) {
    return <Spin fullscreen tip="Oturum kontrol ediliyor..." />;
  }

  return (
    <div className="custom-landing">
      <h1 className="custom-title">Projelerini kolayca yönet</h1>
      <p className="custom-subtitle">
        Takımını organize et, görevleri planla ve projelerini tek noktadan yönet.
      </p>

      <div className="custom-buttons">
        <Button
          type="primary"
          size="large"
          className="register-btn"
          onClick={() => navigate('/register')}
        >
          Kayıt Olun
        </Button>
        <Button
          size="large"
          className="login-btn"
          onClick={() => navigate('/login')}
        >
          Giriş Yap
        </Button>
      </div>
    </div>
  );
};

export default Landing;
