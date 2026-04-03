import React, { useState, useEffect, useRef } from 'react';

const SCENE_COLORS = [
  'bg-red-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-blue-500',
  'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-cyan-500',
];

export default function LivePreview({ scenes, project, activeSceneIndex, onSelectScene, onCompose, processing }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef(null);

  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 5), 0) || 1;

  // Auto-play simulation
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setPlaying(false);
            return 0;
          }
          // Update active scene based on time
          let elapsed = 0;
          for (let i = 0; i < scenes.length; i++) {
            elapsed += scenes[i].duration || 5;
            if (next < elapsed) {
              onSelectScene(i);
              break;
            }
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, totalDuration, scenes.length]);

  // Sync time with active scene
  useEffect(() => {
    if (!playing) {
      let t = 0;
      for (let i = 0; i < activeSceneIndex; i++) {
        t += scenes[i]?.duration || 5;
      }
      setCurrentTime(t);
    }
  }, [activeSceneIndex, playing]);

  const activeScene = scenes[activeSceneIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Phone Mockup */}
      <div className="flex-1 flex items-center justify-center min-h-0 mb-4">
        <div className="relative w-[220px] h-[390px] bg-gray-900 rounded-[28px] border-[3px] border-gray-700 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-xl z-20" />

          {/* Screen content */}
          <div className="absolute inset-[3px] rounded-[24px] overflow-hidden bg-black">
            {activeScene?.imageUrl ? (
              <img
                src={activeScene.imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}

            {/* Title overlay */}
            {activeScene && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-[10px] leading-tight line-clamp-2">
                  {activeScene.text}
                </p>
              </div>
            )}

            {/* Topic overlay */}
            <div className="absolute top-8 left-0 right-0 px-3 text-center">
              <p className="text-yellow-400 text-xs font-bold drop-shadow-lg">
                {project.title}
              </p>
            </div>

            {/* Social icons (decorative) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-3">
              {['♡', '💬', '↗'].map((icon, i) => (
                <div key={i} className="w-6 h-6 bg-black/40 rounded-full flex items-center justify-center text-white text-[10px]">
                  {icon}
                </div>
              ))}
            </div>

            {/* Username */}
            <div className="absolute bottom-12 left-3 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
              <span className="text-white text-[9px] font-medium">@GenerYouShot</span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              setPlaying(!playing);
              if (!playing && currentTime >= totalDuration) {
                setCurrentTime(0);
                onSelectScene(0);
              }
            }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            {playing ? (
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={onCompose}
            disabled={!!processing || !scenes.length}
            className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-40"
            title="Compose Video"
          >
            {processing === 'compose' ? (
              <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
          </button>
          {project.videoUrl && (
            <a
              href={project.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="View Video"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>

        {/* Timeline bar */}
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
          {scenes.map((scene, i) => {
            const width = ((scene.duration || 5) / totalDuration) * 100;
            return (
              <button
                key={scene.id || i}
                onClick={() => onSelectScene(i)}
                className={`${SCENE_COLORS[i % SCENE_COLORS.length]} h-full rounded-sm transition-all duration-200 hover:brightness-125 ${
                  activeSceneIndex === i ? 'ring-1 ring-white ring-offset-1 ring-offset-gray-900' : ''
                }`}
                style={{ width: `${width}%` }}
                title={`Scene ${i + 1}`}
              />
            );
          })}
          {scenes.length === 0 && <div className="flex-1 bg-gray-800 rounded-sm" />}
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-1.5 overflow-x-auto py-1 dashboard-scroll">
          {scenes.map((scene, i) => (
            <button
              key={scene.id || i}
              onClick={() => onSelectScene(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                activeSceneIndex === i
                  ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
                  : 'border-transparent hover:border-gray-600'
              }`}
            >
              {scene.imageUrl ? (
                <img src={scene.imageUrl} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 text-[10px]">
                  {i + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
