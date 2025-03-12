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
    tab: false,
    q: false,  // Quick switch to previous weapon
    f: false,  // Use/Place torch
    
    // Number keys for weapon selection
    '1': false,
    '2': false,
    '3': false
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
        dy: options.dy ?? 0,
        text: options.text ?? '',
        rotation: options.rotation ?? 0
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

// Get player's current survival time in formatted string
function getPlayerSurvivalTime() {
    const currentTime = performance.now();
    const survivalTimeMs = currentTime - player.gameStartTime;
    
    // Convert to seconds
    let seconds = Math.floor(survivalTimeMs / 1000);
    
    // Calculate minutes and hours
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    
    // Format the string
    let timeString = '';
    if (hours > 0) {
        timeString += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
        timeString += `${minutes}m `;
    }
    timeString += `${seconds}s`;
    
    return timeString;
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

// Draw a dashed line
function drawDashedLine(fromX, fromY, toX, toY, dashSize = 5, gapSize = 5) {
    ctx.beginPath();
    
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dashCount = Math.floor(distance / (dashSize + gapSize));
    
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    let x = fromX;
    let y = fromY;
    
    ctx.moveTo(fromX, fromY);
    
    for (let i = 0; i < dashCount; i++) {
        x += unitX * dashSize;
        y += unitY * dashSize;
        ctx.lineTo(x, y);
        
        x += unitX * gapSize;
        y += unitY * gapSize;
        ctx.moveTo(x, y);
    }
    
    ctx.stroke();
}

// Update visual effects
function updateEffects(deltaTime) {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        
        // Update lifetime
        effect.timeAlive += deltaTime;
        
        // Remove effects that have expired
        if (effect.timeAlive >= effect.duration) {
            effects.splice(i, 1);
            continue;
        }
        
        // Update position for moving effects
        if (effect.dx || effect.dy) {
            effect.x += effect.dx * deltaTime;
            effect.y += effect.dy * deltaTime;
        }
        
        // Special updates for specific effect types
        if (effect.type === 'floatingText') {
            // Make text float upward slower over time
            effect.dy = -30 * (1 - effect.timeAlive / effect.duration);
        } else if (effect.type === 'treasureParticle') {
            // Add gravity to particles
            effect.dy += 50 * deltaTime;
        }
    }
}

