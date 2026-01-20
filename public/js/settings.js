function switchTab(tabName, btnElement) {
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const section = document.getElementById(tabName);
    if (section) section.classList.add('active');

    if (btnElement) btnElement.classList.add('active');

    const currentTab = localStorage.getItem('current-tab');
    if (currentTab !== tabName) {
        localStorage.setItem('current-tab', tabName);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const savedTab = localStorage.getItem('current-tab') || 'themes';
    const section = document.getElementById(savedTab);
    if (section) section.classList.add('active');
    const btn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(b => b.getAttribute('onclick')?.includes(savedTab));
    if (btn) btn.classList.add('active');
    
    applySavedCloak();
});

const premadeThemes = {
    "blue": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(160, 177, 255); --primary-mid: rgb(100, 135, 230); --primary-dark: rgb(70, 82, 190); --accent-color: rgb(71, 70, 130); --accent-color-dark: rgb(55, 54, 100); --background-dark: rgb(5, 5, 14); --background-light: rgb(16, 13, 41); } body { background: rgb(5, 5, 14) !important; } .setting-card { background: rgba(16, 13, 41, 0.5) !important; border-color: rgba(100, 135, 230, 0.3) !important; } button { background: rgba(100, 135, 230, 0.2) !important; border-color: rgba(160, 177, 255, 0.3) !important; } button:hover { background: rgba(100, 135, 230, 0.4) !important; } .tab-btn.active { background: rgba(100, 135, 230, 0.3) !important; border-color: rgb(100, 135, 230) !important; }",
    "night": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(179, 179, 179); --primary-mid: rgb(129, 129, 129); --primary-dark: rgb(80, 80, 80); --accent-color: rgb(56, 56, 56); --accent-color-dark: rgb(29, 29, 29); --background-dark: rgb(0, 0, 0); --background-light: rgb(19, 19, 19); } body { background: rgb(0, 0, 0) !important; } .setting-card { background: rgba(19, 19, 19, 0.5) !important; border-color: rgba(129, 129, 129, 0.3) !important; } button { background: rgba(129, 129, 129, 0.2) !important; border-color: rgba(179, 179, 179, 0.3) !important; } button:hover { background: rgba(129, 129, 129, 0.4) !important; } .tab-btn.active { background: rgba(129, 129, 129, 0.3) !important; border-color: rgb(129, 129, 129) !important; }",
    "red": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(255, 160, 160); --primary-mid: rgb(151, 70, 70); --primary-dark: rgb(114, 41, 41); --accent-color: rgb(130, 70, 70); --accent-color-dark: rgb(100, 54, 54); --background-dark: rgb(14, 5, 5); --background-light: rgb(41, 13, 13); } body { background: rgb(14, 5, 5) !important; } .setting-card { background: rgba(41, 13, 13, 0.5) !important; border-color: rgba(151, 70, 70, 0.3) !important; } button { background: rgba(151, 70, 70, 0.2) !important; border-color: rgba(255, 160, 160, 0.3) !important; } button:hover { background: rgba(151, 70, 70, 0.4) !important; } .tab-btn.active { background: rgba(151, 70, 70, 0.3) !important; border-color: rgb(151, 70, 70) !important; } h1 { color: rgb(255, 160, 160) !important; }",
    "green": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(168, 255, 160); --primary-mid: rgb(137, 230, 100); --primary-dark: rgb(98, 190, 70); --accent-color: rgb(82, 130, 70); --accent-color-dark: rgb(70, 110, 60); --background-dark: rgb(5, 15, 6); --background-light: rgb(22, 41, 13); } body { background: rgb(5, 15, 6) !important; } .setting-card { background: rgba(22, 41, 13, 0.5) !important; border-color: rgba(137, 230, 100, 0.3) !important; } button { background: rgba(137, 230, 100, 0.2) !important; border-color: rgba(168, 255, 160, 0.3) !important; } button:hover { background: rgba(137, 230, 100, 0.4) !important; } .tab-btn.active { background: rgba(137, 230, 100, 0.3) !important; border-color: rgb(137, 230, 100) !important; } h1 { color: rgb(168, 255, 160) !important; }"
};

