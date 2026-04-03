import React, { useState, useEffect } from 'react';
import { api } from './api';
import WorkflowBoard from './components/WorkflowBoard';
import ProjectModal from './components/ProjectModal';
import DashboardView from './components/DashboardView';
import SettingsPanel from './components/SettingsPanel';

const NAV_ITEMS = [
  { id: 'create', label: 'Create New' },
  { id: 'projects', label: 'My Projects' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      // Auto-select the first project so the dashboard view shows immediately
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch {
      // Server might not be running yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (data) => {
    const project = await api.createProject(data);
    setProjects((prev) => [project, ...prev]);
    setShowNewProject(false);
    setSelectedProject(project);
    setActiveTab('create');
  };

  const handleDeleteProject = async (id) => {
    await api.deleteProject(id);
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (selectedProject?.id === id) {
      setSelectedProject(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleProjectUpdate = (updated) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Gener<span className="text-yellow-400">You</span>Shot
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 bg-gray-900/60 rounded-xl px-1 py-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'create' && !selectedProject) {
                    if (projects.length > 0) {
                      setSelectedProject(projects[0]);
                    } else {
                      setShowNewProject(true);
                    }
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
              U
            </div>
            <button
              onClick={() => {
                if (selectedProject) {
                  // trigger generate on dashboard
                } else {
                  setShowNewProject(true);
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-red-900/30"
            >
              Generate!
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-5">
        {activeTab === 'create' && selectedProject && (
          <DashboardView
            project={selectedProject}
            onBack={() => {
              setSelectedProject(null);
              setActiveTab('projects');
            }}
            onUpdate={handleProjectUpdate}
          />
        )}

        {activeTab === 'create' && !selectedProject && (
          <div className="flex items-center justify-center h-[70vh]">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-2">🎬</div>
              <h2 className="text-2xl font-bold text-white">Create a New Short</h2>
              <p className="text-gray-400 max-w-md">
                Start by creating a new project or select one from My Projects
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-red-900/30"
              >
                + Create New Short
              </button>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <WorkflowBoard
            projects={projects}
            loading={loading}
            onSelect={handleSelectProject}
            onDelete={handleDeleteProject}
          />
        )}

        {activeTab === 'settings' && <SettingsPanel />}
      </main>

      {/* New Project Modal */}
      {showNewProject && (
        <ProjectModal onClose={() => setShowNewProject(false)} onCreate={handleCreateProject} />
      )}
    </div>
  );
}
