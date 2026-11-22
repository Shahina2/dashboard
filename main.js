// --- Утилита для времени ---
function getTime() {
    return new Date().toLocaleTimeString('ru-RU');
}

// ==========================================
// ВИДЖЕТ 1: ПОИСК СЕРИАЛОВ (CINEMETA)
// ==========================================
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#show-query');
const searchBtn = document.querySelector('#search-btn');
const searchStatus = document.querySelector('#search-status');
const searchResults = document.querySelector('#search-results');
const searchSource = document.querySelector('#search-source');

async function searchShows(query) {
    searchResults.replaceChildren();
    searchStatus.textContent = 'Загрузка...';
    searchStatus.className = 'status';
    searchBtn.disabled = true;

    try {
        // Поиск сериалов через открытый каталог Cinemeta
        const apiUrl = `https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURIComponent(query)}.json`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Ошибка HTTP ' + res.status);
        
        const data = await res.json();

        // Проверка, что массив с результатами существует и не пуст
        if (!data.metas || !Array.isArray(data.metas) || data.metas.length === 0) {
            searchStatus.textContent = 'Ничего не найдено.';
            searchStatus.classList.add('error');
            return;
        }

        // Выводим первые 5 результатов
        data.metas.slice(0, 5).forEach(show => {
            const li = document.createElement('li');
            const info = document.createElement('span');
            
            // Формируем строку: Название (Год)
            const year = show.releaseInfo || show.year || 'год неизвестен';
            info.textContent = `${show.name} (${year})`;
            
            const addBtn = document.createElement('button');
            addBtn.textContent = '+ В список';
            addBtn.addEventListener('click', () => {
                addToWatchlist(show.name);
            });

            li.append(info, addBtn);
            searchResults.append(li);
        });

        searchStatus.textContent = 'Результаты поиска:';
        searchStatus.classList.add('success');
        searchSource.textContent = `Источник: Cinemeta • Обновлено: ${getTime()}`;

    } catch (err) {
        console.error(err); // Выведет ошибку в консоль, если что-то пойдёт не так
        searchStatus.textContent = 'Ошибка загрузки. Попробуйте ещё раз.';
        searchStatus.classList.add('error');
        searchSource.textContent = ''; 
    } finally {
        searchBtn.disabled = false;
    }
}

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (!q) {
        searchStatus.textContent = 'Введите название сериала.';
        searchStatus.classList.add('error');
        return;
    }
    searchShows(q);
});

// Запуск при загрузке (ищем Breaking Bad для примера)
searchShows('Breaking Bad');

// ==========================================
// ВИДЖЕТ 2: СЛУЧАЙНЫЙ ФИЛЬМ (CINEMETA)
// ==========================================
const randomBtn = document.querySelector('#random-btn');
const randomStatus = document.querySelector('#random-status');
const randomResult = document.querySelector('#random-result');
const randomSource = document.querySelector('#random-source');

async function loadRandomMovie() {
    randomResult.replaceChildren();
    randomStatus.textContent = 'Загрузка...';
    randomStatus.className = 'status';
    randomBtn.disabled = true;

    try {
        // Запрашиваем топ-каталог фильмов
        const res = await fetch('https://v3-cinemeta.strem.io/catalog/movie/top.json');
        if (!res.ok) throw new Error('Ошибка HTTP ' + res.status);
        const data = await res.json();

        // Проверяем структуру ответа
        if (!data.metas || !Array.isArray(data.metas) || data.metas.length === 0) {
            throw new Error('Пустой каталог');
        }

        // Выбираем случайный фильм
        const randomIndex = Math.floor(Math.random() * data.metas.length);
        const movie = data.metas[randomIndex];

        const title = document.createElement('h3');
        title.textContent = movie.name || 'Название не указано';
        
        const year = document.createElement('p');
        year.textContent = `Год: ${movie.releaseInfo || movie.year || 'неизвестен'}`;
        
        const desc = document.createElement('p');
        // Описание может быть длинным, обрезаем для карточки
        const text = movie.description || 'Описание отсутствует.';
        desc.textContent = text.length > 200 ? text.slice(0, 200) + '...' : text;

        randomResult.append(title, year, desc);
        
        randomStatus.textContent = '';
        randomSource.textContent = `Источник: Cinemeta • Обновлено: ${getTime()}`;

    } catch (err) {
        randomStatus.textContent = 'Не удалось загрузить фильм. Попробуйте ещё раз.';
        randomStatus.classList.add('error');
        randomSource.textContent = '';
    } finally {
        randomBtn.disabled = false;
    }
}

randomBtn.addEventListener('click', loadRandomMovie);
loadRandomMovie(); // Запуск при загрузке

// ==========================================
// ВИДЖЕТ 3: СПИСОК "ПОСМОТРЕТЬ" (ЛОКАЛЬНО)
// ==========================================
const watchlistForm = document.querySelector('#watchlist-form');
const watchlistInput = document.querySelector('#watchlist-input');
const watchlistUl = document.querySelector('#watchlist');

// Загрузка из localStorage
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

function renderWatchlist() {
    watchlistUl.replaceChildren();
    if (watchlist.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Список пуст. Добавьте фильм!';
        li.style.color = '#666';
        watchlistUl.append(li);
        return;
    }

    watchlist.forEach((movie, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = movie;
        
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Удалить';
        delBtn.addEventListener('click', () => {
            watchlist.splice(index, 1);
            saveWatchlist();
        });

        li.append(span, delBtn);
        watchlistUl.append(li);
    });
}

function saveWatchlist() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
}

function addToWatchlist(name) {
    if (!name) return;
    // Простая защита от дублей
    if (watchlist.includes(name)) {
        alert('Этот фильм уже в списке!');
        return;
    }
    watchlist.push(name);
    saveWatchlist();
}

watchlistForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = watchlistInput.value.trim();
    if (!val) {
        alert('Введите название фильма.');
        return;
    }
    addToWatchlist(val);
    watchlistInput.value = '';
});

// Первая отрисовка
renderWatchlist();
