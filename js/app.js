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
  Router.add('/tools/picker', Screens.picker, 'tools');
  Router.add('/tool/:id', Screens.tool, 'tools');
  Router.add('/prompts', Screens.prompts, 'prompts');
  Router.add('/prompts/guide', Screens.promptGuide, 'prompts');
  Router.add('/prompts/new', Screens.promptForm, 'prompts');
  Router.add('/prompts/edit/:id', Screens.promptForm, 'prompts');
  Router.add('/projects', Screens.projects, 'projects');
  Router.add('/projects/path', Screens.projectPath, 'projects');
  Router.add('/projects/new', Screens.projectForm, 'projects');
  Router.add('/project/:id', Screens.projectForm, 'projects');
  Router.add('/settings', Screens.settings);

  Router.start();
})();
