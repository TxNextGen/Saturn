
(function() {
    const themeColors = {
        default: {
            primary: '#a855f7',
            secondary: '#ec4899',
            light: '#c084fc'
        },
        blue: {
            primary: '#6487e6',
            secondary: '#4776d9',
            light: '#a0b1ff'
        },
        night: {
            primary: '#818181',
            secondary: '#505050',
            light: '#b3b3b3'
        },
        red: {
            primary: '#974646',
            secondary: '#722929',
            light: '#ffa0a0'
        },
        green: {
            primary: '#89e664',
            secondary: '#62be46',
            light: '#a8ffa0'
        }
    };

    function getCurrentTheme() {
        const themeName = localStorage.getItem('current-theme-name');
        if (themeName && themeColors[themeName]) {
            console.log('Theme from current-theme-name:', themeName);
            return themeName;
        }
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            if (savedTheme.includes('#6487e6')) return 'blue';
            if (savedTheme.includes('#818181')) return 'night';
            if (savedTheme.includes('#974646')) return 'red';
            if (savedTheme.includes('#89e664')) return 'green';
        }
        
        return 'default';
    }

    function rgbaFromHex(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function applyThemeColors(themeName) {
        const colors = themeColors[themeName] || themeColors.default;
        
        document.documentElement.style.setProperty('--theme-primary', colors.primary);
        document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
        document.documentElement.style.setProperty('--theme-light', colors.light);
        document.documentElement.style.setProperty('--accent-primary', colors.primary);
        document.documentElement.style.setProperty('--accent-secondary', colors.secondary);
        document.documentElement.style.setProperty('--border-color', colors.primary);
        
        const primaryRgba = rgbaFromHex(colors.primary, 0.4);
        document.documentElement.style.setProperty('--sidebar-glow', primaryRgba);
        
        console.log(`Theme colors applied: ${themeName}`, colors);
    }


    function applyDirectStyles() {
        const themeName = getCurrentTheme();
        const colors = themeColors[themeName] || themeColors.default;
        
        console.log('🎯 Applying DIRECT styles to sidebar elements for theme:', themeName);
        
    
        const sidebar = document.querySelector('.sidebar') || document.querySelector('nav.sidebar');
        if (sidebar) {
            sidebar.style.borderRight = `2px solid ${colors.primary}`;
            sidebar.style.boxShadow = `0 0 40px ${rgbaFromHex(colors.primary, 0.4)}`;
            console.log('✅ Sidebar border updated to:', colors.primary);
        }
        

        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.background = rgbaFromHex(colors.primary, 0.1);
            logoContainer.style.border = `1px solid ${rgbaFromHex(colors.primary, 0.3)}`;
            
            const logoImg = logoContainer.querySelector('img');
            if (logoImg) {
                logoImg.style.filter = `drop-shadow(0 0 8px ${rgbaFromHex(colors.primary, 0.6)})`;
            }
            console.log('✅ Logo container updated');
        }
        
     
        const dividers = document.querySelectorAll('.nav-divider');
        dividers.forEach(divider => {
            divider.style.background = `linear-gradient(90deg, transparent, ${rgbaFromHex(colors.primary, 0.6)}, transparent)`;
        });
        if (dividers.length > 0) console.log(`✅ Updated ${dividers.length} dividers`);
        

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.style.border = `1px solid ${rgbaFromHex(colors.primary, 0.2)}`;
        });
        if (navItems.length > 0) console.log(`✅ Updated ${navItems.length} nav items`);
        

        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => {
            tooltip.style.background = rgbaFromHex(colors.primary, 0.95);
            tooltip.style.boxShadow = `0 8px 32px ${rgbaFromHex(colors.primary, 0.5)}`;
        });
        if (tooltips.length > 0) console.log(`✅ Updated ${tooltips.length} tooltips`);
    }

    function injectThemeStyles() {
        const oldStyle = document.getElementById('dynamic-theme-styles');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        const themeName = getCurrentTheme();
        const colors = themeColors[themeName] || themeColors.default;
        
        const style = document.createElement('style');
        style.id = 'dynamic-theme-styles';
        style.textContent = `
            nav.sidebar,
            .sidebar {
                border-right-color: ${colors.primary} !important;
                border-right-width: 2px !important;
                border-right-style: solid !important;
                box-shadow: 0 0 40px ${rgbaFromHex(colors.primary, 0.4)} !important;
                animation: pulse-${themeName} 4s ease-in-out infinite !important;
            }
            
            @keyframes pulse-${themeName} {
                0%, 100% {
                    box-shadow: 0 0 40px ${rgbaFromHex(colors.primary, 0.4)} !important;
                }
                50% {
                    box-shadow: 0 0 50px ${rgbaFromHex(colors.primary, 0.6)} !important;
                }
            }
            
            a.logo-container,
            .logo-container {
                background: ${rgbaFromHex(colors.primary, 0.1)} !important;
                border: 1px solid ${rgbaFromHex(colors.primary, 0.3)} !important;
            }
            
            .logo-container img {
                filter: drop-shadow(0 0 8px ${rgbaFromHex(colors.primary, 0.6)}) !important;
            }
            
            a.logo-container:hover,
            .logo-container:hover {
                background: ${rgbaFromHex(colors.primary, 0.2)} !important;
                border-color: ${rgbaFromHex(colors.primary, 0.6)} !important;
                box-shadow: 0 0 20px ${rgbaFromHex(colors.primary, 0.5)} !important;
            }
            
            .logo-container:hover img {
                filter: drop-shadow(0 0 15px ${colors.primary}) !important;
            }
            
            div.nav-divider,
            .nav-divider {
                background: linear-gradient(90deg, transparent, ${rgbaFromHex(colors.primary, 0.6)}, transparent) !important;
            }
            
            a.nav-item,
            .nav-item {
                border: 1px solid ${rgbaFromHex(colors.primary, 0.2)} !important;
            }
            
            a.nav-item:hover,
            .nav-item:hover {
                border-color: ${colors.primary} !important;
            }
            
            div.tooltip,
            .tooltip {
                background: ${rgbaFromHex(colors.primary, 0.95)} !important;
                box-shadow: 0 8px 32px ${rgbaFromHex(colors.primary, 0.5)} !important;
            }
            
            .tooltip::before {
                border-right-color: ${rgbaFromHex(colors.primary, 0.95)} !important;
            }
        `;
        
        document.head.appendChild(style);
        console.log(`✅ Dynamic styles injected for theme: ${themeName}`);
    }

    function init() {
        const themeName = getCurrentTheme();
        console.log('🎨 Initializing theme:', themeName);
        applyThemeColors(themeName);
        
        setTimeout(() => {
            injectThemeStyles();
        
            applyDirectStyles();
        }, 50);
        
        if (typeof window.updateCanvasTheme === 'function') {
            window.updateCanvasTheme(themeName);
        }
    }

    window.applyGlobalTheme = function(themeName) {
        if (!themeColors[themeName]) {
            console.error('❌ Invalid theme name:', themeName);
            return;
        }
        
        console.log('🔄 Applying global theme:', themeName);
        applyThemeColors(themeName);
        injectThemeStyles();
        applyDirectStyles(); 
        
        if (typeof window.updateCanvasTheme === 'function') {
            window.updateCanvasTheme(themeName);
        }
        
        localStorage.setItem('theme-change-trigger', Date.now().toString());
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            init();
        
            setTimeout(applyDirectStyles, 200);
        }, 100);
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'current-theme-name' || e.key === 'theme' || e.key === 'theme-change-trigger') {
            console.log('📡 Theme change detected from storage event, reapplying...');
            setTimeout(() => {
                init();
                applyDirectStyles();
            }, 100);
        }
    });

    setInterval(() => {
        const currentTheme = getCurrentTheme();
        const currentStyle = document.getElementById('dynamic-theme-styles');
        
        if (!currentStyle) {
            console.log('⚠️ Dynamic styles missing, reinitializing...');
            init();
            return;
        }
        
        const expectedColor = themeColors[currentTheme].primary;
        
        if (!currentStyle.textContent.includes(expectedColor)) {
            console.log('🔧 Theme mismatch detected, updating to:', currentTheme);
            init();
            applyDirectStyles();
        }
    }, 500);
})();