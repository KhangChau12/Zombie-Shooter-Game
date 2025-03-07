// Map generation and handling

// Array to store discovered map sections
let mapSections = [];

// Initialize the map
function initMap() {
    // Clear previous sections
    mapSections = [];
    
    // Calculate player starting section
    const sectionX = Math.floor(player.x / CONFIG.SECTION_SIZE);
    const sectionY = Math.floor(player.y / CONFIG.SECTION_SIZE);
    
    // Remember starting section for player
    player.startSectionX = sectionX;
    player.startSectionY = sectionY;
    
    // Create initial section
    const sectionKey = `${sectionX},${sectionY}`;
    player.exploredSections.add(sectionKey);
    
    // Add initial section to map
    mapSections.push({
        x: sectionX * CONFIG.SECTION_SIZE,
        y: sectionY * CONFIG.SECTION_SIZE,
        difficulty: 1,
        zombiesDensity: CONFIG.ZOMBIE_DENSITY_BASE,
        lastSpawnTime: 0,
        isTerritory: false,
        isCleared: false,
        isHomeBase: true,
        zombiesTotal: 0,
        zombiesRemaining: 0,
        hasTreasure: false,
        treasureCollected: false,
        torches: [],
        clearProgress: 0
    });
}

// Check and add new map sections as player explores
function checkForNewMapSections() {
    // Calculate which section the player is in
    const sectionX = Math.floor(player.x / CONFIG.SECTION_SIZE);
    const sectionY = Math.floor(player.y / CONFIG.SECTION_SIZE);
    const sectionKey = `${sectionX},${sectionY}`;
    
    // If this section isn't already explored, add it
    if (!player.exploredSections.has(sectionKey)) {
        player.exploredSections.add(sectionKey);
        
        // Calculate difficulty based on distance from starting point
        const distanceFromStart = Math.sqrt(
            Math.pow(sectionX - player.startSectionX, 2) + 
            Math.pow(sectionY - player.startSectionY, 2)
        );
        
        // Higher difficulty the further away from start
        // Minimum difficulty is 1, increases with distance
        const sectionDifficulty = Math.max(1, Math.floor(distanceFromStart * CONFIG.DIFFICULTY_DISTANCE_MULTIPLIER) + 1);
        
        // Calculate number of initial zombies based on difficulty
        const baseZombieCount = CONFIG.SECTION_INITIAL_ZOMBIES.MIN + 
            (sectionDifficulty * CONFIG.SECTION_INITIAL_ZOMBIES.BASE_FACTOR) + 
            Math.floor(Math.random() * (sectionDifficulty * CONFIG.SECTION_INITIAL_ZOMBIES.RANDOM_FACTOR));
        
        // Create a new section with difficulty based on distance from start
        const newSection = {
            x: sectionX * CONFIG.SECTION_SIZE,
            y: sectionY * CONFIG.SECTION_SIZE,
            difficulty: sectionDifficulty,
            zombiesDensity: Math.min(1, CONFIG.ZOMBIE_DENSITY_BASE + distanceFromStart * CONFIG.ZOMBIE_DENSITY_MULTIPLIER),
            lastSpawnTime: 0,
            isTerritory: false,
            isCleared: false,
            isHomeBase: false,
            zombiesTotal: baseZombieCount,
            zombiesRemaining: baseZombieCount,
            hasTreasure: false,
            treasureCollected: false,
            torches: [],
            clearProgress: 0
        };
        
        mapSections.push(newSection);
        
        // Update UI to show number of sections explored
        document.getElementById('explored').textContent = player.exploredSections.size;
        
        // Spawn initial zombies for this section
        spawnInitialZombiesForSection(newSection);
        
        // Create exploration reward occasionally
        if (Math.random() < 0.3) {
            // Random position within this section
            const rewardX = newSection.x + Math.random() * CONFIG.SECTION_SIZE;
            const rewardY = newSection.y + Math.random() * CONFIG.SECTION_SIZE;
            
            // Random reward type
            const rand = Math.random();
            if (rand < 0.4) {
                createPickup(rewardX, rewardY, 'health');
            } else if (rand < 0.7) {
                createPickup(rewardX, rewardY, 'ammo');
            } else if (rand < 0.9) {
                createPickup(rewardX, rewardY, 'armor');
            } else {
                createPickup(rewardX, rewardY, 'coins', 50 + Math.floor(sectionDifficulty * 25));
            }
        }
    }
}

