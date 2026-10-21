import { useState, useMemo } from 'react';
import { Heart, Moon, Wind, Brain, Activity, ThermometerSun, Zap, TrendingUp, Calendar, ChevronLeft, ChevronRight, Flame, Footprints, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useData } from '../store';
import { DailyMetrics } from '../types';

export default function DailyTab() {
  const { state } = useData();
  const profile = state.profile;
  
  // Get all available dates from history and run sessions
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    
    // Add dates from daily metrics history
    state.dailyMetricsHistory.forEach(m => dates.add(m.date));
    
    // Add dates from run sessions
    state.runSessions.forEach(s => dates.add(s.date));
    
    // Sort dates (newest first)
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [state.dailyMetricsHistory, state.runSessions]);
  
  // Current selected date
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates.length > 0 ? availableDates[0] : new Date().toISOString().split('T')[0]
  );
  
  // Current sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sleep' | 'health'>('overview');
  
  // Get metrics for selected date
  const currentMetrics: DailyMetrics = useMemo(() => {
    const metrics = state.dailyMetricsHistory.find(m => m.date === selectedDate);
    return metrics || state.dailyMetricsHistory[0] || state.dailyMetrics;
  }, [selectedDate, state.dailyMetricsHistory, state.dailyMetrics]);
  
  // Get run sessions for selected date
  const dateRunSessions = useMemo(() => {
    return state.runSessions.filter(s => s.date === selectedDate);
  }, [selectedDate, state.runSessions]);
  
  // Calculate activity metrics for selected date
  // Priority: dailyMetrics (from health import) > runSessions (from workout import)
  const activityMetrics = useMemo(() => {
    // Check if dailyMetrics has activity data
    if (currentMetrics.calories || currentMetrics.steps || currentMetrics.distance) {
      return {
        calories: currentMetrics.calories || 0,
        steps: currentMetrics.steps || 0,
        activityTime: 0, // Not available in dailyMetrics
        distance: currentMetrics.distance || 0,
        sessions: 0, // Not available in dailyMetrics
        source: 'health',
      };
    }
    
    // Fallback to runSessions
    const totalCalories = dateRunSessions.reduce((sum, s) => sum + s.calories, 0);
    const totalSteps = dateRunSessions.reduce((sum, s) => sum + s.steps, 0);
    const totalActivityTime = dateRunSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalDistance = dateRunSessions.reduce((sum, s) => sum + s.distance, 0);
    
    return {
      calories: totalCalories,
      steps: totalSteps,
      activityTime: totalActivityTime,
      distance: totalDistance,
      sessions: dateRunSessions.length,
      source: 'workout',
    };
  }, [currentMetrics, dateRunSessions]);
  
  // Date navigation
  const currentDateIndex = availableDates.indexOf(selectedDate);
  const hasPreviousDate = currentDateIndex < availableDates.length - 1;
  const hasNextDate = currentDateIndex > 0;
  
  const goToPreviousDate = () => {
    if (hasPreviousDate) {
      setSelectedDate(availableDates[currentDateIndex + 1]);
    }
  };
  
  const goToNextDate = () => {
    if (hasNextDate) {
      setSelectedDate(availableDates[currentDateIndex - 1]);
    }
  };
  
  // Get score colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#00e676]';
    if (score >= 60) return 'text-[#ffab40]';
    return 'text-[#ff5252]';
  };
  
  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-[#00e676]/20 to-[#00e676]/5';
    if (score >= 60) return 'from-[#ffab40]/20 to-[#ffab40]/5';
    return 'from-[#ff5252]/20 to-[#ff5252]/5';
  };
  
  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-4">
      {/* Vitality & Recovery Score */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`glass-card p-4 bg-gradient-to-br ${getScoreGradient(currentMetrics.vitalityScore)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-[#00e676]" />
            <span className="text-xs text-[#8888a0] font-medium">VITALITY</span>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(currentMetrics.vitalityScore)}`}>{currentMetrics.vitalityScore}</div>
          <div className="text-xs text-[#555570] mt-1">out of 100</div>
          <div className="mt-3 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00e676] to-[#448aff] rounded-full transition-all" style={{ width: `${currentMetrics.vitalityScore}%` }} />
          </div>
        </div>
        <div className={`glass-card p-4 bg-gradient-to-br ${getScoreGradient(currentMetrics.recoveryScore)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-[#448aff]" />
            <span className="text-xs text-[#8888a0] font-medium">RECOVERY</span>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(currentMetrics.recoveryScore)}`}>{currentMetrics.recoveryScore}</div>
          <div className="text-xs text-[#555570] mt-1">out of 100</div>
          <div className="mt-3 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#448aff] to-[#b388ff] rounded-full transition-all" style={{ width: `${currentMetrics.recoveryScore}%` }} />
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} className="text-[#ff5252]" />
          <h3 className="text-sm font-semibold">Activity Summary</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={12} className="text-[#ff5252]" />
              <span className="text-[10px] text-[#8888a0]">Calories</span>
            </div>
            <div className="text-xl font-bold text-[#ff5252]">{activityMetrics.calories}</div>
            <div className="text-[10px] text-[#555570]">kcal burned</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="flex items-center gap-2 mb-1">
              <Footprints size={12} className="text-[#448aff]" />
              <span className="text-[10px] text-[#8888a0]">Steps</span>
            </div>
            <div className="text-xl font-bold text-[#448aff]">{activityMetrics.steps.toLocaleString()}</div>
            <div className="text-[10px] text-[#555570]">total steps</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className="text-[#00e676]" />
              <span className="text-[10px] text-[#8888a0]">Activity Time</span>
            </div>
            <div className="text-xl font-bold text-[#00e676]">{activityMetrics.activityTime}</div>
            <div className="text-[10px] text-[#555570]">minutes</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={12} className="text-[#ffab40]" />
              <span className="text-[10px] text-[#8888a0]">Distance</span>
            </div>
            <div className="text-xl font-bold text-[#ffab40]">{activityMetrics.distance.toFixed(1)}</div>
            <div className="text-[10px] text-[#555570]">km • {activityMetrics.sessions} sessions</div>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 cursor-pointer hover:border-[#b388ff]/30 transition-all" onClick={() => setActiveSubTab('sleep')}>
          <div className="flex items-center gap-2 mb-2">
            <Moon size={14} className="text-[#b388ff]" />
            <span className="text-xs text-[#8888a0]">Sleep</span>
          </div>
          <div className="text-2xl font-bold text-[#b388ff]">{currentMetrics.sleepDuration}h</div>
          <div className="text-[10px] text-[#555570]">Deep: {currentMetrics.deepSleep}h • REM: {currentMetrics.remSleep}h</div>
        </div>
        <div className="glass-card p-4 cursor-pointer hover:border-[#ff5252]/30 transition-all" onClick={() => setActiveSubTab('health')}>
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} className="text-[#ff5252]" />
            <span className="text-xs text-[#8888a0]">Heart Rate</span>
          </div>
          <div className="text-2xl font-bold text-[#ff5252]">{currentMetrics.restingHR}</div>
          <div className="text-[10px] text-[#555570]">RHR • SpO₂: {currentMetrics.spo2}%</div>
        </div>
      </div>

      {/* Stress & HRV */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-[#ffab40]" />
            <span className="text-xs text-[#8888a0]">Stress</span>
          </div>
          <div className="text-2xl font-bold text-[#ffab40]">{currentMetrics.stressLevel}%</div>
          <div className="text-[10px] text-[#555570]">{currentMetrics.stressLevel < 40 ? 'Low stress' : currentMetrics.stressLevel < 60 ? 'Moderate' : 'High stress'}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-[#00e676]" />
            <span className="text-xs text-[#8888a0]">HRV</span>
          </div>
          <div className="text-2xl font-bold text-[#00e676]">{currentMetrics.hrv}</div>
          <div className="text-[10px] text-[#555570]">ms</div>
        </div>
      </div>
    </div>
  );
  
  // Render Sleep Tab
  const renderSleep = () => (
    <div className="space-y-4">
      {/* Sleep Analysis */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Moon size={16} className="text-[#b388ff]" />
          <h3 className="text-sm font-semibold">Sleep Analysis</h3>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold">{currentMetrics.sleepDuration}h</span>
            <span className="text-xs text-[#8888a0] ml-2">total sleep</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#8888a0]">Resp. Rate</div>
            <div className="text-sm font-semibold text-[#00e5ff]">{currentMetrics.sleepRespRate}/min</div>
          </div>
        </div>
        {/* Sleep Phases Bar */}
        <div className="h-6 rounded-full overflow-hidden flex mb-3">
          <div className="bg-[#1a237e] flex items-center justify-center" style={{ width: `${(currentMetrics.deepSleep / currentMetrics.sleepDuration) * 100}%` }}>
            <span className="text-[9px] font-medium">{currentMetrics.deepSleep}h</span>
          </div>
          <div className="bg-[#4a148c] flex items-center justify-center" style={{ width: `${(currentMetrics.remSleep / currentMetrics.sleepDuration) * 100}%` }}>
            <span className="text-[9px] font-medium">{currentMetrics.remSleep}h</span>
          </div>
          <div className="bg-[#311b92] flex items-center justify-center" style={{ width: `${(currentMetrics.lightSleep / currentMetrics.sleepDuration) * 100}%` }}>
            <span className="text-[9px] font-medium">{currentMetrics.lightSleep}h</span>
          </div>
          <div className="bg-[#4a4a5a] flex items-center justify-center" style={{ width: `${(currentMetrics.awake / currentMetrics.sleepDuration) * 100}%` }}>
            <span className="text-[9px] font-medium">{currentMetrics.awake}h</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="w-2 h-2 rounded-full bg-[#1a237e] mx-auto mb-1"></div>
            <div className="text-[10px] text-[#8888a0]">Deep</div>
            <div className="text-xs font-semibold">{currentMetrics.deepSleep}h</div>
          </div>
          <div>
            <div className="w-2 h-2 rounded-full bg-[#4a148c] mx-auto mb-1"></div>
            <div className="text-[10px] text-[#8888a0]">REM</div>
            <div className="text-xs font-semibold">{currentMetrics.remSleep}h</div>
          </div>
          <div>
            <div className="w-2 h-2 rounded-full bg-[#311b92] mx-auto mb-1"></div>
            <div className="text-[10px] text-[#8888a0]">Light</div>
            <div className="text-xs font-semibold">{currentMetrics.lightSleep}h</div>
          </div>
          <div>
            <div className="w-2 h-2 rounded-full bg-[#4a4a5a] mx-auto mb-1"></div>
            <div className="text-[10px] text-[#8888a0]">Awake</div>
            <div className="text-xs font-semibold">{currentMetrics.awake}h</div>
          </div>
        </div>
      </div>

      {/* Sleep Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} className="text-[#b388ff]" />
            <span className="text-xs text-[#8888a0]">Sleep HR</span>
          </div>
          <div className="text-2xl font-bold text-[#b388ff]">{currentMetrics.sleepHR}</div>
          <div className="text-[10px] text-[#555570]">bpm</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind size={14} className="text-[#00e5ff]" />
            <span className="text-xs text-[#8888a0]">SpO₂</span>
          </div>
          <div className="text-2xl font-bold text-[#00e5ff]">{currentMetrics.spo2}%</div>
          <div className="text-[10px] text-[#555570]">Blood oxygen</div>
        </div>
      </div>

      {/* Sleep History */}
      {state.dailyMetricsHistory.length > 1 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Sleep History (Last 7 Days)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state.dailyMetricsHistory.slice(0, 7).reverse()}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#555570' }} axisLine={false} tickLine={false} tickFormatter={(val) => val.split('-')[2]} />
                <YAxis tick={{ fontSize: 9, fill: '#555570' }} axisLine={false} tickLine={false} />
                <Bar dataKey="sleepDuration" fill="#b388ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render Health Summary Tab
  const renderHealth = () => (
    <div className="space-y-4">
      {/* Heart Rate */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={16} className="text-[#ff5252]" />
          <h3 className="text-sm font-semibold">Heart Rate</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#ff5252]">{currentMetrics.restingHR}</div>
            <div className="text-[10px] text-[#8888a0] mt-1">RHR (bpm)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#ffab40]">{currentMetrics.avgHR}</div>
            <div className="text-[10px] text-[#8888a0] mt-1">AVG HR (bpm)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#b388ff]">{currentMetrics.sleepHR}</div>
            <div className="text-[10px] text-[#8888a0] mt-1">Sleep HR (bpm)</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#2a2a3a]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8888a0]">HRV</span>
            <span className="text-sm font-semibold text-[#00e676]">{currentMetrics.hrv} ms</span>
          </div>
        </div>
      </div>

      {/* SpO2 */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wind size={16} className="text-[#00e5ff]" />
          <h3 className="text-sm font-semibold">Blood Oxygen (SpO₂)</h3>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-[#00e5ff]">{currentMetrics.spo2}%</div>
          <div className="text-xs text-[#8888a0] mt-2">
            {currentMetrics.spo2 >= 95 ? '✅ Normal range' : currentMetrics.spo2 >= 90 ? '⚠️ Below normal' : '❌ Low oxygen'}
          </div>
        </div>
      </div>

      {/* Health History */}
      {state.dailyMetricsHistory.length > 1 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Heart Rate History (Last 7 Days)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.dailyMetricsHistory.slice(0, 7).reverse()}>
                <defs>
                  <linearGradient id="rhrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5252" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff5252" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#555570' }} axisLine={false} tickLine={false} tickFormatter={(val) => val.split('-')[2]} />
                <YAxis tick={{ fontSize: 9, fill: '#555570' }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="restingHR" stroke="#ff5252" fill="url(#rhrGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#ff5252] rounded"></div>
              <span className="text-[10px] text-[#8888a0]">Resting HR</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="space-y-4">
      {/* Date Picker Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousDate}
            disabled={!hasPreviousDate}
            className="w-8 h-8 rounded-lg bg-[#2a2a3a] flex items-center justify-center disabled:opacity-30 hover:bg-[#3a3a4a] transition-all"
          >
            <ChevronLeft size={16} className="text-[#8888a0]" />
          </button>
          <div className="text-center">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#448aff]" />
              <span className="text-sm font-semibold">{selectedDate}</span>
            </div>
            <div className="text-[10px] text-[#555570] mt-1">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
          </div>
          <button
            onClick={goToNextDate}
            disabled={!hasNextDate}
            className="w-8 h-8 rounded-lg bg-[#2a2a3a] flex items-center justify-center disabled:opacity-30 hover:bg-[#3a3a4a] transition-all"
          >
            <ChevronRight size={16} className="text-[#8888a0]" />
          </button>
        </div>
        
        {/* Date Selector Dropdown */}
        {availableDates.length > 1 && (
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-xs text-[#f0f0f5] focus:outline-none focus:border-[#448aff]/50"
          >
            {availableDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'overview'
              ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/30'
              : 'bg-[#12121a] text-[#8888a0] border border-[#2a2a3a]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSubTab('sleep')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'sleep'
              ? 'bg-[#b388ff]/20 text-[#b388ff] border border-[#b388ff]/30'
              : 'bg-[#12121a] text-[#8888a0] border border-[#2a2a3a]'
          }`}
        >
          Sleep
        </button>
        <button
          onClick={() => setActiveSubTab('health')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'health'
              ? 'bg-[#ff5252]/20 text-[#ff5252] border border-[#ff5252]/30'
              : 'bg-[#12121a] text-[#8888a0] border border-[#2a2a3a]'
          }`}
        >
          Health
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'overview' && renderOverview()}
      {activeSubTab === 'sleep' && renderSleep()}
      {activeSubTab === 'health' && renderHealth()}
    </div>
  );
}
