export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getReportRange(type, selectedDate) {
  if (!isValidDateString(selectedDate)) throw new Error('A valid date in YYYY-MM-DD format is required.');
  const [year, month, day] = selectedDate.split('-').map(Number);
  if (type === 'daily') return { startDate: selectedDate, endDate: selectedDate };
  if (type === 'month-to-date') return {
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: selectedDate,
  };
  if (type === 'monthly') {
    const firstOfSelected = new Date(Date.UTC(year, month - 1, 1));
    const previousMonthEnd = new Date(firstOfSelected.getTime() - 86400000);
    const previousMonthStart = new Date(Date.UTC(previousMonthEnd.getUTCFullYear(), previousMonthEnd.getUTCMonth(), 1));
    return {
      startDate: previousMonthStart.toISOString().slice(0, 10),
      endDate: previousMonthEnd.toISOString().slice(0, 10),
    };
  }
  throw new Error('Unknown report type.');
}
