(function attachMusgoWateringDomain(globalScope) {
  function getWateringContext() {
    const getContext = globalScope.__musgoWateringDomainContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_watering_domain_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getWateringContext().getState();
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function today() {
    return formatLocalDate(new Date());
  }

  function parseLocalDate(dateStr) {
    const [year, month, day] = String(dateStr).split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  }

  function daysBetween(dateStr) {
    const then = parseLocalDate(dateStr);
    const now = new Date();
    then.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.floor((now - then) / 86400000);
  }

  function lastWatered(plant) {
    if (!plant.waterLog || plant.waterLog.length === 0) return null;
    return plant.waterLog.slice().sort().reverse()[0];
  }

  function needsWater(plant) {
    const lw = lastWatered(plant);
    if (!lw) return true;
    const days = daysBetween(lw);
    return days >= plant.freq;
  }

  function addDaysToDate(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function countPlantsNeedingWaterOnDate(dateStr) {
    const state = getStateSnapshot();
    const targetDate = parseLocalDate(dateStr);
    return state.plants.filter((plant) => {
      const lw = lastWatered(plant);
      if (!lw) return true;
      const lastDate = parseLocalDate(lw);
      const diffDays = Math.floor((targetDate - lastDate) / 86400000);
      return diffDays >= Number(plant.freq || 3);
    }).length;
  }

  function getDashboardWaterProjection(daysCount = 5) {
    const state = getStateSnapshot();
    const baseDate = parseLocalDate(today());
    const totalPlants = state.plants.length;
    return Array.from({ length: daysCount }, (_, index) => {
      const date = addDaysToDate(baseDate, index);
      const dateStr = formatLocalDate(date);
      const thirsty = countPlantsNeedingWaterOnDate(dateStr);
      return {
        dateStr,
        label: index === 0 ? 'Hoy' : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        watered: Math.max(totalPlants - thirsty, 0),
        thirsty,
        total: totalPlants,
      };
    });
  }

  globalScope.musgoWateringDomain = {
    formatLocalDate,
    today,
    parseLocalDate,
    daysBetween,
    lastWatered,
    needsWater,
    addDaysToDate,
    countPlantsNeedingWaterOnDate,
    getDashboardWaterProjection,
  };
})(window);
