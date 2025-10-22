// Основной JavaScript для главной страницы

// Загрузка данных аниме
async function loadAnime() {
    try {
        // В реальном проекте здесь будет запрос к GitHub API
        // Для демонстрации используем локальные данные
        const response = await fetch('data/anime.json');
        const animeData = await response.json();
        displayAnime(animeData);
        setupFilters(animeData);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.getElementById('anime-container').innerHTML = '<p>Ошибка загрузки данных</p>';
    }
}

// Отображение аниме
function displayAnime(animeList) {
    const container = document.getElementById('anime-container');
    
    if (animeList.length === 0) {
        container.innerHTML = '<p>Аниме не найдено</p>';
        return;
    }
    
    container.innerHTML = animeList.map(anime => `
        <div class="anime-card" data-id="${anime.id}">
            <img src="${anime.poster}" alt="${anime.title}">
            <div class="anime-card-content">
                <h3>${anime.title}</h3>
                <div class="tags">
                    <span class="tag">${anime.year}</span>
                    <span class="tag">${anime.genre}</span>
                    <span class="tag">${anime.status}</span>
                </div>
                <p>${anime.description.substring(0, 100)}...</p>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики событий для карточек
    document.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', function() {
            const animeId = this.getAttribute('data-id');
            window.location.href = `anime.html?id=${animeId}`;
        });
    });
}

// Настройка фильтров
function setupFilters(animeList) {
    const searchInput = document.getElementById('search');
    const genreFilter = document.getElementById('genre-filter');
    
    searchInput.addEventListener('input', function() {
        filterAnime(animeList);
    });
    
    genreFilter.addEventListener('change', function() {
        filterAnime(animeList);
    });
}

// Фильтрация аниме
function filterAnime(animeList) {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const genre = document.getElementById('genre-filter').value;
    
    const filteredAnime = animeList.filter(anime => {
        const matchesSearch = anime.title.toLowerCase().includes(searchTerm) || 
                             anime.description.toLowerCase().includes(searchTerm);
        const matchesGenre = !genre || anime.genre === genre;
        
        return matchesSearch && matchesGenre;
    });
    
    displayAnime(filteredAnime);
}

// Загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', loadAnime);
