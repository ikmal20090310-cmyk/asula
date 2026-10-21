import { useState } from 'react';
import { User, Heart, Activity, Edit2, Save, X } from 'lucide-react';
import { useData } from '../store';
import { UserProfile } from '../types';

export default function ProfileTab() {
  const { state, updateProfile } = useData();
  const profile = state.profile;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile>(profile);

  const handleSave = () => {
    // Recalculate HR zones based on new maxHR
    const updatedProfile = {
      ...editData,
      hrZones: calculateHRZones(editData.maxHR),
    };
    updateProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const calculateHRZones = (maxHR: number) => {
    return [
      { zone: 1, name: 'Ringan', min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60), color: '#4caf50' },
      { zone: 2, name: 'Intensif', min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), color: '#8bc34a' },
      { zone: 3, name: 'Aerobik', min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), color: '#ffeb3b' },
      { zone: 4, name: 'Tempo', min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), color: '#ff9800' },
      { zone: 5, name: 'VO2Max', min: Math.round(maxHR * 0.90), max: maxHR, color: '#f44336' },
    ];
  };

  const displayProfile = isEditing ? editData : profile;
  const displayZones = calculateHRZones(displayProfile.maxHR);

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00e676] to-[#448aff] flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">{displayProfile.name}</h2>
            <p className="text-xs text-[#8888a0]">{displayProfile.gender} • {displayProfile.age} years old</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isEditing ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#2a2a3a] text-[#8888a0] hover:text-white'
            }`}
          >
            {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
          </button>
        </div>
        {isEditing && (
          <div className="mt-3">
            <label className="text-[10px] text-[#555570]">Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#448aff]/50 mt-1"
            />
          </div>
        )}
      </div>

      {/* Biometric Data */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Biometric Data</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
            <div className="text-[10px] text-[#555570] mb-1">Height</div>
            {isEditing ? (
              <input
                type="number"
                value={editData.height}
                onChange={(e) => setEditData({ ...editData, height: Number(e.target.value) })}
                className="w-full bg-transparent text-lg font-bold text-[#f0f0f5] focus:outline-none"
              />
            ) : (
              <div className="text-lg font-bold">{displayProfile.height} <span className="text-xs text-[#8888a0]">cm</span></div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
            <div className="text-[10px] text-[#555570] mb-1">Weight</div>
            {isEditing ? (
              <input
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData({ ...editData, weight: Number(e.target.value) })}
                className="w-full bg-transparent text-lg font-bold text-[#f0f0f5] focus:outline-none"
              />
            ) : (
              <div className="text-lg font-bold">{displayProfile.weight} <span className="text-xs text-[#8888a0]">kg</span></div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
            <div className="text-[10px] text-[#555570] mb-1">Age</div>
            {isEditing ? (
              <input
                type="number"
                value={editData.age}
                onChange={(e) => setEditData({ ...editData, age: Number(e.target.value) })}
                className="w-full bg-transparent text-lg font-bold text-[#f0f0f5] focus:outline-none"
              />
            ) : (
              <div className="text-lg font-bold">{displayProfile.age} <span className="text-xs text-[#8888a0]">years</span></div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
            <div className="text-[10px] text-[#555570] mb-1">Gender</div>
            {isEditing ? (
              <select
                value={editData.gender}
                onChange={(e) => setEditData({ ...editData, gender: e.target.value as 'Male' | 'Female' })}
                className="w-full bg-transparent text-lg font-bold text-[#f0f0f5] focus:outline-none"
              >
                <option value="Male" className="bg-[#12121a]">Male</option>
                <option value="Female" className="bg-[#12121a]">Female</option>
              </select>
            ) : (
              <div className="text-lg font-bold">{displayProfile.gender}</div>
            )}
          </div>
        </div>
        {isEditing && (
          <button
            onClick={handleCancel}
            className="mt-3 w-full py-2 rounded-xl bg-[#ff5252]/10 text-[#ff5252] text-xs font-semibold border border-[#ff5252]/20 flex items-center justify-center gap-1"
          >
            <X size={12} /> Cancel Editing
          </button>
        )}
      </div>

      {/* Heart Rate Data */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={16} className="text-[#ff5252]" />
          <h3 className="text-sm font-semibold">Heart Rate Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
            <div className="text-[10px] text-[#555570] mb-1">Max Heart Rate</div>
            {isEditing ? (
              <input
                type="number"
                value={editData.maxHR}
                onChange={(e) => setEditData({ ...editData, maxHR: Number(e.target.value) })}
                className="w-full bg-transparent text-lg font-bold text-[#ff5252] focus:outline-none"
              />
            ) : (
              <div className="text-lg font-bold text-[#ff5252]">{displayProfile.maxHR} <span className="text-xs text-[#8888a0]">bpm</span></div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
            <div className="text-[10px] text-[#555570] mb-1">Resting Heart Rate</div>
            {isEditing ? (
              <input
                type="number"
                value={editData.restingHR}
                onChange={(e) => setEditData({ ...editData, restingHR: Number(e.target.value) })}
                className="w-full bg-transparent text-lg font-bold text-[#00e676] focus:outline-none"
              />
            ) : (
              <div className="text-lg font-bold text-[#00e676]">{displayProfile.restingHR} <span className="text-xs text-[#8888a0]">bpm</span></div>
            )}
          </div>
        </div>
      </div>

      {/* VO2Max */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-[#448aff]" />
          <h3 className="text-sm font-semibold">VO2Max</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={editData.vo2max}
                onChange={(e) => setEditData({ ...editData, vo2max: Number(e.target.value) })}
                className="w-full bg-transparent text-3xl font-bold text-[#448aff] focus:outline-none"
              />
            ) : (
              <div className="text-3xl font-bold text-[#448aff]">{displayProfile.vo2max}</div>
            )}
            <div className="text-xs text-[#8888a0]">ml/kg/min</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#8888a0]">Rating</div>
            <div className="text-sm font-semibold text-[#00e676]">
              {displayProfile.vo2max >= 55 ? 'Elite' : displayProfile.vo2max >= 48 ? 'Superior' : displayProfile.vo2max >= 40 ? 'Good' : 'Average'}
            </div>
            <div className="text-[10px] text-[#555570]">
              {displayProfile.vo2max >= 55 ? 'Top 5%' : displayProfile.vo2max >= 48 ? 'Top 15%' : displayProfile.vo2max >= 40 ? 'Top 40%' : 'Below average'}
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#ff5252] via-[#ffab40] to-[#00e676] rounded-full" style={{ width: `${(displayProfile.vo2max / 70) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#555570]">Poor</span>
          <span className="text-[9px] text-[#555570]">Average</span>
          <span className="text-[9px] text-[#555570]">Elite</span>
        </div>
      </div>

      {/* HR Zones */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Heart Rate Zones</h3>
        <p className="text-[10px] text-[#555570] mb-3">Auto-calculated from Max HR ({displayProfile.maxHR} bpm) • Updates when you edit Max HR</p>
        <div className="space-y-2">
          {displayZones.map((zone) => (
            <div key={zone.zone} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${zone.color}20`, color: zone.color }}>
                {zone.zone}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium">{zone.name}</div>
                <div className="text-[10px] text-[#555570]">{zone.min} – {zone.max} bpm</div>
              </div>
              <div className="h-1.5 w-20 bg-[#2a2a3a] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${((zone.max - 96) / (displayProfile.maxHR - 96)) * 100}%`, backgroundColor: zone.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BMI */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-2">Body Mass Index</h3>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-[#00e676]">
            {(displayProfile.weight / ((displayProfile.height / 100) ** 2)).toFixed(1)}
          </div>
          <div>
            <div className="text-xs font-medium text-[#00e676]">
              {(displayProfile.weight / ((displayProfile.height / 100) ** 2)) < 18.5 ? 'Underweight' :
               (displayProfile.weight / ((displayProfile.height / 100) ** 2)) < 25 ? 'Normal Weight' :
               (displayProfile.weight / ((displayProfile.height / 100) ** 2)) < 30 ? 'Overweight' : 'Obese'}
            </div>
            <div className="text-[10px] text-[#555570]">Optimal range: 18.5 – 24.9</div>
          </div>
        </div>
      </div>

      {/* Data Persistence Notice */}
      <div className="glass-card p-3 border-l-2 border-l-[#00e676]">
        <p className="text-[10px] text-[#8888a0]">
          💾 All profile changes are saved automatically to persistent storage. Data survives browser refresh and close.
        </p>
      </div>
    </div>
  );
}