// Draw visual effects
function drawEffects() {
    for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        
        // Convert to screen coordinates
        const screenX = effect.x - cameraX;
        const screenY = effect.y - cameraY;
        
        // Only draw if on screen (with padding)
        if (screenX >= -50 && screenX <= canvas.width + 50 &&
            screenY >= -50 && screenY <= canvas.height + 50) {
            
            const progress = effect.timeAlive / effect.duration;
            
            if (effect.type === 'muzzleFlash') {
                effect.opacity = 1 - progress;
                
                ctx.fillStyle = effect.color || `rgba(255, 200, 0, ${effect.opacity})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'blood') {
                effect.opacity = 1 - progress;
                
                ctx.fillStyle = `rgba(255, 0, 0, ${effect.opacity})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 - progress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'levelUp') {
                // Level up circular wave effect
                ctx.strokeStyle = `rgba(0, 255, 100, ${1 - progress})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress * 3, 0, Math.PI * 2);
                ctx.stroke();
                
                // Second wave
                ctx.strokeStyle = `rgba(0, 200, 255, ${1 - progress})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress * 2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner glow
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 - progress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'critText') {
                // Critical hit text indicator
                ctx.font = `${20 - progress * 5}px Orbitron`;
                ctx.fillStyle = `rgba(255, 50, 0, ${1 - progress})`;
                ctx.textAlign = 'center';
                ctx.fillText('CRITICAL!', screenX, screenY - 10 - progress * 20);
            } else if (effect.type === 'sectionClear') {
                // Section clear wave effect
                ctx.strokeStyle = `rgba(0, 200, 255, ${0.7 - progress * 0.7})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress * 2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Add inner pulse
                ctx.fillStyle = `rgba(0, 200, 255, ${0.3 - progress * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'territoryClaim') {
                // Territory claim effect - expanding circle with pulse
                const pulseIntensity = Math.sin(progress * Math.PI * 6) * (1 - progress) * 0.3 + 0.7;
                
                ctx.strokeStyle = `rgba(0, 255, 100, ${pulseIntensity - progress * 0.7})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress * 2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner fill
                ctx.fillStyle = `rgba(0, 255, 100, ${0.2 - progress * 0.2})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress * 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'torch') {
                // Torch effect - persistent flame
                const time = performance.now() / 200;
                const flameHeight = 10 + Math.sin(time) * 3;
                
                // Draw torch stick
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(screenX - 2, screenY, 4, 15);
                
                // Draw torch head
                ctx.fillStyle = '#A0522D';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw flame
                const gradient = ctx.createRadialGradient(
                    screenX, screenY - 5, 2,
                    screenX, screenY - 5, flameHeight
                );
                gradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
                gradient.addColorStop(0.4, 'rgba(255, 165, 0, 0.7)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY - 5, flameHeight, 0, Math.PI * 2);
                ctx.fill();
                
                // Light radius
                ctx.fillStyle = `rgba(255, 200, 0, ${0.05 + Math.sin(time) * 0.02})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, CONFIG.TERRITORY.TORCH_LIGHT_RADIUS * (0.8 + Math.sin(time * 0.5) * 0.2), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'torchActivate') {
                // Torch activation pulse
                ctx.fillStyle = `rgba(255, 200, 0, ${0.5 - progress * 0.5})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'territoryDamage') {
                // Territory damage effect on zombies
                ctx.strokeStyle = `rgba(0, 255, 100, ${1 - progress})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 + progress), 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            } else if (effect.type === 'homeDamage') {
                // Home zone damage effect on zombies - stronger
                ctx.strokeStyle = `rgba(255, 215, 0, ${1 - progress})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 + progress), 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Inner glow
                ctx.fillStyle = `rgba(255, 215, 0, ${0.3 - progress * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 + progress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'treasureChest') {
                // Persistent treasure chest
                drawTreasureChest(screenX, screenY);
            } else if (effect.type === 'treasureOpen') {
                // Treasure chest opening effect
                ctx.fillStyle = `rgba(255, 215, 0, ${0.5 - progress * 0.5})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'treasureParticle') {
                // Treasure particle (flying gold/items)
                ctx.fillStyle = effect.color || '#FFD700';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 4 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'floatingText') {
                // Floating text effect
                ctx.font = `${16 * (1 - progress * 0.5)}px Orbitron`;
                ctx.fillStyle = effect.color || `rgba(255, 255, 255, ${1 - progress})`;
                ctx.textAlign = 'center';
                ctx.fillText(effect.text, screenX, screenY);
            } else if (effect.type === 'evolution') {
                // Evolution effect on zombies
                const progress = effect.timeAlive / effect.duration;
                const color = effect.color || '#FF0000';
                
                ctx.strokeStyle = `${color}`;
                ctx.lineWidth = 3 * (1 - progress);
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 + progress), 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Add inner glow
                ctx.fillStyle = `${color.replace(')', ', ' + (0.3 - progress * 0.3) + ')')}`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 + progress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            }
            else if (effect.type === 'evolutionWave') {
                // Global evolution wave
                const progress = effect.timeAlive / effect.duration;
                const color = effect.color || '#FF0000';
                
                ctx.strokeStyle = `${color.replace(')', ', ' + (0.8 - progress * 0.8) + ')')}`;
                ctx.lineWidth = 5 * (1 - progress);
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            else if (effect.type === 'chestDisappear') {
                // Hiệu ứng phân rã của rương kho báu
                const fadeProgress = effect.timeAlive / effect.duration;
                
                // Vẽ particle biến mất
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const distance = effect.radius * fadeProgress;
                    const particleX = screenX + Math.cos(angle) * distance;
                    const particleY = screenY + Math.sin(angle) * distance;
                    
                    const particleSize = (1 - fadeProgress) * 8;
                    
                    ctx.fillStyle = effect.color || 'rgba(255, 215, 0, ' + (1 - fadeProgress) + ')';
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Vẽ hiệu ứng mờ dần ở trung tâm
                ctx.fillStyle = `rgba(255, 215, 0, ${0.5 * (1 - fadeProgress)})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * (1 - fadeProgress), 0, Math.PI * 2);
                ctx.fill();
            }
            else if (effect.type === 'pickup') {
                // Pickup attraction effect
                const progress = effect.timeAlive / effect.duration;
                
                ctx.fillStyle = effect.color || `rgba(255, 255, 255, ${(1 - progress) * effect.opacity})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 2 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            }
            else if (effect.type === 'ring') {
                // Hiệu ứng vòng tròn mở rộng
                const progress = effect.timeAlive / effect.duration;
                const ringThickness = 5 * (1 - progress);
                
                ctx.strokeStyle = effect.color || `rgba(255, 255, 255, ${1 - progress})`;
                ctx.lineWidth = ringThickness;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * progress, 0, Math.PI * 2);
                ctx.stroke();
            }
            else if (effect.type === 'ammoBox') {
                // Hiệu ứng hộp đạn
                const progress = effect.timeAlive / effect.duration;
                const size = 10 * (1 - progress * 0.5);
                
                // Hoạt ảnh nổi lên
                const floatY = Math.sin(effect.timeAlive * 5) * 3;
                
                // Vẽ hộp đạn
                ctx.fillStyle = effect.color || `rgba(255, 221, 0, ${1 - progress})`;
                ctx.fillRect(screenX - size/2, screenY - size/2 + floatY, size, size);
                
                // Vẽ chi tiết
                ctx.fillStyle = `rgba(50, 50, 50, ${1 - progress})`;
                ctx.fillRect(screenX - size/3, screenY - size/4 + floatY, size * 2/3, size/2);
            }
            else if (effect.type === 'pickup') {
                // Hiệu ứng hút vật phẩm
                const progress = effect.timeAlive / effect.duration;
                
                ctx.fillStyle = effect.color || `rgba(255, 255, 255, ${(1 - progress) * effect.opacity})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 2 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            }
            else if (effect.type === 'critHit') {
                // Hiệu ứng đòn chí mạng lấp lánh
                const progress = effect.timeAlive / effect.duration;
                const size = effect.radius * (1 - progress * 0.7);
                
                // Vẽ ngôi sao hoặc tia sáng
                ctx.fillStyle = effect.color || `rgba(255, 215, 0, ${1 - progress})`;
                
                // Vẽ ngôi sao
                const spikes = 5;
                const outerRadius = size;
                const innerRadius = size * 0.4;
                
                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI / spikes) * i;
                    
                    if (i === 0) {
                        ctx.moveTo(screenX + Math.cos(angle) * radius, screenY + Math.sin(angle) * radius);
                    } else {
                        ctx.lineTo(screenX + Math.cos(angle) * radius, screenY + Math.sin(angle) * radius);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                // Thêm hiệu ứng lấp lánh
                ctx.globalAlpha = 0.7 * (1 - progress);
                const gradient = ctx.createRadialGradient(
                    screenX, screenY, 0,
                    screenX, screenY, size * 1.5
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
            else if (effect.type === 'healthPulse') {
                // Hiệu ứng nhịp tim khi tăng máu
                const progress = effect.timeAlive / effect.duration;
                const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.2 * (1 - progress);
                
                ctx.fillStyle = effect.color || `rgba(255, 0, 0, ${0.3 * (1 - progress)})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                // Thêm đường viền
                ctx.strokeStyle = `rgba(255, 100, 100, ${0.5 * (1 - progress)})`;
                ctx.lineWidth = 3 * (1 - progress);
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius * pulseScale, 0, Math.PI * 2);
                ctx.stroke();
            }
            else if (effect.type === 'floatingHeart') {
                // Hiệu ứng trái tim nổi lên
                const progress = effect.timeAlive / effect.duration;
                
                // Di chuyển lên trên
                const offsetY = effect.dy * progress;
                
                // Làm mờ dần
                ctx.globalAlpha = 1 - progress;
                
                // Kích thước nhịp nhàng
                const scale = 1 + Math.sin(progress * Math.PI * 6) * 0.2;
                
                // Vẽ biểu tượng trái tim hoặc văn bản
                ctx.font = `${Math.round(20 * scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(effect.text, screenX, screenY + offsetY);
                
                ctx.globalAlpha = 1.0;
            }
            else if (effect.type === 'speedLines') {
                // Hiệu ứng đường chạy tốc độ
                const progress = effect.timeAlive / effect.duration;
                const angle = effect.angle || 0;
                
                const lineLength = effect.radius * (1 - progress * 0.5);
                const fadeStart = lineLength * 0.7;
                
                // Vẽ đường chạy từ tâm ra ngoài
                ctx.strokeStyle = effect.color || `rgba(0, 191, 255, ${0.5 * (1 - progress)})`;
                ctx.lineWidth = 2 * (1 - progress);
                
                // Tạo gradient mờ dần
                const gradient = ctx.createLinearGradient(
                    screenX, screenY,
                    screenX + Math.cos(angle) * lineLength,
                    screenY + Math.sin(angle) * lineLength
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(0.2, effect.color || `rgba(0, 191, 255, ${0.8 * (1 - progress)})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.strokeStyle = gradient;
                
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(
                    screenX + Math.cos(angle) * lineLength,
                    screenY + Math.sin(angle) * lineLength
                );
                ctx.stroke();
            }
            else if (effect.type === 'movingPickup') {
                // Hiệu ứng vật phẩm di chuyển về người chơi
                const progress = effect.timeAlive / effect.duration;
                
                // Tính toán vị trí hiện tại dựa trên vị trí ban đầu và đích đến
                const currentX = screenX + (effect.targetX - effect.x + cameraX) * progress;
                const currentY = screenY + (effect.targetY - effect.y + cameraY) * progress;
                
                // Kích thước nhỏ dần khi đến gần người chơi
                const size = 5 * (1 - progress * 0.5);
                
                // Vẽ vật phẩm
                ctx.fillStyle = effect.color || '#FFFFFF';
                ctx.beginPath();
                ctx.arc(currentX, currentY, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Thêm đuôi mờ dần
                for (let i = 1; i <= 3; i++) {
                    const trailProgress = Math.max(0, progress - i * 0.05);
                    if (trailProgress <= 0) continue;
                    
                    const trailX = screenX + (effect.targetX - effect.x + cameraX) * trailProgress;
                    const trailY = screenY + (effect.targetY - effect.y + cameraY) * trailProgress;
                    
                    ctx.globalAlpha = 0.3 * (1 - i/3);
                    ctx.beginPath();
                    ctx.arc(trailX, trailY, size * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.globalAlpha = 1.0;
            }
        }
    }
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
                    
                    // Ensure we wait for DOM to be fully ready
                    if (document.readyState === 'complete' || document.readyState === 'interactive') {
                        initGame();
                    } else {
                        window.addEventListener('DOMContentLoaded', initGame);
                    }
                }, 500);
            }, 500);
        }
        
        if (loadingBar) {
            loadingBar.style.width = `${progress}%`;
        }
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
            if (gameRunning) openUpgradeMenu();
            break;
        case 'q':
            keys.q = true;
            if (gameRunning) switchToPreviousWeapon();
            break;
        case 'f':
            keys.f = true;
            if (gameRunning) placeTorch();
            break;
        // Number keys for weapon selection
        case '1': case '2': case '3': case '4': case '5':
            const index = parseInt(e.key) - 1;
            keys[e.key] = true;
            if (gameRunning && player.equippedWeapons.length > index) {
                switchWeapon(player.equippedWeapons[index]);
            }
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
        case 'q': keys.q = false; break;
        case 'f': keys.f = false; break;
        case '1': keys['1'] = false; break;
        case '2': keys['2'] = false; break;
        case '3': keys['3'] = false; break;
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

