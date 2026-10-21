import { useState } from 'react';
import { Activity, Calendar, Target, Upload, Brain, BookOpen, User, Dumbbell } from 'lucide-react';
import { DataProvider } from './store';
import DailyTab from './components/DailyTab';
import WeeklyTab from './components/WeeklyTab';
import TargetTab from './components/TargetTab';
import ImportTab from './components/ImportTab';
import AICoachTab from './components/AICoachTab';
import ScientificTab from './components/ScientificTab';
import ProfileTab from './components/ProfileTab';
import WorkoutsList from './components/WorkoutsList';

const tabs = [
  { id: 'daily', label: 'Daily', icon: Activity },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'weekly', label: 'Weekly', icon: Calendar },
  { id: 'target', label: 'Target', icon: Target },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'ai', label: 'AI Coach', icon: Brain },
  { id: 'scientific', label: 'Insights', icon: BookOpen },
  { id: 'profile', label: 'Profile', icon: User },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState('daily');

  const renderTab = () => {
    switch (activeTab) {
      case 'daily': return <DailyTab />;
      case 'workouts': return <WorkoutsList />;
      case 'weekly': return <WeeklyTab />;
      case 'target': return <TargetTab />;
      case 'import': return <ImportTab />;
      case 'ai': return <AICoachTab />;
      case 'scientific': return <ScientificTab />;
      case 'profile': return <ProfileTab />;
      default: return <DailyTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-[#2a2a3a]/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e676] to-[#448aff] flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="gradient-text">PulseRun</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse"></div>
              <span className="text-[10px] text-[#00e676]">Data Synced</span>
            </div>
            <div className="text-xs text-[#8888a0]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 pb-24 overflow-y-auto">
        <div className="animate-slide-up" key={activeTab}>
          {renderTab()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#12121a]/95 backdrop-blur-md border-t border-[#2a2a3a]/50 z-50">
        <div className="max-w-7xl mx-auto px-2 py-2">
          <div className="flex items-center justify-between overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] ${
                    isActive
                      ? 'tab-active text-[#00e676]'
                      : 'text-[#555570] hover:text-[#8888a0]'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
