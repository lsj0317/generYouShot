import React, { useState } from 'react';

export default function ScriptEditor({ script, scenes, onSave }) {
  const [editScript, setEditScript] = useState(script);
  const [editScenes, setEditScenes] = useState(scenes);
  const [dirty, setDirty] = useState(false);

  const handleScriptChange = (value) => {
    setEditScript(value);
    setDirty(true);
  };

  const handleSceneChange = (index, field, value) => {
    const updated = [...editScenes];
    updated[index] = { ...updated[index], [field]: value };
    setEditScenes(updated);
    setDirty(true);
  };

  const handleSave = () => {
    onSave(editScript, editScenes);
    setDirty(false);
  };

  return (
    <div className="space-y-4">
      {/* Full script */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Full Script</label>
        <textarea
          value={editScript}
          onChange={(e) => handleScriptChange(e.target.value)}
          rows={6}
          className="input-field font-mono text-sm resize-y"
        />
      </div>

      {/* Scene breakdown */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Scenes ({editScenes.length})
        </label>
        <div className="space-y-3">
          {editScenes.map((scene, i) => (
            <div key={scene.id || i} className="border border-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-800 px-2 py-0.5 rounded">Scene {scene.order}</span>
                <span>{scene.duration || 5}s</span>
                <input
                  type="number"
                  value={scene.duration || 5}
                  onChange={(e) => handleSceneChange(i, 'duration', parseFloat(e.target.value))}
                  className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white"
                  min="1"
                  max="30"
                  step="0.5"
                />
                <span>sec</span>
              </div>

              <textarea
                value={scene.text}
                onChange={(e) => handleSceneChange(i, 'text', e.target.value)}
                rows={2}
                className="input-field text-sm resize-none"
                placeholder="Scene narration..."
              />

              <input
                type="text"
                value={scene.imagePrompt || ''}
                onChange={(e) => handleSceneChange(i, 'imagePrompt', e.target.value)}
                className="input-field text-xs"
                placeholder="Image generation prompt..."
              />
            </div>
          ))}
        </div>
      </div>

      {dirty && (
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary text-sm">
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
