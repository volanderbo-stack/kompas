// Розділи «ШІ в побуті» і «Тайм-менеджмент з ШІ»: генератори промптів і плани-чеклисти
(() => {
  const L = () => DATA.life;
  const life = () => Store.get().life;
  const RECENT_MAX = 10;
  const COPY = 'Копіювати промпт';

  // ===== Спільне =====

  // Заповнює шаблон: рядки, де всі {…} порожні, випадають
  function fill(lines, values) {
    return lines.map(line => {
      const keys = [...line.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
      if (keys.length && keys.every(k => !values[k])) return '';
      return line.replace(/\{(\w+)\}/g, (_, k) => values[k] || '')
        .replace(/ {2,}/g, ' ').replace(/ ([,.])/g, '$1').trim();
    }).filter(Boolean).join('\n');
  }

  // Українські закінчення: plural(5, ['день', 'дні', 'днів'])
  function plural(n, forms) {
    const d = n % 10;
    const h = n % 100;
    if (d === 1 && h !== 11) return forms[0];
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return forms[1];
    return forms[2];
  }

  // "a, b і c"
  function joinAnd(list) {
    return list.length > 1 ? `${list.slice(0, -1).join(', ')} і ${list[list.length - 1]}` : (list[0] || '');
  }

  const lowerFirst = s => s ? s[0].toLowerCase() + s.slice(1) : s;

  function formatDate(key) {
    if (!key) return '';
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
  }

  function daysUntil(key) {
    const [y, m, d] = key.split('-').map(Number);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((new Date(y, m - 1, d) - today) / 86400000);
  }

  function explainCard(text) {
    return `
      <section class="card">
        <span class="label">Як це працює</span>
        <div class="prose life-prose">${UI.richText(text)}</div>
      </section>`;
  }

  // Підказка, куди вставити промпт, з посиланнями на гайди
  function pasteHint() {
    const tools = L().pasteTools.map(id => DATA.tools.find(t => t.id === id)).filter(Boolean);
    return `
      <div class="card card-note">
        <p>${UI.esc(L().whereToPaste)}</p>
        <div class="chip-row">
          ${tools.map(t => `<a class="chip chip-link" href="#/tool/${UI.esc(t.id)}">${UI.esc(t.emoji)} ${UI.esc(t.name)}</a>`).join('')}
        </div>
      </div>`;
  }

  function checkboxes(name, items) {
    return `
      <div class="check-list">
        ${items.map(it => `
          <div class="check-item">
            <label class="check-item-main">
              <input type="checkbox" name="${name}" value="${UI.esc(it.id)}">
              <span>${UI.esc(it.label)}</span>
            </label>
          </div>`).join('')}
      </div>`;
  }

  const checked = (form, name, items) =>
    [...form.querySelectorAll(`input[name="${name}"]:checked`)]
      .map(input => items.find(it => it.id === input.value)).filter(Boolean);

  function showError(form, message, field) {
    const error = form.querySelector('.form-error');
    error.textContent = message;
    error.hidden = !message;
    if (field) field.focus();
  }

  // Останні створені промпти («Мої промпти»)
  function saveRecent(kind, title, text) {
    Store.update(s => {
      const rest = s.life.recent.filter(p => p.text !== text);
      s.life.recent = [{ id: `lp-${Date.now().toString(36)}`, kind, title, text, date: Store.dayKey() }, ...rest]
        .slice(0, RECENT_MAX);
    });
  }

  function recentHtml(kinds) {
    const list = life().recent.filter(p => kinds.includes(p.kind));
    if (!list.length) return '<p class="card muted">Тут з\'являться промпти, які ви створите.</p>';
    return list.map(p => UI.promptCard({
      title: p.title,
      text: p.text,
      meta: formatDate(p.date),
      copyLabel: COPY,
      extra: `<button type="button" class="icon-btn" data-del-recent="${UI.esc(p.id)}" aria-label="Видалити промпт">${UI.icon('trash')}</button>`
    })).join('');
  }

  function mountRecent(root, kinds) {
    const box = root.querySelector('[data-recent]');
    box.addEventListener('click', e => {
      const btn = e.target.closest('[data-del-recent]');
      if (!btn) return;
      Store.update(s => { s.life.recent = s.life.recent.filter(p => p.id !== btn.dataset.delRecent); });
      box.innerHTML = recentHtml(kinds);
      UI.toast('Промпт видалено');
    });
  }

  // Готовий промпт під формою
  function showResult(root, kind, title, text) {
    saveRecent(kind, title, text);
    const box = root.querySelector('[data-result]');
    box.innerHTML = `
      <h2 class="section-title">Готовий промпт</h2>
      ${UI.promptCard({ title, text, copyLabel: COPY })}
      ${pasteHint()}`;
    box.hidden = false;
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  // ===== «ШІ в побуті» =====
  Screens.budget = () => {
    const s = DATA.sections.budget;
    const kinds = ['menu', 'compare'];
    return {
      title: s.title,
      html: `
        ${UI.pageHead({ title: s.title, subtitle: s.subtitle })}
        <p class="muted">${UI.esc(s.intro)}</p>
        <div class="list">
          ${UI.listItem({ href: '/budget/menu', title: L().menu.title, subtitle: L().menu.subtitle, iconName: 'budget' })}
          ${UI.listItem({ href: '/budget/compare', title: L().compare.title, subtitle: L().compare.subtitle, iconName: 'grid' })}
        </div>
        <h2 class="section-title">Мої промпти</h2>
        <div class="list" data-recent>${recentHtml(kinds)}</div>`,
      mount(root) {
        UI.mountCopy(root);
        mountRecent(root, kinds);
      }
    };
  };

  // Склад сім'ї: "2 дорослих і дитини 5 років"
  function whoPhrase(adults, kids, agesText) {
    const grown = `${adults} ${adults === 1 ? 'дорослого' : 'дорослих'}`;
    if (!kids) return grown;
    const ages = (agesText.match(/\d+/g) || []).slice(0, kids);
    const years = n => plural(Number(n), ['року', 'років', 'років']);
    if (kids === 1) return `${grown} і дитини${ages[0] ? ` ${ages[0]} ${years(ages[0])}` : ''}`;
    const agesPart = ages.length ? ` (${joinAnd(ages)} ${years(ages[ages.length - 1])})` : '';
    return `${grown} і ${kids} дітей${agesPart}`;
  }

  Screens.menuPrompt = () => {
    const m = L().menu;
    return {
      title: m.title,
      html: `
        ${UI.pageHead({ title: m.title, subtitle: m.subtitle, back: '/budget' })}
        ${explainCard(m.explain)}

        <form class="card form" data-form novalidate>
          <fieldset class="fieldset">
            <legend class="field-label">Склад сім'ї</legend>
            <div class="form-row">
              <div class="form-col">
                <label class="field-label" for="m-adults">Дорослі</label>
                <input id="m-adults" name="adults" type="number" inputmode="numeric" min="1" max="20" class="field" value="2">
              </div>
              <div class="form-col">
                <label class="field-label" for="m-kids">Діти</label>
                <input id="m-kids" name="kids" type="number" inputmode="numeric" min="0" max="20" class="field" value="0">
              </div>
            </div>
            <div class="form-col" data-ages hidden>
              <label class="field-label" for="m-ages">Вік дітей</label>
              <input id="m-ages" name="ages" class="field" maxlength="40" placeholder="Наприклад: 5 або 5, 8">
            </div>
          </fieldset>

          <label class="field-label" for="m-budget">Бюджет на тиждень</label>
          <div class="form-row form-row-money">
            <input id="m-budget" name="budget" type="number" inputmode="numeric" min="1" class="field" placeholder="1500">
            <select name="currency" class="field" aria-label="Валюта">
              <option value="грн">грн</option>
              <option value="€">€</option>
            </select>
          </div>

          <label class="field-label" for="m-meals">Скільки разів на день їсте</label>
          <select id="m-meals" name="meals" class="field">
            ${m.meals.map((v, i) => `<option ${i === 1 ? 'selected' : ''}>${UI.esc(v)}</option>`).join('')}
          </select>

          <fieldset class="fieldset">
            <legend class="field-label">Побажання</legend>
            ${checkboxes('wish', m.wishes)}
          </fieldset>

          <label class="field-label" for="m-exclude">Без яких продуктів</label>
          <input id="m-exclude" name="exclude" class="field" maxlength="120" placeholder="Наприклад: гриби, горіхи">

          <p class="form-error" hidden aria-live="polite"></p>
          <button type="submit" class="btn btn-primary btn-block">Створити промпт</button>
        </form>

        <div class="stack" data-result hidden></div>

        <section class="card">
          <span class="label">${UI.esc(m.tipsTitle)}</span>
          <ul class="plain-list">${m.tips.map(t => `<li>${UI.esc(t)}</li>`).join('')}</ul>
        </section>`,

      mount(root) {
        const form = root.querySelector('[data-form]');
        const agesBox = form.querySelector('[data-ages]');
        UI.mountCopy(root);

        const syncAges = () => { agesBox.hidden = !(Number(form.elements.kids.value) > 0); };
        form.elements.kids.addEventListener('input', syncAges);

        form.addEventListener('submit', e => {
          e.preventDefault();
          const adults = Math.round(Number(form.elements.adults.value));
          const kids = Math.max(0, Math.round(Number(form.elements.kids.value) || 0));
          const budget = Number(form.elements.budget.value);
          if (!(adults >= 1)) return showError(form, 'Вкажіть хоча б одного дорослого.', form.elements.adults);
          if (!(budget > 0)) return showError(form, 'Вкажіть бюджет на тиждень.', form.elements.budget);
          showError(form, '');

          const wishes = checked(form, 'wish', m.wishes);
          const noMeat = wishes.some(w => w.id === 'nomeat');
          const text = fill(m.template, {
            who: whoPhrase(adults, kids, form.elements.ages.value),
            budget: `${budget} ${form.elements.currency.value}`,
            meals: form.elements.meals.value,
            wishes: wishes.map(w => w.text).join('; '),
            exclude: form.elements.exclude.value.trim(),
            departments: m.departments.filter(d => !(noMeat && d === "м'ясо")).join(', ')
          });
          showResult(root, 'menu', `Меню на тиждень · ${budget} ${form.elements.currency.value}`, text);
        });
      }
    };
  };

  Screens.comparePrompt = () => {
    const c = L().compare;
    return {
      title: c.title,
      html: `
        ${UI.pageHead({ title: c.title, subtitle: c.subtitle, back: '/budget' })}
        ${explainCard(c.explain)}

        <form class="card form" data-form novalidate>
          <label class="field-label" for="c-type">Тип техніки</label>
          <input id="c-type" name="type" class="field" list="c-types" maxlength="60" placeholder="Наприклад: пральна машина">
          <datalist id="c-types">${c.types.map(t => `<option value="${UI.esc(t)}"></option>`).join('')}</datalist>

          <fieldset class="fieldset">
            <legend class="field-label">Моделі (2–4)</legend>
            ${[1, 2, 3, 4].map(n => `
              <input name="model" class="field" maxlength="80" aria-label="Модель ${n}"
                placeholder="Модель ${n}${n > 2 ? ' (необов\'язково)' : ''}">`).join('')}
          </fieldset>

          <fieldset class="fieldset">
            <legend class="field-label">Мої потреби</legend>
            <label class="field-label field-label-sm" for="c-flat">Розмір квартири</label>
            <input id="c-flat" name="flat" class="field" maxlength="60" placeholder="Наприклад: 45 м², 2 кімнати">
            <label class="field-label field-label-sm" for="c-people">Скільки людей</label>
            <input id="c-people" name="people" type="number" inputmode="numeric" min="1" max="20" class="field" placeholder="3">
            <label class="field-label field-label-sm" for="c-budget">Бюджет до</label>
            <div class="form-row form-row-money">
              <input id="c-budget" name="budget" type="number" inputmode="numeric" min="1" class="field" placeholder="15000">
              <select name="currency" class="field" aria-label="Валюта">
                <option value="грн">грн</option>
                <option value="€">€</option>
              </select>
            </div>
            <div class="check-list">
              <div class="check-item">
                <label class="check-item-main">
                  <input type="checkbox" name="pets">
                  <span>Є домашні тварини</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="field-label">Що найважливіше</legend>
            ${checkboxes('priority', c.priorities)}
          </fieldset>

          <label class="field-label" for="c-other">Ще щось важливе</label>
          <input id="c-other" name="other" class="field" maxlength="120" placeholder="Наприклад: ставлю на кухні, є маленька дитина">

          <p class="form-error" hidden aria-live="polite"></p>
          <button type="submit" class="btn btn-primary btn-block">Створити промпт</button>
        </form>

        <div class="stack" data-result hidden></div>

        <section class="card card-bad">
          <span class="label">⚠ Будь уважним</span>
          <p>${UI.esc(c.warning)}</p>
        </section>`,

      mount(root) {
        const form = root.querySelector('[data-form]');
        UI.mountCopy(root);

        form.addEventListener('submit', e => {
          e.preventDefault();
          const type = form.elements.type.value.trim();
          const models = [...form.querySelectorAll('input[name="model"]')].map(i => i.value.trim()).filter(Boolean);
          if (!type) return showError(form, 'Вкажіть тип техніки.', form.elements.type);
          if (models.length < 2) {
            const empty = [...form.querySelectorAll('input[name="model"]')].find(i => !i.value.trim());
            return showError(form, 'Вкажіть хоча б дві моделі для порівняння.', empty);
          }
          showError(form, '');

          const people = Math.round(Number(form.elements.people.value));
          const budget = Number(form.elements.budget.value);
          const needs = [
            form.elements.flat.value.trim() && `квартира ${form.elements.flat.value.trim()}`,
            people > 0 && `кількість людей: ${people}`,
            form.elements.pets.checked && 'є домашні тварини',
            budget > 0 && `бюджет до ${budget} ${form.elements.currency.value}`,
            form.elements.other.value.trim()
          ].filter(Boolean);

          const text = fill(c.template, {
            type: lowerFirst(type),
            models: joinAnd(models),
            needs: needs.join(', '),
            priorities: checked(form, 'priority', c.priorities).map(p => p.text).join(', ')
          });
          showResult(root, 'compare', `Порівняння: ${models.join(' / ')}`, text);
        });
      }
    };
  };

  // ===== «Тайм-менеджмент з ШІ» =====

  function planStats(plan) {
    const steps = plan.items.filter(it => !it.head);
    return { done: steps.filter(it => it.done).length, total: steps.length };
  }

  function plansHtml() {
    const list = life().plans;
    if (!list.length) return '<p class="card muted">Планів ще немає. Створіть промпт, вставте відповідь ШІ в «Мій план» — і тут з\'явиться чеклист.</p>';
    return `<div class="list">${list.map(p => {
      const { done, total } = planStats(p);
      return UI.listItem({
        href: `/time/plan/${p.id}`,
        title: p.title,
        subtitle: `Виконано ${done} з ${total}`,
        lead: `${total ? Math.round(done / total * 100) : 0}%`,
        done: total > 0 && done === total
      });
    }).join('')}</div>`;
  }

  function tipsHtml() {
    return `
      <h2 class="section-title">${UI.esc(L().tipsTitle)}</h2>
      <div class="list">
        ${L().tips.map(t => UI.promptCard({ title: t.title, text: t.text, copyLabel: COPY })).join('')}
      </div>`;
  }

  Screens.time = () => {
    const s = DATA.sections.time;
    const kinds = ['steps'];
    return {
      title: s.title,
      html: `
        ${UI.pageHead({ title: s.title, subtitle: s.subtitle })}
        <p class="muted">${UI.esc(s.intro)}</p>
        <div class="list">
          ${UI.listItem({ href: '/time/steps', title: L().steps.title, subtitle: L().steps.subtitle, lead: '1' })}
          ${UI.listItem({ href: '/time/plan', title: L().plan.title, subtitle: L().plan.subtitle, lead: '2' })}
        </div>

        <h2 class="section-title">Мої плани</h2>
        ${plansHtml()}

        ${tipsHtml()}

        <h2 class="section-title">Мої промпти</h2>
        <div class="list" data-recent>${recentHtml(kinds)}</div>`,
      mount(root) {
        UI.mountCopy(root);
        mountRecent(root, kinds);
      }
    };
  };

  // "до 17 листопада (за 21 день)"
  function deadlinePhrase(key) {
    if (!key) return 'без жорсткого терміну';
    const days = daysUntil(key);
    if (days <= 0) return `до ${formatDate(key)}`;
    return `за ${days} ${plural(days, ['день', 'дні', 'днів'])} (до ${formatDate(key)})`;
  }

  function addDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return Store.dayKey(d);
  }

  Screens.stepsPrompt = () => {
    const st = L().steps;
    return {
      title: st.title,
      html: `
        ${UI.pageHead({ title: st.title, subtitle: st.subtitle, back: '/time' })}
        ${explainCard(st.explain)}

        <h2 class="section-title">Готові приклади</h2>
        <div class="chip-row" data-examples>
          ${st.examples.map((ex, i) => `<button type="button" class="chip" data-example="${i}">${UI.esc(ex.label)}</button>`).join('')}
        </div>

        <form class="card form" data-form novalidate>
          <label class="field-label" for="s-task">Яке велике завдання</label>
          <textarea id="s-task" name="task" class="field" rows="3" maxlength="300" placeholder="Наприклад: підготуватися до переїзду"></textarea>
          <p class="muted small-note">Пишіть, що треба зробити: «зробити ремонт…», «підготуватися до…».</p>

          <label class="field-label" for="s-date">До якого терміну</label>
          <input id="s-date" name="date" type="date" class="field">
          <div class="check-list">
            <div class="check-item">
              <label class="check-item-main">
                <input type="checkbox" name="noDate">
                <span>Без терміну</span>
              </label>
            </div>
          </div>

          <label class="field-label" for="s-time">Скільки часу на день</label>
          <select id="s-time" name="time" class="field">
            ${st.timePerDay.map((v, i) => `<option value="${i}" ${i === 2 ? 'selected' : ''}>${UI.esc(v)}</option>`).join('')}
          </select>

          <label class="field-label" for="s-budget">Бюджет <span class="muted">(необов'язково)</span></label>
          <input id="s-budget" name="budget" class="field" maxlength="60" placeholder="Наприклад: 20 000 грн">

          <label class="field-label" for="s-helper">Хто допомагає</label>
          <select id="s-helper" name="helper" class="field">
            ${st.helpers.map((v, i) => `<option value="${i}">${UI.esc(v)}</option>`).join('')}
          </select>
          <input name="helperWho" class="field" maxlength="80" placeholder="З ким саме? Наприклад: брат, друзі" aria-label="З ким саме" data-helper-who hidden>

          <p class="form-error" hidden aria-live="polite"></p>
          <button type="submit" class="btn btn-primary btn-block">Створити промпт</button>
        </form>

        <div class="stack" data-result hidden></div>
        <a class="btn btn-secondary btn-block" href="#/time/plan">${UI.icon('check')}Вставити відповідь ШІ в «Мій план»</a>`,

      mount(root) {
        const form = root.querySelector('[data-form]');
        const el = form.elements;
        const who = form.querySelector('[data-helper-who]');
        UI.mountCopy(root);

        const syncDate = () => { el.date.disabled = el.noDate.checked; };
        const syncHelper = () => { who.hidden = el.helper.value !== '1'; };
        el.noDate.addEventListener('change', syncDate);
        el.helper.addEventListener('change', syncHelper);

        root.querySelector('[data-examples]').addEventListener('click', e => {
          const btn = e.target.closest('[data-example]');
          if (!btn) return;
          const ex = st.examples[Number(btn.dataset.example)];
          el.task.value = ex.task;
          el.noDate.checked = !ex.days;
          el.date.value = ex.days ? addDays(ex.days) : '';
          el.time.value = String(ex.time);
          el.budget.value = ex.budget;
          el.helper.value = String(ex.helper);
          syncDate();
          syncHelper();
          showError(form, '');
          UI.toast(`Заповнено: ${ex.label}`);
        });

        form.addEventListener('submit', e => {
          e.preventDefault();
          const task = el.task.value.trim().replace(/\s+/g, ' ').replace(/[.!]+$/, '');
          if (!task) return showError(form, 'Опишіть велике завдання.', el.task);
          if (!el.noDate.checked && !el.date.value) {
            return showError(form, 'Оберіть дату або позначте «Без терміну».', el.date);
          }
          showError(form, '');

          const helper = el.helper.value === '1'
            ? (who.value.trim()
              ? `Мені допомагає: ${who.value.trim()}. Познач, які кроки можна доручити помічникам.`
              : 'Роблю це не сам. Познач, які кроки можна доручити помічникам.')
            : 'Роблю це сам.';
          const text = fill(st.template, {
            task: lowerFirst(task),
            deadline: deadlinePhrase(el.noDate.checked ? '' : el.date.value),
            time: st.timePerDay[Number(el.time.value)],
            budget: el.budget.value.trim(),
            helper
          });
          showResult(root, 'steps', `Кроки: ${task}`, text);
        });
      }
    };
  };

  // Відповідь ШІ → пункти чеклиста. Рядок, що закінчується на «:», — підзаголовок
  function parseSteps(text) {
    const items = [];
    const lines = String(text).split('\n');
    const isRule = line => /^[\s|:\-–—=_*#>]+$/.test(line);
    lines.forEach((raw, i) => {
      let line = raw.replace(/\*\*|__|`/g, '').trim();
      if (items.length >= 200) return;
      if (/^\|/.test(line)) {
        // Шапку таблиці (рядок перед |---|) пропускаємо
        if (isRule((lines[i + 1] || '').trim()) && /^\|/.test((lines[i + 1] || '').trim())) return;
        line = line.split('|').map(c => c.trim()).filter(Boolean).join(' — ');
      }
      if (!line || isRule(line)) return;
      line = line.replace(/^(?:#{1,6}|>)\s*/, '');
      let prev;
      do {
        prev = line;
        line = line.replace(/^(?:[-*•–—+]\s+|\d{1,3}[.)]\s+|\[[ xXх]?\]\s*)/, '');
      } while (line !== prev);
      line = line.trim().slice(0, 300);
      if (!line) return;
      const head = /:$/.test(line) && line.length <= 60;
      items.push({ text: head ? line.slice(0, -1) : line, done: false, ...(head ? { head: true } : {}) });
    });
    return items;
  }

  Screens.plans = () => {
    const p = L().plan;
    return {
      title: p.title,
      html: `
        ${UI.pageHead({ title: p.title, subtitle: p.subtitle, back: '/time' })}
        <form class="card form" data-form novalidate>
          <p>${UI.esc(p.explain)}</p>
          <label class="field-label" for="pl-title">Назва плану</label>
          <input id="pl-title" name="title" class="field" maxlength="80" placeholder="Наприклад: Переїзд">

          <label class="field-label" for="pl-text">Відповідь ШІ</label>
          <textarea id="pl-text" name="text" class="field" rows="10" placeholder="1. Скласти список речей — 30 хв&#10;2. Купити коробки і скотч — 20 хв&#10;3. …"></textarea>
          <p class="muted small-note" data-count aria-live="polite"></p>

          <p class="form-error" hidden aria-live="polite"></p>
          <button type="submit" class="btn btn-primary btn-block">${UI.icon('check')}Створити чеклист</button>
        </form>

        <h2 class="section-title">Мої плани</h2>
        ${plansHtml()}`,

      mount(root) {
        const form = root.querySelector('[data-form]');
        const count = form.querySelector('[data-count]');

        form.elements.text.addEventListener('input', UI.debounce(() => {
          const n = parseSteps(form.elements.text.value).filter(it => !it.head).length;
          count.textContent = n ? `Буде кроків: ${n}` : '';
        }, 200));

        form.addEventListener('submit', e => {
          e.preventDefault();
          const items = parseSteps(form.elements.text.value);
          if (!items.some(it => !it.head)) {
            return showError(form, 'Вставте відповідь ШІ — хоча б один рядок із кроком.', form.elements.text);
          }
          showError(form, '');
          const firstStep = items.find(it => !it.head).text;
          const title = form.elements.title.value.trim() || firstStep.slice(0, 60);
          const id = `pl-${Date.now().toString(36)}`;
          const ok = Store.update(s => { s.life.plans.unshift({ id, title, items, created: Store.dayKey() }); });
          UI.toast(ok ? 'План створено ✓' : 'Не вдалося зберегти — план зникне після закриття');
          Router.go(`/time/plan/${id}`);
        });
      }
    };
  };

  Screens.plan = ({ id }) => {
    const plan = life().plans.find(p => p.id === id);
    if (!plan) return null;
    const p = L().plan;

    const itemsHtml = () => plan.items.map((it, i) => it.head
      ? `<h3 class="plan-head">${UI.esc(it.text)}</h3>`
      : `
        <div class="check-item${it.done ? ' is-done' : ''}">
          <label class="check-item-main">
            <input type="checkbox" data-i="${i}" ${it.done ? 'checked' : ''}>
            <span>${UI.esc(it.text)}</span>
          </label>
        </div>`).join('');

    return {
      title: plan.title,
      html: `
        ${UI.pageHead({ title: plan.title, subtitle: `Створено ${formatDate(plan.created)}`, back: '/time/plan' })}

        <section class="card">
          <p class="plan-progress" data-progress aria-live="polite"></p>
          <div class="progress" aria-hidden="true"><span data-bar></span></div>
        </section>

        <button type="button" class="btn btn-primary btn-block" data-now>${UI.icon('target')}${UI.esc(p.nowTitle)}</button>
        <div class="stack" data-now-box hidden></div>

        <section class="card">
          <div class="check-list" data-items>${itemsHtml()}</div>
        </section>

        ${tipsHtml()}

        <button type="button" class="btn btn-danger btn-block" data-delete>Видалити план</button>`,

      mount(root) {
        const progress = root.querySelector('[data-progress]');
        const bar = root.querySelector('[data-bar]');
        const nowBox = root.querySelector('[data-now-box]');
        UI.mountCopy(root);

        const renderProgress = () => {
          const { done, total } = planStats(plan);
          progress.textContent = `Виконано ${done} з ${total}`;
          bar.style.width = `${total ? Math.round(done / total * 100) : 0}%`;
        };

        const renderNow = () => {
          const next = plan.items.find(it => !it.head && !it.done);
          nowBox.innerHTML = next
            ? `
              <section class="card now-card">
                <span class="label">${UI.icon('target')} Зараз</span>
                <p class="now-step">${UI.esc(next.text)}</p>
              </section>
              ${UI.promptCard({
                title: 'Крок завеликий?',
                text: L().tips[0].text.replace('[вставте крок]', next.text),
                copyLabel: COPY
              })}`
            : `<section class="card now-card"><p class="now-step">${UI.esc(p.allDone)}</p></section>`;
        };

        renderProgress();

        root.querySelector('[data-now]').addEventListener('click', () => {
          renderNow();
          nowBox.hidden = false;
          nowBox.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        });

        root.querySelector('[data-items]').addEventListener('change', e => {
          const box = e.target.closest('[data-i]');
          if (!box) return;
          const item = plan.items[Number(box.dataset.i)];
          item.done = box.checked;
          Store.save();
          box.closest('.check-item').classList.toggle('is-done', box.checked);
          renderProgress();
          if (!nowBox.hidden) renderNow();
          const { done, total } = planStats(plan);
          if (box.checked && done === total) UI.toast('Усе виконано! 🎉');
        });

        root.querySelector('[data-delete]').addEventListener('click', () => {
          if (!confirm('Видалити цей план? Цю дію не можна скасувати.')) return;
          Store.update(s => { s.life.plans = s.life.plans.filter(x => x.id !== id); });
          UI.toast('План видалено');
          Router.go('/time/plan');
        });
      }
    };
  };
})();
