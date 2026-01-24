let _path;
let _objlist = [];
let _lastvalidsearch = "";
let json;
let _currentCategory = localStorage.getItem('selectedCategory') || "All";

function loadFile(path) {
    _path = path;
    
    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            json = data;
            readJS();
        })
        .catch(err => {
            console.error("Error loading JSON file", err);
        });
}

function readJS() {
    if (json) {
        window.addEventListener('keydown', (e) => {
            if (e.key === "D") {
                devInfo(json);
            }
        });
        createElements();
    } else {
        console.error("JSON data is not available");
    }
}

function openPage(type, src, title) {
    window.location.href = `/pages/host.html?type=${type}&src=${encodeURIComponent(src)}&title=${encodeURIComponent(title)}`;
}

function noImgs(json) {
    let titles = [];
    json.forEach(obj => {
        if (!obj.hasOwnProperty('img')) {
            titles.push(obj.title);
        }
    });
    return { "titles": titles, "number": titles.length };
}

function purifyText(input) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function getUniqueCategories(jsonData) {
    const categories = new Set(['All']);
    jsonData.forEach(obj => {
        if (obj.category) {
            categories.add(obj.category);
        }
    });
    return Array.from(categories).sort();
}

function filterGames() {
    const searchBar = document.getElementById('searchBar');
    let searchText = purifyText(searchBar.value);

    let results = {
        failed: [],
        success: []
    };

    _objlist.forEach((entry) => {
        entry = String(entry).split(',');

        let entryTitle = purifyText(entry[0]);
        let entryId = entry[1];
        let entryCategory = entry[2];

        const matchesSearch = searchText === '' || entryTitle.includes(searchText);
        const matchesCategory = _currentCategory === 'All' || entryCategory === _currentCategory;

        if (matchesSearch && matchesCategory) {
            results.success.push(entryId);
        } else {
            results.failed.push(entryId);
        }
    });

    if (results.success.length === 0) {
        document.getElementById('validsearch').hidden = false;
        document.getElementById('currentsearch').textContent = searchText || _currentCategory;
        document.getElementById('lastvalidsearch').textContent = _lastvalidsearch;
    } else {
        document.getElementById('validsearch').hidden = true;
        if (searchText) {
            _lastvalidsearch = searchText;
        }

        results.failed.forEach((e) => {
            let elem = document.getElementById(e);
            if (elem) elem.style.display = 'none';
        });

        results.success.forEach((e) => {
            let elem = document.getElementById(e);
            if (elem) {
                elem.style.display = 'flex';
                elem.style.alignItems = 'flex-end';
                elem.style.position = 'relative';
                void elem.offsetHeight;
            }
        });
    }
}

