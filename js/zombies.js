// Zombies and related functionality

// Spawn zombies in discovered map sections
function spawnZombiesInDiscoveredSections() {
    const currentTime = performance.now();
    
    mapSections.forEach(section => {
        // Calculate distance from starting point
        const sectionCenterX = section.x + CONFIG.SECTION_SIZE / 2;
        const sectionCenterY = section.y + CONFIG.SECTION_SIZE / 2;
        const sectionX = Math.floor(section.x / CONFIG.SECTION_SIZE);
        const sectionY = Math.floor(section.y / CONFIG.SECTION_SIZE);
        
        // Distance from start in section units
        const distanceFromStart = Math.sqrt(
            Math.pow(sectionX - player.startSectionX, 2) + 
            Math.pow(sectionY - player.startSectionY, 2)
        );
        
        // Spawn rate increases with distance from start
        const spawnRate = 0.03 * (1 + distanceFromStart * 0.03) * section.zombiesDensity;
        
        // Spawn time decreases with distance (more frequent spawns)
        const spawnInterval = Math.max(1000, 5000 - distanceFromStart * 100);
        
        // Only spawn zombies if enough time has passed and probability check passes
        if (currentTime - section.lastSpawnTime > spawnInterval && Math.random() < spawnRate) {
            section.lastSpawnTime = currentTime;
            
            // Calculate distance from player to section center
            const distanceToPlayer = Math.sqrt(
                Math.pow(sectionCenterX - player.x, 2) + 
                Math.pow(sectionCenterY - player.y, 2)
            );
            
            // Only spawn zombies if player is relatively close to the section
            // Distance increases with difficulty to allow more zombies to come from farther away
            const spawnDistance = CONFIG.SPAWN_DISTANCE_MIN + section.difficulty * 100;
            if (distanceToPlayer < spawnDistance) {
                // Find a valid spawn position that's off-screen but in the section
                let spawnX, spawnY;
                let isValid = false;
                let attempts = 0;
                
                while (!isValid && attempts < 10) {
                    attempts++;
                    
                    // Random position within section
                    spawnX = section.x + Math.random() * CONFIG.SECTION_SIZE;
                    spawnY = section.y + Math.random() * CONFIG.SECTION_SIZE;
                    
                    // Check if it's off screen (from player's view) but not too far
                    const distanceToPlayer = Math.sqrt(
                        Math.pow(spawnX - player.x, 2) + 
                        Math.pow(spawnY - player.y, 2)
                    );
                    
                    // Make zombies spawn farther away in more difficult sections
                    const minDistance = CONFIG.SPAWN_DISTANCE_MIN;
                    const maxDistance = CONFIG.SPAWN_DISTANCE_MAX + section.difficulty * 50;
                    
                    if (distanceToPlayer > minDistance && distanceToPlayer < maxDistance) {
                        isValid = true;
                    }
                }
                
                if (isValid) {
                    // Higher difficulty allows more zombies to spawn at once
                    const zombieCount = Math.min(3, 1 + Math.floor(section.difficulty / 3));
                    for (let i = 0; i < zombieCount; i++) {
                        if (Math.random() < 0.7) { // 70% chance to spawn multiple
                            spawnZombie(
                                spawnX + (Math.random() - 0.5) * 50, 
                                spawnY + (Math.random() - 0.5) * 50, 
                                section.difficulty
                            );
                        }
                    }
                }
            }
        }
    });
}

// Spawn a zombie at a specific position with difficulty based on distance/section
function spawnZombie(x, y, difficulty) {
    // Determine zombie type based on difficulty and randomness
    let zombieType;
    const rand = Math.random();
    
    // Higher difficulty increases chance of special zombies
    if (rand < 0.05 * difficulty && difficulty > 3) {
        // Boss zombie
        zombieType = 'boss';
    } else if (rand < 0.2 + difficulty * 0.05 && difficulty > 2) {
        // Fast zombie - more common in higher difficulties
        zombieType = 'fast';
    } else if (rand < 0.35 + difficulty * 0.05 && difficulty > 3) {
        // Tank zombie - more common in higher difficulties
        zombieType = 'tank';
    } else {
        // Regular zombie
        zombieType = 'regular';
    }
    
    // Get zombie type config
    const zombieConfig = CONFIG.ZOMBIE_TYPES[zombieType];
    
    // Calculate base stats scaled by difficulty
    const baseHealth = CONFIG.ZOMBIE_BASE_STATS.health + (difficulty - 1) * 25;
    const baseSpeed = CONFIG.ZOMBIE_BASE_STATS.speed + Math.min(difficulty * 0.15, 3);
    const baseDamage = CONFIG.ZOMBIE_BASE_STATS.damage + difficulty * 2;
    
    // Apply type multipliers
    const health = baseHealth * zombieConfig.healthMultiplier;
    const speed = baseSpeed * zombieConfig.speedMultiplier;
    const damage = baseDamage * zombieConfig.damageMultiplier;
    
    // Calculate XP and coins based on difficulty and type
    const xpValue = Math.floor(10 * zombieConfig.xpMultiplier * (1 + (difficulty - 1) * 0.2));
    const coinValue = Math.floor(10 * zombieConfig.coinMultiplier * (1 + (difficulty - 1) * 0.2));
    
    // Create the zombie
    zombies.push({
        x: x,
        y: y,
        speed: speed,
        radius: zombieConfig.radius,
        health: health,
        maxHealth: health,
        damage: damage,
        type: zombieType,
        coins: coinValue,
        xp: xpValue,
        lastMoveAttempt: 0,
        color: zombieConfig.color,
        
        // Visual effects
        lastDamageTime: 0,
        damageFlashDuration: 200, // ms
        
        // Behavior
        targetX: player.x,
        targetY: player.y,
        pathUpdateTime: 0,
        pathUpdateInterval: 500 + Math.random() * 500, // Random interval to avoid all zombies updating at once
        
        // Animations
        animationFrame: 0,
        animationTime: 0,
        animationSpeed: 0.2 + Math.random() * 0.1, // Slight variation in animation speed
        spawnTime: performance.now()
    });
}

