let _connection = new BareMux.BareMuxConnection("/baremux/worker.js");


async function registerSW() {
    if (!('serviceWorker' in navigator)) {
        throw new Error("Service workers not supported");
    }

    console.log('[registerSW] Registering correct UV entry worker (/uv/sw.js)...');

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
       
        console.log('[getEncodedUrl] UV config check:', {
            configExists: typeof __uv$config !== 'undefined',
            prefix: typeof __uv$config !== 'undefined' ? __uv$config.prefix : 'NOT FOUND',
            encodeUrl: typeof __uv$config !== 'undefined' ? typeof __uv$config.encodeUrl : 'NOT FOUND'
        });

        if (typeof __uv$config === 'undefined') {
            console.error('[getEncodedUrl] ❌ UV config not found! Service worker may not be registered.');
            console.error('[getEncodedUrl] Make sure uv.config.js is loaded before tab.js');
          
            const fallbackEncoded = "/uv/service/" + encodeURIComponent(url);
            console.log('[getEncodedUrl] Using fallback encoding:', fallbackEncoded);
            return fallbackEncoded;
        }

     
        if (typeof __uv$config.encodeUrl !== 'function') {
            console.error('[getEncodedUrl] ❌ UV encodeUrl function not found!');
            const fallbackEncoded = __uv$config.prefix + encodeURIComponent(url);
            console.log('[getEncodedUrl] Using simple fallback encoding:', fallbackEncoded);
            return fallbackEncoded;
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
            console.log('UV encodeUrl function:', typeof __uv$config.encodeUrl);
            console.log('UV decodeUrl function:', typeof __uv$config.decodeUrl);
            console.log('UV handler:', __uv$config.handler);
            console.log('UV bundle:', __uv$config.bundle);
            console.log('UV config:', __uv$config.config);
            console.log('UV sw:', __uv$config.sw);
        } else {
            console.error('❌ UV Config not loaded! Check if uv.config.js is included in your HTML');
            console.error('Add this to your HTML before tab.js:');
            console.error('<script src="/uv/uv.config.js"></script>');
        }
        console.log('Service Worker registration function:', typeof registerSW);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                console.log('Active Service Workers:', registrations.length);
                registrations.forEach((reg, i) => {
                    console.log(`SW ${i + 1}:`, reg.scope);
                });
            });
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
    console.log('[tab.js] Initialized default backend: uv');
}

let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let erudaLoaded = false;
let lastSearchedUrl = null;

function isTabSystemEnabled() {
    return localStorage.getItem('tab-system-enabled') !== 'false';
}

function updateProxyUIVisibility() {
    const tabSystemEnabled = isTabSystemEnabled();
    const proxyContainer = document.getElementById('proxy-container');
    if (!proxyContainer) return;

    const tabBar = document.getElementById('tab-bar');
    const topBar = document.querySelector('.top-bar');
    const newTabBtn = document.getElementById('new-tab-btn');
    const iframeWrapper = document.getElementById('iframe-wrapper');

    if (tabSystemEnabled) {
        if (tabBar) tabBar.style.display = 'flex';
        if (topBar) topBar.style.display = 'flex';
        if (newTabBtn) newTabBtn.style.display = 'block';
        proxyContainer.style.paddingTop = '';
        proxyContainer.style.marginTop = '';
        if (iframeWrapper) {
            iframeWrapper.style.position = '';
            iframeWrapper.style.top = '';
            iframeWrapper.style.left = '';
            iframeWrapper.style.width = '';
            iframeWrapper.style.height = '';
            iframeWrapper.style.zIndex = '';
        }
    } else {
        if (tabBar) tabBar.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        if (newTabBtn) newTabBtn.style.display = 'none';
        proxyContainer.style.paddingTop = '0';
        proxyContainer.style.marginTop = '0';
        if (iframeWrapper) {
            iframeWrapper.style.position = 'fixed';
            iframeWrapper.style.top = '0';
            iframeWrapper.style.left = '60px';
            iframeWrapper.style.width = 'calc(100vw - 60px)';
            iframeWrapper.style.height = '100vh';
            iframeWrapper.style.zIndex = '1000';
        }
    }
}

function createTab(url = null) {
    const tabId = `tab-${tabIdCounter++}`;
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'iframe-container';
    iframeContainer.id = `container-${tabId}`;

    const iframe = document.createElement('iframe');
    iframe.id = `frame-${tabId}`;

    if (url) {
        const encodedUrl = getEncodedUrl(url);
        console.log(`[createTab] Creating tab with:
  - Original URL: ${url}
  - Backend: ${getProxyBackend()}
  - Encoded URL: ${encodedUrl}`);
        iframe.src = encodedUrl;
    }

    iframeContainer.appendChild(iframe);
    document.getElementById('iframe-wrapper').appendChild(iframeContainer);

    const tab = {
        id: tabId,
        url: url || '',
        title: url ? 'Loading...' : 'New Tab',
        iframe: iframe,
        container: iframeContainer
    };

    tabs.push(tab);

    if (isTabSystemEnabled()) renderTabs();
    switchToTab(tabId);

    iframe.addEventListener('load', () => {
        try {
            const title = iframe.contentDocument?.title || new URL(url || '').hostname || 'New Tab';
            tab.title = title;
            if (url) tab.url = url;
            if (isTabSystemEnabled()) renderTabs();
            updateUrlBar();
        } catch (e) {
            if (url) {
                try {
                    const hostname = new URL(url).hostname;
                    tab.title = hostname;
                } catch {
                    tab.title = 'Page';
                }
                tab.url = url;
            }
            if (isTabSystemEnabled()) renderTabs();
            updateUrlBar();
        }
    });

   
    iframe.addEventListener('error', (e) => {
        console.error('[createTab] Iframe load error:', e);
        console.error('[createTab] Failed to load:', iframe.src);
    });

    return tab;
}

