// Запуск застосунку
(() => {
  UI.applyTheme(Store.get().theme);
  UI.darkQuery.addEventListener('change', () => {
    if (Store.get().theme === 'system') UI.applyTheme('system');
  });

  Router.add('/home', Screens.home);
  Router.add('/sens', Screens.sens, 'sens');
  Router.add('/sens/:id', Screens.reflection, 'sens', true);
  Router.add('/goal', Screens.goal, 'sens');
  Router.add('/people', Screens.people, 'people');
  Router.add('/people/:topic', Screens.topic, 'people');
  Router.add('/lesson/:id', Screens.lesson, 'people', true);
  Router.add('/tools', Screens.tools, 'tools');
  Router.add('/prompts', Screens.prompts, 'prompts');
  Router.add('/projects', Screens.projects, 'projects');
  Router.add('/settings', Screens.settings);

  Router.start();
})();
