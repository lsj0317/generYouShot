const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Script
  generateScript: (data) => request('/script/generate', { method: 'POST', body: JSON.stringify(data) }),
  updateScript: (projectId, data) => request(`/script/${projectId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // TTS
  generateTTS: (data) => request('/tts/generate', { method: 'POST', body: JSON.stringify(data) }),

  // Images
  generateImages: (data) => request('/image/generate', { method: 'POST', body: JSON.stringify(data) }),
  regenerateImage: (sceneId, data) => request(`/image/regenerate/${sceneId}`, { method: 'POST', body: JSON.stringify(data) }),

  // Video
  composeVideo: (data) => request('/video/compose', { method: 'POST', body: JSON.stringify(data) }),

  // YouTube
  getYouTubeAuthUrl: () => request('/youtube/auth-url'),
  getYouTubeStatus: () => request('/youtube/status'),
  uploadToYouTube: (data) => request('/youtube/upload', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getApiKeys: () => request('/settings/api-keys'),
  saveApiKey: (service, data) => request(`/settings/api-keys/${service}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApiKey: (service) => request(`/settings/api-keys/${service}`, { method: 'DELETE' }),
};
