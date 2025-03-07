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
        
        // Cập nhật zombie với deltaTime cố định để đảm bảo tốc độ di chuyển
        const fixedDelta = 1/60; // 60fps đã cố định
        updateZombies(fixedDelta);
        
        updateEffects(deltaTime);
        updatePickups(deltaTime);
        
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
        
        // Log zombie count for debugging
        if (zombies.length > 0 && currentTime % 1000 < 20) {
            console.log("Zombie count:", zombies.length);
            console.log("First zombie:", zombies[0]);
        }
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
            }
        }
    }
}

// Update pickups
function updatePickups(deltaTime) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        
        // No update logic for now, just check if player collected
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + pickup.radius) {
            // Player collected the pickup
            if (pickup.type === 'health') {
                player.health = Math.min(player.health + pickup.value, player.maxHealth);
                showGameMessage("+20 Health");
            } else if (pickup.type === 'ammo') {
                player.weapon.ammo = player.weapon.maxAmmo;
                showGameMessage("Ammo Restored");
            } else if (pickup.type === 'coins') {
                player.coins += pickup.value;
                showGameMessage(`+${pickup.value} Coins`);
            } else if (pickup.type === 'armor') {
                player.armor = Math.min(player.armor + pickup.value, player.maxArmor);
                showGameMessage("+15 Armor");
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
    } else {
        ctx.fillStyle = '#FF6347'; // Tomato color
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
    
    // Draw weapon name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(player.weapon.name.toUpperCase(), screenX, screenY + player.radius + 15);
}