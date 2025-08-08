import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Button, Tooltip, message, Space, Divider, Modal, Input
} from 'antd';
import {
  PlusOutlined, TeamOutlined, EditOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import NewIssueModal from '../components/NewIssueModal';
import ProjectMembersPanel from '../components/ProjectMembersPanel';
import DeleteProjectButton from '../components/DeleteProjectButton';
import { useAuth } from '../store/authContext';
import TaskEditModal from '../components/TaskEditModal';
import { useSocket } from '../socket/SocketContext';

const { Title, Text } = Typography;

const statusColumns = [
  { key: 'todo', title: 'YAPILACAKLAR' },
  { key: 'in_progress', title: 'DEVAM EDİYOR' },
  { key: 'done', title: 'TAMAM ✓' }
];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedAssignee, setEditedAssignee] = useState(null);
  const [editedPriority, setEditedPriority] = useState('');

  const fetchTasks = async () => {
    const res = await fetch(`/api/projects/${id}/issues`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setTasks(data.result || []);
  };

  useEffect(() => {
    fetch(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success !== false && data.result) {
          setProject(data.result);
        } else {
          setProject({ name: 'Bilinmeyen Proje', id });
        }
      });

    fetchTasks();

    fetch(`/api/projects/${id}/members`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setProjectMembers(data.result || []));
  }, [id]);

  // === WS HANDLER ===
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('joinProject', id);

    const handleNewIssue = ({ issue, projectId: pid }) => {
      if (String(pid) !== String(id)) return;
      if (!issue || !issue.status) return;

      setTasks(prev => {
        const exists = prev.some(t => t.id === issue.id);
        if (exists) return prev;
        return [...prev, issue];
      });
    };

    const handleIssueDeleted = ({ issueId, projectId: pid }) => {
      if (String(pid) === String(id)) {
        setTasks(prev => prev.filter(t => t.id !== issueId));
      }
    };

    const handleIssueMoved = ({ issueId, newStatus, projectId: pid }) => {
      if (String(pid) === String(id)) {
        setTasks(prev =>
          prev.map(task =>
            task.id.toString() === issueId
              ? { ...task, status: newStatus }
              : task
          )
        );
      }
    };

    // 👇 Düzenlenen görev kartını (başlık/öncelik/atanan) anlık güncelle
    const handleIssueUpdated = ({ issue, projectId: pid }) => {
      if (String(pid) !== String(id) || !issue) return;
      setTasks(prev => prev.map(t => (t.id === issue.id ? { ...t, ...issue } : t)));
    };

    const handleDescriptionUpdated = ({ description }) => {
      setProject(prev => ({ ...prev, description }));
    };

    // 👇 Üye ekle/çıkar/rol değişince listeyi anlık yenile
    const handleMembersUpdated = ({ project }) => {
      if (!project || String(project.id) !== String(id)) return;
      setProjectMembers(project.projectMembers || []);
    };

    // 👇 Ben projeden atılırsam direkt projeler sayfasına
    const handleKickedFromProject = ({ projectId: pid, userId }) => {
      if (String(pid) === String(id) && user?.id === userId) {
        message.warning('Bu projeden çıkarıldınız.');
        navigate('/projects');
      }
    };

    // ⬇️ YENİ: Proje tamamen silinirse bu sayfayı kapat
    const handleProjectDeleted = ({ projectId: pid }) => {
      if (String(pid) !== String(id)) return;
      message.warning('Bu proje silindi. Projeler sayfasına yönlendiriliyorsunuz.');
      navigate('/projects', { replace: true });
    };

    socket.on('newIssue', handleNewIssue);
    socket.on('issueDeleted', handleIssueDeleted);
    socket.on('issueMoved', handleIssueMoved);
    socket.on('issueUpdated', handleIssueUpdated);
    socket.on('projectDescriptionUpdated', handleDescriptionUpdated);
    socket.on('projectMemberUpdated', handleMembersUpdated);
    socket.on('kickedFromProject', handleKickedFromProject);
    socket.on('projectDeleted', handleProjectDeleted); // ✨ eklendi

    return () => {
      socket.off('newIssue', handleNewIssue);
      socket.off('issueDeleted', handleIssueDeleted);
      socket.off('issueMoved', handleIssueMoved);
      socket.off('issueUpdated', handleIssueUpdated);
      socket.off('projectDescriptionUpdated', handleDescriptionUpdated);
      socket.off('projectMemberUpdated', handleMembersUpdated);
      socket.off('kickedFromProject', handleKickedFromProject);
      socket.off('projectDeleted', handleProjectDeleted); // ✨ eklendi
    };
  }, [socket, id, user?.id, navigate]);

  const groupedTasks = statusColumns.reduce((acc, col) => {
    acc[col.key] = tasks.filter(task => task.status === col.key);
    return acc;
  }, {});

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const columnTasks = groupedTasks[source.droppableId];
      const reordered = Array.from(columnTasks);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      const newTasks = tasks.map(t =>
        t.status === source.droppableId
          ? reordered.find(r => r.id === t.id) || t
          : t
      );
      setTasks(newTasks);
      return;
    }

    const updatedTasks = tasks.map(task =>
      task.id.toString() === draggableId ? { ...task, status: destination.droppableId } : task
    );
    setTasks(updatedTasks);

    try {
      const res = await fetch(`/api/projects/${id}/issues/${draggableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: destination.droppableId })
      });

      if (!res.ok) throw new Error('Güncelleme başarısız');
      message.success('Görev güncellendi');

      if (socket) {
        socket.emit('moveIssue', {
          issueId: draggableId,
          newStatus: destination.droppableId,
          projectId: id
        });
      }
    } catch (err) {
      message.error('Görev güncellenemedi');
    }
  };

  const globalAllowedRoles = ['admin', 'admin_helper', 'project_manager'];
  const projectAllowedRole = 'team_lead';

  const canAddTask = user && (
    globalAllowedRoles.includes(user.role) ||
    projectMembers.some(member => member.userId === user.id && member.role === projectAllowedRole)
  );

  const canEditDescription = canAddTask;
  const canManageProject = canAddTask;

  const handleUpdateDescription = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ description: newDescription })
      });

      if (!res.ok) throw new Error('Açıklama güncellenemedi');

      setProject(prev => ({ ...prev, description: newDescription }));
      message.success('Açıklama güncellendi');
      setEditModalOpen(false);

      socket.emit('descriptionUpdated', {
        projectId: id,
        description: newDescription
      });

    } catch (err) {
      message.error('Açıklama güncellenemedi');
    }
  };

  const handleOpenTaskEdit = (task) => {
    setSelectedTask(task);
    setEditedTitle(task.title);
    setEditedAssignee(task.assignee?.id || null);
    setEditedPriority(task.priority);
    setTaskEditModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/projects/${id}/issues/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) throw new Error();
      message.success('Görev silindi');
      setTasks(prev => prev.filter(t => t.id !== taskId));

      socket.emit('deleteIssue', {
        issueId: taskId,
        projectId: id
      });

    } catch {
      message.error('Görev silinemedi');
    }
  };

  const handleSaveTaskEdit = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/issues/${selectedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: editedTitle,
          assigneeId: editedAssignee,
          priority: editedPriority
        })
      });

      if (!res.ok) throw new Error();

      // Sunucu güncel issue döndürmüyorsa localden oluştur
      let payload = null;
      try { payload = await res.json(); } catch {}
      const updatedIssueFromApi = payload?.result || payload?.issue;

      const assigneeUser = projectMembers.find(m => m.userId === editedAssignee)?.user || null;
      const updatedIssue = updatedIssueFromApi || {
        ...selectedTask,
        title: editedTitle,
        priority: editedPriority,
        assignee: assigneeUser,
        assigneeId: editedAssignee
      };

      // Kendi ekranda hemen güncelle
      setTasks(prev => prev.map(t => (t.id === selectedTask.id ? { ...t, ...updatedIssue } : t)));
      message.success('Görev güncellendi');
      setTaskEditModalOpen(false);

      // Diğer kullanıcılara yayınla
      if (socket) {
        socket.emit('updateIssue', { issue: updatedIssue, projectId: id });
      }
    } catch {
      message.error('Görev güncellenemedi');
    }
  };

  return (
    <div style={{ padding: '40px 40px', background: '#f7f9fb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{
          background: '#e8f4ff',
          padding: '20px 24px',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Title level={2} style={{ marginBottom: 0, color: '#0050b3' }}>
            {project?.name || 'Bilinmeyen Proje'}
          </Title>
          {project?.description && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text>{project.description}</Text>
              {canEditDescription && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setNewDescription(project.description);
                    setEditModalOpen(true);
                  }}
                />
              )}
            </div>
          )}
          {project?.createdAt && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              Oluşturulma: {new Date(project.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </div>

        <Space>
          {canManageProject && (
            <Tooltip title="Üye Yönetimi">
              <Button icon={<TeamOutlined />} onClick={() => setMembersOpen(true)} />
            </Tooltip>
          )}
          {canAddTask && (
            <Tooltip title="Yeni Görev">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                Yeni Görev
              </Button>
            </Tooltip>
          )}
          {canManageProject && <DeleteProjectButton projectId={id} />}
        </Space>
      </div>

      <Divider />

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 24 }}>
          {statusColumns.map(column => (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} key={column.key}>
              <div
                style={{
                  padding: 16,
                  background: '#fafafa',
                  border: '1px solid #eee',
                  borderRadius: '12px 12px 0 0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <Title level={4} style={{ margin: 0 }}>{column.title}</Title>
              </div>

              <Droppable droppableId={column.key}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      background: '#fff',
                      borderRadius: '0 0 12px 12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    {groupedTasks[column.key]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              padding: 12,
                              background: '#f5f5f5',
                              borderRadius: 8,
                              boxShadow: snapshot.isDragging
                                ? '0 4px 12px rgba(0,0,0,0.15)'
                                : '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'box-shadow 0.2s ease',
                              ...provided.draggableProps.style
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text strong>{task.title}</Text>
                              <Space>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => navigate(`/issues/${task.id}/comments`)}
                                />
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<InfoCircleOutlined />}
                                  onClick={() => handleOpenTaskEdit(task)}
                                />
                                {(
                                  globalAllowedRoles.includes(user.role) ||
                                  projectMembers.some(m => m.userId === user.id && m.role === projectAllowedRole)
                                ) && (
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    ✖
                                  </Button>
                                )}
                              </Space>
                            </div>
                            <div style={{ fontSize: 12, color: '#888' }}>
                              {{ low: 'Düşük', medium: 'Orta', high: 'Yüksek' }[task.priority]} • {task.assignee?.username || 'Atanmadı'}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <NewIssueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newTask) => {
          setTasks(prev => {
            if (prev.find(t => t.id === newTask.id)) return prev;
            return [...prev, newTask];
          });
        }}
        projectId={id}
      />

      <ProjectMembersPanel
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        projectId={id}
      />

      <Modal
        title="Proje Açıklamasını Düzenle"
        open={editModalOpen}
        onOk={handleUpdateDescription}
        onCancel={() => setEditModalOpen(false)}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Input.TextArea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          rows={4}
        />
      </Modal>

      <TaskEditModal
        open={taskEditModalOpen}
        onCancel={() => setTaskEditModalOpen(false)}
        onSave={handleSaveTaskEdit}
        editedTitle={editedTitle}
        setEditedTitle={setEditedTitle}
        editedAssignee={editedAssignee}
        setEditedAssignee={setEditedAssignee}
        editedPriority={editedPriority}
        setEditedPriority={setEditedPriority}
        projectMembers={projectMembers}
        user={user}
        currentProjectMembers={projectMembers}
      />
    </div>
  );
};

export default ProjectDetail;
