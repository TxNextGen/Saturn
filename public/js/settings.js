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

    sessionStorage.setItem('current-tab', tabName);
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const savedTab = sessionStorage.getItem('current-tab') || 'themes';
    const section = document.getElementById(savedTab);
    if (section) section.classList.add('active');
    const btn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(b => b.getAttribute('onclick')?.includes(savedTab));
    if (btn) btn.classList.add('active');
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
    const savedTheme = sessionStorage.getItem('theme');
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
    sessionStorage.removeItem('theme');
    sessionStorage.removeItem('custom-img');
    sessionStorage.setItem('current-tab', 'themes');
    window.location.reload();
}

function setTheme(theme) {
    sessionStorage.setItem('theme', premadeThemes[theme]);
    sessionStorage.removeItem('custom-img');
    sessionStorage.setItem('current-tab', 'themes');
    window.location.reload();
}

function loadCustomTheme() {
    const themeValue = document.getElementById('themebox').value;
    if (themeValue) {
        sessionStorage.setItem('theme', themeValue);
        sessionStorage.setItem('current-tab', 'themes');
        window.location.reload();
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

function clearCloak() {
    sessionStorage.removeItem('custom-title');
    sessionStorage.removeItem('custom-favicon');
    sessionStorage.setItem('current-tab', 'cloaking');
    applyTabCloak("SaturnProxy | Settings", ORIGINAL_FAVICON);
}

function setCloak(title, favicon) {
    sessionStorage.setItem('custom-title', title);
    sessionStorage.setItem('custom-favicon', favicon);
    sessionStorage.setItem('current-tab', 'cloaking');
    applyTabCloak(title, favicon);
}

function setCustomTitle() {
    const title = document.getElementById('custom-title').value;
    if (title) {
        sessionStorage.setItem('custom-title', title);
        applyTabCloak(title, null);
    }
}

function setCustomFavicon() {
    const favicon = document.getElementById('custom-favicon').value;
    if (favicon) {
        sessionStorage.setItem('custom-favicon', favicon);
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
    }
}

function transportDisplay() {
    const transport = sessionStorage.getItem('proxy-transport') || 'Libcurl';
    const transportEl = document.getElementById('proxtrans');
    if (transportEl) transportEl.textContent = transport;
}

function searchEngineDisplay() {
    const searchEngine = sessionStorage.getItem('search-engine') || 'DuckDuckGo';
    const searchEngineEl = document.getElementById('search-engine-display');
    if (searchEngineEl) searchEngineEl.textContent = searchEngine;
}

function tabSystemDisplay() {
    const tabSystemEnabled = sessionStorage.getItem('tab-system-enabled') !== 'false';
    const statusEl = document.getElementById('tab-system-status');
    if (statusEl) {
        statusEl.textContent = tabSystemEnabled ? 'Enabled' : 'Disabled';
        statusEl.style.color = tabSystemEnabled ? '#a855f7' : '#a855f7';
    }
}

async function setConnection(arg) {
    if (!connection) { alert('Proxy scripts are still loading.'); return; }
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    try {
        switch (arg) {
            case 1: 
                await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]); 
                sessionStorage.setItem('proxy-transport','Epoxy'); 
                break;
            case 2: 
                await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]); 
                sessionStorage.setItem('proxy-transport','Libcurl'); 
                break;
        }
        sessionStorage.setItem('current-tab', 'proxy');
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
        sessionStorage.setItem('search-engine', engines[engine].name);
        sessionStorage.setItem('search-engine-url', engines[engine].url);
        sessionStorage.setItem('current-tab', 'proxy');
        searchEngineDisplay();
        alert(`Search engine changed to ${engines[engine].name}!`);
    }
}

function enableTabSystem() {
    sessionStorage.setItem('tab-system-enabled', 'true');
    sessionStorage.setItem('current-tab', 'proxy');
    tabSystemDisplay();
    alert('Tab system enabled! Changes will apply when you use the proxy.');
}

function disableTabSystem() {
    sessionStorage.setItem('tab-system-enabled', 'false');
    sessionStorage.setItem('current-tab', 'proxy');
    tabSystemDisplay();
    alert('Tab system disabled! Changes will apply when you use the proxy.');
}

window.addEventListener('load', () => setTimeout(initProxy, 500));

window.addEventListener('DOMContentLoaded', () => {
    applyTheme();
});