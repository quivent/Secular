import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  GitBranch,
  Upload,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  FolderGit,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

interface Peer {
  name: string;
  nid: string;
  status: 'online' | 'offline' | 'unknown';
  repos?: number;
  isServer?: boolean;
}

const GCP_SERVER: Peer = {
  name: 'GCP Server',
  nid: 'z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3',
  status: 'online',
  isServer: true,
};

interface Repository {
  rid: string;
  name: string;
  description?: string;
}

interface SyncStatus {
  inProgress: boolean;
  message: string;
  success?: boolean;
}

interface RepoWithPath {
  name: string;
  rid: string;
  path?: string;
}

export default function Peers() {
  const [peers, setPeers] = useState<Peer[]>([GCP_SERVER]);
  const [repos, setRepos] = useState<RepoWithPath[]>([]);
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [peerRepos, setPeerRepos] = useState<Repository[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  useEffect(() => {
    if (selectedRepoPath) {
      loadPeers();
    }
  }, [selectedRepoPath]);

  const loadRepos = async () => {
    try {
      const response = await fetch('/api/repos');
      const data = await response.json();
      setRepos(data.repos || []);
      // Auto-select first repo if available
      if (data.repos && data.repos.length > 0) {
        setSelectedRepoPath(data.repos[0].name);
      }
    } catch (error) {
      console.error('Failed to load repos:', error);
    }
  };

  const loadPeers = async () => {
    if (!selectedRepoPath) {
      setPeers([GCP_SERVER]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/peers?repoPath=${encodeURIComponent(selectedRepoPath)}`);
      const data = await response.json();
      const loadedPeers = data.peers || [];
      // Always include GCP server first
      if (!loadedPeers.some((p: Peer) => p.nid === GCP_SERVER.nid)) {
        setPeers([GCP_SERVER, ...loadedPeers]);
      } else {
        setPeers(loadedPeers);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load peers:', error);
      setPeers([GCP_SERVER]);
      setLoading(false);
    }
  };

  const addPeer = async (nid: string, name: string) => {
    if (!selectedRepoPath) {
      alert('Please select a repository first');
      return;
    }

    try {
      const response = await fetch('/api/peers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nid, name, repoPath: selectedRepoPath }),
      });

      if (response.ok) {
        await loadPeers();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        const errorMsg = error.error || error.details || 'Unknown error';
        alert(`Failed to add peer: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Failed to add peer:', error);
      alert(`Failed to add peer: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const removePeer = async (name: string) => {
    if (!confirm(`Remove peer "${name}"?`)) return;
    if (!selectedRepoPath) return;

    try {
      const response = await fetch(`/api/peers/${name}?repoPath=${encodeURIComponent(selectedRepoPath)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPeers();
        if (selectedPeer?.name === name) {
          setSelectedPeer(null);
        }
      } else {
        const error = await response.json();
        alert(`Failed to remove peer: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to remove peer:', error);
      alert('Failed to remove peer');
    }
  };

  const loadPeerRepos = async (peer: Peer) => {
    setSelectedPeer(peer);
    // In a real implementation, this would fetch repos from the peer's node
    // For now, we'll show a placeholder
    setPeerRepos([]);
  };

  const pushToPeer = async (peer: Peer) => {
    if (!selectedRepoPath) return;
    setSyncStatus({ inProgress: true, message: `Pushing to ${peer.name}...` });

    try {
      const response = await fetch('/api/peers/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerName: peer.name, repoPath: selectedRepoPath }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus({
          inProgress: false,
          message: `Successfully pushed to ${peer.name}`,
          success: true,
        });
      } else {
        setSyncStatus({
          inProgress: false,
          message: `Failed to push: ${data.error}`,
          success: false,
        });
      }
    } catch (error) {
      setSyncStatus({
        inProgress: false,
        message: `Error: ${error}`,
        success: false,
      });
    }

    setTimeout(() => setSyncStatus(null), 5000);
  };

  const pullFromPeer = async (peer: Peer) => {
    if (!selectedRepoPath) return;
    setSyncStatus({ inProgress: true, message: `Pulling from ${peer.name}...` });

    try {
      const response = await fetch('/api/peers/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerName: peer.name, repoPath: selectedRepoPath }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus({
          inProgress: false,
          message: `Successfully pulled from ${peer.name}`,
          success: true,
        });
      } else {
        setSyncStatus({
          inProgress: false,
          message: `Failed to pull: ${data.error}`,
          success: false,
        });
      }
    } catch (error) {
      setSyncStatus({
        inProgress: false,
        message: `Error: ${error}`,
        success: false,
      });
    }

    setTimeout(() => setSyncStatus(null), 5000);
  };

  const syncWithPeer = async (peer: Peer) => {
    if (!selectedRepoPath) return;
    setSyncStatus({ inProgress: true, message: `Syncing with ${peer.name}...` });

    try {
      const response = await fetch('/api/peers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerName: peer.name, repoPath: selectedRepoPath }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus({
          inProgress: false,
          message: `Successfully synced with ${peer.name}`,
          success: true,
        });
      } else {
        setSyncStatus({
          inProgress: false,
          message: `Failed to sync: ${data.error}`,
          success: false,
        });
      }
    } catch (error) {
      setSyncStatus({
        inProgress: false,
        message: `Error: ${error}`,
        success: false,
      });
    }

    setTimeout(() => setSyncStatus(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Peer Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border-2 border-primary-500/30"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Network Peers</h3>
              <p className="text-white/70">
                Connect with peers to sync and collaborate on repositories
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!selectedRepoPath}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            Add Peer
          </button>
        </div>

        {/* Repository Selector */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <FolderGit className="w-5 h-5 text-primary-400" />
          <label className="text-sm font-medium text-white/70">Repository:</label>
          <select
            value={selectedRepoPath}
            onChange={(e) => setSelectedRepoPath(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 focus:border-primary-500/70 focus:bg-white/15 focus:outline-none transition-all duration-300 text-cyan-300"
          >
            {repos.length === 0 ? (
              <option value="">No repositories found</option>
            ) : (
              repos.map((repo) => (
                <option key={repo.rid} value={repo.name}>
                  {repo.name}
                </option>
              ))
            )}
          </select>
        </div>
      </motion.div>

      {/* Sync Status Toast */}
      {syncStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-xl p-4 border-2 ${
            syncStatus.success
              ? 'border-green-500/50 bg-green-500/10'
              : syncStatus.success === false
              ? 'border-red-500/50 bg-red-500/10'
              : 'border-primary-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            {syncStatus.inProgress ? (
              <RefreshCw className="w-5 h-5 text-primary-400 animate-spin" />
            ) : syncStatus.success ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className="flex-1">{syncStatus.message}</span>
          </div>
        </motion.div>
      )}

      {/* Peers List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass rounded-2xl p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-primary-400 animate-spin" />
            <p className="text-white/50">Loading peers...</p>
          </div>
        ) : peers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold mb-2">Add More Peers</h3>
            <p className="text-white/50 mb-4">
              Add additional peers by their Node ID to expand your collaboration network
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 inline-flex items-center gap-2 font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Add Peer
            </button>
          </motion.div>
        ) : (
          peers.map((peer, index) => (
            <motion.div
              key={peer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-primary-500/50 border border-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary-500 to-purple-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{peer.name}</h3>
                      <div className="flex items-center gap-1">
                        {peer.status === 'online' ? (
                          <>
                            <Wifi className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400">Online</span>
                          </>
                        ) : peer.status === 'offline' ? (
                          <>
                            <WifiOff className="w-4 h-4 text-red-400" />
                            <span className="text-xs text-red-400">Offline</span>
                          </>
                        ) : (
                          <span className="text-xs text-white/50">Unknown</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-white/50 font-mono mt-1">{peer.nid}</div>
                    {peer.repos !== undefined && (
                      <div className="flex items-center gap-2 mt-2">
                        <FolderGit className="w-4 h-4 text-primary-400" />
                        <span className="text-sm text-white/70">{peer.repos} repositories</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => pushToPeer(peer)}
                    className="px-4 py-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                    title="Push to peer"
                  >
                    <Upload className="w-4 h-4" />
                    Push
                  </button>
                  <button
                    onClick={() => pullFromPeer(peer)}
                    className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                    title="Pull from peer"
                  >
                    <Download className="w-4 h-4" />
                    Pull
                  </button>
                  <button
                    onClick={() => syncWithPeer(peer)}
                    className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                    title="Sync with peer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync
                  </button>
                  {!peer.isServer && (
                    <button
                      onClick={() => removePeer(peer.name)}
                      className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all duration-300"
                      title="Remove peer"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Peer Modal */}
      {showAddModal && <AddPeerModal onClose={() => setShowAddModal(false)} onAdd={addPeer} />}
    </div>
  );
}

interface AddPeerModalProps {
  onClose: () => void;
  onAdd: (nid: string, name: string) => void;
}

function AddPeerModal({ onClose, onAdd }: AddPeerModalProps) {
  const [nid, setNid] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nid && name && !loading) {
      setLoading(true);
      try {
        await onAdd(nid, name);
        // Only clear on success (modal will close if successful)
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl p-8 max-w-lg w-full mx-4 border border-primary-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Add Peer</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Peer Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="alice"
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 focus:border-primary-500/70 focus:bg-white/15 focus:outline-none transition-all duration-300 text-cyan-300 placeholder:text-white/40"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Node ID</label>
            <input
              type="text"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
              placeholder="did:key:z6Mkt67GdsW7715MEfRuP4pSZxJRJh6kj6Y48WRqVv4N1tRk"
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 focus:border-primary-500/70 focus:bg-white/15 focus:outline-none transition-all duration-300 font-mono text-sm text-cyan-300 placeholder:text-white/30"
              required
            />
            <p className="mt-2 text-xs text-white/50">
              The peer's Radicle Node ID (starts with "did:key:")
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl glass hover:bg-white/10 transition-all duration-300 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Peer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
