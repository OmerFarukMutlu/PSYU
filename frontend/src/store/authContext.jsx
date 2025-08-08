import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        if (!data?.id) throw new Error('Invalid payload');

        setUser({ ...data, role: data.role || "", token });
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (token) => {
    localStorage.setItem('token', token);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      if (!data?.id) throw new Error('Invalid payload');

      setUser({ ...data, role: data.role || "", token });
      navigate('/dashboard', { replace: true });
    } catch (e) {
      localStorage.removeItem('token');
      setUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/', { replace: true });
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Kayıt başarısız');

    if (data.token) await login(data.token);
    return data;
  };

  // ✅ SocketProvider bu fonksiyonları çağıracak (anlık güncelleme)
  const applyRoleUpdate = (role) => {
    setUser(prev => (prev ? { ...prev, role } : prev));
  };

  const applyActiveUpdate = (isActive) => {
    setUser(prev => (prev ? { ...prev, isActive } : prev));
  };

  // ✅ Rol/aktiflik değişince erişimi anında kısıtla
  useEffect(() => {
    if (!user) return;

    // Hesap pasif olduysa
    if (user.isActive === false) {
      message.warning('Hesabınız pasifleştirildi.');
      // istersen burada direkt logout():
      // logout();
      navigate('/', { replace: true });
      return;
    }

    // "user" rolü proje/admin sayfalarında olamaz
    if (user.role === 'user') {
      const path = location.pathname;
      if (path.startsWith('/projects') || path.startsWith('/admin')) {
        message.info('Bu sayfaya erişim yetkiniz yok.');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user?.role, user?.isActive, location.pathname]); // location’ı da izle

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authReady: !loading,
        login,
        logout,
        register,
        applyRoleUpdate,   // ⬅️ SocketProvider kullanacak
        applyActiveUpdate  // ⬅️ SocketProvider kullanacak
      }}
    >
      {loading
        ? <div style={{ textAlign: "center", marginTop: 50 }}>Yükleniyor...</div>
        : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
