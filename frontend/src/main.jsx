import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { AuthProvider } from './store/authContext';

// ✅ Ant Design CSS önce gelsin
import 'antd/dist/reset.css';
// ✅ Global (light) stiller sonra
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Açık temayı sabitlemek için ConfigProvider */}
        <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
          <App />
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
