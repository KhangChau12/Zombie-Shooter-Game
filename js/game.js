// Main game logic and initialization

// Initialize game
function initGame() {
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
}

// Main game loop
function update(currentTime) {
    // Calculate delta time
    deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Constrain delta time to prevent glitches after tab switch
    deltaTime = Math.min(deltaTime, 0.1);
    
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
        
        // Draw section clearing progress if player is in an uncleared section
        drawSectionClearingProgress();
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
}

// Draw weapon selector UI
function drawWeaponSelector() {
    if (player.equippedWeapons.length <= 1) return;
    
    const topMargin = 20;
    const weaponBoxSize = 60;
    const spacing = 10;
    const totalWidth = player.equippedWeapons.length * weaponBoxSize + (player.equippedWeapons.length - 1) * spacing;
    const startX = (canvas.width - totalWidth) / 2;
    
    for (let i = 0; i < player.equippedWeapons.length; i++) {
        const weaponId = player.equippedWeapons[i];
        const weaponData = getWeaponById(weaponId);
        const isActive = i === player.activeWeaponIndex;
        
        const boxX = startX + i * (weaponBoxSize + spacing);
        const boxY = topMargin;
        
        // Draw selector box
        ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = isActive ? weaponData.color : '#555';
        ctx.lineWidth = isActive ? 3 : 1;
        
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, weaponBoxSize, weaponBoxSize, 5);
        ctx.fill();
        ctx.stroke();
        
        // Draw weapon number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`${i+1}`, boxX + 5, boxY + 15);
        
        // Draw weapon name
        ctx.font = '10px Orbitron';
        ctx.fillStyle = isActive ? '#FFFFFF' : '#AAA';
        ctx.textAlign = 'center';
        ctx.fillText(weaponData.name, boxX + weaponBoxSize/2, boxY + weaponBoxSize - 10);
        
        // Draw ammo
        const ammoCount = player.ammunition[weaponData.ammoType].current;
        const reserveAmmo = player.ammunition[weaponData.ammoType].reserve;
        ctx.fillText(`${ammoCount}/${reserveAmmo}`, boxX + weaponBoxSize/2, boxY + weaponBoxSize - 25);
    }
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
    
    // Draw progress bar at the top center of screen
    const barWidth = 200;
    const barHeight = 20;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 20;
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw progress
    ctx.fillStyle = currentSection.isCleared ? 'rgba(0, 255, 100, 0.7)' : 'rgba(255, 100, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth * (progress / 100), barHeight);
    
    // Draw border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(
        `SECTION CLEARING: ${Math.floor(progress)}%`, 
        barX + barWidth / 2, 
        barY + barHeight / 2 + 4
    );
    
    // Draw zombies remaining
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(
        `${currentSection.zombiesRemaining}/${currentSection.zombiesTotal} zombies remaining`, 
        barX + barWidth / 2, 
        barY + barHeight + 15
    );
}