// Налаштування: тема, резервна копія, скидання прогресу
(() => {
  const THEMES = [
    { value: 'system', label: 'Як у системі' },
    { value: 'light', label: 'Світла' },
    { value: 'dark', label: 'Темна' }
  ];

  // Відкрито як встановлений застосунок (а не у вкладці браузера)
  const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  function exportBackup() {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kompas-${Store.dayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    UI.toast('Резервну копію збережено');
  }

  async function importBackup(file) {
    try {
      Store.importJSON(await file.text());
      UI.applyTheme(Store.get().theme);
      UI.toast('Дані відновлено ✓');
      Router.refresh();
    } catch (e) {
      UI.toast(e instanceof SyntaxError ? 'Файл пошкоджений або не JSON' : e.message);
    }
  }

  Screens.settings = () => {
    const theme = Store.get().theme;
    return {
      title: 'Налаштування',
      html: `
        ${UI.pageHead({ title: 'Налаштування', back: '/home' })}

        <h2 class="section-title">Тема</h2>
        <div class="segmented" role="group" aria-label="Тема оформлення">
          ${THEMES.map(t => `
            <button type="button" data-theme-choice="${t.value}" aria-pressed="${t.value === theme}">${t.label}</button>
          `).join('')}
        </div>

        <h2 class="section-title">Застосунок</h2>
        <div class="card">
          ${installed()
            ? '<p>✓ Компас встановлено на цей пристрій.</p>'
            : App.installPrompt
              ? `<p class="muted">Встановіть Компас як застосунок: окрема іконка на екрані і робота без інтернету.</p>
                 <button type="button" class="btn btn-primary btn-block" data-action="install">${UI.icon('download')}Встановити застосунок</button>`
              : `<p class="muted">Щоб додати Компас на головний екран:</p>
                 <ul class="plain-list">
                   <li><strong>Android (Chrome):</strong> меню ⋮ → «Додати на головний екран» або «Встановити застосунок»</li>
                   <li><strong>iPhone (Safari):</strong> кнопка «Поділитися» → «На екран „Додому“»</li>
                 </ul>`}
        </div>

        <h2 class="section-title">Мої дані</h2>
        <div class="card">
          <p class="muted">Прогрес, цілі, промпти і проєкти зберігаються лише на цьому пристрої.
            Робіть резервну копію, щоб не втратити їх при очищенні браузера.</p>
          ${!Store.isAvailable() ? '<p style="color:var(--danger)">Зараз браузер не дозволяє зберігати дані.</p>' : ''}
          <div class="btn-row">
            <button type="button" class="btn btn-secondary btn-block" data-action="export">${UI.icon('download')}Зберегти резервну копію</button>
            <label class="btn btn-secondary btn-block">
              ${UI.icon('upload')}Відновити з файлу
              <input type="file" accept="application/json,.json" class="visually-hidden" data-action="import">
            </label>
          </div>
        </div>

        <button type="button" class="btn btn-danger btn-block" data-action="reset">Скинути всі дані</button>

        <p class="muted" style="text-align:center;font-size:14px">Компас · версія 1.0</p>`,

      mount(root) {
        root.querySelectorAll('[data-theme-choice]').forEach(btn => {
          btn.addEventListener('click', () => {
            const value = btn.dataset.themeChoice;
            Store.update(s => { s.theme = value; });
            UI.applyTheme(value);
            root.querySelectorAll('[data-theme-choice]').forEach(b => {
              b.setAttribute('aria-pressed', String(b === btn));
            });
          });
        });

        const install = root.querySelector('[data-action="install"]');
        if (install) {
          install.addEventListener('click', async () => {
            const prompt = App.installPrompt;
            if (!prompt) return;
            prompt.prompt();
            await prompt.userChoice;
            App.installPrompt = null;
            Router.refresh();
          });
        }

        root.querySelector('[data-action="export"]').addEventListener('click', exportBackup);

        root.querySelector('[data-action="import"]').addEventListener('change', e => {
          const file = e.target.files[0];
          if (file) importBackup(file);
          e.target.value = '';
        });

        root.querySelector('[data-action="reset"]').addEventListener('click', () => {
          if (!confirm('Видалити весь прогрес, цілі, промпти і проєкти? Цю дію не можна скасувати.')) return;
          Store.reset();
          UI.applyTheme(Store.get().theme);
          UI.toast('Усі дані скинуто');
          Router.refresh();
        });
      }
    };
  };
})();
