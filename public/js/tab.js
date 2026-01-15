let _connection = new BareMux.BareMuxConnection("/baremux/worker.js");
async function setConnection(arg){
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    switch (arg){
        case 1:
            await _connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
            sessionStorage.setItem('proxy-transport','Epoxy');
            break;
        case 2:
            await _connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
            sessionStorage.setItem('proxy-transport','Libcurl');
            break;
    }
}
if (!sessionStorage.getItem('proxy-transport')){
    setConnection(1);
} else {
    if (sessionStorage.getItem('proxy-transport') === "Epoxy") setConnection(1);
    if (sessionStorage.getItem('proxy-transport') === "Libcurl") setConnection(2);
}

// Initialize default search engine if not set
if (!sessionStorage.getItem('search-engine')) {
    sessionStorage.setItem('search-engine', 'DuckDuckGo');
    sessionStorage.setItem('search-engine-url', 'https://duckduckgo.com/?q=%s');
}

// Initialize tab system default
if (!sessionStorage.getItem('tab-system-enabled')) {
    sessionStorage.setItem('tab-system-enabled', 'true');
}

let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let erudaLoaded = false;

function isTabSystemEnabled() {
    return sessionStorage.getItem('tab-system-enabled') !== 'false';
}

function updateProxyUIVisibility() {
    const tabSystemEnabled = isTabSystemEnabled();
    const proxyContainer = document.getElementById('proxy-container');
    
    if (!proxyContainer) return;
    
    // Get all UI elements
    const tabBar = document.getElementById('tab-bar');
    const topBar = document.querySelector('.top-bar');
    const newTabBtn = document.getElementById('new-tab-btn');
    const iframeWrapper = document.getElementById('iframe-wrapper');
    
    if (tabSystemEnabled) {
        // Show all UI elements
        if (tabBar) tabBar.style.display = 'flex';
        if (topBar) topBar.style.display = 'flex';
        if (newTabBtn) newTabBtn.style.display = 'block';
        
        // Reset proxy container
        proxyContainer.style.paddingTop = '';
        proxyContainer.style.marginTop = '';
        
        // Reset iframe wrapper to normal
        if (iframeWrapper) {
            iframeWrapper.style.position = '';
            iframeWrapper.style.top = '';
            iframeWrapper.style.left = '';
            iframeWrapper.style.width = '';
            iframeWrapper.style.height = '';
            iframeWrapper.style.zIndex = '';
        }
    } else {
        // Hide all UI elements
        if (tabBar) tabBar.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        if (newTabBtn) newTabBtn.style.display = 'none';
        
        // Remove padding/margin from proxy container to eliminate black bar
        proxyContainer.style.paddingTop = '0';
        proxyContainer.style.marginTop = '0';
        
        // Expand iframe to fill entire content area (top to bottom, respecting sidebar)
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
        iframe.src = __uv$config.prefix + __uv$config.encodeUrl(url);
    }
    
    iframeContainer.appendChild(iframe);
    document.getElementById('iframe-wrapper').appendChild(iframeContainer);
    
    const tab = {
        id: tabId,
        url: url || 'New Tab',
        title: 'New Tab',
        iframe: iframe,
        container: iframeContainer
    };
    
    tabs.push(tab);
    
    if (isTabSystemEnabled()) {
        renderTabs();
    }
    switchToTab(tabId);
    
    iframe.addEventListener('load', () => {
        try {
            const title = iframe.contentDocument?.title || new URL(url || '').hostname || 'New Tab';
            tab.title = title;
            tab.url = url;
            if (isTabSystemEnabled()) {
                renderTabs();
            }
            updateUrlBar();
        } catch (e) {
           
        }
    });
    
    return tab;
}

function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const tab = tabs[index];
    tab.container.remove();
    tabs.splice(index, 1);
    
    if (tabs.length === 0) {
        showHome();
    } else if (activeTabId === tabId) {
        switchToTab(tabs[Math.max(0, index - 1)].id);
    }
    
    if (isTabSystemEnabled()) {
        renderTabs();
    }
}

function switchToTab(tabId) {
    activeTabId = tabId;
    tabs.forEach(tab => {
        if (tab.id === tabId) {
            tab.container.classList.add('active');
        } else {
            tab.container.classList.remove('active');
        }
    });
    if (isTabSystemEnabled()) {
        renderTabs();
    }
    updateUrlBar();
}

