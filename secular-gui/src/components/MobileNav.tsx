import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MobileNavProps {
  items: NavItem[];
  activeView: string;
  onNavigate: (view: string) => void;
}

export function MobileBottomNav({ items, activeView, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="flex items-center justify-around h-full px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 relative min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? 'text-cyan-400 scale-110' : 'text-white/60'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 truncate max-w-full ${
                  isActive ? 'text-cyan-300' : 'text-white/60'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface MobileMenuProps {
  items: NavItem[];
  activeView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ items, activeView, onNavigate, isOpen, onClose }: MobileMenuProps) {
  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 glass-modal border-r border-cyan-500/30 z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-2">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-primary">Menu</h2>
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50'
                        : 'hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-white/60'}`} />
                    <span className={`font-medium ${isActive ? 'text-cyan-300' : 'text-white/80'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
