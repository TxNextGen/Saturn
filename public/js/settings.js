// Tab Switching
function switchTab(tabName) {
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(tabName).classList.add('active');
    
    // Add active to clicked button
    event.target.classList.add('active');
    
    // Save current tab to localStorage
    localStorage.setItem('current-tab', tabName);
}

// Apply saved theme on page load
function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        // Remove any existing theme style
        const existingStyle = document.getElementById('custom-theme-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Create and inject new theme style
        const styleElement = document.createElement('style');
        styleElement.id = 'custom-theme-style';
        styleElement.textContent = savedTheme;
        document.head.appendChild(styleElement);
    }
}

// Theme Functions
const premadeThemes = {
    "blue": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(160, 177, 255); --primary-mid: rgb(100, 135, 230); --primary-dark: rgb(70, 82, 190); --accent-color: rgb(71, 70, 130); --accent-color-dark: rgb(55, 54, 100); --background-dark: rgb(5, 5, 14); --background-light: rgb(16, 13, 41); } body { background: rgb(5, 5, 14) !important; } .setting-card { background: rgba(16, 13, 41, 0.5) !important; border-color: rgba(100, 135, 230, 0.3) !important; } button { background: rgba(100, 135, 230, 0.2) !important; border-color: rgba(160, 177, 255, 0.3) !important; } button:hover { background: rgba(100, 135, 230, 0.4) !important; } .tab-btn.active { background: rgba(100, 135, 230, 0.3) !important; border-color: rgb(100, 135, 230) !important; }",
    "night": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(179, 179, 179); --primary-mid: rgb(129, 129, 129); --primary-dark: rgb(80, 80, 80); --accent-color: rgb(56, 56, 56); --accent-color-dark: rgb(29, 29, 29); --background-dark: rgb(0, 0, 0); --background-light: rgb(19, 19, 19); } body { background: rgb(0, 0, 0) !important; } .setting-card { background: rgba(19, 19, 19, 0.5) !important; border-color: rgba(129, 129, 129, 0.3) !important; } button { background: rgba(129, 129, 129, 0.2) !important; border-color: rgba(179, 179, 179, 0.3) !important; } button:hover { background: rgba(129, 129, 129, 0.4) !important; } .tab-btn.active { background: rgba(129, 129, 129, 0.3) !important; border-color: rgb(129, 129, 129) !important; }",
    "red": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(255, 160, 160); --primary-mid: rgb(151, 70, 70); --primary-dark: rgb(114, 41, 41); --accent-color: rgb(130, 70, 70); --accent-color-dark: rgb(100, 54, 54); --background-dark: rgb(14, 5, 5); --background-light: rgb(41, 13, 13); } body { background: rgb(14, 5, 5) !important; } .setting-card { background: rgba(41, 13, 13, 0.5) !important; border-color: rgba(151, 70, 70, 0.3) !important; } button { background: rgba(151, 70, 70, 0.2) !important; border-color: rgba(255, 160, 160, 0.3) !important; } button:hover { background: rgba(151, 70, 70, 0.4) !important; } .tab-btn.active { background: rgba(151, 70, 70, 0.3) !important; border-color: rgb(151, 70, 70) !important; } h1 { color: rgb(255, 160, 160) !important; }",
    "green": ":root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(168, 255, 160); --primary-mid: rgb(137, 230, 100); --primary-dark: rgb(98, 190, 70); --accent-color: rgb(82, 130, 70); --accent-color-dark: rgb(70, 110, 60); --background-dark: rgb(5, 15, 6); --background-light: rgb(22, 41, 13); } body { background: rgb(5, 15, 6) !important; } .setting-card { background: rgba(22, 41, 13, 0.5) !important; border-color: rgba(137, 230, 100, 0.3) !important; } button { background: rgba(137, 230, 100, 0.2) !important; border-color: rgba(168, 255, 160, 0.3) !important; } button:hover { background: rgba(137, 230, 100, 0.4) !important; } .tab-btn.active { background: rgba(137, 230, 100, 0.3) !important; border-color: rgb(137, 230, 100) !important; } h1 { color: rgb(168, 255, 160) !important; }"
};

