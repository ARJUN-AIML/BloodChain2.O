import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  Activity, 
  Droplet, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Info,
  Clock,
  Layers
} from 'lucide-react';

export const AIDemandForecastSection = ({ facility, role }) => {
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [component, setComponent] = useState('RBC');
  const [forecastDays, setForecastDays] = useState(7);
  const [historicalDays, setHistoricalDays] = useState(14);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Normalize facility type and titles
  const isBloodBank = Boolean(
    (facility?.facility_type && facility.facility_type.toLowerCase().includes('bank')) ||
    role === 'BLOOD_BANK'
  );

  const sectionBadge = isBloodBank ? '🩸 AI Outbound Requirement Forecast' : '🩸 AI Demand Forecast';
  const defaultSectionTitle = isBloodBank 
    ? 'Blood Bank Outbound Requirement Forecast' 
    : 'Hospital Blood Demand Forecast';

  const targetLabel = isBloodBank ? 'Historical Outbound Requirement' : 'Historical Actual Demand';
  const predictedLabel = isBloodBank ? 'AI Predicted Outbound Requirement' : 'AI Predicted Demand';
  const expectedDropdownTitle = isBloodBank ? 'Expected Outbound Requirement' : 'Expected Demand';

  const fetchForecast = async (showLoading = true) => {
    try {
      if (showLoading && !forecastData) setLoading(true);
      setError(null);
      const res = await api.get('/demand/', {
        params: {
          blood_group: bloodGroup,
          component: component,
          days: Math.max(14, historicalDays),
          forecast_days: forecastDays
        }
      });
      setForecastData(res.data);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
      setError(err.response?.data?.detail || 'Unable to retrieve ML forecast. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(true);
  }, [bloodGroup, component, historicalDays, forecastDays]);

  const handleTriggerRecalculate = async () => {
    try {
      setRecalculating(true);
      await api.post('/demand/trigger-forecast/');
      await fetchForecast(false);
    } catch (err) {
      console.error('Failed to trigger forecast recalculation:', err);
      // Fallback: re-fetch standard data
      await fetchForecast(false);
    } finally {
      setRecalculating(false);
    }
  };

  // Available options from backend or sensible defaults
  const bloodGroups = forecastData?.available_filters?.blood_groups || [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  const components = forecastData?.available_filters?.components || [
    'RBC', 'WBC', 'Platelets', 'Plasma', 'Whole Blood'
  ];

  // Resilient Extraction: supports direct top-level fields or per-blood-group predictions array
  const dailyForecast = useMemo(() => {
    if (Array.isArray(forecastData?.daily_forecast) && forecastData.daily_forecast.length > 0) {
      return forecastData.daily_forecast;
    }
    if (Array.isArray(forecastData?.predictions) && forecastData.predictions.length > 0) {
      const match = forecastData.predictions.find((p) => p.blood_group === bloodGroup);
      if (match && Array.isArray(match.daily_forecast) && match.daily_forecast.length > 0) {
        return match.daily_forecast;
      }
      // If predictions is an array of daily items directly
      if (forecastData.predictions[0]?.forecast_date || forecastData.predictions[0]?.predicted_units !== undefined) {
        return forecastData.predictions;
      }
    }
    return [];
  }, [forecastData, bloodGroup]);

  const history = useMemo(() => {
    if (Array.isArray(forecastData?.history) && forecastData.history.length > 0) {
      return forecastData.history;
    }
    if (Array.isArray(forecastData?.historical_records) && forecastData.historical_records.length > 0) {
      return forecastData.historical_records;
    }
    return [];
  }, [forecastData]);

  const summary = useMemo(() => {
    if (forecastData?.summary && forecastData.summary.total_expected !== undefined) {
      return forecastData.summary;
    }
    if (dailyForecast.length > 0) {
      const predVals = dailyForecast.map((p) => Number(p.predicted_units ?? p.predictedUnits ?? 0));
      const total = Number(predVals.reduce((a, b) => a + b, 0).toFixed(1));
      const avg = Number((total / dailyForecast.length).toFixed(1));
      const peakIdx = predVals.indexOf(Math.max(...predVals));
      const peakDay = dailyForecast[peakIdx]?.display_label || dailyForecast[peakIdx]?.day_name || dailyForecast[peakIdx]?.forecast_date || 'N/A';
      const peakUnits = predVals[peakIdx] || 0;
      return {
        total_expected: total,
        daily_average: avg,
        peak_day: peakDay,
        peak_units: peakUnits,
        usable_inventory: 0,
        reserved_inventory: 0,
        in_transit_inventory: 0,
        potential_stock_gap: 0,
        risk_label: 'Optimal Buffer'
      };
    }
    return {};
  }, [forecastData, dailyForecast]);

  const isInsufficient = forecastData?.status === 'insufficient_data';

  // -------------------------------------------------------------
  // Bulletproof Date Normalizer: Converts any date format to 'YYYY-MM-DD'
  // -------------------------------------------------------------
  const normalizeDateStr = (dateInput) => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string') {
      const clean = dateInput.trim().split('T')[0].split(' ')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = String(Number(parts[1])).padStart(2, '0');
        const d = String(Number(parts[2])).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return clean;
    }
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(dateInput);
  };

  // -------------------------------------------------------------
  // Calendar View State & Computations for Expected Demand
  // -------------------------------------------------------------
  const [demandViewMode, setDemandViewMode] = useState('calendar'); // 'calendar' (default) or 'grid'
  const [calendarScope, setCalendarScope] = useState('horizon'); // 'horizon' (default - shows full active horizon) or 'month' (standard month grid)
  const [calendarMonthDate, setCalendarMonthDate] = useState(null);
  const [hoveredCalendarDay, setHoveredCalendarDay] = useState(null);

  // Sync calendarMonthDate when dailyForecast loads or updates
  useEffect(() => {
    if (dailyForecast && dailyForecast.length > 0) {
      const norm = normalizeDateStr(dailyForecast[0].forecast_date);
      const parts = norm.split('-').map(Number);
      const firstDateMonth = new Date(parts[0], parts[1] - 1, 1);
      setCalendarMonthDate((curr) => {
        if (!curr) return firstDateMonth;
        const curY = curr.getFullYear();
        const curM = curr.getMonth() + 1;
        const hasOverlap = dailyForecast.some((p) => {
          const [y, m] = normalizeDateStr(p.forecast_date).split('-').map(Number);
          return y === curY && m === curM;
        });
        return hasOverlap ? curr : firstDateMonth;
      });
    } else {
      setCalendarMonthDate(new Date());
    }
  }, [dailyForecast]);

  const handlePrevMonth = () => {
    setCalendarMonthDate((prev) => {
      const d = prev || new Date();
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    });
  };

  const handleNextMonth = () => {
    setCalendarMonthDate((prev) => {
      const d = prev || new Date();
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    });
  };

  const handleJumpToForecast = () => {
    if (dailyForecast && dailyForecast.length > 0) {
      const norm = normalizeDateStr(dailyForecast[0].forecast_date);
      const parts = norm.split('-').map(Number);
      setCalendarMonthDate(new Date(parts[0], parts[1] - 1, 1));
    }
  };

  const calendarMonthYearLabel = useMemo(() => {
    const d = calendarMonthDate || new Date();
    return d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }, [calendarMonthDate]);

  const forecastDateMap = useMemo(() => {
    const map = new Map();
    dailyForecast.forEach((p, idx) => {
      const key = normalizeDateStr(p.forecast_date);
      if (key) {
        map.set(key, {
          ...p,
          normalizedDate: key,
          dayIndex: idx + 1
        });
      }
    });
    return map;
  }, [dailyForecast]);

  const monthsInForecast = useMemo(() => {
    if (!dailyForecast || dailyForecast.length === 0) return [];
    const map = new Map();
    dailyForecast.forEach((p) => {
      const norm = normalizeDateStr(p.forecast_date);
      const [y, m] = norm.split('-').map(Number);
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleDateString('default', { month: 'short', year: 'numeric' });
      if (!map.has(key)) {
        map.set(key, { key, label, count: 0, date: d });
      }
      map.get(key).count += 1;
    });
    return Array.from(map.values());
  }, [dailyForecast]);

  const calendarDays = useMemo(() => {
    // 1. Horizon Mode (Default): Displays continuous weekly rows covering all selected forecast days (7, 14, 30 days)
    if (calendarScope === 'horizon' && dailyForecast && dailyForecast.length > 0) {
      const firstStr = normalizeDateStr(dailyForecast[0].forecast_date);
      const lastStr = normalizeDateStr(dailyForecast[dailyForecast.length - 1].forecast_date);
      const [sY, sM, sD] = firstStr.split('-').map(Number);
      const [eY, eM, eD] = lastStr.split('-').map(Number);

      const startDate = new Date(sY, sM - 1, sD);
      const endDate = new Date(eY, eM - 1, eD);

      // Monday-first weekday (0=Mon, ..., 6=Sun)
      const startWeekday = (startDate.getDay() + 6) % 7;
      const endWeekday = (endDate.getDay() + 6) % 7;
      const trailingCount = (6 - endWeekday);

      const gridStart = new Date(sY, sM - 1, sD - startWeekday);
      const gridEnd = new Date(eY, eM - 1, eD + trailingCount);

      const days = [];
      let curr = new Date(gridStart);
      let dayIndex = 0;

      while (curr <= gridEnd) {
        const dateStr = normalizeDateStr(curr);
        const dayNumber = curr.getDate();
        const monthShort = curr.toLocaleString('default', { month: 'short' });
        const isNewMonth = dayNumber === 1 || dayIndex === 0;

        days.push({
          date: new Date(curr),
          dateStr,
          dayNumber,
          monthName: monthShort,
          isNewMonth,
          isCurrentMonth: true // Horizon view focuses completely on the active weeks
        });

        curr.setDate(curr.getDate() + 1);
        dayIndex++;
      }
      return days;
    }

    // 2. Standard Month View Mode: 6 full 7-day rows (42 cells) for calendarMonthDate
    const d = calendarMonthDate || new Date();
    const year = d.getFullYear();
    const month = d.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDaysInMonth = lastDay.getDate();

    // Monday-first weekday (0=Mon, 1=Tue, ..., 6=Sun)
    const firstDayWeekday = (firstDay.getDay() + 6) % 7;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days = [];

    // Leading days from previous month
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = normalizeDateStr(prevDate);
      days.push({
        date: prevDate,
        dateStr,
        dayNumber: prevDate.getDate(),
        isCurrentMonth: false,
        monthName: prevDate.toLocaleString('default', { month: 'short' }),
        isNewMonth: prevDate.getDate() === 1
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= numDaysInMonth; dayNum++) {
      const currDate = new Date(year, month, dayNum);
      const dateStr = normalizeDateStr(currDate);
      days.push({
        date: currDate,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        monthName: currDate.toLocaleString('default', { month: 'short' }),
        isNewMonth: dayNum === 1
      });
    }

    // Trailing days to complete 6 full 7-day rows (42 cells standard calendar grid)
    const totalCellsNeeded = 42;
    const remaining = totalCellsNeeded - days.length;
    for (let t = 1; t <= remaining; t++) {
      const nextDate = new Date(year, month + 1, t);
      const dateStr = normalizeDateStr(nextDate);
      days.push({
        date: nextDate,
        dateStr,
        dayNumber: nextDate.getDate(),
        isCurrentMonth: false,
        monthName: nextDate.toLocaleString('default', { month: 'short' }),
        isNewMonth: nextDate.getDate() === 1
      });
    }

    return days;
  }, [calendarScope, calendarMonthDate, dailyForecast]);

  // SVG Chart Dimensions & Computations with smooth Bézier curves and area gradient fills
  const chartData = useMemo(() => {
    if (!forecastData || isInsufficient) return null;

    const histPoints = history.map((h) => ({
      date: h.date,
      label: h.day_name || (h.date ? h.date.slice(5) : ''),
      value: Number(h.target_units ?? h.units_requested ?? h.units_transferred_out ?? 0),
      type: 'actual'
    }));

    const predPoints = dailyForecast.map((p) => ({
      date: p.forecast_date,
      label: p.display_label || p.day_name,
      value: Number(p.predicted_units ?? 0),
      type: 'predicted'
    }));

    if (histPoints.length === 0 && predPoints.length === 0) return null;

    const allPoints = [...histPoints, ...predPoints];
    const rawMax = Math.max(10, ...allPoints.map((p) => p.value));
    const maxVal = Math.ceil(rawMax * 1.25); // 25% headroom so curves, pills and dots never touch the top boundary
    const minVal = 0;

    const svgWidth = 880;
    const svgHeight = 290;
    const padX = 55;
    const padY = 45;
    const innerW = svgWidth - padX * 2;
    const innerH = svgHeight - padY * 2;
    const bottomY = padY + innerH;

    const totalSteps = allPoints.length > 1 ? allPoints.length - 1 : 1;

    const getX = (idx) => padX + (idx / totalSteps) * innerW;
    const getY = (val) => padY + innerH - ((val - minVal) / (maxVal - minVal || 1)) * innerH;

    const coordinates = allPoints.map((p, idx) => ({
      ...p,
      x: Number(getX(idx).toFixed(1)),
      y: Number(getY(p.value).toFixed(1))
    }));

    // Catmull-Rom spline helper for silky-smooth curves
    const buildSmoothPath = (pts) => {
      if (!pts || pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      if (pts.length === 2) {
        return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
      }
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      return d;
    };

    // 1. Historical Actual Smooth Path & Gradient Area
    const histCoords = coordinates.slice(0, histPoints.length);
    const actualPathD = buildSmoothPath(histCoords);
    let actualAreaD = '';
    if (histCoords.length > 0) {
      const first = histCoords[0];
      const last = histCoords[histCoords.length - 1];
      actualAreaD = `${actualPathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
    }

    // 2. Future Forecast Smooth Path & Gradient Area (bridged from last actual point)
    const predBridgeCoords = histCoords.length > 0
      ? coordinates.slice(histPoints.length - 1)
      : coordinates.slice(histPoints.length);
    const predPathD = buildSmoothPath(predBridgeCoords);
    let predAreaD = '';
    if (predBridgeCoords.length > 0) {
      const first = predBridgeCoords[0];
      const last = predBridgeCoords[predBridgeCoords.length - 1];
      predAreaD = `${predPathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
    }

    const histAvg = histPoints.length > 0 ? Number((histPoints.reduce((a, b) => a + b.value, 0) / histPoints.length).toFixed(1)) : 0;
    const predAvg = predPoints.length > 0 ? Number((predPoints.reduce((a, b) => a + b.value, 0) / predPoints.length).toFixed(1)) : 0;

    return {
      svgWidth,
      svgHeight,
      padX,
      padY,
      innerW,
      innerH,
      bottomY,
      maxVal,
      actualPathD,
      predPathD,
      actualAreaD,
      predAreaD,
      coordinates,
      histCount: histPoints.length,
      predCount: predPoints.length,
      histAvg,
      predAvg
    };
  }, [forecastData, history, dailyForecast, isInsufficient]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="clinical-card p-6 text-stone-900 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-300 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-rose-600 text-white shadow-xs flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {sectionBadge}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-stone-100 text-stone-700 border border-stone-300">
                Facility ID: <strong className="text-stone-900">{facility?.facility_id}</strong>
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                Target: <strong>{forecastData?.facility?.forecast_target || (isBloodBank ? 'units_transferred_out' : 'units_requested')}</strong>
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Predictive AI Engine
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              {forecastData?.facility?.label || defaultSectionTitle}
            </h2>
            <p className="text-xs text-stone-600 mt-1 max-w-3xl">
              End-to-end {forecastDays}-day predictive intelligence powered by isolated machine learning regressors with multi-step recursive forecasting, lag features, and rolling windows. 
              {isBloodBank 
                ? ' Trained strictly on historical outbound dispatches to avoid request signal distortion.'
                : ' Trained strictly on clinical requisition demands specific to this hospital facility.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerRecalculate}
              disabled={recalculating || loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              title="Trigger predictive model recalculation on latest database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              <span>{recalculating ? 'Re-calculating...' : 'Recalculate Forecast'}</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Blood Group Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-rose-600" />
              <span>Blood Group</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-stone-100 p-1.5 rounded-lg border border-stone-300">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`py-1 text-xs font-bold rounded text-center transition-colors cursor-pointer ${
                    bloodGroup === bg
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Component Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Component (Available in DB)</span>
            </label>
            <select
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono shadow-xs cursor-pointer"
            >
              {components.map((c) => (
                <option key={c} value={c}>
                  {c} {c === 'RBC' ? '(PRBC Packed Cells)' : c === 'FFP' || c === 'Plasma' ? '(Fresh Frozen)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-stone-500 mt-1">Filtered dynamically to operational data present for this facility.</p>
          </div>

          {/* Prediction Horizon Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Prediction Horizon (Calendar Days)</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1.5 rounded-lg border border-stone-300">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForecastDays(d)}
                  className={`py-1 text-xs font-bold rounded text-center transition-colors cursor-pointer ${
                    forecastDays === d
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-500 mt-1">
              Select 7, 14, or 30 days to dynamically generate and display accurate predictions in the calendar.
            </p>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="clinical-card p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-stone-800">Querying PostgreSQL & Running AI Prediction Engine...</p>
          <p className="text-xs text-stone-500">Generating multi-step recursive {forecastDays}-day forecast series for {facility?.facility_id} ({bloodGroup} | {component})</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Forecast API Notice</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Insufficient Data State */}
      {isInsufficient && !loading && (
        <div className="clinical-card p-8 bg-amber-50/90 border border-amber-300 text-amber-950 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-200 text-amber-900">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isBloodBank ? 'Insufficient historical outbound data.' : 'Insufficient historical demand data.'}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The series ({facility?.facility_id} • {bloodGroup} • {component}) has fewer than 14 historical entries. 
                Following strict medical ML safeguards, zero artificial or fake values are generated.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white/70 rounded-lg border border-amber-200">
              <span className="text-[11px] font-semibold text-stone-600 block">7-Day Prediction:</span>
              <span className="text-lg font-bold font-mono text-stone-900">N/A</span>
            </div>
            <div className="p-3 bg-white/70 rounded-lg border border-amber-200">
              <span className="text-[11px] font-semibold text-stone-600 block">Daily Average:</span>
              <span className="text-lg font-bold font-mono text-stone-900">N/A</span>
            </div>
            <div className="p-3 bg-white/70 rounded-lg border border-amber-200">
              <span className="text-[11px] font-semibold text-stone-600 block">Potential Stock Gap:</span>
              <span className="text-lg font-bold font-mono text-stone-900">N/A</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Forecast Presentation (When Success) */}
      {!loading && !isInsufficient && forecastData && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clinical-card p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                {dailyForecast.length || forecastDays}-Day Total Expected
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-stone-900">
                  {dailyForecast.length > 0 && summary.total_expected !== undefined ? summary.total_expected : 'N/A'}
                </span>
                <span className="text-xs font-semibold text-stone-500">units</span>
              </div>
              <p className="text-[10px] text-stone-500">Future predicted requirement across horizon</p>
            </div>

            <div className="clinical-card p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                Daily Predicted Avg
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-teal-800">
                  {dailyForecast.length > 0 && summary.daily_average !== undefined ? summary.daily_average : 'N/A'}
                </span>
                <span className="text-xs font-semibold text-stone-500">units / day</span>
              </div>
              <p className="text-[10px] text-stone-500">Peak Expected: {summary.peak_day || 'N/A'} ({summary.peak_units ?? 0} units)</p>
            </div>

            <div className="clinical-card p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                Current Usable Inventory
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-stone-900">{summary.usable_inventory}</span>
                <span className="text-xs font-semibold text-stone-500">units available</span>
              </div>
              <p className="text-[10px] text-stone-500">Reserved: {summary.reserved_inventory} • In-Transit: {summary.in_transit_inventory}</p>
            </div>

            <div className="clinical-card p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                Potential Stock Gap
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black font-mono ${summary.potential_stock_gap > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {summary.potential_stock_gap}
                </span>
                <span className="text-xs font-semibold text-stone-500">units</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  summary.potential_stock_gap > 0 
                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {summary.risk_label || 'Optimal Buffer'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. EXPECTED DEMAND DROPDOWN / CARD (Matching parchment background pattern) */}
          <div className="clinical-card overflow-hidden shadow-xs space-y-0">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-6 py-5 bg-transparent hover:bg-stone-200/40 border-b border-[rgba(170,150,120,0.30)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors cursor-pointer text-left"
            >
              {/* Left Side: Title & Badges */}
              <div className="flex items-center gap-3.5">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
                      {expectedDropdownTitle}
                    </h3>
                    <span className="px-3 py-0.5 text-xs font-mono font-bold rounded-lg bg-rose-100/90 text-rose-900 border border-rose-300 shadow-2xs">
                      {bloodGroup} | {component}
                    </span>
                    <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-lg bg-stone-200/90 text-stone-800 border border-stone-300">
                      AI Regressor
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 font-medium leading-relaxed">
                    Day-by-day {dailyForecast.length || forecastDays}-day predictive series directly from the AI machine learning engine. (Isolated from current inventory &amp; historical demand)
                  </p>
                </div>
              </div>

              {/* Right Side: Spacious Forecast Days Badge + Prominent Calendar Icon + Chevron */}
              <div className="flex items-center gap-4 sm:gap-5 shrink-0 self-end md:self-auto">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-200/80 border border-stone-300/90 text-stone-800 text-xs font-bold font-mono shadow-2xs">
                  <span>{dailyForecast.length} Forecast Days</span>
                </div>
                {/* Prominent Calendar Icon with generous padding */}
                <div 
                  className="w-10 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs shrink-0 transition-transform active:scale-95"
                  title="Forecast Horizon Calendar"
                >
                  <Calendar className="w-5 h-5" />
                </div>
                {/* Accordion Chevron with matching generous padding */}
                <div className="w-10 h-10 rounded-xl bg-stone-200/80 hover:bg-stone-300/80 border border-stone-300/90 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors shrink-0">
                  {isDropdownOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="p-6 space-y-4">
                {/* View Switcher & Month Navigation Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#e8deca]/70 p-3 rounded-xl border border-[#cbbaa0]">
                  {/* View Mode Buttons & Quick Horizon Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Calendar Scope Switcher */}
                    <div className="flex items-center gap-1 bg-[#faf6ee] p-1 rounded-lg border border-[#d5c7b2]">
                      <button
                        type="button"
                        onClick={() => {
                          setDemandViewMode('calendar');
                          setCalendarScope('horizon');
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                          demandViewMode === 'calendar' && calendarScope === 'horizon'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                        }`}
                        title="Display continuous calendar rows covering the full selected forecast horizon"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Forecast Horizon ({dailyForecast.length}d)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDemandViewMode('calendar');
                          setCalendarScope('month');
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                          demandViewMode === 'calendar' && calendarScope === 'month'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                        }`}
                        title="View monthly calendar grid"
                      >
                        <span>Full Month</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDemandViewMode('grid')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        demandViewMode === 'grid'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-[#faf6ee] text-stone-700 hover:text-stone-900 border border-[#d5c7b2]'
                      }`}
                      title="Switch to card grid view"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Card Grid</span>
                    </button>

                    {/* Quick Horizon Buttons inside Calendar Toolbar */}
                    <div className="flex items-center gap-1 bg-[#faf6ee] p-1 rounded-lg border border-[#d5c7b2]">
                      <span className="text-[11px] font-bold text-stone-600 px-1.5 hidden sm:inline">Horizon:</span>
                      {[7, 14, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setForecastDays(d)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            forecastDays === d
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                          }`}
                          title={`Forecast for ${d} days in calendar`}
                        >
                          {d} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month Navigation & Multi-Month Quick Tabs (Active in Month View) */}
                  {demandViewMode === 'calendar' && calendarScope === 'month' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Multi-month tabs if horizon spans more than 1 month */}
                      {monthsInForecast.length > 1 && (
                        <div className="flex items-center gap-1">
                          {monthsInForecast.map((mf) => {
                            const isSelected = calendarMonthDate && 
                              calendarMonthDate.getFullYear() === mf.date.getFullYear() && 
                              calendarMonthDate.getMonth() === mf.date.getMonth();
                            return (
                              <button
                                key={mf.key}
                                type="button"
                                onClick={() => setCalendarMonthDate(mf.date)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-stone-900 text-white shadow-2xs'
                                    : 'bg-[#faf6ee] text-stone-700 hover:text-stone-900 border border-[#d5c7b2]'
                                }`}
                              >
                                {mf.label} ({mf.count}d)
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleJumpToForecast}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#ded2bd] hover:bg-[#d4c6b0] text-stone-800 border border-[#c4b59e] transition-colors cursor-pointer"
                        title="Jump to forecast horizon start"
                      >
                        Start Date
                      </button>

                      <div className="flex items-center bg-[#faf6ee] rounded-lg border border-[#d5c7b2] p-0.5">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="w-7 h-7 flex items-center justify-center text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded transition-colors cursor-pointer"
                          title="Previous Month"
                        >
                          ‹
                        </button>
                        <span className="px-3 text-xs font-black font-mono text-stone-900 min-w-[125px] text-center">
                          {calendarMonthYearLabel}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="w-7 h-7 flex items-center justify-center text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded transition-colors cursor-pointer"
                          title="Next Month"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Horizon Summary Chip when in Horizon Scope */}
                  {demandViewMode === 'calendar' && calendarScope === 'horizon' && dailyForecast.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-700 bg-[#faf6ee] px-3 py-1.5 rounded-lg border border-[#d5c7b2]">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                      <span>{dailyForecast[0]?.display_label} – {dailyForecast[dailyForecast.length - 1]?.display_label}</span>
                      <span className="text-stone-400">•</span>
                      <span className="text-rose-700">{dailyForecast.length} Forecast Days Active</span>
                    </div>
                  )}
                </div>

                {/* 1. CALENDAR VIEW: Shows Predicted Demand Values Directly in Each Active Cell */}
                {demandViewMode === 'calendar' && (
                  <div className="space-y-3">
                    {/* Calendar Grid Container */}
                    <div className="bg-[#faf6ee] border border-[#d5c7b2] rounded-2xl p-4 sm:p-5 shadow-2xs">
                      {/* Weekday Column Headers (Monday to Sunday) */}
                      <div className="grid grid-cols-7 gap-2 sm:gap-2.5 mb-2.5 border-b border-[#e2d6c1] pb-2 text-center">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
                          <div key={dayName} className="text-xs font-mono font-bold text-stone-600 uppercase tracking-wider">
                            {dayName}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days Grid */}
                      <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                        {calendarDays.map((dayItem) => {
                          const normKey = normalizeDateStr(dayItem.dateStr || dayItem.date);
                          const forecastEntry = forecastDateMap.get(normKey);
                          const isForecastDay = Boolean(forecastEntry);
                          const isHovered = hoveredCalendarDay?.dateStr === normKey;

                          return (
                            <div
                              key={normKey}
                              onMouseEnter={() => isForecastDay && setHoveredCalendarDay({ ...dayItem, dateStr: normKey, entry: forecastEntry })}
                              onMouseLeave={() => setHoveredCalendarDay(null)}
                              className={`relative min-h-[96px] sm:min-h-[105px] p-2.5 rounded-xl transition-all flex flex-col justify-between select-none ${
                                isForecastDay
                                  ? 'bg-gradient-to-b from-rose-50/95 via-rose-100/60 to-rose-100/80 border-2 border-rose-400 hover:border-rose-600 hover:shadow-lg cursor-pointer ring-1 ring-rose-300/40'
                                  : dayItem.isCurrentMonth
                                  ? 'bg-[#f7f2e6]/70 border border-[#e5dccd] text-stone-500'
                                  : 'bg-[#f0ebe0]/40 border border-transparent text-stone-400'
                              } ${isHovered ? 'ring-2 ring-rose-600 shadow-xl scale-[1.03] z-20' : ''}`}
                            >
                              {/* Top row of date cell: Day Number + Month Name (if 1st of month) + Day badge + Pulse */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-baseline gap-1">
                                  <span className={`text-xs font-mono font-bold ${
                                    isForecastDay 
                                      ? 'text-rose-950 font-black text-sm' 
                                      : dayItem.isCurrentMonth 
                                      ? 'text-stone-800' 
                                      : 'text-stone-400'
                                  }`}>
                                    {dayItem.dayNumber}
                                  </span>
                                  {dayItem.isNewMonth && (
                                    <span className="text-[10px] font-bold uppercase text-stone-500 font-sans">
                                      ({dayItem.monthName})
                                    </span>
                                  )}
                                </div>

                                {isForecastDay && (
                                  <div className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-rose-200/90 text-rose-900 border border-rose-300 shadow-2xs">
                                      Day {forecastEntry.dayIndex}
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-rose-600 shadow-xs animate-pulse" title="AI Predicted Horizon Day"></span>
                                  </div>
                                )}
                              </div>

                              {/* Center of Cell: THE PREDICTED VALUE DIRECTLY VISIBLE */}
                              {isForecastDay ? (
                                <div className="my-auto py-1 text-center">
                                  <div className="text-base sm:text-lg font-black font-mono text-rose-700 tracking-tight leading-none">
                                    {forecastEntry.predicted_units}
                                  </div>
                                  <div className="text-[10px] font-bold text-rose-900/80 uppercase tracking-wide mt-0.5">
                                    units
                                  </div>
                                </div>
                              ) : (
                                <div className="h-9"></div>
                              )}

                              {/* Bottom row of Cell: Day of week name + Comparison indicator */}
                              {isForecastDay ? (
                                <div className="flex items-center justify-between text-[9px] font-mono text-stone-600 border-t border-rose-200/80 pt-1">
                                  <span className="font-semibold text-rose-950/70">{forecastEntry.day_name}</span>
                                  <span className={forecastEntry.predicted_units >= summary.daily_average ? 'text-rose-700 font-bold' : 'text-teal-700 font-bold'}>
                                    {forecastEntry.predicted_units >= summary.daily_average ? '▲ Above' : '▼ Normal'}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[9px] text-stone-400 font-mono text-right">
                                  {dayItem.date ? dayItem.date.toLocaleString('default', { weekday: 'short' }) : ''}
                                </div>
                              )}

                              {/* FLOATING HOVER TOOLTIP / POPOVER: Shows predicted units & detailed analytics on hover */}
                              {isHovered && isForecastDay && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 rounded-xl bg-stone-900/95 backdrop-blur-md text-white shadow-2xl border border-stone-700/90 z-30 pointer-events-none space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Forecast Day {forecastEntry.dayIndex} of {dailyForecast.length}
                                    </span>
                                    <span className="text-[10px] font-mono text-stone-400">
                                      {forecastEntry.day_name}
                                    </span>
                                  </div>

                                  <div>
                                    <div className="text-stone-300 text-xs font-semibold">
                                      {dayItem.date.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="mt-1.5 pt-1.5 border-t border-stone-800 flex items-baseline justify-between">
                                      <span className="text-xs text-stone-400 font-medium">Predicted Demand:</span>
                                      <span className="text-xl font-black font-mono text-rose-400">
                                        {forecastEntry.predicted_units} <span className="text-xs font-normal text-stone-400">units</span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between text-[10px]">
                                    <span className="text-stone-400">Series: {bloodGroup} • {component}</span>
                                    <span className={forecastEntry.predicted_units >= summary.daily_average ? 'text-rose-400 font-bold' : 'text-teal-400 font-bold'}>
                                      {forecastEntry.predicted_units >= summary.daily_average ? '▲ Above Daily Avg' : '▼ Below Daily Avg'}
                                    </span>
                                  </div>

                                  {/* Triangle arrow pointer */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Inspection Strip Beneath Calendar */}
                    <div className="p-3.5 rounded-xl bg-[#faf6ee] border border-[#d5c7b2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                      {hoveredCalendarDay && forecastDateMap.has(normalizeDateStr(hoveredCalendarDay.dateStr)) ? (
                        (() => {
                          const entry = forecastDateMap.get(normalizeDateStr(hoveredCalendarDay.dateStr));
                          return (
                            <>
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                                <span className="font-bold text-stone-900">
                                  {hoveredCalendarDay.date.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}:
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                  Forecast Day {entry.dayIndex} of {dailyForecast.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-stone-600 font-semibold">Predicted Demand:</span>
                                <span className="text-xl font-black font-mono text-rose-700">
                                  {entry.predicted_units} units
                                </span>
                                <span className="text-[11px] text-stone-500 font-mono">
                                  ({entry.predicted_units >= summary.daily_average ? '+' : ''}{(entry.predicted_units - summary.daily_average).toFixed(1)} vs daily avg)
                                </span>
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <div className="flex items-center gap-2.5 text-stone-600">
                          <Calendar className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>AI Calendar Horizon ({dailyForecast.length} Days Active):</strong> Values for all {dailyForecast.length} future days are shown directly in the cells (<strong className="text-rose-700">{dailyForecast[0]?.display_label} – {dailyForecast[dailyForecast.length - 1]?.display_label}</strong>). Hover any card for detailed metrics.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CARD GRID VIEW (Optional toggle) */}
                {demandViewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5 sm:gap-4">
                    {dailyForecast.map((p, idx) => (
                      <div 
                        key={p.forecast_date}
                        className="p-4 rounded-xl bg-[#faf6ee] border border-[#d5c7b2] hover:border-rose-400 hover:bg-[#fffdf9] transition-all text-center space-y-2 shadow-2xs"
                      >
                        <span className="text-[10px] font-extrabold uppercase text-stone-600 block tracking-wider">
                          Day {idx + 1} • {p.day_name}
                        </span>
                        <span className="text-xs font-bold text-stone-900 font-mono block">
                          {p.display_label}
                        </span>
                        <div className="pt-2 border-t border-[#dfd2bd]">
                          <span className="text-2xl font-black font-mono text-rose-700 block tracking-tight">
                            {p.predicted_units}
                          </span>
                          <span className="text-[10px] font-semibold text-stone-600">
                            predicted units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ML Contract Compliance Notice (Matching color pattern of Operational Buffer section) */}
                <div className="p-4 rounded-xl bg-stone-200/60 border border-stone-300/90 flex items-start gap-3.5 text-stone-700 text-xs font-medium leading-relaxed">
                  <Info className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">ML Contract Compliance:</strong> This card shows <em>ONLY</em> future predictions generated by the AI predictive model.
                    Current stock ({summary.usable_inventory} units) and past transactions are stored in separate operational tables and never mixed into future demand predictions.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 5. FORECAST GRAPH (Visually appealing time-series canvas) */}
          <div className="clinical-card p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(170,150,120,0.35)] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1 rounded-md bg-rose-600 text-white shadow-2xs">
                    <Activity className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-sm font-black text-stone-900 tracking-tight">
                    Interactive Time-Series Forecasting Graph ({bloodGroup} • {component})
                  </h3>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  Ground-truth historical records seamlessly transitioning into multi-step recursive machine learning predictions.
                </p>
              </div>

              {/* Legend & Summary Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-200/80 border border-stone-300/90 shadow-2xs">
                  <span className="w-3.5 h-1.5 bg-teal-600 rounded-full shadow-xs"></span>
                  <span className="text-stone-800 font-bold">{targetLabel}</span>
                  <span className="text-[10px] font-mono text-teal-800 font-bold">({chartData?.histAvg ?? 0} u avg)</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-100/90 border border-rose-300 shadow-2xs">
                  <span className="w-3.5 h-1 border-t-2 border-dashed border-rose-600"></span>
                  <span className="text-rose-900 font-extrabold">{predictedLabel}</span>
                  <span className="text-[10px] font-mono text-rose-700 font-bold">({chartData?.predAvg ?? 0} u avg)</span>
                </div>
                {summary.peak_day && (
                  <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-100/80 border border-amber-300 text-xs text-amber-900 font-bold">
                    <span>Peak:</span>
                    <span className="font-mono">{summary.peak_day} ({summary.peak_units}u)</span>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Visualizer Canvas */}
            {chartData && (
              <div className="relative overflow-x-auto bg-[#faf7f0] border border-[#d8ccb8] rounded-2xl p-4 shadow-inner">
                <svg
                  viewBox={`0 0 ${chartData.svgWidth} ${chartData.svgHeight}`}
                  className="w-full h-auto min-w-[720px] select-none"
                >
                  <defs>
                    {/* Teal Gradient for Historical Area */}
                    <linearGradient id="tealAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.32" />
                      <stop offset="65%" stopColor="#0d9488" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Rose Gradient for Forecast Area */}
                    <linearGradient id="roseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e11d48" stopOpacity="0.35" />
                      <stop offset="65%" stopColor="#e11d48" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Subtle Tint Gradient for AI Horizon Column */}
                    <linearGradient id="forecastZoneGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#e11d48" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0.02" />
                    </linearGradient>

                    {/* Path glow filter */}
                    <filter id="pathShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.12" />
                    </filter>
                  </defs>

                  {/* AI Horizon Background Tint Zone */}
                  {chartData.histCount > 0 && chartData.predCount > 0 && (() => {
                    const transX = chartData.coordinates[chartData.histCount - 1].x;
                    const zoneWidth = (chartData.svgWidth - chartData.padX) - transX;
                    return (
                      <g>
                        <rect
                          x={transX}
                          y={chartData.padY - 14}
                          width={zoneWidth}
                          height={chartData.innerH + 14}
                          fill="url(#forecastZoneGrad)"
                          rx="8"
                        />
                        <text
                          x={transX + zoneWidth / 2}
                          y={chartData.padY + 12}
                          textAnchor="middle"
                          className="text-[9px] font-black uppercase tracking-widest fill-rose-400/60 font-mono select-none pointer-events-none"
                        >
                          {chartData.predCount}-DAY AI PREDICTIVE HORIZON
                        </text>
                      </g>
                    );
                  })()}

                  {/* Horizontal Grid Lines & Y-Axis Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = chartData.padY + chartData.innerH * (1 - ratio);
                    const val = Math.round(chartData.maxVal * ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={chartData.padX}
                          y1={y}
                          x2={chartData.svgWidth - chartData.padX}
                          y2={y}
                          stroke="#e5ddce"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={chartData.padX - 10}
                          y={y + 3.5}
                          textAnchor="end"
                          className="text-[10px] fill-stone-500 font-mono font-semibold"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Y-axis Unit Label */}
                  <text
                    x={chartData.padX - 10}
                    y={chartData.padY - 8}
                    textAnchor="end"
                    className="text-[9px] fill-stone-500 font-mono uppercase font-bold"
                  >
                    Units
                  </text>

                  {/* Historical Area Fill */}
                  {chartData.actualAreaD && (
                    <path
                      d={chartData.actualAreaD}
                      fill="url(#tealAreaGrad)"
                    />
                  )}

                  {/* Forecast Area Fill */}
                  {chartData.predAreaD && (
                    <path
                      d={chartData.predAreaD}
                      fill="url(#roseAreaGrad)"
                    />
                  )}

                  {/* Transition Boundary Marker (Forecast Start) */}
                  {chartData.histCount > 0 && chartData.predCount > 0 && (() => {
                    const transX = chartData.coordinates[chartData.histCount - 1].x;
                    return (
                      <g>
                        <line
                          x1={transX}
                          y1={chartData.padY - 14}
                          x2={transX}
                          y2={chartData.bottomY}
                          stroke="#e11d48"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.8"
                        />
                        {/* FORECAST START Pill Badge */}
                        <g transform={`translate(${transX - 56}, ${chartData.padY - 30})`}>
                          <rect
                            width="112"
                            height="20"
                            rx="10"
                            fill="#ffe4e6"
                            stroke="#f43f5e"
                            strokeWidth="1.2"
                            className="shadow-2xs"
                          />
                          <text
                            x="56"
                            y="13"
                            textAnchor="middle"
                            className="text-[9px] font-black fill-rose-700 font-mono tracking-wider"
                          >
                            ✦ FORECAST START ➔
                          </text>
                        </g>
                      </g>
                    );
                  })()}

                  {/* Historical Smooth Curve */}
                  {chartData.actualPathD && (
                    <path
                      d={chartData.actualPathD}
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#pathShadow)"
                    />
                  )}

                  {/* Future Forecast Smooth Dashed Curve */}
                  {chartData.predPathD && (
                    <path
                      d={chartData.predPathD}
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth="3.5"
                      strokeDasharray="7 5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#pathShadow)"
                    />
                  )}

                  {/* Active Hover Crosshair Line */}
                  {hoveredPoint && (
                    <line
                      x1={hoveredPoint.x}
                      y1={chartData.padY}
                      x2={hoveredPoint.x}
                      y2={chartData.bottomY}
                      stroke={hoveredPoint.type === 'predicted' ? '#e11d48' : '#0d9488'}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.85"
                    />
                  )}

                  {/* Data Points on Curve */}
                  {chartData.coordinates.map((pt, i) => {
                    const isPred = pt.type === 'predicted';
                    const isHovered = hoveredPoint?.date === pt.date;

                    return (
                      <g key={pt.date + i} className="cursor-pointer">
                        {/* Outer Glow Halo for AI Predictions */}
                        {isPred && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 12 : 7}
                            fill="#e11d48"
                            fillOpacity={isHovered ? 0.35 : 0.16}
                            className="transition-all duration-200"
                          />
                        )}

                        {/* Main Dot directly ON the curve */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6.5 : isPred ? 4.5 : 3.5}
                          fill={isPred ? '#e11d48' : '#0d9488'}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2.5 : 2}
                          className="transition-all duration-150 shadow-xs"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />

                        {/* Predicted Value Floating Badge above each forecast point */}
                        {isPred && (
                          <g 
                            transform={`translate(${pt.x}, ${pt.y - 14})`}
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            className="pointer-events-none"
                          >
                            <rect
                              x="-17"
                              y="-11"
                              width="34"
                              height="14"
                              rx="4"
                              fill="#be123c"
                              className="shadow-2xs"
                            />
                            <text
                              x="0"
                              y="-1"
                              textAnchor="middle"
                              className="text-[9px] font-black fill-white font-mono"
                            >
                              {pt.value}
                            </text>
                          </g>
                        )}

                        {/* X-axis date labels */}
                        {(isPred || i % 2 === 0 || i === chartData.coordinates.length - 1) && (
                          <g>
                            {isPred && (
                              <circle
                                cx={pt.x}
                                cy={chartData.bottomY + 8}
                                r="2"
                                fill="#e11d48"
                              />
                            )}
                            <text
                              x={pt.x}
                              y={chartData.bottomY + 20}
                              textAnchor="middle"
                              className={`text-[10px] font-mono ${
                                isPred ? 'fill-rose-700 font-black' : 'fill-stone-600 font-semibold'
                              }`}
                            >
                              {pt.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Glassmorphic Tooltip */}
                {hoveredPoint && (
                  <div className="absolute top-4 right-6 p-3.5 rounded-xl bg-stone-900/95 backdrop-blur-md text-white text-xs shadow-2xl border border-stone-700/80 space-y-1.5 pointer-events-none font-mono z-20">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${hoveredPoint.type === 'predicted' ? 'bg-rose-500 animate-pulse' : 'bg-teal-400'}`}></span>
                      <strong className="text-white text-xs font-sans font-bold">{hoveredPoint.date} ({hoveredPoint.label})</strong>
                    </div>
                    <div className="text-stone-300 text-[11px] pt-1 border-t border-stone-800 flex items-center justify-between gap-4">
                      <span>{hoveredPoint.type === 'predicted' ? 'AI Prediction:' : 'Historical Requisition:'}</span>
                      <strong className="text-rose-400 font-black text-sm">{hoveredPoint.value} units</strong>
                    </div>
                    <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
                      <span>{hoveredPoint.type === 'predicted' ? 'Machine Learning Regressor' : 'Ground-Truth Database Record'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. Inventory Buffer vs ML Demand Segregation Note (Requirement 18) */}
          <div className="clinical-card p-4.5 bg-stone-100/70 border border-stone-300 space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-stone-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Operational Buffer Architecture & Segregation</span>
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              <strong>Potential Stock Gap</strong> = <code>Predicted 7-Day Requirement ({summary.total_expected} units) - Usable Inventory ({summary.usable_inventory} units) = {summary.potential_stock_gap} units</code>.
              This metric provides predictive advance notice for blood procurement logistics. It is labeled as a <em>Potential Gap</em> and is decoupled from actual confirmed inventory records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDemandForecastSection;
