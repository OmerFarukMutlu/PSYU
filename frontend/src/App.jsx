import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/authContext';
import { Spin } from 'antd';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Landing from './pages/Landing';
import IssueComments from './pages/IssueComments';
import MyComments from './pages/Comments';
import EditComment from './pages/EditComment';
import UserManagement from './pages/UserManagement';
import ForgotPassword from './pages/ForgotPassword';

import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

import { SocketProvider } from './socket/SocketContext';

function App() {
  const { loading } = useAuth(); // ✅ auth init bekle

  // ⏳ Init bitene kadar fullscreen spinner
  if (loading) {
    return <Spin fullscreen tip="Oturum kontrol ediliyor..." size="large" />;
  }

  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/issues/:issueId/comments"
          element={
            <ProtectedRoute>
              <IssueComments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-comments/:issueId"
          element={
            <ProtectedRoute>
              <MyComments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/comments/:commentId/edit"
          element={
            <ProtectedRoute>
              <EditComment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
