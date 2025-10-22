// JavaScript для админ-панели

// Конфигурация GitHub
let githubConfig = {
    token: '',
    repo: 'Storage-Dreamy-Voice/data',
    branch: 'main'
};

// Загрузка конфигурации из localStorage
function loadConfig() {
    const savedConfig = localStorage.getItem('githubConfig');
    if (savedConfig) {
        githubConfig = { ...githubConfig, ...JSON.parse(savedConfig) };
        document.getElementById('github-token').value = githubConfig.token || '';
        document.getElementById('github-repo').value = githubConfig.repo;
        document.getElementById('github-branch').value = githubConfig.branch;
    }
}

// Сохранение конфигурации в localStorage
function saveConfig() {
    githubConfig.token = document.getElementById('github-token').value.trim();
    githubConfig.repo = document.getElementById('github-repo').value.trim();
    githubConfig.branch = document.getElementById('github-branch').value.trim();
    
    if (!githubConfig.token) {
        showStatus('Введите GitHub токен', 'error');
        return;
    }
    
    if (!githubConfig.repo) {
        showStatus('Введите название репозитория', 'error');
        return;
    }
    
    localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
    showStatus('Настройки сохранены!', 'success');
}

// Показать статус
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}

// Проверка подключения к GitHub
async function testGitHubConnection() {
    const token = document.getElementById('github-token').value.trim();
    const repo = document.getElementById('github-repo').value.trim();
    const branch = document.getElementById('github-branch').value.trim();
    
    if (!token) {
        showStatus('Введите GitHub токен', 'error');
        return;
    }
    
    if (!repo) {
        showStatus('Введите название репозитория', 'error');
        return;
    }
    
    // Валидация формата репозитория
    if (!repo.includes('/')) {
        showStatus('Формат репозитория: username/repo-name', 'error');
        return;
    }
    
    try {
        showStatus('Проверка подключения...', 'info');
        
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Dreamy-Voice-App'
            }
        });
        
        if (response.status === 401) {
            showStatus('Неверный токен. Проверьте правильность токена.', 'error');
            return;
        }
        
        if (response.status === 404) {
            showStatus('Репозиторий не найден. Проверьте название репозитория.', 'error');
            return;
        }
        
        if (response.status === 403) {
            const rateLimitReset = response.headers.get('X-RateLimit-Reset');
            if (rateLimitReset) {
                const resetTime = new Date(rateLimitReset * 1000);
                showStatus(`Превышен лимит запросов. Попробуйте после ${resetTime.toLocaleTimeString()}`, 'error');
            } else {
                showStatus('Доступ запрещен. Проверьте права токена.', 'error');
            }
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const repoData = await response.json();
        
        // Проверяем существование ветки
        const branchResponse = await fetch(`https://api.github.com/repos/${repo}/branches/${branch}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Dreamy-Voice-App'
            }
        });
        
        if (!branchResponse.ok) {
            showStatus(`Ветка "${branch}" не найдена в репозитории`, 'warning');
        }
        
        showStatus(`✅ Подключение успешно! Репозиторий: ${repoData.name}`, 'success');
        
    } catch (error) {
        console.error('GitHub connection error:', error);
        if (error.message.includes('Failed to fetch')) {
            showStatus('Ошибка сети. Проверьте интернет-соединение.', 'error');
        } else {
            showStatus(`Ошибка: ${error.message}`, 'error');
        }
    }
}

// Создание репозитория, если он не существует
async function createRepositoryIfNotExists() {
    const token = document.getElementById('github-token').value.trim();
    const repo = document.getElementById('github-repo').value.trim();
    const [username, repoName] = repo.split('/');
    
    if (!username || !repoName) {
        showStatus('Неверный формат репозитория', 'error');
        return false;
    }
    
    try {
        // Проверяем существование репозитория
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Dreamy-Voice-App'
            }
        });
        
        if (response.status === 404) {
            // Репозиторий не существует, создаем новый
            showStatus('Создание репозитория...', 'info');
            
            const createResponse = await fetch(`https://api.github.com/user/repos`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Dreamy-Voice-App'
                },
                body: JSON.stringify({
                    name: repoName,
                    description: 'Data repository for Dreamy Voice anime site',
                    private: false,
                    auto_init: true,
                    has_issues: false,
                    has_projects: false,
                    has_wiki: false
                })
            });
            
            if (createResponse.ok) {
                showStatus('✅ Репозиторий успешно создан!', 'success');
                return true;
            } else {
                const errorData = await createResponse.json();
                showStatus(`Ошибка создания репозитория: ${errorData.message}`, 'error');
                return false;
            }
        }
        
        return response.ok;
    } catch (error) {
        console.error('Repository creation error:', error);
        showStatus(`Ошибка: ${error.message}`, 'error');
        return false;
    }
}

