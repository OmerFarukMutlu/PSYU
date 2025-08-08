const { IssueHistory, User } = require('../models');

const getHistoryByIssue = async (issueId) => {
  return await IssueHistory.findAll({
    where: { issueId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }
    ],
    order: [['changedAt', 'DESC']]
  });
};

module.exports = {
  getHistoryByIssue
};
