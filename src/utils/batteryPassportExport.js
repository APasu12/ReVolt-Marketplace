import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// ./batteryPassportExport.js
export const exportBatteryPassport = (battery, metricsCalculator) => {
  const metrics = metricsCalculator(battery);
  console.log("Exporting Battery Passport for:", battery.id);
  const passportData = {
    batteryInfo: battery,
    calculatedMetrics: metrics,
    timestamp: new Date().toISOString(),
  };
  const filename = `BatteryPassport_${battery.id || 'data'}.json`;
  const jsonStr = JSON.stringify(passportData, null, 2);
  
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  alert(`Battery Passport for ${battery.manufacturer} ${battery.model} (ID: ${battery.id}) has been 'exported' as ${filename}. Check your browser's downloads or console for data.`);
};