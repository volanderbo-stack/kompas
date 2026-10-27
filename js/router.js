// Екрани розділів реєструються тут із файлів js/screens/*.js
const Screens = {};

// Простий роутер на hash-адресах: #/home, #/lesson/3
const Router = (() => {
  const routes = [];
  let view;

  // path на кшталт '/lesson/:id'; tab — яку вкладку внизу підсвітити;
  // remember — запам'ятати екран для кнопки «Продовжити, де зупинився»
  function add(path, screen, tab = null, remember = false) {
    const keys = [];
    const pattern = path.replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    routes.push({ re: new RegExp(`^${pattern}$`), keys, screen, tab, remember });
  }

  function current() {
    return location.hash.slice(1) || '/home';
  }

  function go(path) {
    location.hash = `#${path}`;
  }

  function resolve() {
    const path = current();
    for (const route of routes) {
      const match = path.match(route.re);
      if (!match) continue;
      const params = {};
      route.keys.forEach((key, i) => { params[key] = decodeURIComponent(match[i + 1]); });
      render(route, params, path);
      return;
    }
    go('/home');
  }

  function render(route, params, path) {
    const result = route.screen(params);
    // Екран повертає null, якщо запис не знайдено (наприклад, видалений урок)
    if (!result) {
      go('/home');
      return;
    }
    view.innerHTML = `<div class="screen">${result.html || ''}</div>`;
    document.title = result.title ? `${result.title} · Компас` : 'Компас';
    setActiveTab(route.tab);
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
    if (result.mount) result.mount(view.firstElementChild);
    if (route.remember) Store.update(s => { s.lastRoute = path; });
  }

  function setActiveTab(tab) {
    document.querySelectorAll('.tab').forEach(link => {
      const active = link.dataset.tab === tab;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function start() {
    view = document.getElementById('view');
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { add, go, current, start, refresh: resolve };
})();
