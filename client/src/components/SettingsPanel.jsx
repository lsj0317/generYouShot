import React, { useState, useEffect } from 'react';
import { api } from '../api';

const API_SERVICES = [
  { id: 'openai', label: 'OpenAI', description: 'GPT-4o for scripts, DALL-E 3 for images, TTS' },
  { id: 'elevenlabs', label: 'ElevenLabs', description: 'High-quality multilingual TTS', hasExtra: true, extraLabel: 'Voice ID' },
  { id: 'youtube', label: 'YouTube', description: 'YouTube Data API v3 for uploads' },
];

export default function SettingsPanel() {
  const [keys, setKeys] = useState({});
  const [youtubeStatus, setYoutubeStatus] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    loadKeys();
    checkYouTube();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await api.getApiKeys();
      const mapped = {};
      data.forEach((k) => {
        mapped[k.service] = { key: '', saved: true, masked: k.key };
      });
      setKeys(mapped);
    } catch {
      // Server not running
    }
  };

  const checkYouTube = async () => {
    try {
      const data = await api.getYouTubeStatus();
      setYoutubeStatus(data.authenticated);
    } catch {
      // ignore
    }
  };

  const handleSave = async (service) => {
    const entry = keys[service];
    if (!entry?.key) return;
    setSaving(service);
    try {
      await api.saveApiKey(service, { key: entry.key, extra: entry.extra });
      await loadKeys();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleYouTubeConnect = async () => {
    try {
      const data = await api.getYouTubeAuthUrl();
      window.open(data.url, '_blank');
    } catch (err) {
      alert(err.message);
    }
  };

  const updateKey = (service, field, value) => {
    setKeys((prev) => ({
      ...prev,
      [service]: { ...prev[service], [field]: value, saved: false },
    }));
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-4 text-white">Settings</h2>

      <div className="space-y-4">
        {API_SERVICES.map((svc) => (
          <div key={svc.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white">{svc.label}</h3>
                <p className="text-xs text-gray-500">{svc.description}</p>
              </div>
              {keys[svc.id]?.saved && (
                <span className="text-xs text-green-500 bg-green-900/20 px-2 py-0.5 rounded">
                  Configured
                </span>
              )}
            </div>

            {svc.id === 'youtube' ? (
              <div className="flex items-center gap-3 mt-3">
                <button onClick={handleYouTubeConnect} className="btn-secondary text-sm">
                  {youtubeStatus ? 'Reconnect' : 'Connect YouTube Account'}
                </button>
                {youtubeStatus && (
                  <span className="text-xs text-green-400">Connected</span>
                )}
              </div>
            ) : (
              <div className="space-y-2 mt-3">
                <input
                  type="password"
                  value={keys[svc.id]?.key || ''}
                  onChange={(e) => updateKey(svc.id, 'key', e.target.value)}
                  placeholder={keys[svc.id]?.masked || `Enter ${svc.label} API Key`}
                  className="input-field text-sm"
                />
                {svc.hasExtra && (
                  <input
                    type="text"
                    value={keys[svc.id]?.extra || ''}
                    onChange={(e) => updateKey(svc.id, 'extra', e.target.value)}
                    placeholder={svc.extraLabel}
                    className="input-field text-sm"
                  />
                )}
                <button
                  onClick={() => handleSave(svc.id)}
                  disabled={saving === svc.id || keys[svc.id]?.saved}
                  className="btn-primary text-sm"
                >
                  {saving === svc.id ? 'Saving...' : 'Save Key'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Notice */}
      <div className="card mt-6 border-yellow-800/50">
        <h3 className="font-semibold text-yellow-300 text-sm mb-2">Security Notes</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>- API keys are stored in the database, not in code</li>
          <li>- Use .env for server-side keys, Settings page for per-user overrides</li>
          <li>- Run this app on localhost or behind a firewall only</li>
          <li>- YouTube uploads are always set to PRIVATE first</li>
        </ul>
      </div>
    </div>
  );
}
