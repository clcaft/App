const STORAGE_KEY = "smart-dashboard-state-v4";

const TASK_TAGS = [
  { value: "custom", label: "custom" },
  { value: "health", label: "health" },
  { value: "home", label: "home" },
  { value: "habit", label: "habit" }
];

const defaultState = {
  currentScreen: "tasks",
  profile: {
    name: "Alex Green",
    level: 12,
    role: "Productivity Explorer",
    pro: true,
    xp: 1321,
    nextLevelXp: 1560
  },
  settings: {
    pushNotifications: true,
    offlineMode: true,
    greenTheme: true
  },
  tasks: [
    {
      id: 1,
      title: "Утренняя зарядка",
      time: "07:30",
      points: 20,
      tag: "health",
      tagLabel: "health",
      done: true,
      archived: false,
      createdAt: Date.now() - 50000
    },
    {
      id: 2,
      title: "Проверить почту",
      time: "09:00",
      points: 5,
      tag: "custom",
      tagLabel: "custom",
      done: false,
      archived: false,
      createdAt: Date.now() - 40000
    },
    {
      id: 3,
      title: "Сходить за покупками",
      time: "13:00",
      points: 10,
      tag: "home",
      tagLabel: "home",
      done: false,
      archived: false,
      createdAt: Date.now() - 30000
    },
    {
      id: 4,
      title: "Прочитать 20 страниц",
      time: "21:00",
      points: 12,
      tag: "habit",
      tagLabel: "habit",
      done: false,
      archived: false,
      createdAt: Date.now() - 20000
    }
  ],
  notes: [
    {
      id: 1,
      title: "Идея для дипломного проекта",
      text: "Сделать отдельный экран аналитики привычек и наград",
      tag: "pin",
      tagLabel: "PIN",
      createdAt: Date.now() - 10000
    },
    {
      id: 2,
      title: "Напоминание о встрече",
      text: "Завтра в 14:00 · обсудить архитектуру приложения",
      tag: "remind",
      tagLabel: "REMIND",
      createdAt: Date.now() - 5000
    }
  ],
  ui: {
    taskSearch: "",
    noteSearch: "",
    taskSort: "newest",
    taskFilterTag: "all",
    showArchive: false,
    trackerMode: "week",
    modal: null
  }
};

