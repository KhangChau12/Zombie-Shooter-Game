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
        lastSpawnTime: 0
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
        
        // Create a new section with difficulty based on distance from start
        const newSection = {
            x: sectionX * CONFIG.SECTION_SIZE,
            y: sectionY * CONFIG.SECTION_SIZE,
            difficulty: sectionDifficulty,
            zombiesDensity: Math.min(1, CONFIG.ZOMBIE_DENSITY_BASE + distanceFromStart * CONFIG.ZOMBIE_DENSITY_MULTIPLIER),
            lastSpawnTime: 0
        };
        
        mapSections.push(newSection);
        
        // Update UI to show number of sections explored
        document.getElementById('explored').textContent = player.exploredSections.size;
        
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
            
            // Color based on difficulty
            ctx.strokeStyle = getDifficultyColor(section.difficulty, 0.5);
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, CONFIG.SECTION_SIZE, CONFIG.SECTION_SIZE);
            
            // Draw difficulty number in center of section
            ctx.fillStyle = getDifficultyColor(section.difficulty, 0.7);
            ctx.font = '14px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${section.difficulty}`, 
                screenX + CONFIG.SECTION_SIZE/2, 
                screenY + CONFIG.SECTION_SIZE/2
            );
        }
    });
    
    // Draw special marker at starting point
    const startScreenX = player.startX - cameraX;
    const startScreenY = player.startY - cameraY;
    
    if (startScreenX >= -50 && startScreenX <= canvas.width + 50 &&
        startScreenY >= -50 && startScreenY <= canvas.height + 50) {
        
        // Draw circular area
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)'; // Gold with low opacity
        ctx.beginPath();
        ctx.arc(startScreenX, startScreenY, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw center marker
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // Brighter gold
        ctx.beginPath();
        ctx.arc(startScreenX, startScreenY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw "STARTING POINT" text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('STARTING POINT', startScreenX, startScreenY - 20);
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
    
    // Draw origin marker (starting point)
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
        
        // Color based on difficulty
        minimapCtx.fillStyle = getDifficultyColor(section.difficulty, 0.7);
        
        // Size based on difficulty
        const sectionSize = Math.min(CONFIG.SECTION_SIZE * scale, 10 + section.difficulty);
        
        minimapCtx.fillRect(
            mmX - sectionSize/2,
            mmY - sectionSize/2,
            sectionSize,
            sectionSize
        );
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