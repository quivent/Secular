import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderGit,
  Plus,
  Trash2,
  RefreshCw,
  GitBranch,
  Users,
  HardDrive,
  Upload,
  Download,
} from 'lucide-react';

interface Repository {
  rid: string;
  name: string;
  description: string;
  visibility: string;
  head: string;
  delegates: string[];
}

export default function Monitor() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoPaths, setRepoPaths] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('secular_repo_paths');
    return saved ? JSON.parse(saved) : {};
  });

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/repos');
      const data = await response.json();

      if (data.repos && Array.isArray(data.repos)) {
        setRepositories(data.repos);
      } else {
        setRepositories([]);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const addRepository = async () => {
    const path = prompt('Enter the path to your repository:');
    if (!path) return;

    const name = prompt('Enter repository name:');
    if (!name) return;

    const description = prompt('Enter repository description (optional):') || '';
    const visibility = confirm('Make repository private?') ? 'private' : 'public';

    try {
      const response = await fetch('/api/repos/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, name, description, visibility }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Repository initialized successfully!');
        fetchRepositories();
      } else {
        alert(`Error: ${data.error || 'Failed to initialize repository'}`);
      }
    } catch (error) {
      console.error('Failed to add repository:', error);
      alert('Failed to add repository. Check console for details.');
    }
  };

  const removeRepository = async (rid: string) => {
    if (!confirm('Are you sure you want to remove this repository from the list? This will not delete any files.')) {
      return;
    }

    alert('Remove functionality coming soon. For now, you can use `rad rm` from the command line.');
  };

  const getRepoPath = (rid: string, repoName: string) => {
    if (repoPaths[rid]) return repoPaths[rid];

    const path = prompt(`Enter the path to ${repoName}:`, `/Users/joshkornreich/Documents/Projects/${repoName}`);
    if (path) {
      const newPaths = { ...repoPaths, [rid]: path };
      setRepoPaths(newPaths);
      localStorage.setItem('secular_repo_paths', JSON.stringify(newPaths));
    }
    return path;
  };

  const pushRepository = async (rid: string, repoName: string) => {
    try {
      const path = getRepoPath(rid, repoName);
      if (!path) return;

      const response = await fetch('/api/repos/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✓ ${repoName} pushed successfully!`);
        fetchRepositories();
      } else {
        alert(`✗ Error: ${data.error || 'Failed to push repository'}`);
      }
    } catch (error) {
      console.error('Failed to push repository:', error);
      alert('Failed to push repository. Check console for details.');
    }
  };

  const pullRepository = async (rid: string, repoName: string) => {
    try {
      const path = getRepoPath(rid, repoName);
      if (!path) return;

      const response = await fetch('/api/repos/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✓ ${repoName} pulled successfully!`);
        fetchRepositories();
      } else {
        alert(`✗ Error: ${data.error || 'Failed to pull repository'}`);
      }
    } catch (error) {
      console.error('Failed to pull repository:', error);
      alert('Failed to pull repository. Check console for details.');
    }
  };

  const syncRepository = async (rid: string, repoName: string) => {
    try {
      const path = getRepoPath(rid, repoName);
      if (!path) return;

      const response = await fetch('/api/repos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✓ ${repoName} synced successfully!`);
        fetchRepositories();
      } else {
        alert(`✗ Error: ${data.error || 'Failed to sync repository'}`);
      }
    } catch (error) {
      console.error('Failed to sync repository:', error);
      alert('Failed to sync repository. Check console for details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-300 mb-1">Repositories</h2>
          <p className="text-white/50">Manage your local P2P repositories</p>
        </div>
        <button
          onClick={addRepository}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-slate-900 hover:shadow-lg hover:shadow-blue-500/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Repository
        </button>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-white/50">Loading repositories...</div>
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-red-400">{error}</div>
            <button
              onClick={fetchRepositories}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-slate-900"
            >
              Retry
            </button>
          </div>
        ) : repositories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <FolderGit className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-cyan-300 mb-2">No Repositories Yet</h3>
            <p className="text-white/50 mb-6">
              Initialize a git repository with `rad init` to get started
            </p>
          </motion.div>
        ) : (
          repositories.map((repo, index) => (
            <motion.div
              key={repo.rid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <FolderGit className="w-6 h-6 text-blue-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-cyan-300">{repo.name}</h3>
                      {repo.visibility === 'private' && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 mb-2">{repo.description}</p>
                    <p className="text-xs text-white/40 font-mono mb-4">{repo.rid}</p>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-xs text-white/50">Head</div>
                          <div className="text-sm font-medium text-cyan-300 font-mono">
                            {repo.head ? repo.head.slice(0, 7) : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="text-xs text-white/50">Delegates</div>
                          <div className="text-sm font-medium text-cyan-300">
                            {repo.delegates?.length || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="text-xs text-white/50">Branch</div>
                          <div className="text-sm font-medium text-cyan-300">main</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => pullRepository(repo.rid, repo.name)}
                    className="px-3 py-2 rounded-lg glass-hover text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
                    title="Pull (Download)"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Pull</span>
                  </button>
                  <button
                    onClick={() => pushRepository(repo.rid, repo.name)}
                    className="px-3 py-2 rounded-lg glass-hover text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                    title="Push (Upload)"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Push</span>
                  </button>
                  <button
                    onClick={() => syncRepository(repo.rid, repo.name)}
                    className="p-2 rounded-lg glass-hover text-purple-400 hover:text-purple-300 transition-colors"
                    title="Sync (Pull & Push)"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6 border-2 border-blue-500/30"
      >
        <h3 className="text-lg font-bold text-cyan-300 mb-4">How to Add Repositories</h3>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="font-bold text-blue-400 mb-2">1. Click "Add Repository"</div>
            <p className="text-white/70">Browse and select any folder on your computer</p>
          </div>
          <div>
            <div className="font-bold text-blue-400 mb-2">2. Auto-Initialize</div>
            <p className="text-white/70">Secular will automatically initialize it as a Radicle repo</p>
          </div>
          <div>
            <div className="font-bold text-blue-400 mb-2">3. Start Syncing</div>
            <p className="text-white/70">Click the sync button to share with peers</p>
          </div>
          <div>
            <div className="font-bold text-blue-400 mb-2">4. Collaborate</div>
            <p className="text-white/70">Share your Node ID with others to connect</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
