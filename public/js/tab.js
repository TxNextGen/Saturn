let _connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let scramjetController = null;

async function initScramjet() {
    if (scramjetController) return scramjetController;
    
    try {
        console.log('[Scramjet] Initializing controller...');
        
        if (typeof $scramjetLoadController === 'undefined') {
            const script = document.createElement('script');
            script.src = '/js/scramjet/scramjet.all.js';
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (typeof $scramjetLoadController === 'function') {
            const { ScramjetController } = $scramjetLoadController();
            
            scramjetController = new ScramjetController({
                prefix: "/scramjet/",
                files: {
                    wasm: "/js/scramjet/scramjet.wasm.wasm",
                    all: "/js/scramjet/scramjet.all.js",
                    sync: "/js/scramjet/scramjet.sync.js"
                }
            });
            
            await scramjetController.init();
            console.log('[Scramjet] ✅ Controller initialized');
            return scramjetController;
        } else {
            throw new Error('$scramjetLoadController is not available');
        }
    } catch (err) {
        console.error('[Scramjet] ❌ Failed to initialize:', err);
        throw err;
    }
}

async function registerSW() {
    if (!('serviceWorker' in navigator)) {
        throw new Error("Service workers not supported");
    }

    const backend = getProxyBackend();
    console.log(`[registerSW] Registering ${backend.toUpperCase()} service worker...`);

    if (backend === "scramjet") {
        await initScramjet();
        
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        
        if (reg.installing) {
            await new Promise((resolve) => {
                reg.installing.addEventListener('statechange', (e) => {
                    if (e.target.state === 'activated') resolve();
                });
            });
        } else if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            await new Promise((resolve) => {
                navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
            });
        }
        
        await navigator.serviceWorker.ready;
        
        if (!navigator.serviceWorker.controller) {
            window.location.reload();
            return;
        }
        
        console.log('[registerSW] ✅ SCRAMJET Service Worker registered');
        return reg;
    } else {
        const reg = await navigator.serviceWorker.register('/uv/sw.js', { scope: '/@/' });
        await navigator.serviceWorker.ready;
        console.log('[registerSW] ✅ UV Service Worker registered');
        return reg;
    }
}

function getProxyBackend() {
    return localStorage.getItem('proxy-backend') || 'scramjet';
}

window.currentProxyBackend = getProxyBackend();

function switchProxyBackend(backend) {
    window.currentProxyBackend = backend;
    localStorage.setItem('proxy-backend', backend);
}

function getEncodedUrl(url) {
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    const backend = getProxyBackend();

    if (backend === "scramjet") {
        if (!scramjetController) return url;
        return scramjetController.encodeUrl(url);
    } else {
        if (typeof __uv$config === 'undefined' || typeof __uv$config.encodeUrl !== 'function') {
            return __uv$config.prefix + encodeURIComponent(url);
        }
        return __uv$config.prefix + __uv$config.encodeUrl(url);
    }
}

async function setConnection(arg) {
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    
    switch (arg) {
        case 1:
            await _connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
            localStorage.setItem('proxy-transport', 'Epoxy');
            break;
        case 2:
            await _connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
            localStorage.setItem('proxy-transport', 'Libcurl');
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

if (!localStorage.getItem('proxy-backend')) {
    localStorage.setItem('proxy-backend', 'scramjet');
}

let currentIframe = null;
let currentUrl = '';
let erudaLoaded = false;
let navigationInProgress = false;

function updateLockIcon(url) {
    const lockIcon = document.querySelector('.lock-icon-container');
    if (!lockIcon) return;

    if (url && url.startsWith('https://')) {
        lockIcon.classList.remove('insecure');
        lockIcon.classList.add('secure');
        lockIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    } else {
        lockIcon.classList.remove('secure');
        lockIcon.classList.add('insecure');
        lockIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
    }
}

function createLoadingOverlay(container) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'proxy-loading-animation';
    loadingDiv.innerHTML = `<div class="loading-bar-container"><div class="loading-bar indeterminate"></div></div><div class="loading-content"><div class="loading-spinner"></div><div class="loading-text">Loading your page...</div></div>`;
    container.appendChild(loadingDiv);
    return loadingDiv;
}

function removeLoadingOverlay(container) {
    const loading = container.querySelector('.proxy-loading-animation');
    if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 300);
    }
}

function createBrowser(url) {
    const iframeWrapper = document.getElementById('iframe-wrapper');
    iframeWrapper.innerHTML = '';
    
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'iframe-container active';
    iframeContainer.id = 'main-browser-container';

    const iframe = document.createElement('iframe');
    iframe.id = 'main-browser-frame';
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-read; clipboard-write');

    if (url) {
        createLoadingOverlay(iframeContainer);
        iframe.src = getEncodedUrl(url);
        currentUrl = url;
    }

    iframeContainer.appendChild(iframe);
    iframeWrapper.appendChild(iframeContainer);
    currentIframe = iframe;

    iframe.addEventListener('load', () => {
        removeLoadingOverlay(iframeContainer);
        updateUrlBar();
    });

    iframe.addEventListener('error', () => {
        removeLoadingOverlay(iframeContainer);
    });

    updateUrlBar();
}

function navigateTo(url) {
    if (!currentIframe) {
        createBrowser(url);
        return;
    }

    const container = document.getElementById('main-browser-container');
    if (container) createLoadingOverlay(container);

    currentIframe.src = getEncodedUrl(url);
    currentUrl = url;
    updateUrlBar();
    updateLockIcon(url);
}