// Загрузка данных из GitHub
async function loadDataFromGitHub(filePath) {
    if (!githubConfig.token) {
        throw new Error('GitHub токен не настроен');
    }
    
    const url = `https://raw.githubusercontent.com/${githubConfig.repo}/${githubConfig.branch}/${filePath}?timestamp=${Date.now()}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'Dreamy-Voice-App'
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
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Dreamy-Voice-App'
            }
        });
        
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            sha = fileData.sha;
        }
    } catch (error) {
        // Файл не существует, это нормально
    }
    
    // Кодируем данные в base64
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    
    // Сохраняем файл
    const response = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Dreamy-Voice-App'
        },
        body: JSON.stringify({
            message: commitMessage,
            content: content,
            branch: githubConfig.branch,
            sha: sha
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Ошибка сохранения: ${errorData.message || response.statusText}`);
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
                try {
                    const animeResponse = await fetch('data/anime.json');
                    animeData = await animeResponse.json();
                    
                    const episodesResponse = await fetch('data/episodes.json');
                    episodesData = await episodesResponse.json();
                    showStatus('Используются локальные данные', 'warning');
                } catch (localError) {
                    showStatus('Используются пустые данные', 'info');
                }
            }
        } else {
            showStatus('GitHub токен не настроен. Используются локальные данные', 'warning');
            try {
                const animeResponse = await fetch('data/anime.json');
                animeData = await animeResponse.json();
                
                const episodesResponse = await fetch('data/episodes.json');
                episodesData = await episodesResponse.json();
            } catch (error) {
                // Используем пустые массивы
                animeData = [];
                episodesData = [];
            }
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
    
    if (!animeList || animeList.length === 0) {
        container.innerHTML = '<p>Аниме не найдено. Добавьте первое аниме!</p>';
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
    
    if (!episodesList || episodesList.length === 0) {
        container.innerHTML = '<p>Серии не найдены. Добавьте первую серию!</p>';
        return;
    }
    
    // Создаем карту аниме для быстрого доступа
    const animeMap = {};
    animeList.forEach(anime => {
        animeMap[anime.id] = anime.title;
    });
    
    container.innerHTML = episodesList.map(episode => {
        const animeTitle = animeMap[episode.animeId] || 'Неизвестное аниме';
        return `
        <div class="admin-item" data-id="${episode.id}">
            <div>
                <h3>${animeTitle} - Серия ${episode.episodeNumber}</h3>
                <p>${episode.title}</p>
                <p class="kodik-link">Ссылка Kodik: ${episode.kodikUrl}</p>
            </div>
            <div class="admin-actions">
                <button class="btn-edit" onclick="editEpisode(${episode.id})">Редактировать</button>
                <button class="btn-delete" onclick="deleteEpisode(${episode.id})">Удалить</button>
            </div>
        </div>
    `}).join('');
}

// Извлечение кода Kodik из ссылки
function extractKodikCode(url) {
    if (!url) return null;
    
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
    
    const title = document.getElementById('anime-title').value.trim();
    const description = document.getElementById('anime-description').value.trim();
    const poster = document.getElementById('anime-poster').value.trim();
    const year = document.getElementById('anime-year').value;
    const genre = document.getElementById('anime-genre').value;
    const status = document.getElementById('anime-status').value;
    
    if (!title || !description || !poster || !year) {
        showStatus('Заполните все обязательные поля', 'error');
        return;
    }
    
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
        
        showStatus(`✅ Аниме "${title}" добавлено!`, 'success');
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
    const title = document.getElementById('episode-title').value.trim();
    const kodikUrl = document.getElementById('episode-kodik').value.trim();
    
    if (!animeId || !episodeNumber || !title || !kodikUrl) {
        showStatus('Заполните все обязательные поля', 'error');
        return;
    }
    
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
        
        showStatus(`✅ Серия "${title}" добавлена! Код Kodik: ${kodikCode}`, 'success');
        this.reset();
        loadAdminData(); // Перезагружаем данные
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showStatus('Ошибка сохранения: ' + error.message, 'error');
    }
});

// Функции редактирования и удаления
function editAnime(id) {
    showStatus(`Редактирование аниме с ID: ${id} - функция в разработке`, 'info');
}

async function deleteAnime(id) {
    if (!confirm('Вы уверены, что хотите удалить это аниме?')) return;
    
    try {
        // Загружаем текущие данные
        const animeData = await loadDataFromGitHub('data/anime.json');
        
        // Находим аниме для удаления
        const animeToDelete = animeData.find(a => a.id === id);
        if (!animeToDelete) {
            showStatus('Аниме не найдено', 'error');
            return;
        }
        
        // Удаляем аниме
        const updatedData = animeData.filter(anime => anime.id !== id);
        
        // Сохраняем в GitHub
        await saveDataToGitHub('data/anime.json', updatedData, `Удалено аниме: ${animeToDelete.title}`);
        
        showStatus('✅ Аниме удалено!', 'success');
        loadAdminData(); // Перезагружаем данные
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showStatus('Ошибка удаления: ' + error.message, 'error');
    }
}

function editEpisode(id) {
    showStatus(`Редактирование серии с ID: ${id} - функция в разработке`, 'info');
}

async function deleteEpisode(id) {
    if (!confirm('Вы уверены, что хотите удалить эту серию?')) return;
    
    try {
        // Загружаем текущие данные
        const episodesData = await loadDataFromGitHub('data/episodes.json');
        
        // Находим серию для удаления
        const episodeToDelete = episodesData.find(e => e.id === id);
        if (!episodeToDelete) {
            showStatus('Серия не найдена', 'error');
            return;
        }
        
        // Удаляем серию
        const updatedData = episodesData.filter(episode => episode.id !== id);
        
        // Сохраняем в GitHub
        await saveDataToGitHub('data/episodes.json', updatedData, `Удалена серия: ${episodeToDelete.title}`);
        
        showStatus('✅ Серия удалена!', 'success');
        loadAdminData(); // Перезагружаем данные
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showStatus('Ошибка удаления: ' + error.message, 'error');
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
    
    // Кнопка создания репозитория
    const createRepoBtn = document.createElement('button');
    createRepoBtn.textContent = 'Создать репозиторий';
    createRepoBtn.className = 'btn-secondary';
    createRepoBtn.style.marginLeft = '10px';
    createRepoBtn.addEventListener('click', createRepositoryIfNotExists);
    
    document.querySelector('.github-settings .settings-form').appendChild(createRepoBtn);
