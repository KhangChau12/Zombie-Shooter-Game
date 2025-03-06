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

// Handle keyboard events
function handleKeyDown(e) {
    switch(e.key.toLowerCase()) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
        case 'r': keys.r = true; break;
        case ' ': keys.space = true; break;
        case 'e': 
            keys.e = true; 
            if (gameRunning) openShop();
            break;
        case 'tab': 
            keys.tab = true; 
            e.preventDefault(); // Prevent tab from changing focus
            if (gameRunning) openWeaponUpgradeMenu();
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
        case 'r': keys.r = false; break;
        case ' ': keys.space = false; break;
        case 'e': keys.e = false; break;
        case 'tab': keys.tab = false; break;
    }
}

// Handle mouse events
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Update player rotation to face mouse
    const worldMouseX = mouseX + cameraX;
    const worldMouseY = mouseY + cameraY;
    player.rotation = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
}

function handleMouseDown(e) {
    mouseDown = true;
}

function handleMouseUp(e) {
    mouseDown = false;
}

function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Check collisions between all game entities
function checkCollisions() {
    // Check bullet-zombie collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = zombies.length - 1; j >= 0; j--) {
            const zombie = zombies[j];
            
            const dx = zombie.x - bullet.x;
            const dy = zombie.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < zombie.radius + bullet.radius) {
                // Zombie hit by bullet
                
                // Create hit effect
                createEffect(
                    bullet.x, 
                    bullet.y, 
                    10, // Radius
                    0.2, // Duration
                    'blood'
                );
                
                // Apply damage
                const killed = damageZombie(zombie, bullet.damage);
                
                // Show damage number
                createEffect(
                    bullet.x, 
                    bullet.y, 
                    15, // Radius
                    0.7, // Duration
                    'critText', 
                    { text: bullet.damage.toFixed(0) }
                );
                
                // Remove bullet
                bullets.splice(i, 1);
                
                // No need to check this bullet against other zombies
                break;
            }
        }
    }
    
    // Check player-zombie collisions
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + zombie.radius) {
            // Player hit by zombie
            damagePlayer(zombie.damage);
            
            // Knockback player away from zombie
            player.x += dx * 0.2;
            player.y += dy * 0.2;
            
            // Also knockback zombie slightly
            zombie.x -= dx * 0.1;
            zombie.y -= dy * 0.1;
        }
    }
}

// Đảm bảo hàm restartGame được định nghĩa
function restartGame() {
    // Reset game state
    zombies.length = 0;
    bullets.length = 0;
    effects.length = 0;
    pickups.length = 0;
    
    // Khởi tạo lại player và các thành phần game
    initGame();
    
    // Ẩn màn hình game over
    document.getElementById('gameOver').style.display = 'none';
    
    // Kích hoạt game
    gameRunning = true;
}