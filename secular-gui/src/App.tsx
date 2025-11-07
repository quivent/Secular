import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Activity,
  Rocket,
  Settings,
  Shield,
  Users,
  FolderGit,
  Sliders,
  Menu,
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import Scanner from './views/Scanner';
import Monitor from './views/Monitor';
import Deploy from './views/Deploy';
import Peers from './views/Peers';
import Repositories from './views/Repositories';
import ComponentShowcase from './views/ComponentShowcase';
import { MobileBottomNav, MobileMenu } from './components/MobileNav';
import { useBreakpoint } from './hooks/useBreakpoint';
import { useOnlineStatus } from './hooks/useOnlineStatus';

type View = 'dashboard' | 'repositories' | 'scanner' | 'monitor' | 'deploy' | 'peers' | 'settings' | 'controls';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  const isSmallScreen = isMobile || isTablet;
  const isOnline = useOnlineStatus();

  // Add Ctrl+R / Cmd+R to refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scanner', icon: Search },
    { id: 'monitor', label: 'Repositories', icon: FolderGit },
    { id: 'deploy', label: 'Deploy', icon: Rocket },
    { id: 'peers', label: 'Peers', icon: Users },
    { id: 'controls', label: 'Controls', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
      <div className="absolute inset-0 bg-mesh opacity-20" />

      {/* Floating orbs for ambiance - hide on mobile for performance */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float hide-mobile" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float hide-mobile" style={{ animationDelay: '3s' }} />

      {/* Top Header Bar */}
      <header className="relative z-10 glass border-b border-white/10 px-responsive pt-4 sm:pt-6 pb-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {isSmallScreen && (
            <button
              onClick={() => setMenuOpen(true)}
              className="touch-target p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-cyan-200/80" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg shadow-primary-500/50">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
              Secular
            </h1>
            <p className="text-[10px] text-cyan-200/50 hide-mobile">P2P Collab</p>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        {!isSmallScreen && (
          <nav className="flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as View)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                    transition-all duration-300 relative overflow-hidden
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/50'
                      : 'hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-cyan-200/60'}`} />
                  <span className={`font-medium text-sm ${isActive ? 'text-cyan-300' : 'text-cyan-200/60'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Profile Section */}
        <div className="flex items-center gap-3">
          <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <div className="hide-mobile">
              <div className={`text-xs font-medium ${isOnline ? 'text-cyan-300' : 'text-red-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="text-[10px] text-cyan-200/50">
                {isOnline ? 'Connected' : 'No connection'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isSmallScreen && (
        <MobileMenu
          items={navigation}
          activeView={activeView}
          onNavigate={setActiveView}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`relative z-10 flex-1 overflow-hidden flex flex-col ${isSmallScreen ? 'pb-20' : ''}`}>
        {/* View Content */}
        <div className="flex-1 overflow-auto p-responsive">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeView === 'dashboard' && <Dashboard onNavigate={(view) => setActiveView(view as View)} />}
              {activeView === 'repositories' && <Repositories />}
              {activeView === 'scanner' && <Scanner />}
              {activeView === 'monitor' && <Monitor />}
              {activeView === 'deploy' && <Deploy />}
              {activeView === 'peers' && <Peers />}
              {activeView === 'controls' && <ComponentShowcase />}
              {activeView === 'settings' && (
                <div className="glass rounded-2xl p-responsive text-center">
                  <Settings className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-cyan-200/20" />
                  <h3 className="text-responsive-xl font-bold mb-2 text-cyan-300">Settings</h3>
                  <p className="text-cyan-200/50">Coming soon...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isSmallScreen && (
        <MobileBottomNav
          items={navigation}
          activeView={activeView}
          onNavigate={setActiveView}
        />
      )}
    </div>
  );
}
