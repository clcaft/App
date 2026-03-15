// ========== ДАННЫЕ ==========
let profile = {
    name: 'Иван Петров',
    bio: 'Студент СПО, учусь мобильной разработке',
    birthday: '',
    avatar: null
};

let notes = [];

// Конфигурация привычек
const HABIT_TYPES = [
    { id: 'water', name: 'Вода', unit: 'л', goal: 2, step: 0.1, icon: '💧', color: '#0a84ff' },
    { id: 'sport', name: 'Спорт', unit: 'мин', goal: 30, step: 5, icon: '🏃', color: '#30d158' },
    { id: 'read', name: 'Чтение', unit: 'мин', goal: 20, step: 5, icon: '📚', color: '#ff9f0a' },
    { id: 'sleep', name: 'Сон', unit: 'ч', goal: 8, step: 0.5, icon: '😴', color: '#bf5af2' },
    { id: 'walk', name: 'Прогулка', unit: 'км', goal: 5, step: 0.5, icon: '🚶', color: '#ff6482' }
];

let habits = {};
HABIT_TYPES.forEach(habit => {
    habits[habit.id] = { history: {} };
});

let dayNotes = {};

// ========== ЭЛЕМЕНТЫ ==========
const tabs = document.querySelectorAll('.tab-btn');
const screens = document.querySelectorAll('.screen');
const avatarDisplay = document.getElementById('avatarDisplay');
const avatarUpload = document.getElementById('avatarUpload');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const profileBirthday = document.getElementById('profileBirthday');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileHint = document.getElementById('profileHint');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const addNoteBtn = document.getElementById('addNoteBtn');
const notesList = document.getElementById('notesList');
const insertBulletListBtn = document.getElementById('insertBulletListBtn');
const insertNumberListBtn = document.getElementById('insertNumberListBtn');
const editModal = document.getElementById('editModal');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const editBulletListBtn = document.getElementById('editBulletListBtn');
const editNumberListBtn = document.getElementById('editNumberListBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');
let currentEditId = null;
const todayDate = document.getElementById('todayDate');
const saveHabitsBtn = document.getElementById('saveHabitsBtn');
const habitsHint = document.getElementById('habitsHint');
const statStreak = document.getElementById('statStreak');
const statTotalWater = document.getElementById('statTotalWater');
const statTotalSport = document.getElementById('statTotalSport');
const statTotalRead = document.getElementById('statTotalRead');
const statTotalSleep = document.getElementById('statTotalSleep');
const statTotalWalk = document.getElementById('statTotalWalk');
const statTotalAll = document.getElementById('statTotalAll');
const statNotes = document.getElementById('statNotes');
const weekStats = document.getElementById('weekStats');
const resetDataBtn = document.getElementById('resetDataBtn');
const dayNotesContainer = document.getElementById('dayNotesContainer');
const selectedDateSpan = document.getElementById('selectedDate');
const dayNotesList = document.getElementById('dayNotesList');
const dayNoteInput = document.getElementById('dayNoteInput');
const addDayNoteBtn = document.getElementById('addDayNoteBtn');
const dayDetails = document.getElementById('dayDetails');
const progressVisualization = document.getElementById('progressVisualization');
const habitsList = document.getElementById('habitsList');
const themeToggle = document.getElementById('themeToggle');
let currentSelectedDate = null;

// ========== ТЕМА ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
        document.getElementById('themeColor')?.setAttribute('content', '#0a84ff');
    } else {
        themeToggle.textContent = '🌙';
        document.getElementById('themeColor')?.setAttribute('content', '#007aff');
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    document.getElementById('themeColor')?.setAttribute('content', isDark ? '#0a84ff' : '#007aff');
});

