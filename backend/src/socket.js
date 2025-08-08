let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Socket bağlandı: ${socket.id}`);

      // ✅ Kullanıcı odası
      socket.on('joinUser', ({ userId }) => {
        if (!userId) return;
        const room = `user:${userId}`;
        socket.join(room);
        console.log(`🟢 ${socket.id} → Kullanıcı odasına katıldı: ${room}`);
      });

      // ✅ Proje odası
      socket.on('joinProject', (projectId) => {
        if (!projectId) return;
        socket.join(String(projectId));
        console.log(`🟢 ${socket.id} → Odaya katıldı: ${projectId}`);
      });

      // ✅ Issue odası (yorum/description için hedef yayın)
      socket.on('joinIssue', (issueId) => {
        if (!issueId) return;
        socket.join(`issue:${issueId}`);
        console.log(`🟢 ${socket.id} → Odaya katıldı: issue:${issueId}`);
      });

      // ✅ Yeni görev eklendi
      socket.on('newIssue', ({ issue, projectId }) => {
        if (!issue || !projectId) return;
        io.to(String(projectId)).emit('newIssue', { issue, projectId });
      });

      // ✅ Görev silindi
      socket.on('deleteIssue', ({ issueId, projectId }) => {
        if (!issueId || !projectId) return;
        io.to(String(projectId)).emit('issueDeleted', { issueId, projectId });
      });

      // ✅ Görev taşındı
      socket.on('moveIssue', ({ issueId, newStatus, projectId }) => {
        if (!issueId || !newStatus || !projectId) return;
        io.to(String(projectId)).emit('issueMoved', { issueId, newStatus, projectId });
      });

      // ✅ Görev güncellendi (başlık/atanan/öncelik)
      socket.on('updateIssue', ({ issue, projectId }) => {
        if (!issue || !projectId) return;
        io.to(String(projectId)).emit('issueUpdated', { issue, projectId });
      });

      // ✅ (PROJE) açıklama güncellendi
      socket.on('descriptionUpdated', ({ projectId, description }) => {
        if (!projectId || typeof description !== 'string') return;
        io.to(String(projectId)).emit('projectDescriptionUpdated', { description });
      });

      // ✅ (ISSUE) açıklama güncellendi → proje + issue odasına yayın
      socket.on('updateIssueDescription', ({ projectId, issueId, description }) => {
        if (!issueId) return;
        const payload = {
          projectId: projectId ? String(projectId) : null,
          issueId: String(issueId),
          description: typeof description === 'string' ? description : ''
        };
        if (projectId) io.to(String(projectId)).emit('issueDescriptionUpdated', payload);
        io.to(`issue:${issueId}`).emit('issueDescriptionUpdated', payload);
      });

      // ✅ Yorumlar — SADECE ilgili issue/proje odasına yayınla (global değil!)
      socket.on('newComment', (data) => {
        if (!data) return;
        const iid = String(data.issueId ?? data.issue?.id ?? '');
        const pid = data.projectId ?? data.issue?.projectId ?? null;
        if (iid) io.to(`issue:${iid}`).emit('receiveComment', data);
        if (pid) io.to(String(pid)).emit('receiveComment', data);
      });

      socket.on('updateComment', (updatedComment) => {
        const iid = String(updatedComment?.issueId ?? '');
        const pid = updatedComment?.projectId ?? null;
        if (iid) io.to(`issue:${iid}`).emit('updateComment', updatedComment);
        if (pid) io.to(String(pid)).emit('updateComment', updatedComment);
      });

      socket.on('commentDeleted', (commentId) => {
        // burada da issueId/projeId varsa aynı şekilde odalara gönderebilirsin
        io.emit('commentDeleted', commentId);
      });

      // ✅ Proje bireysel bildirimleri
      socket.on('projectCreatedFor', ({ userId, project }) => {
        if (!userId || !project) return;
        io.emit(`projectForUser-${userId}`, { project });
        io.to(`user:${userId}`).emit('projectForUser', { project });
      });

      socket.on('projectMemberAdded', ({ userId, project }) => {
        if (!userId || !project) return;
        io.emit(`projectForUser-${userId}`, { project });
        io.to(`user:${userId}`).emit('projectForUser', { project });
      });

      // ✅ Proje üyeleri genel broadcast (yardımcı eventler)
      socket.on('memberAdded', ({ projectId }) => {
        if (!projectId) return;
        io.to(String(projectId)).emit(`memberAdded-${projectId}`);
      });

      socket.on('memberRemoved', ({ projectId }) => {
        if (!projectId) return;
        io.to(String(projectId)).emit(`memberRemoved-${projectId}`);
      });

      socket.on('memberRoleUpdated', ({ projectId }) => {
        if (!projectId) return;
        io.to(String(projectId)).emit(`memberRoleUpdated-${projectId}`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Socket ayrıldı: ${socket.id}`);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) throw new Error('Socket.io başlatılmadı!');
    return io;
  }
};