function formatCSS(css) { 
    return css
        .replace(/\s*{\s*/g, ' {\n  ') 
        .replace(/;\s*/g, ';\n  ')    
        .replace(/\s*}\s*/g, '\n}');  
}

// Initialize theme textbox and apply theme when page loads
window.addEventListener('DOMContentLoaded', () => {
    // Apply theme first
    applyTheme();
    
    const themeBox = document.getElementById('themebox');
    if (themeBox) {
        if (localStorage.getItem('theme')) {
            themeBox.value = formatCSS(localStorage.getItem('theme'));
        } else {
            themeBox.value = formatCSS(`:root { --font-family: sans-serif; --font-color: rgb(255, 255, 255); --sidebar-size: 50px; --primary-light: rgb(225, 160, 255); --primary-mid: rgb(180, 100, 230); --primary-dark: rgb(130, 70, 190); --accent-color: rgb(100, 70, 130); --accent-color-dark: rgb(85, 60, 110); --background-dark: rgb(11, 5, 15); --background-light: rgb(27, 13, 41); }`);
        }
    }
    
    // Restore last active tab
    const savedTab = localStorage.getItem('current-tab');
    if (savedTab) {
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const tabSection = document.getElementById(savedTab);
        const tabButton = document.querySelector(`[onclick="switchTab('${savedTab}')"]`);
        if (tabSection && tabButton) {
            tabSection.classList.add('active');
            tabButton.classList.add('active');
        }
    }
});

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
    const imgUrl = prompt('Please paste the image URL (must start with https://)');
    if (imgUrl) {
        localStorage.setItem('custom-img', imgUrl);
        localStorage.setItem('current-tab', 'themes');
        window.location.reload();
    }
}

// Cloaking Functions
function clearCloak() {
    localStorage.removeItem('custom-title');
    localStorage.removeItem('custom-favicon');
    localStorage.setItem('current-tab', 'cloaking');
    window.location.reload();
}

function setCloak(title, favicon) {
    localStorage.setItem('custom-title', title);
    localStorage.setItem('custom-favicon', favicon);
    localStorage.setItem('current-tab', 'cloaking');
    window.location.reload();
}

function setCustomTitle() {
    const title = document.getElementById('custom-title').value;
    if (title) {
        localStorage.setItem('custom-title', title);
        localStorage.setItem('current-tab', 'cloaking');
        window.location.reload();
    }
}

function setCustomFavicon() {
    const favicon = document.getElementById('custom-favicon').value;
    if (favicon) {
        localStorage.setItem('custom-favicon', favicon);
        localStorage.setItem('current-tab', 'cloaking');
        window.location.reload();
    }
}

function openAboutBlank() {
    const win = window.open();
    const url = window.location.origin;
    const iframe = win.document.createElement('iframe');
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.src = url;
    win.document.body.appendChild(iframe);
}

// Appearance Functions
function setLoadingScreen(enabled) {
    localStorage.setItem('load-enabled', enabled);
    localStorage.setItem('current-tab', 'appearance');
    window.location.reload();
}

// Proxy Functions - Will initialize when scripts load
let connection;

function initProxy() {
    if (typeof BareMux !== 'undefined') {
        connection = new BareMux.BareMuxConnection("/baremux/worker.js");
        transportDisplay();
    }
}

function transportDisplay() {
    const transport = localStorage.getItem('proxy-transport') || 'Libcurl';
    const transportEl = document.getElementById('proxtrans');
    if (transportEl) {
        transportEl.textContent = transport;
    }
}

async function setConnection(arg) {
    if (!connection) {
        alert('Proxy scripts are still loading. Please try again.');
        return;
    }

    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    
    try {
        switch (arg) {
            case 1:
                await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                localStorage.setItem('proxy-transport', 'Epoxy');
                break;
            case 2:
                await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
                localStorage.setItem('proxy-transport', 'Libcurl');
                break;
        }
        localStorage.setItem('current-tab', 'proxy');
        transportDisplay();
        alert('Transport changed successfully!');
    } catch (error) {
        console.error('Error setting transport:', error);
        alert('Failed to set transport. Please try again.');
    }
}

window.addEventListener('load', () => {
    setTimeout(initProxy, 500);
});