// Spawn initial zombies for a newly discovered section
function spawnInitialZombiesForSection(section) {
    // Only spawn for sections that aren't cleared
    if (section.isCleared) return;
    
    // Calculate the number of zombies to spawn initially (just a portion)
    // This prevents overwhelming the player; the rest will spawn over time
    const initialSpawnCount = Math.min(
        Math.ceil(section.zombiesTotal * 0.3), // Spawn 30% initially
        10 // Cap at 10 to prevent overwhelming
    );
    
    for (let i = 0; i < initialSpawnCount; i++) {
        // Random position within the section, avoiding the very center where the player might be
        let spawnX, spawnY;
        
        // Divide the section into 9 equal parts (3x3 grid)
        const gridSize = CONFIG.SECTION_SIZE / 3;
        const playerCell = {
            x: Math.floor((player.x - section.x) / gridSize),
            y: Math.floor((player.y - section.y) / gridSize)
        };
        
        // Choose a different cell than the player is in
        let cellX, cellY;
        do {
            cellX = Math.floor(Math.random() * 3);
            cellY = Math.floor(Math.random() * 3);
        } while (cellX === playerCell.x && cellY === playerCell.y);
        
        // Calculate spawn position within the chosen cell
        spawnX = section.x + (cellX * gridSize) + Math.random() * gridSize;
        spawnY = section.y + (cellY * gridSize) + Math.random() * gridSize;
        
        // Spawn the zombie
        spawnInitialSectionZombie(spawnX, spawnY, section.difficulty);
    }
}

// Spawn a zombie specifically for section clearing
function spawnInitialSectionZombie(x, y, difficulty) {
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
    
    // Create the zombie with a flag for section clearing
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
        
        // Flag this as a section zombie for tracking
        isSectionZombie: true,
        
        // Track which section this zombie belongs to
        sectionX: Math.floor(x / CONFIG.SECTION_SIZE),
        sectionY: Math.floor(y / CONFIG.SECTION_SIZE),
        
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

// Draw the game map background
function drawBackground() {
    // Fill background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines with camera offset
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    // Calculate visible grid lines based on camera position
    const startX = Math.floor(cameraX / gridSize) * gridSize - cameraX;
    const startY = Math.floor(cameraY / gridSize) * gridSize - cameraY;
    const endX = startX + canvas.width + gridSize;
    const endY = startY + canvas.height + gridSize;
    
    // Vertical lines
    for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw section borders for discovered sections with difficulty color
    mapSections.forEach(section => {
        const screenX = section.x - cameraX;
        const screenY = section.y - cameraY;
        
        // Only draw if the section is visible on screen
        if (screenX < canvas.width && screenX + CONFIG.SECTION_SIZE > 0 &&
            screenY < canvas.height && screenY + CONFIG.SECTION_SIZE > 0) {
            
            // Fill territory sections with a light overlay
            if (section.isTerritory) {
                ctx.fillStyle = 'rgba(0, 255, 100, 0.05)';
                ctx.fillRect(screenX, screenY, CONFIG.SECTION_SIZE, CONFIG.SECTION_SIZE);
            }
            
            // Color based on difficulty
            ctx.strokeStyle = section.isTerritory ? 
                'rgba(0, 255, 100, 0.7)' : // Green for territory
                getDifficultyColor(section.difficulty, 0.5);
                
            ctx.lineWidth = section.isTerritory ? 3 : 2;
            ctx.strokeRect(screenX, screenY, CONFIG.SECTION_SIZE, CONFIG.SECTION_SIZE);
            
            // Draw difficulty number in center of section
            ctx.fillStyle = section.isTerritory ? 
                'rgba(0, 255, 100, 0.7)' : // Green for territory
                getDifficultyColor(section.difficulty, 0.7);
                
            ctx.font = '14px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${section.difficulty}`, 
                screenX + CONFIG.SECTION_SIZE/2, 
                screenY + CONFIG.SECTION_SIZE/2
            );
            
            // Draw section status
            let statusText = '';
            if (section.isTerritory) {
                statusText = 'TERRITORY';
            } else if (section.isCleared) {
                statusText = 'CLEARED';
            } else if (section.zombiesRemaining > 0) {
                statusText = `${section.zombiesRemaining}/${section.zombiesTotal} ZOMBIES`;
            }
            
            if (statusText) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Orbitron';
                ctx.fillText(
                    statusText, 
                    screenX + CONFIG.SECTION_SIZE/2, 
                    screenY + CONFIG.SECTION_SIZE/2 + 20
                );
            }
            
            // Draw treasure chest if available
            if (section.isCleared && section.hasTreasure && !section.treasureCollected) {
                const chestX = screenX + CONFIG.SECTION_SIZE/2;
                const chestY = screenY + CONFIG.SECTION_SIZE/2;
                
                drawTreasureChest(chestX, chestY);
            }
            
            // Draw torches
            if (section.torches && section.torches.length > 0) {
                section.torches.forEach(torch => {
                    const torchScreenX = torch.x - cameraX;
                    const torchScreenY = torch.y - cameraY;
                    
                    if (isOnScreen(torch.x, torch.y, CONFIG.TERRITORY.TORCH_RADIUS * 4)) {
                        drawTorch(torchScreenX, torchScreenY, section.isTerritory);
                    }
                });
            }
        }
    });
    
    // Draw special marker at home base
    const startScreenX = player.startX - cameraX;
    const startScreenY = player.startY - cameraY;
    
    if (isOnScreen(player.startX, player.startY, CONFIG.TERRITORY.HOME_RADIUS)) {
        // Draw home territory area
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)'; // Gold with low opacity
        ctx.beginPath();
        ctx.arc(startScreenX, startScreenY, CONFIG.TERRITORY.HOME_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw home base structure
        drawHomeBase(startScreenX, startScreenY);
        
        // Draw "HOME BASE" text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('HOME BASE', startScreenX, startScreenY - CONFIG.TERRITORY.HOME_RADIUS - 10);
    }
}

