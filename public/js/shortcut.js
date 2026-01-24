
const DEFAULT_SHORTCUTS = [
    {
        id: 'tiktok',
        name: 'TikTok',
        url: 'https://www.tiktok.com',
        favicon: 'https://www.tiktok.com/favicon.ico',
        isDefault: true
    },
    {
        id: 'soundcloud',
        name: 'SoundCloud',
        url: 'https://soundcloud.com',
        favicon: 'https://soundcloud.com/favicon.ico',
        isDefault: true
    },
    {
        id: '9anime',
        name: '9anime',
        url: 'https://9anime.to',
        favicon: 'https://9anime.to/favicon.ico',
        isDefault: true
    },
    {
        id: 'geforce',
        name: 'GeForce NOW',
        url: 'https://play.geforcenow.com',
        favicon: 'https://play.geforcenow.com/favicon.ico',
        isDefault: true
    }
];


function getShortcuts() {
    const saved = sessionStorage.getItem('shortcuts');
    let userShortcuts = [];
    
    if (saved) {
        try {
            userShortcuts = JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing shortcuts:', e);
            userShortcuts = [];
        }
    }
    

    return [...DEFAULT_SHORTCUTS, ...userShortcuts];
}


function saveShortcuts(shortcuts) {

    const userShortcuts = shortcuts.filter(s => !s.isDefault);
    sessionStorage.setItem('shortcuts', JSON.stringify(userShortcuts));
}


function getFaviconUrl(url) {
    try {
        const urlObj = new URL(url);
        return `${urlObj.origin}/favicon.ico`;
    } catch (e) {
        return '';
    }
}


function generateId() {
    return 'shortcut_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}


function renderShortcuts() {
    const container = document.getElementById('shortcuts-grid');
    if (!container) return;

    const shortcuts = getShortcuts();
    container.innerHTML = '';

    shortcuts.forEach(shortcut => {
        const shortcutEl = document.createElement('div');
        shortcutEl.className = 'shortcut-item';
        shortcutEl.setAttribute('data-shortcut-id', shortcut.id);

     
        const favicon = document.createElement('div');
        favicon.className = 'shortcut-favicon';
        
        const img = document.createElement('img');
        img.src = shortcut.favicon;
        img.alt = shortcut.name;
        img.onerror = function() {
          
            this.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'shortcut-favicon-fallback';
            fallback.textContent = shortcut.name.charAt(0).toUpperCase();
            favicon.appendChild(fallback);
        };
        favicon.appendChild(img);

      
        const name = document.createElement('div');
        name.className = 'shortcut-name';
        name.textContent = shortcut.name;

   
        if (!shortcut.isDefault) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'shortcut-delete';
            deleteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteShortcut(shortcut.id);
            });
            shortcutEl.appendChild(deleteBtn);
        }

    
        shortcutEl.addEventListener('click', () => {
 
            if (typeof window.goTo === 'function') {
                window.goTo(shortcut.url);
            } else {
                console.error('goTo function not found - make sure tab.js is loaded');
            
                window.location.href = shortcut.url;
            }
        });

        shortcutEl.appendChild(favicon);
        shortcutEl.appendChild(name);
        container.appendChild(shortcutEl);
    });
}


function addShortcut(name, url) {
    if (!name || !url) return false;

   
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    const shortcuts = getShortcuts();
    const newShortcut = {
        id: generateId(),
        name: name.trim(),
        url: url.trim(),
        favicon: getFaviconUrl(url),
        isDefault: false
    };

    shortcuts.push(newShortcut);
    saveShortcuts(shortcuts);
    renderShortcuts();
    return true;
}


function deleteShortcut(id) {
    const shortcuts = getShortcuts();
    
   
    const shortcutToDelete = shortcuts.find(s => s.id === id);
    if (shortcutToDelete && shortcutToDelete.isDefault) {
        console.warn('Cannot delete default shortcuts');
        return;
    }
    
    const filtered = shortcuts.filter(s => s.id !== id);
    saveShortcuts(filtered);
    renderShortcuts();
}


function openModal() {
    const modal = document.getElementById('add-shortcut-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('shortcut-name').value = '';
        document.getElementById('shortcut-url').value = '';
        updateFaviconPreview('');
 
        setTimeout(() => {
            document.getElementById('shortcut-name').focus();
        }, 100);
    }
}

function closeModal() {
    const modal = document.getElementById('add-shortcut-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateFaviconPreview(url) {
    const previewImg = document.getElementById('favicon-preview-img');
    const previewText = document.getElementById('favicon-preview-text');
    
    if (!url || !/^https?:\/\//i.test(url)) {
        if (previewImg) previewImg.style.display = 'none';
        if (previewText) {
            previewText.style.display = 'block';
            previewText.textContent = 'Enter a URL';
        }
        return;
    }

    const faviconUrl = getFaviconUrl(url);
    if (previewImg) {
        previewImg.src = faviconUrl;
        previewImg.style.display = 'block';
        previewImg.onerror = function() {
            this.style.display = 'none';
            if (previewText) {
                previewText.style.display = 'block';
                previewText.textContent = 'Favicon not available';
            }
        };
    }
    if (previewText) {
        previewText.style.display = 'none';
    }
}


window.addEventListener('DOMContentLoaded', () => {
 
    renderShortcuts();

  
    const addBtn = document.getElementById('add-shortcut-btn');
    if (addBtn) {
        addBtn.addEventListener('click', openModal);
    }


    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    
    const cancelBtn = document.getElementById('modal-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

   
    const saveBtn = document.getElementById('modal-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('shortcut-name').value;
            const url = document.getElementById('shortcut-url').value;

            if (!name) {
                alert('Please enter a name for the shortcut');
                return;
            }

            if (!url) {
                alert('Please enter a URL for the shortcut');
                return;
            }

            if (addShortcut(name, url)) {
                closeModal();
            }
        });
    }

   
    const urlInput = document.getElementById('shortcut-url');
    if (urlInput) {
        urlInput.addEventListener('input', (e) => {
            let url = e.target.value.trim();
            if (url && !/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            updateFaviconPreview(url);
        });

     
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('modal-save').click();
            }
        });
    }


    const nameInput = document.getElementById('shortcut-name');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                urlInput.focus();
            }
        });
    }

    
    const modal = document.getElementById('add-shortcut-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

  
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});


window.shortcutManager = {
    getShortcuts,
    addShortcut,
    deleteShortcut,
    renderShortcuts
};