function updateUrlBar() {
    const urlBar = document.getElementById('proxy-url-bar');
    if (urlBar) {
        urlBar.value = currentUrl || '';
        updateLockIcon(currentUrl);
    }
}

function showHome() {
    document.getElementById('home-container').classList.remove('hidden');
    document.getElementById('proxy-container').classList.remove('active');
}

function hideHome() {
    document.getElementById('home-container').classList.add('hidden');
    document.getElementById('proxy-container').classList.add('active');
    
    const tabBar = document.getElementById('tab-bar');
    const topBar = document.querySelector('.top-bar');
    
    if (tabBar) tabBar.style.display = 'none';
    if (topBar) topBar.style.display = 'flex';
}

function injectDevTools() {
    if (erudaLoaded) {
        window.eruda._isInit ? window.eruda.destroy() : window.eruda.init();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/eruda/3.0.1/eruda.js';
    script.onload = () => {
        window.eruda.init();
        erudaLoaded = true;
    };
    document.head.appendChild(script);
}

async function goTo(url) {
    if (navigationInProgress) return;
    navigationInProgress = true;

    try {
        await registerSW();
    } catch (err) {
        console.error('Service worker registration failed:', err);
        navigationInProgress = false;
        return;
    }

    hideHome();
    currentIframe ? navigateTo(url) : createBrowser(url);
    navigationInProgress = false;
}

function quickGo(url) {
    goTo(url);
}

function buildUrl(query) {
    query = (query || '').trim();
    if (!query) return null;

    if (/^https?:\/\//i.test(query)) return query;
    if (query.includes(' ')) {
        const searchEngine = localStorage.getItem('search-engine-url') || 'https://duckduckgo.com/?q=%s';
        return searchEngine.replace('%s', encodeURIComponent(query));
    }
    if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(query) || /^localhost(:\d+)?(\/.*)?$/i.test(query)) {
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
            const engines = {
                'duckduckgo': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
                'google': { name: 'Google', url: 'https://www.google.com/search?q=%s' },
                'brave': { name: 'Brave', url: 'https://search.brave.com/search?q=%s' },
                'bing': { name: 'Bing', url: 'https://www.bing.com/search?q=%s' }
            };
            const engine = option.getAttribute('data-engine');
            if (engines[engine]) {
                localStorage.setItem('search-engine', engines[engine].name);
                localStorage.setItem('search-engine-url', engines[engine].url);
            }
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
    const currentBackend = localStorage.getItem('proxy-backend') || 'scramjet';
    
    popup.innerHTML = `
        <div class="popup-header">Quick Settings</div>
        <div class="popup-section">
            <div class="popup-section-title">Proxy Transport</div>
            <div class="popup-option ${currentTransport === 'Epoxy' ? 'active' : ''}" data-action="transport-epoxy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${currentTransport === 'Epoxy' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}</svg>
                <span>Epoxy</span>
            </div>
            <div class="popup-option ${currentTransport === 'Libcurl' ? 'active' : ''}" data-action="transport-libcurl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${currentTransport === 'Libcurl' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}</svg>
                <span>Libcurl</span>
            </div>
        </div>
        <div class="popup-section">
            <div class="popup-section-title">Proxy Backend</div>
            <div class="popup-option ${currentBackend === 'uv' ? 'active' : ''}" data-action="backend-uv">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${currentBackend === 'uv' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}</svg>
                <span>Ultraviolet</span>
            </div>
            <div class="popup-option ${currentBackend === 'scramjet' ? 'active' : ''}" data-action="backend-scramjet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${currentBackend === 'scramjet' ? '<polyline points="20 6 9 17 4 12"></polyline>' : ''}</svg>
                <span>Scramjet</span>
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
            switch(action) {
                case 'transport-epoxy':
                    await setConnection(1);
                    break;
                case 'transport-libcurl':
                    await setConnection(2);
                    break;
                case 'backend-uv':
                    localStorage.setItem('proxy-backend', 'uv');
                    switchProxyBackend('uv');
                    break;
                case 'backend-scramjet':
                    localStorage.setItem('proxy-backend', 'scramjet');
                    switchProxyBackend('scramjet');
                    break;
            }
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

window.goTo = goTo;

window.addEventListener('DOMContentLoaded', () => {
    const uvAddress = document.getElementById('uv-address');
    const proxyUrlBar = document.getElementById('proxy-url-bar');
    const tabBar = document.getElementById('tab-bar');
    
    if (tabBar) tabBar.style.display = 'none';

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
                if (url) navigateTo(url);
            }
        });

        proxyUrlBar.addEventListener('focus', () => proxyUrlBar.select());
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
            if (currentIframe) {
                try {
                    currentIframe.contentWindow.history.back();
                } catch (e) {}
            }
        });
    }

    const forwardBtn = document.querySelector('.forward-btn');
    if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
            if (currentIframe) {
                try {
                    currentIframe.contentWindow.history.forward();
                } catch (e) {}
            }
        });
    }

    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (currentIframe) {
                try {
                    currentIframe.contentWindow.location.reload();
                } catch {
                    currentIframe.src = currentIframe.src;
                }
            }
        });
    }

    const homeBtn = document.querySelector('.home-btn-proxy');
    if (homeBtn) homeBtn.addEventListener('click', showHome);

    const erudaBtn = document.querySelector('.eruda-btn');
    if (erudaBtn) erudaBtn.addEventListener('click', injectDevTools);

    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleQuickSettings();
        });
    }

    const pendingUrl = sessionStorage.getItem('openExternalUrl');
    if (pendingUrl) {
        sessionStorage.removeItem('openExternalUrl');
        setTimeout(() => goTo(pendingUrl), 1000);
    }
});