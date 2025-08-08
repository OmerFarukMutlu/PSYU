import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Tooltip, Empty, message } from 'antd';
import { PlusOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import NewProjectModal from '../components/NewProjectModal';
import { useSocket } from '../socket/SocketContext';

const { Title, Text, Paragraph } = Typography;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const allowedRoles = ['admin', 'admin_helper', 'project_manager'];
  const canCreateProject = user && allowedRoles.includes(user.role);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !Array.isArray(data.result)) {
        message.error('Projeler yüklenemedi');
        setProjects([]);
      } else {
        setProjects(data.result);
      }
    } catch (err) {
      console.error('🔥 Proje yükleme hatası:', err);
      message.error('Sunucu hatası');
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleProjectDeleted = ({ projectId }) => {
      setProjects((prev) => prev.filter((p) => p.id.toString() !== projectId.toString()));
    };

    const handleProjectCreated = ({ project }) => {
      if (!project || !Array.isArray(project.projectMembers)) return;

      const isCurrentUserInProject = project.projectMembers.some(
        (member) => member.user?.id === user?.id
      );

      if (isCurrentUserInProject) {
        setProjects((prev) => {
          const alreadyExists = prev.some((p) => p.id === project.id);
          if (!alreadyExists) return [project, ...prev];
          return prev;
        });
      }
    };

    const handleProjectMemberUpdated = ({ project }) => {
      if (!project || !Array.isArray(project.projectMembers)) return;

      const isCurrentUserInProject = project.projectMembers.some(
        (member) => member.user?.id === user?.id
      );

      setProjects((prev) => {
        const exists = prev.some((p) => p.id === project.id);

        if (isCurrentUserInProject && !exists) {
          return [project, ...prev];
        }

        if (!isCurrentUserInProject && exists) {
          return prev.filter((p) => p.id !== project.id);
        }

        return prev;
      });
    };

    // ✅ Eklenen yeni projeyi bireysel eventten yakala
    const handleProjectAddedForUser = ({ project }) => {
      if (!project) return;
      setProjects((prev) => {
        if (prev.some((p) => p.id === project.id)) return prev;
        return [project, ...prev];
      });
    };

    // ✅ Çıkarılan projeyi listeden düşür
    const handleKickedFromProject = ({ projectId }) => {
      setProjects((prev) => prev.filter((p) => String(p.id) !== String(projectId)));
    };

    socket.on('projectDeleted', handleProjectDeleted);
    socket.on('projectCreated', handleProjectCreated);
    socket.on('projectMemberUpdated', handleProjectMemberUpdated);
    socket.on('projectAddedForUser', handleProjectAddedForUser);
    socket.on('kickedFromProject', handleKickedFromProject);

    return () => {
      socket.off('projectDeleted', handleProjectDeleted);
      socket.off('projectCreated', handleProjectCreated);
      socket.off('projectMemberUpdated', handleProjectMemberUpdated);
      socket.off('projectAddedForUser', handleProjectAddedForUser);
      socket.off('kickedFromProject', handleKickedFromProject);
    };
  }, [socket, user?.id]);

  // ✅ Proje eklendikten sonra kendi listemize anında ekle
  const handleSuccess = (project) => {
    setIsModalOpen(false);

    const isCurrentUserInProject = project.projectMembers?.some(
      (member) => member.user?.id === user?.id
    );

    if (isCurrentUserInProject) {
      setProjects((prev) => {
        const alreadyExists = prev.some((p) => p.id === project.id);
        if (!alreadyExists) return [project, ...prev];
        return prev;
      });
    }
  };

  return (
    <div style={{ padding: '40px 80px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Projeler
        </Title>
        {canCreateProject && (
          <Tooltip title="Yeni Proje Ekle">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Yeni Proje
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Liste */}
      {projects.length === 0 ? (
        <Empty description="Henüz bir projeniz yok" style={{ marginTop: 80 }} />
      ) : (
        <Row gutter={[24, 24]}>
          {projects
            .filter((p) => p && p.name)
            .map((project) => (
              <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/projects/${project.id}`)}
                  style={{
                    borderRadius: 12,
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s',
                  }}
                >
                  <Tooltip title={project.name}>
                    <Text strong style={{ fontSize: 16 }}>
                      {project.name}
                    </Text>
                  </Tooltip>

                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: '12px 0 8px' }}>
                    {project.description || 'Açıklama bulunamadı'}
                  </Paragraph>

                  <div
                    style={{
                      fontSize: 13,
                      color: '#999',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span>
                      <UserOutlined /> Oluşturan: {project.creator?.fullname || 'Bilinmiyor'}
                    </span>
                    <span>
                      <CalendarOutlined /> {project.createdAt?.slice(0, 10) || 'Tarih yok'}
                    </span>
                  </div>
                </Card>
              </Col>
            ))}
        </Row>
      )}

      {/* Yeni Proje Modal */}
      <NewProjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Projects;
