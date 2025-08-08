import React from 'react';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const DeleteProjectButton = ({ projectId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const allowedRoles = ['admin', 'admin_helper', 'project_manager'];
  const canDelete = user && allowedRoles.includes(user.role);

  const handleDelete = async () => {
    if (!canDelete) {
      message.error('Bu işlemi yapmaya yetkiniz yok');
      return;
    }

    const confirmed = window.confirm('Bu projeyi silmek istediğinize emin misiniz?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) {
        let errorMessage = 'Proje silinemedi.';
        try {
          const errorData = await res.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch {
          // JSON parse hatası varsa ignore et
        }
        throw new Error(errorMessage);
      }

      message.success('Proje başarıyla silindi.');
      navigate('/projects');
    } catch (err) {
      console.error('Projeyi silme hatası:', err);
      message.error(err.message || 'Proje silinemedi.');
    }
  };

  if (!canDelete) return null;

  return (
    <Button danger onClick={handleDelete}>
      Projeyi Sil
    </Button>
  );
};

export default DeleteProjectButton;
