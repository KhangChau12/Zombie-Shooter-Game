// Zombies and related functionality

// Spawn zombies in discovered map sections
function spawnZombiesInDiscoveredSections() {
    const currentTime = performance.now();
    
    // Check current zombie count
    if (zombies.length >= CONFIG.MAX_ZOMBIES_ON_SCREEN) {
        return; // Don't create more zombies if at limit
    }
    
    // Number of remaining slots for zombies
    const remainingSlots = CONFIG.MAX_ZOMBIES_ON_SCREEN - zombies.length;
    if (remainingSlots <= 0) return;
    
    mapSections.forEach(section => {
        // Skip if section is territory (but not if just cleared)
        if (section.isTerritory) return;
        
        // If no more room to create zombies, return
        if (zombies.length >= CONFIG.MAX_ZOMBIES_ON_SCREEN) return;
        
        // Get section coordinates
        const sectionX = Math.floor(section.x / CONFIG.SECTION_SIZE);
        const sectionY = Math.floor(section.y / CONFIG.SECTION_SIZE);
        const sectionKey = `${sectionX},${sectionY}`;
        
        // Count current zombies in this section
        const zombiesInSection = zombies.filter(z => 
            z.sectionX === sectionX && z.sectionY === sectionY
        ).length;
        
        // Update section's current zombie count
        section.currentZombieCount = zombiesInSection;
        
        // If the section is cleared but not territory, periodically respawn zombies
        if (section.isCleared && !section.isTerritory) {
            // Use a shorter spawn interval (2 seconds)
            const respawnInterval = 2000; // 2 seconds
            
            // If enough time passed, spawn a new zombie
            if (currentTime - section.lastSpawnTime > respawnInterval) {
                section.lastSpawnTime = currentTime;
                
                // Make sure we're not exceeding the max zombies for this section
                if (zombiesInSection < section.zombiesTotal) {
                    // Get a random position in this section
                    const spawnX = section.x + Math.random() * CONFIG.SECTION_SIZE;
                    const spawnY = section.y + Math.random() * CONFIG.SECTION_SIZE;
                    
                    // Spawn a zombie
                    spawnZombie(spawnX, spawnY, section.difficulty);
                }
            }
            return; // Skip the rest of logic for respawning in cleared sections
        }
        
        // If section still has zombies to spawn for initial clearing
        if (!section.isCleared && section.zombiesRemaining > 0) {
            // Use original spawn logic with distance and spawn rate
            // Original spawn rate logic here...
            const spawnInterval = 2000; // 2 seconds between spawns
            
            if (currentTime - section.lastSpawnTime > spawnInterval && zombiesInSection < section.zombiesRemaining) {
                section.lastSpawnTime = currentTime;
                
                // Get a random position at the edge of the section
                let spawnX, spawnY;
                const rand = Math.random();
                
                if (rand < 0.25) {
                    // Top edge
                    spawnX = section.x + Math.random() * CONFIG.SECTION_SIZE;
                    spawnY = section.y;
                } else if (rand < 0.5) {
                    // Right edge
                    spawnX = section.x + CONFIG.SECTION_SIZE;
                    spawnY = section.y + Math.random() * CONFIG.SECTION_SIZE;
                } else if (rand < 0.75) {
                    // Bottom edge
                    spawnX = section.x + Math.random() * CONFIG.SECTION_SIZE;
                    spawnY = section.y + CONFIG.SECTION_SIZE;
                } else {
                    // Left edge
                    spawnX = section.x;
                    spawnY = section.y + Math.random() * CONFIG.SECTION_SIZE;
                }
                
                // Spawn a zombie
                spawnSectionZombie(spawnX, spawnY, section.difficulty, sectionX, sectionY);
            }
        }
    });
}