// ========== ЗАГРУЗКА ==========
function loadData() {
    // Загрузка профиля
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
        profile = JSON.parse(savedProfile);
        profileName.value = profile.name || '';
        profileBio.value = profile.bio || '';
        profileBirthday.value = profile.birthday || '';
        profileNameDisplay.textContent = profile.name || 'Иван Петров';
        if (profile.avatar) {
            if (profile.avatar.startsWith('data:image')) {
                avatarDisplay.innerHTML = `<img src="${profile.avatar}" alt="аватар">`;
            } else {
                avatarDisplay.textContent = profile.avatar;
            }
        }
    }
    
    // Загрузка заметок
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
        renderNotes();
    }
    
    // Загрузка привычек
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        // Добавляем новые привычки, если их нет
        HABIT_TYPES.forEach(habit => {
            if (!parsed[habit.id]) {
                parsed[habit.id] = { history: {} };
            } else if (!parsed[habit.id].history) {
                parsed[habit.id].history = {};
            }
        });
        habits = parsed;
    }
    
    // Загрузка заметок по дням
    const savedDayNotes = localStorage.getItem('dayNotes');
    if (savedDayNotes) {
        dayNotes = JSON.parse(savedDayNotes);
    }
    
    updateHabitsUI();
    updateStats();
}

// ========== НАВИГАЦИЯ ==========
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const screenId = tab.dataset.screen;
        screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId + 'Screen').classList.add('active');
        
        // Обновляем данные при переключении на экран статистики
        if (screenId === 'stats') {
            updateStats();
        }
    });
});

// ========== АВАТАР ==========
changeAvatarBtn.addEventListener('click', () => avatarUpload.click());

avatarUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Проверка размера файла (макс 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Файл слишком большой. Максимальный размер 2MB');
            return;
        }
        
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            avatarDisplay.innerHTML = `<img src="${imageData}" alt="аватар">`;
            profile.avatar = imageData;
            localStorage.setItem('profile', JSON.stringify(profile));
        };
        reader.readAsDataURL(file);
    }
});

// ========== ПРОФИЛЬ ==========
function saveProfile() {
    profile.name = profileName.value.trim() || 'Иван Петров';
    profile.bio = profileBio.value.trim() || 'Студент СПО, учусь мобильной разработке';
    profile.birthday = profileBirthday.value;
    profileNameDisplay.textContent = profile.name;
    
    localStorage.setItem('profile', JSON.stringify(profile));
    
    profileHint.classList.add('show');
    setTimeout(() => profileHint.classList.remove('show'), 1500);
}

saveProfileBtn.addEventListener('click', saveProfile);
profileName.addEventListener('input', saveProfile);
profileBio.addEventListener('input', saveProfile);
profileBirthday.addEventListener('change', saveProfile);

// ========== ЗАМЕТКИ ==========
function addNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    
    if (title && content) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        notes.unshift({
            id: Date.now(),
            title: title,
            content: content,
            date: dateStr,
            timestamp: now.toISOString()
        });
        
        localStorage.setItem('notes', JSON.stringify(notes));
        
        noteTitle.value = '';
        noteContent.value = '';
        
        renderNotes();
        updateStats();
        
        // Показываем уведомление
        showNotification('Заметка добавлена');
    }
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        currentEditId = id;
        editTitle.value = note.title;
        editContent.value = note.content;
        editModal.classList.remove('hidden');
    }
}

function saveEditedNote() {
    if (currentEditId) {
        const title = editTitle.value.trim();
        const content = editContent.value.trim();
        
        if (title && content) {
            const index = notes.findIndex(n => n.id === currentEditId);
            if (index !== -1) {
                notes[index].title = title;
                notes[index].content = content;
                
                localStorage.setItem('notes', JSON.stringify(notes));
                renderNotes();
                
                editModal.classList.add('hidden');
                currentEditId = null;
                
                showNotification('Заметка обновлена');
            }
        }
    }
}

