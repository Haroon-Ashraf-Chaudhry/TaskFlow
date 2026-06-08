import { create } from 'zustand';
import api from '../utils/api';

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  activeProject: null,
  onlineUsers: [],

  fetchWorkspaces: async () => {
    const { data } = await api.get('/workspaces');
    set({ workspaces: data });
    return data;
  },

  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setActiveProject: (project) => set({ activeProject: project }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  createWorkspace: async (payload) => {
    const { data } = await api.post('/workspaces', payload);
    set(s => ({ workspaces: [...s.workspaces, data] }));
    return data;
  },

  updateWorkspace: async (wsId, payload) => {
    const { data } = await api.put(`/workspaces/${wsId}`, payload);
    set(s => ({
      workspaces: s.workspaces.map(w => w._id === wsId ? data : w),
      activeWorkspace: s.activeWorkspace?._id === wsId ? data : s.activeWorkspace,
    }));
    return data;
  },
}));

export default useWorkspaceStore;
