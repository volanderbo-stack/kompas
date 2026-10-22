// Спільні елементи інтерфейсу
const UI = (() => {
  // Іконки 24×24 (контур, колір береться з тексту)
  const ICONS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    sens: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    people: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    tools: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    prompts: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    projects: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
  };

  function icon(name, cls = 'icon') {
    return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  // Екранування тексту перед вставкою в HTML
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Заголовок сторінки; back — адреса для кнопки «Назад»
  function pageHead({ title, subtitle, back }) {
    return `
      <div class="page-head">
        ${back ? `<a class="back-link" href="#${back}">${icon('chevronLeft')}Назад</a>` : ''}
        <h1>${esc(title)}</h1>
        ${subtitle ? `<p class="muted">${esc(subtitle)}</p>` : ''}
      </div>`;
  }

  // Пункт списку-посилання; lead — короткий текст замість іконки (наприклад, номер),
  // done — позначка «пройдено»
  function listItem({ href, title, subtitle, iconName, lead, done }) {
    const leading = iconName ? icon(iconName) : lead !== undefined ? esc(lead) : '';
    return `
      <a class="list-item${done ? ' is-done' : ''}" href="#${href}">
        ${leading ? `<span class="list-item-icon">${done ? icon('check') : leading}</span>` : ''}
        <span class="list-item-text">
          <span class="list-item-title">${esc(title)}</span>
          ${subtitle ? `<span class="list-item-subtitle">${esc(subtitle)}</span>` : ''}
        </span>
        ${icon('chevronRight', 'icon chevron')}
      </a>`;
  }

  // Простий текст із data.js → HTML: абзаци, списки "- ", підзаголовки "## ", **жирний**
  function richText(text) {
    const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const out = [];
    let list = [];
    let para = [];
    const flush = () => {
      if (list.length) out.push(`<ul>${list.map(l => `<li>${inline(l)}</li>`).join('')}</ul>`);
      if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
      list = [];
      para = [];
    };
    for (const raw of String(text || '').split('\n')) {
      const line = raw.trim();
      if (!line) {
        flush();
      } else if (line.startsWith('## ')) {
        flush();
        out.push(`<h3>${inline(line.slice(3))}</h3>`);
      } else if (line.startsWith('- ')) {
        if (para.length) flush();
        list.push(line.slice(2));
      } else {
        if (list.length) flush();
        para.push(line);
      }
    }
    flush();
    return out.join('');
  }

  // Номер дня за місцевим часом — однаковий протягом доби (для «Думки дня»)
  function dayNumber() {
    const now = new Date();
    return Math.floor((now - now.getTimezoneOffset() * 60000) / 86400000);
  }

  // Відкладений виклик: для автозбереження тексту під час набору
  function debounce(fn, ms = 400) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // Автозбереження поля вводу з написом «Збережено»
  function autosave(field, hint, save) {
    const commit = debounce(() => {
      const ok = save(field.value);
      hint.textContent = ok ? 'Збережено ✓' : 'Не вдалося зберегти';
    });
    field.addEventListener('input', () => {
      hint.textContent = '…';
      commit();
    });
  }

  // ID ролика з посилань виду watch?v=, youtu.be/, shorts/, embed/
  function youtubeId(url) {
    const m = String(url || '').match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  // Блок «Відео»: плеєр, якщо є перевірене посилання, інакше — пошук на YouTube
  function video({ videoUrl, videoQuery, title }) {
    const id = youtubeId(videoUrl);
    let content;
    if (id && !navigator.onLine) {
      content = '<p class="muted">Відео доступне з інтернетом.</p>';
    } else if (id) {
      content = `
        <div class="video-frame">
          <iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(title)}" loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
        </div>`;
    } else {
      const q = encodeURIComponent(videoQuery || title);
      content = `
        <p class="muted">Перевірене відео ще не додано. Можна знайти за готовим запитом:</p>
        <a class="btn btn-secondary btn-block" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">
          ${icon('play')}Знайти на YouTube
        </a>`;
    }
    return `<section class="card"><span class="label">${icon('play')} Відео</span>${content}</section>`;
  }

  // Тест: questions = [{ q, options, correct, explain }]
  function quiz(questions) {
    return `
      <section class="quiz" data-quiz>
        ${questions.map((item, qi) => `
          <fieldset class="card quiz-question" data-q="${qi}">
            <legend class="visually-hidden">Питання ${qi + 1}</legend>
            <span class="label">Питання ${qi + 1} з ${questions.length}</span>
            <p class="question">${esc(item.q)}</p>
            <div class="quiz-options">
              ${item.options.map((opt, oi) => `
                <button type="button" class="quiz-option" data-o="${oi}">${esc(opt)}</button>
              `).join('')}
            </div>
            <p class="quiz-explain" hidden></p>
          </fieldset>`).join('')}
        <p class="quiz-result card" hidden aria-live="polite"></p>
      </section>`;
  }

  // Оживляє тест; onComplete(score) викликається, коли відповіли на всі питання
  function mountQuiz(root, questions, onComplete) {
    const box = root.querySelector('[data-quiz]');
    const answers = new Array(questions.length).fill(null);

    box.addEventListener('click', e => {
      const btn = e.target.closest('.quiz-option');
      if (!btn) return;
      const card = btn.closest('[data-q]');
      const qi = Number(card.dataset.q);
      if (answers[qi] !== null) return;

      const chosen = Number(btn.dataset.o);
      const item = questions[qi];
      answers[qi] = chosen;

      card.querySelectorAll('.quiz-option').forEach(b => {
        const oi = Number(b.dataset.o);
        b.disabled = true;
        if (oi === item.correct) b.classList.add('is-correct');
        else if (oi === chosen) b.classList.add('is-wrong');
      });
      const explain = card.querySelector('.quiz-explain');
      explain.innerHTML = `<strong>${chosen === item.correct ? 'Правильно!' : 'Не зовсім.'}</strong> ${esc(item.explain || '')}`;
      explain.hidden = false;

      if (answers.every(a => a !== null)) {
        const score = answers.filter((a, i) => a === questions[i].correct).length;
        const result = box.querySelector('.quiz-result');
        result.textContent = `Результат: ${score} з ${questions.length}. ${score === questions.length ? 'Чудово! 🎉' : 'Перегляньте пояснення вище.'}`;
        result.hidden = false;
        onComplete(score);
      }
    });
  }

  // Копіювання в буфер обміну із запасним варіантом для старих браузерів і http
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      area.remove();
      return ok;
    }
  }

  // Картка промпту з кнопкою «Копіювати»; meta — підпис під назвою, extra — кнопки справа
  function promptCard({ title, text, meta = '', extra = '' }) {
    return `
      <div class="card prompt-card">
        <div class="prompt-head">
          <div>
            <h3>${esc(title)}</h3>
            ${meta ? `<span class="muted small-note">${esc(meta)}</span>` : ''}
          </div>
          ${extra ? `<div class="prompt-actions">${extra}</div>` : ''}
        </div>
        <pre class="prompt-text">${esc(text)}</pre>
        <button type="button" class="btn btn-secondary btn-block" data-copy>${icon('copy')}Копіювати</button>
      </div>`;
  }

  // Оживляє всі кнопки «Копіювати» всередині root
  function mountCopy(root) {
    root.addEventListener('click', async e => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      const text = btn.closest('.prompt-card').querySelector('.prompt-text').textContent;
      const ok = await copyText(text);
      UI.toast(ok ? 'Скопійовано ✓' : 'Не вдалося скопіювати — виділіть текст вручну');
      if (ok) {
        btn.innerHTML = `${icon('check')}Скопійовано`;
        setTimeout(() => { btn.innerHTML = `${icon('copy')}Копіювати`; }, 1800);
      }
    });
  }

  // Тимчасова заглушка розділу, поки він не наповнений
  function sectionStub(key, soon, stage) {
    const s = DATA.sections[key];
    return {
      title: s.title,
      html: `
        ${pageHead({ title: s.title, subtitle: s.subtitle })}
        <div class="card">
          <p>${esc(s.intro)}</p>
        </div>
        <h2 class="section-title">Що тут буде</h2>
        <div class="card">
          <ul class="plain-list">${soon.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <p class="muted">Розділ наповнюється на етапі ${stage}.</p>
        </div>`
    };
  }

  let toastTimer;
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  const darkQuery = matchMedia('(prefers-color-scheme: dark)');

  // Застосовує тему: 'system' | 'light' | 'dark'
  function applyTheme(pref) {
    const dark = pref === 'dark' || (pref === 'system' && darkQuery.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.getElementById('theme-color').content = dark ? '#0c1322' : '#f6f4ef';
  }

  return {
    icon, esc, pageHead, listItem, richText, dayNumber, debounce, autosave,
    video, quiz, mountQuiz, copyText, promptCard, mountCopy,
    sectionStub, toast, applyTheme, darkQuery
  };
})();
