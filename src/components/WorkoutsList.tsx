import { Activity, Calendar, MapPin, Clock, Flame, ChevronRight, Filter, Search, Trash2, AlertCircle, Download } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData } from '../store';
import { RunSession } from '../types';
import WorkoutDetail from './WorkoutDetail';
import { toCSV, runSessionToCSVRow } from '../csvParser';

export default function WorkoutsList() {
  const { state, removeRunSession } = useData();
  const [selectedSession, setSelectedSession] = useState<RunSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration' | 'pace'>('date');
  const [filterType, setFilterType] = useState<'all' | 'long' | 'tempo' | 'interval' | 'easy'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const sessions = state.runSessions;

  // Classify workout type based on metrics
  const classifyWorkout = (session: RunSession): string => {
    if (session.distance >= 10) return 'long';
    if (session.pace < 5.0) return 'interval';
    if (session.avgHR > 155) return 'tempo';
    return 'easy';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'long': return 'bg-[#448aff]/20 text-[#448aff] border-[#448aff]/30';
      case 'interval': return 'bg-[#ff5252]/20 text-[#ff5252] border-[#ff5252]/30';
      case 'tempo': return 'bg-[#ffab40]/20 text-[#ffab40] border-[#ffab40]/30';
      case 'easy': return 'bg-[#4caf50]/20 text-[#4caf50] border-[#4caf50]/30';
      default: return 'bg-[#555570]/20 text-[#555570]';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'long': return '🏃 Long Run';
      case 'interval': return '⚡ Interval';
      case 'tempo': return '🔥 Tempo';
      case 'easy': return '🌿 Easy';
      default: return '•';
    }
  };

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(s => classifyWorkout(s) === filterType);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.date.includes(query) ||
        s.distance.toString().includes(query) ||
        s.duration.toString().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance': return b.distance - a.distance;
        case 'duration': return b.duration - a.duration;
        case 'pace': return a.pace - b.pace;
        case 'date':
        default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [sessions, filterType, searchQuery, sortBy]);

  // Summary stats
  const totalDistance = sessions.reduce((sum, s) => sum + s.distance, 0);
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgPace = sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.pace, 0) / sessions.length : 0;

  const handleDeleteWorkout = (sessionId: string) => {
    removeRunSession(sessionId);
    setShowDeleteConfirm(null);
  };

  const handleExportCSV = () => {
    if (sessions.length === 0) return;
    
    const headers = [
      'date', 'duration_min', 'distance_km', 'pace_min_per_km',
      'avg_hr', 'max_hr', 'vo2max', 'elevation_gain_m', 'elevation_loss_m',
      'steps', 'calories', 'cadence_spm', 'stride_length_m',
      'gct_ms', 'vertical_oscillation_cm', 'vertical_ratio_pct',
      'training_load', 'start_hr', 'end_hr', 'recovery_rate_bpm'
    ];
    
    const rows = sessions.map(session => runSessionToCSVRow(session));
    const csvContent = toCSV(headers, rows);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workouts_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // If a session is selected, show detail view
  if (selectedSession) {
    return <WorkoutDetail session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={16} className="text-[#00e676]" />
          <h2 className="text-sm font-semibold">My Workouts</h2>
          <span className="text-[10px] text-[#555570] ml-auto">{sessions.length} sessions</span>
        </div>
        <p className="text-xs text-[#8888a0]">View detailed analysis of each imported workout session</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-lg font-bold text-[#448aff]">{totalDistance.toFixed(1)}</div>
          <div className="text-[10px] text-[#8888a0]">Total km</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg font-bold text-[#00e676]">{totalTime}</div>
          <div className="text-[10px] text-[#8888a0]">Total min</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg font-bold text-[#ffab40]">{avgPace.toFixed(2)}</div>
          <div className="text-[10px] text-[#8888a0]">Avg pace</div>
        </div>
      </div>

      {/* Export Button */}
      {sessions.length > 0 && (
        <button
          onClick={handleExportCSV}
          className="w-full glass-card p-3 flex items-center justify-center gap-2 hover:border-[#00e676]/30 transition-all"
        >
          <Download size={14} className="text-[#00e676]" />
          <span className="text-xs font-medium text-[#00e676]">Export All Workouts as CSV</span>
        </button>
      )}

      {/* Search & Filter */}
      <div className="glass-card p-3">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555570]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by date, distance..."
            className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f0f0f5] placeholder-[#555570] focus:outline-none focus:border-[#00e676]/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={12} className="text-[#555570] flex-shrink-0" />
          {(['all', 'easy', 'tempo', 'interval', 'long'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/30'
                  : 'bg-[#12121a] text-[#8888a0] border border-[#2a2a3a] hover:border-[#00e676]/30'
              }`}
            >
              {type === 'all' ? 'All' : getTypeLabel(type)}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="ml-auto text-[10px] px-2 py-1 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-[#8888a0] focus:outline-none"
          >
            <option value="date">Sort: Date</option>
            <option value="distance">Sort: Distance</option>
            <option value="duration">Sort: Duration</option>
            <option value="pace">Sort: Pace</option>
          </select>
        </div>
      </div>

      {/* Workout List */}
      {filteredSessions.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Activity size={32} className="mx-auto text-[#555570] mb-3" />
          <p className="text-xs text-[#8888a0]">
            {sessions.length === 0
              ? 'No workouts imported yet. Go to Import tab to add data.'
              : 'No workouts match your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((session) => {
            const type = classifyWorkout(session);
            const paceMinutes = Math.floor(session.pace);
            const paceSeconds = Math.round((session.pace - paceMinutes) * 60);
            const paceFormatted = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;

            return (
              <div
                key={session.id}
                className="glass-card p-4 hover:border-[#00e676]/30 transition-all group relative"
              >
                <div className="flex items-center gap-3">
                  {/* Date & Type */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedSession(session)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={12} className="text-[#555570]" />
                      <span className="text-xs font-medium">{session.date}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getTypeColor(type)}`}>
                        {getTypeLabel(type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-[#448aff]" />
                        <span className="text-xs font-semibold text-[#448aff]">{session.distance}km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-[#00e676]" />
                        <span className="text-xs text-[#8888a0]">{session.duration}min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity size={11} className="text-[#ffab40]" />
                        <span className="text-xs text-[#8888a0]">{paceFormatted}/km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame size={11} className="text-[#ff5252]" />
                        <span className="text-xs text-[#8888a0]">{session.calories}kcal</span>
                      </div>
                    </div>
                    {/* Quick metrics */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-[#555570]">
                        HR: <span className="text-[#ff5252]">{session.avgHR}</span>/{session.maxHR}
                      </span>
                      <span className="text-[10px] text-[#555570]">
                        GCT: <span className="text-[#00e5ff]">{session.gct}ms</span>
                      </span>
                      <span className="text-[10px] text-[#555570]">
                        Cadence: <span className="text-[#b388ff]">{session.cadence}</span>
                      </span>
                      <span className="text-[10px] text-[#555570]">
                        HRR: <span className="text-[#00e676]">{session.recoveryRate}bpm</span>
                      </span>
                    </div>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(session.id);
                    }}
                    className="p-2 rounded-lg text-[#555570] hover:text-[#ff5252] hover:bg-[#ff5252]/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete workout"
                  >
                    <Trash2 size={14} />
                  </button>
                  {/* Arrow */}
                  <ChevronRight size={16} className="text-[#555570] group-hover:text-[#00e676] transition-colors cursor-pointer" onClick={() => setSelectedSession(session)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="glass-card p-3 border-l-2 border-l-[#448aff]">
        <p className="text-[10px] text-[#8888a0]">
          💡 Click on any workout to see detailed biomechanical analysis, HR zone distribution, recovery metrics, and AI insights.
          All data is synced from your imports and persists across sessions.
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a1a25] border border-[#2a2a3a] rounded-2xl p-5 animate-slide-up mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff5252]/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-[#ff5252]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Delete Workout?</h3>
                <p className="text-xs text-[#8888a0]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-[#8888a0] mb-4">
              Are you sure you want to delete this workout? All data including metrics, analysis, and AI insights will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteWorkout(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5252]/20 text-[#ff5252] text-xs font-semibold border border-[#ff5252]/30 hover:bg-[#ff5252]/30 transition-all"
              >
                Delete Workout
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#2a2a3a] text-[#8888a0] text-xs font-semibold hover:bg-[#3a3a4a] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
