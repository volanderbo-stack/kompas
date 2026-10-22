// Головний екран: привітання, думка дня, прогрес, «Продовжити»
(() => {
  const SECTIONS = ['sens', 'people', 'tools', 'prompts', 'projects'];

  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Доброї ночі';
    if (h < 12) return 'Доброго ранку';
    if (h < 18) return 'Добрий день';
    if (h < 23) return 'Добрий вечір';
    return 'Доброї ночі';
  }

  // Номер дня від початку епохи за місцевим часом — однаковий протягом доби
  function dayNumber() {
    const now = new Date();
    return Math.floor((now - now.getTimezoneOffset() * 60000) / 86400000);
  }

  function thoughtCard() {
    const list = DATA.reflections;
    if (!list.length) {
      return `
        <div class="card card-thought">
          <span class="label">Думка дня</span>
          <blockquote>Перші роздуми з'являться, коли наповнимо розділ «Сенс».</blockquote>
        </div>`;
    }
    const r = list[dayNumber() % list.length];
    const quote = r.verse && r.verse.text ? r.verse.text : r.text;
    const cite = r.verse && r.verse.text ? r.verse.ref : r.title;
    return `
      <a class="card card-thought" href="#/sens/${UI.esc(r.id)}" style="text-decoration:none;color:inherit">
        <span class="label">Думка дня</span>
        <blockquote>${UI.esc(quote)}</blockquote>
        <cite>${UI.esc(cite)}</cite>
      </a>`;
  }

  Screens.home = () => {
    const s = Store.get();
    const done = Object.values(s.progress.lessons).filter(l => l.done).length;
    const total = DATA.lessons.length;
    const today = new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
    const cont = s.lastRoute
      ? { href: s.lastRoute, label: 'Продовжити, де зупинився' }
      : { href: '/people', label: 'Почати навчання' };

    return {
      title: 'Головна',
      html: `
        <div class="page-head">
          <p class="muted">${UI.esc(today)}</p>
          <h1>${greeting()}!</h1>
        </div>

        ${!Store.isAvailable() ? `
          <div class="card card-warning">
            <p>Браузер не дозволяє зберігати дані — прогрес зникне після закриття сторінки.</p>
          </div>` : ''}

        ${thoughtCard()}

        <div class="stats">
          <div class="card stat">
            <span class="stat-value">${done}<span class="muted" style="font-size:18px"> / ${total}</span></span>
            <span class="stat-label">уроків вивчено</span>
          </div>
          <div class="card stat">
            <span class="stat-value">${Store.streak()}</span>
            <span class="stat-label">днів поспіль</span>
          </div>
        </div>

        <a class="btn btn-primary btn-block" href="#${UI.esc(cont.href)}">${cont.label}</a>

        <h2 class="section-title">Розділи</h2>
        <div class="list">
          ${SECTIONS.map(key => UI.listItem({
            href: `/${key}`,
            title: DATA.sections[key].title,
            subtitle: DATA.sections[key].subtitle,
            iconName: key
          })).join('')}
        </div>`
    };
  };
})();
