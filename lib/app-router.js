(function attachMusgoRouter(globalScope) {
  function createMusgoRouter({
    getState,
    createPlantDraft,
    createSectionDraft,
    getPreviousMainView,
  }) {
    const MAIN_VIEWS = ['dashboard', 'plants', 'scan', 'spaces', 'profile'];
    const PUBLIC_VIEWS = ['landing', 'auth'];
    const AUTHENTICATED_VIEWS = ['dashboard', 'plants', 'scan', 'spaces', 'profile', 'thirstyPlants', 'plantDetail', 'plantCreate', 'editSpace'];
    const ROUTABLE_VIEWS = [...PUBLIC_VIEWS, ...MAIN_VIEWS];
    const VIEW_PATHS = {
      landing: '/',
      auth: '/login',
      dashboard: '/dashboard',
      plants: '/plants',
      scan: '/scanner',
      spaces: '/spaces',
      profile: '/profile',
    };

    function getStateSnapshot() {
      return getState();
    }

    function isPublicView(view) {
      return PUBLIC_VIEWS.includes(view);
    }

    function isAuthenticatedView(view) {
      return AUTHENTICATED_VIEWS.includes(view);
    }

    function isAuthenticatedMainView(view = getStateSnapshot().currentView) {
      return MAIN_VIEWS.includes(view);
    }

    function getCurrentExperience() {
      const state = getStateSnapshot();
      if (state.splashVisible) return 'splash';
      if (isPublicView(state.currentView)) return 'public';
      if (isAuthenticatedView(state.currentView)) return 'authenticated';
      return 'authenticated';
    }

    function shouldShowPublicExperience() {
      return getCurrentExperience() === 'public';
    }

    function shouldShowAuthenticatedExperience() {
      return getCurrentExperience() === 'authenticated';
    }

    function shouldShowTopbar() {
      const state = getStateSnapshot();
      return state.splashVisible || shouldShowPublicExperience() || isAuthenticatedMainView();
    }

    function shouldUseDesktopSidebarLayout() {
      const state = getStateSnapshot();
      return window.innerWidth >= 1100 && shouldShowAuthenticatedExperience() && isAuthenticatedMainView() && !state.splashVisible;
    }

    function getNormalizedPathname(pathname = window.location.pathname) {
      const rawPath = String(pathname || '/').trim() || '/';
      const safePath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      if (safePath.length > 1 && safePath.endsWith('/')) {
        return safePath.slice(0, -1);
      }
      return safePath;
    }

    function hasPendingAuthCallbackParams() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));

      return [
        'code',
        'access_token',
        'refresh_token',
        'provider_token',
        'provider_refresh_token',
        'error',
        'error_code',
        'error_description',
      ].some((key) => searchParams.has(key) || hashParams.has(key));
    }

    function getPathForView(view) {
      const state = getStateSnapshot();

      if (view === 'thirstyPlants') {
        return '/dashboard/thirsty';
      }
      if (view === 'plantCreate') {
        return '/plants/new';
      }
      if (view === 'plantDetail') {
        return state.detailPlantId ? `/plants/${encodeURIComponent(state.detailPlantId)}` : '/plants';
      }
      if (view === 'editSpace') {
        if (state.editingSectionId) {
          return `/spaces/${encodeURIComponent(state.editingSectionId)}/edit`;
        }
        return '/spaces/new';
      }
      return VIEW_PATHS[view] || null;
    }

    function resolvePathToView(pathname = window.location.pathname) {
      const normalizedPath = getNormalizedPathname(pathname);

      if (normalizedPath === '/') {
        return { view: 'landing', canonicalPath: '/' };
      }
      if (normalizedPath === '/login') {
        return { view: 'auth', canonicalPath: '/login' };
      }
      if (normalizedPath === '/dashboard') {
        return { view: 'dashboard', canonicalPath: '/dashboard' };
      }
      if (normalizedPath === '/dashboard/thirsty') {
        return { view: 'thirstyPlants', canonicalPath: '/dashboard/thirsty' };
      }
      if (normalizedPath === '/plants') {
        return { view: 'plants', canonicalPath: '/plants' };
      }
      if (normalizedPath === '/plants/new') {
        return { view: 'plantCreate', canonicalPath: '/plants/new' };
      }
      const plantDetailMatch = normalizedPath.match(/^\/plants\/([^/]+)$/);
      if (plantDetailMatch) {
        return {
          view: 'plantDetail',
          canonicalPath: normalizedPath,
          params: {
            plantId: decodeURIComponent(plantDetailMatch[1]),
          },
        };
      }
      if (normalizedPath === '/scanner') {
        return { view: 'scan', canonicalPath: '/scanner' };
      }
      if (normalizedPath === '/spaces') {
        return { view: 'spaces', canonicalPath: '/spaces' };
      }
      if (normalizedPath === '/spaces/new') {
        return { view: 'editSpace', canonicalPath: '/spaces/new', params: { mode: 'create' } };
      }
      const editSpaceMatch = normalizedPath.match(/^\/spaces\/([^/]+)\/edit$/);
      if (editSpaceMatch) {
        return {
          view: 'editSpace',
          canonicalPath: normalizedPath,
          params: {
            mode: 'edit',
            sectionId: decodeURIComponent(editSpaceMatch[1]),
          },
        };
      }
      if (normalizedPath === '/profile') {
        return { view: 'profile', canonicalPath: '/profile' };
      }

      return { view: 'landing', canonicalPath: '/' };
    }

    function hydrateRouteState(resolvedRoute) {
      const state = getStateSnapshot();
      const route = resolvedRoute || resolvePathToView(window.location.pathname);
      const params = route.params || {};

      if (route.view === 'plantDetail') {
        const plantId = params.plantId || null;
        state.detailPlantId = plantId;
        const plant = state.plants.find((item) => item.id === plantId);
        state.detailDraft = plant
          ? {
              name: plant.name || '',
              freq: Number(plant.freq) || 3,
              section: plant.section || '',
            }
          : null;
        state.calPlantId = plantId;
        state.calYear = new Date().getFullYear();
        state.calMonth = new Date().getMonth();
        return;
      }

      if (route.view === 'plantCreate') {
        if (!state.screenPlantDraft) {
          state.screenPlantDraft = createPlantDraft();
        }
        state.detailPlantId = null;
        state.detailDraft = null;
        return;
      }

      if (route.view === 'editSpace') {
        const isEditMode = params.mode === 'edit' && params.sectionId;
        if (isEditMode) {
          const section = state.sections.find((item) => item.id === params.sectionId);
          state.editingSectionId = params.sectionId;
          state.screenSectionDraft = section ? createSectionDraft(section) : null;
          return;
        }

        state.editingSectionId = null;
        if (!state.screenSectionDraft) {
          state.screenSectionDraft = createSectionDraft();
        }
        return;
      }

      if (route.view === 'thirstyPlants') {
        return;
      }

      state.detailPlantId = null;
      state.detailDraft = null;

      if (route.view !== 'plantCreate') {
        state.screenPlantDraft = null;
      }

      if (route.view !== 'editSpace') {
        state.screenSectionDraft = null;
        state.editingSectionId = null;
      }
    }

    function syncHistoryPath(pathname, { replace = false } = {}) {
      const nextPath = getNormalizedPathname(pathname);
      const currentPath = getNormalizedPathname(window.location.pathname);

      if (nextPath === currentPath) {
        if (replace && window.history.state?.path !== nextPath) {
          window.history.replaceState({ path: nextPath }, '', nextPath);
        }
        return;
      }

      if (replace) {
        try {
          window.history.replaceState({ path: nextPath }, '', nextPath);
        } catch (error) {
          if (window.location.protocol !== 'file:') {
            window.location.replace(nextPath);
          }
          return;
        }
        if (getNormalizedPathname(window.location.pathname) !== nextPath && window.location.protocol !== 'file:') {
          window.location.replace(nextPath);
        }
        return;
      }

      try {
        window.history.pushState({ path: nextPath }, '', nextPath);
      } catch (error) {
        if (window.location.protocol !== 'file:') {
          window.location.assign(nextPath);
        }
        return;
      }

      if (getNormalizedPathname(window.location.pathname) !== nextPath && window.location.protocol !== 'file:') {
        window.location.assign(nextPath);
      }
    }

    function applyRouteFromLocation(options = {}, navigateToView) {
      const {
        renderView = true,
        scroll = false,
        replaceHistory = true,
      } = options;
      const resolvedRoute = resolvePathToView(window.location.pathname);

      hydrateRouteState(resolvedRoute);

      navigateToView(resolvedRoute.view, {
        renderView,
        scroll,
        updateHistory: false,
      });

      if (replaceHistory && resolvedRoute.canonicalPath && !hasPendingAuthCallbackParams()) {
        syncHistoryPath(resolvedRoute.canonicalPath, { replace: true });
      }
    }

    function getAuthRedirectView() {
      const state = getStateSnapshot();
      if (!state.auth.ready) return null;

      if (state.auth.configured && !state.auth.user && !isPublicView(state.currentView)) {
        return 'auth';
      }

      if (state.auth.user && isPublicView(state.currentView)) {
        return getPreviousMainView('dashboard');
      }

      return null;
    }

    function reconcileNavigationWithAuth(navigateToView) {
      const redirectView = getAuthRedirectView();
      if (!redirectView) return false;

      navigateToView(redirectView, {
        trackMainView: false,
        scroll: false,
        replaceHistory: true,
      });
      return true;
    }

    return {
      MAIN_VIEWS,
      PUBLIC_VIEWS,
      AUTHENTICATED_VIEWS,
      ROUTABLE_VIEWS,
      VIEW_PATHS,
      isPublicView,
      isAuthenticatedView,
      isAuthenticatedMainView,
      getCurrentExperience,
      shouldShowPublicExperience,
      shouldShowAuthenticatedExperience,
      shouldShowTopbar,
      shouldUseDesktopSidebarLayout,
      getNormalizedPathname,
      getPathForView,
      resolvePathToView,
      hydrateRouteState,
      syncHistoryPath,
      applyRouteFromLocation,
      getAuthRedirectView,
      reconcileNavigationWithAuth,
    };
  }

  globalScope.createMusgoRouter = createMusgoRouter;
})(window);
