// Main game logic and initialization

// Global variables for zombie evolution system
let zombieEvolutionLevel = 0;
let nextEvolutionTime = 0;
let evolutionTimer = 0;

// Initialize game
function initGame() {
    // Kiểm tra nếu đang ở home screen thì không khởi tạo game
    if (window.homeScreen && window.homeScreen.isActive() && !window.homeScreen.isGameStarted()) {
        return;
    }
    // Get canvas and context
    canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    
    // Set event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleMouseWheel);
    window.addEventListener('resize', handleResize);
    
    // Initialize player
    initPlayer();
    
    // Initialize map
    initMap();
    
    // Initialize UI
    initUI();

    // Create all necessary UI elements
    createUIElements();

    // Update UI
    updateUI();
    
    // Start game loop
    lastTime = performance.now();
    gameLoop = requestAnimationFrame(update);
    
    // Show welcome message
    showGameMessage("Welcome to Zombie Apocalypse!");
    
    // Add a test zombie to verify movement
    setTimeout(() => {
        spawnZombie(player.x + 200, player.y + 200, 1);
        console.log("Test zombie spawned!");
    }, 1000);

    // Initialize zombie evolution
    zombieEvolutionLevel = 0;
    nextEvolutionTime = performance.now() + CONFIG.ZOMBIE_EVOLUTION.EVOLUTION_INTERVAL;
    evolutionTimer = CONFIG.ZOMBIE_EVOLUTION.EVOLUTION_INTERVAL;
}

// Main game loop
function update(currentTime) {
    // Tính toán delta time
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    deltaTime = Math.min(deltaTime, 0.1);
    
    // Nếu đang ở màn hình home, không cần vẽ game
    if (window.homeScreen && window.homeScreen.isActive()) {
        gameLoop = requestAnimationFrame(update);
        return;
    }
        
    if (gameRunning) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update camera position to follow player
        updateCamera();
        
        // Check for new map sections
        checkForNewMapSections();
        
        // Draw background
        drawBackground();
        
        // Handle player input
        handleInput(deltaTime);
        
        // Update entities
        updatePlayer(deltaTime);
        movePlayer(deltaTime);
        updateBullets(deltaTime);
        
        // Update zombies with fixed deltaTime to ensure consistent speed
        const fixedDelta = 1/60; // 60fps fixed
        updateZombies(fixedDelta);
        
        updateEffects(deltaTime);
        updatePickups(deltaTime);
        attractPickups(deltaTime);
        
        // Check all territory effects
        checkAllTerritoryEffects();
        
        // Spawn zombies based on discovered map sections
        spawnZombiesInDiscoveredSections();
        
        // Check collisions
        checkCollisions();
        
        // Draw entities
        drawZombies();
        drawPlayer();
        drawBullets();
        drawEffects();
        drawPickups();
        
        // Draw minimap
        drawMinimap();
        
        // Draw weapon quick selector UI
        drawWeaponSelector();
        
        // Draw torch count indicator
        drawTorchIndicator();
        
        // Draw territory indicator
        if (player.inTerritory || player.inHomeRadius) {
            drawTerritoryIndicator();
        }
        
        updateZombieEvolutionTimer(deltaTime);

        // Draw evolution timer
        drawEvolutionTimer();

        // Draw section clearing progress if player is in an uncleared section
        drawSectionClearingProgress();

        updateEvolutionUI();
    }
    gameLoop = requestAnimationFrame(update);
}

// Update camera position to follow player
function updateCamera() {
    // Calculate target camera position (centered on player)
    const targetCameraX = player.x - canvas.width / 2;
    const targetCameraY = player.y - canvas.height / 2;
    
    // Update camera position with slight smoothing
    cameraX = targetCameraX;
    cameraY = targetCameraY;
}

// Handle player input
function handleInput(deltaTime) {
    // Shooting (already handled in player.js)
    if (mouseDown && !player.reloading) {
        if (player.weapon.automatic) {
            tryShoot();
        } else if (mouseDown && !player.lastMouseDown) {
            tryShoot();
        }
    }
    player.lastMouseDown = mouseDown;
    
    // Manual reload
    if (keys.r && !player.reloading && player.weapon.ammo < player.weapon.maxAmmo) {
        startReload();
    }
    
    // Quick weapon switching with 1-3 keys is handled in keydown event
}

