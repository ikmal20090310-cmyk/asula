import { ArrowLeft, Activity, Heart, Footprints, TrendingUp, Clock, MapPin, Flame, Zap, BarChart3, Trash2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useState } from 'react';
import { RunSession } from '../types';
import { useData } from '../store';

interface WorkoutDetailProps {
  session: RunSession;
  onBack: () => void;
}

export default function WorkoutDetail({ session, onBack }: WorkoutDetailProps) {
  const { state, removeRunSession } = useData();
  const profile = state.profile;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // HR Zone distribution data for chart
  const hrZoneData = session.hrZoneDistribution.map((percentage, index) => ({
    name: `Zone ${index + 1}`,
    value: percentage,
    color: profile.hrZones[index]?.color || '#888',
  }));

  // Calculate efficiency metrics
  const efficiency = session.distance > 0 ? (session.calories / session.distance).toFixed(1) : '0';
  const paceMinutes = Math.floor(session.pace);
  const paceSeconds = Math.round((session.pace - paceMinutes) * 60);
  const paceFormatted = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;

  // Get HR zone name for avg HR
  const getZoneForHR = (hr: number) => {
    for (const zone of profile.hrZones) {
      if (hr >= zone.min && hr <= zone.max) {
        return zone;
      }
    }
    return profile.hrZones[0];
  };

  const avgHRZone = getZoneForHR(session.avgHR);

  const handleDelete = () => {
    removeRunSession(session.id);
    onBack();
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-[#2a2a3a] flex items-center justify-center hover:bg-[#3a3a4a] transition-all"
        >
          <ArrowLeft size={16} className="text-[#8888a0]" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold">Workout Session</h2>
          <p className="text-xs text-[#8888a0]">{session.date}</p>
        </div>
        <div className="text-right flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-lg text-[#555570] hover:text-[#ff5252] hover:bg-[#ff5252]/10 transition-all"
            title="Delete workout"
          >
            <Trash2 size={16} />
          </button>
          <div>
            <div className="text-[10px] text-[#555570]">Training Load</div>
            <div className="text-lg font-bold text-[#ffab40]">{session.trainingLoad}</div>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-[#448aff]" />
            <span className="text-[10px] text-[#8888a0]">Distance</span>
          </div>
          <div className="text-2xl font-bold text-[#448aff]">{session.distance}</div>
          <div className="text-[10px] text-[#555570]">kilometers</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#00e676]" />
            <span className="text-[10px] text-[#8888a0]">Duration</span>
          </div>
          <div className="text-2xl font-bold text-[#00e676]">{session.duration}</div>
          <div className="text-[10px] text-[#555570]">minutes</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-[#ffab40]" />
            <span className="text-[10px] text-[#8888a0]">Pace</span>
          </div>
          <div className="text-2xl font-bold text-[#ffab40]">{paceFormatted}</div>
          <div className="text-[10px] text-[#555570]">min/km</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-[#ff5252]" />
            <span className="text-[10px] text-[#8888a0]">Calories</span>
          </div>
          <div className="text-2xl font-bold text-[#ff5252]">{session.calories}</div>
          <div className="text-[10px] text-[#555570]">kcal burned</div>
        </div>
      </div>

      {/* Heart Rate Analysis */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={16} className="text-[#ff5252]" />
          <h3 className="text-sm font-semibold">Heart Rate Analysis</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-[#ff5252]">{session.avgHR}</div>
            <div className="text-[10px] text-[#8888a0]">Avg HR</div>
            <div className="text-[9px] mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${avgHRZone.color}20`, color: avgHRZone.color }}>
              {avgHRZone.name}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#ff80ab]">{session.maxHR}</div>
            <div className="text-[10px] text-[#8888a0]">Max HR</div>
            <div className="text-[9px] text-[#555570] mt-1">{Math.round((session.maxHR / profile.maxHR) * 100)}% MHR</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#b388ff]">{session.vo2max}</div>
            <div className="text-[10px] text-[#8888a0]">VO2Max</div>
            <div className="text-[9px] text-[#555570] mt-1">ml/kg/min</div>
          </div>
        </div>

        {/* HR Zone Distribution */}
        <div className="mt-4 pt-4 border-t border-[#2a2a3a]/50">
          <h4 className="text-xs font-semibold mb-3">HR Zone Distribution</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hrZoneData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {hrZoneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a25', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {hrZoneData.map((zone, idx) => (
              <div key={idx} className="text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: zone.color }}></div>
                <div className="text-[9px] text-[#8888a0]">{zone.name}</div>
                <div className="text-[10px] font-semibold">{zone.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heart Rate Recovery */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-[#00e5ff]" />
          <h3 className="text-sm font-semibold">Heart Rate Recovery (2 min)</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-[#12121a]">
            <div className="text-lg font-bold text-[#ff5252]">{session.startHR}</div>
            <div className="text-[10px] text-[#8888a0]">Start HR</div>
            <div className="text-[9px] text-[#555570]">at stop</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#12121a]">
            <div className="text-lg font-bold text-[#00e5ff]">{session.endHR}</div>
            <div className="text-[10px] text-[#8888a0]">End HR</div>
            <div className="text-[9px] text-[#555570]">after 2min</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30">
            <div className="text-lg font-bold text-[#00e676]">{session.recoveryRate}</div>
            <div className="text-[10px] text-[#8888a0]">Recovery</div>
            <div className="text-[9px] text-[#555570]">bpm drop</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#2a2a3a]/50">
          <p className="text-[10px] text-[#8888a0]">
            {session.recoveryRate >= 16 ? '✅ Excellent recovery — indicates good cardiovascular fitness' :
             session.recoveryRate >= 12 ? '👍 Good recovery — healthy autonomic function' :
             '⚠️ Below optimal — consider more recovery-focused training'}
          </p>
        </div>
      </div>

      {/* Biomechanics */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Footprints size={16} className="text-[#b388ff]" />
          <h3 className="text-sm font-semibold">Running Biomechanics</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="text-[10px] text-[#555570] mb-1">Cadence</div>
            <div className="text-lg font-bold text-[#b388ff]">{session.cadence}</div>
            <div className="text-[9px] text-[#8888a0]">steps/min</div>
            <div className="text-[9px] mt-1" style={{ color: session.cadence >= 180 ? '#00e676' : '#ffab40' }}>
              {session.cadence >= 180 ? '✅ Optimal' : '⚠️ Below 180'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="text-[10px] text-[#555570] mb-1">Stride Length</div>
            <div className="text-lg font-bold text-[#448aff]">{session.strideLength}</div>
            <div className="text-[9px] text-[#8888a0]">meters</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="text-[10px] text-[#555570] mb-1">Ground Contact Time</div>
            <div className="text-lg font-bold text-[#00e5ff]">{session.gct}</div>
            <div className="text-[9px] text-[#8888a0]">milliseconds</div>
            <div className="text-[9px] mt-1" style={{ color: session.gct < 230 ? '#00e676' : session.gct < 250 ? '#ffab40' : '#ff5252' }}>
              {session.gct < 220 ? '✅ Elite' : session.gct < 240 ? '👍 Good' : '⚠️ Needs work'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#12121a]">
            <div className="text-[10px] text-[#555570] mb-1">Vertical Oscillation</div>
            <div className="text-lg font-bold text-[#ffab40]">{session.verticalOscillation}</div>
            <div className="text-[9px] text-[#8888a0]">cm</div>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-[#12121a]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#555570]">Vertical Ratio</div>
              <div className="text-sm font-bold text-[#b388ff]">{session.verticalRatio}%</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#555570]">Running Economy</div>
              <div className="text-sm font-bold" style={{ color: session.verticalRatio < 7 ? '#00e676' : '#ffab40' }}>
                {session.verticalRatio < 7 ? 'Excellent' : 'Good'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elevation & Steps */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[#00e676]" />
            <span className="text-[10px] text-[#8888a0]">Elevation</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#00e676]">+{session.elevationGain}</span>
            <span className="text-sm text-[#ff5252]">-{session.elevationLoss}</span>
          </div>
          <div className="text-[10px] text-[#555570]">gain / loss (m)</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Footprints size={14} className="text-[#448aff]" />
            <span className="text-[10px] text-[#8888a0]">Steps</span>
          </div>
          <div className="text-xl font-bold text-[#448aff]">{session.steps.toLocaleString()}</div>
          <div className="text-[10px] text-[#555570]">total steps</div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-[#00e676]" />
          <h3 className="text-sm font-semibold">Efficiency Analysis</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-[#00e676]">{efficiency}</div>
            <div className="text-[10px] text-[#8888a0]">kcal/km</div>
            <div className="text-[9px] text-[#555570]">Energy cost</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#448aff]">{(session.steps / session.distance).toFixed(0)}</div>
            <div className="text-[10px] text-[#8888a0]">steps/km</div>
            <div className="text-[9px] text-[#555570]">Step efficiency</div>
          </div>
        </div>
      </div>

      {/* AI Insight for this workout */}
      <div className="glass-card p-4 border-l-2 border-l-[#00e676]">
        <div className="flex items-start gap-3">
          <Activity size={16} className="text-[#00e676] mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-[#00e676] mb-1">AI Analysis</h4>
            <p className="text-xs text-[#8888a0] leading-relaxed">
              This {session.distance}km session at {paceFormatted}/km pace shows {session.avgHR >= 150 ? 'high-intensity effort' : 'moderate effort'}.
              {session.gct < 230 ? ' Your GCT of ' + session.gct + 'ms indicates good running economy.' : ' GCT could be improved with plyometric work.'}
              {session.recoveryRate >= 14 ? ' HRR of ' + session.recoveryRate + 'bpm shows excellent cardiovascular fitness.' : ''}
              <br /><br />
              <span className="text-[#555570] italic">
                Ref: {session.gct < 230 ? 'Nummela et al. (2007)' : 'Daniels (2013)'} — 
                {session.gct < 230 ? ' GCT <230ms correlates with trained runner efficiency.' : ' Proper form reduces injury risk by 30%.'}
              </span>
            </p>
          </div>
        </div>
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
              Are you sure you want to delete this workout from {session.date}? All metrics, analysis, and AI insights will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5252]/20 text-[#ff5252] text-xs font-semibold border border-[#ff5252]/30 hover:bg-[#ff5252]/30 transition-all"
              >
                Delete Workout
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
