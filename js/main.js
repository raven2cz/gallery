import { fetchJSON } from './utils.js';
import { state } from './state.js';
import { renderAlbumList, renderAlbumDetail } from './view.js';

// Initialization
async function init() {
    const config = await fetchJSON('config.json');
    if (!config) {
        document.body.innerHTML = '<h1>Error loading configuration</h1>';
        return;
    }

    state.setConfig(config);
    document.getElementById('site-title').textContent = config.siteTitle;

    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Initial load
}

async function handleRoute() {
    const hash = window.location.hash;

    if (hash.startsWith('#album/')) {
        const albumId = hash.split('/')[1];
        await loadAlbum(albumId);
    } else {
        renderAlbumList();
    }
}

async function loadAlbum(albumId) {
    state.setCurrentAlbum(albumId);

    // Check if manifest already loaded
    if (!state.albums[albumId]) {
        const albumConfig = state.config.albums.find(a => a.id === albumId);
        if (albumConfig) {
            const manifest = await fetchJSON(`${albumConfig.path}/manifest.json`);
            if (manifest) {
                state.setAlbumManifest(albumId, manifest);
            }
        }
    }

    renderAlbumDetail(albumId);
}

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxDesc = document.getElementById('lightbox-desc');

export function openLightbox(index) {
    state.currentImageIndex = index;
    updateLightbox();
    lightbox.classList.remove('hidden');
    // slight delay to allow display:block to apply before opacity transition
    requestAnimationFrame(() => lightbox.classList.add('active'));
}

function closeLightbox() {
    lightbox.classList.remove('active');
    const video = document.getElementById('lightbox-video');
    if (video) {
        video.pause();
    }
    setTimeout(() => lightbox.classList.add('hidden'), 300);
}

function updateLightbox() {
    resetZoom();
    const manifest = state.currentManifest;
    if (!manifest) return;

    const imgData = manifest.images[state.currentImageIndex];
    const albumPath = state.currentAlbum.path;

    const isVideo = imgData.filename.toLowerCase().endsWith('.mp4') || imgData.filename.toLowerCase().endsWith('.webm');

    if (isVideo) {
        lightboxImg.style.display = 'none';
        let lightboxVideo = document.getElementById('lightbox-video');
        if (!lightboxVideo) {
            lightboxVideo = document.createElement('video');
            lightboxVideo.id = 'lightbox-video';
            lightboxVideo.controls = true;
            lightboxVideo.autoplay = true;
            lightboxVideo.style.maxWidth = '100%';
            lightboxVideo.style.maxHeight = '80vh';
            lightboxVideo.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)';
            lightboxImg.parentNode.insertBefore(lightboxVideo, lightboxImg.nextSibling);
        }
        lightboxVideo.style.display = 'block';
        lightboxVideo.src = `${albumPath}/${imgData.filename}`;
    } else {
        const video = document.getElementById('lightbox-video');
        if (video) {
            video.style.display = 'none';
            video.pause();
            video.src = '';
        }
        lightboxImg.style.display = 'block';
        lightboxImg.src = `${albumPath}/${imgData.filename}`;
    }

    lightboxTitle.textContent = imgData.title;
    lightboxDesc.textContent = imgData.description || '';
}

function nextImage(e) {
    if (e) e.stopPropagation();
    const manifest = state.currentManifest;
    if (!manifest) return;

    state.currentImageIndex = (state.currentImageIndex + 1) % manifest.images.length;
    updateLightbox();
}

function prevImage(e) {
    if (e) e.stopPropagation();
    const manifest = state.currentManifest;
    if (!manifest) return;

    state.currentImageIndex = (state.currentImageIndex - 1 + manifest.images.length) % manifest.images.length;
    updateLightbox();
}

// Zoom Logic
let zoomState = {
    scale: 1,
    panning: false,
    pointX: 0,
    pointY: 0,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0
};

function resetZoom() {
    zoomState = { scale: 1, panning: false, pointX: 0, pointY: 0, startX: 0, startY: 0, translateX: 0, translateY: 0 };
    updateTransform();
}

function updateTransform() {
    const transform = `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`;
    lightboxImg.style.transform = transform;
    const video = document.getElementById('lightbox-video');
    if (video) video.style.transform = transform;
}

lightbox.addEventListener('wheel', (e) => {
    e.preventDefault();

    const xs = (e.clientX - window.innerWidth / 2 - zoomState.translateX) / zoomState.scale;
    const ys = (e.clientY - window.innerHeight / 2 - zoomState.translateY) / zoomState.scale;

    const delta = -e.deltaY;

    // Determine new scale
    let newScale = zoomState.scale + (delta * 0.001 * zoomState.scale);
    newScale = Math.min(Math.max(1, newScale), 10); // Clamp scale between 1x and 10x

    // Adjust position to keep point under cursor stable
    if (newScale > 1) {
        zoomState.translateX += (e.clientX - window.innerWidth / 2 - zoomState.translateX) * (1 - newScale / zoomState.scale);
        zoomState.translateY += (e.clientY - window.innerHeight / 2 - zoomState.translateY) * (1 - newScale / zoomState.scale);
    } else {
        zoomState.translateX = 0;
        zoomState.translateY = 0;
    }

    zoomState.scale = newScale;
    updateTransform();
}, { passive: false });

// Pan logic (optional but good for UX when zoomed)
lightbox.addEventListener('mousedown', (e) => {
    if (zoomState.scale > 1) {
        zoomState.panning = true;
        zoomState.startX = e.clientX - zoomState.translateX;
        zoomState.startY = e.clientY - zoomState.translateY;
        e.preventDefault(); // Prevent text selection
    }
});

lightbox.addEventListener('mousemove', (e) => {
    if (!zoomState.panning) return;
    e.preventDefault();
    zoomState.translateX = e.clientX - zoomState.startX;
    zoomState.translateY = e.clientY - zoomState.startY;
    updateTransform();
});

lightbox.addEventListener('mouseup', () => { zoomState.panning = false; });
lightbox.addEventListener('mouseleave', () => { zoomState.panning = false; });


// Event Listeners
document.getElementById('lightbox-close').onclick = closeLightbox;
document.getElementById('lightbox-next').onclick = nextImage;
document.getElementById('lightbox-prev').onclick = prevImage;
document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    // Reset zoom on navigation
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') resetZoom();
});

// Expose for view.js to call (module scope issue in view.js handled with import, but for simplicity we can attach to window or re-export)
// Actually in view.js I used dynamic import which works.

init();