// Spawn a zombie specifically for section clearing
function spawnSectionZombie(x, y, difficulty, sectionX, sectionY) {
    // Determine zombie type based on difficulty and randomness
    let zombieType;
    const rand = Math.random();
    
    // Higher difficulty increases chance of special zombies
    if (rand < 0.05 * difficulty && difficulty > 3) {
        zombieType = 'boss';
    } else if (rand < 0.2 + difficulty * 0.05 && difficulty > 2) {
        zombieType = 'fast';
    } else if (rand < 0.35 + difficulty * 0.05 && difficulty > 3) {
        zombieType = 'tank';
    } else {
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
    
    // Create the zombie with section clearing flags
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
        
        // Add section clearing properties
        isSectionZombie: true,
        sectionX: sectionX,
        sectionY: sectionY,
        
        // Territory effects
        inTerritory: false,
        territoryDamageTime: 0,
        
        // Visual effects
        lastDamageTime: 0,
        damageFlashDuration: 200, // ms
        
        // Behavior
        targetX: player.x,
        targetY: player.y,
        pathUpdateTime: 0,
        pathUpdateInterval: 500 + Math.random() * 500, // Random interval to avoid all zombies updating at once
        
        // Movement vectors
        moveX: 0,
        moveY: 0,
        
        // Animations
        animationFrame: 0,
        animationTime: 0,
        animationSpeed: 0.2 + Math.random() * 0.1, // Slight variation in animation speed
        spawnTime: performance.now()
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
    
    // Get section coordinates
    const sectionX = Math.floor(x / CONFIG.SECTION_SIZE);
    const sectionY = Math.floor(y / CONFIG.SECTION_SIZE);
    
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
        
        // Not a section zombie (won't count for clearing)
        isSectionZombie: false,
        sectionX: sectionX,
        sectionY: sectionY,
        
        // Territory effects
        inTerritory: false,
        territoryDamageTime: 0,
        
        // Visual effects
        lastDamageTime: 0,
        damageFlashDuration: 200, // ms
        
        // Behavior
        targetX: player.x,
        targetY: player.y,
        pathUpdateTime: 0,
        pathUpdateInterval: 500 + Math.random() * 500, // Random interval to avoid all zombies updating at once
        
        // Movement vectors
        moveX: 0,
        moveY: 0,
        
        // Animations
        animationFrame: 0,
        animationTime: 0,
        animationSpeed: 0.2 + Math.random() * 0.1, // Slight variation in animation speed
        spawnTime: performance.now()
    });
}

