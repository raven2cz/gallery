
export const state = {
    config: null,
    albums: {}, // Cache for loaded album manifests
    currentAlbumId: null,
    currentImageIndex: 0,

    // Setters
    setConfig(config) {
        this.config = config;
    },

    setAlbumManifest(id, manifest) {
        this.albums[id] = manifest;
    },

    setCurrentAlbum(id) {
        this.currentAlbumId = id;
    },

    get currentAlbum() {
        if (!this.currentAlbumId || !this.config) return null;
        return this.config.albums.find(a => a.id === this.currentAlbumId);
    },

    get currentManifest() {
        return this.albums[this.currentAlbumId];
    }
};