// Update bullets
function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Update position
        bullet.x += bullet.dx * bullet.speed * deltaTime;
        bullet.y += bullet.dy * bullet.speed * deltaTime;
        
        // Update lifetime
        bullet.timeAlive += deltaTime;
        
        // Remove bullets that have been alive too long or are far from camera
        if (bullet.timeAlive >= bullet.lifetime ||
            bullet.x < cameraX - 200 || bullet.x > cameraX + canvas.width + 200 ||
            bullet.y < cameraY - 200 || bullet.y > cameraY + canvas.height + 200) {
            bullets.splice(i, 1);
        }
    }
}

// Draw bullets
function drawBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        
        // Convert to screen coordinates
        const screenX = bullet.x - cameraX;
        const screenY = bullet.y - cameraY;
        
        // Only draw if on screen
        if (screenX >= -bullet.radius && screenX <= canvas.width + bullet.radius &&
            screenY >= -bullet.radius && screenY <= canvas.height + bullet.radius) {
            
            // Draw bullet
            if (bullet.isCritical) {
                // Critical hit - special effect
                ctx.fillStyle = '#FF4500'; // Orange-red
                ctx.beginPath();
                ctx.arc(screenX, screenY, bullet.radius * 1.3, 0, Math.PI * 2);
                ctx.fill();
                
                // Add glow
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(
                    screenX, screenY, 0,
                    screenX, screenY, bullet.radius * 2
                );
                gradient.addColorStop(0, 'rgba(255, 255, 0, 0.7)');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.arc(screenX, screenY, bullet.radius * 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Regular bullet
                ctx.fillStyle = '#FFDD00';
                ctx.beginPath();
                ctx.arc(screenX, screenY, bullet.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Add motion trail
            ctx.strokeStyle = 'rgba(255, 221, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX - bullet.dx * 10, screenY - bullet.dy * 10);
            ctx.stroke();
        }
    }
}

// Update pickups
function updatePickups(deltaTime) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        
        // Add floating animation or other updates if needed
    }
}