// Update all zombies
function updateZombies(deltaTime) {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        
        // Check if zombie is far offscreen, if so remove it to save resources
        if (zombie.x < cameraX - 1000 || zombie.x > cameraX + canvas.width + 1000 ||
            zombie.y < cameraY - 1000 || zombie.y > cameraY + canvas.height + 1000) {
            zombies.splice(i, 1);
            continue;
        }
        
        // Update zombie targeting
        const currentTime = performance.now();
        if (currentTime - zombie.pathUpdateTime > zombie.pathUpdateInterval) {
            zombie.pathUpdateTime = currentTime;
            zombie.targetX = player.x;
            zombie.targetY = player.y;
        }
        
        // Move zombie towards target with collision avoidance
        const dx = zombie.targetX - zombie.x;
        const dy = zombie.targetY - zombie.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        
        if (distanceToTarget > 1) {
            // Only calculate new direction periodically to save performance
            if (currentTime - zombie.lastMoveAttempt > 100) {
                zombie.lastMoveAttempt = currentTime;
                
                // Base direction towards target
                let moveX = dx / distanceToTarget;
                let moveY = dy / distanceToTarget;
                
                // Check for collisions with other zombies and apply separation
                for (let j = 0; j < zombies.length; j++) {
                    if (i !== j) {
                        const otherZombie = zombies[j];
                        const separationDx = zombie.x - otherZombie.x;
                        const separationDy = zombie.y - otherZombie.y;
                        const separationDistance = Math.sqrt(separationDx * separationDx + separationDy * separationDy);
                        
                        // Apply separation force if zombies are too close
                        if (separationDistance < zombie.radius + otherZombie.radius + 10) {
                            // Stronger separation force for closer zombies
                            const separationForce = 1 - (separationDistance / (zombie.radius + otherZombie.radius + 20));
                            moveX += (separationDx / separationDistance) * separationForce * 2;
                            moveY += (separationDy / separationDistance) * separationForce * 2;
                        }
                    }
                }
                
                // Normalize the movement vector
                const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
                if (moveLength > 0) {
                    moveX /= moveLength;
                    moveY /= moveLength;
                }
                
                // Apply movement with delta time
                zombie.x += moveX * zombie.speed * deltaTime;
                zombie.y += moveY * zombie.speed * deltaTime;
            }
        }
        
        // Update animation
        zombie.animationTime += deltaTime;
        if (zombie.animationTime >= zombie.animationSpeed) {
            zombie.animationTime = 0;
            zombie.animationFrame = (zombie.animationFrame + 1) % 4; // 4 frames of animation
        }
    }
}

// Draw all zombies
function drawZombies() {
    for (let i = 0; i < zombies.length; i++) {
        const zombie = zombies[i];
        
        // Convert world position to screen position
        const screenX = zombie.x - cameraX;
        const screenY = zombie.y - cameraY;
        
        // Only draw if on screen (with some padding)
        if (screenX >= -zombie.radius && screenX <= canvas.width + zombie.radius &&
            screenY >= -zombie.radius && screenY <= canvas.height + zombie.radius) {
            
            // Check if zombie is in damage flash state
            const currentTime = performance.now();
            const inDamageFlash = (currentTime - zombie.lastDamageTime < zombie.damageFlashDuration);
            
            // Draw zombie body
            ctx.beginPath();
            ctx.arc(screenX, screenY, zombie.radius, 0, Math.PI * 2);
            
            // Use damage flash color or normal color
            if (inDamageFlash) {
                ctx.fillStyle = '#FFFFFF';
            } else {
                ctx.fillStyle = zombie.color;
            }
            
            ctx.fill();
            
            // Draw zombie details based on type
            if (zombie.type === 'boss') {
                // Draw boss details (spikes, eyes, etc)
                drawBossDetails(screenX, screenY, zombie);
            } else if (zombie.type === 'fast') {
                // Draw fast zombie details
                drawFastZombieDetails(screenX, screenY, zombie);
            } else if (zombie.type === 'tank') {
                // Draw tank zombie details
                drawTankZombieDetails(screenX, screenY, zombie);
            } else {
                // Draw regular zombie details
                drawRegularZombieDetails(screenX, screenY, zombie);
            }
            
            // Draw health bar
            const healthPercentage = zombie.health / zombie.maxHealth;
            const barWidth = zombie.radius * 2;
            const barHeight = 5;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - barWidth / 2, screenY - zombie.radius - 10, barWidth, barHeight);
            
            ctx.fillStyle = healthPercentage > 0.5 ? '#0F0' : healthPercentage > 0.25 ? '#FF0' : '#F00';
            ctx.fillRect(screenX - barWidth / 2, screenY - zombie.radius - 10, barWidth * healthPercentage, barHeight);
        }
    }
}