function handleMouseWheel(e) {
    // Scroll through weapons
    if (gameRunning) {
        if (e.deltaY < 0) {
            // Scroll up - previous weapon
            switchToPreviousWeapon();
        } else {
            // Scroll down - next weapon
            switchToNextWeapon();
        }
    }
    
    // Prevent default scrolling
    e.preventDefault();
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
                    'floatingText', 
                    { 
                        text: bullet.damage.toFixed(0),
                        color: bullet.isCritical ? '#FF4500' : '#FFFFFF'
                    }
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
    
    // Check player-pickup collisions
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + pickup.radius) {
            // Player collected the pickup
            if (pickup.type === 'health') {
                player.health = Math.min(player.health + pickup.value, player.maxHealth);
                showGameMessage("+20 Health");
            } else if (pickup.type === 'ammo') {
                // Add ammo to current weapon's reserves
                if (player.weapon && player.weapon.ammoType) {
                    const ammoType = player.weapon.ammoType;
                    const packSize = CONFIG.AMMO_TYPES[ammoType].packSize;
                    
                    addAmmunition(ammoType, packSize);
                    showGameMessage(`+${packSize} ${CONFIG.AMMO_TYPES[ammoType].name}`);
                }
            } else if (pickup.type === 'coins') {
                player.coins += pickup.value;
                showGameMessage(`+${pickup.value} Coins`);
            } else if (pickup.type === 'armor') {
                player.armor = Math.min(player.armor + pickup.value, player.maxArmor);
                showGameMessage("+15 Armor");
            } else if (pickup.type === 'torch') {
                addTorches(pickup.value);
                showGameMessage(`+${pickup.value} Torch${pickup.value > 1 ? 'es' : ''}`);
            }
            
            // Add pickup effect
            createEffect(
                pickup.x,
                pickup.y,
                20,
                0.3,
                'pickup'
            );
            
            // Remove pickup
            pickups.splice(i, 1);
            
            // Update UI
            updateUI();
        }
    }
    
    // Check for treasure chest interactions
    checkTreasureChestInteraction();
}