function createElements() {
    document.getElementById('preload').remove();

    const categories = getUniqueCategories(json);

    let wrapperDiv = document.createElement('div');
    wrapperDiv.innerHTML = `
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .mainWrapper {
        margin-left: 75px;
        width: calc(100% - 75px);
        padding: 2rem 0;
        box-sizing: border-box;
    }

    .searchContainer {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-bottom: 3rem;
        padding: 0 2rem;
    }

    .searchBarWrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        max-width: 700px;
        width: 700px;
        min-width: 700px;
    }

    .searchBar {
        background: rgba(26, 26, 36, 0.8);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(147, 51, 234, 0.3);
        box-shadow: 0 8px 32px rgba(147, 51, 234, 0.15);
        height: 60px;
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        padding: 0 24px;
        border-radius: 15px;
        font-size: 16px;
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
    }

    .searchBar::placeholder {
        color: #a1a1aa;
    }

    .searchBar:focus {
        outline: none;
        border-color: rgba(147, 51, 234, 0.6);
        box-shadow: 0 12px 40px rgba(147, 51, 234, 0.25);
        background: rgba(26, 26, 36, 0.95);
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
    }

    .categorySelect {
        background: rgba(26, 26, 36, 0.8);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(147, 51, 234, 0.3);
        box-shadow: 0 8px 32px rgba(147, 51, 234, 0.15);
        height: 60px;
        padding: 0 24px;
        border-radius: 15px;
        font-size: 16px;
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        cursor: pointer;
        transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 200px;
    }

    .categorySelect:hover {
        border-color: rgba(147, 51, 234, 0.5);
    }

    .categorySelect:focus {
        outline: none;
        border-color: rgba(147, 51, 234, 0.6);
        box-shadow: 0 12px 40px rgba(147, 51, 234, 0.25);
        background: rgba(26, 26, 36, 0.95);
    }

    .categorySelect option {
        background: rgba(26, 26, 36, 0.95);
        color: #ffffff;
        padding: 10px;
    }

    #validsearch {
        margin-top: 1rem;
        color: #a1a1aa;
        font-size: 14px;
        font-weight: 400;
        text-align: center;
    }

    #validsearch span {
        color: #9333ea;
        font-weight: 600;
    }

    .gameCardsGrid {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        width: 100%;
        padding: 0 2rem;
        justify-content: center;
    }

    .objHolder {
        position: relative;
        background: rgba(26, 26, 36, 0.6);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(147, 51, 234, 0.2);
        border-radius: 15px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.5s cubic-bezier(0.34, 1.45, 0.64, 1), 
                    box-shadow 0.5s cubic-bezier(0.34, 1.45, 0.64, 1),
                    border-color 0.3s ease;
        width: 160px;
        height: 160px;
        flex-shrink: 0;
        display: flex;
        align-items: flex-end;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        margin-top: 60px;
    }

    .objHolder::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(236, 72, 153, 0.15));
        opacity: 0;
        transition: opacity 0.5s ease;
        z-index: 1;
    }

    .objHolder:hover {
        transform: translateY(-25px);
        border-color: rgba(147, 51, 234, 0.6);
        box-shadow: 0 35px 80px rgba(147, 51, 234, 0.45), 
                    0 20px 40px rgba(0, 0, 0, 0.6),
                    0 0 0 1px rgba(147, 51, 234, 0.4);
    }

    .objHolder:hover::before {
        opacity: 1;
    }

    .objImg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s cubic-bezier(0.34, 1.45, 0.64, 1);
    }

    .objHolder:hover .objImg {
        transform: scale(1.08);
    }

    .titleHolder {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1.5rem 1rem;
        background: linear-gradient(to top, rgba(10, 10, 15, 0.95), rgba(10, 10, 15, 0.7), transparent);
        z-index: 2;
        transform: translateY(0);
        transition: all 0.3s ease;
    }

    .objHolder:hover .titleHolder {
        background: linear-gradient(to top, rgba(10, 10, 15, 0.98), rgba(10, 10, 15, 0.85), transparent);
    }

    .objTitle {
        color: #ffffff;
        font-size: 15px;
        font-weight: 600;
        margin: 0;
        text-align: center;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        letter-spacing: 0.5px;
        font-family: 'Inter', sans-serif;
    }

    @media (max-width: 968px) {
        .searchContainer {
            flex-direction: column;
            gap: 1rem;
        }

        .searchBarWrapper {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
        }

        .categorySelect {
            width: 100%;
        }
    }

    @media (max-width: 768px) {
        .mainWrapper {
            margin-left: 0;
            width: 100%;
            padding: 1.5rem;
            padding-bottom: 90px;
        }

        .searchContainer {
            margin-bottom: 2rem;
            padding: 0 1rem;
        }

        .gameCardsGrid {
            gap: 2rem;
            padding: 0 1rem;
        }

        .objHolder {
            width: 140px;
            height: 140px;
        }

        .searchBar {
            height: 50px;
            font-size: 14px;
        }

        .categorySelect {
            height: 50px;
            font-size: 14px;
            min-width: unset;
        }

        .objTitle {
            font-size: 13px;
        }
    }

    @media (max-width: 480px) {
        .mainWrapper {
            padding: 1rem;
            padding-bottom: 90px;
        }

        .gameCardsGrid {
            gap: 1.5rem;
        }

        .objHolder {
            width: 120px;
            height: 120px;
        }
    }
    </style>
    <div class="mainWrapper">
        <div class="searchContainer">
            <div class="searchBarWrapper">
                <input id="searchBar" class="searchBar" placeholder="Credits to Alexr Games" type="text">
                <h3 id="validsearch" hidden="true">
                    No results for '<span id="currentsearch"></span>', showing '<span id="lastvalidsearch"></span>'
                </h3>
            </div>
            <select id="categorySelect" class="categorySelect">
                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </div>
        <div class="gameCardsGrid" id="gameCardsGrid">
        </div>
    </div>
    `;

    document.getElementById('objs').appendChild(wrapperDiv);

    const searchBar = document.getElementById('searchBar');
    const categorySelect = document.getElementById('categorySelect');

 
    categorySelect.value = _currentCategory;

    searchBar.addEventListener('keyup', filterGames);

    categorySelect.addEventListener('change', (e) => {
        _currentCategory = e.target.value;
        localStorage.setItem('selectedCategory', _currentCategory);
        filterGames();
    });

    let id = 0;

    json.forEach((obj) => {
        let title = String(obj.title).replace(`'`, ``);
        let tags = obj.category || "Uncategorized"; 
        let loadType = obj.iframe ? "iframe" : "direct"; 
        let img = obj.img;
        let description = obj.description || "No description";
        let source = String(obj.path).replace(`'`, ``);
      
        if (source && !source.startsWith('/')) {
            source = '/' + source;
        }

        let objHolder = document.createElement('div');
        objHolder.setAttribute('id', id);
        objHolder.setAttribute('class', 'objHolder');
        objHolder.setAttribute('onclick', `openPage('${loadType}','${source}','${title}')`);

        let imgElem = document.createElement('img');
        imgElem.setAttribute('class', 'objImg');

        if (img != undefined) {
            imgElem.src = img; 
        } else {
            imgElem.src = 'https://placehold.co/200x200';
        }

        imgElem.alt = title;

        objHolder.appendChild(imgElem);

        let titleHolder = document.createElement('div');
        titleHolder.setAttribute('class', 'titleHolder');

        let titleElem = document.createElement('h3');
        titleElem.setAttribute('class', 'objTitle');
        titleElem.textContent = title;

        titleHolder.appendChild(titleElem);
        objHolder.appendChild(titleHolder);
        document.getElementById('gameCardsGrid').appendChild(objHolder);

        _objlist.push(`${title},${id},${tags},${description}`);

        id++;
    });
}