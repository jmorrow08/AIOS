import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface LabProject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export const AiLab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<LabProject[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase.from<LabProject>('ai_lab_projects').select('*').order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading AI Lab projects', error);
        setError('Unable to load projects right now. Please try again later.');
      } else {
        setProjects(data ?? []);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg animate-pulse">Loading AI Lab…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">AI Lab</h1>

      {projects.length === 0 ? (
        <p>No projects yet. Click &quot;New Project&quot; to get started.</p>
      ) : (
        <ul className="space-y-4">
          {projects.map(project => (
            <li key={project.id} className="border border-cosmic-light/30 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              {project.description && <p className="text-sm opacity-80 mt-1">{project.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
