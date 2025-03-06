// Player class and related functionality

// Initialize player object
const player = {
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    startSectionX: 0,
    startSectionY: 0,
    radius: CONFIG.PLAYER_START_STATS.radius,
    speed: CONFIG.PLAYER_START_STATS.speed,
    health: CONFIG.PLAYER_START_STATS.health,
    maxHealth: CONFIG.PLAYER_START_STATS.maxHealth,
    armor: CONFIG.PLAYER_START_STATS.armor,
    maxArmor: CONFIG.PLAYER_START_STATS.maxArmor,
    level: 1,
    xp: 0,
    xpToNextLevel: CONFIG.XP_TO_FIRST_LEVEL,
    coins: 0,
    kills: 0,
    exploredSections: new Set(),
    rotation: 0,
    invincible: false,
    invincibleTimer: 0,
    invincibleDuration: 500, // ms of invincibility after taking damage
    lastDamageTime: 0,
    
    // Base stats for character progression
    baseDamage: CONFIG.PLAYER_START_STATS.baseDamage,
    critChance: CONFIG.PLAYER_START_STATS.critChance,
    critMultiplier: CONFIG.PLAYER_START_STATS.critMultiplier,
    
    // Current active weapon
    activeWeaponId: 'pistol',
    weapon: null, // Will be populated with actual weapon object
    
    // Shooting state
    reloading: false,
    reloadStart: 0,
    lastFired: 0,
    
    // Movement state
    moving: false,
    movementAngle: 0,
    
    // Game start time for survival timer
    gameStartTime: 0
};

// Initialize player for a new game
function initPlayer() {
    // Reset position
    player.x = 0;
    player.y = 0;
    player.startX = 0;
    player.startY = 0;
    
    // Reset stats to starting values
    player.radius = CONFIG.PLAYER_START_STATS.radius;
    player.speed = CONFIG.PLAYER_START_STATS.speed;
    player.health = CONFIG.PLAYER_START_STATS.health;
    player.maxHealth = CONFIG.PLAYER_START_STATS.maxHealth;
    player.armor = CONFIG.PLAYER_START_STATS.armor;
    player.maxArmor = CONFIG.PLAYER_START_STATS.maxArmor;
    player.level = 1;
    player.xp = 0;
    player.xpToNextLevel = CONFIG.XP_TO_FIRST_LEVEL;
    player.coins = 0;
    player.kills = 0;
    player.exploredSections = new Set();
    player.rotation = 0;
    player.invincible = false;
    player.invincibleTimer = 0;
    
    // Reset base stats
    player.baseDamage = CONFIG.PLAYER_START_STATS.baseDamage;
    player.critChance = CONFIG.PLAYER_START_STATS.critChance;
    player.critMultiplier = CONFIG.PLAYER_START_STATS.critMultiplier;
    
    // Reset weapon to pistol
    player.activeWeaponId = 'pistol';
    
    // Reset all weapon upgrades
    WEAPONS.forEach(weapon => {
        weapon.upgrades = {
            damage: 0,
            fireRate: 0,
            spread: 0,
            reloadTime: 0,
            maxAmmo: 0
        };
        
        // Reset unlocked status except for pistol
        if (weapon.id !== 'pistol') {
            weapon.unlocked = false;
        }
    });
    
    // Create actual weapon object from base weapon data
    player.weapon = createWeapon(player.activeWeaponId);
    
    // Initialize weapon state
    player.reloading = false;
    player.reloadStart = 0;
    player.lastFired = 0;
    
    // Set game start time
    player.gameStartTime = performance.now();
}

// Update player state
function updatePlayer(deltaTime) {
    // Handle invincibility frames
    if (player.invincible) {
        player.invincibleTimer += deltaTime * 1000; // Convert to ms
        if (player.invincibleTimer >= player.invincibleDuration) {
            player.invincible = false;
            player.invincibleTimer = 0;
        }
    }
    
    // Handle reloading
    if (player.reloading) {
        const currentTime = performance.now();
        if (currentTime - player.reloadStart >= player.weapon.reloadTime) {
            player.reloading = false;
            player.weapon.ammo = player.weapon.maxAmmo;
            updateUI();
            
            // Play reload complete sound
            // playSound('reloadComplete');
        }
    }
}

// Handle player movement based on input
function movePlayer(deltaTime) {
    // Calculate movement vector from key states
    let dx = 0;
    let dy = 0;
    
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
    
    // Normalize movement vector if moving diagonally
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
        
        // Set movement state
        player.moving = true;
        player.movementAngle = Math.atan2(dy, dx);
    } else if (dx !== 0 || dy !== 0) {
        // Set movement state for cardinal directions
        player.moving = true;
        player.movementAngle = Math.atan2(dy, dx);
    } else {
        // Not moving
        player.moving = false;
    }
    
    // Apply movement
    player.x += dx * player.speed;
    player.y += dy * player.speed;
}

