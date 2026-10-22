// Розділ «Системні проєкти»: шлях від ідеї до результату і трекер проєктів
(() => {
  const steps = () => DATA.projectSteps;
  const projects = () => Store.get().projects;
  const toolById = id => DATA.tools.find(t => t.id === id);

  function formatDate(key) {
    if (!key) return '';
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
  }

  // Посилання на гайди інструментів для етапу
  function toolChips(step) {
    return step.toolIds.map(toolById).filter(Boolean).map(t =>
      `<a class="chip chip-link" href="#/tool/${t.id}">${UI.esc(t.emoji)} ${UI.esc(t.name)}</a>`
    ).join('');
  }

  function stageHint(index) {
    const step = steps()[index];
    if (!step) return '';
    return `
      <span class="label">Етап ${index + 1} з ${steps().length}: ${UI.esc(step.title)}</span>
      <p>${UI.esc(step.description)}</p>
      <p class="muted small-note">ШІ на цьому етапі:</p>
      <div class="chip-row">${toolChips(step)}</div>
      <p class="step-example">${UI.esc(step.aiHint)}</p>`;
  }

  function projectCard(p) {
    const total = steps().length;
    const step = steps()[p.stage];
    const overdue = p.date && p.date < Store.dayKey();
    return `
      <a class="card card-link project-card" href="#/project/${UI.esc(p.id)}">
        <div class="project-top">
          <h3>${UI.esc(p.name)}</h3>
          <span class="badge">${p.stage + 1}/${total} · ${UI.esc(step ? step.title : '')}</span>
        </div>
        ${p.goal ? `<p class="muted project-goal">${UI.esc(p.goal)}</p>` : ''}
        <div class="progress" aria-hidden="true"><span style="width:${Math.round((p.stage + 1) / total * 100)}%"></span></div>
        ${p.next ? `<p><strong>Далі:</strong> ${UI.esc(p.next)}${p.date
          ? ` <span class="${overdue ? 'overdue' : 'muted'}">· ${overdue ? 'прострочено, ' : ''}${UI.esc(formatDate(p.date))}</span>` : ''}</p>` : ''}
      </a>`;
  }

  // ===== Трекер =====
  Screens.projects = () => {
    const s = DATA.sections.projects;
    // Сортування за етапом: від ранніх до запущених
    const list = [...projects()].sort((a, b) => a.stage - b.stage || (b.updated || '').localeCompare(a.updated || ''));

    return {
      title: s.title,
      html: `
        ${UI.pageHead({ title: s.title, subtitle: s.subtitle })}

        <a class="card card-link picker-card" href="#/projects/path">
          <span class="label">${UI.icon('projects')} Шлях проєкту</span>
          <p class="path-line">${steps().map(st => UI.esc(st.title)).join(' → ')}</p>
          <span class="muted small-note">Що робити на кожному кроці і який ШІ допоможе →</span>
        </a>

        <h2 class="section-title">Мої проєкти${list.length ? ` · ${list.length}` : ''}</h2>
        ${list.length
          ? `<div class="list">${list.map(projectCard).join('')}</div>`
          : '<p class="card muted">Проєктів ще немає. Почніть з ідеї — навіть маленької.</p>'}

        <a class="btn btn-primary btn-block" href="#/projects/new">${UI.icon('plus')}Новий проєкт</a>`
    };
  };

  // ===== Шлях від ідеї до результату =====
  Screens.projectPath = () => ({
    title: 'Шлях проєкту',
    html: `
      ${UI.pageHead({ title: 'Від ідеї до результату', subtitle: 'Шість кроків системного проєкту', back: '/projects' })}
      <ol class="steps">
        ${steps().map((st, i) => `
          <li class="card step">
            <span class="step-num" aria-hidden="true">${i + 1}</span>
            <div class="step-body">
              <h3>${UI.esc(st.title)}</h3>
              <p>${UI.esc(st.description)}</p>
              <div class="chip-row">${toolChips(st)}</div>
              <p class="step-example">${UI.esc(st.aiHint)}</p>
            </div>
          </li>`).join('')}
      </ol>
      <a class="btn btn-secondary btn-block" href="#/prompts">${UI.icon('prompts')}Відкрити шаблони промптів</a>`
  });

  // ===== Новий / редагування проєкту =====
  Screens.projectForm = ({ id }) => {
    const existing = id ? projects().find(p => p.id === id) : null;
    if (id && !existing) return null;
    const p = existing || { name: '', goal: '', stage: 0, next: '', date: '' };
    const last = steps().length - 1;

    return {
      title: existing ? p.name : 'Новий проєкт',
      html: `
        ${UI.pageHead({ title: existing ? p.name : 'Новий проєкт', back: '/projects' })}

        <form class="card form" data-form novalidate>
          <label class="field-label" for="pr-name">Назва</label>
          <input id="pr-name" name="name" class="field" maxlength="80" value="${UI.esc(p.name)}" placeholder="Наприклад: Застосунок «Компас»">

          <label class="field-label" for="pr-goal">Мета — для кого і навіщо</label>
          <textarea id="pr-goal" name="goal" class="field" rows="3" placeholder="Допомогти … щоб …">${UI.esc(p.goal)}</textarea>

          <label class="field-label" for="pr-stage">Етап</label>
          <select id="pr-stage" name="stage" class="field">
            ${steps().map((st, i) => `<option value="${i}" ${i === p.stage ? 'selected' : ''}>${i + 1}. ${UI.esc(st.title)}</option>`).join('')}
          </select>

          <label class="field-label" for="pr-next">Наступний крок</label>
          <input id="pr-next" name="next" class="field" maxlength="160" value="${UI.esc(p.next)}" placeholder="Конкретна дія на 15–60 хвилин">

          <label class="field-label" for="pr-date">Коли зробити наступний крок</label>
          <input id="pr-date" name="date" type="date" class="field" value="${UI.esc(p.date)}">

          <p class="form-error" hidden aria-live="polite"></p>
          <button type="submit" class="btn btn-primary btn-block">Зберегти</button>
        </form>

        <section class="card stage-hint" data-hint>${stageHint(p.stage)}</section>

        ${existing ? `
          ${p.stage < last ? `<button type="button" class="btn btn-secondary btn-block" data-advance>Етап завершено → далі «${UI.esc(steps()[p.stage + 1].title)}»</button>` : ''}
          <button type="button" class="btn btn-danger btn-block" data-delete>Видалити проєкт</button>` : ''}`,

      mount(root) {
        const form = root.querySelector('[data-form]');
        const error = form.querySelector('.form-error');
        const hint = root.querySelector('[data-hint]');

        form.elements.stage.addEventListener('change', () => {
          hint.innerHTML = stageHint(Number(form.elements.stage.value));
        });

        const values = () => ({
          name: form.elements.name.value.trim(),
          goal: form.elements.goal.value.trim(),
          stage: Number(form.elements.stage.value),
          next: form.elements.next.value.trim(),
          date: form.elements.date.value,
          updated: new Date().toISOString()
        });

        form.addEventListener('submit', e => {
          e.preventDefault();
          const v = values();
          if (!v.name) {
            error.textContent = 'Вкажіть назву проєкту.';
            error.hidden = false;
            form.elements.name.focus();
            return;
          }
          Store.update(s => {
            if (existing) Object.assign(s.projects.find(x => x.id === id), v);
            else s.projects.push({ id: `pr-${Date.now().toString(36)}`, ...v });
          });
          UI.toast('Проєкт збережено ✓');
          Router.go('/projects');
        });

        const advance = root.querySelector('[data-advance]');
        if (advance) {
          advance.addEventListener('click', () => {
            const stage = Math.min(existing.stage + 1, last);
            Store.update(s => {
              Object.assign(s.projects.find(x => x.id === id), { stage, next: '', date: '', updated: new Date().toISOString() });
            });
            UI.toast(stage === last ? 'Останній етап — запуск! 🚀' : `Новий етап: ${steps()[stage].title}`);
            Router.refresh();
          });
        }

        const del = root.querySelector('[data-delete]');
        if (del) {
          del.addEventListener('click', () => {
            if (!confirm('Видалити цей проєкт? Цю дію не можна скасувати.')) return;
            Store.update(s => { s.projects = s.projects.filter(x => x.id !== id); });
            UI.toast('Проєкт видалено');
            Router.go('/projects');
          });
        }
      }
    };
  };
})();
