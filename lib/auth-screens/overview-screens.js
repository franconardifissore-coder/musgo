(function attachMusgoOverviewScreens(globalScope) {
  function getOverviewScreenContext() {
    const getContext = globalScope.__musgoAuthenticatedScreenContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_authenticated_screen_context_unavailable');
    }
    return getContext();
  }

  function renderDashboardScreen() {
    const {
      state,
      renderProtectedScreenState,
      needsWater,
      getDashboardWaterProjection,
    } = getOverviewScreenContext();

    const protectedState = renderProtectedScreenState({
      title: 'Tu vista diaria',
      subtitle: 'Mira tu jardín y las acciones que tienes que realizar.',
      loadingMessage: 'Estamos preparando el resumen de hoy para tu colección.',
      authMessage: 'Inicia sesión para ver un resumen diario de tu jardín y las próximas acciones de riego.',
    });
    if (protectedState) return protectedState;

    const thirstyPlants = state.plants.filter(needsWater);
    const thirstyCount = thirstyPlants.length;
    const projection = getDashboardWaterProjection(5);
    const maxTotal = Math.max(...projection.map((item) => item.total), 1);

    return `
      <section class="screen">
        <div class="screen-intro">
          <h1 class="screen-title">Tu vista diaria</h1>
          <p class="screen-subtitle">Mira tu jardín y las acciones que tienes que realizar.</p>
        </div>
        <div class="dashboard-layout">
          <div class="dashboard-summary-card">
            <div class="view-empty-title" style="font-size:3.1rem;line-height:1;color:#345D4C;">${thirstyCount}</div>
            <div class="view-empty-copy" style="margin-top:0;font-size:1.05rem;color:#191c1c;">Plantas que necesitan riego hoy</div>
            <button class="dashboard-summary-button" type="button" onclick="openThirstyPlantsView()">Ver todo</button>
          </div>
          <div class="dashboard-chart-card">
            <div class="dashboard-chart-legend">
              <div class="dashboard-chart-legend-item">
                <img src="/resources/Riegos/riego-full.svg" alt="">
                <span>Plantas regadas</span>
              </div>
              <div class="dashboard-chart-legend-item">
                <img src="/resources/Riegos/riego-partial.svg" alt="">
                <span>Necesitan riego</span>
              </div>
            </div>
            <div class="dashboard-bars">
              ${projection.map((item) => {
                const wateredHeight = item.total ? (item.watered / maxTotal) * 162 : 0;
                const thirstyHeight = item.total ? (item.thirsty / maxTotal) * 162 : 0;
                return `
                  <div class="dashboard-bar-col">
                    <div class="dashboard-bar-stack">
                      <div class="dashboard-bar-segment thirsty" style="height:${thirstyHeight}px;"></div>
                      <div class="dashboard-bar-segment watered" style="height:${wateredHeight}px;"></div>
                    </div>
                    <div class="dashboard-bar-label">${item.label}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderThirstyPlantsScreen() {
    const {
      state,
      needsWater,
      renderPlantTiles,
      renderBackButton,
      renderCardState,
    } = getOverviewScreenContext();

    const thirstyPlants = state.plants.filter(needsWater);
    const tiles = renderPlantTiles(thirstyPlants);

    return `
      <section class="screen">
        <div class="screen-head">
          ${renderBackButton('Vista diaria', 'dashboard')}
        </div>
        <div class="screen-intro">
          <h1 class="screen-title">Plantas con sed</h1>
          <p class="screen-subtitle">Estas plantas necesitan un riego hoy</p>
        </div>
        ${thirstyPlants.length ? `
          <div class="plants-grid-mobile">
            ${tiles}
          </div>
        ` : `
          ${renderCardState({
            icon: '💧',
            title: 'Nada para regar hoy',
            message: 'Tu jardín está al día por ahora. Vuelve más tarde para revisar las próximas acciones.',
            actionLabel: 'Volver al dashboard',
            action: "window.navigateToView('dashboard')"
          })}
        `}
      </section>
    `;
  }

  function renderProfileScreen() {
    const {
      state,
      escapeHtml,
      renderProtectedScreenState,
      getUserName,
      getUserInitial,
    } = getOverviewScreenContext();

    const protectedState = renderProtectedScreenState({
      title: 'Perfil',
      subtitle: 'Tu cuenta y el resumen de tu colección.',
      loadingMessage: 'Estamos preparando tu perfil.',
      authMessage: 'Inicia sesión para acceder a tu perfil y al resumen de tu colección.',
    });
    if (protectedState) return protectedState;

    const user = state.auth.user;
    const avatarUrl = user?.user_metadata?.avatar_url || '';
    return `
      <section class="screen">
        <div class="screen-intro">
          <h1 class="screen-title">Perfil</h1>
          <p class="screen-subtitle">Tu cuenta y el resumen de tu colección.</p>
        </div>
        <div class="profile-card">
          <div class="profile-head">
            <div class="profile-avatar-lg">
              ${avatarUrl ? `<img src="${avatarUrl}" alt="${escapeHtml(getUserName(user))}">` : escapeHtml(getUserInitial(user))}
            </div>
            <div class="profile-name">${escapeHtml(getUserName(user))}</div>
            <div class="profile-email">${escapeHtml(user?.email || '')}</div>
          </div>
          <div class="profile-panel-body">
            <div class="profile-stats">
              <div class="profile-stat">
                <div class="profile-stat-label">Plantas</div>
                <div class="profile-stat-value">${state.plants.length}</div>
              </div>
              <div class="profile-stat">
                <div class="profile-stat-label">Espacios</div>
                <div class="profile-stat-value">${state.sections.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="screen-actions profile-actions">
          <button class="btn-secondary" type="button" onclick="handleSignOut()">Cerrar sesión</button>
        </div>
        <div class="legal-links">
          <a href="/terminos-y-condiciones">Terminos y condiciones</a>
          <a href="/privacidad">Politica de privacidad</a>
        </div>
      </section>
    `;
  }

  globalScope.musgoOverviewScreens = {
    renderDashboardScreen,
    renderThirstyPlantsScreen,
    renderProfileScreen,
  };
})(window);