// Draw a treasure chest
function drawTreasureChest(x, y) {
    // Base of chest
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(x - 15, y - 10, 30, 20);
    
    // Top of chest
    ctx.fillStyle = '#A0522D'; // Lighter brown
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 10);
    ctx.lineTo(x + 15, y - 10);
    ctx.lineTo(x + 15, y - 15);
    ctx.lineTo(x - 15, y - 15);
    ctx.closePath();
    ctx.fill();
    
    // Gold trim
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.fillRect(x - 16, y - 10, 32, 3);
    ctx.fillRect(x - 16, y + 8, 32, 3);
    
    // Keyhole
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Glowing effect to attract attention
    const pulseScale = 0.8 + Math.sin(performance.now() / 500) * 0.2;
    ctx.fillStyle = 'rgba(255, 215, 0, ' + pulseScale * 0.3 + ')';
    ctx.beginPath();
    ctx.arc(x, y, 25 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
}

// Draw a torch
function drawTorch(x, y, isActive) {
    // Torch stick
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(x - 3, y - 3, 6, 20);
    
    // Torch head
    ctx.fillStyle = '#A0522D'; // Lighter brown
    ctx.beginPath();
    ctx.arc(x, y - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Flame effect for active torches
    if (isActive) {
        // Animated flame
        const time = performance.now() / 100;
        const flameHeight = 15 + Math.sin(time) * 5;
        
        // Create flame gradient
        const gradient = ctx.createRadialGradient(
            x, y - 10, 2,  // Inner circle
            x, y - 15, flameHeight  // Outer circle
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 165, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        // Draw flame
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y - 10, flameHeight, 0, Math.PI * 2);
        ctx.fill();
        
        // Light radius
        ctx.fillStyle = 'rgba(255, 200, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(x, y, CONFIG.TERRITORY.TORCH_LIGHT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Unlit torch
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw the home base
function drawHomeBase(x, y) {
    // Base platform
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Main building
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner structure
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Center energy core
    const time = performance.now() / 200;
    const pulseScale = 0.8 + Math.sin(time) * 0.2;
    
    ctx.fillStyle = 'rgba(0, 255, 255, ' + pulseScale * 0.8 + ')';
    ctx.beginPath();
    ctx.arc(x, y, 10 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
    
    // Defensive barriers
    for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        const barrierX = x + Math.cos(angle) * 40;
        const barrierY = y + Math.sin(angle) * 40;
        
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(barrierX, barrierY, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw minimap in the corner
function drawMinimap() {
    const mapSize = 180;
    const borderSize = 3;
    const padding = 10;
    const minimap = document.getElementById('minimap');
    
    // Create minimap canvas if it doesn't exist
    if (!minimap.querySelector('canvas')) {
        const minimapCanvas = document.createElement('canvas');
        minimapCanvas.width = mapSize;
        minimapCanvas.height = mapSize;
        minimap.appendChild(minimapCanvas);
    }
    
    const minimapCanvas = minimap.querySelector('canvas');
    const minimapCtx = minimapCanvas.getContext('2d');
    
    // Clear minimap
    minimapCtx.fillStyle = '#111';
    minimapCtx.fillRect(0, 0, mapSize, mapSize);
    
    // For infinite map, calculate the visible range for minimap
    const mmCenterX = player.x;
    const mmCenterY = player.y;
    const mmRange = CONFIG.SECTION_SIZE * 5; // Show 5 sections in each direction
    
    // Calculate minimap scale
    const scale = mapSize / (mmRange * 2);
    
    // Draw origin marker (home base)
    const startX = mapSize/2 + (player.startX - mmCenterX) * scale;
    const startY = mapSize/2 + (player.startY - mmCenterY) * scale;
    
    if (startX >= 0 && startX <= mapSize && startY >= 0 && startY <= mapSize) {
        minimapCtx.fillStyle = 'rgba(255, 215, 0, 0.7)'; // Gold
        minimapCtx.beginPath();
        minimapCtx.arc(startX, startY, 5, 0, Math.PI * 2);
        minimapCtx.fill();
        
        // Draw "HOME" text
        minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        minimapCtx.font = '8px Arial';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('HOME', startX, startY - 8);
        
        // Draw home radius
        minimapCtx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        minimapCtx.beginPath();
        minimapCtx.arc(startX, startY, CONFIG.TERRITORY.HOME_RADIUS * scale, 0, Math.PI * 2);
        minimapCtx.stroke();
    }
    
    // Draw discovered sections on minimap
    mapSections.forEach(section => {
        // Translate section coords to minimap coords
        const mmX = mapSize/2 + (section.x + CONFIG.SECTION_SIZE/2 - mmCenterX) * scale;
        const mmY = mapSize/2 + (section.y + CONFIG.SECTION_SIZE/2 - mmCenterY) * scale;
        
        // Skip if not visible on minimap
        if (mmX < 0 || mmX > mapSize || mmY < 0 || mmY > mapSize) {
            return;
        }
        
        // Color based on section status
        let color;
        if (section.isTerritory) {
            color = 'rgba(0, 255, 100, 0.7)'; // Green for territory
        } else if (section.isCleared) {
            color = 'rgba(0, 200, 255, 0.7)'; // Blue for cleared
        } else {
            color = getDifficultyColor(section.difficulty, 0.7);
        }
        
        // Size based on difficulty
        const sectionSize = Math.min(CONFIG.SECTION_SIZE * scale, 10 + section.difficulty);
        
        minimapCtx.fillStyle = color;
        minimapCtx.fillRect(
            mmX - sectionSize/2,
            mmY - sectionSize/2,
            sectionSize,
            sectionSize
        );
        
        // Draw treasure indicator
        if (section.isCleared && section.hasTreasure && !section.treasureCollected) {
            minimapCtx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            minimapCtx.beginPath();
            minimapCtx.arc(mmX, mmY, 3, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });
    
    // Draw zombies on minimap
    zombies.forEach(zombie => {
        const mmX = mapSize/2 + (zombie.x - mmCenterX) * scale;
        const mmY = mapSize/2 + (zombie.y - mmCenterY) * scale;
        
        // Skip if not visible on minimap
        if (mmX < 0 || mmX > mapSize || mmY < 0 || mmY > mapSize) {
            return;
        }
        
        let color;
        let size = 2;
        
        if (zombie.type === 'boss') {
            color = '#FF0000';
            size = 4; // Bigger dot for boss
        }
        else if (zombie.type === 'fast') color = '#00FF00';
        else if (zombie.type === 'tank') color = '#800080';
        else color = '#00FFFF';
        
        minimapCtx.fillStyle = color;
        minimapCtx.beginPath();
        minimapCtx.arc(mmX, mmY, size, 0, Math.PI * 2);
        minimapCtx.fill();
    });
    
    // Draw player on minimap (always in center for infinite map)
    minimapCtx.fillStyle = '#FFFFFF';
    minimapCtx.beginPath();
    minimapCtx.arc(mapSize/2, mapSize/2, 3, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Draw player direction
    minimapCtx.strokeStyle = '#FFFFFF';
    minimapCtx.lineWidth = 1;
    minimapCtx.beginPath();
    minimapCtx.moveTo(mapSize/2, mapSize/2);
    minimapCtx.lineTo(
        mapSize/2 + Math.cos(player.rotation) * 8,
        mapSize/2 + Math.sin(player.rotation) * 8
    );
    minimapCtx.stroke();
}

// Mark a zombie as killed for section clearing
function markZombieKilled(zombie) {
    // Only count section zombies for clearing
    if (!zombie.isSectionZombie) return;
    
    // Find the section this zombie belongs to
    const sectionX = zombie.sectionX;
    const sectionY = zombie.sectionY;
    
    // Find the section object
    const section = mapSections.find(s => 
        Math.floor(s.x / CONFIG.SECTION_SIZE) === sectionX && 
        Math.floor(s.y / CONFIG.SECTION_SIZE) === sectionY
    );
    
    if (section && !section.isCleared) {
        // Decrease zombie count
        section.zombiesRemaining--;
        
        // Update section clear progress
        section.clearProgress = ((section.zombiesTotal - section.zombiesRemaining) / section.zombiesTotal) * 100;
        
        // Check if section is now cleared
        if (section.zombiesRemaining <= 0) {
            sectionCleared(section);
        }
        
        // Create a floating text showing the section progress
        createFloatingText(
            zombie.x,
            zombie.y - 20,
            `Section: ${section.clearProgress.toFixed(0)}%`,
            '#FFFFFF',
            1.5
        );
    }
}

// Handle when a section is cleared of all zombies
function sectionCleared(section) {
    // Mark as cleared
    section.isCleared = true;
    section.zombiesRemaining = 0;
    section.clearProgress = 100;
    
    // Update player stats
    player.sectionCleared++;
    
    // Create a treasure chest with rewards
    createTreasureChest(section);
    
    // Show message
    showGameMessage(`Section Cleared! Treasure available.`);
    
    // Create section clear effect
    createSectionClearEffect(section);
}

// Create a treasure chest in a cleared section
function createTreasureChest(section) {
    // Mark section as having treasure
    section.hasTreasure = true;
    section.treasureCollected = false;
    
    // Create a pickup to visually see the chest
    // This isn't actually used, just visual
    // We'll actually handle chest interaction separately
    createEffect(
        section.x + CONFIG.SECTION_SIZE / 2,
        section.y + CONFIG.SECTION_SIZE / 2,
        CONFIG.TREASURE_CHEST.RADIUS,
        999999, // Very long duration
        'treasureChest'
    );
}

// Create visual effect for clearing a section
function createSectionClearEffect(section) {
    const centerX = section.x + CONFIG.SECTION_SIZE / 2;
    const centerY = section.y + CONFIG.SECTION_SIZE / 2;
    
    // Create expanding circle effect
    createEffect(
        centerX,
        centerY,
        CONFIG.SECTION_SIZE / 2,
        2, // 2 second duration
        'sectionClear'
    );
    
    // Create flying reward indicators
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * 100;
        const y = centerY + Math.sin(angle) * 100;
        
        createFloatingText(
            x,
            y,
            '+XP',
            '#00FF00',
            1.5
        );
    }
}

// Check if the player is near a treasure chest
function checkTreasureChestInteraction() {
    // Find nearby chest in cleared sections
    for (const section of mapSections) {
        if (section.isCleared && section.hasTreasure && !section.treasureCollected) {
            const chestX = section.x + CONFIG.SECTION_SIZE / 2;
            const chestY = section.y + CONFIG.SECTION_SIZE / 2;
            
            const distToChest = distance(player.x, player.y, chestX, chestY);
            
            if (distToChest < CONFIG.TREASURE_CHEST.RADIUS + player.radius) {
                // Open the chest
                openTreasureChest(section);
                break;
            }
        }
    }
}

// Open a treasure chest and give rewards
function openTreasureChest(section) {
    // Mark as collected
    section.treasureCollected = true;
    
    // Determine chest quality based on section difficulty
    let lootPool;
    const rand = Math.random();
    
    if (section.difficulty >= 5 || rand < 0.1) {
        // Rare loot for high difficulty or lucky chance
        lootPool = CONFIG.TREASURE_CHEST.RARE_LOOT;
    } else if (section.difficulty >= 3 || rand < 0.3) {
        // Uncommon loot for medium difficulty
        lootPool = CONFIG.TREASURE_CHEST.UNCOMMON_LOOT;
    } else {
        // Common loot for low difficulty
        lootPool = CONFIG.TREASURE_CHEST.COMMON_LOOT;
    }
    
    // Choose 2-3 rewards from the loot pool
    const numRewards = 2 + (Math.random() < 0.5 ? 1 : 0);
    const rewards = [];
    
    for (let i = 0; i < numRewards; i++) {
        // Select a random loot item
        const lootItem = lootPool[Math.floor(Math.random() * lootPool.length)];
        
        // Process based on loot type
        if (lootItem.type === 'coins') {
            // Random amount of coins within range
            const amount = Math.floor(
                lootItem.value[0] + Math.random() * (lootItem.value[1] - lootItem.value[0])
            );
            player.coins += amount;
            rewards.push(`${amount} coins`);
        } else if (lootItem.type === 'ammo') {
            // Random ammo for a weapon the player has
            const unlockedWeapons = WEAPONS.filter(w => w.unlocked);
            if (unlockedWeapons.length > 0) {
                const weapon = unlockedWeapons[Math.floor(Math.random() * unlockedWeapons.length)];
                const ammoType = weapon.ammoType;
                const ammoConfig = CONFIG.AMMO_TYPES[ammoType];
                
                // Add ammo based on a multiplier of the pack size
                const multiplier = lootItem.value[0] + Math.random() * (lootItem.value[1] - lootItem.value[0]);
                const amount = Math.floor(ammoConfig.packSize * multiplier);
                
                addAmmunition(ammoType, amount);
                rewards.push(`${amount} ${ammoConfig.name}`);
            }
        } else if (lootItem.type === 'health') {
            // Health bonus
            const amount = Math.floor(
                lootItem.value[0] + Math.random() * (lootItem.value[1] - lootItem.value[0])
            );
            player.health = Math.min(player.health + amount, player.maxHealth);
            rewards.push(`${amount} health`);
        } else if (lootItem.type === 'attachment') {
            // Weapon attachment
            if (Math.random() < lootItem.chance) {
                // Filter attachments by rarity
                const availableAttachments = CONFIG.ATTACHMENTS.filter(a => a.rarity === lootItem.rarity);
                
                if (availableAttachments.length > 0) {
                    // Find a compatible weapon that has free slots
                    const unlockedWeapons = WEAPONS.filter(w => 
                        w.unlocked && w.attachments.length < w.attachmentSlots
                    );
                    
                    if (unlockedWeapons.length > 0) {
                        // Try to find a compatible attachment
                        let compatibleFound = false;
                        let attempts = 0;
                        
                        while (!compatibleFound && attempts < 10) {
                            attempts++;
                            const weapon = unlockedWeapons[Math.floor(Math.random() * unlockedWeapons.length)];
                            
                            // Find compatible attachments for this weapon
                            const compatibleAttachments = availableAttachments.filter(a => 
                                a.compatibleWeapons.includes(weapon.id) && 
                                !weapon.attachments.includes(a.id)
                            );
                            
                            if (compatibleAttachments.length > 0) {
                                const attachment = compatibleAttachments[Math.floor(Math.random() * compatibleAttachments.length)];
                                addAttachmentToWeapon(weapon.id, attachment.id);
                                rewards.push(`${attachment.name} for ${weapon.name}`);
                                compatibleFound = true;
                            }
                        }
                        
                        if (!compatibleFound) {
                            // Fallback to coins if no compatible attachment found
                            const amount = 200 + Math.floor(Math.random() * 300);
                            player.coins += amount;
                            rewards.push(`${amount} coins`);
                        }
                    } else {
                        // Fallback to coins if no weapons with free slots
                        const amount = 200 + Math.floor(Math.random() * 300);
                        player.coins += amount;
                        rewards.push(`${amount} coins`);
                    }
                }
            }
        } else if (lootItem.type === 'torch') {
            // Torches for territory claiming
            addTorches(lootItem.value);
            rewards.push(`${lootItem.value} torch${lootItem.value > 1 ? 'es' : ''}`);
        }
    }
    
    // Show rewards message
    showGameMessage(`Treasure Opened! Found: ${rewards.join(', ')}`);
    
    // Create opening effect
    createTreasureOpenEffect(section.x + CONFIG.SECTION_SIZE / 2, section.y + CONFIG.SECTION_SIZE / 2);
    
    // Update UI
    updateUI();
}

// Create a visual effect for opening a treasure chest
function createTreasureOpenEffect(x, y) {
    // Create expanding circle
    createEffect(
        x,
        y,
        50, // radius
        1, // duration
        'treasureOpen'
    );
    
    // Create particle effects (flying coins/items)
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 20 + Math.random() * 20;
        
        createEffect(
            x,
            y,
            5, // radius
            1, // duration
            'treasureParticle',
            {
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                color: '#FFD700' // Gold
            }
        );
    }
}