function formatCSS(css) { 
    return css.replace(/\s*{\s*/g, ' {\n  ')
              .replace(/;\s*/g, ';\n  ')
              .replace(/\s*}\s*/g, '\n}');  
}

function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        const existingStyle = document.getElementById('custom-theme-style');
        if (existingStyle) existingStyle.remove();
        const styleElement = document.createElement('style');
        styleElement.id = 'custom-theme-style';
        styleElement.textContent = savedTheme;
        document.head.appendChild(styleElement);
    }
}

function clearTheme() {
    localStorage.removeItem('theme');
    localStorage.removeItem('custom-img');
    localStorage.setItem('current-tab', 'themes');
    window.location.reload();
}

function setTheme(theme) {
    localStorage.setItem('theme', premadeThemes[theme]);
    localStorage.removeItem('custom-img');
    localStorage.setItem('current-tab', 'themes');
    window.location.reload();
}

function loadCustomTheme() {
    const themeValue = document.getElementById('themebox').value;
    if (themeValue) {
        localStorage.setItem('theme', themeValue);
        localStorage.setItem('current-tab', 'themes');
        window.location.reload();
    }
}

function setCustomImage() {
    const imageUrl = prompt('Enter the URL of your custom image:');
    if (imageUrl) {
        localStorage.setItem('custom-img', imageUrl);
        alert('Custom image set! It will appear on other pages with the Saturn logo.');
    }
}

const ORIGINAL_FAVICON = "/images/sater1.png";

function applyTabCloak(title, favicon) {
    const doc = window.top.document;
    if (title !== null) doc.title = title;
    if (favicon !== null) {
        doc.querySelectorAll("link[rel*='icon']").forEach(e => e.remove());
        if (favicon !== "") {
            const link = document.createElement("link");
            link.rel = "icon";
            link.href = favicon + "?v=" + Date.now();
            doc.head.appendChild(link);
        }
    }
}

function applySavedCloak() {
    const cloakDisabled = localStorage.getItem('cloak-disabled') === 'true';
    
    if (cloakDisabled) {
      
        const currentPath = window.location.pathname;
        if (currentPath.includes('settings')) {
            applyTabCloak("Saturn Proxy | Settings", ORIGINAL_FAVICON);
        }
    
        return;
    }
    
    const savedTitle = localStorage.getItem('custom-title');
    const savedFavicon = localStorage.getItem('custom-favicon');
    
    if (savedTitle || savedFavicon) {
        applyTabCloak(
            savedTitle || null,
            savedFavicon || null
        );
    }
}

function clearCloak() {
    localStorage.removeItem('custom-title');
    localStorage.removeItem('custom-favicon');
    localStorage.setItem('cloak-disabled', 'true'); 
    localStorage.setItem('current-tab', 'cloaking');
    
  
    const currentPath = window.location.pathname;
    if (currentPath.includes('settings')) {
        applyTabCloak("Saturn Proxy | Settings", ORIGINAL_FAVICON);
    }
}

function setCloak(title, favicon) {
    localStorage.removeItem('cloak-disabled'); 
    localStorage.setItem('custom-title', title);
    localStorage.setItem('custom-favicon', favicon);
    localStorage.setItem('current-tab', 'cloaking');
    applyTabCloak(title, favicon);
}

function setCustomTitle() {
    const title = document.getElementById('custom-title').value;
    if (title) {
        localStorage.removeItem('cloak-disabled'); 
        localStorage.setItem('custom-title', title);
        applyTabCloak(title, null);
    }
}

function setCustomFavicon() {
    const favicon = document.getElementById('custom-favicon').value;
    if (favicon) {
        localStorage.removeItem('cloak-disabled'); 
        localStorage.setItem('custom-favicon', favicon);
        applyTabCloak(null, favicon);
    }
}

function openAboutBlank() {
    const win = window.open();
    const iframe = win.document.createElement('iframe');
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.src = window.location.origin;
    win.document.body.style.margin = "0";
    win.document.body.appendChild(iframe);
}

