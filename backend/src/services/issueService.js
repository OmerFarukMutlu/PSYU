const { Issue, User } = require('../models');
const { Op } = require('sequelize');

const createIssue = async (data) => {
  const cleaned = { ...data };
  if (
    cleaned.assigneeId === undefined ||
    cleaned.assigneeId === null ||
    cleaned.assigneeId === '' ||
    isNaN(cleaned.assigneeId)
  ) {
    delete cleaned.assigneeId;
  }
  return await Issue.create(cleaned);
};

const getIssuesByProject = async (projectId, filters = {}) => {
  const where = { projectId };
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignedTo) where.assigneeId = filters.assignedTo;

  return await Issue.findAll({
    where,
    include: [{ model: User, as: 'assignee' }],
    order: [['createdAt', 'DESC']],
  });
};

const getIssueById = async (issueId) => {
  return await Issue.findByPk(issueId);
};

const updateIssue = async (issueId, updates, userId) => {
  const issue = await Issue.findByPk(issueId);
  if (!issue) return null;

  // Geçerli alanları ayıkla
  const allowedFields = ['title', 'description', 'priority', 'status', 'dueDate', 'assigneeId'];
  const updateData = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  await issue.update(updateData);
  return issue;
};


const deleteIssue = async (projectId, issueId) => {
  return await Issue.destroy({
    where: { id: issueId, projectId }
  });
};

const findIssueByTitle = async (projectId, title) => {
  return await Issue.findOne({ where: { projectId, title } });
};

module.exports = {
  createIssue,
  getIssuesByProject,
  getIssueById,
  updateIssue,
  deleteIssue,
  findIssueByTitle
};
