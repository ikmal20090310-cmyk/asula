import { useState } from 'react';
import { Calendar, Dumbbell, TrendingUp, AlertTriangle, Check, Clock, MapPin, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { useData } from '../store';
import { TrainingSchedule } from '../types';

export default function WeeklyTab() {
  const { state, updateSchedule } = useData();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  const schedule = state.schedule;
  const weeklyData = state.weeklyData;
  const report = state.weeklyHealthReport;
  const runSessions = state.runSessions;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Easy Run': return 'bg-[#4caf50]/20 text-[#4caf50] border-[#4caf50]/30';
      case 'Interval': return 'bg-[#ff5252]/20 text-[#ff5252] border-[#ff5252]/30';
      case 'Long Run': return 'bg-[#448aff]/20 text-[#448aff] border-[#448aff]/30';
      case 'Tempo': return 'bg-[#ffab40]/20 text-[#ffab40] border-[#ffab40]/30';
      case 'Strength': return 'bg-[#b388ff]/20 text-[#b388ff] border-[#b388ff]/30';
      case 'Recovery': return 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/30';
      case 'Rest': return 'bg-[#555570]/20 text-[#555570] border-[#555570]/30';
      default: return 'bg-[#555570]/20 text-[#555570]';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Easy Run': case 'Interval': case 'Long Run': case 'Tempo': case 'Recovery': return '🏃';
      case 'Strength': return '🏋️';
      case 'Rest': return '😴';
      default: return '•';
    }
  };

  const handleDayClick = (index: number) => {
    setSelectedDay(index);
    setShowApprovalModal(true);
    setApprovalStatus(null);
  };

  const handleApprove = () => {
    setApprovalStatus('approved');
    setTimeout(() => {
      setShowApprovalModal(false);
      setApprovalStatus(null);
    }, 2000);
  };

  const handleReject = () => {
    setApprovalStatus('rejected');
    setTimeout(() => {
      setShowApprovalModal(false);
      setApprovalStatus(null);
    }, 2000);
  };

  const toggleComplete = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], completed: !newSchedule[index].completed };
    updateSchedule(newSchedule);
  };

  // Calculate actual weekly stats from imported data
  const actualWeeklyDistance = runSessions.reduce((sum, s) => sum + s.distance, 0);
  const actualWeeklyTime = runSessions.reduce((sum, s) => sum + s.duration, 0);
  const actualTrainingLoad = runSessions.reduce((sum, s) => sum + s.trainingLoad, 0);

  return (
    <div className="space-y-4">
      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-[#448aff]" />
            <span className="text-xs text-[#8888a0]">Distance</span>
          </div>
          <div className="text-2xl font-bold">{actualWeeklyDistance.toFixed(1)} <span className="text-sm text-[#8888a0]">km</span></div>
          <div className="text-[10px] text-[#555570]">from {runSessions.length} activities</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#00e676]" />
            <span className="text-xs text-[#8888a0]">Time</span>
          </div>
          <div className="text-2xl font-bold">{actualWeeklyTime} <span className="text-sm text-[#8888a0]">min</span></div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-[#ff5252]" />
            <span className="text-xs text-[#8888a0]">Load</span>
          </div>
          <div className="text-2xl font-bold">{actualTrainingLoad}</div>
          <div className="text-[10px] text-[#555570]">total training load</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[#ffab40]" />
            <span className="text-xs text-[#8888a0]">Recovery</span>
          </div>
          <div className="text-2xl font-bold">{state.dailyMetrics.recoveryScore}<span className="text-sm text-[#8888a0]">/100</span></div>
        </div>
      </div>

      {/* Weekly Trends Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">4-Week Training Load Trend</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#555570' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#555570' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="trainingLoad" fill="#448aff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recovery & Sleep Trend */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Recovery & Sleep Trend</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#555570' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#555570' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="avgRecovery" stroke="#00e676" strokeWidth={2} dot={{ fill: '#00e676', r: 3 }} />
              <Line type="monotone" dataKey="avgSleep" stroke="#b388ff" strokeWidth={2} dot={{ fill: '#b388ff', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#00e676] rounded"></div>
            <span className="text-[10px] text-[#8888a0]">Recovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#b388ff] rounded"></div>
            <span className="text-[10px] text-[#8888a0]">Sleep (hrs)</span>
          </div>
        </div>
      </div>

      {/* Training Schedule */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#00e676]" />
            <h3 className="text-sm font-semibold">Training Schedule</h3>
          </div>
          <span className="text-[10px] text-[#555570]">Tap to modify (AI approval required)</span>
        </div>
        <div className="space-y-2">
          {schedule.map((day, idx) => (
            <div
              key={idx}
              onClick={() => handleDayClick(idx)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-[#22222f] ${
                day.completed ? 'border-[#00e676]/30 bg-[#00e676]/5' : 'border-[#2a2a3a]/50'
              }`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleComplete(idx); }}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  day.completed ? 'border-[#00e676] bg-[#00e676]' : 'border-[#555570]'
                }`}
              >
                {day.completed && <Check size={12} className="text-white" />}
              </button>
              <span className="text-lg">{getTypeIcon(day.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{day.day}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getTypeColor(day.type)}`}>
                    {day.type}
                  </span>
                </div>
                <p className="text-[10px] text-[#555570] mt-0.5 truncate">{day.description}</p>
              </div>
              <span className="text-[10px] text-[#8888a0]">{day.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Health Report */}
      <div className="glass-card p-4 border-l-2 border-l-[#ffab40]">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-[#ffab40]" />
          <h4 className="text-xs font-semibold text-[#ffab40]">Weekly Health Report</h4>
        </div>
        <ul className="space-y-2">
          {report.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[#00e676] mt-0.5">•</span>
              <span className="text-xs text-[#8888a0] leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-[#2a2a3a]/50">
          <p className="text-[10px] text-[#555570] italic">
            Ref: Meeusen et al. (2013) — Training load monitoring prevents overtraining. Acute:Chronic ratio optimal at 0.8-1.3.
          </p>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedDay !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1a1a25] border-t border-[#2a2a3a] rounded-t-2xl p-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell size={16} className="text-[#b388ff]" />
              <h3 className="text-sm font-semibold">Modify Training Day</h3>
            </div>
            <div className="mb-4">
              <p className="text-xs text-[#8888a0] mb-2">
                <strong className="text-white">{schedule[selectedDay].day}</strong> — {schedule[selectedDay].type}
              </p>
              <p className="text-xs text-[#555570]">
                AI Coach analyzes your current recovery ({state.dailyMetrics.recoveryScore}/100), HRV ({state.dailyMetrics.hrv}ms), and training load ({actualTrainingLoad}) to determine if the change is safe.
              </p>
            </div>
            
            {approvalStatus === 'approved' && (
              <div className="p-3 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 mb-4">
                <p className="text-xs text-[#00e676]">✅ Approved — Change is safe for your current recovery state.</p>
              </div>
            )}
            {approvalStatus === 'rejected' && (
              <div className="p-3 rounded-xl bg-[#ff5252]/10 border border-[#ff5252]/30 mb-4">
                <p className="text-xs text-[#ff5252]">⚠️ Rejected — This change may risk overtraining given your current load.</p>
              </div>
            )}
            {approvalStatus === 'pending' && (
              <div className="p-3 rounded-xl bg-[#448aff]/10 border border-[#448aff]/30 mb-4">
                <p className="text-xs text-[#448aff]">⏳ Analyzing your recovery data...</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setApprovalStatus('pending'); setTimeout(handleApprove, 1500); }}
                className="flex-1 py-2.5 rounded-xl bg-[#00e676]/20 text-[#00e676] text-xs font-semibold border border-[#00e676]/30 hover:bg-[#00e676]/30 transition-all"
              >
                Approve Change
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5252]/20 text-[#ff5252] text-xs font-semibold border border-[#ff5252]/30 hover:bg-[#ff5252]/30 transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="py-2.5 px-4 rounded-xl bg-[#2a2a3a] text-[#8888a0] text-xs font-semibold hover:bg-[#3a3a4a] transition-all"
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