let connection;
function initProxy() {
    if (typeof BareMux !== 'undefined') {
        connection = new BareMux.BareMuxConnection("/baremux/worker.js");
        transportDisplay();
        searchEngineDisplay();
        tabSystemDisplay();
        proxyBackendDisplay();
    }
}

function transportDisplay() {
    const transport = localStorage.getItem('proxy-transport') || 'Epoxy';
    const transportEl = document.getElementById('proxtrans');
    if (transportEl) transportEl.textContent = transport;
}

function searchEngineDisplay() {
    const searchEngine = localStorage.getItem('search-engine') || 'DuckDuckGo';
    const searchEngineEl = document.getElementById('search-engine-display');
    if (searchEngineEl) searchEngineEl.textContent = searchEngine;
}

function tabSystemDisplay() {
    const tabSystemEnabled = localStorage.getItem('tab-system-enabled') !== 'false';
    const statusEl = document.getElementById('tab-system-status');
    if (statusEl) {
        statusEl.textContent = tabSystemEnabled ? 'Enabled' : 'Disabled';
        statusEl.style.color = '#a855f7';
    }
}

function proxyBackendDisplay() {
    const backend = localStorage.getItem('proxy-backend') || 'uv';
    window.currentProxyBackend = backend;
    const backendEl = document.getElementById('proxy-backend-status');
    if (backendEl) {
        backendEl.textContent = backend === 'scramjet' ? 'Scramjet' : 'Ultraviolet';
        backendEl.style.color = '#a855f7';
    }
    console.log(`[settings.js] Displayed backend: ${backend}`);
}

async function setConnection(arg) {
    if (!connection) { alert('Proxy scripts are still loading.'); return; }
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    try {
        switch (arg) {
            case 1: 
                await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]); 
                localStorage.setItem('proxy-transport','Epoxy'); 
                break;
            case 2: 
                await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]); 
                localStorage.setItem('proxy-transport','Libcurl'); 
                break;
        }
        localStorage.setItem('current-tab', 'proxy');
        transportDisplay();
        alert('Transport changed successfully!');
    } catch (err) { 
        console.error(err); 
        alert('Failed to set transport.'); 
    }
}

function setSearchEngine(engine) {
    const engines = {
        'duckduckgo': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
        'google': { name: 'Google', url: 'https://www.google.com/search?q=%s' },
        'brave': { name: 'Brave', url: 'https://search.brave.com/search?q=%s' },
        'bing': { name: 'Bing', url: 'https://www.bing.com/search?q=%s' }
    };
    
    if (engines[engine]) {
        localStorage.setItem('search-engine', engines[engine].name);
        localStorage.setItem('search-engine-url', engines[engine].url);
        localStorage.setItem('current-tab', 'proxy');
        searchEngineDisplay();
        alert(`Search engine changed to ${engines[engine].name}!`);
    }
}

function enableTabSystem() {
    localStorage.setItem('tab-system-enabled', 'true');
    localStorage.setItem('current-tab', 'proxy');
    tabSystemDisplay();
    alert('Tab system enabled! Changes will apply when you use the proxy.');
}

function disableTabSystem() {
    localStorage.setItem('tab-system-enabled', 'false');
    localStorage.setItem('current-tab', 'proxy');
    tabSystemDisplay();
    alert('Tab system disabled! Changes will apply when you use the proxy.');
}

function setProxyBackend(backend) {
    console.log(`[settings.js] Setting proxy backend to: ${backend}`);
    
    localStorage.setItem('proxy-backend', backend);
    window.currentProxyBackend = backend;
    
    if (typeof switchProxyBackend === 'function') {
        switchProxyBackend(backend);
    }
    
    localStorage.setItem('current-tab', 'proxy');
    proxyBackendDisplay();
    
    alert(`Proxy backend changed to ${backend === 'scramjet' ? 'Scramjet' : 'Ultraviolet'}! Reload the page or create a new tab for changes to take effect.`);
}

window.addEventListener('load', () => setTimeout(initProxy, 500));

window.addEventListener('DOMContentLoaded', () => {
    applyTheme();
});