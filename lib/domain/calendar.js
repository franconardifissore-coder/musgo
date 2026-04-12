(function attachMusgoCalendarDomain(globalScope) {
  const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function getCalendarContext() {
    const getContext = globalScope.__musgoCalendarDomainContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_calendar_domain_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getCalendarContext().getState();
  }

  function getCalendarMonthData(plant, year, month) {
    const { today, parseLocalDate, formatLocalDate, lastWatered } = globalScope.musgoWateringDomain;
    const todayStr = today();
    const todayDate = parseLocalDate(todayStr);
    const wateredSet = new Set((plant.waterLog || []).filter((dateStr) => {
      const date = parseLocalDate(dateStr);
      return date.getFullYear() === year && date.getMonth() === month;
    }).map((dateStr) => parseLocalDate(dateStr).getDate()));

    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const lw = lastWatered(plant);
    const projectedWaterDays = new Set();
    if (lw) {
      let cursor = parseLocalDate(lw);
      cursor.setHours(0, 0, 0, 0);
      const monthEnd = new Date(year, month + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      while (cursor <= monthEnd) {
        cursor.setDate(cursor.getDate() + plant.freq);
        const isFutureOccurrence = cursor > todayDate;
        if (isFutureOccurrence && cursor.getFullYear() === year && cursor.getMonth() === month) {
          projectedWaterDays.add(cursor.getDate());
        }
      }
    }

    const cells = [];
    for (let i = 0; i < startDow; i++) {
      cells.push({ empty: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cellStr = formatLocalDate(cellDate);
      const isToday = cellStr === todayStr;
      const isWatered = wateredSet.has(day);
      const isProjected = projectedWaterDays.has(day);
      const isPastOrToday = cellDate <= todayDate;
      cells.push({
        day,
        dateStr: cellStr,
        isToday,
        isWatered,
        isProjected,
        canToggle: isPastOrToday,
      });
    }

    return { cells };
  }

  function renderCalendarCells(cells, clickHandlerName) {
    return cells.map((cell) => {
      if (cell.empty) return '<div class="cal-day empty"></div>';
      const classes = ['cal-day'];
      if (cell.isToday) classes.push('today');
      if (cell.isWatered) classes.push('watered');
      if (!cell.isWatered && cell.isProjected) classes.push('future-water');
      if (cell.canToggle) classes.push('clickable-past');
      return `
      <div class="${classes.join(' ')}" onclick="${clickHandlerName}('${cell.dateStr}', ${cell.isWatered})">
        <div class="cal-day-num">${cell.day}</div>
      </div>
    `;
    }).join('');
  }

  function renderInlinePlantCalendar(plant) {
    const state = getStateSnapshot();
    const { cells } = getCalendarMonthData(plant, state.calYear, state.calMonth);
    return `
    <div class="detail-calendar-card">
      <div class="detail-calendar-head">
        <div class="detail-calendar-month">${MONTH_NAMES[state.calMonth]} ${state.calYear}</div>
        <div class="detail-calendar-nav">
          <button type="button" onclick="calPrevMonth()">‹</button>
          <button type="button" onclick="calNextMonth()">›</button>
        </div>
      </div>
      <div class="detail-calendar-grid">
        <div class="cal-weekdays">
          <div class="cal-weekday">L</div>
          <div class="cal-weekday">M</div>
          <div class="cal-weekday">X</div>
          <div class="cal-weekday">J</div>
          <div class="cal-weekday">V</div>
          <div class="cal-weekday">S</div>
          <div class="cal-weekday">D</div>
        </div>
        <div class="cal-days">
          ${renderCalendarCells(cells, 'detailCalendarDayClick')}
        </div>
      </div>
    </div>
  `;
  }

  function calPrevMonth() {
    const { render } = getCalendarContext();
    const state = getStateSnapshot();
    state.calMonth--;
    if (state.calMonth < 0) {
      state.calMonth = 11;
      state.calYear--;
    }
    render();
  }

  function calNextMonth() {
    const { render } = getCalendarContext();
    const state = getStateSnapshot();
    state.calMonth++;
    if (state.calMonth > 11) {
      state.calMonth = 0;
      state.calYear++;
    }
    render();
  }

  async function calDayClick(dateStr) {
    const { parseLocalDate, today } = globalScope.musgoWateringDomain;
    const { saveState, render, syncPlantToCloud, showToast } = getCalendarContext();
    const state = getStateSnapshot();
    const plant = state.plants.find((item) => item.id === state.calPlantId);
    if (!plant) return;

    const clickDate = parseLocalDate(dateStr);
    const todayDate = parseLocalDate(today());
    if (clickDate > todayDate) return;

    if (!plant.waterLog) plant.waterLog = [];
    const existingIndex = plant.waterLog.indexOf(dateStr);

    if (existingIndex >= 0) {
      plant.waterLog.splice(existingIndex, 1);
    } else {
      plant.waterLog.push(dateStr);
      plant.waterLog.sort();
    }

    saveState();
    render();

    try {
      await syncPlantToCloud(plant);
    } catch (error) {
      showToast(existingIndex >= 0
        ? '⚠️ Quitamos el riego localmente, pero no pudimos sincronizarlo'
        : '⚠️ El riego se guardó localmente, pero no pudimos sincronizarlo');
      return;
    }

    const clicked = parseLocalDate(dateStr);
    const label = dateStr === today() ? 'hoy' : `el ${clicked.getDate()}/${clicked.getMonth() + 1}`;
    showToast(existingIndex >= 0 ? `↩️ Riego quitado ${label}` : `💧 Riego añadido ${label}`);
  }

  async function detailCalendarDayClick(dateStr, alreadyWatered) {
    const state = getStateSnapshot();
    state.calPlantId = state.detailPlantId;
    await calDayClick(dateStr, alreadyWatered);
  }

  globalScope.musgoCalendarDomain = {
    MONTH_NAMES,
    getCalendarMonthData,
    renderCalendarCells,
    renderInlinePlantCalendar,
    calPrevMonth,
    calNextMonth,
    calDayClick,
    detailCalendarDayClick,
  };

  globalScope.calPrevMonth = calPrevMonth;
  globalScope.calNextMonth = calNextMonth;
  globalScope.detailCalendarDayClick = detailCalendarDayClick;
})(window);
