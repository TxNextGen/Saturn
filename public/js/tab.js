let _connection = new BareMux.BareMuxConnection("/baremux/worker.js");

async function registerSW() {
    if (!('serviceWorker' in navigator)) {
        throw new Error("Service workers not supported");
    }

    console.log('[registerSW] Registering UV service worker...');

    const reg = await navigator.serviceWorker.register('/uv/sw.js', {
        scope: '/@/'
    });

    console.log('[registerSW] ✅ UV Service Worker registered:', reg.scope);
    return reg;
}

function getProxyBackend() {
    return localStorage.getItem('proxy-backend') || 'uv';
}

window.currentProxyBackend = getProxyBackend();
console.log(`[tab.js] Initialized with ${window.currentProxyBackend.toUpperCase()} proxy backend`);

function switchProxyBackend(backend) {
    window.currentProxyBackend = backend;
    localStorage.setItem('proxy-backend', backend);
    console.log(`[tab.js] Switched to ${backend.toUpperCase()} proxy backend`);
}

function getEncodedUrl(url) {
    if (!url) return "";

    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    const backend = getProxyBackend();
    window.currentProxyBackend = backend;
    console.log(`[getEncodedUrl] Using backend: ${backend} for URL: ${url}`);

    if (backend === "scramjet") {
        const encoded = "/scram/?url=" + encodeURIComponent(url);
        console.log(`[getEncodedUrl] Scramjet encoded: ${encoded}`);
        return encoded;
    } else {
        if (typeof __uv$config === 'undefined') {
            console.error('[getEncodedUrl] ❌ UV config not found!');
            return "/uv/service/" + encodeURIComponent(url);
        }

        if (typeof __uv$config.encodeUrl !== 'function') {
            console.error('[getEncodedUrl] ❌ UV encodeUrl function not found!');
            return __uv$config.prefix + encodeURIComponent(url);
        }

        const encoded = __uv$config.prefix + __uv$config.encodeUrl(url);
        console.log(`[getEncodedUrl] ✅ UV encoded successfully: ${encoded}`);
        return encoded;
    }
}


window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('=== UV CONFIG DIAGNOSTIC ===');
        console.log('UV Config exists:', typeof __uv$config !== 'undefined');
        if (typeof __uv$config !== 'undefined') {
            console.log('UV Prefix:', __uv$config.prefix);
            console.log('UV encodeUrl:', typeof __uv$config.encodeUrl);
        }
        console.log('========================');
    }, 1000);
});

async function setConnection(arg) {
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    console.log('[setConnection] WISP URL:', wispUrl);
    
    switch (arg) {
        case 1:
            await _connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
            localStorage.setItem('proxy-transport', 'Epoxy');
            console.log('[setConnection] ✅ Set transport to Epoxy');
            break;
        case 2:
            await _connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
            localStorage.setItem('proxy-transport', 'Libcurl');
            console.log('[setConnection] ✅ Set transport to Libcurl');
            break;
    }
}


if (!localStorage.getItem('proxy-transport')) {
    setConnection(1);
} else {
    if (localStorage.getItem('proxy-transport') === "Epoxy") setConnection(1);
    if (localStorage.getItem('proxy-transport') === "Libcurl") setConnection(2);
}


if (!localStorage.getItem('search-engine')) {
    localStorage.setItem('search-engine', 'DuckDuckGo');
    localStorage.setItem('search-engine-url', 'https://duckduckgo.com/?q=%s');
}

if (!localStorage.getItem('tab-system-enabled')) {
    localStorage.setItem('tab-system-enabled', 'true');
}

if (!localStorage.getItem('proxy-backend')) {
    localStorage.setItem('proxy-backend', 'uv');
}


let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let erudaLoaded = false;
let lastSearchedUrl = null;
let navigationInProgress = false;


function isTabSystemEnabled() {
    return localStorage.getItem('tab-system-enabled') !== 'false';
}

