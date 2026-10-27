// Стан застосунку, спільний для екранів
const App = { installPrompt: null };

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
  Router.add('/videos', Screens.videos, 'tools');
  Router.add('/prompts', Screens.prompts, 'prompts');
  Router.add('/prompts/guide', Screens.promptGuide, 'prompts');
  Router.add('/prompts/new', Screens.promptForm, 'prompts');
  Router.add('/prompts/edit/:id', Screens.promptForm, 'prompts');
  Router.add('/projects', Screens.projects, 'projects');
  Router.add('/projects/path', Screens.projectPath, 'projects');
  Router.add('/projects/new', Screens.projectForm, 'projects');
  Router.add('/project/:id', Screens.projectForm, 'projects');
  Router.add('/budget', Screens.budget);
  Router.add('/budget/menu', Screens.menuPrompt);
  Router.add('/budget/compare', Screens.comparePrompt);
  Router.add('/time', Screens.time);
  Router.add('/time/steps', Screens.stepsPrompt);
  Router.add('/time/plan', Screens.plans);
  Router.add('/time/plan/:id', Screens.plan);
  Router.add('/settings', Screens.settings);

  Router.start();

  // Офлайн-режим. Service worker не працює, якщо файл відкрито з диска (file://)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const hadWorker = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadWorker) UI.toast('Застосунок оновлено — перезавантажте сторінку');
    });
  }

  // Кнопка «Встановити» в налаштуваннях (Chrome і Edge на Android та ПК)
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    App.installPrompt = event;
    if (Router.current() === '/settings') Router.refresh();
  });
  window.addEventListener('appinstalled', () => {
    App.installPrompt = null;
    UI.toast('Компас встановлено ✓');
  });
})();
