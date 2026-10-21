import { useState, useRef } from 'react';
import { Upload, FileArchive, FileText, Database, CheckCircle, AlertCircle, HardDrive, Trash2, Table, Download, FileSpreadsheet } from 'lucide-react';
import { useData, ImportedFile, CSVRow } from '../store';
import { parseCSV, generateActivityCSV, generateHealthCSV, csvRowToRunSession, fitnessJSONToCSVRow, dailyHealthJSONToCSVRow, parseDailyHealthData, csvRowToDailyMetrics } from '../csvParser';
import CSVViewer from './CSVViewer';

export default function ImportTab() {
  const { state, addImportedFile, removeImportedFile, addRunSession, resetWorkoutData, addDailyMetrics, resetDailyData } = useData();
  const [dragActive, setDragActive] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [previewFile, setPreviewFile] = useState<ImportedFile | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDailyResetConfirm, setShowDailyResetConfirm] = useState(false);
  const [importType, setImportType] = useState<'workout' | 'daily'>('workout');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dailyFileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (ext === 'csv' || ext === 'tsv' || ext === 'json' || ext === 'txt') {
        processCSVContent(content, file.name, file.size);
      } else if (ext === 'fit' || ext === 'gpx' || ext === 'tcx') {
        // For binary formats, create a placeholder with metadata
        const newFile: ImportedFile = {
          id: `file-${Date.now()}`,
          name: file.name,
          type: ext.toUpperCase(),
          size: formatFileSize(file.size),
          date: new Date().toISOString().split('T')[0],
          status: 'processed',
          records: 1,
          csvHeaders: ['filename', 'type', 'size', 'imported_date'],
          csvData: [{ filename: file.name, type: ext.toUpperCase(), size: formatFileSize(file.size), imported_date: new Date().toISOString() }],
        };
        addImportedFile(newFile);
        setImportStatus(`✅ ${file.name} imported successfully`);
        setTimeout(() => setImportStatus(''), 3000);
      } else if (ext === 'zip') {
        const newFile: ImportedFile = {
          id: `file-${Date.now()}`,
          name: file.name,
          type: 'ZIP',
          size: formatFileSize(file.size),
          date: new Date().toISOString().split('T')[0],
          status: 'processed',
          records: 1,
          csvHeaders: ['archive_name', 'type', 'size', 'imported_date'],
          csvData: [{ archive_name: file.name, type: 'ZIP Archive', size: formatFileSize(file.size), imported_date: new Date().toISOString() }],
        };
        addImportedFile(newFile);
        setImportStatus(`✅ Archive ${file.name} imported`);
        setTimeout(() => setImportStatus(''), 3000);
      } else {
        // Try to parse as CSV/text
        processCSVContent(content, file.name, file.size);
      }
    };
    reader.readAsText(file);
  };

  const processCSVContent = (content: string, filename: string, size: number) => {
    let headers: string[] = [];
    let rows: CSVRow[] = [];
    let isFitnessData = false;
    
    // ALWAYS try CSV parsing first (works for both regular CSV and CSV with embedded JSON)
    const csvData = parseCSV(content);
    
    // Check if any column contains embedded JSON (MiFitness format)
    if (csvData.rows.length > 0) {
      const firstRow = csvData.rows[0];
      const hasEmbeddedJSON = Object.values(firstRow).some(val => 
        typeof val === 'string' && (val.startsWith('{"') || val.startsWith('{""'))
      );
      
      if (hasEmbeddedJSON) {
        // This is MiFitness format - parse embedded JSON from each row
        isFitnessData = true;
        rows = [];
        
        csvData.rows.forEach((csvRow) => {
          // Find the column that contains JSON
          const jsonColumn = Object.entries(csvRow).find(([key, val]) => 
            typeof val === 'string' && (val.startsWith('{"') || val.startsWith('{""'))
          );
          
          if (jsonColumn) {
            let jsonStr = jsonColumn[1];
            
            // Unescape CSV double quotes if present
            if (jsonStr.startsWith('"{""')) {
              jsonStr = jsonStr.slice(1, -1).replace(/""/g, '"');
            }
            
            try {
              const jsonData = JSON.parse(jsonStr);
              // Convert JSON to CSV row format
              const convertedRow = fitnessJSONToCSVRow(jsonData);
              rows.push(convertedRow);
            } catch (e) {
              console.error('Failed to parse embedded JSON:', e);
            }
          }
        });
        
        headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      } else {
        // Regular CSV
        headers = csvData.headers;
        rows = csvData.rows;
      }
    } else {
      headers = csvData.headers;
      rows = csvData.rows;
    }
    
    if (headers.length === 0 || rows.length === 0) {
      setImportStatus('❌ Could not parse file - no valid data found');
      setTimeout(() => setImportStatus(''), 3000);
      return;
    }

    const newFile: ImportedFile = {
      id: `file-${Date.now()}`,
      name: filename,
      type: isFitnessData ? 'MiFitness' : 'CSV',
      size: formatFileSize(size),
      date: new Date().toISOString().split('T')[0],
      status: 'processed',
      records: rows.length,
      csvHeaders: headers,
      csvData: rows,
    };

    addImportedFile(newFile);

    // Auto-import ALL rows as workout sessions
    let importedCount = 0;
    rows.forEach((row, idx) => {
      const session = csvRowToRunSession(row, idx);
      
      // Import if has ANY workout-related data
      if (session.distance > 0 || session.duration > 0 || session.calories > 0 || session.avgHR > 0 || session.trainingLoad > 0) {
        addRunSession(session);
        importedCount++;
      }
    });

    if (importedCount > 0) {
      const dataType = isFitnessData ? 'MiFitness' : 'CSV';
      setImportStatus(`✅ ${importedCount} workout(s) imported from ${filename} (${dataType}) — Now visible in Workouts tab`);
    } else {
      setImportStatus(`✅ ${rows.length} records saved from ${filename} — No workout data detected`);
    }
    setTimeout(() => setImportStatus(''), 5000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = () => {
    if (pasteData.trim()) {
      processCSVContent(pasteData, `pasted_data_${Date.now()}.csv`, pasteData.length);
      setPasteData('');
      setShowPaste(false);
    }
  };

  // Daily Health Import Functions
  const processDailyHealthContent = (content: string, filename: string, size: number) => {
    let headers: string[] = [];
    let rows: CSVRow[] = [];
    
    // ALWAYS try CSV parsing first (works for both regular CSV and CSV with embedded JSON)
    const csvData = parseCSV(content);
    
    // Check if any column contains embedded JSON (MiFitness format)
    if (csvData.rows.length > 0) {
      const firstRow = csvData.rows[0];
      const hasEmbeddedJSON = Object.values(firstRow).some(val => 
        typeof val === 'string' && (val.startsWith('{"') || val.startsWith('{""'))
      );
      
      if (hasEmbeddedJSON) {
        // This is MiFitness format - parse embedded JSON from each row
        csvData.rows.forEach((csvRow) => {
          // Find the column that contains JSON
          const jsonColumn = Object.entries(csvRow).find(([key, val]) => 
            typeof val === 'string' && (val.startsWith('{"') || val.startsWith('{""'))
          );
          
          if (jsonColumn) {
            let jsonStr = jsonColumn[1];
            
            // Unescape CSV double quotes if present
            if (jsonStr.startsWith('"{""')) {
              jsonStr = jsonStr.slice(1, -1).replace(/""/g, '"');
            }
            
            try {
              const jsonData = JSON.parse(jsonStr);
              // Convert JSON to daily health CSV row format
              const convertedRow = dailyHealthJSONToCSVRow(jsonData);
              rows.push(convertedRow);
            } catch (e) {
              console.error('Failed to parse embedded JSON in daily health data:', e);
            }
          }
        });
        
        headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      } else {
        // Regular CSV
        headers = csvData.headers;
        rows = csvData.rows;
      }
    } else {
      headers = csvData.headers;
      rows = csvData.rows;
    }
    
    if (headers.length === 0 || rows.length === 0) {
      setImportStatus('❌ Could not parse daily health data - invalid format');
      setTimeout(() => setImportStatus(''), 3000);
      return;
    }

    const newFile: ImportedFile = {
      id: `daily-${Date.now()}`,
      name: filename,
      type: 'Daily Health',
      size: formatFileSize(size),
      date: new Date().toISOString().split('T')[0],
      status: 'processed',
      records: rows.length,
      csvHeaders: headers,
      csvData: rows,
    };

    addImportedFile(newFile);

    // Convert all rows to DailyMetrics and add to history
    let importedCount = 0;
    rows.forEach((row) => {
      const metrics = csvRowToDailyMetrics(row);
      
      // Import if has ANY health-related data
      if (metrics.vitalityScore > 0 || metrics.recoveryScore > 0 || metrics.sleepDuration > 0 || 
          metrics.avgHR > 0 || metrics.restingHR > 0 || metrics.stressLevel > 0 || metrics.hrv > 0) {
        addDailyMetrics(metrics);
        importedCount++;
      }
    });

    if (importedCount > 0) {
      setImportStatus(`✅ ${importedCount} day(s) of health data imported from ${filename} — Now visible in Daily tab`);
    } else {
      setImportStatus(`✅ ${rows.length} records saved from ${filename} — No health data detected`);
    }
    setTimeout(() => setImportStatus(''), 5000);
  };

  const handleDailyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        console.log('Processing daily health file:', file.name, 'Size:', file.size);
        console.log('Content preview:', content.substring(0, 500));
        processDailyHealthContent(content, file.name, file.size);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setImportStatus('❌ Error reading file');
        setTimeout(() => setImportStatus(''), 3000);
      };
      reader.readAsText(file);
    });
    if (dailyFileInputRef.current) dailyFileInputRef.current.value = '';
  };

  const downloadTemplate = (type: 'activity' | 'health') => {
    const content = type === 'activity' ? generateActivityCSV() : generateHealthCSV();
    const filename = type === 'activity' ? 'running_activity_template.csv' : 'health_metrics_template.csv';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle size={14} className="text-[#00e676]" />;
      case 'pending': return <AlertCircle size={14} className="text-[#ffab40]" />;
      case 'error': return <AlertCircle size={14} className="text-[#ff5252]" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ZIP': return <FileArchive size={14} className="text-[#ffab40]" />;
      case 'CSV': return <FileSpreadsheet size={14} className="text-[#00e676]" />;
      default: return <FileText size={14} className="text-[#448aff]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Database size={16} className="text-[#448aff]" />
          <h2 className="text-sm font-semibold">Data Import & Persistent Storage</h2>
        </div>
        <p className="text-xs text-[#8888a0]">
          Import activity files for analysis. All data is saved permanently — survives refresh, close, and restart.
        </p>
        <div className="flex items-center gap-1 mt-2">
          <div className="w-2 h-2 rounded-full bg-[#00e676]"></div>
          <span className="text-[10px] text-[#00e676]">localStorage persistence active</span>
        </div>
      </div>

      {/* Status Message */}
      {importStatus && (
        <div className={`glass-card p-3 border-l-2 ${
          importStatus.startsWith('✅') ? 'border-l-[#00e676] bg-[#00e676]/5' :
          importStatus.startsWith('❌') ? 'border-l-[#ff5252] bg-[#ff5252]/5' :
          'border-l-[#448aff] bg-[#448aff]/5'
        }`}>
          <p className="text-xs">{importStatus}</p>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`glass-card p-6 border-2 border-dashed transition-all cursor-pointer ${
          dragActive ? 'border-[#00e676] bg-[#00e676]/5' : 'border-[#2a2a3a] hover:border-[#448aff]/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.tsv,.json,.txt,.fit,.gpx,.tcx,.zip,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-center">
          <Upload size={32} className="mx-auto text-[#448aff] mb-3" />
          <h3 className="text-sm font-semibold mb-1">Drop files here or click to upload</h3>
          <p className="text-xs text-[#555570]">
            Supports: .fit, .gpx, .tcx, .zip, .csv, .tsv, .json, .txt
          </p>
          <p className="text-[10px] text-[#448aff] mt-1">
            ✓ Auto-detects fitness device JSON (Huawei Health, Garmin, etc.)
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {['FIT', 'GPX', 'TCX', 'ZIP', 'CSV', 'TSV', 'JSON'].map((fmt) => (
              <span key={fmt} className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2a3a] text-[#8888a0]">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CSV Templates */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
          <Download size={12} className="text-[#00e676]" />
          CSV Templates (Compatible with VS Code CSV Viewer)
        </h3>
        <p className="text-[10px] text-[#555570] mb-3">
          Download standard CSV templates. Fill them in any spreadsheet or text editor, then re-import.
          Format: standard comma-delimited with header row — opens perfectly in VS Code CSV Viewer.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => downloadTemplate('activity')}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30 hover:bg-[#00e676]/20 transition-all"
          >
            📥 Running Activity CSV
          </button>
          <button
            onClick={() => downloadTemplate('health')}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-[#448aff]/10 text-[#448aff] border border-[#448aff]/30 hover:bg-[#448aff]/20 transition-all"
          >
            📥 Health Metrics CSV
          </button>
        </div>
      </div>

      {/* Daily Health Import Section */}
      <div className="glass-card p-4 border-l-2 border-l-[#b388ff]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b388ff] to-[#448aff] flex items-center justify-center">
              <span className="text-sm">💤</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Import Daily Health Data</h3>
              <p className="text-[10px] text-[#8888a0]">Sleep, Stress, Heart Rate, Vitality & Recovery</p>
            </div>
          </div>
          {state.dailyMetricsHistory.length > 1 && (
            <button
              onClick={() => setShowDailyResetConfirm(true)}
              className="text-[10px] px-2 py-1 rounded-lg bg-[#ff5252]/10 text-[#ff5252] border border-[#ff5252]/30 hover:bg-[#ff5252]/20 transition-all"
            >
              Reset Daily Data
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div
            className="p-4 border-2 border-dashed border-[#b388ff]/30 rounded-xl hover:border-[#b388ff]/50 transition-all cursor-pointer"
            onClick={() => dailyFileInputRef.current?.click()}
          >
            <input
              ref={dailyFileInputRef}
              type="file"
              multiple
              accept=".csv,.json,.txt"
              onChange={handleDailyFileSelect}
              className="hidden"
            />
            <div className="text-center">
              <Upload size={24} className="mx-auto text-[#b388ff] mb-2" />
              <p className="text-xs font-medium text-[#b388ff]">Click to upload daily health data</p>
              <p className="text-[10px] text-[#555570] mt-1">
                Supports: .csv, .json, .txt (MiFitness, Huawei Health, etc.)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-[#12121a] text-center">
              <div className="text-lg font-bold text-[#b388ff]">{state.dailyMetricsHistory.length}</div>
              <div className="text-[10px] text-[#555570]">Days Tracked</div>
            </div>
            <div className="p-2 rounded-lg bg-[#12121a] text-center">
              <div className="text-lg font-bold text-[#448aff]">
                {state.dailyMetricsHistory.length > 0 
                  ? Math.round(state.dailyMetricsHistory.reduce((sum, m) => sum + m.vitalityScore, 0) / state.dailyMetricsHistory.length)
                  : 0}
              </div>
              <div className="text-[10px] text-[#555570]">Avg Vitality</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#b388ff]/5 border border-[#b388ff]/20">
            <p className="text-[10px] text-[#8888a0] leading-relaxed">
              💡 <strong className="text-[#b388ff]">Data Fields:</strong> Sleep duration & phases, Stress level, Heart rate (avg/resting/sleep), 
              HRV, SpO₂, Vitality score, Recovery score. All data appears in the <strong className="text-[#00e676]">Daily tab</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Paste Data Option */}
      <div className="glass-card p-4">
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="flex items-center gap-2 text-xs text-[#448aff] hover:text-[#00e5ff] transition-colors"
        >
          <FileText size={14} />
          <span>Paste raw CSV data instead</span>
        </button>
        {showPaste && (
          <div className="mt-3 space-y-2">
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder={`Paste CSV data here (comma-separated with header row)...\n\nExample:\ndate,distance_km,avg_hr,cadence_spm\n2025-01-15,8.2,152,186\n2025-01-13,5.5,142,182`}
              className="w-full h-36 bg-[#12121a] border border-[#2a2a3a] rounded-xl p-3 text-xs text-[#f0f0f5] placeholder-[#555570] resize-none focus:outline-none focus:border-[#448aff]/50 font-mono"
            />
            <button
              onClick={handlePasteImport}
              disabled={!pasteData.trim()}
              className="w-full py-2 rounded-xl bg-[#448aff]/20 text-[#448aff] text-xs font-semibold border border-[#448aff]/30 hover:bg-[#448aff]/30 transition-all disabled:opacity-30"
            >
              Parse & Import CSV Data
            </button>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive size={14} className="text-[#00e676]" />
            <h3 className="text-xs font-semibold">Persistent Storage</h3>
          </div>
          {(state.runSessions.length > 0 || state.importedFiles.length > 0) && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-[10px] px-2 py-1 rounded-lg bg-[#ff5252]/10 text-[#ff5252] border border-[#ff5252]/30 hover:bg-[#ff5252]/20 transition-all"
            >
              Reset All Data
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-[#12121a]">
            <div className="text-lg font-bold text-[#00e676]">{state.importedFiles.length}</div>
            <div className="text-[10px] text-[#555570]">Files</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#12121a]">
            <div className="text-lg font-bold text-[#448aff]">{state.runSessions.length}</div>
            <div className="text-[10px] text-[#555570]">Activities</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#12121a]">
            <div className="text-lg font-bold text-[#b388ff]">
              {state.importedFiles.reduce((acc, f) => acc + (f.records || 0), 0)}
            </div>
            <div className="text-[10px] text-[#555570]">Records</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></div>
          <span className="text-[10px] text-[#8888a0]">Data auto-saved to browser storage • Survives refresh/close</span>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a1a25] border border-[#2a2a3a] rounded-2xl p-5 animate-slide-up mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff5252]/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-[#ff5252]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Reset All Workout Data?</h3>
                <p className="text-xs text-[#8888a0]">This will clear all imported workouts and files</p>
              </div>
            </div>
            <p className="text-xs text-[#8888a0] mb-4">
              Are you sure you want to reset all workout data? This action cannot be undone. You will need to re-import your CSV files.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetWorkoutData();
                  setShowResetConfirm(false);
                  setImportStatus('✅ All workout data has been reset. You can now re-import your CSV file.');
                  setTimeout(() => setImportStatus(''), 5000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5252]/20 text-[#ff5252] text-xs font-semibold border border-[#ff5252]/30 hover:bg-[#ff5252]/30 transition-all"
              >
                Reset Data
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2a2a3a] text-[#8888a0] text-xs font-semibold hover:bg-[#3a3a4a] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reset Confirmation Modal */}
      {showDailyResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a1a25] border border-[#2a2a3a] rounded-2xl p-5 animate-slide-up mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff5252]/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-[#ff5252]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Reset Daily Health Data?</h3>
                <p className="text-xs text-[#8888a0]">This will clear all imported daily health metrics</p>
              </div>
            </div>
            <p className="text-xs text-[#8888a0] mb-4">
              Are you sure you want to reset all daily health data (sleep, stress, heart rate, vitality)? This action cannot be undone. You will need to re-import your health data files.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetDailyData();
                  setShowDailyResetConfirm(false);
                  setImportStatus('✅ All daily health data has been reset. You can now re-import your health data.');
                  setTimeout(() => setImportStatus(''), 5000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5252]/20 text-[#ff5252] text-xs font-semibold border border-[#ff5252]/30 hover:bg-[#ff5252]/30 transition-all"
              >
                Reset Data
              </button>
              <button
                onClick={() => setShowDailyResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2a2a3a] text-[#8888a0] text-xs font-semibold hover:bg-[#3a3a4a] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Preview for selected file */}
      {previewFile && previewFile.csvHeaders && previewFile.csvData && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold flex items-center gap-2">
              <Table size={14} className="text-[#00e676]" />
              CSV Viewer: {previewFile.name}
            </h3>
            <button
              onClick={() => setPreviewFile(null)}
              className="text-[10px] text-[#8888a0] hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <CSVViewer
            headers={previewFile.csvHeaders}
            rows={previewFile.csvData}
            title={previewFile.name}
          />
        </div>
      )}

      {/* Imported Files List */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Import History (Persistent)</h3>
        {state.importedFiles.length === 0 ? (
          <div className="text-center py-6">
            <Database size={24} className="mx-auto text-[#555570] mb-2" />
            <p className="text-xs text-[#8888a0]">No files imported yet</p>
            <p className="text-[10px] text-[#555570]">Upload a CSV file to see data here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {state.importedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#12121a] border border-[#2a2a3a]/30">
                {getTypeIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{file.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#555570]">{file.size}</span>
                    <span className="text-[10px] text-[#555570]">•</span>
                    <span className="text-[10px] text-[#555570]">{file.date}</span>
                    <span className="text-[10px] text-[#555570]">•</span>
                    <span className="text-[10px] text-[#8888a0]">{file.records} record(s)</span>
                  </div>
                </div>
                {file.csvData && file.csvHeaders && (
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 rounded-lg bg-[#448aff]/10 text-[#448aff] hover:bg-[#448aff]/20 transition-all"
                    title="View CSV Data"
                  >
                    <Table size={12} />
                  </button>
                )}
                {getStatusIcon(file.status)}
                <button
                  onClick={() => removeImportedFile(file.id)}
                  className="p-1.5 rounded-lg text-[#555570] hover:text-[#ff5252] hover:bg-[#ff5252]/10 transition-all"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Connectivity Info */}
      <div className="glass-card p-4 border-l-2 border-l-[#00e676]">
        <h4 className="text-xs font-semibold text-[#00e676] mb-1">🔗 Data Connectivity</h4>
        <p className="text-[10px] text-[#8888a0] leading-relaxed">
          All imported data is automatically synced across all tabs:
        </p>
        <ul className="mt-2 space-y-1">
          <li className="text-[10px] text-[#8888a0]">• <span className="text-[#f0f0f5]">Daily Tab</span> — Shows latest metrics from imported data</li>
          <li className="text-[10px] text-[#8888a0]">• <span className="text-[#f0f0f5]">Weekly Tab</span> — Aggregates training load & distance</li>
          <li className="text-[10px] text-[#8888a0]">• <span className="text-[#f0f0f5]">AI Coach</span> — Analyzes your imported sessions</li>
          <li className="text-[10px] text-[#8888a0]">• <span className="text-[#f0f0f5]">Scientific Tab</span> — Correlates research with your data</li>
          <li className="text-[10px] text-[#8888a0]">• <span className="text-[#f0f0f5]">Target Tab</span> — Updates progress from imported activities</li>
        </ul>
      </div>
    </div>
  );
}
