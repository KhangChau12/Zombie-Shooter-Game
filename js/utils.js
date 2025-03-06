// Utility functions for the game

// Global variables for game state
let canvas, ctx;
let gameLoop;
let lastTime = 0;
let deltaTime = 0;
let gameRunning = true;

// Camera/Viewport Variables
let cameraX = 0;
let cameraY = 0;

// Input handling
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    r: false,
    space: false,
    e: false,
    tab: false
};

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;

// Game entities
const bullets = [];
const zombies = [];
const effects = [];
const pickups = [];

// Create a bullet with given parameters
function createBullet(x, y, dx, dy, damage, speed, radius, lifetime, isCritical = false) {
    bullets.push({
        x: x,
        y: y,
        dx: dx,
        dy: dy,
        damage: damage,
        speed: speed,
        radius: radius,
        lifetime: lifetime, // seconds
        timeAlive: 0,
        isCritical: isCritical
    });
}

// Create a visual effect
function createEffect(x, y, radius, duration, type, options = {}) {
    effects.push({
        x: x,
        y: y,
        radius: radius,
        opacity: options.opacity ?? 1,
        duration: duration,
        timeAlive: 0,
        type: type,
        color: options.color,
        dx: options.dx ?? 0,
        dy: options.dy ?? 0
    });
}

// Create a screen flash effect (damage, level up, etc.)
function createScreenFlash(type) {
    const flashElement = document.createElement('div');
    flashElement.className = `screen-flash ${type}-flash`;
    document.getElementById('gameContainer').appendChild(flashElement);
    
    // Remove after animation completes
    setTimeout(() => {
        flashElement.remove();
    }, 500);
}

// Create a pickup item
function createPickup(x, y, type, value = 0) {
    const pickupConfig = CONFIG.PICKUP_TYPES[type];
    
    pickups.push({
        x: x,
        y: y,
        radius: pickupConfig.radius,
        type: type,
        value: value || pickupConfig.value,
        color: pickupConfig.color
    });
}

// Show a game message on screen
function showGameMessage(message, duration = 2000) {
    const messagesContainer = document.getElementById('gameMessages');
    if (!messagesContainer) {
        const container = document.createElement('div');
        container.id = 'gameMessages';
        document.getElementById('gameContainer').appendChild(container);
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'game-message';
    messageElement.textContent = message;
    
    document.getElementById('gameMessages').appendChild(messageElement);
    
    // Make visible after a short delay (for CSS transition)
    setTimeout(() => {
        messageElement.classList.add('visible');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        messageElement.classList.remove('visible');
        setTimeout(() => {
            messageElement.remove();
        }, 500);
    }, duration);
}

// Convert world coordinates to screen coordinates
function worldToScreen(x, y) {
    return {
        x: x - cameraX,
        y: y - cameraY
    };
}

// Convert screen coordinates to world coordinates
function screenToWorld(x, y) {
    return {
        x: x + cameraX,
        y: y + cameraY
    };
}

// Check if a point is on screen (with optional padding)
function isOnScreen(x, y, padding = 0) {
    const screen = worldToScreen(x, y);
    return screen.x >= -padding && 
           screen.x <= canvas.width + padding &&
           screen.y >= -padding && 
           screen.y <= canvas.height + padding;
}

// Get a random position around a center point within min/max distance
function getRandomPositionAround(centerX, centerY, minDistance, maxDistance) {
    // Random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Random distance within range
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    
    // Calculate position
    return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance
    };
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Format a number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get angle between two points
function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Format seconds into mm:ss format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Get a color based on difficulty level (green to red gradient)
function getDifficultyColor(difficulty, alpha = 1) {
    // Red increases, green decreases with difficulty
    const r = Math.min(255, difficulty * 25);
    const g = Math.max(0, 255 - difficulty * 25);
    const b = 0;
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Generate a random ID
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

// Load the game with a simple loading screen
function loadGame() {
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loadingScreen';
    loadingScreen.innerHTML = `
        <div class="loading-title">ZOMBIE APOCALYPSE</div>
        <div class="loading-bar-container">
            <div class="loading-bar" id="loadingBar"></div>
        </div>
        <div class="loading-text">Loading game assets...</div>
    `;
    document.body.appendChild(loadingScreen);
    
    // Simulate loading progress
    let progress = 0;
    const loadingBar = document.getElementById('loadingBar');
    
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // Finish loading
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.remove();
                    initGame();
                }, 500);
            }, 500);
        }
        
        loadingBar.style.width = `${progress}%`;
    }, 100);
}