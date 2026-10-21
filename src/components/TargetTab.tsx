import { Target as TargetIcon, Trophy, Clock } from 'lucide-react';
import { useData } from '../store';

export default function TargetTab() {
  const { state } = useData();
  const targets = state.targets;
  const runSessions = state.runSessions;

  // Calculate dynamic progress from actual data
  const totalDistance = runSessions.reduce((sum, s) => sum + s.distance, 0);
  const avgVo2max = runSessions.length > 0
    ? runSessions.reduce((sum, s) => sum + s.vo2max, 0) / runSessions.length
    : state.profile.vo2max;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-[#00e676] to-[#00e5ff]';
    if (progress >= 50) return 'from-[#448aff] to-[#b388ff]';
    return 'from-[#ffab40] to-[#ff5252]';
  };

  const getProgressBg = (progress: number) => {
    if (progress >= 80) return 'bg-[#00e676]/10';
    if (progress >= 50) return 'bg-[#448aff]/10';
    return 'bg-[#ffab40]/10';
  };

  // Calculate dynamic progress for distance target
  const getDynamicProgress = (target: typeof targets[0]) => {
    if (target.title === 'Weekly Distance') {
      return Math.min(100, Math.round((totalDistance / target.goal) * 100));
    }
    if (target.title === 'VO2Max') {
      return Math.min(100, Math.round((avgVo2max / target.goal) * 100));
    }
    return target.progress;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4 bg-gradient-to-br from-[#448aff]/10 to-[#b388ff]/10">
        <div className="flex items-center gap-3 mb-2">
          <Trophy size={20} className="text-[#ffab40]" />
          <div>
            <h2 className="text-base font-bold">Goals & Targets</h2>
            <p className="text-xs text-[#8888a0]">Progress updated from imported activity data</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="text-[10px] text-[#8888a0]">
            <span className="text-[#448aff] font-semibold">{runSessions.length}</span> activities tracked
          </div>
          <div className="text-[10px] text-[#555570]">•</div>
          <div className="text-[10px] text-[#8888a0]">
            <span className="text-[#00e676] font-semibold">{totalDistance.toFixed(1)}km</span> total distance
          </div>
        </div>
      </div>

      {/* Target Cards */}
      <div className="space-y-3">
        {targets.map((target) => {
          const dynamicProgress = getDynamicProgress(target);
          return (
            <div key={target.id} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">{target.title}</h3>
                  <p className="text-[10px] text-[#555570] mt-0.5">Deadline: {target.deadline}</p>
                </div>
                <div className={`text-lg font-bold ${dynamicProgress >= 80 ? 'text-[#00e676]' : dynamicProgress >= 50 ? 'text-[#448aff]' : 'text-[#ffab40]'}`}>
                  {dynamicProgress}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full bg-gradient-to-r ${getProgressColor(dynamicProgress)} rounded-full transition-all duration-500`}
                  style={{ width: `${dynamicProgress}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-[10px] text-[#555570]">Current</div>
                    <div className="text-sm font-semibold">
                      {target.title === 'Weekly Distance' ? totalDistance.toFixed(1) :
                       target.title === 'VO2Max' ? avgVo2max.toFixed(1) :
                       target.current} <span className="text-[10px] text-[#8888a0]">{target.unit}</span>
                    </div>
                  </div>
                  <div className="text-[#555570]">→</div>
                  <div>
                    <div className="text-[10px] text-[#555570]">Goal</div>
                    <div className="text-sm font-semibold text-[#00e676]">{target.goal} <span className="text-[10px] text-[#8888a0]">{target.unit}</span></div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg ${getProgressBg(dynamicProgress)}`}>
                  <span className="text-[10px] font-medium">
                    {dynamicProgress >= 80 ? '🔥 On Track' : dynamicProgress >= 50 ? '📈 Progressing' : '⚡ Building'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestone Timeline */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-[#b388ff]" />
          <h3 className="text-sm font-semibold">Upcoming Milestones</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00e676]/20 flex items-center justify-center">
              <span className="text-xs">🏅</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Sub-50min 10K</div>
              <div className="text-[10px] text-[#555570]">Target: June 2025</div>
            </div>
            <span className="text-[10px] text-[#00e676]">65%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#448aff]/20 flex items-center justify-center">
              <span className="text-xs">📊</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">VO2Max 55+</div>
              <div className="text-[10px] text-[#555570]">Target: September 2025</div>
            </div>
            <span className="text-[10px] text-[#448aff]">{Math.round((avgVo2max / 56) * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#b388ff]/20 flex items-center justify-center">
              <span className="text-xs">🏃</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Half Marathon Sub-1:45</div>
              <div className="text-[10px] text-[#555570]">Target: October 2025</div>
            </div>
            <span className="text-[10px] text-[#b388ff]">55%</span>
          </div>
        </div>
      </div>

      {/* AI Goal Recommendation */}
      <div className="glass-card p-4 border-l-2 border-l-[#b388ff]">
        <div className="flex items-start gap-3">
          <TargetIcon size={16} className="text-[#b388ff] mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-[#b388ff] mb-1">AI Coach Recommendation</h4>
            <p className="text-xs text-[#8888a0] leading-relaxed">
              Based on your {runSessions.length} imported sessions ({totalDistance.toFixed(1)}km total), your VO2Max of {avgVo2max.toFixed(1)} is on track.
              {runSessions.length >= 3
                ? ' Maintain 3-4 quality sessions per week to reach your goal.'
                : ' Import more activities to get accurate progress tracking.'}
              <br /><br />
              <span className="text-[#555570] italic">Ref: ACSM Guidelines — Progressive overload of 10%/week optimizes VO2Max adaptation.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
