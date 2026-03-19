import React, { useState, useEffect } from 'react';
import { api } from './api';
import WorkflowBoard from './components/WorkflowBoard';
import ProjectModal from './components/ProjectModal';
import ProjectDetail from './components/ProjectDetail';
import SettingsPanel from './components/SettingsPanel';

const TABS = [
  { id: 'board', label: 'Workflow Board', icon: '▦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('board');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
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
  };

  const handleDeleteProject = async (id) => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
  };

  const handleProjectUpdate = (updated) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
              GY
            </div>
            <h1 className="text-lg font-bold text-white">GenerYouShot</h1>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              YouTube Shorts Automation
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedProject(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={() => setShowNewProject(true)} className="btn-primary text-sm">
            + New Short
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'board' && !selectedProject && (
          <WorkflowBoard
            projects={projects}
            loading={loading}
            onSelect={setSelectedProject}
            onDelete={handleDeleteProject}
          />
        )}

        {activeTab === 'board' && selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            onUpdate={handleProjectUpdate}
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
