// Основной JavaScript для главной страницы

// В js/main.js и js/anime.js замените функцию loadAnime на:

async function loadAnime() {
    try {
        // Пытаемся загрузить из GitHub, если настроен токен
        let animeData = [];
        const githubConfig = JSON.parse(localStorage.getItem('githubConfig') || '{}');
        
        if (githubConfig.token) {
            try {
                const response = await fetch(`https://raw.githubusercontent.com/${githubConfig.repo}/${githubConfig.branch}/data/anime.json`, {
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                });
                
                if (response.ok) {
                    animeData = await response.json();
                } else {
                    throw new Error('GitHub load failed');
                }
            } catch (error) {
                // Если не удалось загрузить из GitHub, используем локальные данные
                const localResponse = await fetch('data/anime.json');
                animeData = await localResponse.json();
            }
        } else {
            // Используем локальные данные
            const localResponse = await fetch('data/anime.json');
            animeData = await localResponse.json();
        }
        
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
