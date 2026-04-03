import React, { useState } from 'react';
import { api } from '../api';

export default function TimelineEditor({ scenes, script, onSave, activeIndex, onSelectScene, onRefresh }) {
  const [editScenes, setEditScenes] = useState(scenes);
  const [dirty, setDirty] = useState(false);
  const [regenerating, setRegenerating] = useState(null);

  const handleSceneChange = (index, field, value) => {
    const updated = [...editScenes];
    updated[index] = { ...updated[index], [field]: value };
    setEditScenes(updated);
    setDirty(true);
  };

  const handleSave = () => {
    onSave(script, editScenes);
    setDirty(false);
  };

  const handleRegenerate = async (scene) => {
    setRegenerating(scene.id);
    try {
      await api.regenerateImage(scene.id, {});
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setRegenerating(null);
    }
  };

  const formatTime = (index) => {
    let startTime = 0;
    for (let i = 0; i < index; i++) {
      startTime += editScenes[i]?.duration || 5;
    }
    const endTime = startTime + (editScenes[index]?.duration || 5);
    const fmt = (t) => {
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };
    return `[${fmt(startTime)}-${fmt(endTime)}]`;
  };

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-gray-700" />

      {/* Save button */}
      {dirty && (
        <div className="sticky top-0 z-10 flex justify-end mb-3">
          <button onClick={handleSave} className="btn-sm-primary">
            Save Changes
          </button>
        </div>
      )}

      <div className="space-y-1">
        {editScenes.map((scene, i) => (
          <div
            key={scene.id || i}
            onClick={() => onSelectScene(i)}
            className={`relative pl-10 pr-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
              activeIndex === i
                ? 'bg-gray-800/80 border border-gray-700'
                : 'hover:bg-gray-800/40 border border-transparent'
            }`}
          >
            {/* Timeline dot */}
            <div className={`absolute left-3 top-5 w-3 h-3 rounded-full border-2 z-10 transition-colors ${
              activeIndex === i
                ? 'bg-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/30'
                : 'bg-gray-800 border-gray-600 group-hover:border-gray-400'
            }`} />

            {/* Scene number + timestamp */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-bold ${activeIndex === i ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {scene.order || i + 1}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">{formatTime(i)}</span>
                </div>

                {/* Scene text */}
                <textarea
                  value={scene.text}
                  onChange={(e) => handleSceneChange(i, 'text', e.target.value)}
                  rows={2}
                  className="w-full bg-transparent text-sm text-gray-300 resize-none outline-none placeholder-gray-600 leading-relaxed"
                  placeholder="Scene narration..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Scene thumbnail */}
              <div className="flex-shrink-0 w-[100px] h-[70px] rounded-lg overflow-hidden relative group/thumb">
                {scene.imageUrl ? (
                  <>
                    <img
                      src={scene.imageUrl}
                      alt={`Scene ${scene.order}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerate(scene);
                      }}
                      disabled={regenerating === scene.id}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity text-xs text-white font-medium"
                    >
                      {regenerating === scene.id ? '...' : 'Change Image'}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