function deleteNote(id) {
    if (confirm('Удалить заметку?')) {
        notes = notes.filter(note => note.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
        updateStats();
        showNotification('Заметка удалена');
    }
}

// Глобальные функции для кнопок в заметках
window.editNote = editNote;
window.deleteNote = deleteNote;

function renderNotes() {
    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>У вас пока нет заметок</p>
                <p style="font-size: 12px; margin-top: 8px;">Создайте первую заметку выше</p>
            </div>
        `;
        return;
    }
    
    notesList.innerHTML = notes.map(note => {
        // Экранируем HTML-теги в контенте
        const safeContent = note.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        
        return `
            <div class="note-card">
                <h4>
                    ${note.title}
                    <span class="note-actions">
                        <button class="edit-note" onclick="editNote(${note.id})" title="Редактировать">✏️</button>
                        <button class="delete-note" onclick="deleteNote(${note.id})" title="Удалить">✕</button>
                    </span>
                </h4>
                <div class="note-content">${safeContent}</div>
                <div class="note-footer">${note.date}</div>
            </div>
        `;
    }).join('');
}

addNoteBtn.addEventListener('click', addNote);

// Обработчики для списков
insertBulletListBtn.addEventListener('click', () => {
    noteContent.value += '\n• ';
    noteContent.focus();
});

insertNumberListBtn.addEventListener('click', () => {
    noteContent.value += '\n1. ';
    noteContent.focus();
});

editBulletListBtn.addEventListener('click', () => {
    editContent.value += '\n• ';
    editContent.focus();
});

editNumberListBtn.addEventListener('click', () => {
    editContent.value += '\n1. ';
    editContent.focus();
});

// Модальное окно
cancelEditBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
    currentEditId = null;
});

saveEditBtn.addEventListener('click', saveEditedNote);

editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.classList.add('hidden');
        currentEditId = null;
    }
});

// Закрытие модалки по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
        editModal.classList.add('hidden');
        currentEditId = null;
    }
});

// ========== ПРИВЫЧКИ ==========
function updateHabitsUI() {
    const today = new Date().toISOString().split('T')[0];
    
    // Генерируем HTML для всех привычек
    habitsList.innerHTML = HABIT_TYPES.map(habit => {
        const habitData = habits[habit.id] || { history: {} };
        const todayValue = habitData.history?.[today] || 0;
        const progressPercent = Math.min(100, (todayValue / habit.goal) * 100);
        
        // Форматируем значение с правильным количеством знаков
        const formattedValue = habit.unit === 'л' || habit.unit === 'ч' || habit.unit === 'км' 
            ? todayValue.toFixed(1) 
            : Math.round(todayValue);
        
        return `
            <div class="habit-item">
                <div class="habit-header">
                    <span class="habit-name">
                        <span style="font-size: 20px; margin-right: 6px;">${habit.icon}</span>
                        ${habit.name}
                    </span>
                    <span class="habit-value" id="${habit.id}Total">${formattedValue} ${habit.unit}</span>
                </div>
                <div class="habit-progress">
                    <input 
                        type="number" 
                        id="${habit.id}Input" 
                        min="0" 
                        step="${habit.step}" 
                        placeholder="${habit.goal} ${habit.unit}"
                        title="Введите значение"
                    >
                    <button id="add${habit.id.charAt(0).toUpperCase() + habit.id.slice(1)}Btn" title="Добавить">+</button>
                </div>
                <div class="habit-progress-bar">
                    <div class="habit-progress-fill" style="width: ${progressPercent}%; background: ${habit.color};"></div>
                </div>
                <div class="habit-stats">
                    <span>Цель: ${habit.goal} ${habit.unit}</span>
                    <span style="color: ${habit.color};">${progressPercent.toFixed(0)}%</span>
                </div>
                <div class="habit-total" id="${habit.id}History">
                    ${todayValue > 0 ? `Сегодня: ${formattedValue} ${habit.unit}` : 'Нет данных за сегодня'}
                </div>
            </div>
        `;
    }).join('');
    
    // Добавляем обработчики для каждой привычки
    HABIT_TYPES.forEach(habit => {
        const input = document.getElementById(`${habit.id}Input`);
        const btn = document.getElementById(`add${habit.id.charAt(0).toUpperCase() + habit.id.slice(1)}Btn`);
        
        if (input && btn) {
            // Обработчик для кнопки
            btn.addEventListener('click', () => addHabitValue(habit.id, input));
            
            // Обработчик для Enter
            input.addEventListener('keypress', (e) => { 
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addHabitValue(habit.id, input);
                }
            });
            
            // Валидация ввода
            input.addEventListener('input', () => {
                let value = parseFloat(input.value);
                if (value < 0) input.value = 0;
            });
        }
    });
}

function addHabitValue(type, input) {
    const today = new Date().toISOString().split('T')[0];
    let value = parseFloat(input.value);
    
    // Валидация
    if (isNaN(value) || value <= 0) {
        showNotification('Введите положительное число', 'error');
        return;
    }
    
    // Ограничиваем максимальное значение
    const habit = HABIT_TYPES.find(h => h.id === type);
    if (habit && value > habit.goal * 3) {
        if (!confirm(`Слишком большое значение (макс. ${habit.goal * 3} ${habit.unit}). Продолжить?`)) {
            return;
        }
    }
    
    // Добавляем значение
    if (!habits[type].history) habits[type].history = {};
    habits[type].history[today] = (habits[type].history[today] || 0) + value;
    
    // Обновляем streak
    updateStreak();
    
    // Сохраняем
    localStorage.setItem('habits', JSON.stringify(habits));
    
    // Обновляем UI
    updateHabitsUI();
    updateStats();
    
    // Очищаем input
    input.value = '';
    
    // Показываем уведомление
    showNotification(`+${value} ${habit.unit} ${habit.name.toLowerCase()}`);
}

function updateStreak() {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    
    // Проверяем последовательные дни
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let hasActivity = false;
        
        HABIT_TYPES.forEach(habit => {
            if (habits[habit.id]?.history?.[dateStr]) {
                hasActivity = true;
            }
        });
        
        if (hasActivity) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    habits.streak = streak;
}

saveHabitsBtn.addEventListener('click', () => {
    habitsHint.classList.add('show');
    setTimeout(() => habitsHint.classList.remove('show'), 1500);
    showNotification('Прогресс сохранен');
});

// ========== СТАТИСТИКА ==========
function updateStats() {
    // Подсчет totals
    const totals = {};
    HABIT_TYPES.forEach(habit => {
        totals[habit.id] = Object.values(habits[habit.id]?.history || {}).reduce((a, b) => a + b, 0);
    });
    
    // Обновляем отображение
    statStreak.textContent = habits.streak || 0;
    statTotalWater.textContent = totals.water?.toFixed(1) + ' л' || '0 л';
    statTotalSport.textContent = Math.round(totals.sport || 0) + ' мин';
    statTotalRead.textContent = Math.round(totals.read || 0) + ' мин';
    statTotalSleep.textContent = (totals.sleep || 0).toFixed(1) + ' ч';
    statTotalWalk.textContent = (totals.walk || 0).toFixed(1) + ' км';
    
    // Общее количество действий
    const totalActions = HABIT_TYPES.reduce((sum, habit) => {
        return sum + Object.keys(habits[habit.id]?.history || {}).length;
    }, 0);
    
    statTotalAll.textContent = totalActions;
    statNotes.textContent = notes.length;
    
    renderWeekCalendar();
    renderProgressVisualization();
}

function renderWeekCalendar() {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let html = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        let hasActivity = false;
        let activityCount = 0;
        
        HABIT_TYPES.forEach(habit => {
            if (habits[habit.id]?.history?.[dateStr]) {
                hasActivity = true;
                activityCount++;
            }
        });
        
        const isSelected = currentSelectedDate === dateStr;
        const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        let dayClass = 'week-day';
        if (hasActivity) dayClass += ' completed';
        if (isSelected) dayClass += ' selected';
        if (isToday && !hasActivity) dayClass += ' today';
        
        html += `<div class="${dayClass}" data-date="${dateStr}" title="${dateStr}">${dayName}</div>`;
    }
    
    weekStats.innerHTML = html;
    
    document.querySelectorAll('.week-day').forEach(day => {
        day.addEventListener('click', () => selectDate(day.dataset.date));
    });
}

function renderProgressVisualization() {
    // Получаем даты за последние 7 дней
    const dates = [];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push({
            date: date.toISOString().split('T')[0],
            dayName: dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]
        });
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
    
    HABIT_TYPES.forEach(habit => {
        html += `
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-primary); font-weight: 500;">
                        <span style="font-size: 18px; margin-right: 4px;">${habit.icon}</span>
                        ${habit.name}
                    </span>
                    <span style="color: ${habit.color};">цель: ${habit.goal} ${habit.unit}</span>
                </div>
        `;
        
        dates.forEach((item, index) => {
            const value = habits[habit.id]?.history?.[item.date] || 0;
            const percent = Math.min(100, (value / habit.goal) * 100);
            
            // Форматируем значение
            const formattedValue = habit.unit === 'л' || habit.unit === 'ч' || habit.unit === 'км' 
                ? value.toFixed(1) 
                : Math.round(value);
            
            html += `
                <div class="progress-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="width: 30px; color: var(--text-tertiary); font-size: 12px;">${item.dayName}</span>
                    <div class="progress-bar-container" style="flex: 1; height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                        <div class="progress-bar-fill" style="height: 100%; width: ${percent}%; background: ${habit.color}; transition: width 0.3s;"></div>
                    </div>
                    <span class="progress-value" style="width: 45px; color: var(--text-primary); font-size: 12px; text-align: right;">
                        ${formattedValue} ${habit.unit}
                    </span>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    html += '</div>';
    progressVisualization.innerHTML = html;
}

