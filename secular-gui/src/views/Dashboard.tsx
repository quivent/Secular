import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
  Activity,
  Users,
  FolderGit,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Wifi,
  HardDrive,
  ArrowRight,
  Plus,
  GitBranch,
  Download,
  Upload,
  X,
} from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';

interface Repository {
  rid: string;
  name: string;
  description: string;
}

interface SystemStatus {
  node_running: boolean;
  uptime_hours: number;
  peers: number;
  repos: number;
  current_cost: number;
  projected_cost: number;
}

export default function Dashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [addRepoMode, setAddRepoMode] = useState<'init' | 'clone'>('clone');
  const [repoPaths, setRepoPaths] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('secular_repo_paths');
    return saved ? JSON.parse(saved) : {};
  });
  const { isMobile, isTablet } = useBreakpoint();
  const isSmallScreen = isMobile || isTablet;

  useEffect(() => {
    loadStatus();
    loadRepositories();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();

      const uptimeMatch = data.uptime?.match(/up\s+(?:(\d+)\s+day[s]?,\s*)?(\d+):(\d+)/);
      let uptimeHours = 0;
      if (uptimeMatch) {
        const days = parseInt(uptimeMatch[1] || '0');
        const hours = parseInt(uptimeMatch[2] || '0');
        const minutes = parseInt(uptimeMatch[3] || '0');
        uptimeHours = (days * 24) + hours + (minutes / 60);
      }

      setStatus({
        node_running: data.node_running,
        uptime_hours: uptimeHours,
        peers: data.peers,
        repos: data.repos,
        current_cost: 0,
        projected_cost: 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load status:', error);
      setLoading(false);
    }
  };

  const loadRepositories = async () => {
    try {
      const response = await fetch('/api/repos');
      const data = await response.json();
      if (data.repos && Array.isArray(data.repos)) {
        setRepositories(data.repos.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to load repositories:', error);
    }
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

  const pushRepository = async (e: React.MouseEvent, rid: string, repoName: string) => {
    e.stopPropagation();
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
        loadRepositories();
      } else {
        alert(`✗ Error: ${data.error || 'Failed to push repository'}`);
      }
    } catch (error) {
      console.error('Failed to push repository:', error);
      alert('Failed to push repository. Check console for details.');
    }
  };

  const pullRepository = async (e: React.MouseEvent, rid: string, repoName: string) => {
    e.stopPropagation();
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
        loadRepositories();
      } else {
        alert(`✗ Error: ${data.error || 'Failed to pull repository'}`);
      }
    } catch (error) {
      console.error('Failed to pull repository:', error);
      alert('Failed to pull repository. Check console for details.');
    }
  };

  const metrics = [
    {
      icon: Activity,
      label: 'Uptime',
      value: status ? `${status.uptime_hours.toFixed(1)}h` : '...',
      change: '+12%',
      color: 'text-purple-400',
    },
    {
      icon: Users,
      label: 'Peers',
      value: status?.peers || 0,
      change: '+1',
      color: 'text-blue-400',
    },
    {
      icon: FolderGit,
      label: 'Repositories',
      value: status?.repos || 0,
      change: 'Stable',
      color: 'text-purple-400',
    },
  ];

  const quickActions = [
    { icon: Shield, label: 'Scan Now', color: 'from-blue-600 to-blue-500' },
    { icon: Activity, label: 'Start Node', color: 'from-blue-700 to-blue-600' },
    { icon: Shield, label: 'Audit Dependencies', color: 'from-blue-800 to-blue-700' },
  ];

  return (
    <div className="page-container">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-responsive-2xl font-bold text-primary mb-8 sm:mb-16">Dashboard</h1>
      </motion.div>

      {/* Repositories Section */}
      {repositories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero"
        >
          <div className="flex-responsive items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="icon-container-md sm:icon-container-lg">
                <FolderGit className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-responsive-lg font-semibold text-primary">Recent Repositories</h3>
                <p className="text-xs sm:text-sm text-tertiary mt-1 hide-mobile">Your active projects</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAddRepo(true)}
                className="btn-primary text-sm sm:text-base px-4 sm:px-8 h-10 sm:h-12"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hide-mobile">Add Repository</span>
                <span className="show-mobile">Add</span>
              </button>
              <button
                onClick={() => onNavigate?.('repositories')}
                className="btn-tertiary hide-mobile"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid-responsive-3 gap-responsive">
            {repositories.map((repo) => (
              <div
                key={repo.rid}
                className="card-standard group"
              >
                <div className="flex items-start gap-3 mb-4 sm:mb-6">
                  <div className="icon-container-sm sm:icon-container-md">
                    <FolderGit className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base sm:text-lg font-semibold text-primary truncate group-hover:text-cyan-300 transition-colors">
                      {repo.name}
                    </div>
                    {repo.description && (
                      <div className="text-xs sm:text-sm text-tertiary truncate mt-1 group-hover:text-secondary transition-colors">
                        {repo.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs text-quaternary font-mono truncate mb-3 sm:mb-4 px-2 sm:px-3 py-1.5 sm:py-2 glass-hover rounded-lg">
                  {repo.rid}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
                  <button
                    onClick={(e) => pullRepository(e, repo.rid, repo.name)}
                    className="flex-1 btn-secondary status-success border text-sm h-10 touch-target"
                    title="Pull"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hide-mobile">Pull</span>
                  </button>
                  <button
                    onClick={(e) => pushRepository(e, repo.rid, repo.name)}
                    className="flex-1 btn-primary text-sm h-10 touch-target"
                    title="Push"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hide-mobile">Push</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <div className="grid-responsive-4 gap-responsive">
        {metrics.map((metric, index) => {
          const isReposMetric = metric.label === 'Repositories';

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={isReposMetric ? 'metric-card group' : 'card-hero group'}
              onClick={isReposMetric ? () => onNavigate?.('repositories') : undefined}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="icon-container-md sm:icon-container-lg">
                  <metric.icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl sm:text-4xl font-bold text-primary group-hover:text-cyan-300 transition-colors">
                    {metric.value}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-tertiary group-hover:text-secondary transition-colors mt-1">
                    {metric.label}
                  </div>
                </div>
              </div>
              <div className="pt-3 sm:pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-quaternary">Last 24h</span>
                <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-medium status-success border">
                  {metric.change}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-hero group"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base sm:text-lg font-semibold text-primary truncate">Anonymous</div>
              <div className="text-[10px] sm:text-xs text-quaternary font-mono mt-1">d4f...8a2</div>
            </div>
          </div>
          <div className="pt-3 sm:pt-4 border-t border-white/10 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span className="text-xs sm:text-sm text-secondary">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm text-secondary">2.3 GB</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-responsive">
        {/* Security Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 card-hero"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="icon-container-md sm:icon-container-lg">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            <h3 className="text-responsive-lg font-semibold text-primary">Security Status</h3>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="card-standard flex-responsive items-start sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="icon-container-sm sm:icon-container-md flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base font-semibold text-primary">Secret Scanning</div>
                  <div className="text-xs sm:text-sm text-tertiary mt-1">Last scan: 2 minutes ago</div>
                </div>
              </div>
              <div className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-medium status-success border flex-shrink-0">
                ✓ Clean
              </div>
            </div>

            <div className="card-standard flex-responsive items-start sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="icon-container-sm sm:icon-container-md flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base font-semibold text-primary">Vulnerability Scan</div>
                  <div className="text-xs sm:text-sm text-tertiary mt-1">Last scan: 1 hour ago</div>
                </div>
              </div>
              <div className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-medium status-warning border flex-shrink-0">
                2 Found
              </div>
            </div>

            <div className="card-standard flex-responsive items-start sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="icon-container-sm sm:icon-container-md flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base font-semibold text-primary">Node Security</div>
                  <div className="text-xs sm:text-sm text-tertiary mt-1">All checks passed</div>
                </div>
              </div>
              <div className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-medium status-success border flex-shrink-0">
                ✓ Secure
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card-hero"
        >
          <h3 className="text-responsive-lg font-semibold text-primary mb-6 sm:mb-8">Quick Actions</h3>

          <div className="space-y-3 sm:space-y-6">
            {quickActions.map((action, index) => (
              <button
                key={action.label}
                className="btn-primary w-full text-sm sm:text-base h-11 sm:h-12 touch-target"
              >
                <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 card-standard">
            <div className="text-xs sm:text-sm font-medium text-secondary mb-3 sm:mb-4">Optimization Score</div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-1 h-2 sm:h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-cyan-400">85%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Repository Modal */}
      {showAddRepo && (
        <AddRepoModal
          mode={addRepoMode}
          onClose={() => setShowAddRepo(false)}
          onModeChange={setAddRepoMode}
        />
      )}
    </div>
  );
}

// Add Repository Modal Component
function AddRepoModal({
  mode,
  onClose,
  onModeChange
}: {
  mode: 'init' | 'clone';
  onClose: () => void;
  onModeChange: (mode: 'init' | 'clone') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="modal-responsive glass-modal p-responsive max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h3 className="text-responsive-2xl font-bold text-primary">Add Repository</h3>
          <button
            onClick={onClose}
            className="btn-tertiary touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => onModeChange('clone')}
            className={`${mode === 'clone' ? 'btn-primary' : 'btn-secondary'} flex-1 h-12 touch-target`}
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Clone Repository</span>
          </button>
          <button
            onClick={() => onModeChange('init')}
            className={`${mode === 'init' ? 'btn-primary' : 'btn-secondary'} flex-1 h-12 touch-target`}
          >
            <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Initialize New</span>
          </button>
        </div>

        {/* Clone Mode */}
        {mode === 'clone' && (
          <div className="space-y-4 sm:space-y-6">
            <p className="text-sm sm:text-base text-secondary">
              Clone an existing Radicle repository using its Repository ID (RID).
            </p>
            <div>
              <label className="block text-sm font-semibold mb-3 text-secondary">Repository ID (RID)</label>
              <input
                type="text"
                placeholder="rad:z37K5utX7Tmxa5UjS1iVZ5sjbJDHN"
                className="w-full h-12 px-4 rounded-xl glass border border-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 font-mono text-sm sm:text-base touch-target"
              />
              <p className="mt-2 text-xs sm:text-sm text-tertiary">
                Get this from your friend or from the repository page
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 text-secondary">Clone to (optional)</label>
              <input
                type="text"
                placeholder="~/repos/my-project"
                className="w-full h-12 px-4 rounded-xl glass border border-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 text-sm sm:text-base touch-target"
              />
              <p className="mt-2 text-xs sm:text-sm text-tertiary">
                Leave empty to clone to current directory
              </p>
            </div>
            <button className="btn-primary w-full mt-4 touch-target">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Clone Repository
            </button>
          </div>
        )}

        {/* Init Mode */}
        {mode === 'init' && (
          <div className="space-y-4 sm:space-y-6">
            <p className="text-sm sm:text-base text-secondary">
              Initialize an existing Git repository as a Radicle repository.
            </p>
            <div>
              <label className="block text-sm font-semibold mb-3 text-secondary">Repository Path</label>
              <input
                type="text"
                placeholder="/path/to/your/repo"
                className="w-full h-12 px-4 rounded-xl glass border border-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 text-sm sm:text-base touch-target"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 text-secondary">Name</label>
              <input
                type="text"
                placeholder="My Project"
                className="w-full h-12 px-4 rounded-xl glass border border-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 text-sm sm:text-base touch-target"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 text-secondary">Description</label>
              <textarea
                placeholder="A description of your project"
                rows={3}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 resize-none text-sm sm:text-base touch-target"
              />
            </div>
            <button className="btn-primary w-full mt-4 touch-target">
              <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
              Initialize Repository
            </button>
          </div>
        )}

        <div className="mt-6 sm:mt-8 card-compact">
          <div className="text-xs sm:text-sm font-medium text-secondary mb-2">CLI Alternative:</div>
          {mode === 'clone' ? (
            <code className="text-xs sm:text-sm text-cyan-400 font-mono break-all">rad clone rad:YOUR_REPO_ID</code>
          ) : (
            <code className="text-xs sm:text-sm text-cyan-400 font-mono break-all">cd /path && rad init --name "Name"</code>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
