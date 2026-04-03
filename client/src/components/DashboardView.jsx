import React, { useState, useEffect } from 'react';
import { api } from '../api';
import TimelineEditor from './TimelineEditor';
import LivePreview from './LivePreview';

const VOICE_OPTIONS = [
  { id: 'alloy', label: 'Alloy - Neutral' },
  { id: 'echo', label: 'Echo - Warm' },
  { id: 'fable', label: 'Fable - Expressive' },
  { id: 'onyx', label: 'Onyx - Deep' },
  { id: 'nova', label: 'Nova - Calm' },
  { id: 'shimmer', label: 'Shimmer - Bright' },
];

const VISUAL_STYLES = [
  { id: 'cinematic', label: 'Cinematic Sci-Fi' },
  { id: 'realistic', label: 'Photorealistic' },
  { id: 'cartoon', label: 'Cartoon / Anime' },
  { id: 'minimal', label: 'Minimalist' },
  { id: 'retro', label: 'Retro / Vintage' },
  { id: 'fantasy', label: 'Fantasy Art' },
];

export default function DashboardView({ project: initialProject, onBack, onUpdate }) {
  const [project, setProject] = useState(initialProject);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [visualStyle, setVisualStyle] = useState('cinematic');
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const refresh = async () => {
    const updated = await api.getProject(project.id);
    setProject(updated);
    onUpdate(updated);
  };

  const handleGenerateScript = async () => {
    setProcessing('script');
    setError(null);
    try {
      await api.generateScript({ projectId: project.id, topic: project.topic, style: visualStyle });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleGenerateTTS = async () => {
    setProcessing('tts');
    setError(null);
    try {
      await api.generateTTS({ projectId: project.id, text: project.script, provider: 'openai' });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleGenerateImages = async () => {
    setProcessing('images');
    setError(null);
    try {
      await api.generateImages({ projectId: project.id });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleComposeVideo = async () => {
    setProcessing('compose');
    setError(null);
    try {
      await api.composeVideo({ projectId: project.id });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveScript = async (script, scenes) => {
    setError(null);
    try {
      await api.updateScript(project.id, { script, scenes });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const scenes = project.scenes || [];

  return (
    <div className="flex gap-5 h-[calc(100vh-80px)]">
      {/* ===== LEFT PANEL ===== */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-y-auto pr-1 dashboard-scroll">
        {/* Step 1: Topic & Style */}
        <div className="card-dashboard">
          <div className="step-header">
            <span className="step-badge">Step 1</span>
            <h3 className="text-white font-semibold">Topic & Style</h3>
          </div>

          {/* Video Topic */}
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
              Video Topic
            </label>
            <div className="input-display">{project.topic}</div>
          </div>

          {/* Voice + BGM row */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
                AI Voice
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none flex-1 cursor-pointer"
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id} className="bg-gray-800">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGenerateTTS}
                  disabled={!!processing || !project.script}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                  title="Generate Voice"
                >
                  {processing === 'tts' ? (
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {project.audioUrl && (
                <audio controls src={project.audioUrl} className="w-full mt-2 h-8" />
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
                BGM · Visual Style
              </label>
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 3v18M5.5 7.5l13 9M5.5 16.5l13-9" />
                </svg>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none flex-1 cursor-pointer"
                >
                  {VISUAL_STYLES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-gray-800">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Script Editor */}
        <div className="card-dashboard flex-1 min-h-0 flex flex-col">
          <div className="step-header mb-4">
            <span className="step-badge">Step 2</span>
            <h3 className="text-white font-semibold">Script Editor</h3>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleGenerateScript}
                disabled={!!processing}
                className="btn-sm-secondary"
              >
                {processing === 'script' ? (
                  <><span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin mr-1.5" />Generating...</>
                ) : (
                  'Generate Script'
                )}
              </button>
              <button
                onClick={handleGenerateImages}
                disabled={!!processing || !scenes.length}
                className="btn-sm-secondary"
              >
                {processing === 'images' ? (
                  <><span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin mr-1.5" />Generating...</>
                ) : (
                  'Generate Images'
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-2.5 mb-3 text-xs text-red-300 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300 ml-2">✕</button>
            </div>
          )}

          {/* Timeline Editor */}
          <div className="flex-1 overflow-y-auto dashboard-scroll">
            {scenes.length > 0 ? (
              <TimelineEditor
                scenes={scenes}
                onSave={handleSaveScript}
                script={project.script}
                activeIndex={activeSceneIndex}
                onSelectScene={setActiveSceneIndex}
                onRefresh={refresh}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                {processing === 'script' ? (
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-yellow-400 rounded-full animate-spin mx-auto" />
                    <p>Generating script with AI...</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p>No scenes yet. Click "Generate Script" to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="w-[420px] flex-shrink-0">
        <div className="card-dashboard h-full flex flex-col">
          <div className="step-header mb-4">
            <span className="step-badge">Step 3</span>
            <h3 className="text-white font-semibold">Live Preview (9:16)</h3>
          </div>

          <LivePreview
            scenes={scenes}
            project={project}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={setActiveSceneIndex}
            onCompose={handleComposeVideo}
            processing={processing}
          />
        </div>
      </div>
    </div>
  );
}