function updateProxyUIVisibility() {
    const tabSystemEnabled = isTabSystemEnabled();
    const proxyContainer = document.getElementById('proxy-container');
    if (!proxyContainer) return;

    const tabBar = document.getElementById('tab-bar');
    const topBar = document.querySelector('.top-bar');
    const iframeWrapper = document.getElementById('iframe-wrapper');

    if (tabSystemEnabled) {
        if (tabBar) tabBar.style.display = 'flex';
        if (topBar) topBar.style.display = 'flex';
        proxyContainer.style.paddingTop = '';
        if (iframeWrapper) {
            iframeWrapper.style.position = '';
            iframeWrapper.style.top = '';
            iframeWrapper.style.left = '';
            iframeWrapper.style.width = '';
            iframeWrapper.style.height = '';
        }
    } else {
        if (tabBar) tabBar.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        proxyContainer.style.paddingTop = '0';
        if (iframeWrapper) {
            iframeWrapper.style.position = 'fixed';
            iframeWrapper.style.top = '0';
            iframeWrapper.style.left = '60px';
            iframeWrapper.style.width = 'calc(100vw - 60px)';
            iframeWrapper.style.height = '100vh';
        }
    }
}


function updateLockIcon(url) {
    const lockIcon = document.querySelector('.lock-icon-container');
    if (!lockIcon) return;

    try {
        if (url && url.startsWith('https://')) {
            lockIcon.classList.remove('insecure');
            lockIcon.classList.add('secure');
            lockIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            `;
        } else {
            lockIcon.classList.remove('secure');
            lockIcon.classList.add('insecure');
            lockIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
            `;
        }
    } catch (e) {
        lockIcon.classList.remove('secure');
        lockIcon.classList.add('insecure');
    }
}


function createTab(url = null, title = 'New Tab') {
    const tabId = `tab-${tabIdCounter++}`;
    
  
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'iframe-container';
    iframeContainer.id = `container-${tabId}`;

    const iframe = document.createElement('iframe');
    iframe.id = `frame-${tabId}`;
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-read; clipboard-write');

   
    if (url) {
        const encodedUrl = getEncodedUrl(url);
        console.log(`[createTab] Creating tab ${tabId}:`, {
            originalUrl: url,
            encodedUrl: encodedUrl,
            backend: getProxyBackend()
        });
        iframe.src = encodedUrl;
        title = 'Loading...';
    }

    iframeContainer.appendChild(iframe);
    document.getElementById('iframe-wrapper').appendChild(iframeContainer);


    const tab = {
        id: tabId,
        url: url || '',
        title: title,
        iframe: iframe,
        container: iframeContainer,
        loading: !!url,
        favicon: '/images/sat4.png'
    };

    tabs.push(tab);


    let titleUpdateTimeout;
    iframe.addEventListener('load', () => {
        tab.loading = false;
        
     
        if (titleUpdateTimeout) clearTimeout(titleUpdateTimeout);
        
     
        titleUpdateTimeout = setTimeout(() => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc && iframeDoc.title) {
                    tab.title = iframeDoc.title;
                } else if (url) {
                    
                    try {
                        const hostname = new URL(url).hostname.replace('www.', '');
                        tab.title = hostname;
                    } catch {
                        tab.title = 'Page Loaded';
                    }
                }
            } catch (e) {
           
                if (url) {
                    try {
                        const hostname = new URL(url).hostname.replace('www.', '');
                        tab.title = hostname;
                    } catch {
                        tab.title = 'Page Loaded';
                    }
                }
            }
            
            if (isTabSystemEnabled()) renderTabs();
            updateUrlBar();
        }, 300);
    });


    iframe.addEventListener('error', (e) => {
        console.error('[createTab] Iframe error:', e);
        tab.loading = false;
        tab.title = 'Failed to load';
        if (isTabSystemEnabled()) renderTabs();
    });

    if (isTabSystemEnabled()) renderTabs();
    switchToTab(tabId);

    return tab;
}


