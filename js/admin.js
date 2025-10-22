// JavaScript для админ-панели

// Конфигурация GitHub
let githubConfig = {
    token: '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',
    repo: 'Storage-Dreamy-Voice/data',
    branch: 'main'
};

// Загрузка конфигурации из localStorage
function loadConfig() {
    const savedConfig = localStorage.getItem('githubConfig');
    if (savedConfig) {
        githubConfig = { ...githubConfig, ...JSON.parse(savedConfig) };
        document.getElementById('github-token').value = githubConfig.token;
        document.getElementById('github-repo').value = githubConfig.repo;
        document.getElementById('github-branch').value = githubConfig.branch;
    }
}

// Сохранение конфигурации в localStorage
function saveConfig() {
    githubConfig.token = document.getElementById('github-token').value;
    githubConfig.repo = document.getElementById('github-repo').value;
    githubConfig.branch = document.getElementById('github-branch').value;
    
    localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
    showStatus('Настройки сохранены!', 'success');
}

// Показать статус
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'status-message';
    }, 5000);
}

// Проверка подключения к GitHub
async function testGitHubConnection() {
    if (!githubConfig.token) {
        showStatus('Введите GitHub токен', 'error');
        return;
    }
    
    try {
        showStatus('Проверка подключения...', 'info');
        
        const response = await fetch(`https://api.github.com/repos/${githubConfig.repo}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const repoData = await response.json();
            showStatus(`Подключение успешно! Репозиторий: ${repoData.name}`, 'success');
        } else {
            showStatus('Ошибка подключения. Проверьте токен и название репозитория', 'error');
        }
    } catch (error) {
        showStatus('Ошибка сети: ' + error.message, 'error');
    }
}

// Загрузка данных из GitHub
async function loadDataFromGitHub(filePath) {
    if (!githubConfig.token) {
        throw new Error('GitHub токен не настроен');
    }
    
    const url = `https://raw.githubusercontent.com/${githubConfig.repo}/${githubConfig.branch}/${filePath}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3.raw'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

// Сохранение данных в GitHub
async function saveDataToGitHub(filePath, data, commitMessage) {
    if (!githubConfig.token) {
        throw new Error('GitHub токен не настроен');
    }
    
    // Сначала получаем текущий SHA файла (если существует)
    let sha = null;
    try {
        const fileResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${filePath}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            sha = fileData.sha;
        }
    } catch (error) {
        // Файл не существует, это нормально
    }
    
    // Сохраняем файл
    const response = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
            branch: githubConfig.branch,
            sha: sha
        })
    });
    
    if (!response.ok) {
        throw new Error(`Ошибка сохранения: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

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
        let animeData = [];
        let episodesData = [];
        
        // Пытаемся загрузить из GitHub
        if (githubConfig.token) {
            try {
                animeData = await loadDataFromGitHub('data/anime.json');
                episodesData = await loadDataFromGitHub('data/episodes.json');
                showStatus('Данные загружены из GitHub', 'success');
            } catch (error) {
                console.warn('Не удалось загрузить из GitHub:', error.message);
                // Загружаем локальные данные
                const animeResponse = await fetch('data/anime.json');
                animeData = await animeResponse.json();
                
                const episodesResponse = await fetch('data/episodes.json');
                episodesData = await episodesResponse.json();
                showStatus('Используются локальные данные', 'warning');
            }
        } else {
            // Загружаем локальные данные
            const animeResponse = await fetch('data/anime.json');
            animeData = await animeResponse.json();
            
            const episodesResponse = await fetch('data/episodes.json');
            episodesData = await episodesResponse.json();
            showStatus('GitHub токен не настроен. Используются локальные данные', 'warning');
        }
        
        populateAnimeSelect(animeData);
        displayAdminAnimeList(animeData);
        displayAdminEpisodesList(episodesData, animeData);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showStatus('Ошибка загрузки данных: ' + error.message, 'error');
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
document.getElementById('add-anime-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('anime-title').value;
    const description = document.getElementById('anime-description').value;
    const poster = document.getElementById('anime-poster').value;
    const year = document.getElementById('anime-year').value;
    const genre = document.getElementById('anime-genre').value;
    const status = document.getElementById('anime-status').value;
    
    const newAnime = {
        id: Date.now(), // Простой способ генерации ID
        title,
        description,
        poster,
        year: parseInt(year),
        genre,
        status
    };
    
    try {
        // Загружаем текущие данные
        let animeData = [];
        try {
            animeData = await loadDataFromGitHub('data/anime.json');
        } catch (error) {
            // Если файла нет, начинаем с пустого массива
            animeData = [];
        }
        
        // Добавляем новое аниме
        animeData.push(newAnime);
        
        // Сохраняем в GitHub
        await saveDataToGitHub('data/anime.json', animeData, `Добавлено аниме: ${title}`);
        
        showStatus(`Аниме "${title}" добавлено!`, 'success');
        this.reset();
        loadAdminData(); // Перезагружаем данные
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showStatus('Ошибка сохранения: ' + error.message, 'error');
    }
});

// Обработка формы добавления серии
document.getElementById('add-episode-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const animeId = document.getElementById('episode-anime').value;
    const episodeNumber = document.getElementById('episode-number').value;
    const title = document.getElementById('episode-title').value;
    const kodikUrl = document.getElementById('episode-kodik').value;
    
    // Извлекаем код Kodik из ссылки
    const kodikCode = extractKodikCode(kodikUrl);
    
    if (!kodikCode) {
        showStatus('Не удалось извлечь код Kodik из ссылки. Проверьте формат ссылки.', 'error');
        return;
    }
    
    const newEpisode = {
        id: Date.now(),
        animeId: parseInt(animeId),
        episodeNumber: parseInt(episodeNumber),
        title,
        kodikUrl,
        kodikCode
    };
    
    try {
        // Загружаем текущие данные
        let episodesData = [];
        try {
            episodesData = await loadDataFromGitHub('data/episodes.json');
        } catch (error) {
            // Если файла нет, начинаем с пустого массива
            episodesData = [];
        }
        
        // Добавляем новую серию
        episodesData.push(newEpisode);
        
        // Сохраняем в GitHub
        await saveDataToGitHub('data/episodes.json', episodesData, `Добавлена серия: ${title}`);
        
        showStatus(`Серия "${title}" добавлена! Код Kodik: ${kodikCode}`, 'success');
        this.reset();
        loadAdminData(); // Перезагружаем данные
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showStatus('Ошибка сохранения: ' + error.message, 'error');
    }
});

// Функции редактирования и удаления (заглушки)
function editAnime(id) {
    alert(`Редактирование аниме с ID: ${id}`);
}

async function deleteAnime(id) {
    if (confirm('Вы уверены, что хотите удалить это аниме?')) {
        try {
            // Загружаем текущие данные
            const animeData = await loadDataFromGitHub('data/anime.json');
            
            // Удаляем аниме
            const updatedData = animeData.filter(anime => anime.id !== id);
            
            // Сохраняем в GitHub
            await saveDataToGitHub('data/anime.json', updatedData, `Удалено аниме с ID: ${id}`);
            
            showStatus('Аниме удалено!', 'success');
            loadAdminData(); // Перезагружаем данные
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showStatus('Ошибка удаления: ' + error.message, 'error');
        }
    }
}

function editEpisode(id) {
    alert(`Редактирование серии с ID: ${id}`);
}

async function deleteEpisode(id) {
    if (confirm('Вы уверены, что хотите удалить эту серию?')) {
        try {
            // Загружаем текущие данные
            const episodesData = await loadDataFromGitHub('data/episodes.json');
            
            // Удаляем серию
            const updatedData = episodesData.filter(episode => episode.id !== id);
            
            // Сохраняем в GitHub
            await saveDataToGitHub('data/episodes.json', updatedData, `Удалена серия с ID: ${id}`);
            
            showStatus('Серия удалена!', 'success');
            loadAdminData(); // Перезагружаем данные
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showStatus('Ошибка удаления: ' + error.message, 'error');
        }
    }
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем конфигурацию
    loadConfig();
    
    // Настройка вкладок
    setupTabs();
    
    // Загрузка данных
    loadAdminData();
    
    // Обработчики для кнопок настроек
    document.getElementById('save-settings').addEventListener('click', saveConfig);
    document.getElementById('test-connection').addEventListener('click', testGitHubConnection);
});
