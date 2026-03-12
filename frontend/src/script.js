// ========== ДАННЫЕ ==========
let profile = {
    name: 'Иван Петров',
    bio: 'Студент СПО, учусь мобильной разработке',
    birthday: '',
    avatar: null
};
let notes = [];
let habits = {
    water: { history: {} },
    sport: { history: {} },
    read: { history: {} },
    lastUpdate: '',
    streak: 0
};
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
const waterTotal = document.getElementById('waterTotal');
const waterInput = document.getElementById('waterInput');
const addWaterBtn = document.getElementById('addWaterBtn');
const waterHistory = document.getElementById('waterHistory');
const sportTotal = document.getElementById('sportTotal');
const sportInput = document.getElementById('sportInput');
const addSportBtn = document.getElementById('addSportBtn');
const sportHistory = document.getElementById('sportHistory');
const readTotal = document.getElementById('readTotal');
const readInput = document.getElementById('readInput');
const addReadBtn = document.getElementById('addReadBtn');
const readHistory = document.getElementById('readHistory');
const saveHabitsBtn = document.getElementById('saveHabitsBtn');
const habitsHint = document.getElementById('habitsHint');
const statStreak = document.getElementById('statStreak');
const statTotalWater = document.getElementById('statTotalWater');
const statTotalSport = document.getElementById('statTotalSport');
const statTotalRead = document.getElementById('statTotalRead');
const statTotalAll = document.getElementById('statTotalAll');
const statNotes = document.getElementById('statNotes');
const weekStats = document.getElementById('weekStats');
const resetDataBtn = document.getElementById('resetDataBtn');
const dayNotesContainer = document.getElementById('dayNotesContainer');
const selectedDateSpan = document.getElementById('selectedDate');
const dayNotesList = document.getElementById('dayNotesList');
const dayNoteInput = document.getElementById('dayNoteInput');
const addDayNoteBtn = document.getElementById('addDayNoteBtn');
let currentSelectedDate = null;

// ========== ЗАГРУЗКА ==========
function loadData() {
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
        profile = JSON.parse(savedProfile);
        profileName.value = profile.name || '';
        profileBio.value = profile.bio || '';
        profileBirthday.value = profile.birthday || '';
        profileNameDisplay.textContent = profile.name || 'Иван Петров';
        if (profile.avatar) {
            if (profile.avatar.startsWith('data:image')) {
                avatarDisplay.innerHTML = `<img src="${profile.avatar}" alt="avatar">`;
            } else {
                avatarDisplay.textContent = profile.avatar;
            }
        }
    }
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
        renderNotes();
    }
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
        updateHabitsUI();
    }
    const savedDayNotes = localStorage.getItem('dayNotes');
    if (savedDayNotes) {
        dayNotes = JSON.parse(savedDayNotes);
    }
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
    });
});

// ========== АВАТАР ==========
changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
avatarUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            avatarDisplay.innerHTML = `<img src="${imageData}" alt="avatar">`;
            profile.avatar = imageData;
            localStorage.setItem('profile', JSON.stringify(profile));
        };
        reader.readAsDataURL(file);
    }
});

// ========== ПРОФИЛЬ ==========
function saveProfile() {
    profile.name = profileName.value;
    profile.bio = profileBio.value;
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
    if (noteTitle.value.trim() && noteContent.value.trim()) {
        notes.unshift({
            id: Date.now(),
            title: noteTitle.value,
            content: noteContent.value,
            date: new Date().toLocaleDateString('ru-RU')
        });
        localStorage.setItem('notes', JSON.stringify(notes));
        noteTitle.value = '';
        noteContent.value = '';
        renderNotes();
        updateStats();
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
    if (currentEditId && editTitle.value.trim() && editContent.value.trim()) {
        const index = notes.findIndex(n => n.id === currentEditId);
        if (index !== -1) {
            notes[index].title = editTitle.value;
            notes[index].content = editContent.value;
            localStorage.setItem('notes', JSON.stringify(notes));
            renderNotes();
        }
    }
    editModal.classList.add('hidden');
    currentEditId = null;
}
window.deleteNote = function(id) {
    if (confirm('Удалить заметку?')) {
        notes = notes.filter(note => note.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
        updateStats();
    }
};
window.editNote = editNote;
function renderNotes() {
    notesList.innerHTML = notes.map(note => `
        <div class="note-card">
            <h4>${note.title}
                <span class="note-actions">
                    <button class="edit-note" onclick="editNote(${note.id})">✏️</button>
                    <button class="delete-note" onclick="deleteNote(${note.id})">✕</button>
                </span>
            </h4>
            <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
            <div class="note-footer">${note.date}</div>
        </div>
    `).join('');
}
addNoteBtn.addEventListener('click', addNote);
insertBulletListBtn.addEventListener('click', () => { noteContent.value += '\n• '; noteContent.focus(); });
insertNumberListBtn.addEventListener('click', () => { noteContent.value += '\n1. '; noteContent.focus(); });
editBulletListBtn.addEventListener('click', () => { editContent.value += '\n• '; editContent.focus(); });
editNumberListBtn.addEventListener('click', () => { editContent.value += '\n1. '; editContent.focus(); });
cancelEditBtn.addEventListener('click', () => { editModal.classList.add('hidden'); currentEditId = null; });
saveEditBtn.addEventListener('click', saveEditedNote);
editModal.addEventListener('click', (e) => { if (e.target === editModal) { editModal.classList.add('hidden'); currentEditId = null; } });

// ========== ПРИВЫЧКИ ==========
function updateHabitsUI() {
    const today = new Date().toISOString().split('T')[0];
    waterTotal.textContent = (habits.water.history?.[today] || 0).toFixed(1) + ' л';
    sportTotal.textContent = (habits.sport.history?.[today] || 0) + ' мин';
    readTotal.textContent = (habits.read.history?.[today] || 0) + ' мин';
    waterHistory.textContent = habits.water.history?.[today] ? `Сегодня: ${habits.water.history[today].toFixed(1)} л` : '';
    sportHistory.textContent = habits.sport.history?.[today] ? `Сегодня: ${habits.sport.history[today]} мин` : '';
    readHistory.textContent = habits.read.history?.[today] ? `Сегодня: ${habits.read.history[today]} мин` : '';
}
function addHabitValue(type, input) {
    const today = new Date().toISOString().split('T')[0];
    const value = parseFloat(input.value);
    if (value > 0) {
        if (!habits[type].history) habits[type].history = {};
        habits[type].history[today] = (habits[type].history[today] || 0) + value;
        habits.lastUpdate = today;
        localStorage.setItem('habits', JSON.stringify(habits));
        updateHabitsUI();
        updateStats();
        input.value = '';
    }
}
addWaterBtn.addEventListener('click', () => addHabitValue('water', waterInput));
addSportBtn.addEventListener('click', () => addHabitValue('sport', sportInput));
addReadBtn.addEventListener('click', () => addHabitValue('read', readInput));
[waterInput, sportInput, readInput].forEach(input => {
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addHabitValue(input.id.replace('Input',''), input); });
});
saveHabitsBtn.addEventListener('click', () => {
    habitsHint.classList.add('show');
    setTimeout(() => habitsHint.classList.remove('show'), 1500);
});

