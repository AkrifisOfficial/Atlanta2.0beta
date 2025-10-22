// JavaScript для страницы аниме

// Получение ID аниме из URL
function getAnimeId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Загрузка данных аниме
async function loadAnimeDetails() {
    const animeId = getAnimeId();
    
    if (!animeId) {
        document.querySelector('.anime-details').innerHTML = '<p>Аниме не найдено</p>';
        return;
    }
    
    try {
        let animeData = [];
        let episodesData = [];
        
        // Пытаемся загрузить из GitHub, если настроен токен
        const githubConfig = JSON.parse(localStorage.getItem('githubConfig') || '{}');
        
        if (githubConfig.token) {
            try {
                // Загружаем данные аниме из GitHub
                const animeResponse = await fetch(`https://raw.githubusercontent.com/${githubConfig.repo}/${githubConfig.branch}/data/anime.json`, {
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                });
                
                if (animeResponse.ok) {
                    animeData = await animeResponse.json();
                } else {
                    throw new Error('GitHub load failed');
                }
                
                // Загружаем данные серий из GitHub
                const episodesResponse = await fetch(`https://raw.githubusercontent.com/${githubConfig.repo}/${githubConfig.branch}/data/episodes.json`, {
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                });
                
                if (episodesResponse.ok) {
                    episodesData = await episodesResponse.json();
                } else {
                    throw new Error('GitHub load failed');
                }
                
                console.log('Данные загружены из GitHub');
            } catch (error) {
                console.warn('Не удалось загрузить из GitHub:', error.message);
                // Загружаем локальные данные
                const localAnimeResponse = await fetch('data/anime.json');
                animeData = await localAnimeResponse.json();
                
                const localEpisodesResponse = await fetch('data/episodes.json');
                episodesData = await localEpisodesResponse.json();
                console.log('Используются локальные данные');
            }
        } else {
            // Используем локальные данные
            const localAnimeResponse = await fetch('data/anime.json');
            animeData = await localAnimeResponse.json();
            
            const localEpisodesResponse = await fetch('data/episodes.json');
            episodesData = await localEpisodesResponse.json();
            console.log('GitHub токен не настроен. Используются локальные данные');
        }
        
        const anime = animeData.find(a => a.id == animeId);
        
        if (anime) {
            displayAnimeDetails(anime);
            const animeEpisodes = episodesData.filter(episode => episode.animeId == animeId);
            displayEpisodes(animeEpisodes);
        } else {
            document.querySelector('.anime-details').innerHTML = '<p>Аниме не найдено</p>';
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.querySelector('.anime-details').innerHTML = '<p>Ошибка загрузки данных</p>';
    }
}

// Отображение деталей аниме
function displayAnimeDetails(anime) {
    document.getElementById('anime-title').textContent = anime.title;
    document.getElementById('anime-poster').src = anime.poster;
    document.getElementById('anime-poster').alt = anime.title;
    document.getElementById('anime-year').textContent = anime.year;
    document.getElementById('anime-genre').textContent = anime.genre;
    document.getElementById('anime-status').textContent = anime.status;
    document.getElementById('anime-description').textContent = anime.description;
    
    // Обновляем заголовок страницы
    document.title = `${anime.title} - Dreamy Voice`;
    
    // Добавляем микроразметку для SEO
    addStructuredData(anime);
}

// Добавление структурированных данных для SEO
function addStructuredData(anime) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": anime.title,
        "description": anime.description,
        "image": anime.poster,
        "genre": anime.genre,
        "datePublished": `${anime.year}-01-01`,
        "numberOfSeasons": "1",
        "countryOfOrigin": {
            "@type": "Country",
            "name": "Japan"
        },
        "provider": {
            "@type": "Organization",
            "name": "Dreamy Voice",
            "description": "Озвучка аниме Dreamy Voice"
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// Отображение серий
function displayEpisodes(episodes) {
    const container = document.getElementById('episodes-list');
    
    if (episodes.length === 0) {
        container.innerHTML = '<p>Серии не найдены</p>';
        return;
    }
    
    // Сортируем серии по номеру
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    
    container.innerHTML = episodes.map(episode => `
        <div class="episode-card" data-kodik="${episode.kodikCode}" data-title="${episode.title}">
            <span class="episode-number">Серия ${episode.episodeNumber}</span>
            <h3>${episode.title}</h3>
            <div class="episode-meta">
                <span class="voice-badge-small">DREAMY VOICE</span>
                <span class="checkmarks-small">✔️ ✔️ ✔️</span>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики событий для серий
    document.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', function() {
            const kodikCode = this.getAttribute('data-kodik');
            const episodeTitle = this.getAttribute('data-title');
            openEpisodeModal(kodikCode, episodeTitle);
        });
    });
    
    // Добавляем анимацию появления серий
    animateEpisodes();
}

// Анимация появления серий
function animateEpisodes() {
    const episodes = document.querySelectorAll('.episode-card');
    episodes.forEach((episode, index) => {
        episode.style.opacity = '0';
        episode.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            episode.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            episode.style.opacity = '1';
            episode.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

// Открытие модального окна с плеером
function openEpisodeModal(kodikCode, episodeTitle) {
    const modal = document.getElementById('episode-modal');
    const playerContainer = document.getElementById('kodik-player');
    
    // Показываем заголовок серии в модальном окне
    const modalTitle = document.querySelector('.modal-title') || createModalTitle();
    modalTitle.textContent = episodeTitle;
    
    // Создаем iframe с плеером Kodik
    playerContainer.innerHTML = `
        <iframe src="https://kodik.info/embed/${kodikCode}?min_age=18&domain=localhost" 
                frameborder="0" 
                allowfullscreen 
                style="width: 100%; height: 100%;"
                allow="autoplay *; fullscreen *">
        </iframe>
    `;
    
    modal.style.display = 'block';
    
    // Блокируем прокрутку body
    document.body.style.overflow = 'hidden';
    
    // Добавляем обработчик клавиши Escape
    document.addEventListener('keydown', handleEscapeKey);
    
    // Отслеживаем историю просмотров
    trackWatchHistory(kodikCode, episodeTitle);
}

// Создание заголовка для модального окна
function createModalTitle() {
    const modalContent = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.close');
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'modal-title';
    titleElement.style.color = '#8a2be2';
    titleElement.style.marginBottom = '15px';
    titleElement.style.textAlign = 'center';
    
    modalContent.insertBefore(titleElement, closeButton.nextSibling);
    return titleElement;
}

// Обработка клавиши Escape
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

// Отслеживание истории просмотров
function trackWatchHistory(kodikCode, episodeTitle) {
    let watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    // Удаляем старую запись с тем же kodikCode, если есть
    watchHistory = watchHistory.filter(item => item.kodikCode !== kodikCode);
    
    // Добавляем новую запись в начало
    const animeId = getAnimeId();
    const watchRecord = {
        animeId: parseInt(animeId),
        kodikCode: kodikCode,
        episodeTitle: episodeTitle,
        watchedAt: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    watchHistory.unshift(watchRecord);
    
    // Сохраняем только последние 50 записей
    if (watchHistory.length > 50) {
        watchHistory = watchHistory.slice(0, 50);
    }
    
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    updateContinueWatching();
}

// Обновление блока "Продолжить просмотр"
function updateContinueWatching() {
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    if (watchHistory.length > 0) {
        // Создаем или обновляем блок "Продолжить просмотр"
        let continueSection = document.querySelector('.continue-watching');
        
        if (!continueSection) {
            continueSection = document.createElement('section');
            continueSection.className = 'continue-watching';
            continueSection.innerHTML = `
                <div class="container">
                    <h2>Продолжить просмотр</h2>
                    <div id="continue-watching-list" class="episodes-grid">
                        <!-- Список будет заполнен через JavaScript -->
                    </div>
                </div>
            `;
            
            const animeDetails = document.querySelector('.anime-details');
            animeDetails.parentNode.insertBefore(continueSection, animeDetails.nextSibling);
        }
        
        displayContinueWatching(watchHistory);
    }
}

// Отображение списка "Продолжить просмотр"
async function displayContinueWatching(watchHistory) {
    const container = document.getElementById('continue-watching-list');
    
    if (!container) return;
    
    try {
        // Загружаем данные аниме для получения названий
        let animeData = [];
        const githubConfig = JSON.parse(localStorage.getItem('githubConfig') || '{}');
        
        if (githubConfig.token) {
            try {
                const animeResponse = await fetch(`https://raw.githubusercontent.com/${githubConfig.repo}/${githubConfig.branch}/data/anime.json`, {
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                });
                
                if (animeResponse.ok) {
                    animeData = await animeResponse.json();
                }
            } catch (error) {
                const localResponse = await fetch('data/anime.json');
                animeData = await localResponse.json();
            }
        } else {
            const localResponse = await fetch('data/anime.json');
            animeData = await localResponse.json();
        }
        
        // Создаем карту аниме для быстрого доступа
        const animeMap = {};
        animeData.forEach(anime => {
            animeMap[anime.id] = anime;
        });
        
        // Отображаем последние 5 просмотренных серий
        const recentWatches = watchHistory.slice(0, 5);
        
        container.innerHTML = recentWatches.map(watch => {
            const anime = animeMap[watch.animeId];
            if (!anime) return '';
            
            const timeAgo = getTimeAgo(watch.timestamp);
            
            return `
                <div class="episode-card continue-card" data-anime-id="${watch.animeId}" data-kodik="${watch.kodikCode}" data-title="${watch.episodeTitle}">
                    <div class="continue-header">
                        <span class="anime-title">${anime.title}</span>
                        <span class="watch-time">${timeAgo}</span>
                    </div>
                    <span class="episode-number">${watch.episodeTitle}</span>
                    <div class="continue-meta">
                        <span class="voice-badge-small">DREAMY VOICE</span>
                        <span class="checkmarks-small">✔️ ✔️ ✔️</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Добавляем обработчики для карточек "Продолжить просмотр"
        document.querySelectorAll('.continue-card').forEach(card => {
            card.addEventListener('click', function() {
                const kodikCode = this.getAttribute('data-kodik');
                const episodeTitle = this.getAttribute('data-title');
                openEpisodeModal(kodikCode, episodeTitle);
            });
        });
        
    } catch (error) {
        console.error('Ошибка загрузки данных для продолжения просмотра:', error);
    }
}

// Функция для форматирования времени (сколько времени прошло)
function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} дн назад`;
    if (days < 30) return `${Math.floor(days / 7)} нед назад`;
    
    return 'более месяца назад';
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('episode-modal');
    modal.style.display = 'none';
    
    // Очищаем плеер
    document.getElementById('kodik-player').innerHTML = '';
    
    // Восстанавливаем прокрутку body
    document.body.style.overflow = 'auto';
    
    // Удаляем обработчик клавиши Escape
    document.removeEventListener('keydown', handleEscapeKey);
}

// Настройка обработчиков событий для модального окна
document.addEventListener('DOMContentLoaded', function() {
    loadAnimeDetails();
    
    // Закрытие модального окна
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('episode-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Добавляем кнопку "Назад" к аниме
    addBackButton();
});

// Добавление кнопки "Назад"
function addBackButton() {
    const animeMeta = document.querySelector('.anime-meta');
    if (animeMeta && !document.querySelector('.back-button')) {
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.innerHTML = '← Назад к списку аниме';
        backButton.addEventListener('click', () => {
            window.history.back();
        });
        
        animeMeta.insertBefore(backButton, animeMeta.firstChild);
    }
}

// Обработка изменения видимости страницы (для паузы видео при сворачивании вкладки)
document.addEventListener('visibilitychange', function() {
    const modal = document.getElementById('episode-modal');
    const iframe = document.querySelector('#kodik-player iframe');
    
    if (document.hidden && modal.style.display === 'block' && iframe) {
        // При сворачивании вкладки можно приостановить видео
        // Kodik плеер не всегда поддерживает управление извне,
        // но мы можем хотя бы скрыть модальное окно
        // closeModal();
    }
});

// Добавляем стили для новых элементов
function injectAdditionalStyles() {
    const additionalStyles = `
        .back-button {
            background: linear-gradient(135deg, #8a2be2, #6a1cb2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 15px;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .back-button:hover {
            background: linear-gradient(135deg, #6a1cb2, #4a148c);
            transform: translateY(-2px);
        }
        
        .episode-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
        }
        
        .voice-badge-small {
            background-color: #8a2be2;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .checkmarks-small {
            font-size: 12px;
        }
        
        .continue-watching {
            margin: 30px 0;
        }
        
        .continue-card {
            position: relative;
        }
        
        .continue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .anime-title {
            font-size: 12px;
            color: #8a2be2;
            font-weight: bold;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .watch-time {
            font-size: 10px;
            color: #888;
            margin-left: 8px;
        }
        
        .continue-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
        }
        
        .modal-title {
            color: #8a2be2 !important;
            margin-bottom: 15px !important;
            text-align: center !important;
            font-size: 18px !important;
            padding: 0 20px !important;
        }
        
        @media (max-width: 768px) {
            .continue-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .watch-time {
                margin-left: 0;
                margin-top: 4px;
            }
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}

// Внедряем дополнительные стили при загрузке
injectAdditionalStyles();