// Draw pickups
function drawPickups() {
    for (let i = 0; i < pickups.length; i++) {
        const pickup = pickups[i];
        
        // Convert to screen coordinates
        const screenX = pickup.x - cameraX;
        const screenY = pickup.y - cameraY;
        
        // Only draw if on screen
        if (screenX >= -pickup.radius && screenX <= canvas.width + pickup.radius &&
            screenY >= -pickup.radius && screenY <= canvas.height + pickup.radius) {
            
            // Add floating/pulsing animation
            const floatOffset = Math.sin(performance.now() / 500) * 3;
            const pulseScale = 0.9 + Math.sin(performance.now() / 300) * 0.1;
            
            if (pickup.type === 'health') {
                // Draw health cross
                ctx.fillStyle = pickup.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY + floatOffset, pickup.radius * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(screenX - pickup.radius/2, screenY + floatOffset - 2, pickup.radius, 4);
                ctx.fillRect(screenX - 2, screenY + floatOffset - pickup.radius/2, 4, pickup.radius);
            } else if (pickup.type === 'ammo') {
                // Draw ammo box
                ctx.fillStyle = pickup.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY + floatOffset, pickup.radius * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#222';
                ctx.fillRect(screenX - pickup.radius/2, screenY + floatOffset - pickup.radius/4, pickup.radius, pickup.radius/2);
            } else if (pickup.type === 'coins') {
                // Draw coin with shine
                ctx.fillStyle = pickup.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY + floatOffset, pickup.radius * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                // Shine effect
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 200) * 0.5;
                ctx.beginPath();
                ctx.arc(screenX - pickup.radius/3, screenY + floatOffset - pickup.radius/3, pickup.radius/3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            } else if (pickup.type === 'armor') {
                // Draw armor pickup
                ctx.fillStyle = pickup.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY + floatOffset, pickup.radius * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                // Shield icon
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY + floatOffset - pickup.radius/2);
                ctx.lineTo(screenX - pickup.radius/2, screenY + floatOffset);
                ctx.lineTo(screenX, screenY + floatOffset + pickup.radius/2);
                ctx.lineTo(screenX + pickup.radius/2, screenY + floatOffset);
                ctx.closePath();
                ctx.fill();
            } else if (pickup.type === 'torch') {
                // Draw torch pickup
                ctx.fillStyle = pickup.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY + floatOffset, pickup.radius * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw flame
                const time = performance.now() / 300;
                const flameHeight = 5 + Math.sin(time) * 2;
                
                // Create flame gradient
                const gradient = ctx.createRadialGradient(
                    screenX, screenY + floatOffset - 5, 1,
                    screenX, screenY + floatOffset - 5, flameHeight
                );
                gradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
                gradient.addColorStop(0.6, 'rgba(255, 165, 0, 0.7)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY + floatOffset - 5, flameHeight, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Draw player
function drawPlayer() {
    // Convert player position to screen coordinates
    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;
    
    // Draw player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + player.radius - 5, player.radius * 0.8, player.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player body
    if (player.invincible) {
        // Invincibility flash effect
        const flashRate = Math.floor(performance.now() / 100) % 2 === 0;
        ctx.fillStyle = flashRate ? '#FFFFFF' : '#FF6347';
    } else if (player.inTerritory || player.inHomeRadius) {
        // Territory boost effect
        const pulseRate = Math.sin(performance.now() / 500) * 0.2 + 0.8;
        ctx.fillStyle = player.inHomeRadius ? 
            `rgba(255, 215, 0, ${pulseRate})` : // Gold for home
            `rgba(255, 99, 71, ${pulseRate})`; // Tomato with territory boost
    } else {
        ctx.fillStyle = '#FF6347'; // Regular tomato color
    }
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player direction indicator (gun)
    const gunLength = player.radius * 0.8;
    const gunWidth = 4;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(player.rotation);
    
    // Gun barrel
    ctx.fillStyle = '#333';
    ctx.fillRect(player.radius - 5, -gunWidth/2, gunLength, gunWidth);
    
    // Gun grip
    ctx.fillStyle = '#555';
    ctx.fillRect(player.radius/2 - 3, gunWidth/2, 6, player.radius/2);
    
    ctx.restore();
    
    // Draw reload indicator if reloading
    if (player.reloading) {
        const currentTime = performance.now();
        const reloadProgress = (currentTime - player.reloadStart) / player.weapon.reloadTime;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, player.radius + 5, 0, Math.PI * 2 * reloadProgress);
        ctx.lineTo(screenX, screenY);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING', screenX, screenY - player.radius - 10);
    }
    
    // Draw territory status indicator if in territory
    if (player.inTerritory || player.inHomeRadius) {
        // Draw glowing aura
        const auraSize = player.radius * 1.3;
        const pulseScale = 0.8 + Math.sin(performance.now() / 500) * 0.2;
        
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
            screenX, screenY, player.radius,
            screenX, screenY, auraSize * pulseScale
        );
        
        if (player.inHomeRadius) {
            // Gold aura for home base
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        } else {
            // Green aura for territory
            gradient.addColorStop(0, 'rgba(0, 255, 100, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.arc(screenX, screenY, auraSize * pulseScale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw weapon name and ammo
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    
    // Show active weapon name
    ctx.fillText(player.weapon.name.toUpperCase(), screenX, screenY + player.radius + 15);
    
    // Show ammo count
    const ammoText = `${player.weapon.ammo}/${player.ammunition[player.weapon.ammoType].reserve}`;
    ctx.fillText(ammoText, screenX, screenY + player.radius + 30);

    const attractionRange = player.pickupAttractionRange * player.pickupAttractionMultiplier;
    
    // Hiệu ứng dao động nhẹ
    const pulseScale = 0.9 + Math.sin(performance.now() / 300) * 0.15;
    
    // Vẽ vòng tròn với độ mờ thấp
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, attractionRange * 1.25 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
    
    // Vẽ các chấm nhỏ xung quanh đường tròn
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const numDots = 16;
    for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2 + (performance.now() / 1500);
        const dotX = screenX + Math.cos(angle) * (attractionRange * 1.25 * pulseScale);
        const dotY = screenY + Math.sin(angle) * (attractionRange * 1.25 * pulseScale);
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw weapon selector UI
function drawWeaponSelector() {
    // Function disabled to remove top weapon selector
    return;
}

// Draw torch indicator
function drawTorchIndicator() {
    const padding = 20;
    const iconSize = 30;
    const textOffset = 5;
    
    // Position in the top-right corner
    const x = canvas.width - padding - iconSize;
    const y = padding + iconSize;
    
    // Draw torch icon
    ctx.fillStyle = '#A0522D'; // Brown torch handle
    ctx.fillRect(x - 2, y - iconSize/2, 4, iconSize/2);
    
    // Draw torch head
    ctx.fillStyle = '#FFA500'; // Orange flame
    ctx.beginPath();
    ctx.arc(x, y - iconSize/2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Animate flame
    const time = performance.now() / 200;
    const flameHeight = 10 + Math.sin(time) * 3;
    
    // Create flame gradient
    const gradient = ctx.createRadialGradient(
        x, y - iconSize/2 - 5, 2,
        x, y - iconSize/2 - 5, flameHeight
    );
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 165, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y - iconSize/2 - 5, flameHeight, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw count text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Orbitron';
    ctx.textAlign = 'right';
    ctx.fillText(`${player.torchCount}`, x - iconSize/2 - textOffset, y);
    
    // Draw F key indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Orbitron';
    ctx.fillText('[F]', x - iconSize/2 - textOffset, y + 15);
}

// Draw territory indicator when in territory
function drawTerritoryIndicator() {
    const padding = 20;
    const iconSize = 30;
    
    // Position below the torch indicator
    const x = canvas.width - padding - iconSize;
    const y = padding + iconSize * 3;
    
    // Draw territory icon (shield)
    ctx.beginPath();
    ctx.moveTo(x, y - iconSize);
    ctx.lineTo(x - iconSize/2, y - iconSize/2);
    ctx.lineTo(x - iconSize/2, y + iconSize/2);
    ctx.lineTo(x, y + iconSize/2 + 5);
    ctx.lineTo(x + iconSize/2, y + iconSize/2);
    ctx.lineTo(x + iconSize/2, y - iconSize/2);
    ctx.closePath();
    
    // Fill with pulsing color based on territory type
    const pulseIntensity = Math.sin(performance.now() / 500) * 0.2 + 0.8;
    
    if (player.inHomeRadius) {
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity})`; // Gold for home
    } else {
        ctx.fillStyle = `rgba(0, 255, 100, ${pulseIntensity})`; // Green for territory
    }
    ctx.fill();
    
    // Draw icon border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'right';
    ctx.fillText(player.inHomeRadius ? 'HOME ZONE' : 'TERRITORY', x - iconSize/2 - 5, y);
    
    // Draw effect
    ctx.font = '10px Orbitron';
    ctx.fillText('HEALTH REGEN', x - iconSize/2 - 5, y + 12);
    ctx.fillText('DAMAGE BOOST', x - iconSize/2 - 5, y + 24);
}

// Draw section clearing progress
function drawSectionClearingProgress() {
    // Find current section
    const sectionX = Math.floor(player.x / CONFIG.SECTION_SIZE);
    const sectionY = Math.floor(player.y / CONFIG.SECTION_SIZE);
    
    // Find the section object
    const currentSection = mapSections.find(s => 
        Math.floor(s.x / CONFIG.SECTION_SIZE) === sectionX && 
        Math.floor(s.y / CONFIG.SECTION_SIZE) === sectionY
    );
    
    // Only show progress for uncleared sections with zombies
    if (!currentSection || currentSection.isCleared || currentSection.zombiesTotal === 0) return;
    
    // Calculate progress
    const progress = ((currentSection.zombiesTotal - currentSection.zombiesRemaining) / currentSection.zombiesTotal) * 100;
    
    // Draw progress bar in the bottom-right corner
    const barWidth = 250; // Tăng kích thước từ 180 lên 250
    const barHeight = 15;
    const padding = 20;
    const barX = canvas.width - barWidth - padding;
    const barY = canvas.height - barHeight - padding - 50; // Position above the weapon bar
    
    // Draw background container
    ctx.fillStyle = 'rgba(10, 20, 35, 0.75)';
    ctx.strokeStyle = 'rgba(80, 130, 170, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(barX - 10, barY - 30, barWidth + 20, barHeight + 45, 8); // Tăng chiều cao container
    ctx.fill();
    ctx.stroke();
    
    // Draw title text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(
        `SECTION CLEARING: ${Math.floor(progress)}%`, 
        barX + barWidth / 2, 
        barY - 10
    );
    
    // Draw background
    ctx.fillStyle = 'rgba(50, 50, 70, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.fill();
    ctx.stroke();
    
    // Draw progress with gradient
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, 'rgba(255, 118, 118, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 75, 75, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * (progress / 100), barHeight, 5);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * (progress / 100), barHeight, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw zombies remaining - Sử dụng text container rộng hơn
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(
        `${currentSection.zombiesRemaining}/${currentSection.zombiesTotal} zombies remaining`, 
        barX + barWidth / 2, 
        barY + barHeight + 15
    );
}

// Update the zombie evolution timer
function updateZombieEvolutionTimer(deltaTime) {
    const currentTime = performance.now();
    
    // Update time remaining
    evolutionTimer = Math.max(0, nextEvolutionTime - currentTime);
    
    // Check if it's time for evolution
    if (currentTime >= nextEvolutionTime && 
        zombieEvolutionLevel < CONFIG.ZOMBIE_EVOLUTION.MAX_EVOLUTIONS) {
        
        // Increase zombie power
        zombieEvolutionLevel++;
        
        // Set next evolution time
        nextEvolutionTime = currentTime + CONFIG.ZOMBIE_EVOLUTION.EVOLUTION_INTERVAL;
        evolutionTimer = CONFIG.ZOMBIE_EVOLUTION.EVOLUTION_INTERVAL;
        
        // Create evolution effect
        triggerEvolutionEffect();
        
        // Show message
        showGameMessage(`ZOMBIES EVOLVED (Tier ${zombieEvolutionLevel})! +5% to all stats`);
    }
}

// Create visual effect for evolution
function triggerEvolutionEffect() {
    // Create screen flash
    createScreenFlash('evolution');
    
    // Show announcement
    showEvolutionAnnouncement();
    
    // Create wave effect at all zombie locations
    zombies.forEach(zombie => {
        createEffect(
            zombie.x,
            zombie.y,
            zombie.radius * 2,
            1.2, // duration
            'evolution',
            {
                color: getEvolutionColor(zombieEvolutionLevel)
            }
        );
    });
    
    // Add global wave
    createEffect(
        player.x,
        player.y,
        500, // radius
        2.5, // duration
        'evolutionWave',
        {
            color: getEvolutionColor(zombieEvolutionLevel)
        }
    );
    
    // Create floating texts around screen edges
    const edgePositions = [
        { x: canvas.width * 0.2, y: canvas.height * 0.2 },
        { x: canvas.width * 0.8, y: canvas.height * 0.2 },
        { x: canvas.width * 0.2, y: canvas.height * 0.8 },
        { x: canvas.width * 0.8, y: canvas.height * 0.8 },
        { x: canvas.width * 0.5, y: canvas.height * 0.2 },
        { x: canvas.width * 0.5, y: canvas.height * 0.8 }
    ];
    
    // Convert to world coordinates
    const worldPositions = edgePositions.map(pos => {
        return {
            x: pos.x + cameraX,
            y: pos.y + cameraY
        };
    });
    
    // Create floating text at each position
    worldPositions.forEach(pos => {
        createFloatingText(
            pos.x,
            pos.y,
            "+5% ZOMBIE POWER",
            getEvolutionColor(zombieEvolutionLevel),
            2
        );
    });
    
    // Play evolution sound when ready
    // playSound('zombieEvolution');
}

// Get color based on evolution level
function getEvolutionColor(level) {
    if (level === 0) return '#FFFFFF';
    
    // Use the colors array to cycle through colors as levels increase
    const colorIndex = (level - 1) % CONFIG.ZOMBIE_EVOLUTION.COLORS.length;
    return CONFIG.ZOMBIE_EVOLUTION.COLORS[colorIndex];
}

// Draw the evolution timer
function drawEvolutionTimer() {
    // Position at top center
    const x = canvas.width / 2;
    const y = 25; // Moved up from 60 to 25
    const width = 200;
    const height = 20;
    
    // Draw container
    ctx.fillStyle = 'rgba(10, 20, 35, 0.8)';
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.lineWidth = 2;
    
    // Create glow effect based on time remaining
    const timeRatio = evolutionTimer / CONFIG.ZOMBIE_EVOLUTION.EVOLUTION_INTERVAL;
    const glowIntensity = Math.sin(performance.now() / 300) * 0.2 + 0.8;
    const pulseSpeed = Math.max(0.5, 2 - timeRatio * 2); // Pulse faster as timer runs down
    const warningPulse = Math.sin(performance.now() / (300 / pulseSpeed)) * 0.3 + 0.7;
    
    // Stronger glow when timer is low
    if (timeRatio < 0.2) {
        ctx.shadowColor = 'rgba(255, 50, 50, ' + warningPulse + ')';
        ctx.shadowBlur = 15;
    } else {
        ctx.shadowColor = 'rgba(255, 50, 50, ' + (glowIntensity * 0.5) + ')';
        ctx.shadowBlur = 8;
    }
    
    // Draw rounded container
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y, width, height + 30, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw level indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Orbitron';
    ctx.textAlign = 'center';
    
    // Get evolution color based on level
    const evolutionColor = getEvolutionColor(zombieEvolutionLevel);
    
    ctx.fillStyle = evolutionColor;
    ctx.fillText(`ZOMBIE EVOLUTION: TIER ${zombieEvolutionLevel}`, x, y + 15);
    
    // Draw time remaining in white
    ctx.fillStyle = '#FFFFFF';
    const secondsRemaining = Math.ceil(evolutionTimer / 1000);
    ctx.font = '12px Orbitron';
    ctx.fillText(`Next evolution in: ${secondsRemaining}s`, x, y + 35);
    
    // Draw the progress bar
    const barWidth = width - 20;
    const barHeight = 8;
    const barX = x - barWidth / 2;
    const barY = y + 45;
    
    // Background
    ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 4);
    ctx.fill();
    
    // Progress fill
    const fillWidth = barWidth * timeRatio;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, 'rgba(255, 50, 50, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillWidth, barHeight, 4);
    ctx.fill();
    
    // Warning icon if less than 10 seconds
    if (secondsRemaining <= 10) {
        ctx.font = '14px Orbitron';
        ctx.fillStyle = 'rgba(255, 50, 50, ' + warningPulse + ')';
        ctx.fillText('!', barX - 15, barY + 8);
        ctx.fillText('!', barX + barWidth + 15, barY + 8);
    }
}

// Function to show evolution announcement
function showEvolutionAnnouncement() {
    // Create announcement element
    const announcement = document.createElement('div');
    announcement.className = 'evolution-announcement';
    
    // Set message
    announcement.innerHTML = `
        ZOMBIES EVOLVED!<br>
        <span style="font-size: 24px; color: ${getEvolutionColor(zombieEvolutionLevel)};">
            TIER ${zombieEvolutionLevel} (+5% ALL STATS)
        </span>
    `;
    
    // Add to game container
    document.getElementById('gameContainer').appendChild(announcement);
    
    // Remove after animation completes
    setTimeout(() => {
        announcement.remove();
    }, 3000);
}

// Update evolution UI
function updateEvolutionUI() {
    // Update timer if it exists
    const tierElement = document.getElementById('evolutionTier');
    const countdownElement = document.getElementById('evolutionCountdown');
    const progressElement = document.getElementById('evolutionProgress');
    
    if (tierElement && countdownElement && progressElement) {
        // Update tier
        tierElement.textContent = `TIER ${zombieEvolutionLevel}`;
        
        // Update tier color
        tierElement.style.color = getEvolutionColor(zombieEvolutionLevel);
        tierElement.style.textShadow = `0 0 8px ${getEvolutionColor(zombieEvolutionLevel)}`;
        
        // Update countdown
        const secondsRemaining = Math.ceil(evolutionTimer / 1000);
        countdownElement.textContent = `Next evolution in: ${secondsRemaining}s`;
        
        // Add warning class when under 10 seconds
        if (secondsRemaining <= 10) {
            countdownElement.classList.add('evolution-warning');
        } else {
            countdownElement.classList.remove('evolution-warning');
        }
        
        // Update progress bar
        const timeRatio = evolutionTimer / CONFIG.ZOMBIE_EVOLUTION.EVOLUTION_INTERVAL;
        progressElement.style.width = `${timeRatio * 100}%`;
    }
}