// Update all zombies
function updateZombies(deltaTime) {
    const currentTime = performance.now();
    
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        
        // Check if zombie is too far outside screen, remove to save resources
        if (zombie.x < cameraX - 1500 || zombie.x > cameraX + canvas.width + 1500 ||
            zombie.y < cameraY - 1500 || zombie.y > cameraY + canvas.height + 1500) {
            
            // If this is a section zombie, update the section's zombie count
            if (zombie.isSectionZombie) {
                // Find the section this zombie belongs to
                const section = mapSections.find(s => 
                    Math.floor(s.x / CONFIG.SECTION_SIZE) === zombie.sectionX && 
                    Math.floor(s.y / CONFIG.SECTION_SIZE) === zombie.sectionY
                );
                
                // If section is not cleared, decrease zombie count
                if (section && !section.isCleared) {
                    section.zombiesRemaining--;
                    
                    // Check if section is now cleared
                    if (section.zombiesRemaining <= 0) {
                        sectionCleared(section);
                    }
                }
            }
            
            zombies.splice(i, 1);
            continue;
        }
        
        // Check if zombie is in a territory
        const zombieSectionX = Math.floor(zombie.x / CONFIG.SECTION_SIZE);
        const zombieSectionY = Math.floor(zombie.y / CONFIG.SECTION_SIZE);
        
        // Find the section
        const section = mapSections.find(s => 
            Math.floor(s.x / CONFIG.SECTION_SIZE) === zombieSectionX && 
            Math.floor(s.y / CONFIG.SECTION_SIZE) === zombieSectionY
        );
        
        // Apply territory effects
        const wasInTerritory = zombie.inTerritory;
        zombie.inTerritory = false;
        
        if (section && section.isTerritory) {
            zombie.inTerritory = true;
            
            // Apply damage over time in territory
            if (currentTime - zombie.territoryDamageTime > 1000) { // Every second
                zombie.territoryDamageTime = currentTime;
                
                // Apply territory damage
                const territoryDamage = CONFIG.TERRITORY.ZOMBIE_DAMAGE;
                damageZombie(zombie, territoryDamage);
                
                // Create visual effect
                createEffect(
                    zombie.x, 
                    zombie.y, 
                    zombie.radius, 
                    0.3, 
                    'territoryDamage'
                );
            }
        }
        
        // Check if in home radius for stronger effects
        const distanceFromHome = Math.sqrt(
            Math.pow(zombie.x - player.startX, 2) + 
            Math.pow(zombie.y - player.startY, 2)
        );
        
        if (distanceFromHome <= CONFIG.TERRITORY.HOME_RADIUS) {
            zombie.inTerritory = true;
            
            // Apply stronger damage over time near home
            if (currentTime - zombie.territoryDamageTime > 500) { // Twice per second
                zombie.territoryDamageTime = currentTime;
                
                // Apply boosted territory damage
                const homeDamage = CONFIG.TERRITORY.ZOMBIE_DAMAGE * CONFIG.TERRITORY.HOME_BONUS_MULTIPLIER;
                damageZombie(zombie, homeDamage);
                
                // Create stronger visual effect
                createEffect(
                    zombie.x, 
                    zombie.y, 
                    zombie.radius * 1.5, 
                    0.3, 
                    'homeDamage'
                );
            }
        }
        
        // Update zombie target
        if (currentTime - zombie.pathUpdateTime > zombie.pathUpdateInterval) {
            zombie.pathUpdateTime = currentTime;
            
            // Always target the player
            zombie.targetX = player.x;
            zombie.targetY = player.y;
            
            // Add some randomness for more natural movement
            if (zombie.type !== 'boss') { // Boss always aims precisely
                zombie.targetX += (Math.random() - 0.5) * 50;
                zombie.targetY += (Math.random() - 0.5) * 50;
            }
        }
        
        // Move zombie towards target with collision avoidance
        const dx = zombie.targetX - zombie.x;
        const dy = zombie.targetY - zombie.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        
        if (distanceToTarget > 1) {
            // Only calculate new direction periodically to save performance
            if (currentTime - zombie.lastMoveAttempt > 100) {
                zombie.lastMoveAttempt = currentTime;
                
                // Basic direction towards target
                let moveX = dx / distanceToTarget;
                let moveY = dy / distanceToTarget;
                
                // Check collisions with other zombies and apply separation
                for (let j = 0; j < zombies.length; j++) {
                    if (i !== j) {
                        const otherZombie = zombies[j];
                        const separationDx = zombie.x - otherZombie.x;
                        const separationDy = zombie.y - otherZombie.y;
                        const separationDistance = Math.sqrt(separationDx * separationDx + separationDy * separationDy);
                        
                        // Apply separation force if zombies are too close to each other
                        const collisionThreshold = zombie.radius + otherZombie.radius + 5;
                        if (separationDistance < collisionThreshold) {
                            // Stronger separation force for closer zombies
                            const separationForce = 1 - (separationDistance / (collisionThreshold + 10));
                            moveX += (separationDx / separationDistance) * separationForce * 2;
                            moveY += (separationDy / separationDistance) * separationForce * 2;
                        }
                    }
                }
                
                // Normalize movement vector
                const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
                if (moveLength > 0) {
                    moveX /= moveLength;
                    moveY /= moveLength;
                    
                    // Add some random movement for regular zombies
                    if (zombie.type === 'regular' && Math.random() < 0.3) {
                        moveX += (Math.random() - 0.5) * 0.3;
                        moveY += (Math.random() - 0.5) * 0.3;
                        
                        // Normalize again
                        const newLength = Math.sqrt(moveX * moveX + moveY * moveY);
                        moveX /= newLength;
                        moveY /= newLength;
                    }
                    
                    // Fast zombie sometimes moves in zigzag
                    if (zombie.type === 'fast' && Math.random() < 0.4) {
                        const perpX = -moveY;
                        const perpY = moveX;
                        moveX += perpX * 0.5;
                        moveY += perpY * 0.5;
                        
                        // Normalize again
                        const newLength = Math.sqrt(moveX * moveX + moveY * moveY);
                        moveX /= newLength;
                        moveY /= newLength;
                    }
                }
                
                // Store movement direction to use until next update
                zombie.moveX = moveX;
                zombie.moveY = moveY;
            }
            
            // Use calculated direction to move zombie
            if (zombie.moveX !== undefined && zombie.moveY !== undefined) {
                // Add speed burst for fast zombies to make them more erratic
                let speedMultiplier = 1;
                if (zombie.type === 'fast' && Math.random() < 0.1) {
                    speedMultiplier = 1.5; // Speed burst
                }
                
                // Apply territory slow effect
                if (zombie.inTerritory) {
                    speedMultiplier *= CONFIG.TERRITORY.ZOMBIE_SLOW;
                }
                
                // Use fixed speed movement
                const moveSpeed = zombie.speed * speedMultiplier * 0.05;
                zombie.x += zombie.moveX * moveSpeed;
                zombie.y += zombie.moveY * moveSpeed;
            }
        }
        
        // Update animation
        zombie.animationTime += deltaTime;
        if (zombie.animationTime >= zombie.animationSpeed) {
            zombie.animationTime = 0;
            zombie.animationFrame = (zombie.animationFrame + 1) % 4; // 4 animation frames
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
            
            // Draw zombie shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX, screenY + zombie.radius - 5, zombie.radius * 0.8, zombie.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw zombie body
            ctx.beginPath();
            ctx.arc(screenX, screenY, zombie.radius, 0, Math.PI * 2);
            
            // Use damage flash color, territory effect color, or normal color
            if (inDamageFlash) {
                ctx.fillStyle = '#FFFFFF';
            } else if (zombie.inTerritory) {
                // Territory effect - add a pulsing green tint
                const pulseRate = Math.sin(currentTime / 200) * 0.3 + 0.7;
                
                // Mix the zombie's color with territory color
                const baseColor = hexToRgb(zombie.color);
                const territoryColor = { r: 0, g: 255, b: 100 };
                
                const mixedColor = {
                    r: Math.floor(baseColor.r * 0.7 + territoryColor.r * 0.3 * pulseRate),
                    g: Math.floor(baseColor.g * 0.7 + territoryColor.g * 0.3 * pulseRate),
                    b: Math.floor(baseColor.b * 0.7 + territoryColor.b * 0.3 * pulseRate)
                };
                
                ctx.fillStyle = `rgb(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b})`;
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
            
            // Mark section zombies with a small indicator
            if (zombie.isSectionZombie) {
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(screenX, screenY - zombie.radius - 15, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Show territory effect
            if (zombie.inTerritory) {
                const pulseSize = 1 + Math.sin(currentTime / 300) * 0.2;
                
                // Draw territory damage effect
                ctx.strokeStyle = 'rgba(0, 255, 100, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, zombie.radius * 1.2 * pulseSize, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
}

// Convert hex color to RGB object
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
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
    // Check if this is a section zombie and update section progress
    if (zombie.isSectionZombie) {
        markZombieKilled(zombie);
    }
    
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
        else if (rand < 0.9) pickupType = 'armor';
        else pickupType = 'torch';
        
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
    
    // Remove zombie from the array
    const index = zombies.indexOf(zombie);
    if (index !== -1) {
        zombies.splice(index, 1);
    }
    
    // Update UI
    updateUI();
}

// Create a floating text indicator
function createFloatingText(x, y, text, color = '#FFFFFF', duration = 1) {
    createEffect(
        x,
        y,
        10, // Not used for text, just a placeholder
        duration,
        'floatingText',
        {
            text: text,
            color: color,
            dy: -30 // Float upward
        }
    );
}