function closeTab(tabId, event) {
    if (event) {
        event.stopPropagation();
    }

    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const tab = tabs[index];
    

    tab.container.remove();
    tabs.splice(index, 1);

    if (tabs.length === 0) {
        showHome();
    } else if (activeTabId === tabId) {
    
        const newIndex = Math.min(index, tabs.length - 1);
        switchToTab(tabs[newIndex].id);
    }

    if (isTabSystemEnabled()) renderTabs();
}


function switchToTab(tabId) {
    if (activeTabId === tabId) return;
    
    activeTabId = tabId;
    
    tabs.forEach(tab => {
        if (tab.id === tabId) {
            tab.container.classList.add('active');
        } else {
            tab.container.classList.remove('active');
        }
    });
    
    if (isTabSystemEnabled()) renderTabs();
    updateUrlBar();
    

    setTimeout(() => {
        const activeTabElement = document.querySelector('.tab.active');
        if (activeTabElement) {
            activeTabElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest', 
                inline: 'center' 
            });
        }
    }, 50);
}


function updateUrlBar() {
    const activeTab = tabs.find(t => t.id === activeTabId);
    const urlBar = document.getElementById('proxy-url-bar');
    if (activeTab && urlBar) {
        urlBar.value = activeTab.url || '';
        updateLockIcon(activeTab.url);
    }
}


function renderTabs() {
    const container = document.getElementById('tabs-container');
    if (!container) return;
    
    if (!isTabSystemEnabled()) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = '';

    tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.setAttribute('data-tab-id', tab.id);
        
        if (tab.id === activeTabId) {
            tabEl.classList.add('active');
        }
        
        if (tab.loading) {
            tabEl.classList.add('loading');
        }

   
        const favicon = document.createElement('img');
        favicon.className = 'tab-favicon';
        favicon.src = tab.favicon || '/images/sat4.png';
        favicon.onerror = () => {
            favicon.src = '/images/sat4.png';
        };

   
        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title || 'New Tab';
        title.title = tab.title || 'New Tab'; 

       
        const closeBtn = document.createElement('div');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id, e);
        });

       
        tabEl.addEventListener('click', () => switchToTab(tab.id));

        tabEl.appendChild(favicon);
        tabEl.appendChild(title);
        tabEl.appendChild(closeBtn);
        container.appendChild(tabEl);
    });
}


function showHome() {
    document.getElementById('home-container').classList.remove('hidden');
    document.getElementById('proxy-container').classList.remove('active');
}

function hideHome() {
    document.getElementById('home-container').classList.add('hidden');
    document.getElementById('proxy-container').classList.add('active');
    updateProxyUIVisibility();
}


function getActiveIframe() {
    const activeTab = tabs.find(t => t.id === activeTabId);
    return activeTab ? activeTab.iframe : null;
}


