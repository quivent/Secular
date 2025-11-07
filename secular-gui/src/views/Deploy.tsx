import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Server,
  FolderGit,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface Repository {
  name: string;
  rid: string;
  visibility: string;
  head: string;
  description?: string;
  seeded?: boolean;
}

interface DeployStatus {
  inProgress: boolean;
  message: string;
  success?: boolean;
}

const GCP_SERVER = {
  nodeId: 'z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3',
  address: '35.222.36.165:8776',
  name: 'GCP Server',
};

export default function Deploy() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployStatus, setDeployStatus] = useState<DeployStatus | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>('');

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
      console.error('Failed to load repos:', error);
    } finally {
      setLoading(false);
    }
  };

  const deployRepo = async (repoName: string) => {
    setSelectedRepo(repoName);
    setDeployStatus({ inProgress: true, message: `Deploying ${repoName} to GCP server...` });

    try {
      // Add server as seed
      const seedResponse = await fetch('/api/repos/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: repoName,
          nodeId: GCP_SERVER.nodeId,
          address: GCP_SERVER.address,
        }),
      });

      if (!seedResponse.ok) {
        const error = await seedResponse.json();
        throw new Error(error.error || 'Failed to add seed');
      }

      // Sync to server
      const syncResponse = await fetch('/api/repos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: repoName,
          announce: true,
        }),
      });

      if (!syncResponse.ok) {
        const error = await syncResponse.json();
        throw new Error(error.error || 'Failed to sync');
      }

      setDeployStatus({
        inProgress: false,
        message: `Successfully deployed ${repoName} to GCP server!`,
        success: true,
      });

      // Reload repos to update seeded status
      await loadRepos();
    } catch (error) {
      setDeployStatus({
        inProgress: false,
        message: `Failed to deploy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      });
    }

    setTimeout(() => setDeployStatus(null), 5000);
  };

  const checkSeeded = async (repoName: string) => {
    try {
      const response = await fetch(`/api/repos/seeds?repoPath=${encodeURIComponent(repoName)}`);
      const data = await response.json();
      return data.seeds?.some((seed: any) => seed.includes(GCP_SERVER.nodeId));
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border-2 border-primary-500/30"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Deploy to GCP Server</h2>
            <p className="text-white/70 mb-4">
              Deploy your repositories to the remote server for backup and collaboration
            </p>
            <div className="glass rounded-xl p-4 inline-flex items-center gap-3">
              <Server className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-medium text-sm">{GCP_SERVER.name}</div>
                <div className="text-xs text-white/50 font-mono">{GCP_SERVER.address}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Deploy Status Toast */}
      {deployStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-xl p-4 border-2 ${
            deployStatus.success
              ? 'border-green-500/50 bg-green-500/10'
              : deployStatus.success === false
              ? 'border-red-500/50 bg-red-500/10'
              : 'border-primary-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            {deployStatus.inProgress ? (
              <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
            ) : deployStatus.success ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className="flex-1">{deployStatus.message}</span>
          </div>
        </motion.div>
      )}

      {/* Repositories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-primary-400 animate-spin" />
            <p className="text-white/50">Loading repositories...</p>
          </div>
        ) : repos.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <FolderGit className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold mb-2">No Repositories</h3>
            <p className="text-white/50">Initialize a repository first</p>
          </div>
        ) : (
          repos.map((repo, index) => (
            <motion.div
              key={repo.rid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-primary-500/50 border border-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                    <FolderGit className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{repo.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                        {repo.visibility}
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-sm text-white/50 mt-1">{repo.description}</p>
                    )}
                    <div className="text-xs text-white/40 font-mono mt-2">
                      {repo.rid}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deployRepo(repo.name)}
                  disabled={deployStatus?.inProgress && selectedRepo === repo.name}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-500/30 transition-all duration-300 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deployStatus?.inProgress && selectedRepo === repo.name ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Deploy to GCP
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-6 border border-white/10"
      >
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Server className="w-5 h-5 text-primary-400" />
          How It Works
        </h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-primary-400">1.</span>
            <span>Click "Deploy to GCP" to seed the repository on your remote server</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">2.</span>
            <span>The repository will be synced and announced to the network</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">3.</span>
            <span>Access your repos from anywhere via http://35.222.36.165:5288</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">4.</span>
            <span>Private repositories remain accessible only to you</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
