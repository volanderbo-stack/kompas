// Розділ «Сенс»: роздуми з віршем і питанням, «Моя мета»
(() => {
  const list = () => DATA.reflections;
  const today = () => list()[UI.dayNumber() % list().length];
  const isRead = id => Boolean(Store.get().progress.reflections[id]?.done);

  // ===== Список роздумів =====
  Screens.sens = () => {
    const s = DATA.sections.sens;
    const goal = Store.get().goal;
    const readCount = list().filter(r => isRead(r.id)).length;
    const yearDone = goal.year.filter(g => g.done).length;
    const t = today();

    return {
      title: s.title,
      html: `
        ${UI.pageHead({ title: s.title, subtitle: s.subtitle })}

        <a class="card goal-card" href="#/goal">
          <span class="label">${UI.icon('target')} Моя мета</span>
          ${goal.life
            ? `<p class="goal-preview">${UI.esc(goal.life)}</p>`
            : '<p>Запишіть, заради чого ви живете і що хочете зробити цього року.</p>'}
          <span class="muted">${goal.year.length
            ? `Цілі на рік: виконано ${yearDone} з ${goal.year.length}`
            : 'Цілей на рік ще немає'} →</span>
        </a>

        ${t ? `
          <h2 class="section-title">Роздум на сьогодні</h2>
          ${UI.listItem({ href: `/sens/${t.id}`, title: t.title, subtitle: t.verse.ref, iconName: 'sens', done: isRead(t.id) })}
        ` : ''}

        <h2 class="section-title">Усі роздуми · прочитано ${readCount} з ${list().length}</h2>
        <div class="list">
          ${list().map((r, i) => UI.listItem({
            href: `/sens/${r.id}`,
            title: r.title,
            subtitle: r.verse.ref,
            lead: i + 1,
            done: isRead(r.id)
          })).join('')}
        </div>`
    };
  };

  // ===== Один роздум =====
  Screens.reflection = ({ id }) => {
    const index = list().findIndex(r => r.id === id);
    if (index < 0) return null;
    const r = list()[index];
    const prev = list()[index - 1];
    const next = list()[index + 1];
    const saved = Store.get().progress.reflections[id] || {};
    Store.markActiveDay();

    return {
      title: r.title,
      html: `
        ${UI.pageHead({ title: r.title, back: '/sens' })}

        <figure class="card verse-card">
          ${r.verse.text
            ? `<blockquote>${UI.esc(r.verse.text)}</blockquote>`
            : '<blockquote class="muted">Текст вірша ще не додано.</blockquote>'}
          <figcaption>${UI.esc(r.verse.ref)} · переклад Огієнка</figcaption>
        </figure>

        <div class="prose">${UI.richText(r.text)}</div>

        <div class="card question-card">
          <span class="label">Питання до себе</span>
          <p class="question">${UI.esc(r.question)}</p>
          <label class="field-label" for="note">Мої думки <span class="muted">(бачите тільки ви)</span></label>
          <textarea id="note" class="field" rows="4" placeholder="Запишіть відповідь…">${UI.esc(saved.note || '')}</textarea>
          <span class="save-hint muted" aria-live="polite"></span>
        </div>

        <button type="button" class="btn btn-block" data-action="read"></button>

        <div class="pager">
          ${prev ? `<a class="btn btn-secondary" href="#/sens/${prev.id}">${UI.icon('chevronLeft')}Попередній</a>` : '<span></span>'}
          ${next ? `<a class="btn btn-secondary" href="#/sens/${next.id}">Наступний${UI.icon('chevronRight')}</a>` : ''}
        </div>`,

      mount(root) {
        const entry = s => (s.progress.reflections[id] ||= {});

        UI.autosave(root.querySelector('#note'), root.querySelector('.save-hint'),
          value => Store.update(s => { entry(s).note = value; }));

        const readBtn = root.querySelector('[data-action="read"]');
        const drawReadBtn = () => {
          const done = isRead(id);
          readBtn.className = `btn btn-block ${done ? 'btn-secondary' : 'btn-primary'}`;
          readBtn.innerHTML = done ? `${UI.icon('check')}Прочитано` : 'Позначити прочитаним';
        };
        drawReadBtn();

        readBtn.addEventListener('click', () => {
          const done = !isRead(id);
          Store.update(s => {
            entry(s).done = done;
            entry(s).date = Store.dayKey();
          });
          if (done) UI.toast('Прочитано ✓');
          drawReadBtn();
        });
      }
    };
  };

  // ===== Моя мета =====
  function goalItems() {
    const goals = Store.get().goal.year;
    if (!goals.length) return '<p class="muted">Додайте першу ціль нижче.</p>';
    return goals.map(g => `
      <div class="check-item${g.done ? ' is-done' : ''}">
        <label class="check-item-main">
          <input type="checkbox" data-goal-toggle="${g.id}" ${g.done ? 'checked' : ''}>
          <span>${UI.esc(g.text)}</span>
        </label>
        <button type="button" class="icon-btn" data-goal-delete="${g.id}" aria-label="Видалити ціль">${UI.icon('trash')}</button>
      </div>`).join('');
  }

  Screens.goal = () => {
    const goal = Store.get().goal;
    const year = new Date().getFullYear();

    return {
      title: 'Моя мета',
      html: `
        ${UI.pageHead({ title: 'Моя мета', subtitle: 'Бачите тільки ви. Зберігається на цьому пристрої.', back: '/sens' })}

        <div class="card">
          <label class="label" for="life-goal">Мета мого життя</label>
          <p class="muted">Заради чого я живу? Ким хочу бути для Бога, рідних і людей?
            Що хочу залишити після себе?</p>
          <textarea id="life-goal" class="field" rows="5" placeholder="Моя мета — …">${UI.esc(goal.life)}</textarea>
          <span class="save-hint muted" aria-live="polite"></span>
        </div>

        <div class="card">
          <span class="label">Цілі на ${year} рік</span>
          <p class="muted">Добра ціль конкретна і має зрозумілий результат: не «більше читати»,
            а «прочитати 12 книжок».</p>
          <div class="check-list" data-goal-list>${goalItems()}</div>
          <form class="add-row" data-goal-form>
            <input class="field" name="text" maxlength="200" placeholder="Нова ціль" aria-label="Нова ціль" autocomplete="off">
            <button type="submit" class="btn btn-primary" aria-label="Додати ціль">${UI.icon('plus')}</button>
          </form>
        </div>`,

      mount(root) {
        UI.autosave(root.querySelector('#life-goal'), root.querySelector('.save-hint'),
          value => Store.update(s => { s.goal.life = value; }));

        const listEl = root.querySelector('[data-goal-list]');
        const redraw = () => { listEl.innerHTML = goalItems(); };

        root.querySelector('[data-goal-form]').addEventListener('submit', e => {
          e.preventDefault();
          const input = e.target.elements.text;
          const text = input.value.trim();
          if (!text) return;
          Store.update(s => { s.goal.year.push({ id: Date.now().toString(36), text, done: false }); });
          input.value = '';
          redraw();
        });

        listEl.addEventListener('change', e => {
          const id = e.target.dataset.goalToggle;
          if (!id) return;
          Store.update(s => {
            const g = s.goal.year.find(x => x.id === id);
            if (g) g.done = e.target.checked;
          });
          redraw();
        });

        listEl.addEventListener('click', e => {
          const btn = e.target.closest('[data-goal-delete]');
          if (!btn || !confirm('Видалити цю ціль?')) return;
          Store.update(s => { s.goal.year = s.goal.year.filter(x => x.id !== btn.dataset.goalDelete); });
          redraw();
        });
      }
    };
  };
})();
