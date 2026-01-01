let _connection = new BareMux.BareMuxConnection("/baremux/worker.js");
async function setConnection(arg){
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    switch (arg){
        case 1:
            await _connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
            localStorage.setItem('proxy-transport','Epoxy');
            break;
        case 2:
            await _connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
            localStorage.setItem('proxy-transport','Libcurl');
            break;
    }
}
if (!localStorage.getItem('proxy-transport')){
    setConnection(1);
} else {
    if (localStorage.getItem('proxy-transport') === "Epoxy") setConnection(1);
    if (localStorage.getItem('proxy-transport') === "Libcurl") setConnection(2);
}


let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let erudaLoaded = false;

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
    renderTabs();
    switchToTab(tabId);
    
    iframe.addEventListener('load', () => {
        try {
            const title = iframe.contentDocument?.title || new URL(url || '').hostname || 'New Tab';
            tab.title = title;
            tab.url = url;
            renderTabs();
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
    
    renderTabs();
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
    renderTabs();
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
    createTab(url);
}

function quickGo(url) {
    goTo(url);
}

window.addEventListener('DOMContentLoaded', () => {
    const uvAddress = document.getElementById('uv-address');
    const searchEngineInput = document.getElementById('uv-search-engine');
    const newTabBtn = document.getElementById('new-tab-btn');
    const proxyUrlBar = document.getElementById('proxy-url-bar');

    const getEngine = () =>
        (searchEngineInput && searchEngineInput.value) || 'https://duckduckgo.com/search?q=%s';

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

    uvAddress.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(uvAddress);
        }
    });

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

    newTabBtn.addEventListener('click', () => {
        hideHome();
        createTab();
    });

    
    document.querySelector('.back-btn').addEventListener('click', () => {
        const iframe = getActiveIframe();
        if (iframe) {
            try {
                iframe.contentWindow.history.back();
            } catch (e) {}
        }
    });

    document.querySelector('.forward-btn').addEventListener('click', () => {
        const iframe = getActiveIframe();
        if (iframe) {
            try {
                iframe.contentWindow.history.forward();
            } catch (e) {}
        }
    });

    document.querySelector('.refresh-btn').addEventListener('click', () => {
        const iframe = getActiveIframe();
        if (iframe) {
            try {
                iframe.contentWindow.location.reload();
            } catch (e) {
                iframe.src = iframe.src;
            }
        }
    });

    document.querySelector('.home-btn-proxy').addEventListener('click', () => {
        showHome();
    });

    document.querySelector('.eruda-btn').addEventListener('click', () => {
        injectDevTools();
    });

    document.querySelector('.settings-btn').addEventListener('click', () => {
        window.location.href = '/s.html#Proxy';
    });
});