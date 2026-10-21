import { CSVRow } from './store';

/**
 * CSV Parser - Parses CSV text into structured data
 * Supports: comma/semicolon/tab delimiters, quoted strings, escaped quotes
 */
export function parseCSV(text: string, delimiter?: string): { headers: string[]; rows: CSVRow[] } {
  // Auto-detect delimiter
  const firstLine = text.split('\n')[0] || '';
  if (!delimiter) {
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else delimiter = ',';
  }

  const lines = splitCSVLines(text);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse header
  const headers = parseCSVLine(lines[0], delimiter);

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    const values = parseCSVLine(line, delimiter);
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Split CSV text into lines, handling quoted newlines
 */
function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '""';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++; // Handle \r\n
      if (current.trim()) lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) lines.push(current);
  return lines;
}

/**
 * Parse a single CSV line into values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Convert data back to CSV string
 */
export function toCSV(headers: string[], rows: CSVRow[]): string {
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row =>
    headers.map(h => escapeCSV(row[h] || '')).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Generate a standard running activity CSV template
 */
export function generateActivityCSV(): string {
  const headers = [
    'date', 'duration_min', 'distance_km', 'pace_min_per_km',
    'avg_hr', 'max_hr', 'vo2max', 'elevation_gain_m', 'elevation_loss_m',
    'steps', 'calories', 'cadence_spm', 'stride_length_m',
    'gct_ms', 'vertical_oscillation_cm', 'vertical_ratio_pct',
    'training_load', 'start_hr', 'end_hr', 'recovery_rate_bpm'
  ];

  const sampleRows = [
    '2025-01-15,45,8.2,5.49,152,178,52.4,85,72,8420,612,186,1.12,228,8.2,7.3,742,88,72,16',
    '2025-01-13,32,5.5,5.82,142,168,52.1,42,38,5680,420,182,1.08,235,7.8,7.0,520,82,68,14',
    '2025-01-11,62,12.5,4.96,158,182,52.8,120,115,12800,920,188,1.15,222,8.5,7.1,1120,92,78,14',
  ];

  return [headers.join(','), ...sampleRows].join('\n');
}

/**
 * Generate daily health metrics CSV template
 */
export function generateHealthCSV(): string {
  const headers = [
    'date', 'vitality_score', 'recovery_score', 'avg_hr', 'resting_hr',
    'sleep_hr', 'sleep_duration_h', 'deep_sleep_h', 'rem_sleep_h',
    'light_sleep_h', 'awake_h', 'sleep_resp_rate', 'spo2_pct',
    'stress_level_pct', 'hrv_ms'
  ];

  const sampleRows = [
    '2025-01-15,78,72,68,52,48,7.5,1.8,1.5,3.7,0.5,14,97,32,62',
    '2025-01-14,72,65,72,54,50,7.0,1.5,1.3,3.8,0.4,15,96,38,58',
    '2025-01-13,80,78,65,51,47,8.0,2.0,1.7,3.8,0.5,13,98,25,65',
  ];

  return [headers.join(','), ...sampleRows].join('\n');
}

/**
 * Parse daily health data from CSV or JSON
 * Handles sleep, stress, heart rate, vitality data
 * Supports MiFitness NDJSON format (multiple JSON objects, one per line)
 */
export function parseDailyHealthData(content: string): { headers: string[]; rows: CSVRow[] } {
  const rows: CSVRow[] = [];
  
  // Try NDJSON parsing first (MiFitness format: multiple JSON objects, one per line)
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  // Check if this is NDJSON format (each line is a JSON object)
  const jsonObjects: any[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('{')) {
      try {
        const item = JSON.parse(trimmed);
        if (typeof item === 'object' && item !== null) {
          jsonObjects.push(item);
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  });
  
  // If we found JSON objects, process them as MiFitness NDJSON
  if (jsonObjects.length > 0) {
    // Group JSON objects by date
    const dataByDate = new Map<string, any[]>();
    
    jsonObjects.forEach((obj) => {
      // Extract date from various timestamp fields
      let timestamp = obj.bedtime || obj.wake_up_time || obj.time || obj.start_time;
      
      if (timestamp) {
        const date = new Date(timestamp * 1000).toISOString().split('T')[0];
        if (!dataByDate.has(date)) {
          dataByDate.set(date, []);
        }
        dataByDate.get(date)!.push(obj);
      }
    });
    
    // Merge data for each date
    dataByDate.forEach((objects, date) => {
      const mergedData = mergeMiFitnessData(objects);
      const convertedRow = dailyHealthJSONToCSVRow(mergedData);
      convertedRow.date = date; // Ensure date is set
      rows.push(convertedRow);
    });
    
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { headers, rows };
  }
  
  // Fallback: Try CSV parsing
  const csvData = parseCSV(content);
  
  if (csvData.rows.length > 0) {
    // Check if any column contains embedded JSON
    const firstRow = csvData.rows[0];
    const hasEmbeddedJSON = Object.values(firstRow).some(val => 
      typeof val === 'string' && (val.startsWith('{"') || val.startsWith('{""'))
    );
    
    if (hasEmbeddedJSON) {
      // Parse embedded JSON from CSV
      csvData.rows.forEach((csvRow) => {
        const jsonColumn = Object.entries(csvRow).find(([key, val]) => 
          typeof val === 'string' && (val.startsWith('{"') || val.startsWith('{""'))
        );
        
        if (jsonColumn) {
          let jsonStr = jsonColumn[1];
          
          if (jsonStr.startsWith('"{""')) {
            jsonStr = jsonStr.slice(1, -1).replace(/""/g, '"');
          }
          
          try {
            const jsonData = JSON.parse(jsonStr);
            const convertedRow = dailyHealthJSONToCSVRow(jsonData);
            rows.push(convertedRow);
          } catch (e) {
            console.error('Failed to parse embedded JSON:', e);
          }
        }
      });
      
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { headers, rows };
    } else {
      // Regular CSV
      return csvData;
    }
  }
  
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

/**
 * Merge multiple MiFitness JSON objects for the same date
 */
function mergeMiFitnessData(objects: any[]): any {
  const merged: any = {};
  
  objects.forEach((obj) => {
    // Activity data
    if (obj.calories !== undefined) merged.calories = obj.calories;
    if (obj.distance !== undefined) merged.distance = obj.distance;
    if (obj.steps !== undefined) merged.steps = obj.steps;
    
    // Stress data
    if (obj.avg_stress !== undefined) merged.avg_stress = obj.avg_stress;
    if (obj.max_stress !== undefined) merged.max_stress = obj.max_stress;
    if (obj.min_stress !== undefined) merged.min_stress = obj.min_stress;
    
    // SpO2 data
    if (obj.avg_spo2 !== undefined) merged.avg_spo2 = obj.avg_spo2;
    if (obj.max_spo2 !== undefined) merged.max_spo2 = obj.max_spo2;
    if (obj.min_spo2 !== undefined) merged.min_spo2 = obj.min_spo2;
    
    // Sleep data
    if (obj.avg_hr !== undefined) merged.avg_hr = obj.avg_hr;
    if (obj.max_hr !== undefined) merged.max_hr = obj.max_hr;
    if (obj.min_hr !== undefined) merged.min_hr = obj.min_hr;
    if (obj.sleep_deep_duration !== undefined) merged.sleep_deep_duration = obj.sleep_deep_duration;
    if (obj.sleep_light_duration !== undefined) merged.sleep_light_duration = obj.sleep_light_duration;
    if (obj.sleep_rem_duration !== undefined) merged.sleep_rem_duration = obj.sleep_rem_duration;
    if (obj.sleep_awake_duration !== undefined) merged.sleep_awake_duration = obj.sleep_awake_duration;
    if (obj.total_duration !== undefined) merged.total_duration = obj.total_duration;
    if (obj.sleep_score !== undefined) merged.sleep_score = obj.sleep_score;
    if (obj.bedtime !== undefined) merged.bedtime = obj.bedtime;
    if (obj.wake_up_time !== undefined) merged.wake_up_time = obj.wake_up_time;
  });
  
  return merged;
}

/**
 * Convert daily health JSON to CSV row
 * Handles MiFitness NDJSON format with specific field names
 */
export function dailyHealthJSONToCSVRow(json: any): CSVRow {
  // Convert timestamp to date
  const timestamp = json.bedtime || json.wake_up_time || json.date || json.timestamp || json.start_time || json.time || Date.now() / 1000;
  const date = typeof timestamp === 'number' && timestamp > 1000000000 
    ? new Date(timestamp * 1000).toISOString().split('T')[0]
    : String(timestamp).split('T')[0];
  
  // Activity data
  const calories = json.calories || 0;
  const distanceMeters = json.distance || 0;
  const distanceKm = distanceMeters > 0 ? (distanceMeters / 1000).toFixed(2) : '0';
  const steps = json.steps || 0;
  
  // Stress data
  const avgStress = json.avg_stress || 0;
  
  // SpO2 data
  const avgSpo2 = json.avg_spo2 || json.spo2 || 0;
  
  // Sleep data (convert minutes to hours)
  const totalDurationMin = json.total_duration || 0;
  const totalDurationHr = totalDurationMin > 0 ? (totalDurationMin / 60).toFixed(1) : '0';
  
  const deepSleepMin = json.sleep_deep_duration || 0;
  const deepSleepHr = deepSleepMin > 0 ? (deepSleepMin / 60).toFixed(1) : '0';
  
  const lightSleepMin = json.sleep_light_duration || 0;
  const lightSleepHr = lightSleepMin > 0 ? (lightSleepMin / 60).toFixed(1) : '0';
  
  const remSleepMin = json.sleep_rem_duration || 0;
  const remSleepHr = remSleepMin > 0 ? (remSleepMin / 60).toFixed(1) : '0';
  
  const awakeMin = json.sleep_awake_duration || 0;
  const awakeHr = awakeMin > 0 ? (awakeMin / 60).toFixed(1) : '0';
  
  // Heart rate data
  const avgHR = json.avg_hr || 0;
  const sleepHR = json.avg_hr || 0; // Use avg_hr as sleep_hr for sleep data
  
  // Sleep score as vitality/recovery
  const sleepScore = json.sleep_score || 0;
  const vitality = sleepScore; // Use sleep_score as vitality
  const recovery = sleepScore; // Use sleep_score as recovery
  
  return {
    date: date,
    vitality_score: String(vitality),
    recovery_score: String(recovery),
    avg_hr: String(avgHR),
    resting_hr: String(avgHR), // Use avg_hr as resting_hr
    sleep_hr: String(sleepHR),
    sleep_duration_h: totalDurationHr,
    deep_sleep_h: deepSleepHr,
    rem_sleep_h: remSleepHr,
    light_sleep_h: lightSleepHr,
    awake_h: awakeHr,
    sleep_resp_rate: '0', // Not available in MiFitness
    spo2_pct: String(avgSpo2),
    stress_level_pct: String(avgStress),
    hrv_ms: '0', // Not available in MiFitness
    calories: String(calories),
    distance_km: distanceKm,
    steps: String(steps),
  };
}

/**
 * Convert CSV row to DailyMetrics
 * Handles MiFitness NDJSON format and various field name formats
 */
export function csvRowToDailyMetrics(row: CSVRow): import('./types').DailyMetrics {
  const findValue = (keywords: string[]): string => {
    for (const key of Object.keys(row)) {
      const keyLower = key.toLowerCase();
      if (keywords.some(kw => keyLower.includes(kw))) {
        return row[key] || '';
      }
    }
    return '';
  };

  // Parse date - handle various formats
  let dateStr = findValue(['date', 'tanggal', 'timestamp', 'time']);
  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  } else if (!isNaN(Number(dateStr)) && Number(dateStr) > 1000000000) {
    // Convert Unix timestamp to date string
    dateStr = new Date(Number(dateStr) * 1000).toISOString().split('T')[0];
  }

  return {
    date: dateStr,
    vitalityScore: parseInt(findValue(['vitality', 'vitality_score', 'body_battery', 'energy', 'sleep_score'])) || 0,
    recoveryScore: parseInt(findValue(['recovery', 'recovery_score', 'recovery_level', 'sleep_score'])) || 0,
    avgHR: parseInt(findValue(['avg_hr', 'avg_hrm', 'heart_rate', 'hr_avg', 'average_hr'])) || 0,
    restingHR: parseInt(findValue(['resting_hr', 'resting_hrm', 'rest_heart_rate', 'rhr', 'avg_hr'])) || 0,
    sleepHR: parseInt(findValue(['sleep_hr', 'sleeping_hr', 'sleep_heart_rate', 'sleeping_hrm', 'avg_hr'])) || 0,
    sleepDuration: parseFloat(findValue(['sleep_duration', 'total_sleep', 'sleep_time', 'sleeping_time', 'total_duration'])) || 0,
    deepSleep: parseFloat(findValue(['deep_sleep', 'deep_sleep_duration', 'deep_sleep_time'])) || 0,
    remSleep: parseFloat(findValue(['rem_sleep', 'rem_sleep_duration', 'rem_sleep_time'])) || 0,
    lightSleep: parseFloat(findValue(['light_sleep', 'light_sleep_duration', 'light_sleep_time'])) || 0,
    awake: parseFloat(findValue(['awake', 'awake_duration', 'awake_time', 'wake_duration', 'sleep_awake_duration'])) || 0,
    sleepRespRate: parseInt(findValue(['resp_rate', 'respiratory_rate', 'breathing_rate', 'sleep_resp_rate'])) || 0,
    spo2: parseInt(findValue(['spo2', 'blood_oxygen', 'avg_spo2', 'oxygen_saturation'])) || 0,
    stressLevel: parseInt(findValue(['stress', 'stress_level', 'avg_stress', 'stress_score'])) || 0,
    hrv: parseInt(findValue(['hrv', 'hrv_ms', 'heart_rate_variability'])) || 0,
    // Activity metrics from MiFitness
    calories: parseInt(findValue(['calories', 'calorie', 'kalori', 'kcal', 'energy', 'total_cal'])) || undefined,
    steps: parseInt(findValue(['steps', 'step', 'langkah', 'step_count'])) || undefined,
    distance: parseFloat(findValue(['distance', 'jarak', 'km', 'dist'])) || undefined,
  };
}

/**
 * Convert RunSession to CSV row
 */
export function runSessionToCSVRow(session: import('./types').RunSession): CSVRow {
  return {
    date: session.date,
    duration_min: String(session.duration),
    distance_km: String(session.distance),
    pace_min_per_km: String(session.pace),
    avg_hr: String(session.avgHR),
    max_hr: String(session.maxHR),
    vo2max: String(session.vo2max),
    elevation_gain_m: String(session.elevationGain),
    elevation_loss_m: String(session.elevationLoss),
    steps: String(session.steps),
    calories: String(session.calories),
    cadence_spm: String(session.cadence),
    stride_length_m: String(session.strideLength),
    gct_ms: String(session.gct),
    vertical_oscillation_cm: String(session.verticalOscillation),
    vertical_ratio_pct: String(session.verticalRatio),
    training_load: String(session.trainingLoad),
    start_hr: String(session.startHR),
    end_hr: String(session.endHR),
    recovery_rate_bpm: String(session.recoveryRate),
  };
}

/**
 * Parse fitness device JSON data (Huawei Health, Garmin, MiFitness, etc.)
 * Handles: single JSON, array JSON, NDJSON, and JSON embedded in CSV with escaped quotes
 */
export function parseFitnessJSON(content: string): { headers: string[]; rows: CSVRow[] } {
  const rows: CSVRow[] = [];
  
  // Try to parse as pure JSON first (array or object)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          rows.push(fitnessJSONToCSVRow(item));
        }
      });
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        return { headers, rows };
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      rows.push(fitnessJSONToCSVRow(parsed));
      const headers = Object.keys(rows[0]);
      return { headers, rows };
    }
  } catch {
    // Not pure JSON, continue to other strategies
  }
  
  // Process line by line for NDJSON or CSV with embedded JSON
  const lines = content.split('\n');
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return;
    
    // Skip CSV header rows (common patterns)
    if (trimmed.startsWith('date,') || 
        trimmed.startsWith('filename,') ||
        trimmed.startsWith('id,') ||
        trimmed.toLowerCase().startsWith('record_id,')) {
      return;
    }
    
    // Strategy 1: Try to find CSV-escaped JSON (Huawei/MiFitness format)
    // Pattern: "{"key":value,...}"
    // Find all occurrences of "{"" and extract until ""}"
    let searchStart = 0;
    let foundJSON = false;
    
    while (true) {
      const startIdx = trimmed.indexOf('"{""', searchStart);
      if (startIdx === -1) break;
      
      // Find the closing ""}"
      const endIdx = trimmed.indexOf('""}"', startIdx);
      if (endIdx === -1) break;
      
      // Extract the JSON string (including outer quotes)
      const jsonWithQuotes = trimmed.substring(startIdx, endIdx + 4);
      
      // Remove outer quotes and unescape double quotes
      const jsonStr = jsonWithQuotes
        .slice(1, -1) // Remove outer quotes
        .replace(/""/g, '"'); // Unescape "" to "
      
      try {
        const item = JSON.parse(jsonStr);
        if (typeof item === 'object' && item !== null) {
          rows.push(fitnessJSONToCSVRow(item));
          foundJSON = true;
        }
      } catch {
        // Skip invalid JSON, continue searching
      }
      
      searchStart = endIdx + 4;
    }
    
    // Strategy 2: If no CSV-escaped JSON found, try regular JSON pattern
    if (!foundJSON) {
      // Try to find any JSON object in the line
      const jsonMatch = trimmed.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (jsonMatch) {
        try {
          const item = JSON.parse(jsonMatch[0]);
          if (typeof item === 'object' && item !== null) {
            rows.push(fitnessJSONToCSVRow(item));
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  });
  
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

/**
 * Convert fitness JSON object to CSV row format
 * Handles Huawei Health, Garmin, MiFitness, and other fitness device formats
 */
export function fitnessJSONToCSVRow(json: any): CSVRow {
  // Calculate duration in minutes from seconds
  const durationSeconds = json.duration || 0;
  const durationMinutes = Math.round(durationSeconds / 60);
  
  // Convert Unix timestamp to date
  const startTime = json.start_time || json.time || Date.now() / 1000;
  const date = new Date(startTime * 1000).toISOString().split('T')[0];
  
  // Distance: Huawei/MiFitness uses meters, convert to km
  const distanceMeters = json.distance || 0;
  const distanceKm = distanceMeters > 0 ? (distanceMeters / 1000).toFixed(2) : '0';
  
  // Pace: Huawei uses seconds/km, convert to minutes/km
  const avgPaceSeconds = json.avg_pace || 0;
  const paceMinPerKm = avgPaceSeconds > 0 ? (avgPaceSeconds / 60).toFixed(2) : '0';
  
  // Stride length: Huawei uses cm, convert to meters
  const strideLengthCm = json.avg_stride || 0;
  const strideLengthM = strideLengthCm > 0 ? (strideLengthCm / 100).toFixed(2) : '0';
  
  // Ground contact time (touchdown duration)
  const gct = json.avg_touchdown_duration || 0;
  
  // Vertical oscillation
  const verticalOsc = json.avg_vertical_amplitude || 0;
  
  // Vertical ratio
  const verticalRatio = json.avg_vertical_stride_ratio || 0;
  
  // Cadence
  const cadence = json.avg_cadence || 0;
  
  // Elevation
  const riseHeight = json.rise_height || 0;
  const fallHeight = json.fall_height || 0;
  
  // Heart rate zones duration (for HR zone distribution)
  const warmUpDuration = json.hrm_warm_up_duration || 0;
  const fatBurningDuration = json.hrm_fat_burning_duration || 0;
  const aerobicDuration = json.hrm_aerobic_duration || 0;
  const anaerobicDuration = json.hrm_anaerobic_duration || 0;
  const extremeDuration = json.hrm_extreme_duration || 0;
  
  // Calculate HR zone distribution percentages
  const totalHRDuration = warmUpDuration + fatBurningDuration + aerobicDuration + anaerobicDuration + extremeDuration;
  const hrZoneDistribution = totalHRDuration > 0 ? [
    Math.round((warmUpDuration / totalHRDuration) * 100),
    Math.round((fatBurningDuration / totalHRDuration) * 100),
    Math.round((aerobicDuration / totalHRDuration) * 100),
    Math.round((anaerobicDuration / totalHRDuration) * 100),
    Math.round((extremeDuration / totalHRDuration) * 100),
  ] : [10, 20, 30, 25, 15];
  
  // Classify sport type
  const sportType = json.sport_type || 0;
  
  // Return CSV row with standardized field names
  return {
    date: date,
    duration: String(durationMinutes),
    distance_km: distanceKm,
    pace_min_per_km: paceMinPerKm,
    avg_hr: String(json.avg_hrm || json.avg_hr || 0),
    max_hr: String(json.max_hrm || json.max_hr || 0),
    min_hr: String(json.min_hrm || json.min_hr || 0),
    vo2max: String(json.vo2_max || json.vo2max || 0),
    elevation_gain_m: String(riseHeight),
    elevation_loss_m: String(fallHeight),
    steps: String(json.steps || json.step_count || 0),
    calories: String(json.total_cal || json.calories || 0),
    cadence_spm: String(cadence),
    stride_length_m: strideLengthM,
    gct_ms: String(gct),
    vertical_oscillation_cm: String(verticalOsc),
    vertical_ratio_pct: String(verticalRatio),
    training_load: String(json.train_load || json.training_load || 0),
    start_hr: String(json.min_hrm || json.start_hrm || 0),
    end_hr: String(json.end_hrm || 0),
    recovery_rate_bpm: String(json.recover_time || json.recovery_rate || 0),
    sport_type: String(sportType),
    train_effect: String(json.train_effect || 0),
    vitality: String(json.vitality || 0),
    running_ability_index: String(json.running_ability_index || 0),
    hr_zone_distribution: JSON.stringify(hrZoneDistribution),
  };
}

/**
 * Check if content is JSON format or CSV with embedded JSON
 */
export function isJSONContent(content: string): boolean {
  const trimmed = content.trim();
  
  // Check for pure JSON (array or object)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return true;
  }
  
  // Check for NDJSON (one JSON per line)
  const lines = trimmed.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  if (nonEmptyLines.some(line => line.trim().startsWith('{'))) {
    return true;
  }
  
  // Check for CSV with embedded JSON (Huawei/MiFitness format)
  // Pattern: "{"key":value" which indicates escaped JSON in CSV
  // Must have BOTH opening and closing patterns to be valid
  const hasOpeningPattern = content.includes('"{"') || content.includes('"{""');
  const hasClosingPattern = content.includes('"}"') || content.includes('""}"');
  
  if (hasOpeningPattern && hasClosingPattern) {
    return true;
  }
  
  return false;
}

/**
 * Convert CSV row to RunSession - Flexible column name detection
 */
export function csvRowToRunSession(row: CSVRow, index: number): import('./types').RunSession {
  // Helper to find value by multiple possible column names
  const findValue = (keywords: string[]): string => {
    for (const key of Object.keys(row)) {
      const keyLower = key.toLowerCase();
      if (keywords.some(kw => keyLower.includes(kw))) {
        return row[key] || '';
      }
    }
    return '';
  };

  // Parse HR zone distribution from JSON string if available
  let hrZoneDistribution = [10, 20, 30, 25, 15];
  const hrZoneStr = findValue(['hr_zone_distribution']);
  if (hrZoneStr) {
    try {
      const parsed = JSON.parse(hrZoneStr);
      if (Array.isArray(parsed) && parsed.length === 5) {
        hrZoneDistribution = parsed;
      }
    } catch {
      // Use default
    }
  }

  // Determine sport type from data
  const sportTypeStr = findValue(['sport_type', 'activity_type', 'type', 'sport']).toLowerCase();
  let sportType: import('./types').SportType = 'other';
  
  if (sportTypeStr.includes('run') || sportTypeStr === '1') {
    sportType = 'running';
  } else if (sportTypeStr.includes('cycle') || sportTypeStr.includes('bike') || sportTypeStr === '2') {
    sportType = 'cycling';
  } else if (sportTypeStr.includes('strength') || sportTypeStr.includes('gym') || sportTypeStr === '3') {
    sportType = 'strength';
  } else if (sportTypeStr.includes('swim') || sportTypeStr === '4') {
    sportType = 'swimming';
  } else if (sportTypeStr.includes('walk') || sportTypeStr === '5') {
    sportType = 'walking';
  } else if (sportTypeStr.includes('hike') || sportTypeStr === '6') {
    sportType = 'hiking';
  }

  return {
    id: `imported-${Date.now()}-${index}`,
    date: findValue(['date', 'tanggal']) || new Date().toISOString().split('T')[0],
    duration: parseFloat(findValue(['duration', 'durasi', 'time', 'waktu'])) || 0,
    distance: parseFloat(findValue(['distance', 'jarak', 'km', 'dist'])) || 0,
    pace: parseFloat(findValue(['pace'])) || 0,
    avgHR: parseInt(findValue(['avg_hr', 'avg_hrm', 'avg heart', 'average hr', 'heartrate_avg', 'hr_avg'])) || 0,
    maxHR: parseInt(findValue(['max_hr', 'max_hrm', 'max heart', 'heartrate_max', 'hr_max'])) || 0,
    vo2max: parseFloat(findValue(['vo2', 'vo2max'])) || 0,
    elevationGain: parseInt(findValue(['elevation_gain', 'elev_gain', 'gain', 'ascent', 'rise'])) || 0,
    elevationLoss: parseInt(findValue(['elevation_loss', 'elev_loss', 'loss', 'descent', 'fall'])) || 0,
    steps: parseInt(findValue(['steps', 'step', 'langkah', 'step_count'])) || 0,
    calories: parseInt(findValue(['calories', 'calorie', 'kalori', 'kcal', 'energy', 'total_cal'])) || 0,
    cadence: parseInt(findValue(['cadence', 'cadence_spm', 'spm', 'langkah_per', 'avg_cadence'])) || 0,
    strideLength: parseFloat(findValue(['stride', 'stride_length'])) || 0,
    gct: parseInt(findValue(['gct', 'ground_contact', 'contact_time', 'touchdown'])) || 0,
    verticalOscillation: parseFloat(findValue(['vertical_osc', 'vertical_os', 'oscillation', 'amplitude'])) || 0,
    verticalRatio: parseFloat(findValue(['vertical_ratio', 'v_ratio', 'stride_ratio'])) || 0,
    trainingLoad: parseInt(findValue(['training_load', 'load', 'beban', 'train_load'])) || 0,
    startHR: parseInt(findValue(['start_hr', 'start_heart', 'start_hrm', 'min_hr', 'min_hrm'])) || 0,
    endHR: parseInt(findValue(['end_hr', 'end_heart', 'end_hrm'])) || 0,
    recoveryRate: parseInt(findValue(['recovery', 'hrr', 'recovery_rate', 'recover_time'])) || 0,
    hrZoneDistribution: hrZoneDistribution,
    sportType: sportType,
  };
}