function injectDevTools() {
    if (erudaLoaded) {
        if (window.eruda._isInit) {
            window.eruda.destroy();
        } else {
            window.eruda.init();
        }
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/eruda/3.0.1/eruda.js';
    script.onload = () => {
        window.eruda.init();
        erudaLoaded = true;
    };
    script.onerror = () => alert('Failed to load dev tools');
    document.head.appendChild(script);
}


async function goTo(url) {
    if (navigationInProgress) {
        console.log('[goTo] Navigation already in progress, ignoring...');
        return;
    }

    console.log(`[goTo] Starting navigation to: ${url}`);
    navigationInProgress = true;

    try {
     
        if (typeof registerSW === 'function') {
            console.log('[goTo] Registering service worker...');
            await registerSW();
            console.log('[goTo] ✅ Service worker registered');
        } else {
            console.warn('[goTo] ⚠️ registerSW function not found');
        }
    } catch (err) {
        console.error('[goTo] ❌ Service worker registration failed:', err);
        const error = document.getElementById('uv-error');
        const errorCode = document.getElementById('uv-error-code');
        if (error) error.textContent = "Failed to register service worker.";
        if (errorCode) errorCode.textContent = err.toString();
        navigationInProgress = false;
        return;
    }

    lastSearchedUrl = url;
    hideHome();


    if (!isTabSystemEnabled() && tabs.length > 0) {
        const activeTab = tabs[0];
        const encodedUrl = getEncodedUrl(url);
        console.log(`[goTo] Navigating existing tab to: ${encodedUrl}`);
        activeTab.iframe.src = encodedUrl;
        activeTab.url = url;
        activeTab.title = 'Loading...';
        activeTab.loading = true;
        switchToTab(activeTab.id);
        if (isTabSystemEnabled()) renderTabs();
    } else {
        console.log(`[goTo] Creating new tab for: ${url}`);
        createTab(url);
    }

    navigationInProgress = false;
}


function quickGo(url) {
    goTo(url);
}


function buildUrl(query) {
    query = (query || '').trim();
    if (!query) return null;

    const hasProtocol = /^https?:\/\//i.test(query);
    const hasSpaces = query.includes(' ');
    

    if (hasProtocol) return query;
    

    if (hasSpaces) {
        const searchEngine = localStorage.getItem('search-engine-url') || 'https://duckduckgo.com/?q=%s';
        return searchEngine.replace('%s', encodeURIComponent(query));
    }
    

    const isProbablyUrl = /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(query) || 
                         /^localhost(:\d+)?(\/.*)?$/i.test(query);
    
    if (isProbablyUrl) {
        return 'https://' + query;
    }
    
  
    const searchEngine = localStorage.getItem('search-engine-url') || 'https://duckduckgo.com/?q=%s';
    return searchEngine.replace('%s', encodeURIComponent(query));
}



function toggleSearchEnginePopup() {
    let popup = document.getElementById('search-engine-popup');
    
    if (popup) {
        popup.remove();
        return;
    }
    
 
    popup = document.createElement('div');
    popup.id = 'search-engine-popup';
    popup.className = 'quick-popup';
    
    const currentEngine = localStorage.getItem('search-engine') || 'DuckDuckGo';
    
    popup.innerHTML = `
        <div class="popup-header">Search Engine</div>
        <div class="popup-option ${currentEngine === 'DuckDuckGo' ? 'active' : ''}" data-engine="duckduckgo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${currentEngine === 'DuckDuckGo' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
            </svg>
            <span>DuckDuckGo</span>
        </div>
        <div class="popup-option ${currentEngine === 'Google' ? 'active' : ''}" data-engine="google">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${currentEngine === 'Google' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
            </svg>
            <span>Google</span>
        </div>
        <div class="popup-option ${currentEngine === 'Brave' ? 'active' : ''}" data-engine="brave">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${currentEngine === 'Brave' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
            </svg>
            <span>Brave</span>
        </div>
        <div class="popup-option ${currentEngine === 'Bing' ? 'active' : ''}" data-engine="bing">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${currentEngine === 'Bing' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
            </svg>
            <span>Bing</span>
        </div>
    `;
    
    document.body.appendChild(popup);
    

    const searchBtn = document.querySelector('.search-engine-btn');
    if (searchBtn) {
        const rect = searchBtn.getBoundingClientRect();
        popup.style.top = `${rect.bottom + 8}px`;
        popup.style.left = `${rect.left}px`;
    }
    
  
    popup.querySelectorAll('.popup-option').forEach(option => {
        option.addEventListener('click', () => {
            const engine = option.getAttribute('data-engine');
            quickSetSearchEngine(engine);
            popup.remove();
        });
    });
    

    setTimeout(() => {
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target) && !e.target.closest('.search-engine-btn')) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        });
    }, 100);
}

function quickSetSearchEngine(engine) {
    const engines = {
        'duckduckgo': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
        'google': { name: 'Google', url: 'https://www.google.com/search?q=%s' },
        'brave': { name: 'Brave', url: 'https://search.brave.com/search?q=%s' },
        'bing': { name: 'Bing', url: 'https://www.bing.com/search?q=%s' }
    };
    
    if (engines[engine]) {
        localStorage.setItem('search-engine', engines[engine].name);
        localStorage.setItem('search-engine-url', engines[engine].url);
        console.log(`Search engine changed to ${engines[engine].name}`);
    }
}

