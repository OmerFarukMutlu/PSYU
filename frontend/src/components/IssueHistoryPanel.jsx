import React, { useEffect, useState } from 'react';
import { Drawer, List, Typography, Tag, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const IssueHistoryPanel = ({ open, onClose, projectId, issueId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && issueId && projectId) {
      fetch(`/api/projects/${projectId}/issues/${issueId}/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setHistory(data.result || []);
          setLoading(false);
        })
        .catch(() => {
          message.error('Geçmiş verisi yüklenemedi');
          setLoading(false);
        });
    }
  }, [open, issueId, projectId]);

  return (
    <Drawer
      title={<Title level={4} style={{ margin: 0 }}>Geçmiş</Title>}
      width={400}
      onClose={onClose}
      open={open}
    >
      <List
        loading={loading}
        itemLayout="vertical"
        dataSource={history}
        locale={{ emptyText: 'Geçmiş kaydı yok' }}
        renderItem={(item) => (
          <List.Item>
            <Text strong>{item.user?.username || 'Bilinmeyen kullanıcı'}</Text>
            <div style={{ fontSize: 13, color: '#666' }}>{new Date(item.createdAt).toLocaleString()}</div>
            <div style={{ marginTop: 6 }}>
              {item.changes?.map((change, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <Tag color="blue">{change.field}</Tag>
                  <Text delete>{change.oldValue}</Text> → <Text strong>{change.newValue}</Text>
                </div>
              ))}
            </div>
          </List.Item>
        )}
      />
    </Drawer>
  );
};

export default IssueHistoryPanel;
