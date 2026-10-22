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
    plus: '<path d="M12 5v14M5 12h14"/>'
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
    return String(text || '').split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return '';
      if (lines.every(l => l.startsWith('- '))) {
        return `<ul>${lines.map(l => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
      }
      if (lines.length === 1 && lines[0].startsWith('## ')) {
        return `<h3>${inline(lines[0].slice(3))}</h3>`;
      }
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    }).join('');
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
    sectionStub, toast, applyTheme, darkQuery
  };
})();
