// Розділ «Людина»: теми → уроки → урок із тестом
(() => {
  const progress = id => Store.get().progress.lessons[id] || {};
  const isDone = id => Boolean(progress(id).done);
  const lessonsOf = topicId => DATA.lessons.filter(l => l.topic === topicId);
  const topicById = id => DATA.topics.find(t => t.id === id);

  function progressBar(done, total) {
    const pct = total ? Math.round(done / total * 100) : 0;
    return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
      <span style="width:${pct}%"></span>
    </div>`;
  }

  // ===== Список тем =====
  Screens.people = () => {
    const s = DATA.sections.people;
    const done = DATA.lessons.filter(l => isDone(l.id)).length;

    return {
      title: s.title,
      html: `
        ${UI.pageHead({ title: s.title, subtitle: s.subtitle })}

        <div class="card">
          <span class="label">Мій прогрес</span>
          <p><strong>${done}</strong> з ${DATA.lessons.length} уроків вивчено</p>
          ${progressBar(done, DATA.lessons.length)}
        </div>

        <div class="list">
          ${DATA.topics.map(t => {
            const list = lessonsOf(t.id);
            const n = list.filter(l => isDone(l.id)).length;
            return UI.listItem({
              href: `/people/${t.id}`,
              title: t.title,
              subtitle: `${t.subtitle} · ${n} з ${list.length}`,
              lead: t.emoji,
              done: list.length > 0 && n === list.length
            });
          }).join('')}
        </div>`
    };
  };

  // ===== Уроки однієї теми =====
  Screens.topic = ({ topic }) => {
    const t = topicById(topic);
    if (!t) return null;

    return {
      title: t.title,
      html: `
        ${UI.pageHead({ title: `${t.emoji} ${t.title}`, subtitle: t.subtitle, back: '/people' })}
        <div class="list">
          ${lessonsOf(t.id).map((l, i) => {
            const p = progress(l.id);
            const status = p.done ? `вивчено · тест ${p.score ?? 0}/${l.quiz.length}` : 'не пройдено';
            return UI.listItem({
              href: `/lesson/${l.id}`,
              title: l.title,
              subtitle: `${l.minutes} хв · ${status}`,
              lead: i + 1,
              done: p.done
            });
          }).join('')}
        </div>`
    };
  };

  // ===== Урок =====
  Screens.lesson = ({ id }) => {
    const lesson = DATA.lessons.find(l => l.id === id);
    if (!lesson) return null;
    const t = topicById(lesson.topic);
    const siblings = lessonsOf(lesson.topic);
    const next = siblings[siblings.indexOf(lesson) + 1];
    Store.markActiveDay();

    return {
      title: lesson.title,
      html: `
        ${UI.pageHead({ title: lesson.title, subtitle: `${t ? t.title : ''} · ${lesson.minutes} хв разом із тестом`, back: `/people/${lesson.topic}` })}

        ${lesson.disclaimer ? `<div class="card card-note"><p>⚠️ ${UI.esc(lesson.disclaimer)}</p></div>` : ''}

        <article class="prose">${UI.richText(lesson.body)}</article>

        ${UI.video({ videoUrl: lesson.videoUrl, videoQuery: lesson.videoQuery, title: lesson.title })}

        <h2 class="section-title">Перевір себе</h2>
        ${UI.quiz(lesson.quiz)}

        <button type="button" class="btn btn-block" data-action="learned"></button>
        <p class="muted learned-hint" hidden>Дайте відповідь на всі питання тесту, щоб позначити урок вивченим.</p>

        ${next
          ? UI.listItem({ href: `/lesson/${next.id}`, title: next.title, subtitle: 'Наступний урок', iconName: 'chevronRight' })
          : UI.listItem({ href: '/people', title: 'Інші теми', subtitle: 'Усі уроки цієї теми переглянуто', iconName: 'people' })}`,

      mount(root) {
        let score = null;
        const btn = root.querySelector('[data-action="learned"]');
        const hint = root.querySelector('.learned-hint');

        const draw = () => {
          const p = progress(id);
          if (p.done) {
            btn.className = 'btn btn-block btn-secondary';
            btn.innerHTML = `${UI.icon('check')}Вивчено · тест ${p.score ?? 0}/${lesson.quiz.length}`;
          } else {
            btn.className = 'btn btn-block btn-primary';
            btn.textContent = 'Вивчено';
          }
        };
        draw();

        UI.mountQuiz(root, lesson.quiz, result => {
          score = result;
          hint.hidden = true;
          // Повторне проходження тесту оновлює результат уже вивченого уроку
          if (isDone(id)) {
            Store.update(s => { s.progress.lessons[id].score = score; });
            draw();
          }
        });

        btn.addEventListener('click', () => {
          if (isDone(id)) return;
          if (score === null) {
            hint.hidden = false;
            root.querySelector('[data-quiz]').scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
          Store.update(s => { s.progress.lessons[id] = { done: true, score, date: Store.dayKey() }; });
          UI.toast('Урок вивчено ✓');
          draw();
        });
      }
    };
  };
})();