function updateUrlBar() {
    const activeTab = tabs.find(t => t.id === activeTabId);
    const urlBar = document.getElementById('proxy-url-bar');
    if (activeTab && urlBar) {
        urlBar.value = (activeTab.url === 'New Tab' || !activeTab.url) ? '' : activeTab.url;
    }
}

function renderTabs() {
    const container = document.getElementById('tabs-container');
    if (!container) return;
    
    // Hide/show tabs container based on setting
    if (!isTabSystemEnabled()) {
        container.style.display = 'none';
        return;
    } else {
        container.style.display = 'flex';
    }
    
    container.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        if (tab.id === activeTabId) {
            tabEl.classList.add('active');
        }
        
        const favicon = document.createElement('img');
        favicon.className = 'tab-favicon';
        favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23a855f7" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
        
        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title;
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        
        tabEl.addEventListener('click', () => {
            switchToTab(tab.id);
        });
        
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
    
    // Update UI visibility when proxy becomes active
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
    script.onload = function() {
        window.eruda.init();
        erudaLoaded = true;
    };
    script.onerror = function() {
        alert('Failed to load dev tools');
    };
    document.head.appendChild(script);
}

async function goTo(url) {
    try {
        if (typeof registerSW === 'function') {
            await registerSW();
        }
    } catch (err) {
        const error = document.getElementById('uv-error');
        const errorCode = document.getElementById('uv-error-code');
        if (error) error.textContent = "Failed to register service worker.";
        if (errorCode) errorCode.textContent = err.toString();
        console.error(err);
        return;
    }
    
    hideHome();
    
    // If tab system is disabled, reuse the first tab
    if (!isTabSystemEnabled() && tabs.length > 0) {
        const activeTab = tabs[0];
        activeTab.iframe.src = __uv$config.prefix + __uv$config.encodeUrl(url);
        activeTab.url = url;
        activeTab.title = 'Loading...';
        switchToTab(activeTab.id);
    } else {
        createTab(url);
    }
}

function quickGo(url) {
    goTo(url);
}

window.addEventListener('DOMContentLoaded', () => {
    const uvAddress = document.getElementById('uv-address');
    const searchEngineInput = document.getElementById('uv-search-engine');
    const newTabBtn = document.getElementById('new-tab-btn');
    const proxyUrlBar = document.getElementById('proxy-url-bar');

    // Update UI visibility on load
    updateProxyUIVisibility();

    const getEngine = () => {
        return sessionStorage.getItem('search-engine-url') || 'https://duckduckgo.com/?q=%s';
    };

    const hasProtocol = (q) => /^https?:\/\//i.test(q);

    const isProbablyUrl = (q) => {
        if (hasProtocol(q)) return true;
        if ((q || '').includes(' ')) return false;
        return (
            /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(q) ||
            /^localhost(:\d+)?(\/.*)?$/i.test(q)
        );
    };

    const buildUrl = (q) => {
        q = (q || '').trim();
        if (!q) return null;
        if (hasProtocol(q)) return q;
        if (isProbablyUrl(q)) return 'https://' + q;
        const engine = getEngine();
        return engine.replace('%s', encodeURIComponent(q));
    };

    const handleSearch = async (input) => {
        const q = input.value;
        const url = buildUrl(q);
        if (!url) return;
        try {
            await goTo(url);
            input.value = '';
        } catch (e) {
            console.error(e);
        }
    };

    if (uvAddress) {
        uvAddress.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(uvAddress);
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
                    if (activeTab) {
                        activeTab.iframe.src = __uv$config.prefix + __uv$config.encodeUrl(url);
                        activeTab.url = url;
                    }
                }
            }
        });
    }

    if (newTabBtn) {
        newTabBtn.addEventListener('click', () => {
            if (!isTabSystemEnabled()) return;
            hideHome();
            createTab();
        });
    }

    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const iframe = getActiveIframe();
            if (iframe) {
                try {
                    iframe.contentWindow.history.back();
                } catch (e) {}
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
                } catch (e) {}
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
                } catch (e) {
                    iframe.src = iframe.src;
                }
            }
        });
    }

    const homeBtn = document.querySelector('.home-btn-proxy');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            showHome();
        });
    }

    const erudaBtn = document.querySelector('.eruda-btn');
    if (erudaBtn) {
        erudaBtn.addEventListener('click', () => {
            injectDevTools();
        });
    }

    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = '/s.html#Proxy';
        });
    }
});