// Draw details for different zombie types
function drawBossDetails(x, y, zombie) {
    const r = zombie.radius;
    
    // Draw glowing eyes
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x - r/3, y - r/4, r/5, 0, Math.PI * 2);
    ctx.arc(x + r/3, y - r/4, r/5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw spikes around boss
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 3;
    
    const spikes = 8;
    const spikeLength = r * 0.4;
    
    for (let i = 0; i < spikes; i++) {
        const angle = (i / spikes) * Math.PI * 2 + (performance.now() / 2000);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
        ctx.lineTo(x + Math.cos(angle) * (r + spikeLength), y + Math.sin(angle) * (r + spikeLength));
        ctx.stroke();
    }
}

function drawFastZombieDetails(x, y, zombie) {
    const r = zombie.radius;
    
    // Draw glowing eyes
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(x - r/3, y - r/5, r/6, 0, Math.PI * 2);
    ctx.arc(x + r/3, y - r/5, r/6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw motion lines
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    
    const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(angle) * r, y - Math.sin(angle) * r);
    ctx.lineTo(x - Math.cos(angle) * (r + 15), y - Math.sin(angle) * (r + 15));
    ctx.stroke();
}

function drawTankZombieDetails(x, y, zombie) {
    const r = zombie.radius;
    
    // Draw eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - r/3, y - r/4, r/6, 0, Math.PI * 2);
    ctx.arc(x + r/3, y - r/4, r/6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw armor plates
    ctx.strokeStyle = '#400040';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, Math.PI * 1.2, Math.PI * 0.8);
    ctx.stroke();
}

function drawRegularZombieDetails(x, y, zombie) {
    const r = zombie.radius;
    
    // Draw eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - r/3, y - r/4, r/8, 0, Math.PI * 2);
    ctx.arc(x + r/3, y - r/4, r/8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mouth (changes with animation frame)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    const mouthOpen = (zombie.animationFrame % 2 === 0) ? r/4 : r/8;
    
    ctx.beginPath();
    ctx.arc(x, y + r/4, mouthOpen, 0, Math.PI);
    ctx.stroke();
}

// Handle zombie damage from a bullet
function damageZombie(zombie, damage) {
    zombie.health -= damage;
    zombie.lastDamageTime = performance.now();
    
    // Add blood effect
    createEffect(
        zombie.x,
        zombie.y,
        8, // radius
        0.5, // duration in seconds
        'blood'
    );
    
    // Check if zombie died
    if (zombie.health <= 0) {
        killZombie(zombie);
        return true;
    }
    
    return false;
}

// Handle zombie death
function killZombie(zombie) {
    // Add pickup drop chance based on zombie type
    let dropChance = 0.1;
    if (zombie.type === 'boss') dropChance = 1.0; // Bosses always drop something
    else if (zombie.type === 'tank') dropChance = 0.25;
    
    if (Math.random() < dropChance) {
        // Determine what to drop
        const rand = Math.random();
        let pickupType;
        
        if (rand < 0.4) pickupType = 'health';
        else if (rand < 0.7) pickupType = 'ammo';
        else pickupType = 'armor';
        
        createPickup(zombie.x, zombie.y, pickupType);
    }
    
    // Always drop coins
    createPickup(zombie.x, zombie.y, 'coins', zombie.coins);
    
    // Add XP and update stats
    addXP(zombie.xp);
    player.coins += zombie.coins;
    player.kills++;
    
    // Add death effect (blood explosion)
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 50;
        createEffect(
            zombie.x,
            zombie.y,
            5, // radius
            0.8, // duration
            'blood',
            {
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed
            }
        );
    }
    
    // Play death sound based on zombie type
    // playSound(`zombie${zombie.type}Death`);
    
    // Remove zombie from the array
    const index = zombies.indexOf(zombie);
    if (index !== -1) {
        zombies.splice(index, 1);
    }
    
    // Update UI
    updateUI();
}