function selectDate(date) {
    currentSelectedDate = date;
    
    // Обновляем выделение в календаре
    document.querySelectorAll('.week-day').forEach(day => {
        day.classList.toggle('selected', day.dataset.date === date);
    });
    
    const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    selectedDateSpan.textContent = formattedDate;
    
    // Показываем детали дня
    let detailsHtml = '<div style="margin-bottom: 16px;">';
    let hasActivity = false;
    
    HABIT_TYPES.forEach(habit => {
        const value = habits[habit.id]?.history?.[date] || 0;
        if (value > 0) {
            hasActivity = true;
            const formattedValue = habit.unit === 'л' || habit.unit === 'ч' || habit.unit === 'км' 
                ? value.toFixed(1) 
                : Math.round(value);
            
            detailsHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 8px; background: var(--bg-card); border-radius: 8px;">
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 18px;">${habit.icon}</span>
                        ${habit.name}
                    </span>
                    <span style="color: ${habit.color}; font-weight: 500;">${formattedValue} ${habit.unit}</span>
                </div>
            `;
        }
    });
    
    if (!hasActivity) {
        detailsHtml += '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">Нет активности в этот день</p>';
    }
    detailsHtml += '</div>';
    
    dayDetails.innerHTML = detailsHtml;
    
    // Показываем заметки за день
    const notesForDay = dayNotes[date] || [];
    dayNotesList.innerHTML = notesForDay.length 
        ? notesForDay.map((note, i) => `
            <div class="day-note-item">
                <div class="note-content-wrapper">${note}</div>
                <button class="delete-note" onclick="deleteDayNote('${date}', ${i})" title="Удалить">✕</button>
            </div>
        `).join('')
        : '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">Нет заметок за этот день</p>';
    
    dayNotesContainer.style.display = 'block';
}

// Глобальная функция для удаления заметок дня
window.deleteDayNote = (date, index) => {
    if (dayNotes[date]) {
        dayNotes[date].splice(index, 1);
        if (dayNotes[date].length === 0) delete dayNotes[date];
        localStorage.setItem('dayNotes', JSON.stringify(dayNotes));
        selectDate(date);
        showNotification('Заметка удалена');
    }
};

addDayNoteBtn.addEventListener('click', () => {
    if (currentSelectedDate && dayNoteInput.value.trim()) {
        const note = dayNoteInput.value.trim();
        
        if (!dayNotes[currentSelectedDate]) {
            dayNotes[currentSelectedDate] = [];
        }
        
        dayNotes[currentSelectedDate].push(note);
        localStorage.setItem('dayNotes', JSON.stringify(dayNotes));
        
        dayNoteInput.value = '';
        selectDate(currentSelectedDate);
        showNotification('Заметка добавлена');
    }
});

// ========== СБРОС ДАННЫХ ==========
resetDataBtn.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        localStorage.clear();
        location.reload();
    }
});

// ========== УТИЛИТЫ ==========
function showNotification(message, type = 'success') {
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Добавляем анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
    }
    
    .week-day.today {
        border: 2px solid var(--accent-color);
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/public/sw.js')
            .then(reg => console.log('✅ Service Worker зарегистрирован'))
            .catch(err => console.log('❌ Ошибка Service Worker:', err));
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
todayDate.textContent = new Date().toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
});

initTheme();
loadData();

// Обработка онлайн/оффлайн статуса
window.addEventListener('online', () => showNotification('Соединение восстановлено'));
window.addEventListener('offline', () => showNotification('Нет соединения с интернетом', 'error'));