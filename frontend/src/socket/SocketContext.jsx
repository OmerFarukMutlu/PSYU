import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { message } from 'antd';
import { useAuth } from '../store/authContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const { user, applyRoleUpdate, applyActiveUpdate } = useAuth();

  useEffect(() => {
    if (!user) return; // kullanıcı giriş yapmamışsa websocket başlatma

    // ✅ WebSocket bağlantısı
    socketRef.current = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket'],
    });

    const handleConnect = () => {
      console.log('✅ WebSocket bağlandı:', socketRef.current.id);
      setConnected(true);
      // 🔔 Kişisel odaya katıl
      socketRef.current.emit('joinUser', { userId: user.id });
    };

    const handleDisconnect = () => {
      console.log('❌ WebSocket bağlantısı kesildi.');
      setConnected(false);
    };

    // 🔊 Rol değişti
    const onRoleUpdated = ({ role }) => {
      applyRoleUpdate?.(role);
      message.info(`Rolün güncellendi: ${role}`);
    };

    // 🔊 Aktiflik değişti
    const onActiveUpdated = ({ isActive }) => {
      applyActiveUpdate?.(isActive);
      if (!isActive) message.warning('Hesabınız pasifleştirildi');
    };

    // ✅ Projeye eklenince
    const onProjectAdded = ({ project }) => {
      message.success(`Yeni bir projeye eklendiniz: ${project.name}`);
      window.dispatchEvent(new CustomEvent('socket:projectAdded', { detail: project }));
    };

    // ✅ Projeden atılınca
    const onKickedFromProject = ({ projectId }) => {
      message.warning('Bir projeden çıkarıldınız.');
      window.dispatchEvent(new CustomEvent('socket:projectKicked', { detail: { projectId } }));
    };

    // ✅ Rol değişince
    const onProjectMemberRoleChanged = ({ projectId, newRole }) => {
      applyRoleUpdate?.(newRole);
      message.info(`Rolünüz güncellendi: ${newRole}`);
      window.dispatchEvent(new CustomEvent('socket:roleChanged', { detail: { projectId, newRole } }));
    };

    // ✅ Üye listesi güncellendi
    const onProjectMemberUpdated = ({ project }) => {
      window.dispatchEvent(new CustomEvent('socket:projectMemberUpdated', { detail: project }));
    };

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('roleUpdated', onRoleUpdated);
    socketRef.current.on('activeUpdated', onActiveUpdated);

    socketRef.current.on('projectAddedForUser', onProjectAdded);
    socketRef.current.on('kickedFromProject', onKickedFromProject);
    socketRef.current.on('projectMemberRoleChanged', onProjectMemberRoleChanged);
    socketRef.current.on('projectMemberUpdated', onProjectMemberUpdated);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, applyRoleUpdate, applyActiveUpdate]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
