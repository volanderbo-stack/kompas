// Розділ «Промпти для Claude Code»: бібліотека, гайд, власні промпти
(() => {
  const MINE = 'Мої';
  // Вибраний фільтр живе, поки відкрита сторінка
  const view = { filter: 'all', query: '' };

  const custom = () => Store.get().prompts.custom;
  const favorites = () => Store.get().prompts.favorites;
  const categories = () => [...new Set(DATA.prompts.map(p => p.category))];
  const allPrompts = () => [...DATA.prompts, ...custom().map(p => ({ ...p, custom: true }))];

  function matches(p) {
    const f = view.filter;
    if (f === 'fav' && !favorites().includes(p.id)) return false;
    if (f === 'mine' && !p.custom) return false;
    if (!['all', 'fav', 'mine'].includes(f) && p.category !== f) return false;
    const q = view.query.trim().toLowerCase();
    return !q || `${p.title} ${p.text}`.toLowerCase().includes(q);
  }

  function card(p) {
    const fav = favorites().includes(p.id);
    const extra = `
      <button type="button" class="icon-btn star-btn" data-fav="${UI.esc(p.id)}" aria-pressed="${fav}"
        aria-label="${fav ? 'Прибрати з улюблених' : 'Додати в улюблені'}">${UI.icon('star')}</button>
      ${p.custom ? `<a class="icon-btn" href="#/prompts/edit/${UI.esc(p.id)}" aria-label="Редагувати">${UI.icon('edit')}</a>` : ''}`;
    return UI.promptCard({ title: p.title, text: p.text, meta: p.custom ? `${p.category} · мій` : p.category, extra });
  }

  function listHtml() {
    const items = allPrompts().filter(matches);
    if (items.length) return items.map(card).join('');
    const empty = view.filter === 'fav'
      ? 'Тут з\'являться промпти, позначені ★.'
      : view.filter === 'mine' ? 'Ви ще не додали власних промптів.' : 'Нічого не знайдено.';
    return `<p class="card muted">${empty}</p>`;
  }

  function chips() {
    const list = [
      { value: 'all', label: 'Усі' },
      { value: 'fav', label: '★ Улюблені' },
      { value: 'mine', label: MINE },
      ...categories().map(c => ({ value: c, label: c }))
    ];
    return list.map(c => `
      <button type="button" class="chip" data-filter="${UI.esc(c.value)}" aria-pressed="${c.value === view.filter}">${UI.esc(c.label)}</button>
    `).join('');
  }

  // ===== Бібліотека =====
  Screens.prompts = () => {
    const s = DATA.sections.prompts;
    return {
      title: s.title,
      html: `
        ${UI.pageHead({ title: s.title, subtitle: s.subtitle })}

        <a class="card card-link picker-card" href="#/prompts/guide">
          <span class="label">${UI.icon('prompts')} Як писати промпти</span>
          <p>Структура з 5 частин, приклад «погано / добре», принципи і корисні команди Claude Code.</p>
        </a>

        <input type="search" class="field" placeholder="Пошук промпту" aria-label="Пошук промпту"
          value="${UI.esc(view.query)}" data-search>
        <div class="chips" role="group" aria-label="Категорії" data-chips>${chips()}</div>

        <a class="btn btn-primary btn-block" href="#/prompts/new">${UI.icon('plus')}Додати свій промпт</a>

        <div class="list" data-list>${listHtml()}</div>`,

      mount(root) {
        const listEl = root.querySelector('[data-list]');
        const chipsEl = root.querySelector('[data-chips]');
        const redraw = () => { listEl.innerHTML = listHtml(); };

        UI.mountCopy(root);

        root.querySelector('[data-search]').addEventListener('input', UI.debounce(e => {
          view.query = e.target.value;
          redraw();
        }, 200));

        chipsEl.addEventListener('click', e => {
          const chip = e.target.closest('[data-filter]');
          if (!chip) return;
          view.filter = chip.dataset.filter;
          chipsEl.querySelectorAll('[data-filter]').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
          redraw();
        });

        listEl.addEventListener('click', e => {
          const btn = e.target.closest('[data-fav]');
          if (!btn) return;
          const id = btn.dataset.fav;
          const on = !favorites().includes(id);
          Store.update(s => {
            s.prompts.favorites = on ? [...s.prompts.favorites, id] : s.prompts.favorites.filter(x => x !== id);
          });
          if (view.filter === 'fav') {
            redraw();
          } else {
            btn.setAttribute('aria-pressed', String(on));
            btn.setAttribute('aria-label', on ? 'Прибрати з улюблених' : 'Додати в улюблені');
          }
          UI.toast(on ? 'Додано в улюблені ★' : 'Прибрано з улюблених');
        });
      }
    };
  };

  // ===== Як писати промпти =====
  Screens.promptGuide = () => {
    const g = DATA.promptGuide;
    return {
      title: 'Як писати промпти',
      html: `
        ${UI.pageHead({ title: 'Як писати промпти', subtitle: 'Для Claude Code і не тільки', back: '/prompts' })}

        <h2 class="section-title">Структура хорошого промпту</h2>
        <ol class="steps">
          ${g.structure.map((s, i) => `
            <li class="card step">
              <span class="step-num" aria-hidden="true">${i + 1}</span>
              <div class="step-body">
                <h3>${UI.esc(s.title)}</h3>
                <p class="muted">${UI.esc(s.what)}</p>
                <p class="step-example">${UI.esc(s.example)}</p>
              </div>
            </li>`).join('')}
        </ol>

        <h2 class="section-title">Погано / добре</h2>
        <div class="card card-bad">
          <span class="label">✗ Погано</span>
          <p>${UI.esc(g.bad)}</p>
          <p class="muted small-note">Незрозуміло, для кого, на чому, що означає «круто» і коли робота завершена.</p>
        </div>
        ${UI.promptCard({ title: '✓ Добре', text: g.good, meta: 'Мета, контекст, обмеження, «готово», формат' })}

        <h2 class="section-title">Принципи</h2>
        <div class="list">
          ${g.principles.map(p => `
            <div class="card principle">
              <h3>${UI.esc(p.title)}</h3>
              <p class="muted">${UI.esc(p.text)}</p>
            </div>`).join('')}
        </div>

        <h2 class="section-title">Корисні команди Claude Code</h2>
        <div class="card">
          <dl class="commands">
            ${g.commands.map(c => `<dt><kbd>${UI.esc(c.key)}</kbd></dt><dd>${UI.esc(c.what)}</dd>`).join('')}
          </dl>
        </div>`,

      mount(root) {
        UI.mountCopy(root);
      }
    };
  };

  // ===== Новий / редагування власного промпту =====
  Screens.promptForm = ({ id }) => {
    const existing = id ? custom().find(p => p.id === id) : null;
    if (id && !existing) return null;
    const p = existing || { title: '', category: MINE, text: '' };
    const cats = [MINE, ...categories()];

    return {
      title: existing ? 'Редагувати промпт' : 'Новий промпт',
      html: `
        ${UI.pageHead({ title: existing ? 'Редагувати промпт' : 'Новий промпт', back: '/prompts' })}

        <form class="card form" data-form novalidate>
          <label class="field-label" for="p-title">Назва</label>
          <input id="p-title" name="title" class="field" maxlength="80" value="${UI.esc(p.title)}" placeholder="Наприклад: Додати сторінку налаштувань">

          <label class="field-label" for="p-cat">Категорія</label>
          <select id="p-cat" name="category" class="field">
            ${cats.map(c => `<option ${c === p.category ? 'selected' : ''}>${UI.esc(c)}</option>`).join('')}
          </select>

          <label class="field-label" for="p-text">Текст промпту</label>
          <textarea id="p-text" name="text" class="field" rows="10" placeholder="Мета: …&#10;Контекст: …&#10;Обмеження: …&#10;Готово, коли: …">${UI.esc(p.text)}</textarea>
          <p class="muted small-note">Порада: позначайте [квадратними дужками] місця, які щоразу змінюються.</p>
          <p class="form-error" hidden aria-live="polite"></p>

          <button type="submit" class="btn btn-primary btn-block">Зберегти</button>
          ${existing ? '<button type="button" class="btn btn-danger btn-block" data-delete>Видалити промпт</button>' : ''}
        </form>`,

      mount(root) {
        const form = root.querySelector('[data-form]');
        const error = form.querySelector('.form-error');

        form.addEventListener('submit', e => {
          e.preventDefault();
          const title = form.elements.title.value.trim();
          const text = form.elements.text.value.trim();
          const category = form.elements.category.value;
          if (!title || !text) {
            error.textContent = 'Заповніть назву і текст промпту.';
            error.hidden = false;
            (title ? form.elements.text : form.elements.title).focus();
            return;
          }
          Store.update(s => {
            if (existing) {
              Object.assign(s.prompts.custom.find(x => x.id === id), { title, text, category });
            } else {
              s.prompts.custom.push({ id: `my-${Date.now().toString(36)}`, title, text, category });
            }
          });
          view.filter = 'mine';
          view.query = '';
          UI.toast('Промпт збережено ✓');
          Router.go('/prompts');
        });

        const del = form.querySelector('[data-delete]');
        if (del) {
          del.addEventListener('click', () => {
            if (!confirm('Видалити цей промпт?')) return;
            Store.update(s => {
              s.prompts.custom = s.prompts.custom.filter(x => x.id !== id);
              s.prompts.favorites = s.prompts.favorites.filter(x => x !== id);
            });
            UI.toast('Промпт видалено');
            Router.go('/prompts');
          });
        }
      }
    };
  };
})();