// ========== СТАТИСТИКА ==========
function updateStats() {
    const totalWater = Object.values(habits.water.history || {}).reduce((a,b)=>a+b,0);
    const totalSport = Object.values(habits.sport.history || {}).reduce((a,b)=>a+b,0);
    const totalRead = Object.values(habits.read.history || {}).reduce((a,b)=>a+b,0);
    statStreak.textContent = habits.streak || 0;
    statTotalWater.textContent = totalWater.toFixed(1) + ' л';
    statTotalSport.textContent = totalSport + ' мин';
    statTotalRead.textContent = totalRead + ' мин';
    statTotalAll.textContent = Object.keys(habits.water.history||{}).length + Object.keys(habits.sport.history||{}).length + Object.keys(habits.read.history||{}).length;
    statNotes.textContent = notes.length;
    renderWeekCalendar();
}
function renderWeekCalendar() {
    const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    let html = '';
    for (let i=0;i<7;i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6-i));
        const dateStr = date.toISOString().split('T')[0];
        const hasWater = habits.water.history?.[dateStr];
        const hasSport = habits.sport.history?.[dateStr];
        const hasRead = habits.read.history?.[dateStr];
        const hasActivity = hasWater || hasSport || hasRead;
        const isSelected = currentSelectedDate === dateStr;
        html += `<div class="week-day ${hasActivity?'completed':''} ${isSelected?'selected':''}" data-date="${dateStr}">${days[i]}</div>`;
    }
    weekStats.innerHTML = html;
    document.querySelectorAll('.week-day').forEach(day => {
        day.addEventListener('click', () => selectDate(day.dataset.date));
    });
}
function selectDate(date) {
    currentSelectedDate = date;
    document.querySelectorAll('.week-day').forEach(day => day.classList.toggle('selected', day.dataset.date === date));
    const formattedDate = new Date(date).toLocaleDateString('ru-RU');
    selectedDateSpan.textContent = formattedDate;
    const notesForDay = dayNotes[date] || [];
    dayNotesList.innerHTML = notesForDay.length 
        ? notesForDay.map((note,i) => `<div class="day-note-item">${note}<small>${formattedDate}</small><button class="delete-note" onclick="deleteDayNote('${date}',${i})">✕</button></div>`).join('')
        : '<p style="color:#999;">Нет заметок за этот день</p>';
    dayNotesContainer.style.display = 'block';
}
window.deleteDayNote = (date, index) => {
    if (dayNotes[date]) {
        dayNotes[date].splice(index, 1);
        if (dayNotes[date].length===0) delete dayNotes[date];
        localStorage.setItem('dayNotes', JSON.stringify(dayNotes));
        selectDate(date);
    }
};
addDayNoteBtn.addEventListener('click', () => {
    if (currentSelectedDate && dayNoteInput.value.trim()) {
        if (!dayNotes[currentSelectedDate]) dayNotes[currentSelectedDate] = [];
        dayNotes[currentSelectedDate].push(dayNoteInput.value);
        localStorage.setItem('dayNotes', JSON.stringify(dayNotes));
        dayNoteInput.value = '';
        selectDate(currentSelectedDate);
    }
});
resetDataBtn.addEventListener('click', () => {
    if (confirm('Удалить все данные?')) {
        localStorage.clear();
        location.reload();
    }
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/public/sw.js')
            .then(reg => console.log('✅ SW registered'))
            .catch(err => console.log('❌ SW error:', err));
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
todayDate.textContent = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
loadData();