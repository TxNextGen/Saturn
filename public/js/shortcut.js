const DEFAULT_SHORTCUTS = [
    {
        id: 'youtube',
        name: 'Youtube',
        url: 'https://www.youtube.com',
        favicon: '/images/yt1.png',
        isDefault: true
    },
    {
        id: 'tiktok',
        name: 'Tiktok',
        url: 'https://tiktok.com',
        favicon: '/images/tiktok.png',
        isDefault: true
    },
    {
        id: 'soundcloud',
        name: 'Soudcloud',
        url: 'https://soundcloud.com',
        favicon: '/images/cloud.jpg',
        isDefault: true
    },
    {
        id: 'geforce',
        name: 'GeForce',
        url: 'https://play.geforcenow.com',
        favicon: '/images/now.webp',
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
            shortcutEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e, shortcut);
            });
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


function showContextMenu(event, shortcut) {

    const existingMenu = document.getElementById('shortcut-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }


    const menu = document.createElement('div');
    menu.id = 'shortcut-context-menu';
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';


    const renameOption = document.createElement('div');
    renameOption.className = 'context-menu-item';
    renameOption.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span>Rename</span>
    `;
    renameOption.addEventListener('click', () => {
        menu.remove();
        openEditModal(shortcut, 'rename');
    });


    const changeUrlOption = document.createElement('div');
    changeUrlOption.className = 'context-menu-item';
    changeUrlOption.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span>Change URL</span>
    `;
    changeUrlOption.addEventListener('click', () => {
        menu.remove();
        openEditModal(shortcut, 'url');
    });


    const deleteOption = document.createElement('div');
    deleteOption.className = 'context-menu-item context-menu-item-danger';
    deleteOption.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Delete</span>
    `;
    deleteOption.addEventListener('click', () => {
        menu.remove();
        if (confirm(`Delete "${shortcut.name}"?`)) {
            deleteShortcut(shortcut.id);
        }
    });

    menu.appendChild(renameOption);
    menu.appendChild(changeUrlOption);
    menu.appendChild(deleteOption);
    document.body.appendChild(menu);

  
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
}


function openEditModal(shortcut, mode = 'rename') {
    const modal = document.getElementById('edit-shortcut-modal');
    if (!modal) {
        createEditModal();
        return openEditModal(shortcut, mode);
    }

    const nameInput = document.getElementById('edit-shortcut-name');
    const urlInput = document.getElementById('edit-shortcut-url');
    const modalTitle = modal.querySelector('.modal-header h3');

    if (mode === 'rename') {
        modalTitle.textContent = 'Rename Shortcut';
        nameInput.value = shortcut.name;
        urlInput.value = shortcut.url;
        urlInput.disabled = true;
        nameInput.disabled = false;
    } else if (mode === 'url') {
        modalTitle.textContent = 'Change URL';
        nameInput.value = shortcut.name;
        urlInput.value = shortcut.url;
        nameInput.disabled = true;
        urlInput.disabled = false;
    }

    modal.classList.add('active');
    updateEditFaviconPreview(shortcut.url);

    setTimeout(() => {
        if (mode === 'rename') {
            nameInput.focus();
            nameInput.select();
        } else {
            urlInput.focus();
            urlInput.select();
        }
    }, 100);


    const saveBtn = document.getElementById('edit-modal-save');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        const newUrl = urlInput.value.trim();

        if (!newName) {
            alert('Please enter a name for the shortcut');
            return;
        }

        if (!newUrl) {
            alert('Please enter a URL for the shortcut');
            return;
        }

        updateShortcut(shortcut.id, newName, newUrl);
        closeEditModal();
    });
}


function createEditModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'edit-shortcut-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Shortcut</h3>
                <button class="modal-close" id="edit-modal-close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <label for="edit-shortcut-name">Name</label>
                    <input type="text" id="edit-shortcut-name" placeholder="e.g., TikTok" autocomplete="off">
                </div>
                <div class="input-group">
                    <label for="edit-shortcut-url">URL</label>
                    <input type="text" id="edit-shortcut-url" placeholder="e.g., https://tiktok.com" autocomplete="off">
                </div>
                <div class="favicon-preview" id="edit-favicon-preview">
                    <img id="edit-favicon-preview-img" src="" alt="Favicon preview" style="display: none;">
                    <span id="edit-favicon-preview-text">Enter a URL</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="edit-modal-cancel">Cancel</button>
                <button class="btn-primary" id="edit-modal-save">Save Changes</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

 
    document.getElementById('edit-modal-close').addEventListener('click', closeEditModal);
    document.getElementById('edit-modal-cancel').addEventListener('click', closeEditModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEditModal();
        }
    });

    const urlInput = document.getElementById('edit-shortcut-url');
    urlInput.addEventListener('input', (e) => {
        let url = e.target.value.trim();
        if (url && !/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        updateEditFaviconPreview(url);
    });

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('edit-modal-save').click();
        }
    });

    const nameInput = document.getElementById('edit-shortcut-name');
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (!urlInput.disabled) {
                urlInput.focus();
            } else {
                document.getElementById('edit-modal-save').click();
            }
        }
    });
}


function closeEditModal() {
    const modal = document.getElementById('edit-shortcut-modal');
    if (modal) {
        modal.classList.remove('active');
        const nameInput = document.getElementById('edit-shortcut-name');
        const urlInput = document.getElementById('edit-shortcut-url');
        if (nameInput) nameInput.disabled = false;
        if (urlInput) urlInput.disabled = false;
    }
}


function updateEditFaviconPreview(url) {
    const previewImg = document.getElementById('edit-favicon-preview-img');
    const previewText = document.getElementById('edit-favicon-preview-text');
    
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


function updateShortcut(id, newName, newUrl) {
    const shortcuts = getShortcuts();
    const shortcut = shortcuts.find(s => s.id === id);
    
    if (!shortcut || shortcut.isDefault) {
        console.warn('Cannot update default shortcuts');
        return;
    }


    if (!/^https?:\/\//i.test(newUrl)) {
        newUrl = 'https://' + newUrl;
    }

    shortcut.name = newName;
    shortcut.url = newUrl;
    shortcut.favicon = getFaviconUrl(newUrl);

    saveShortcuts(shortcuts);
    renderShortcuts();
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
            closeEditModal();
            
            const contextMenu = document.getElementById('shortcut-context-menu');
            if (contextMenu) {
                contextMenu.remove();
            }
        }
    });
});


window.shortcutManager = {
    getShortcuts,
    addShortcut,
    deleteShortcut,
    updateShortcut,
    renderShortcuts
};