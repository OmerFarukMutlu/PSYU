import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Yükleniyorsa spinner
  if (loading) {
    return <Spin fullscreen tip="Yükleniyor..." size="large" />;
  }

  // Kullanıcı yoksa login'e yönlendir
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