let state = loadState();
const app = document.getElementById("app");
let clockTimer = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);

    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: { ...defaultState.profile, ...(parsed.profile || {}) },
      settings: { ...defaultState.settings, ...(parsed.settings || {}) },
      ui: { ...defaultState.ui, ...(parsed.ui || {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaultState.tasks,
      notes: Array.isArray(parsed.notes) ? parsed.notes : defaultState.notes
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTagLabel(tagValue) {
  return TASK_TAGS.find(tag => tag.value === tagValue)?.label || "custom";
}

function getActiveTasks() {
  return state.tasks.filter(task => !task.archived);
}

function getArchivedTasks() {
  return state.tasks.filter(task => task.archived);
}

function getCompletedTasks(activeOnly = true) {
  const source = activeOnly ? getActiveTasks() : state.tasks;
  return source.filter(task => task.done).length;
}

function getTotalTaskPoints() {
  return getActiveTasks()
    .filter(task => task.done)
    .reduce((sum, task) => sum + Number(task.points || 0), 0);
}

function getProfileProgressPercent() {
  const current = state.profile.xp;
  const next = state.profile.nextLevelXp;
  const base = Math.max(0, next - 500);
  const progress = ((current - base) / Math.max(1, next - base)) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function getWeekProgressPercent() {
  const active = getActiveTasks();
  if (active.length === 0) return 0;
  return Math.round((active.filter(task => task.done).length / active.length) * 100);
}

function getWeeklyBars() {
  const done = getCompletedTasks(true);
  const multiplier = state.ui.trackerMode === "week" ? 1 : 1.18;
  const base = [32, 56, 42, 78, 60, 88, 72];

  return base.map((value, index) => {
    const extra = Math.min(done * 2, 14);
    return {
      day: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index],
      value: Math.min(100, Math.round((value + extra) * multiplier))
    };
  });
}

function getStreakDays() {
  const done = getCompletedTasks(true);
  return Math.max(1, Math.min(30, done + 4));
}

function getBadgesCount() {
  const points = getTotalTaskPoints();
  if (points >= 40) return 3;
  if (points >= 20) return 2;
  if (points > 0) return 1;
  return 0;
}

function getActivityGrowthPercent() {
  const done = getCompletedTasks(true);
  const base = state.ui.trackerMode === "week" ? 12 : 16;
  return `+${Math.max(4, Math.min(99, base + done * 2))}%`;
}

function compareTasks(a, b, sortType) {
  switch (sortType) {
    case "oldest":
      return a.createdAt - b.createdAt;
    case "name":
      return a.title.localeCompare(b.title, "ru");
    case "points":
      return b.points - a.points;
    case "status":
      return Number(a.done) - Number(b.done);
    case "newest":
    default:
      return b.createdAt - a.createdAt;
  }
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesSmartQuery(sourceText, query) {
  const normalizedSource = normalizeText(sourceText);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return true;

  const queryParts = normalizedQuery.split(" ").filter(Boolean);
  return queryParts.every(part => normalizedSource.includes(part));
}

function getVisibleTasks() {
  const query = state.ui.taskSearch.trim();
  const filterTag = state.ui.taskFilterTag;
  const showArchive = state.ui.showArchive;
  const source = showArchive ? getArchivedTasks() : getActiveTasks();

  let result = source.filter(task => {
    const matchesQuery = !query
      ? true
      : matchesSmartQuery(`${task.title} ${task.tagLabel} ${task.time}`, query);

    const matchesTag = filterTag === "all" ? true : task.tag === filterTag;
    return matchesQuery && matchesTag;
  });

  result.sort((a, b) => compareTasks(a, b, state.ui.taskSort));
  return result;
}

function getFilteredNotes() {
  const query = state.ui.noteSearch.trim();
  const source = [...state.notes].sort((a, b) => b.createdAt - a.createdAt);

  if (!query) return source;

  return source.filter(note => {
    const haystack = `${note.title} ${note.text} ${note.tagLabel}`;
    return matchesSmartQuery(haystack, query);
  });
}

function renderStatusBar() {
  return `
    <div class="statusbar">
      <div id="statusTime" class="statusbar__time">${formatTime()}</div>
      <div class="statusbar__meta">
        <span class="statusbar__dots">● ● ●</span>
        <span>100%</span>
      </div>
    </div>
  `;
}

function renderScreenLabel(text) {
  return `<div class="screen-label">${text}</div>`;
}

function renderNavigation() {
  const navItems = [
    { id: "tasks", label: "Tasks", icon: "📋" },
    { id: "notes", label: "Notes", icon: "📝" },
    { id: "tracker", label: "Activity", icon: "📊" },
    { id: "profile", label: "Profile", icon: "👤" }
  ];

  return `
    <nav class="bottom-nav">
      ${navItems.map(item => `
        <button
          class="nav-btn ${state.currentScreen === item.id ? "is-active" : ""}"
          data-nav="${item.id}"
          type="button"
        >
          <span class="nav-btn__icon">${item.icon}</span>
          <span class="nav-btn__label">${item.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderTaskTagOptions(selected = "custom") {
  return TASK_TAGS.map(tag => `
    <option value="${tag.value}" ${selected === tag.value ? "selected" : ""}>
      ${tag.label}
    </option>
  `).join("");
}

function renderTasksScreen() {
  const tasks = getVisibleTasks();

  return `
    <section class="screen">
      ${renderStatusBar()}
      ${renderScreenLabel("Экран 2 · Tasks")}

      <div class="hero">
        <div>
          <h1 class="hero__title">Мои<br>задачи</h1>
          <p class="hero__subtitle">Привычки, бытовые дела и активности</p>
        </div>
        <button class="circle-btn" id="menuBtn" type="button" aria-label="Меню">☰</button>
      </div>

      <div class="input-wrap">
        <input
          id="taskSearchInput"
          class="search-input"
          type="text"
          placeholder="🔎  Поиск задач..."
          value="${escapeHtml(state.ui.taskSearch)}"
        />
      </div>

      <div class="card">
        <div class="grid-form">
          <input
            id="taskTitleInput"
            class="text-input"
            type="text"
            placeholder="Новая задача..."
          />
          <button id="addTaskBtn" class="primary-btn" type="button">Добавить</button>
        </div>

        <div class="grid-form--2 grid-form">
          <select id="taskTagInput" class="select-input">
            ${renderTaskTagOptions("custom")}
          </select>

          <input
            id="taskPointsInput"
            class="text-input"
            type="number"
            min="1"
            max="100"
            value="8"
            placeholder="Очки"
          />
        </div>

        <div class="card__header">
          <h2 class="card__title">${state.ui.showArchive ? "Архив" : "Сегодня"}</h2>
          <p class="card__meta">${tasks.length} задач</p>
        </div>

        <div class="list">
          ${
            tasks.length
              ? tasks.map(task => `
                <div class="list-item">
                  <div class="item-main">
                    ${state.ui.showArchive
                      ? `<div class="task-toggle ${task.done ? "is-done" : ""}">${task.done ? "✓" : ""}</div>`
                      : `
                      <button
                        class="task-toggle ${task.done ? "is-done" : ""}"
                        data-task-toggle="${task.id}"
                        type="button"
                        aria-label="Переключить задачу"
                      >
                        ${task.done ? "✓" : ""}
                      </button>
                    `}

                    <div class="item-content">
                      <h3 class="item-title ${task.done ? "is-done" : ""}">
                        ${escapeHtml(task.title)}
                      </h3>
                      <p class="item-subtitle">
                        ${escapeHtml(task.time)} · +${task.points} очков
                      </p>

                      <div class="item-actions">
                        ${
                          state.ui.showArchive
                            ? `
                              <button class="mini-action" data-unarchive-task="${task.id}" type="button">Вернуть</button>
                              <button class="mini-action" data-delete-task="${task.id}" type="button">Удалить</button>
                            `
                            : `
                              <button class="mini-action" data-edit-task="${task.id}" type="button">Редактировать</button>
                              <button class="mini-action" data-archive-task="${task.id}" type="button">В архив</button>
                            `
                        }
                      </div>
                    </div>
                  </div>

                  <div class="tag tag--${task.tag}">
                    ${escapeHtml(task.tagLabel)}
                  </div>
                </div>
              `).join("")
              : `<div class="empty-state">${state.ui.showArchive ? "Архив пуст." : "Ничего не найдено."}</div>`
          }
        </div>
      </div>
    </section>
  `;
}

function renderNotesScreen() {
  const notes = getFilteredNotes();

  return `
    <section class="screen">
      ${renderStatusBar()}
      ${renderScreenLabel("Экран 3 · Notes")}

      <div class="hero">
        <div>
          <h1 class="hero__title hero__title--single">Заметки</h1>
          <p class="hero__subtitle">Идеи, напоминания и быстрые записи</p>
        </div>
      </div>

      <div class="input-wrap search-wrap">
        <span class="search-wrap__icon">🔎</span>
        <input
          id="noteSearchInput"
          class="search-input search-input--notes"
          type="text"
          placeholder="Найти заметку..."
          value="${escapeHtml(state.ui.noteSearch)}"
        />
      </div>

      <div class="card">
        <div class="grid-form">
          <input
            id="noteTitleInput"
            class="text-input"
            type="text"
            placeholder="Новая заметка..."
          />
          <button id="addNoteBtn" class="primary-btn" type="button">Добавить</button>
        </div>

        <div class="card__header">
          <h2 class="card__title">Закреплённые</h2>
          <p class="card__meta">${notes.length} заметки</p>
        </div>

        <div class="list">
          ${
            notes.length
              ? notes.map(note => `
                <div class="list-item">
                  <div class="item-main">
                    <div class="item-content">
                      <h3 class="item-title">${escapeHtml(note.title)}</h3>
                      <p class="item-subtitle">${escapeHtml(note.text)}</p>
                    </div>
                  </div>

                  <div class="tag tag--${note.tag}">
                    ${escapeHtml(note.tagLabel)}
                  </div>
                </div>
              `).join("")
              : `<div class="empty-state">Ничего не найдено.</div>`
          }
        </div>
      </div>

      <div class="grid-2">
        <button class="mini-card" id="ideaCardBtn" type="button">
          <div class="mini-card__emoji">💡</div>
          <h3 class="mini-card__title">Новая идея</h3>
          <p class="mini-card__text">Короткая заметка в один клик</p>
        </button>

        <button class="mini-card" id="reminderCardBtn" type="button">
          <div class="mini-card__emoji">⏰</div>
          <h3 class="mini-card__title">Напоминание</h3>
          <p class="mini-card__text">Добавь дату и время</p>
        </button>
      </div>
    </section>
  `;
}

function renderTrackerScreen() {
  const weekProgress = getWeekProgressPercent();
  const bars = getWeeklyBars();
  const streak = getStreakDays();
  const badges = getBadgesCount();
  const growth = getActivityGrowthPercent();

  return `
    <section class="screen">
      ${renderStatusBar()}
      ${renderScreenLabel("Экран 4 · Activity Tracker")}

      <div class="hero">
        <div>
          <h1 class="hero__title hero__title--single">Активность</h1>
          <p class="hero__subtitle">Статистика, стрики и мотивация</p>
        </div>
        <button class="circle-btn" id="trackerModeBtn" type="button" aria-label="Переключить режим статистики">
          ${state.ui.trackerMode === "week" ? "⚙" : "↻"}
        </button>
      </div>

      <div class="chart-card">
        <div class="chart-card__header">
          <h2 class="chart-card__title">Недельный<br>прогресс</h2>
          <p class="chart-card__value">${growth}</p>
        </div>

        <div class="bar-chart">
          ${bars.map(bar => `
            <div class="bar-chart__item">
              <div
                class="bar-chart__bar"
                style="height:${Math.max(54, bar.value * 2.1)}px"
              ></div>
              <div class="bar-chart__label">${bar.day}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="chart-card goal-card">
        <div class="donut-wrap">
          <div
            class="donut"
            style="background: conic-gradient(var(--green) 0 ${weekProgress}%, #dfeee2 ${weekProgress}% 100%)"
          ></div>
          <div class="donut__value">${weekProgress}%</div>
        </div>

        <div class="goal-card__content">
          <h2 class="goal-title">Цель недели</h2>
          <p class="goal-text">
            Выполнено ${weekProgress}% от запланированных действий
          </p>

          <div class="goal-stats">
            <div class="stat-pill">🔥 Стрик ${streak} дней</div>
            <div class="stat-pill">🏆 ${badges} бейджа</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderProfileScreen() {
  const xp = state.profile.xp;
  const next = state.profile.nextLevelXp;
  const left = Math.max(0, next - xp);
  const profilePercent = getProfileProgressPercent();

  return `
    <section class="screen">
      ${renderStatusBar()}
      ${renderScreenLabel("Экран 5 · Profile / Settings")}

      <div class="hero hero--profile">
        <div>
          <h1 class="hero__title hero__title--single">Профиль</h1>
          <p class="hero__subtitle">Настройки и данные пользователя</p>
        </div>
        <button class="avatar-btn" id="avatarBtn" type="button" aria-label="Профиль">A</button>
      </div>

      <div class="profile-card">
        <div class="profile-card__top">
          <div>
            <h2 class="profile-card__name">${escapeHtml(state.profile.name)}</h2>
            <p class="profile-card__role">
              Level ${state.profile.level} · ${escapeHtml(state.profile.role)}
            </p>
          </div>
          ${state.profile.pro ? `<div class="profile-card__badge">PRO</div>` : ""}
        </div>

        <div class="profile-card__xp">${xp.toLocaleString("ru-RU")} XP</div>

        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:${profilePercent}%"></div>
        </div>

        <p class="profile-card__hint">
          До следующего уровня осталось<br>
          ${left.toLocaleString("ru-RU")} XP
        </p>
      </div>

      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Общие настройки</h2>
          <p class="card__meta">system</p>
        </div>

        <div class="setting-row">
          <div>
            <h3 class="setting-title">Push-уведомления</h3>
            <p class="setting-text">Напоминания о задачах и заметках</p>
          </div>
          <button
            class="switch ${state.settings.pushNotifications ? "" : "is-off"}"
            data-switch="pushNotifications"
            type="button"
            aria-label="Push-уведомления"
          ></button>
        </div>

        <div class="setting-row">
          <div>
            <h3 class="setting-title">Оффлайн-режим</h3>
            <p class="setting-text">Кэширование данных для PWA</p>
          </div>
          <button
            class="switch ${state.settings.offlineMode ? "" : "is-off"}"
            data-switch="offlineMode"
            type="button"
            aria-label="Оффлайн-режим"
          ></button>
        </div>

        <div class="setting-row">
          <div>
            <h3 class="setting-title">Зелёная тема</h3>
            <p class="setting-text">Основная цветовая схема приложения</p>
          </div>
          <button
            class="badge-button"
            data-switch="greenTheme"
            type="button"
          >
            ${state.settings.greenTheme ? "active" : "inactive"}
          </button>
        </div>

        <div class="settings-actions">
          <button id="editProfileBtn" class="ghost-btn" type="button">Редактировать профиль</button>
          <button id="gainXpBtn" class="ghost-btn" type="button">+50 XP</button>
          <button id="resetAppBtn" class="danger-btn" type="button">Сбросить данные</button>
        </div>

        <div class="small-note">
          Все настройки и данные сохраняются в браузере.
        </div>
      </div>
    </section>
  `;
}

function renderProfileModal() {
  const isOpen = state.ui.modal === "profileEdit";

  return `
    <div class="modal ${isOpen ? "is-open" : ""}" id="profileModal">
      <div class="modal__dialog">
        <h3 class="modal__title">Редактирование профиля</h3>
        <p class="modal__text">Измените основные данные пользователя.</p>

        <div class="input-wrap">
          <input id="profileNameInput" class="text-input" type="text" value="${escapeHtml(state.profile.name)}" placeholder="Имя" />
        </div>
        <div class="input-wrap">
          <input id="profileRoleInput" class="text-input" type="text" value="${escapeHtml(state.profile.role)}" placeholder="Роль" />
        </div>
        <div class="grid-form grid-form--2">
          <input id="profileLevelInput" class="text-input" type="number" min="1" value="${state.profile.level}" placeholder="Level" />
          <input id="profileNextXpInput" class="text-input" type="number" min="1" value="${state.profile.nextLevelXp}" placeholder="Цель XP" />
        </div>

        <div class="modal__actions">
          <button id="saveProfileBtn" class="primary-btn" type="button">Сохранить</button>
          <button id="closeModalBtn" class="ghost-btn" type="button">Отмена</button>
        </div>
      </div>
    </div>
  `;
}

function renderTasksMenuModal() {
  const isOpen = state.ui.modal === "tasksMenu";

  return `
    <div class="modal ${isOpen ? "is-open" : ""}" id="tasksMenuModal">
      <div class="modal__dialog">
        <h3 class="modal__title">Меню задач</h3>
        <p class="modal__text">Здесь находятся сортировка, фильтр и управление архивом.</p>

        <div class="menu-list">
          <div class="menu-row">
            <label class="menu-label" for="menuSortSelect">Сортировка</label>
            <select id="menuSortSelect" class="select-input">
              <option value="newest" ${state.ui.taskSort === "newest" ? "selected" : ""}>Сначала новые</option>
              <option value="oldest" ${state.ui.taskSort === "oldest" ? "selected" : ""}>Сначала старые</option>
              <option value="name" ${state.ui.taskSort === "name" ? "selected" : ""}>По названию</option>
              <option value="points" ${state.ui.taskSort === "points" ? "selected" : ""}>По очкам</option>
              <option value="status" ${state.ui.taskSort === "status" ? "selected" : ""}>По статусу</option>
            </select>
          </div>

          <div class="menu-row">
            <label class="menu-label" for="menuFilterSelect">Фильтр по тегу</label>
            <select id="menuFilterSelect" class="select-input">
              <option value="all" ${state.ui.taskFilterTag === "all" ? "selected" : ""}>Все теги</option>
              ${TASK_TAGS.map(tag => `
                <option value="${tag.value}" ${state.ui.taskFilterTag === tag.value ? "selected" : ""}>${tag.label}</option>
              `).join("")}
            </select>
          </div>

          <div class="menu-row">
            <label class="menu-label">Архив</label>
            <button id="menuArchiveToggleBtn" class="ghost-btn" type="button">
              ${state.ui.showArchive ? "Показать активные задачи" : "Открыть архив"}
            </button>
          </div>

          <div class="menu-row">
            <label class="menu-label">Сброс</label>
            <button id="menuResetFiltersBtn" class="ghost-btn" type="button">Сбросить фильтры</button>
          </div>
        </div>

        <div class="modal__actions">
          <button id="closeTasksMenuBtn" class="primary-btn" type="button">Готово</button>
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  let screenHtml = "";

  if (state.currentScreen === "tasks") {
    screenHtml = renderTasksScreen();
  } else if (state.currentScreen === "notes") {
    screenHtml = renderNotesScreen();
  } else if (state.currentScreen === "tracker") {
    screenHtml = renderTrackerScreen();
  } else {
    screenHtml = renderProfileScreen();
  }

  app.innerHTML = `
    ${screenHtml}
    ${renderNavigation()}
    ${renderProfileModal()}
    ${renderTasksMenuModal()}
  `;

  bindEvents();
  startClock();
}

function startClock() {
  if (clockTimer) clearInterval(clockTimer);

  const update = () => {
    const timeEl = document.getElementById("statusTime");
    if (timeEl) timeEl.textContent = formatTime();
  };

  update();
  clockTimer = setInterval(update, 1000);
}

function openModal(name) {
  state.ui.modal = name;
  saveState();
  renderApp();
}

function closeModal() {
  state.ui.modal = null;
  saveState();
  renderApp();
}

function addTask() {
  const titleInput = document.getElementById("taskTitleInput");
  const tagInput = document.getElementById("taskTagInput");
  const pointsInput = document.getElementById("taskPointsInput");

  const title = titleInput?.value.trim();
  const tag = tagInput?.value || "custom";
  const points = Math.max(1, Number(pointsInput?.value || 8));

  if (!title) return;

  state.tasks.unshift({
    id: Date.now(),
    title,
    time: formatTime(new Date()),
    points,
    tag,
    tagLabel: getTagLabel(tag),
    done: false,
    archived: false,
    createdAt: Date.now()
  });

  state.profile.xp += 10;
  saveState();
  renderApp();
}

function toggleTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId && !item.archived);
  if (!task) return;

  const becameDone = !task.done;
  task.done = becameDone;

  if (becameDone) {
    state.profile.xp += Number(task.points || 0);
  } else {
    state.profile.xp = Math.max(0, state.profile.xp - Number(task.points || 0));
  }

  saveState();
  renderApp();
}

function archiveTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;

  task.archived = true;
  saveState();
  renderApp();
}

function unarchiveTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;

  task.archived = false;
  saveState();
  renderApp();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter(item => item.id !== taskId);
  saveState();
  renderApp();
}

function editTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;

  const newTitle = prompt("Новое название задачи:", task.title);
  if (!newTitle || !newTitle.trim()) return;

  const newTag = prompt("Введите тег: custom / health / home / habit", task.tag);
  const normalizedTag = TASK_TAGS.some(t => t.value === newTag) ? newTag : task.tag;

  const newPointsValue = prompt("Введите очки:", String(task.points));
  const newPoints = Math.max(1, Number(newPointsValue || task.points));

  task.title = newTitle.trim();
  task.tag = normalizedTag;
  task.tagLabel = getTagLabel(normalizedTag);
  task.points = Number.isFinite(newPoints) ? newPoints : task.points;

  saveState();
  renderApp();
}

function addNote(title, text = "Новая заметка пользователя", tag = "pin", tagLabel = "PIN") {
  if (!title || !title.trim()) return;

  state.notes.unshift({
    id: Date.now(),
    title: title.trim(),
    text,
    tag,
    tagLabel,
    createdAt: Date.now()
  });

  state.profile.xp += 5;
  saveState();
  renderApp();
}

function bindNavigation() {
  document.querySelectorAll("[data-nav]").forEach(button => {
    button.addEventListener("click", () => {
      state.currentScreen = button.dataset.nav;
      saveState();
      renderApp();
    });
  });
}

function bindTasksScreen() {
  const taskSearchInput = document.getElementById("taskSearchInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const taskTitleInput = document.getElementById("taskTitleInput");
  const menuBtn = document.getElementById("menuBtn");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => openModal("tasksMenu"));
  }

  if (taskSearchInput) {
    taskSearchInput.addEventListener("input", (e) => {
      state.ui.taskSearch = e.target.value;
      saveState();
      renderApp();
    });
  }

  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", addTask);
  }

  if (taskTitleInput) {
    taskTitleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTask();
    });
  }

  document.querySelectorAll("[data-task-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      toggleTask(Number(button.dataset.taskToggle));
    });
  });

  document.querySelectorAll("[data-archive-task]").forEach(button => {
    button.addEventListener("click", () => {
      archiveTask(Number(button.dataset.archiveTask));
    });
  });

  document.querySelectorAll("[data-unarchive-task]").forEach(button => {
    button.addEventListener("click", () => {
      unarchiveTask(Number(button.dataset.unarchiveTask));
    });
  });

  document.querySelectorAll("[data-delete-task]").forEach(button => {
    button.addEventListener("click", () => {
      deleteTask(Number(button.dataset.deleteTask));
    });
  });

  document.querySelectorAll("[data-edit-task]").forEach(button => {
    button.addEventListener("click", () => {
      editTask(Number(button.dataset.editTask));
    });
  });
}

function bindNotesScreen() {
  const noteSearchInput = document.getElementById("noteSearchInput");
  const noteTitleInput = document.getElementById("noteTitleInput");
  const addNoteBtn = document.getElementById("addNoteBtn");
  const ideaCardBtn = document.getElementById("ideaCardBtn");
  const reminderCardBtn = document.getElementById("reminderCardBtn");

  if (noteSearchInput) {
    noteSearchInput.addEventListener("input", (e) => {
      state.ui.noteSearch = e.target.value;
      saveState();
      renderApp();
    });
  }

  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", () => {
      const title = noteTitleInput?.value.trim();
      if (!title) return;
      addNote(title, "Новая заметка пользователя", "pin", "PIN");
    });
  }

  if (noteTitleInput) {
    noteTitleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const title = noteTitleInput.value.trim();
        if (!title) return;
        addNote(title, "Новая заметка пользователя", "pin", "PIN");
      }
    });
  }

  if (ideaCardBtn) {
    ideaCardBtn.addEventListener("click", () => {
      const title = prompt("Название идеи:");
      if (!title || !title.trim()) return;
      addNote(title.trim(), "Идея добавлена через карточку", "pin", "PIN");
    });
  }

  if (reminderCardBtn) {
    reminderCardBtn.addEventListener("click", () => {
      const title = prompt("Название напоминания:");
      if (!title || !title.trim()) return;

      const time = prompt("Введите дату/время, например: завтра 14:00", "завтра 14:00");
      addNote(title.trim(), `${time || "Без даты"} · напоминание`, "remind", "REMIND");
    });
  }
}

function bindTrackerScreen() {
  const trackerModeBtn = document.getElementById("trackerModeBtn");
  if (trackerModeBtn) {
    trackerModeBtn.addEventListener("click", () => {
      state.ui.trackerMode = state.ui.trackerMode === "week" ? "dynamic" : "week";
      saveState();
      renderApp();
    });
  }
}

function bindProfileScreen() {
  const avatarBtn = document.getElementById("avatarBtn");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const gainXpBtn = document.getElementById("gainXpBtn");
  const resetAppBtn = document.getElementById("resetAppBtn");

  if (avatarBtn) {
    avatarBtn.addEventListener("click", () => openModal("profileEdit"));
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => openModal("profileEdit"));
  }

  if (gainXpBtn) {
    gainXpBtn.addEventListener("click", () => {
      state.profile.xp += 50;
      saveState();
      renderApp();
    });
  }

  if (resetAppBtn) {
    resetAppBtn.addEventListener("click", () => {
      const confirmed = confirm("Сбросить все локальные данные приложения?");
      if (!confirmed) return;
      state = structuredClone(defaultState);
      saveState();
      renderApp();
    });
  }

  document.querySelectorAll("[data-switch]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.switch;
      if (!(key in state.settings)) return;
      state.settings[key] = !state.settings[key];
      saveState();
      renderApp();
    });
  });
}

function bindProfileModal() {
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const modal = document.getElementById("profileModal");

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", () => {
      const name = document.getElementById("profileNameInput")?.value.trim();
      const role = document.getElementById("profileRoleInput")?.value.trim();
      const level = Number(document.getElementById("profileLevelInput")?.value || state.profile.level);
      const nextXp = Number(document.getElementById("profileNextXpInput")?.value || state.profile.nextLevelXp);

      if (name) state.profile.name = name;
      if (role) state.profile.role = role;
      state.profile.level = Math.max(1, level || 1);
      state.profile.nextLevelXp = Math.max(state.profile.xp + 1, nextXp || state.profile.nextLevelXp);

      saveState();
      closeModal();
    });
  }
}

function bindTasksMenuModal() {
  const modal = document.getElementById("tasksMenuModal");
  const closeBtn = document.getElementById("closeTasksMenuBtn");
  const sortSelect = document.getElementById("menuSortSelect");
  const filterSelect = document.getElementById("menuFilterSelect");
  const archiveToggleBtn = document.getElementById("menuArchiveToggleBtn");
  const resetFiltersBtn = document.getElementById("menuResetFiltersBtn");

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.ui.taskSort = e.target.value;
      saveState();
      renderApp();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", (e) => {
      state.ui.taskFilterTag = e.target.value;
      saveState();
      renderApp();
    });
  }

  if (archiveToggleBtn) {
    archiveToggleBtn.addEventListener("click", () => {
      state.ui.showArchive = !state.ui.showArchive;
      saveState();
      renderApp();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      state.ui.taskSearch = "";
      state.ui.taskSort = "newest";
      state.ui.taskFilterTag = "all";
      state.ui.showArchive = false;
      saveState();
      renderApp();
    });
  }
}

function bindEvents() {
  bindNavigation();
  bindProfileModal();
  bindTasksMenuModal();

  if (state.currentScreen === "tasks") bindTasksScreen();
  if (state.currentScreen === "notes") bindNotesScreen();
  if (state.currentScreen === "tracker") bindTrackerScreen();
  if (state.currentScreen === "profile") bindProfileScreen();
}

renderApp();
