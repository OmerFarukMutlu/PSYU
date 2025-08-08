const issueService = require('../services/issueService');
const { getIO } = require('../socket');
const { Issue, User } = require('../models'); // ⬅️ assignee join için

// yardımcı: görevi assignee ile birlikte getir
async function loadIssueWithAssignee(id) {
  const issue = await Issue.findByPk(id, {
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'username', 'fullname'] }
    ]
  });
  return issue;
}

const createIssue = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const { projectId } = req.params;

    const existing = await issueService.findIssueByTitle(projectId, title);
    if (existing) {
      return res.status(400).json({
        message: 'Bu ada sahip bir görev zaten mevcut. Lütfen farklı bir başlık girin.'
      });
    }

    const issue = await issueService.createIssue({
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
      projectId,
      createdBy: req.user.id
    });

    // ⬅️ assignee dahil dolu obje
    const fullIssue = await loadIssueWithAssignee(issue.id);

    // WS: proje odasına yayınla
    try {
      getIO().to(String(projectId)).emit('newIssue', {
        issue: fullIssue,
        projectId: String(projectId)
      });
    } catch (e) {
      console.warn('WS emit newIssue hata:', e?.message);
    }

    // HTTP cevabı da dolu obje ile
    res.status(201).json({ message: 'Görev oluşturuldu', issue: fullIssue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getIssues = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;

    const filters = {
      status: status || null,
      priority: priority || null,
      assignedTo: assignedTo ? parseInt(assignedTo) : null
    };

    const issues = await issueService.getIssuesByProject(req.params.projectId, filters);
    res.json({ result: issues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getIssue = async (req, res) => {
  try {
    const issue = await issueService.getIssueById(req.params.issueId);
    if (!issue) return res.status(404).json({ message: 'Görev bulunamadı' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateIssue = async (req, res) => {
  try {
    const { projectId, issueId } = { projectId: req.params.projectId, issueId: req.params.issueId };

    const allowedFields = ['title', 'description', 'priority', 'status', 'dueDate', 'assigneeId'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = await issueService.updateIssue(issueId, updates, req.user.id);
    if (!updated) return res.status(404).json({ message: 'Görev bulunamadı' });

    // ⬅️ assignee dahil dolu obje
    const fullIssue = await loadIssueWithAssignee(updated.id);
    const pid = String(projectId || fullIssue.projectId);

    // (varsa) eski davranış: açıklama güncellemesi yayını
    if (updates.description) {
      try {
        getIO().to(pid).emit('descriptionUpdated', {
          id: fullIssue.id,
          description: fullIssue.description
        });
      } catch (e) {
        console.warn('WS emit descriptionUpdated hata:', e?.message);
      }
    }

    // ✅ edit yayını (assignee dâhil)
    try {
      getIO().to(pid).emit('issueUpdated', { projectId: pid, issue: fullIssue });
    } catch (e) {
      console.warn('WS emit issueUpdated hata:', e?.message);
    }

    // HTTP cevabı da dolu obje ile
    res.json({ message: 'Görev güncellendi', issue: fullIssue });
  } catch (err) {
    console.error('🔥 updateIssue sunucu hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const { projectId, id } = req.params;
    const deleted = await issueService.deleteIssue(projectId, id);

    if (deleted === 0) {
      return res.status(404).json({ message: 'Görev bulunamadı veya silinemedi' });
    }

    try {
      getIO().to(String(projectId)).emit('issueDeleted', {
        issueId: id,
        projectId: String(projectId)
      });
    } catch (e) {
      console.warn('WS emit issueDeleted hata:', e?.message);
    }

    res.json({ message: 'Görev silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssue,
  updateIssue,
  deleteIssue
};
