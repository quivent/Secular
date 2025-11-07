import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderGit,
  Lock,
  Globe,
  GitBranch,
  Copy,
  ExternalLink,
  RefreshCw,
  Upload,
  RotateCw,
} from 'lucide-react';

interface Repository {
  name: string;
  rid: string;
  visibility: 'public' | 'private';
  head: string;
  description: string;
}

export default function Repositories() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/repos');
      const data = await response.json();
      setRepos(data.repos || []);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const syncRepo = async (rid: string) => {
    setSyncing(rid);
    try {
      const response = await fetch('/api/friends/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        alert('Repository synced with network!');
      } else {
        const error = await response.json();
        alert(`Failed to sync: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Failed to sync: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border-2 border-primary-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10">
              <FolderGit className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Your Repositories</h3>
              <p className="text-white/70">
                {repos.length} {repos.length === 1 ? 'repository' : 'repositories'} on the Radicle network
              </p>
            </div>
          </div>
          <button
            onClick={loadRepos}
            className="px-4 py-2 rounded-xl glass hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-primary-400 animate-spin" />
            <p className="text-white/50">Loading repositories...</p>
          </div>
        ) : repos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <FolderGit className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold mb-2">No Repositories Yet</h3>
            <p className="text-white/50 mb-4">
              Initialize your first repository with Radicle
            </p>
            <code className="text-sm text-primary-400 bg-black/20 px-4 py-2 rounded-lg inline-block">
              rad init
            </code>
          </motion.div>
        ) : (
          repos.map((repo, index) => (
            <motion.div
              key={repo.rid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-primary-500/50 border border-white/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{repo.name}</h3>
                    <div className="flex items-center gap-2">
                      {repo.visibility === 'private' ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
                          <Lock className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400 font-medium">Private</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 border border-green-500/30">
                          <Globe className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400 font-medium">Public</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-white/60 mb-4">{repo.description}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-primary-400" />
                      <span className="text-white/50">HEAD:</span>
                      <code className="text-primary-400 font-mono">{repo.head}</code>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-white/50 bg-black/20 px-3 py-2 rounded-lg truncate">
                      {repo.rid}
                    </code>
                    <button
                      onClick={() => copyToClipboard(repo.rid)}
                      className="p-2 rounded-lg glass hover:bg-white/10 transition-all duration-300"
                      title="Copy RID"
                    >
                      <Copy className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => syncRepo(repo.rid)}
                    disabled={syncing === repo.rid}
                    className="px-4 py-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 transition-all duration-300 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Sync with network"
                  >
                    <RotateCw className={`w-4 h-4 ${syncing === repo.rid ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                    onClick={() => copyToClipboard(`rad clone ${repo.rid}`)}
                    title="Copy clone command"
                  >
                    <Copy className="w-4 h-4" />
                    Clone
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Commands */}
      {repos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h4 className="text-lg font-bold mb-4">Quick Commands</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 glass rounded-lg">
              <div className="text-sm text-white/50 mb-2">Clone a repository</div>
              <code className="text-xs text-primary-400 font-mono">rad clone rad:z...</code>
            </div>
            <div className="p-4 glass rounded-lg">
              <div className="text-sm text-white/50 mb-2">Initialize new repo</div>
              <code className="text-xs text-primary-400 font-mono">rad init</code>
            </div>
            <div className="p-4 glass rounded-lg">
              <div className="text-sm text-white/50 mb-2">Sync with network</div>
              <code className="text-xs text-primary-400 font-mono">rad sync --announce</code>
            </div>
            <div className="p-4 glass rounded-lg">
              <div className="text-sm text-white/50 mb-2">Check repo status</div>
              <code className="text-xs text-primary-400 font-mono">rad inspect</code>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
