import React from 'react';

const STAGES = [
  { id: 'draft', label: 'Draft', color: 'bg-gray-600', description: 'New project ideas' },
  { id: 'scripting', label: 'Script', color: 'bg-blue-600', description: 'Script generation' },
  { id: 'generating', label: 'Assets', color: 'bg-purple-600', description: 'TTS & Images' },
  { id: 'composing', label: 'Compose', color: 'bg-yellow-600', description: 'FFmpeg rendering' },
  { id: 'reviewing', label: 'Review', color: 'bg-orange-600', description: 'Final check' },
  { id: 'published', label: 'Published', color: 'bg-green-600', description: 'On YouTube' },
];

export default function WorkflowBoard({ projects, loading, onSelect, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading projects...
      </div>
    );
  }

  const getProjectsByStage = (stageId) =>
    projects.filter((p) => {
      if (stageId === 'published') return p.status === 'published' || p.status === 'uploading';
      return p.status === stageId;
    });

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white">Workflow Pipeline</h2>

      <div className="grid grid-cols-6 gap-3 min-h-[70vh]">
        {STAGES.map((stage) => {
          const stageProjects = getProjectsByStage(stage.id);
          return (
            <div key={stage.id} className="flex flex-col">
              {/* Column Header */}
              <div className="mb-3 flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <span className="text-sm font-semibold text-gray-300">{stage.label}</span>
                <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full ml-auto">
                  {stageProjects.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 bg-gray-900/50 rounded-xl p-2 space-y-2 border border-gray-800/50">
                {stageProjects.length === 0 && (
                  <div className="text-xs text-gray-600 text-center py-8">
                    {stage.description}
                  </div>
                )}

                {stageProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    stageColor={stage.color}
                    onClick={() => onSelect(project)}
                    onDelete={() => onDelete(project.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectCard({ project, stageColor, onClick, onDelete }) {
  const sceneCount = project.scenes?.length || 0;

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-gray-600 transition-all group relative"
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this project?')) onDelete();
        }}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
      >
        ✕
      </button>

      <h3 className="text-sm font-semibold text-white truncate pr-4">{project.title}</h3>
      <p className="text-xs text-gray-500 mt-1 truncate">{project.topic}</p>

      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
        {sceneCount > 0 && <span>{sceneCount} scenes</span>}
        {project.audioUrl && <span>Audio</span>}
        {project.videoUrl && <span>Video</span>}
      </div>

      <div className="mt-2">
        <div className={`text-[10px] px-1.5 py-0.5 rounded ${stageColor} bg-opacity-20 text-gray-300 inline-block`}>
          {project.status}
        </div>
      </div>
    </div>
  );
}
