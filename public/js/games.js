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
 

    console.log(`[openPage] Opening ${type} app: ${title}`);
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
    const categories = new Set();
    jsonData.forEach(obj => {
        if (obj.category) {
            categories.add(obj.category);
        }
    });
    const sortedCategories = Array.from(categories).sort();
    return ['All', ...sortedCategories];
}

function showNoResultsMessage() {
    const gameCardsGrid = document.getElementById('gameCardsGrid');
    
   
    if (document.getElementById('noResultsMessage')) {
        return;
    }
    
   
    const noResultsDiv = document.createElement('div');
    noResultsDiv.id = 'noResultsMessage';
    noResultsDiv.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 4rem 2rem;
            text-align: center;
        ">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--theme-primary)" stroke-width="1.5" style="margin-bottom: 2rem; opacity: 0.5;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <h2 style="
                color: #ffffff;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 1rem;
                font-family: 'Inter', sans-serif;
            ">App/Game Not Found</h2>
            <p style="
                color: var(--theme-light);
                font-size: 18px;
                font-weight: 400;
                margin-bottom: 2rem;
                max-width: 600px;
                line-height: 1.6;
                font-family: 'Inter', sans-serif;
            ">
                Trying to find the app or game you're looking for?<br>
                Join our Discord server to request it!
            </p>
            <a href="https://discord.gg/vAF5AZHwwD" target="_blank" style="
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 2rem;
                background: var(--theme-primary);
                color: #ffffff;
                text-decoration: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
                transition: all 0.3s ease;
                box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 32px rgba(147, 51, 234, 0.4)';" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px rgba(147, 51, 234, 0.3)';">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Join Our Discord Server
            </a>
        </div>
    `;
    
    gameCardsGrid.appendChild(noResultsDiv);
}

function hideNoResultsMessage() {
    const noResultsMsg = document.getElementById('noResultsMessage');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
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
       
        results.failed.forEach((e) => {
            let elem = document.getElementById(e);
            if (elem) elem.style.display = 'none';
        });
        
  
        showNoResultsMessage();
    } else {
   
        hideNoResultsMessage();
        
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
        position: relative;
    }

    .searchIcon {
        position: absolute;
        left: 24px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        pointer-events: none;
        z-index: 10;
    }

  .searchBar {
    background: rgba(10, 0, 21, 0.7);
    backdrop-filter: blur(10px);
    border: 2px solid var(--theme-primary);
    box-shadow: 0 8px 32px rgba(147, 51, 234, 0.15);
    height: 60px;
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    padding: 0 24px 0 56px;
    border-radius: 15px;
    font-size: 16px;
    font-family: 'Inter', sans-serif;
    transition: all 0.3s ease;
    box-sizing: border-box;
    outline: none;
    color: var(--theme-light);
}

.searchBar::placeholder {
    color: var(--theme-light);
    opacity: 0.5;
}

.searchBar:focus {
    border-color: var(--theme-primary);
    box-shadow: 0 0 20px var(--theme-primary);
    outline: none;
    color: var(--theme-light);
}

.searchBar:focus-visible {
    outline: none;
}


  .categorySelect {
    background: rgba(10, 0, 21, 0.7);
    backdrop-filter: blur(10px);
    border: 2px solid var(--theme-primary);
    box-shadow: 0 8px 32px rgba(147, 51, 234, 0.15);
    height: 60px;
    padding: 0 24px;
    border-radius: 15px;
    font-size: 16px;
    color: var(--theme-light);
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
    outline: none;
}

.categorySelect:hover {
    border-color: var(--theme-primary);
}

.categorySelect:focus {
    outline: none;
    border-color: var(--theme-primary);
    box-shadow: 0 0 20px var(--theme-primary);
}

.categorySelect:focus-visible {
    outline: none;
}

.categorySelect option {
    background: rgba(10, 0, 21, 0.95);
    color: var(--theme-light);
    padding: 10px;
}

.categorySelect option:checked {
    background: var(--theme-primary);
    color: #ffffff;
}

    .gameCardsGrid {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        width: 100%;
        padding: 0 2rem;
        justify-content: center;
        min-height: 400px;
    }

    .objHolder {
        position: relative;
        background: rgba(26, 26, 36, 0.6);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(147, 51, 234, 0.6);
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
        border-color: rgba(147, 51, 234, 0.9);
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
                <svg class="searchIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--theme-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input id="searchBar" class="searchBar" placeholder="Search for apps and games..." type="text">
            </div>
            <select id="categorySelect" class="categorySelect">
                ${categories.map(cat => `<option value="${cat}" ${cat === _currentCategory ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
        </div>
        <div class="gameCardsGrid" id="gameCardsGrid">
        </div>
    </div>
    `;

    document.getElementById('objs').appendChild(wrapperDiv);

    const searchBar = document.getElementById('searchBar');
    const categorySelect = document.getElementById('categorySelect');

 
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
      
      
        if (loadType === 'iframe' && source && !source.startsWith('/') && !source.startsWith('http')) {
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