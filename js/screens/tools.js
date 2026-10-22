// Розділ «ШІ-інструменти»: список, гайд по інструменту, «Який інструмент обрати?»
(() => {
  const toolById = id => DATA.tools.find(t => t.id === id);
  const bullets = items => `<ul class="plain-list">${items.map(i => `<li>${UI.esc(i)}</li>`).join('')}</ul>`;

  // ===== Список інструментів =====
  Screens.tools = () => {
    const s = DATA.sections.tools;
    return {
      title: s.title,
      html: `
        ${UI.pageHead({ title: s.title, subtitle: s.subtitle })}

        <a class="card card-link picker-card" href="#/tools/picker">
          <span class="label">${UI.icon('grid')} Який інструмент обрати?</span>
          <p>Таблиця «задача → інструмент» на ${DATA.toolPicker.length} типових ситуацій.</p>
        </a>

        <h2 class="section-title">Гайди</h2>
        <div class="list">
          ${DATA.tools.map(t => UI.listItem({
            href: `/tool/${t.id}`,
            title: t.name,
            subtitle: t.tagline,
            lead: t.emoji
          })).join('')}
        </div>

        <p class="muted small-note">Можливості й тарифи ШІ-сервісів часто змінюються.
          Перед оплатою перевіряйте умови на офіційних сайтах.</p>`
    };
  };

  // ===== Гайд по інструменту =====
  Screens.tool = ({ id }) => {
    const t = toolById(id);
    if (!t) return null;

    return {
      title: t.name,
      html: `
        ${UI.pageHead({ title: `${t.emoji} ${t.name}`, subtitle: t.tagline, back: '/tools' })}

        <section class="card">
          <span class="label">Для чого найкращий</span>
          ${bullets(t.bestFor)}
        </section>

        <section class="card">
          <span class="label">${UI.esc(t.subscriptionTitle)}</span>
          ${bullets(t.subscription)}
          <p class="muted small-note">Опис перевірено: ${UI.esc(t.lastChecked)}. Ціни й ліміти —
            <a href="${UI.esc(t.officialUrl)}" target="_blank" rel="noopener">на офіційному сайті ${UI.icon('external', 'icon icon-inline')}</a></p>
        </section>

        <section class="card card-mistakes">
          <span class="label">Типові помилки</span>
          ${bullets(t.mistakes)}
        </section>

        ${t.tips && t.tips.length ? `
          <section class="card">
            <span class="label">Корисні поради</span>
            ${bullets(t.tips)}
          </section>` : ''}

        <h2 class="section-title">Готові запити</h2>
        <p class="muted small-note">Замініть текст у [квадратних дужках] на свій.</p>
        <div class="list">
          ${t.prompts.map(p => UI.promptCard(p)).join('')}
        </div>

        ${UI.video({ videoUrl: t.videoUrl, videoQuery: t.videoQuery, title: t.name })}`,

      mount(root) {
        UI.mountCopy(root);
      }
    };
  };

  // ===== Який інструмент обрати? =====
  Screens.picker = () => ({
    title: 'Який інструмент обрати?',
    html: `
      ${UI.pageHead({ title: 'Який інструмент обрати?', subtitle: 'Задача → найкращий інструмент', back: '/tools' })}

      <table class="picker">
        <thead>
          <tr><th scope="col">Задача</th><th scope="col">Інструмент</th><th scope="col">Чому</th></tr>
        </thead>
        <tbody>
          ${DATA.toolPicker.map(row => `
            <tr>
              <td class="picker-task" data-label="Задача">${UI.esc(row.task)}</td>
              <td class="picker-tool" data-label="Інструмент">
                ${row.tool && toolById(row.tool)
                  ? `<a href="#/tool/${row.tool}">${UI.esc(toolById(row.tool).emoji)} ${UI.esc(row.label)}</a>`
                  : `🙏 ${UI.esc(row.label)}`}
              </td>
              <td class="picker-why" data-label="Чому">${UI.esc(row.why)}</td>
            </tr>`).join('')}
        </tbody>
      </table>

      <p class="muted small-note">Правило: для важливого — два інструменти. Один створює, інший перевіряє.</p>`
  });
})();
