// battery-ui/src/ReportsComponent.js
import React, { useState, useMemo } from 'react';
import {
    BarChart3, FileText, Download, PieChart, Calendar, ShieldCheck, Briefcase, Clock, FileDown, RotateCcw,
    FileSpreadsheet // Ensuring FileSpreadsheet is explicitly here
} from 'lucide-react';

// Helper: ReportOptionCard
const ReportOptionCard = ({ title, description, icon, theme, onClick, actionType }) => {
    let iconBgClass = theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600';
    if (actionType === 'export') {
        iconBgClass = theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600';
    } else if (actionType === 'destructive') {
        iconBgClass = theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600';
    }

    return (
    <button onClick={onClick} className={`p-4 rounded-lg shadow text-left w-full transition-all hover:shadow-xl border ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700/70 border-slate-700' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
        <div className="flex items-start space-x-3">
            <div className={`p-3 rounded-md ${iconBgClass}`}>
                {icon && React.cloneElement(icon, { size: 20 })}
            </div>
            <div>
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{title}</h4>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>{description}</p>
            </div>
        </div>
    </button>
    );
};


export default function ReportsComponent({
  batteries, // User's batteries (example battery filtered out by parent for most report data)
  theme,
  calculateMetrics,
  // dashboardStats, // Not directly used for display here, but parent handlers use it
  handleExportFleetHealthSummary,
  handleExportComplianceReport,
  handleExportInventoryReport,
  handleExportEolProjections,
  handleExportAllBatteries, // This handler in MainAppLayout already excludes the example
  handleResetAppData,
  // showAppNotification // Parent handlers will show notifications
}) {
  const [selectedReportView, setSelectedReportView] = useState('overview'); 

  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-200';
  const inputBgClass = theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'; 
  const tableHeaderBgClass = theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50';
  const buttonSelectedClass = theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white';
  const buttonDefaultClass = theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
  const primaryButtonClass = `px-4 py-2 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;

  const userBatteries = useMemo(() => batteries.filter(b => b.batteryId !== "uuid-example-marketplace-001"), [batteries]);

  const reportData = useMemo(() => {
    if (!userBatteries || userBatteries.length === 0) {
      return {
        totalBatteries: 0, totalCapacity: 0, averageHealth: 0,
        chemistryBreakdown: {}, healthDistribution: { excellent: 0, fair: 0, poor: 0 },
        ageDistribution: []
      };
    }
    const totalUserBatteries = userBatteries.length;
    const totalCapacity = userBatteries.reduce((sum, battery) => sum + parseFloat(battery.currentCapacity || 0), 0).toFixed(1);
    const sumSoH = userBatteries.reduce((sum, battery) => sum + (calculateMetrics(battery).stateOfHealth || 0), 0);
    const averageHealth = totalUserBatteries > 0 ? Math.round(sumSoH / totalUserBatteries) : 0;
    const chemistryBreakdown = userBatteries.reduce((acc, b) => ({ ...acc, [b.chemistry]: (acc[b.chemistry] || 0) + 1 }), {});
    let excellent = 0, fair = 0, poor = 0;
    userBatteries.forEach(b => {
        const soh = calculateMetrics(b).stateOfHealth;
        if (soh >= 80) excellent++; else if (soh >= 60) fair++; else poor++;
    });
    const healthDistribution = { excellent, fair, poor };
    const ageDistribution = userBatteries.map(b => {
        const metrics = calculateMetrics(b);
        return { id: b.batteryId || b.id, manufacturer: b.manufacturer, model: b.model, chemistry: b.chemistry, ageInYears: metrics.ageInYears, ageInMonths: Math.round(metrics.ageInYears * 12), maxExpectedAgeYears: metrics.maxExpectedAgeYears };
    }).sort((a,b) => b.ageInYears - a.ageInYears);
    return { totalBatteries: totalUserBatteries, totalCapacity, averageHealth, chemistryBreakdown, healthDistribution, ageDistribution };
  }, [userBatteries, calculateMetrics]);

  const renderOverview = () => (
    <div className={`p-0 md:p-6 rounded-lg ${theme === 'dark' ? '' : ''}`}>
        <h3 className={`text-xl font-semibold mb-4 ${textPrimaryClass}`}>Standard Reports & Data Actions</h3>
        <div className={`p-6 rounded-lg shadow ${cardBgClass} ${borderClass} mb-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReportOptionCard title="Fleet Health Summary (PDF)" description="Overall health, SoH distribution for your batteries." icon={<FileSpreadsheet />} theme={theme} onClick={handleExportFleetHealthSummary} actionType="export"/>
                <ReportOptionCard title="Compliance Report (PDF - Mock)" description="Mock transport compliance for your batteries." icon={<ShieldCheck />} theme={theme} onClick={handleExportComplianceReport} actionType="export"/>
                <ReportOptionCard title="Inventory Report (PDF)" description="Full list of your registered batteries and status." icon={<Briefcase />} theme={theme} onClick={handleExportInventoryReport} actionType="export"/>
                <ReportOptionCard title="End-of-Life Projections (PDF)" description="Estimated EoL timeline for your batteries." icon={<Clock />} theme={theme} onClick={handleExportEolProjections} actionType="export"/>
            </div>
        </div>
        <h3 className={`text-xl font-semibold mb-4 mt-8 ${textPrimaryClass}`}>Data Management</h3>
         <div className={`p-6 rounded-lg shadow ${cardBgClass} ${borderClass}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReportOptionCard title="Export All User Battery Data (PDF)" description={`Download all ${userBatteries.length} user battery records as a PDF.`} icon={<FileDown />} theme={theme} onClick={handleExportAllBatteries} actionType="export"/>
                <ReportOptionCard title="Reset Local Application Data" description="Clear local display data (excluding example). Does NOT affect server data." icon={<RotateCcw />} theme={theme} onClick={handleResetAppData} actionType="destructive"/>
            </div>
        </div>
    </div>
  );

  const renderSummaryReportView = () => ( // Renamed to avoid conflict
    <div className={`${cardBgClass} rounded-lg shadow`}>
      <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
        <h3 className={`text-xl font-semibold ${textPrimaryClass}`}>Battery Fleet Summary (In-App View)</h3>
        <button onClick={handleExportFleetHealthSummary} className={`${primaryButtonClass} flex items-center`}>
          <Download size={16} className="mr-2" /> Export as PDF
        </button>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-blue-50'} p-6 rounded-lg`}>
            <div className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mb-2`}><BarChart3 size={24} /></div>
            <div className={`text-2xl font-bold ${textPrimaryClass}`}>{reportData.totalBatteries}</div>
            <div className={textSecondaryClass}>Total User Batteries</div>
          </div>
          <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-green-50'} p-6 rounded-lg`}>
            <div className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-2`}><PieChart size={24} /></div>
            <div className={`text-2xl font-bold ${textPrimaryClass}`}>{reportData.averageHealth}%</div>
            <div className={textSecondaryClass}>Average Health (SoH)</div>
          </div>
          <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-purple-50'} p-6 rounded-lg`}>
            <div className={`${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} mb-2`}><FileText size={24} /></div>
            <div className={`text-2xl font-bold ${textPrimaryClass}`}>{reportData.totalCapacity} kWh</div>
            <div className={textSecondaryClass}>Total Current Capacity (User)</div>
          </div>
        </div>
        <h4 className={`text-lg font-semibold ${textPrimaryClass} mb-4`}>Chemistry Breakdown (User Batteries)</h4>
        <div className={`${inputBgClass} p-6 rounded-lg`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(reportData.chemistryBreakdown).map(([chemistry, count]) => (
              <div key={chemistry} className="flex justify-between items-center">
                <div><div className={`font-medium ${textPrimaryClass}`}>{chemistry}</div><div className={`text-sm ${textSecondaryClass}`}>{count} batteries</div></div>
                <div className={`text-lg font-bold ${textPrimaryClass}`}>{reportData.totalBatteries > 0 ? Math.round((count / reportData.totalBatteries) * 100) : 0}%</div>
              </div>
            ))}
            {Object.keys(reportData.chemistryBreakdown).length === 0 && <p className={textSecondaryClass}>No data available.</p>}
          </div>
        </div>
         <h4 className={`text-lg font-semibold ${textPrimaryClass} mt-8 mb-4`}>Health Distribution (User Batteries)</h4>
        <div className={`${inputBgClass} p-6 rounded-lg`}>
            <div className="flex flex-col sm:flex-row justify-around space-y-4 sm:space-y-0">
                <div className="text-center"><div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400':'text-green-600'}`}>{reportData.healthDistribution.excellent}</div><div className={textSecondaryClass}>Excellent (SoH ≥ 80%)</div></div>
                <div className="text-center"><div className={`text-2xl font-bold ${theme === 'dark' ? 'text-yellow-400':'text-yellow-600'}`}>{reportData.healthDistribution.fair}</div><div className={textSecondaryClass}>Fair (SoH 60-79%)</div></div>
                <div className="text-center"><div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400':'text-red-600'}`}>{reportData.healthDistribution.poor}</div><div className={textSecondaryClass}>Poor (SoH &lt; 60%)</div></div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderHealthReportView = () => ( // Renamed
    <div className={`${cardBgClass} rounded-lg shadow`}>
      <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
        <h3 className={`text-xl font-semibold ${textPrimaryClass}`}>User Battery Health Details (In-App View)</h3>
         <button onClick={handleExportInventoryReport} className={`${primaryButtonClass} flex items-center`}>
          <Download size={16} className="mr-2" /> Export Inventory as PDF
        </button>
      </div>
      <div className="p-6 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className={`${tableHeaderBgClass} text-sm`}>
            <tr>
              <th className={`py-3 px-4 text-left font-semibold ${textSecondaryClass}`}>Battery ID</th><th className={`py-3 px-4 text-left font-semibold ${textSecondaryClass}`}>Manufacturer / Model</th>
              <th className={`py-3 px-4 text-left font-semibold ${textSecondaryClass}`}>Health (SoH)</th><th className={`py-3 px-4 text-left font-semibold ${textSecondaryClass}`}>Cycle Count</th>
              <th className={`py-3 px-4 text-left font-semibold ${textSecondaryClass}`}>Capacity (Current/Orig)</th><th className={`py-3 px-4 text-left font-semibold ${textSecondaryClass}`}>Status</th>
            </tr>
          </thead>
          <tbody className={textSecondaryClass}>
            {userBatteries.map((battery) => {
              const metrics = calculateMetrics(battery); const soh = metrics.stateOfHealth;
              let healthStatusText = "Excellent", healthColorClass = theme === 'dark' ? 'bg-green-500' : 'bg-green-500', healthTextBadgeClass = theme === 'dark' ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800';
              if (soh < 60) { healthStatusText = "Poor"; healthColorClass = theme === 'dark' ? 'bg-red-500' : 'bg-red-500'; healthTextBadgeClass = theme === 'dark' ? 'bg-red-700 text-red-100' : 'bg-red-100 text-red-800'; }
              else if (soh < 80) { healthStatusText = "Fair"; healthColorClass = theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-500'; healthTextBadgeClass = theme === 'dark' ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-800';}
              return (
                <tr key={battery.batteryId || battery.id} className={`border-b ${borderClass} last:border-b-0 hover:${theme === 'dark' ? 'bg-slate-700/30' : 'bg-gray-50/50'}`}>
                  <td className={`py-3 px-4 ${textPrimaryClass}`}>{battery.batteryId || battery.id}</td><td className={`py-3 px-4 ${textPrimaryClass}`}>{battery.manufacturer} {battery.model}</td>
                  <td className="py-3 px-4"><div className="flex items-center"><div className={`w-16 ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'} rounded-full h-2 mr-2`}><div className={`h-2 rounded-full ${healthColorClass}`} style={{ width: `${soh}%` }}></div></div><span className={textPrimaryClass}>{soh}%</span></div></td>
                  <td className={`py-3 px-4 ${textPrimaryClass}`}>{battery.cycleCount}</td><td className={`py-3 px-4 ${textPrimaryClass}`}>{battery.currentCapacity} / {battery.originalCapacity} kWh</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${healthTextBadgeClass}`}>{healthStatusText}</span></td>
                </tr>);
            })}
            {userBatteries.length === 0 && <tr><td colSpan="6" className="py-4 px-4 text-center">No user battery data available.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLifecycleReportView = () => ( // Renamed
    <div className={`${cardBgClass} rounded-lg shadow`}>
      <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
        <h3 className={`text-xl font-semibold ${textPrimaryClass}`}>User Battery Lifecycle Analysis (In-App View)</h3>
        <button onClick={handleExportEolProjections} className={`${primaryButtonClass} flex items-center`}>
          <Download size={16} className="mr-2" /> Export EoL as PDF
        </button>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <h4 className={`text-lg font-semibold ${textPrimaryClass} mb-4`}>Battery Age Distribution (User Batteries)</h4>
          <div className="flex items-center space-x-2 mb-2"><Calendar size={18} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} /><span className={textSecondaryClass}>Based on manufacture date</span></div>
          <div className={`${inputBgClass} p-6 rounded-lg`}>
            <div className="space-y-4">
              {reportData.ageDistribution.map((battery) => (
                <div key={battery.id} className="flex flex-col">
                  <div className="flex justify-between mb-1"><span className={textPrimaryClass}>{battery.manufacturer} {battery.model}</span><span className={textSecondaryClass}>{battery.ageInMonths} months ({battery.ageInYears} yrs)</span></div>
                  <div className={`w-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'} rounded-full h-2.5`}><div className={`${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'} h-2.5 rounded-full`} style={{ width: `${Math.min(100, (battery.ageInYears / (battery.maxExpectedAgeYears || 10)) * 100)}%` }}></div></div>
                </div>))}
              {reportData.ageDistribution.length === 0 && <p className={textSecondaryClass}>No user battery data for age distribution.</p>}
            </div>
          </div>
        </div>
        <div>
          <h4 className={`text-lg font-semibold ${textPrimaryClass} mb-4`}>Lifecycle Events (Sample - Last 5 User Batteries, newest 3 events)</h4>
          <div className={`${inputBgClass} p-6 rounded-lg`}>
            <div className="space-y-6">
              {userBatteries.slice(-5).reverse().map((battery) => (
                <div key={battery.batteryId || battery.id} className={`pb-6 border-b ${borderClass} last:border-b-0 last:pb-0`}>
                  <div className={`font-medium ${textPrimaryClass} mb-2`}>{battery.manufacturer} {battery.model} (ID: {battery.batteryId || battery.id})</div>
                  {(battery.historyEvents && battery.historyEvents.length > 0) ? (
                    <div className="relative pl-6">
                      {battery.historyEvents.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,3).map((event, index, arr) => ( 
                        <div key={event.id || `${event.date}-${index}-${Math.random()}`} className="mb-4 relative">
                           <div className={`absolute left-0 top-0 mt-1.5 -ml-6 w-3 h-3 ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'} rounded-full z-10`}></div>
                           {index < arr.length - 1 && (<div className={`absolute left-0 top-1 mt-3 -ml-[1.1rem] w-0.5 h-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>)}
                          <div>
                            <p className={`font-medium ${textPrimaryClass}`}>{event.event} <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${theme === 'dark' ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>{event.type}</span></p>
                            <p className={`text-sm ${textSecondaryClass}`}>{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                          </div>
                        </div>))}
                       {battery.historyEvents.length > 3 && <p className={`text-sm ${textSecondaryClass}`}>...and {battery.historyEvents.length - 3} more events.</p>}
                    </div>
                  ) : (<p className={textSecondaryClass}>No history events recorded for this battery.</p>)}
                </div>))}
              {userBatteries.length === 0 && <p className={textSecondaryClass}>No user batteries to display events for.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold ${textPrimaryClass}`}>Reports Center</h2>
        <p className={textSecondaryClass}>View and export detailed reports about your battery fleet.</p>
      </div>
      <div className={`flex flex-wrap space-x-0 sm:space-x-2 mb-6 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'} w-full md:w-auto`}>
        {[
          { id: 'overview', label: 'Overview & Actions', icon: BarChart3 },
          { id: 'summary', label: 'Fleet Summary View', icon: PieChart },
          { id: 'health', label: 'Health Details View', icon: ShieldCheck },
          { id: 'lifecycle', label: 'Lifecycle View', icon: FileText },
        ].map(tab => (
            <button key={tab.id} onClick={() => setSelectedReportView(tab.id)}
                className={`px-2 sm:px-3 py-2 rounded-md flex items-center text-xs sm:text-sm font-medium flex-1 justify-center md:flex-none mb-1 sm:mb-0 ${selectedReportView === tab.id ? buttonSelectedClass : buttonDefaultClass}`}>
            <tab.icon size={16} className="mr-1 sm:mr-2" /> {tab.label}
            </button>
        ))}
      </div>
      {selectedReportView === 'overview' && renderOverview()}
      {selectedReportView === 'summary' && renderSummaryReportView()}
      {selectedReportView === 'health' && renderHealthReportView()}
      {selectedReportView === 'lifecycle' && renderLifecycleReportView()}
    </div>
  );
}
