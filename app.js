(function() {
    'use strict';

    // Configuration
    const TEST_MODE = true; // Set to false for production (loads 01.mp4-16.mp4)
    const START_PAUSED = true; // Set to true to start directly in player view paused
    const TILES_COUNT = 16;
    const GRID_COLUMNS = 7;
    const GRID_ROWS = 3;
    const PAUSE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
    const CURSOR_HIDE_MS = 3 * 1000; // 3 seconds

    // DOM Elements
    const indexView = document.getElementById('index-view');
    const playerView = document.getElementById('player-view');
    const tileGrid = document.getElementById('tile-grid');
    const videoPlayer = document.getElementById('video-player');
    const playerTile = document.getElementById('player-tile');
    const controlsOverlay = document.getElementById('controls-overlay');
    const closeButton = document.getElementById('close-button');
    const playButton = document.getElementById('play-button');
    const scrubBar = document.getElementById('scrub-bar');
    const scrubHandle = document.getElementById('scrub-handle');
    const timeDisplay = document.getElementById('time-display');

    // State
    let currentTileIndex = null;
    let pauseTimeoutId = null;
    let isDragging = false;
    let cursorTimeoutId = null;

    // Initialize the application
    function init() {
        createTileGrid();
        setupEventListeners();

        if (START_PAUSED) {
            startPaused();
        }
    }

    // Start directly in player view paused (for testing)
    function startPaused() {
        currentTileIndex = 1;
        const tileNumber = '01';

        // Set video source
        videoPlayer.src = TEST_MODE ? 'assets/videos/test.mp4' : `assets/videos/${tileNumber}.mp4`;

        // Set white tile thumbnail
        playerTile.innerHTML = `<img src="assets/tiles-x2/${tileNumber} weiss.png" alt="Tile ${tileNumber}">`;

        // Switch to player view
        indexView.classList.remove('active');
        playerView.classList.add('active');

        // Show controls (paused state)
        controlsOverlay.classList.add('visible');
    }

    // Create the tile grid
    function createTileGrid() {
        for (let i = 0; i < TILES_COUNT; i++) {
            const tileIndex = i + 1;
            const tileNumber = String(tileIndex).padStart(2, '0');

            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.index = tileIndex;

            const img = document.createElement('img');
            img.src = `assets/tiles-x2/${tileNumber}.png`;
            img.alt = `Tile ${tileNumber}`;

            tile.appendChild(img);
            tile.addEventListener('click', () => playVideo(tileIndex));

            tileGrid.appendChild(tile);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Video events
        videoPlayer.addEventListener('ended', goToIndex);
        videoPlayer.addEventListener('timeupdate', updateScrubber);

        // Player view click (toggle controls)
        playerView.addEventListener('click', handlePlayerClick);

        // Control buttons
        closeButton.addEventListener('click', handleCloseClick);
        playButton.addEventListener('click', handlePlayClick);

        // Scrubbing
        scrubBar.addEventListener('mousedown', startScrub);
        scrubBar.addEventListener('touchstart', startScrub, { passive: false });
        document.addEventListener('mousemove', handleScrub);
        document.addEventListener('touchmove', handleScrub, { passive: false });
        document.addEventListener('mouseup', endScrub);
        document.addEventListener('touchend', endScrub);

        // Cursor visibility
        document.addEventListener('mousemove', handleCursorVisibility);
        hideCursor(); // Hide cursor initially
    }

    // Play video for a tile
    function playVideo(tileIndex) {
        currentTileIndex = tileIndex;
        const tileNumber = String(tileIndex).padStart(2, '0');

        // Set video source
        videoPlayer.src = TEST_MODE ? 'assets/videos/test.mp4' : `assets/videos/${tileNumber}.mp4`;

        // Set white tile thumbnail
        playerTile.innerHTML = `<img src="assets/tiles-x2/${tileNumber} weiss.png" alt="Tile ${tileNumber}">`;

        // Switch to player view
        indexView.classList.remove('active');
        playerView.classList.add('active');

        // Hide controls and play
        controlsOverlay.classList.remove('visible');
        videoPlayer.play();
        clearPauseTimeout();
    }

    // Go back to index view
    function goToIndex() {
        videoPlayer.pause();
        videoPlayer.src = '';
        currentTileIndex = null;
        clearPauseTimeout();

        playerView.classList.remove('active');
        indexView.classList.add('active');
        controlsOverlay.classList.remove('visible');
    }

    // Handle click on player view
    function handlePlayerClick(e) {
        // Ignore clicks on controls
        if (e.target.closest('.close-button') ||
            e.target.closest('.play-button') ||
            e.target.closest('.scrub-bar') ||
            e.target.closest('.player-tile')) {
            return;
        }

        if (controlsOverlay.classList.contains('visible')) {
            // Controls visible, hide them and play
            controlsOverlay.classList.remove('visible');
            videoPlayer.play();
            clearPauseTimeout();
        } else {
            // Controls hidden, show them and pause
            controlsOverlay.classList.add('visible');
            videoPlayer.pause();
            startPauseTimeout();
        }
    }

    // Handle close button click
    function handleCloseClick(e) {
        e.stopPropagation();
        goToIndex();
    }

    // Handle play button click
    function handlePlayClick(e) {
        e.stopPropagation();
        controlsOverlay.classList.remove('visible');
        videoPlayer.play();
        clearPauseTimeout();
    }

    // Start pause timeout
    function startPauseTimeout() {
        clearPauseTimeout();
        pauseTimeoutId = setTimeout(goToIndex, PAUSE_TIMEOUT_MS);
    }

    // Clear pause timeout
    function clearPauseTimeout() {
        if (pauseTimeoutId) {
            clearTimeout(pauseTimeoutId);
            pauseTimeoutId = null;
        }
    }

    // Update scrubber position
    function updateScrubber() {
        if (!videoPlayer.duration || isDragging) return;

        const progress = videoPlayer.currentTime / videoPlayer.duration;
        const barWidth = scrubBar.offsetWidth;
        scrubHandle.style.left = (progress * barWidth) + 'px';

        // Update time display
        timeDisplay.textContent = formatTime(videoPlayer.currentTime);
    }

    // Format time as HH:MM:SS
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    }

    // Start scrubbing
    function startScrub(e) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        handleScrub(e);
    }

    // Handle scrubbing
    function handleScrub(e) {
        if (!isDragging) return;
        e.preventDefault();

        const rect = scrubBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let x = clientX - rect.left;

        // Clamp to bar bounds
        x = Math.max(0, Math.min(x, rect.width));

        const progress = x / rect.width;
        scrubHandle.style.left = x + 'px';

        if (videoPlayer.duration) {
            videoPlayer.currentTime = progress * videoPlayer.duration;
            timeDisplay.textContent = formatTime(videoPlayer.currentTime);
        }

        // Reset pause timeout during scrubbing
        startPauseTimeout();
    }

    // End scrubbing
    function endScrub() {
        isDragging = false;
    }

    // Handle cursor visibility on mouse move
    function handleCursorVisibility() {
        showCursor();
        clearCursorTimeout();
        cursorTimeoutId = setTimeout(hideCursor, CURSOR_HIDE_MS);
    }

    // Show cursor
    function showCursor() {
        document.body.classList.remove('cursor-hidden');
    }

    // Hide cursor
    function hideCursor() {
        document.body.classList.add('cursor-hidden');
    }

    // Clear cursor timeout
    function clearCursorTimeout() {
        if (cursorTimeoutId) {
            clearTimeout(cursorTimeoutId);
            cursorTimeoutId = null;
        }
    }

    // Start the application
    init();
})();
