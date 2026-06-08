import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/global.css';
import useAuthStore from './stores/authStore';

// Lazy-ish imports
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppLayout from './components/layout/AppLayout';
import WorkspaceHome from './pages/WorkspaceHome';
import CreateWorkspacePage from './pages/CreateWorkspacePage';
import KanbanBoard from './pages/KanbanBoard';
import ListView from './pages/ListView';
import SprintView from './pages/SprintView';
import AnalyticsPage from './pages/AnalyticsPage';
import ProjectSettingsPage from './pages/ProjectSettingsPage';
import MembersPage from './pages/MembersPage';
import ActivityFeedPage from './pages/ActivityFeedPage';
import ProfilePage from './pages/ProfilePage';
import NewWorkspacePage from './pages/NewWorkspacePage';
import CreateProjectPage from './pages/CreateProjectPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const fetchMe = useAuthStore(s => s.fetchMe);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/new-workspace" element={<PrivateRoute><NewWorkspacePage /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/new-workspace" replace />} />
            <Route path="w/:wsId" element={<WorkspaceHome />} />
            <Route path="w/:wsId/activity" element={<ActivityFeedPage />} />
            <Route path="w/:wsId/members" element={<MembersPage />} />
            <Route path="w/:wsId/p/:pid/board" element={<KanbanBoard />} />
            <Route path="w/:wsId/p/:pid/list" element={<ListView />} />
            <Route path="w/:wsId/p/:pid/sprint" element={<SprintView />} />
            <Route path="w/:wsId/p/:pid/analytics" element={<AnalyticsPage />} />
            <Route path="w/:wsId/p/:pid/settings" element={<ProjectSettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="w/:wsId/new-project" element={<CreateProjectPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