function toggleQuickSettings() {
    let popup = document.getElementById('quick-settings-popup');
    
    if (popup) {
        popup.remove();
        return;
    }
    
   
    popup = document.createElement('div');
    popup.id = 'quick-settings-popup';
    popup.className = 'quick-popup quick-settings';
    
    const currentTransport = localStorage.getItem('proxy-transport') || 'Epoxy';
    const currentBackend = localStorage.getItem('proxy-backend') || 'uv';
    const tabSystemEnabled = localStorage.getItem('tab-system-enabled') !== 'false';
    
    popup.innerHTML = `
        <div class="popup-header">Quick Settings</div>
        
        <div class="popup-section">
            <div class="popup-section-title">Proxy Transport</div>
            <div class="popup-option ${currentTransport === 'Epoxy' ? 'active' : ''}" data-action="transport-epoxy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${currentTransport === 'Epoxy' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
                </svg>
                <span>Epoxy</span>
            </div>
            <div class="popup-option ${currentTransport === 'Libcurl' ? 'active' : ''}" data-action="transport-libcurl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${currentTransport === 'Libcurl' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
                </svg>
                <span>Libcurl</span>
            </div>
        </div>
        
        <div class="popup-section">
            <div class="popup-section-title">Proxy Backend</div>
            <div class="popup-option ${currentBackend === 'uv' ? 'active' : ''}" data-action="backend-uv">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${currentBackend === 'uv' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
                </svg>
                <span>Ultraviolet</span>
            </div>
            <div class="popup-option ${currentBackend === 'scramjet' ? 'active' : ''}" data-action="backend-scramjet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${currentBackend === 'scramjet' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
                </svg>
                <span>Scramjet</span>
            </div>
        </div>
        
        <div class="popup-section">
            <div class="popup-section-title">Tab System</div>
            <div class="popup-option ${tabSystemEnabled ? 'active' : ''}" data-action="tabs-enable">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${tabSystemEnabled ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
                </svg>
                <span>Enabled</span>
            </div>
            <div class="popup-option ${!tabSystemEnabled ? 'active' : ''}" data-action="tabs-disable">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${!tabSystemEnabled ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}
                </svg>
                <span>Disabled</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
 
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        const rect = settingsBtn.getBoundingClientRect();
        popup.style.top = `${rect.bottom + 8}px`;
        popup.style.right = `${window.innerWidth - rect.right}px`;
        popup.style.left = 'auto';
    }
    

    popup.querySelectorAll('.popup-option').forEach(option => {
        option.addEventListener('click', async () => {
            const action = option.getAttribute('data-action');
            await handleQuickSettingAction(action);
            popup.remove();
     
            setTimeout(() => toggleQuickSettings(), 100);
        });
    });
    

    setTimeout(() => {
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target) && !e.target.closest('.settings-btn')) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        });
    }, 100);
}

async function handleQuickSettingAction(action) {
    switch(action) {
        case 'transport-epoxy':
            await setConnection(1);
            console.log('Transport set to Epoxy');
            break;
        case 'transport-libcurl':
            await setConnection(2);
            console.log('Transport set to Libcurl');
            break;
        case 'backend-uv':
            localStorage.setItem('proxy-backend', 'uv');
            switchProxyBackend('uv');
            console.log('Backend set to Ultraviolet');
            break;
        case 'backend-scramjet':
            localStorage.setItem('proxy-backend', 'scramjet');
            switchProxyBackend('scramjet');
            console.log('Backend set to Scramjet');
            break;
        case 'tabs-enable':
            localStorage.setItem('tab-system-enabled', 'true');
            updateProxyUIVisibility();
            console.log('Tab system enabled');
            break;
        case 'tabs-disable':
            localStorage.setItem('tab-system-enabled', 'false');
            updateProxyUIVisibility();
            console.log('Tab system disabled');
            break;
    }
}


window.goTo = goTo;


window.addEventListener('DOMContentLoaded', () => {
    const uvAddress = document.getElementById('uv-address');
    const proxyUrlBar = document.getElementById('proxy-url-bar');
    const newTabBtn = document.getElementById('new-tab-btn');

    updateProxyUIVisibility();

   
    if (uvAddress) {
        uvAddress.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const url = buildUrl(uvAddress.value);
                if (url) {
                    goTo(url);
                    uvAddress.value = '';
                }
            }
        });
    }


    if (proxyUrlBar) {
        proxyUrlBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const url = buildUrl(proxyUrlBar.value);
                if (url && activeTabId) {
                    const activeTab = tabs.find(t => t.id === activeTabId);
                    if (activeTab && activeTab.iframe) {
                        lastSearchedUrl = url;
                        activeTab.iframe.src = getEncodedUrl(url);
                        activeTab.url = url;
                        activeTab.title = 'Loading...';
                        activeTab.loading = true;
                        if (isTabSystemEnabled()) renderTabs();
                        updateLockIcon(url);
                    }
                }
            }
        });

     
        proxyUrlBar.addEventListener('focus', () => {
            proxyUrlBar.select();
        });
    }

  
    if (newTabBtn) {
        newTabBtn.addEventListener('click', () => {
            if (!isTabSystemEnabled()) return;
            hideHome();
            createTab(); 
        });
    }

    
    const searchEngineBtn = document.querySelector('.search-engine-btn');
    if (searchEngineBtn) {
        searchEngineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSearchEnginePopup();
        });
    }

   
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const iframe = getActiveIframe();
            if (iframe) {
                try {
                    iframe.contentWindow.history.back();
                } catch (e) {
                    console.log('[Navigation] Cannot go back:', e);
                }
            }
        });
    }

    const forwardBtn = document.querySelector('.forward-btn');
    if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
            const iframe = getActiveIframe();
            if (iframe) {
                try {
                    iframe.contentWindow.history.forward();
                } catch (e) {
                    console.log('[Navigation] Cannot go forward:', e);
                }
            }
        });
    }

    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const iframe = getActiveIframe();
            if (iframe) {
                try {
                    iframe.contentWindow.location.reload();
                } catch {
                    iframe.src = iframe.src;
                }
            }
        });
    }

    const homeBtn = document.querySelector('.home-btn-proxy');
    if (homeBtn) {
        homeBtn.addEventListener('click', showHome);
    }

    const erudaBtn = document.querySelector('.eruda-btn');
    if (erudaBtn) {
        erudaBtn.addEventListener('click', injectDevTools);
    }

 
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleQuickSettings();
        });
    }


    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 't' && isTabSystemEnabled()) {
            e.preventDefault();
            hideHome();
            createTab();
        }
        

        if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId && isTabSystemEnabled()) {
            e.preventDefault();
            closeTab(activeTabId);
        }
        
     
        if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey && isTabSystemEnabled()) {
            e.preventDefault();
            const currentIndex = tabs.findIndex(t => t.id === activeTabId);
            const nextIndex = (currentIndex + 1) % tabs.length;
            if (tabs[nextIndex]) {
                switchToTab(tabs[nextIndex].id);
            }
        }
        
    
        if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && e.shiftKey && isTabSystemEnabled()) {
            e.preventDefault();
            const currentIndex = tabs.findIndex(t => t.id === activeTabId);
            const prevIndex = currentIndex - 1 < 0 ? tabs.length - 1 : currentIndex - 1;
            if (tabs[prevIndex]) {
                switchToTab(tabs[prevIndex].id);
            }
        }

   
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && isTabSystemEnabled()) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 8 && tabs[num - 1]) {
                e.preventDefault();
                switchToTab(tabs[num - 1].id);
            }
        }

      
        if ((e.ctrlKey || e.metaKey) && e.key === '9' && isTabSystemEnabled() && tabs.length > 0) {
            e.preventDefault();
            switchToTab(tabs[tabs.length - 1].id);
        }
    });
});