// Check all territory effects
function checkAllTerritoryEffects() {
    // First check player's territory status
    checkTerritoryEffects();
    
    // Check zombies in territory (damage over time, etc)
    // This is now handled in updateZombies()
}

// Restart the game
function restartGame() {
    // Reset game state
    zombies.length = 0;
    bullets.length = 0;
    effects.length = 0;
    pickups.length = 0;
    
    // Initialize player and game components
    initGame();
    
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    
    // Start the game
    gameRunning = true;
}

function attractPickups(deltaTime) {
    // Skip if player reference is not available yet
    if (!player) return;
    
    // Calculate the actual attraction range
    const attractionRange = player.pickupAttractionRange * player.pickupAttractionMultiplier;
    
    // Check all pickups
    for (let i = 0; i < pickups.length; i++) {
        const pickup = pickups[i];
        
        // Calculate distance to player
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If pickup is within attraction range, move it toward the player
        if (distance < attractionRange) {
            // Calculate attraction strength (stronger when closer)
            const attractionStrength = 1 - (distance / attractionRange);
            
            // Tăng tốc độ bay lên gấp đôi (tăng từ 300 lên 600)
            const speed = 600 * attractionStrength; // Tăng tốc độ di chuyển
            
            // Move the pickup toward the player
            const directionX = dx / distance;
            const directionY = dy / distance;
            
            pickup.x += directionX * speed * deltaTime;
            pickup.y += directionY * speed * deltaTime;
            
            // Add a visual trail effect for attracted pickups
            if (Math.random() < 0.2) { // Only create effect occasionally to avoid too many effects
                createEffect(
                    pickup.x, 
                    pickup.y, 
                    3, // Small radius
                    0.3, // Short duration
                    'pickup', // Effect type
                    {
                        color: pickup.color || '#FFFFFF',
                        opacity: 0.5
                    }
                );
            }
        }
    }
}