import { state } from './state.js';

const contentArea = document.getElementById('content-area');
const breadcrumbs = document.getElementById('breadcrumbs');

export function renderAlbumList() {
    breadcrumbs.innerHTML = '';
    breadcrumbs.classList.add('hidden');

    if (!state.config) return;

    const grid = document.createElement('div');
    grid.className = 'album-grid';

    state.config.albums.forEach(album => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.location.hash = `#album/${album.id}`;

        card.innerHTML = `
            <img src="${album.path}/${album.cover}" alt="${album.title}" class="card-img" loading="lazy">
            <div class="card-overlay">
                <h3 class="card-title">${album.title}</h3>
                <p class="card-desc">Click to view collection</p>
            </div>
        `;
        grid.appendChild(card);
    });

    contentArea.innerHTML = '';
    contentArea.appendChild(grid);
}

export function renderAlbumDetail(albumId) {
    const album = state.config.albums.find(a => a.id === albumId);
    const manifest = state.albums[albumId];

    if (!album || !manifest) {
        contentArea.innerHTML = '<p>Album not found or loading...</p>';
        return;
    }

    // Update Breadcrumbs
    breadcrumbs.classList.remove('hidden');
    breadcrumbs.innerHTML = `
        <a href="#" style="color: var(--text-secondary); text-decoration: none;">Home</a> 
        <span style="margin: 0 0.5rem; color: var(--text-secondary);">/</span> 
        <span style="color: var(--text-primary); font-weight: 600;">${album.title}</span>
    `;

    // Header Info
    const header = document.createElement('div');
    header.style.marginBottom = 'var(--space-lg)';
    header.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">${manifest.title}</h2>
        <p style="color: var(--text-secondary); max-width: 600px;">${manifest.description || ''}</p>
    `;

    // Image Grid
    const grid = document.createElement('div');
    grid.className = 'image-grid';

    manifest.images.forEach((img, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => import('./main.js').then(m => m.openLightbox(index));

        const isVideo = img.filename.toLowerCase().endsWith('.mp4') || img.filename.toLowerCase().endsWith('.webm');
        const mediaHtml = isVideo
            ? `<video src="${album.path}/${img.filename}" class="card-img" muted loop onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>
               <div class="video-indicator" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; pointer-events: none;">▶ Video</div>`
            : `<img src="${album.path}/${img.filename}" alt="${img.title}" class="card-img" loading="lazy">`;

        card.innerHTML = `
            ${mediaHtml}
            <div class="card-overlay">
                <h3 class="card-title">${img.title}</h3>
            </div>
        `;
        grid.appendChild(card);
    });

    contentArea.innerHTML = '';
    contentArea.appendChild(header);
    contentArea.appendChild(grid);
}
