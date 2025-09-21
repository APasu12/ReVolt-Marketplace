// src/AnalyticsComponent.js
import React, { useState, useMemo } from 'react';
import { BarChart3, Download, ArrowUpDown, Calendar, Battery, Activity, Zap } from 'lucide-react';
import {
    LineChart as RechartsLineChart, Line,
    BarChart as RechartsBarChart, Bar,
    PieChart as RechartsPieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AnalyticsComponent({ batteries, calculateMetrics, theme }) {
  // --- Step 1: Call ALL hooks unconditionally at the top level ---
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [selectedView, setSelectedView] = useState('capacity'); // 'capacity' or 'health'

  // Memoized calculations. These need to be robust to potentially invalid props
  // if those props are used before the validation checks leading to early returns.
  // However, for clarity, we'll compute them and then do prop validation.
  // If props are invalid, the early returns will prevent these memoized values from being used in broken ways.

  const totalBatteries = useMemo(() => {
    return Array.isArray(batteries) ? batteries.length : 0;
  }, [batteries]);

  const performanceTrendData = useMemo(() => {
    if (typeof calculateMetrics !== 'function' || !Array.isArray(batteries)) {
        return []; // Return empty if props are invalid for this calculation
    }
    const months = selectedTimeframe === '3months' ? 3 : selectedTimeframe === '6months' ? 6 : 12;
    const data = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      
      let avgHealthForMonth = 95 - (i * 0.8) - (Math.random() * 2);
      let avgCapacityForMonth = 70 - (i * 0.5) - Math.random();

      if (batteries.length > 0) {
        avgHealthForMonth = batteries.reduce((sum, b) => {
            const metrics = calculateMetrics(b);
            const pastSoH = Math.min(100, (metrics?.stateOfHealth || 0) + (i * 0.5) + Math.random());
            return sum + pastSoH;
        }, 0) / batteries.length;

        avgCapacityForMonth = batteries.reduce((sum, b) => {
            const originalCapacity = parseFloat(b.originalCapacity) || 0;
            const metrics = calculateMetrics(b);
            const pastSoH = Math.min(100, (metrics?.stateOfHealth || 0) + (i * 0.5) + Math.random());
            return sum + (originalCapacity * (pastSoH / 100));
        },0) / batteries.length;
      }
      
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        health: parseFloat(avgHealthForMonth.toFixed(1)),
        capacity: parseFloat(avgCapacityForMonth.toFixed(1))
      });
    }
    return data;
  }, [selectedTimeframe, batteries, calculateMetrics]);
  
  const chemistryDistributionData = useMemo(() => {
    if (!Array.isArray(batteries)) return [];
    const acc = {};
    batteries.forEach(battery => {
      const chem = battery.chemistry || "Unknown";
      acc[chem] = (acc[chem] || 0) + 1;
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [batteries]);

  const ageDistributionData = useMemo(() => {
    if (!Array.isArray(batteries)) return [];
    const ageGroups = { '0-6m': 0, '7-12m': 0, '1-2y': 0, '2-5y':0, '>5y': 0 };
    batteries.forEach(battery => {
      if (!battery.manufactureDate) return;
      const manufactureDate = new Date(battery.manufactureDate);
      const today = new Date();
      const ageInMonths = Math.max(0, (today.getFullYear() - manufactureDate.getFullYear()) * 12 + (today.getMonth() - manufactureDate.getMonth()));
      
      if (ageInMonths <= 6) ageGroups['0-6m']++;
      else if (ageInMonths <= 12) ageGroups['7-12m']++;
      else if (ageInMonths <= 24) ageGroups['1-2y']++;
      else if (ageInMonths <= 60) ageGroups['2-5y']++;
      else ageGroups['>5y']++;
    });
    return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  }, [batteries]);

  const healthDistributionPieData = useMemo(() => {
    if (typeof calculateMetrics !== 'function' || !Array.isArray(batteries)) return [];
    const healthGroups = { 'Excellent (90+)': 0, 'Good (80-89)': 0, 'Fair (60-79)': 0, 'Poor (<60)': 0 };
    batteries.forEach(battery => {
      const metrics = calculateMetrics(battery);
      const soh = metrics?.stateOfHealth || 0;
      
      if (soh >= 90) healthGroups['Excellent (90+)']++;
      else if (soh >= 80) healthGroups['Good (80-89)']++;
      else if (soh >= 60) healthGroups['Fair (60-79)']++;
      else healthGroups['Poor (<60)']++;
    });
    return Object.entries(healthGroups).map(([name, value]) => ({ name, value }));
  }, [batteries, calculateMetrics]);

  const avgSoH = useMemo(() => {
    if (typeof calculateMetrics !== 'function' || !Array.isArray(batteries) || totalBatteries === 0) return 0;
    return Math.round(batteries.reduce((sum, b) => sum + (calculateMetrics(b)?.stateOfHealth || 0), 0) / totalBatteries);
  }, [batteries, calculateMetrics, totalBatteries]);

  const totalCurrentCapacity = useMemo(() => {
    if (!Array.isArray(batteries)) return "0.0";
    return batteries.reduce((sum, battery) => sum + (parseFloat(battery.currentCapacity) || 0), 0).toFixed(1);
  }, [batteries]);


  // --- Step 2: Perform prop validation and return early if necessary ---
  if (typeof calculateMetrics !== 'function') {
    return <div className={`p-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Error: calculateMetrics prop is missing or not a function.</div>;
  }
  if (!Array.isArray(batteries)) {
    return <div className={`p-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Error: batteries prop is not a valid array.</div>;
  }
  
  // Theme-aware color palettes for charts (can be defined after hooks and validation)
  const PIE_CHART_COLORS = {
    light: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'],
    dark: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#818CF8', '#F472B6']
  };
  const currentPieColors = PIE_CHART_COLORS[theme] || PIE_CHART_COLORS.light;

  // Theming classes
  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textHeaderClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSubHeaderClass = theme === 'dark' ? 'text-slate-200' : 'text-gray-700';
  const textMutedClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const textValueClass = theme === 'dark' ? 'text-slate-50' : 'text-gray-900';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-200';
  const inputBgClass = theme === 'dark' ? `bg-slate-700 ${borderClass} text-slate-200 focus:ring-blue-500 focus:border-blue-500` : `bg-white ${borderClass} text-gray-700 focus:ring-blue-500 focus:border-blue-500`;
  const buttonSecondaryClass = theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100';
  const buttonActiveClass = theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e5e7eb';
  const chartTextColor = theme === 'dark' ? '#94a3b8' : '#6b7280';
  const chartLineColor = theme === 'dark' ? '#60A5FA' : "#3B82F6";
  const chartActiveDotStrokeColor = theme === 'dark' ? '#93C5FD' : '#2563EB';

  // Return "No Data" message if, after validation, there are no batteries
  if (totalBatteries === 0) {
    return (
      <div className={`${cardBgClass} rounded-lg shadow p-8 text-center`}>
        <BarChart3 size={48} className={`mx-auto ${theme === 'dark' ? 'text-slate-600' : 'text-gray-400'} mb-4`} />
        <h3 className={`text-lg font-medium ${textSubHeaderClass} mb-2`}>No Data Available</h3>
        <p className={`${textMutedClass} mb-6`}>Register batteries to see analytics and insights here.</p>
      </div>
    );
  }

  // --- Step 3: Main component render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-3xl font-semibold ${textHeaderClass}`}>Battery Fleet Analytics</h2>
        <p className={textMutedClass}>Advanced insights and trends for your battery fleet.</p>
      </div>

      {/* Performance Trends Line Chart */}
      <div className={`${cardBgClass} rounded-lg shadow`}>
        <div className={`p-4 sm:p-6 border-b ${borderClass} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
          <h3 className={`text-xl font-semibold ${textSubHeaderClass}`}>Performance Trends</h3>
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className={`py-2 px-3 border rounded-md text-sm flex-grow sm:flex-grow-0 ${inputBgClass}`}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <div className={`flex border ${borderClass} rounded-md p-0.5`}>
              <button
                onClick={() => setSelectedView('capacity')}
                className={`px-3 py-1 text-sm rounded-l-md ${selectedView === 'capacity' ? buttonActiveClass : buttonSecondaryClass}`}
              >
                Capacity
              </button>
              <button
                onClick={() => setSelectedView('health')}
                className={`px-3 py-1 text-sm rounded-r-md ${selectedView === 'health' ? buttonActiveClass : buttonSecondaryClass}`}
              >
                Health
              </button>
            </div>
            <button className={`px-3 py-2 border ${borderClass} ${buttonSecondaryClass} rounded-md flex items-center text-sm`}>
              <Download size={16} className="mr-1.5" /> Export
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={performanceTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 12 }} />
              <YAxis 
                tick={{ fill: chartTextColor, fontSize: 12 }}
                label={{ 
                  value: selectedView === 'capacity' ? 'Avg. Capacity (kWh)' : 'Avg. Health (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: chartTextColor,
                  fontSize: 12,
                  dy: selectedView === 'capacity' ? 60 : 50,
                  dx: 5
                }}
                width={70} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: '0.5rem' }} 
                itemStyle={{ color: chartTextColor }}
                labelStyle={{ color: chartTextColor, fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ color: chartTextColor, fontSize: 12, paddingTop: '10px' }}/>
              <Line 
                type="monotone" 
                dataKey={selectedView} 
                stroke={chartLineColor} 
                strokeWidth={2} 
                activeDot={{ r: 6, stroke: chartActiveDotStrokeColor, strokeWidth: 2, fill: chartLineColor }} 
                dot={{ r: 3, fill: chartLineColor }}
                name={selectedView === 'capacity' ? 'Avg. Capacity' : 'Avg. State of Health'}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardBgClass} rounded-lg shadow`}>
          <div className={`p-4 border-b ${borderClass}`}>
            <h3 className={`text-lg font-semibold ${textSubHeaderClass}`}>Chemistry Distribution</h3>
            <p className={`text-sm ${textMutedClass}`}>Types across your fleet</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={chemistryDistributionData}
                  cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" fill="#8884d8"
                  paddingAngle={2} dataKey="value" labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {chemistryDistributionData.map((entry, index) => (
                    <Cell key={`cell-chem-${index}`} fill={currentPieColors[index % currentPieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: '0.5rem' }} itemStyle={{ color: chartTextColor }} labelStyle={{ color: chartTextColor, fontWeight: 'bold' }}/>
                <Legend wrapperStyle={{ color: chartTextColor, fontSize: 12, paddingTop: '10px' }}/>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className={`${cardBgClass} rounded-lg shadow`}>
          <div className={`p-4 border-b ${borderClass}`}>
            <h3 className={`text-lg font-semibold ${textSubHeaderClass}`}>Health Distribution</h3>
            <p className={`text-sm ${textMutedClass}`}>SoH categories</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie data={healthDistributionPieData} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" fill="#8884d8" paddingAngle={2} dataKey="value" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}> {/* Changed label to show name for this pie */}
                  {healthDistributionPieData.map((entry, index) => (
                    <Cell key={`cell-health-${index}`} fill={currentPieColors[index % currentPieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: '0.5rem' }} itemStyle={{ color: chartTextColor }} labelStyle={{ color: chartTextColor, fontWeight: 'bold' }}/>
                <Legend wrapperStyle={{ color: chartTextColor, fontSize: 12, paddingTop: '10px' }}/>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className={`${cardBgClass} rounded-lg shadow`}>
          <div className={`p-4 border-b ${borderClass}`}>
            <h3 className={`text-lg font-semibold ${textSubHeaderClass}`}>Age Distribution</h3>
            <p className={`text-sm ${textMutedClass}`}>Battery age categories</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={ageDistributionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 12 }} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: chartTextColor, fontSize: 12, dy: 20, dx: 5 }} width={50}/>
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: '0.5rem' }} itemStyle={{ color: chartTextColor }} labelStyle={{ color: chartTextColor, fontWeight: 'bold' }}/>
                <Legend wrapperStyle={{ color: chartTextColor, fontSize: 12, paddingTop: '10px' }}/>
                <Bar dataKey="value" name="Batteries">
                  {ageDistributionData.map((entry, index) => (
                    <Cell key={`cell-age-${index}`} fill={currentPieColors[index % currentPieColors.length]} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className={`${cardBgClass} rounded-lg shadow`}>
        <div className={`p-6 border-b ${borderClass}`}>
          <h3 className={`text-xl font-semibold ${textSubHeaderClass}`}>Fleet Summary & Insights</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`border ${borderClass} rounded-lg p-4`}> <div className="flex items-center mb-3"> <Battery size={18} className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mr-2`} /> <h4 className={`font-medium ${textSubHeaderClass}`}>Total Batteries</h4> </div> <p className={`text-3xl font-bold ${textValueClass} mb-1`}>{totalBatteries}</p> </div>
            <div className={`border ${borderClass} rounded-lg p-4`}> <div className="flex items-center mb-3"> <Activity size={18} className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mr-2`} /> <h4 className={`font-medium ${textSubHeaderClass}`}>Avg. State of Health</h4> </div> <p className={`text-3xl font-bold ${textValueClass} mb-1`}> {avgSoH}% </p> </div>
            <div className={`border ${borderClass} rounded-lg p-4`}> <div className="flex items-center mb-3"> <Zap size={18} className={`${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} mr-2`} /> <h4 className={`font-medium ${textSubHeaderClass}`}>Total Current Capacity</h4> </div> <p className={`text-3xl font-bold ${textValueClass} mb-1`}> {totalCurrentCapacity} <span className={`text-sm ${textMutedClass}`}>kWh</span> </p> </div>
            <div className={`border ${borderClass} rounded-lg p-4`}> <div className="flex items-center mb-3"> <ArrowUpDown size={18} className={`${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'} mr-2`} /> <h4 className={`font-medium ${textSubHeaderClass}`}>Avg. Degradation Rate</h4> </div> <p className={`text-3xl font-bold ${textValueClass} mb-1`}> {totalBatteries > 0 ? '0.8%' : 'N/A'}  <span className={`text-sm ${textMutedClass}`}> per month (sim.)</span> </p> <p className={`text-xs ${textMutedClass}`}>Simulated average based on fleet data.</p> </div>
            <div className={`border ${borderClass} rounded-lg p-4`}> <div className="flex items-center mb-3"> <Calendar size={18} className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} mr-2`} /> <h4 className={`font-medium ${textSubHeaderClass}`}>Avg. Estimated Lifetime</h4> </div> <p className={`text-3xl font-bold ${textValueClass} mb-1`}> {totalBatteries > 0 ? '8.4' : 'N/A'}  <span className={`text-sm ${textMutedClass}`}> years (sim.)</span> </p> <p className={`text-xs ${textMutedClass}`}>Simulated average until 60% capacity.</p> </div>
          </div>
        </div>
      </div>
    </div>
  );
}