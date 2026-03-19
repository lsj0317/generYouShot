import React, { useState, useEffect } from 'react';
import { api } from '../api';
import ScriptEditor from './ScriptEditor';
import SceneList from './SceneList';

const PIPELINE_STEPS = [
  { id: 'script', label: '1. Script', description: 'Generate or edit the narration script' },
  { id: 'assets', label: '2. Assets', description: 'Generate TTS audio and scene images' },
  { id: 'compose', label: '3. Compose', description: 'Render final video with FFmpeg' },
  { id: 'upload', label: '4. Upload', description: 'Upload to YouTube (as private)' },
];

export default function ProjectDetail({ project: initialProject, onBack, onUpdate }) {
  const [project, setProject] = useState(initialProject);
  const [activeStep, setActiveStep] = useState('script');
  const [processing, setProcessing] = useState(null); // current processing action
  const [error, setError] = useState(null);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const refresh = async () => {
    const updated = await api.getProject(project.id);
    setProject(updated);
    onUpdate(updated);
  };

  // Step 1: Generate Script
  const handleGenerateScript = async (style) => {
    setProcessing('script');
    setError(null);
    try {
      await api.generateScript({ projectId: project.id, topic: project.topic, style });
      await refresh();
      setActiveStep('assets');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Step 2a: Generate TTS
  const handleGenerateTTS = async (provider) => {
    setProcessing('tts');
    setError(null);
    try {
      await api.generateTTS({ projectId: project.id, text: project.script, provider });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Step 2b: Generate Images
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

  // Step 3: Compose Video
  const handleComposeVideo = async () => {
    setProcessing('compose');
    setError(null);
    try {
      await api.composeVideo({ projectId: project.id });
      await refresh();
      setActiveStep('upload');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Step 4: Upload to YouTube
  const handleUpload = async () => {
    setProcessing('upload');
    setError(null);
    try {
      const result = await api.uploadToYouTube({
        projectId: project.id,
        title: project.title,
      });
      await refresh();
      alert(`Uploaded! ${result.note}\n\n${result.url}`);
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

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <h2 className="text-xl font-bold text-white">{project.title}</h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
          {project.status}
        </span>
      </div>

      {/* Pipeline Steps */}
      <div className="flex gap-2 mb-6">
        {PIPELINE_STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex-1 p-3 rounded-lg text-left transition-all border ${
              activeStep === step.id
                ? 'bg-gray-800 border-red-600/50 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="text-sm font-semibold">{step.label}</div>
            <div className="text-xs mt-0.5 text-gray-500">{step.description}</div>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4 text-sm text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-300">
            ✕
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="card">
        {activeStep === 'script' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Script & Scenes</h3>
              <button
                onClick={() => handleGenerateScript()}
                disabled={processing === 'script'}
                className="btn-primary text-sm"
              >
                {processing === 'script' ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>

            <div className="text-sm text-gray-400 mb-2">
              Topic: <span className="text-gray-300">{project.topic}</span>
            </div>

            {project.script && (
              <ScriptEditor
                script={project.script}
                scenes={project.scenes || []}
                onSave={handleSaveScript}
              />
            )}

            {!project.script && !processing && (
              <div className="text-center py-12 text-gray-600">
                Click "Generate with AI" to create a script from your topic,
                <br />
                or the script will be auto-generated using GPT-4o.
              </div>
            )}
          </div>
        )}

        {activeStep === 'assets' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-white">Resource Generation</h3>

            {/* TTS Section */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300">Voice (TTS)</h4>
                  <p className="text-xs text-gray-500">Generate narration audio from script</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateTTS('openai')}
                    disabled={!!processing || !project.script}
                    className="btn-secondary text-xs"
                  >
                    {processing === 'tts' ? 'Generating...' : 'OpenAI TTS'}
                  </button>
                  <button
                    onClick={() => handleGenerateTTS('elevenlabs')}
                    disabled={!!processing || !project.script}
                    className="btn-secondary text-xs"
                  >
                    ElevenLabs
                  </button>
                </div>
              </div>
              {project.audioUrl && (
                <audio controls src={project.audioUrl} className="w-full mt-2" />
              )}
            </div>

            {/* Images Section */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300">Scene Images</h4>
                  <p className="text-xs text-gray-500">Generate images with DALL-E 3</p>
                </div>
                <button
                  onClick={handleGenerateImages}
                  disabled={!!processing || !project.scenes?.length}
                  className="btn-secondary text-xs"
                >
                  {processing === 'images' ? 'Generating...' : 'Generate All Images'}
                </button>
              </div>

              <SceneList scenes={project.scenes || []} onRefresh={refresh} />
            </div>
          </div>
        )}

        {activeStep === 'compose' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Video Composition</h3>
            <p className="text-sm text-gray-400">
              FFmpeg will combine scene images, narration audio, and subtitles into a final MP4 video
              (1080x1920, 9:16 format).
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400 space-y-1">
              <div>Scenes: {project.scenes?.length || 0}</div>
              <div>Audio: {project.audioUrl ? 'Ready' : 'Not generated'}</div>
              <div>
                Images:{' '}
                {project.scenes?.filter((s) => s.imageUrl).length || 0} /{' '}
                {project.scenes?.length || 0} ready
              </div>
            </div>

            <button
              onClick={handleComposeVideo}
              disabled={!!processing}
              className="btn-primary"
            >
              {processing === 'compose' ? 'Rendering...' : 'Compose Video'}
            </button>

            {project.videoUrl && (
              <div className="mt-4">
                <video controls src={project.videoUrl} className="w-full max-w-sm rounded-lg mx-auto" />
              </div>
            )}
          </div>
        )}

        {activeStep === 'upload' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">YouTube Upload</h3>

            {project.videoUrl ? (
              <>
                <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 text-sm text-yellow-300">
                  Video will be uploaded as <strong>PRIVATE</strong>. Review in YouTube Studio
                  before publishing to ensure compliance with YouTube policies.
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!!processing}
                  className="btn-primary"
                >
                  {processing === 'upload' ? 'Uploading...' : 'Upload to YouTube (Private)'}
                </button>

                {project.youtubeId && (
                  <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 text-sm text-green-300">
                    Uploaded! YouTube ID: {project.youtubeId}
                    <br />
                    <a
                      href={`https://studio.youtube.com/video/${project.youtubeId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline mt-1 inline-block"
                    >
                      Open in YouTube Studio →
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-600">
                Compose the video first before uploading.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
