import React, { useState } from 'react';
import { api } from '../api';

export default function SceneList({ scenes, onRefresh }) {
  const [regenerating, setRegenerating] = useState(null);

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

  if (!scenes.length) {
    return <div className="text-sm text-gray-600 text-center py-4">No scenes yet</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {scenes.map((scene) => (
        <div key={scene.id} className="border border-gray-800 rounded-lg overflow-hidden group">
          {scene.imageUrl ? (
            <div className="relative">
              <img
                src={scene.imageUrl}
                alt={`Scene ${scene.order}`}
                className="w-full aspect-[9/16] object-cover"
              />
              <button
                onClick={() => handleRegenerate(scene)}
                disabled={regenerating === scene.id}
                className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {regenerating === scene.id ? '...' : 'Regen'}
              </button>
            </div>
          ) : (
            <div className="w-full aspect-[9/16] bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
              No image
            </div>
          )}
          <div className="p-2">
            <div className="text-xs text-gray-500 truncate">Scene {scene.order}</div>
            <div className="text-xs text-gray-400 truncate">{scene.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