// Try to shoot based on player weapon and state
function tryShoot() {
    const currentTime = performance.now();
    
    // Check if can shoot (not reloading, weapon ready, has ammo)
    if (!player.reloading && 
        currentTime - player.lastFired >= player.weapon.fireRate && 
        player.weapon.ammo > 0) {
        
        player.lastFired = currentTime;
        player.weapon.ammo--;
        
        // Calculate bullet start position at edge of player
        const bulletStartX = player.x + Math.cos(player.rotation) * (player.radius + 5);
        const bulletStartY = player.y + Math.sin(player.rotation) * (player.radius + 5);
        
        // Create bullet(s) based on weapon type
        if (player.weapon.id === 'shotgun') {
            // Shotgun fires multiple pellets with spread
            for (let i = 0; i < player.weapon.pellets; i++) {
                const spread = (Math.random() - 0.5) * player.weapon.spread;
                const angle = player.rotation + spread;
                
                // Calculate damage with potential critical hit
                let damage = player.weapon.damage;
                let isCritical = false;
                
                if (Math.random() * 100 < player.critChance) {
                    damage *= player.critMultiplier;
                    isCritical = true;
                }
                
                // Add base damage
                damage += player.baseDamage;
                
                // Create bullet
                createBullet(
                    bulletStartX, 
                    bulletStartY, 
                    Math.cos(angle), 
                    Math.sin(angle),
                    damage,
                    player.weapon.bulletSpeed,
                    player.weapon.bulletSize,
                    player.weapon.bulletLifetime,
                    isCritical
                );
            }
        } else {
            // Standard weapon fires a single bullet
            // Apply spread if weapon has it
            const spread = (Math.random() - 0.5) * player.weapon.spread;
            const angle = player.rotation + spread;
            
            // Calculate damage with potential critical hit
            let damage = player.weapon.damage;
            let isCritical = false;
            
            if (Math.random() * 100 < player.critChance) {
                damage *= player.critMultiplier;
                isCritical = true;
            }
            
            // Add base damage
            damage += player.baseDamage;
            
            // Create bullet
            createBullet(
                bulletStartX, 
                bulletStartY, 
                Math.cos(angle), 
                Math.sin(angle),
                damage,
                player.weapon.bulletSpeed,
                player.weapon.bulletSize,
                player.weapon.bulletLifetime,
                isCritical
            );
        }
        
        // Add muzzle flash effect
        createEffect(
            bulletStartX,
            bulletStartY,
            10, // radius
            0.1, // duration in seconds
            'muzzleFlash',
            { color: player.weapon.color || '#FFDD00' }
        );
        
        // Apply recoil
        player.x -= Math.cos(player.rotation) * 2;
        player.y -= Math.sin(player.rotation) * 2;
        
        // Auto-reload if out of ammo
        if (player.weapon.ammo === 0) {
            startReload();
        }
        
        // Update UI
        updateUI();
        
        // Return true if shot was fired
        return true;
    }
    
    return false;
}

// Start reloading the current weapon
function startReload() {
    if (!player.reloading && player.weapon.ammo < player.weapon.maxAmmo) {
        player.reloading = true;
        player.reloadStart = performance.now();
        
        // Play reload sound
        // playSound('reloadStart');
    }
}

// Switch to a different weapon
function switchWeapon(weaponId) {
    // Find the weapon
    const weaponData = WEAPONS.find(w => w.id === weaponId);
    
    // Check if weapon exists and is unlocked
    if (weaponData && weaponData.unlocked) {
        // Cancel any current reload
        player.reloading = false;
        
        // Set the new active weapon
        player.activeWeaponId = weaponId;
        
        // Create weapon instance with current upgrades
        player.weapon = createWeapon(weaponId);
        
        // Update UI
        updateUI();
        
        // Play weapon switch sound
        // playSound('weaponSwitch');
        
        return true;
    }
    
    return false;
}

// Apply damage to player (handles armor calculation)
function damagePlayer(amount) {
    // Skip if player is invincible
    if (player.invincible) return;
    
    // Apply damage to armor first, then health
    if (player.armor > 0) {
        // Armor absorbs 50% of damage
        const armorDamage = Math.min(player.armor, amount * 0.5);
        player.armor -= armorDamage;
        amount -= armorDamage;
    }
    
    // Apply remaining damage to health
    player.health -= amount;
    
    // Make player briefly invincible
    player.invincible = true;
    player.invincibleTimer = 0;
    player.lastDamageTime = performance.now();
    
    // Play damage sound
    // playSound('playerDamage');
    
    // Create screen flash effect
    createScreenFlash('damage');
    
    // Update UI
    updateUI();
    
    // Check if player died
    if (player.health <= 0) {
        gameOver();
    }
}

// Add XP to player and check for level up
function addXP(amount) {
    player.xp += amount;
    
    // Check for level up
    if (player.xp >= player.xpToNextLevel) {
        levelUp();
    }
    
    // Update UI
    updateUI();
}

// Level up player
function levelUp() {
    player.level++;
    player.xp -= player.xpToNextLevel;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * CONFIG.XP_LEVEL_MULTIPLIER);
    
    // Show level up UI
    showLevelUpMenu();
    
    // Play level up sound
    // playSound('levelUp');
    
    // Create level up visual effect
    createEffect(
        player.x,
        player.y,
        50, // radius
        1.0, // duration
        'levelUp'
    );
    
    // Update UI
    updateUI();
}

// Apply a stat upgrade to the player
function applyStatUpgrade(upgradeType) {
    const property = upgradeType.property;
    
    // Apply the upgrade based on type
    if (upgradeType.value) {
        // Add a fixed value
        player[property] += upgradeType.value;
        
        // Check if there's a maximum value
        if (upgradeType.max && player[property] > upgradeType.max) {
            player[property] = upgradeType.max;
        }
        
        // If this is a health upgrade, also heal the player
        if (upgradeType.healOnUpgrade && property === 'maxHealth') {
            player.health += upgradeType.value;
        }
    } else if (upgradeType.multiplier) {
        // Apply a multiplier
        player[property] *= upgradeType.multiplier;
    }
    
    // Update UI
    updateUI();
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