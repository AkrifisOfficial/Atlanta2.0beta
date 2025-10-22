// JavaScript для админ-панели

// Переключение вкладок
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убираем активный класс у всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавляем активный класс к текущей кнопке и контенту
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Загрузка данных для админ-панели
async function loadAdminData() {
    try {
        // В реальном проекте здесь будут запросы к GitHub API
        const animeResponse = await fetch('data/anime.json');
        const animeData = await animeResponse.json();
        
        const episodesResponse = await fetch('data/episodes.json');
        const episodesData = await episodesResponse.json();
        
        populateAnimeSelect(animeData);
        displayAdminAnimeList(animeData);
        displayAdminEpisodesList(episodesData, animeData);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Заполнение выпадающего списка аниме
function populateAnimeSelect(animeList) {
    const select = document.getElementById('episode-anime');
    select.innerHTML = '<option value="">Выберите аниме</option>';
    
    animeList.forEach(anime => {
        const option = document.createElement('option');
        option.value = anime.id;
        option.textContent = anime.title;
        select.appendChild(option);
    });
}

// Отображение списка аниме в админ-панели
function displayAdminAnimeList(animeList) {
    const container = document.getElementById('admin-anime-list');
    
    if (animeList.length === 0) {
        container.innerHTML = '<p>Аниме не найдено</p>';
        return;
    }
    
    container.innerHTML = animeList.map(anime => `
        <div class="admin-item" data-id="${anime.id}">
            <div>
                <h3>${anime.title}</h3>
                <p>${anime.genre} • ${anime.year} • ${anime.status}</p>
            </div>
            <div class="admin-actions">
                <button class="btn-edit" onclick="editAnime(${anime.id})">Редактировать</button>
                <button class="btn-delete" onclick="deleteAnime(${anime.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Отображение списка серий в админ-панели
function displayAdminEpisodesList(episodesList, animeList) {
    const container = document.getElementById('admin-episodes-list');
    
    if (episodesList.length === 0) {
        container.innerHTML = '<p>Серии не найдены</p>';
        return;
    }
    
    // Создаем карту аниме для быстрого доступа
    const animeMap = {};
    animeList.forEach(anime => {
        animeMap[anime.id] = anime.title;
    });
    
    container.innerHTML = episodesList.map(episode => `
        <div class="admin-item" data-id="${episode.id}">
            <div>
                <h3>${animeMap[episode.animeId]} - Серия ${episode.episodeNumber}</h3>
                <p>${episode.title}</p>
                <p class="kodik-link">Ссылка Kodik: ${episode.kodikUrl}</p>
            </div>
            <div class="admin-actions">
                <button class="btn-edit" onclick="editEpisode(${episode.id})">Редактировать</button>
                <button class="btn-delete" onclick="deleteEpisode(${episode.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Извлечение кода Kodik из ссылки
function extractKodikCode(url) {
    // Разные форматы ссылок Kodik
    const patterns = [
        /kodik\.\w+\/video\/([a-zA-Z0-9]+)/, // kodik.info/video/CODE
        /kodik\.\w+\/seria\/([a-zA-Z0-9]+)/, // kodik.info/seria/CODE
        /kodik\.\w+\/embed\/([a-zA-Z0-9]+)/, // kodik.info/embed/CODE
        /\/video\/([a-zA-Z0-9]+)/, // /video/CODE
        /\/seria\/([a-zA-Z0-9]+)/, // /seria/CODE
        /\/embed\/([a-zA-Z0-9]+)/  // /embed/CODE
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// Обработка формы добавления аниме
document.getElementById('add-anime-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('anime-title').value;
    const description = document.getElementById('anime-description').value;
    const poster = document.getElementById('anime-poster').value;
    const year = document.getElementById('anime-year').value;
    const genre = document.getElementById('anime-genre').value;
    const status = document.getElementById('anime-status').value;
    
    // В реальном проекте здесь будет отправка данных на GitHub API
    console.log('Добавление аниме:', { title, description, poster, year, genre, status });
    
    alert('Аниме добавлено! В реальном проекте данные будут сохранены в репозитории GitHub.');
    this.reset();
});

// Обработка формы добавления серии
document.getElementById('add-episode-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const animeId = document.getElementById('episode-anime').value;
    const episodeNumber = document.getElementById('episode-number').value;
    const title = document.getElementById('episode-title').value;
    const kodikUrl = document.getElementById('episode-kodik').value;
    
    // Извлекаем код Kodik из ссылки
    const kodikCode = extractKodikCode(kodikUrl);
    
    if (!kodikCode) {
        alert('Не удалось извлечь код Kodik из ссылки. Проверьте формат ссылки.');
        return;
    }
    
    // В реальном проекте здесь будет отправка данных на GitHub API
    console.log('Добавление серии:', { 
        animeId, 
        episodeNumber, 
        title, 
        kodikUrl,
        kodikCode 
    });
    
    alert(`Серия добавлена! Код Kodik: ${kodikCode}`);
    this.reset();
});

// Функции редактирования и удаления (заглушки)
function editAnime(id) {
    alert(`Редактирование аниме с ID: ${id}`);
}

function deleteAnime(id) {
    if (confirm('Вы уверены, что хотите удалить это аниме?')) {
        alert(`Удаление аниме с ID: ${id}`);
    }
}

function editEpisode(id) {
    alert(`Редактирование серии с ID: ${id}`);
}

function deleteEpisode(id) {
    if (confirm('Вы уверены, что хотите удалить эту серию?')) {
        alert(`Удаление серии с ID: ${id}`);
    }
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    loadAdminData();
});
