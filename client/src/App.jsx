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

// Default project with demo scenes so the dashboard is always visible
const DEMO_SCENES = [
  { id: 'demo-1', order: 1, text: 'Space is vast beyond comprehension, and planning the model of the dreamland of large comprehensions.', duration: 5, imageUrl: null, imagePrompt: 'Deep space nebula with stars' },
  { id: 'demo-2', order: 2, text: 'Space is vast beyond comprehension. In atomic vast, animation for understand space\'s vast unique comprehensions.', duration: 5, imageUrl: null, imagePrompt: 'Planet Earth from space' },
  { id: 'demo-3', order: 3, text: 'Space is vast beyond comprehension, including stories and comprehension to make the keyframe emphasis.', duration: 5, imageUrl: null, imagePrompt: 'Astronaut floating in space' },
  { id: 'demo-4', order: 4, text: 'Space is vast beyond comprehension. The reticular the boosh man understands with the space of keyframes emphasis.', duration: 5, imageUrl: null, imagePrompt: 'Galaxy spiral arms' },
  { id: 'demo-5', order: 5, text: 'The universe contains billions of galaxies, each with billions of stars and countless planets orbiting them.', duration: 5, imageUrl: null, imagePrompt: 'Milky way galaxy panorama' },
];

const DEFAULT_PROJECT = {
  id: 'demo',
  title: '10 Space Facts',
  topic: '10 Space Facts',
  status: 'scripting',
  script: DEMO_SCENES.map((s) => s.text).join('\n\n'),
  audioUrl: null,
  videoUrl: null,
  scenes: DEMO_SCENES,
};

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [selectedProject, setSelectedProject] = useState(DEFAULT_PROJECT);
  const [showNewProject, setShowNewProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch {
      // Server might not be running - keep default project
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (data) => {
    try {
      const project = await api.createProject(data);
      setProjects((prev) => [project, ...prev]);
      setShowNewProject(false);
      setSelectedProject(project);
      setActiveTab('create');
    } catch {
      // Server not running - create local project
      const localProject = {
        id: `local-${Date.now()}`,
        title: data.title,
        topic: data.topic,
        status: 'draft',
        script: null,
        audioUrl: null,
        videoUrl: null,
        scenes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [localProject, ...prev]);
      setShowNewProject(false);
      setSelectedProject(localProject);
      setActiveTab('create');
    }
  };

  const handleDeleteProject = async (id) => {
    try { await api.deleteProject(id); } catch { /* local only */ }
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (selectedProject?.id === id) {
      setSelectedProject(remaining.length > 0 ? remaining[0] : DEFAULT_PROJECT);
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
                  if (item.id === 'create') {
                    if (!selectedProject) {
                      setSelectedProject(projects.length > 0 ? projects[0] : DEFAULT_PROJECT);
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
              onClick={() => setShowNewProject(true)}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-red-900/30"
            >
              Generate!
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-5">
        {activeTab === 'create' && (
          <DashboardView
            project={selectedProject || DEFAULT_PROJECT}
            onBack={() => {
              setActiveTab('projects');
            }}
            onUpdate={handleProjectUpdate}
          />
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