function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    const tab = tabs[index];
    tab.container.remove();
    tabs.splice(index, 1);

    if (tabs.length === 0) showHome();
    else if (activeTabId === tabId) switchToTab(tabs[Math.max(0, index - 1)].id);

    if (isTabSystemEnabled()) renderTabs();
}

function switchToTab(tabId) {
    activeTabId = tabId;
    tabs.forEach(tab => {
        if (tab.id === tabId) tab.container.classList.add('active');
        else tab.container.classList.remove('active');
    });
    if (isTabSystemEnabled()) renderTabs();
    updateUrlBar();
}

function updateUrlBar() {
    const activeTab = tabs.find(t => t.id === activeTabId);
    const urlBar = document.getElementById('proxy-url-bar');
    if (activeTab && urlBar) urlBar.value = activeTab.url || '';
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

    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        if (tab.id === activeTabId) tabEl.classList.add('active');

        const favicon = document.createElement('img');
        favicon.className = 'tab-favicon';
        favicon.src = '/images/sat4.png';

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title;

        const closeBtn = document.createElement('div');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        closeBtn.addEventListener('click', e => {
            e.stopPropagation();
            closeTab(tab.id);
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
        if (window.eruda._isInit) window.eruda.destroy();
        else window.eruda.init();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/eruda/3.0.1/eruda.js';
    script.onload = () => { window.eruda.init(); erudaLoaded = true; };
    script.onerror = () => alert('Failed to load dev tools');
    document.head.appendChild(script);
}

async function goTo(url) {
    console.log(`[goTo] Starting navigation to: ${url}`);
    
    try {
        if (typeof registerSW === 'function') {
            console.log('[goTo] Registering service worker...');
            await registerSW();
            console.log('[goTo] ✅ Service worker registered');
        } else {
            console.warn('[goTo] ⚠️ registerSW function not found!');
        }
    } catch (err) {
        console.error('[goTo] ❌ Service worker registration failed:', err);
        const error = document.getElementById('uv-error');
        const errorCode = document.getElementById('uv-error-code');
        if (error) error.textContent = "Failed to register service worker.";
        if (errorCode) errorCode.textContent = err.toString();
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
        switchToTab(activeTab.id);
    } else {
        console.log(`[goTo] Creating new tab for: ${url}`);
        createTab(url);
    }
}

function quickGo(url) { goTo(url); }

window.addEventListener('DOMContentLoaded', () => {
    const uvAddress = document.getElementById('uv-address');
    const proxyUrlBar = document.getElementById('proxy-url-bar');
    const newTabBtn = document.getElementById('new-tab-btn');

    updateProxyUIVisibility();

    const getEngine = () => localStorage.getItem('search-engine-url') || 'https://duckduckgo.com/?q=%s';
    const hasProtocol = q => /^https?:\/\//i.test(q);
    const isProbablyUrl = q => {
        if (hasProtocol(q)) return true;
        if ((q || '').includes(' ')) return false;
        return /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(q) || /^localhost(:\d+)?(\/.*)?$/i.test(q);
    };
    const buildUrl = q => {
        q = (q || '').trim();
        if (!q) return null;
        if (hasProtocol(q)) return q;
        if (isProbablyUrl(q)) return 'https://' + q;
        return getEngine().replace('%s', encodeURIComponent(q));
    };

    const handleSearch = async input => {
        const q = input.value;
        const url = buildUrl(q);
        if (!url) return;
        try { await goTo(url); input.value = ''; } catch (e) { console.error(e); }
    };

    if (uvAddress) uvAddress.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(uvAddress); } });
    if (proxyUrlBar) proxyUrlBar.addEventListener('keydown', e => {
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
                    if (isTabSystemEnabled()) renderTabs();
                }
            }
        }
    });

    if (newTabBtn) newTabBtn.addEventListener('click', () => {
        if (!isTabSystemEnabled()) return;
        hideHome();
        if (lastSearchedUrl) createTab(lastSearchedUrl);
        else createTab();
    });

    const backBtn = document.querySelector('.back-btn');
    if (backBtn) backBtn.addEventListener('click', () => { const iframe = getActiveIframe(); if (iframe) { try { iframe.contentWindow.history.back(); } catch {} } });
    const forwardBtn = document.querySelector('.forward-btn');
    if (forwardBtn) forwardBtn.addEventListener('click', () => { const iframe = getActiveIframe(); if (iframe) { try { iframe.contentWindow.history.forward(); } catch {} } });
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => { const iframe = getActiveIframe(); if (iframe) { try { iframe.contentWindow.location.reload(); } catch { iframe.src = iframe.src; } } });
    const homeBtn = document.querySelector('.home-btn-proxy');
    if (homeBtn) homeBtn.addEventListener('click', showHome);
    const erudaBtn = document.querySelector('.eruda-btn');
    if (erudaBtn) erudaBtn.addEventListener('click', injectDevTools);
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => { window.location.href = '/s.html#Proxy'; });
});