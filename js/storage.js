// Збереження даних на пристрої (localStorage). Усе лежить під одним ключем.
const Store = (() => {
  const KEY = 'kompas:v1';
  let available = true;

  function defaults() {
    return {
      version: 1,
      theme: 'system',                          // 'system' | 'light' | 'dark'
      progress: { lessons: {}, reflections: {} }, // { [id]: { done, score, date } }
      streak: { count: 0, last: null },         // last — дата 'РРРР-ММ-ДД'
      lastRoute: null,                          // для «Продовжити, де зупинився»
      goal: { life: '', year: [] },             // year: [{ id, text, done }]
      prompts: { custom: [], favorites: [] },
      projects: [],
      life: { recent: [], plans: [] }           // останні промпти і плани-чеклисти
    };
  }

  function isObj(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  // Накладає збережені дані на значення за замовчуванням,
  // щоб нові поля в оновленнях не ламали старі збереження
  function merge(base, saved) {
    if (!isObj(saved)) return base;
    for (const k of Object.keys(saved)) {
      base[k] = isObj(base[k]) && isObj(saved[k]) ? merge(base[k], saved[k]) : saved[k];
    }
    return base;
  }

  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      available = false;
    }
    if (!raw) return defaults();
    try {
      return merge(defaults(), JSON.parse(raw));
    } catch (e) {
      return defaults();
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      available = true;
      return true;
    } catch (e) {
      available = false;
      return false;
    }
  }

  function get() {
    return state;
  }

  // Зміна даних: Store.update(s => { s.theme = 'dark'; })
  function update(fn) {
    fn(state);
    return save();
  }

  function dayKey(d = new Date()) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dayKey(d);
  }

  // Позначає сьогодні активним днем (викликається, коли відкрито урок або роздум)
  function markActiveDay() {
    const today = dayKey();
    const st = state.streak;
    if (st.last === today) return;
    st.count = st.last === yesterdayKey() ? st.count + 1 : 1;
    st.last = today;
    save();
  }

  // Поточна серія: якщо пропущено більше дня — 0
  function streak() {
    const st = state.streak;
    return st.last === dayKey() || st.last === yesterdayKey() ? st.count : 0;
  }

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const data = JSON.parse(text);
    if (!isObj(data) || data.version !== 1) {
      throw new Error('Це не файл резервної копії «Компаса»');
    }
    state = merge(defaults(), data);
    return save();
  }

  function reset() {
    state = defaults();
    return save();
  }

  return {
    get, update, save, dayKey, markActiveDay, streak,
    exportJSON, importJSON, reset,
    isAvailable: () => available
  };
})();
