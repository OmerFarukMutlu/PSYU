const issueHistoryService = require('../services/issueHistoryService');

const getHistory = async (req, res) => {
  try {
    const { issueId } = req.params;
    const history = await issueHistoryService.getHistoryByIssue(issueId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHistory
};
