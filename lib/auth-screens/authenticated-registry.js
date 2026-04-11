(function attachMusgoAuthenticatedRegistry(globalScope) {
  function getAuthenticatedRegistryContext() {
    const getContext = globalScope.__musgoAuthenticatedRegistryContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_authenticated_registry_context_unavailable');
    }
    return getContext();
  }

  function renderAuthenticatedAppShell(content) {
    return `
      <div class="authenticated-app-shell" data-app-shell="authenticated">
        <div class="authenticated-app-shell-content">
          ${content}
        </div>
      </div>
    `;
  }

  function renderAuthenticatedRouteContent() {
    const { state, routeRenderers, fallbackRenderer } = getAuthenticatedRegistryContext();
    const renderer = routeRenderers[state.currentView] || fallbackRenderer;
    return renderer();
  }

  function renderAuthenticatedExperience() {
    return renderAuthenticatedAppShell(renderAuthenticatedRouteContent());
  }

  globalScope.musgoAuthenticatedRegistry = {
    renderAuthenticatedAppShell,
    renderAuthenticatedRouteContent,
    renderAuthenticatedExperience,
  };
})(window);
