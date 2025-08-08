import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { Spin } from 'antd';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Yükleniyorsa spinner
  if (loading) {
    return <Spin fullscreen tip="Yükleniyor..." size="large" />;
  }

  // Kullanıcı varsa login/register sayfasına girilmesin
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default PublicRoute;
