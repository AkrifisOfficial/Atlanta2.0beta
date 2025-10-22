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
        // В реальном проекте здесь будет запрос к GitHub API
        const response = await fetch('data/anime.json');
        const animeData = await response.json();
        const anime = animeData.find(a => a.id == animeId);
        
        if (anime) {
            displayAnimeDetails(anime);
            loadEpisodes(animeId);
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
}

// Загрузка серий
async function loadEpisodes(animeId) {
    try {
        // В реальном проекте здесь будет запрос к GitHub API
        const response = await fetch('data/episodes.json');
        const episodesData = await response.json();
        const animeEpisodes = episodesData.filter(episode => episode.animeId == animeId);
        
        displayEpisodes(animeEpisodes);
    } catch (error) {
        console.error('Ошибка загрузки серий:', error);
        document.getElementById('episodes-list').innerHTML = '<p>Ошибка загрузки серий</p>';
    }
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
        <div class="episode-card" data-kodik="${episode.kodikCode}">
            <span class="episode-number">Серия ${episode.episodeNumber}</span>
            <h3>${episode.title}</h3>
        </div>
    `).join('');
    
    // Добавляем обработчики событий для серий
    document.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', function() {
            const kodikCode = this.getAttribute('data-kodik');
            openEpisodeModal(kodikCode);
        });
    });
}

// Открытие модального окна с плеером
function openEpisodeModal(kodikCode) {
    const modal = document.getElementById('episode-modal');
    const playerContainer = document.getElementById('kodik-player');
    
    // В реальном проекте здесь будет код для встраивания плеера Kodik
    playerContainer.innerHTML = `
        <iframe src="https://kodik.info/seria/${kodikCode}" 
                frameborder="0" 
                allowfullscreen></iframe>
    `;
    
    modal.style.display = 'block';
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('episode-modal');
    modal.style.display = 'none';
    
    // Очищаем плеер
    document.getElementById('kodik-player').innerHTML = '';
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
});
