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
    
    // Weapon system enhancements
    equippedWeapons: [], // Array of weapon IDs that are equipped
    activeWeaponIndex: 0, // Index of currently active weapon in equippedWeapons

    // Current active weapon
    activeWeaponId: 'pistol',
    weapon: null, // Will be populated with actual weapon object
    
    // Ammunition system
    ammunition: {}, // Will be populated with ammo for each weapon type
    
    // Territory system
    torchCount: CONFIG.TERRITORY.TORCH_INITIAL,
    inTerritory: false,
    inHomeRadius: false,
    territoryBonus: {
        active: false,
        healthRegen: 0,
        speedBoost: 0,
        damageBoost: 0
    },
    territorySectionKey: null, // Current territory section player is in
    lastHealthRegen: 0, // Time of last health regeneration
    
    // Shooting state
    reloading: false,
    reloadStart: 0,
    lastFired: 0,
    
    // Movement state
    moving: false,
    movementAngle: 0,
    
    // Game start time for survival timer
    gameStartTime: 0,
    
    // Statistics
    sectionCleared: 0,
    territoriesClaimed: 0
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
    
    // Reset territory system
    player.torchCount = CONFIG.TERRITORY.TORCH_INITIAL;
    player.inTerritory = false;
    player.inHomeRadius = false;
    player.territoryBonus = {
        active: false,
        healthRegen: 0,
        speedBoost: 0,
        damageBoost: 0
    };
    player.territorySectionKey = null;
    player.lastHealthRegen = 0;
    
    // Reset base stats
    player.baseDamage = CONFIG.PLAYER_START_STATS.baseDamage;
    player.critChance = CONFIG.PLAYER_START_STATS.critChance;
    player.critMultiplier = CONFIG.PLAYER_START_STATS.critMultiplier;
    
    // Reset equipped weapons
    player.equippedWeapons = ['pistol'];
    player.activeWeaponIndex = 0;
    player.activeWeaponId = 'pistol';
    
    // Initialize ammunition for all weapon types
    initializeAmmunition();
    
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
        
        // Reset attachments
        weapon.attachments = [];
    });
    
    // Create actual weapon object from base weapon data
    player.weapon = createWeapon(player.activeWeaponId);
    
    // Initialize weapon state
    player.reloading = false;
    player.reloadStart = 0;
    player.lastFired = 0;
    
    // Reset statistics
    player.sectionCleared = 0;
    player.territoriesClaimed = 0;
    
    // Set game start time
    player.gameStartTime = performance.now();
}

// Initialize ammunition for all weapon types
function initializeAmmunition() {
    player.ammunition = {};
    
    // Initialize ammo for each ammo type in config
    for (const ammoType in CONFIG.AMMO_TYPES) {
        const ammoConfig = CONFIG.AMMO_TYPES[ammoType];
        player.ammunition[ammoType] = {
            current: 0,
            reserve: Math.floor(ammoConfig.maxReserve * 0.3) // Start with 30% of max reserve
        };
    }
    
    // Ensure starting weapon has full ammo
    const pistolWeapon = WEAPONS.find(w => w.id === 'pistol');
    if (pistolWeapon) {
        player.ammunition.pistol.current = pistolWeapon.maxAmmo;
    }
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
            completeReload();
        }
    }
    
    // Apply territory effects (health regeneration)
    if (player.inTerritory || player.inHomeRadius) {
        const currentTime = performance.now();
        const regenInterval = 1000; // 1 second between regeneration ticks
        
        if (currentTime - player.lastHealthRegen >= regenInterval) {
            player.lastHealthRegen = currentTime;
            
            // Calculate regeneration amount
            let regenAmount = CONFIG.TERRITORY.HEALTH_REGEN;
            
            // Apply home radius bonus if applicable
            if (player.inHomeRadius) {
                regenAmount *= CONFIG.TERRITORY.HOME_BONUS_MULTIPLIER;
            }
            
            // Apply health regeneration
            if (player.health < player.maxHealth) {
                player.health = Math.min(player.health + regenAmount, player.maxHealth);
                updateUI();
            }
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
    
    // Apply territory speed boost if active
    let speedMultiplier = 1;
    if (player.territoryBonus.active) {
        speedMultiplier = player.territoryBonus.speedBoost;
    }
    
    // Apply movement with fixed speed (adjusted for territory bonus)
    const speed = player.speed * speedMultiplier;
    player.x += dx * speed;
    player.y += dy * speed;
    
    // Check if player is in a claimed territory or home radius
    checkTerritoryEffects();
}

// Check and apply territory effects for player
function checkTerritoryEffects() {
    // Reset territory statuses
    const previousInTerritory = player.inTerritory;
    const previousInHome = player.inHomeRadius;
    
    player.inTerritory = false;
    player.inHomeRadius = false;
    
    // Check if in home radius first (higher priority)
    const distanceFromHome = Math.sqrt(
        Math.pow(player.x - player.startX, 2) + 
        Math.pow(player.y - player.startY, 2)
    );
    
    if (distanceFromHome <= CONFIG.TERRITORY.HOME_RADIUS) {
        player.inHomeRadius = true;
        
        // Set territory bonuses (higher in home radius)
        player.territoryBonus = {
            active: true,
            healthRegen: CONFIG.TERRITORY.HEALTH_REGEN * CONFIG.TERRITORY.HOME_BONUS_MULTIPLIER,
            speedBoost: CONFIG.TERRITORY.SPEED_BOOST * CONFIG.TERRITORY.HOME_BONUS_MULTIPLIER,
            damageBoost: CONFIG.TERRITORY.DAMAGE_BOOST * CONFIG.TERRITORY.HOME_BONUS_MULTIPLIER
        };
    } else {
        // Check if in a claimed territory
        const sectionX = Math.floor(player.x / CONFIG.SECTION_SIZE);
        const sectionY = Math.floor(player.y / CONFIG.SECTION_SIZE);
        const sectionKey = `${sectionX},${sectionY}`;
        
        // Find section in mapSections
        const currentSection = mapSections.find(s => 
            Math.floor(s.x / CONFIG.SECTION_SIZE) === sectionX && 
            Math.floor(s.y / CONFIG.SECTION_SIZE) === sectionY
        );
        
        if (currentSection && currentSection.isTerritory) {
            player.inTerritory = true;
            player.territorySectionKey = sectionKey;
            
            // Set standard territory bonuses
            player.territoryBonus = {
                active: true,
                healthRegen: CONFIG.TERRITORY.HEALTH_REGEN,
                speedBoost: CONFIG.TERRITORY.SPEED_BOOST,
                damageBoost: CONFIG.TERRITORY.DAMAGE_BOOST
            };
        } else {
            // Not in any territory
            player.territoryBonus = {
                active: false,
                healthRegen: 0,
                speedBoost: 1,
                damageBoost: 1
            };
        }
    }
    
    // Visual feedback when entering/leaving territory
    if (!previousInTerritory && (player.inTerritory || player.inHomeRadius)) {
        // Just entered territory
        createScreenFlash('territory');
        showGameMessage("Entered Safe Territory");
    } else if (previousInTerritory && !player.inTerritory && !player.inHomeRadius) {
        // Just left territory
        showGameMessage("Left Safe Territory");
    }
    
    // Visual feedback for home radius
    if (!previousInHome && player.inHomeRadius) {
        showGameMessage("Entered Home Zone");
    }
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
        
        // Update current ammo in ammunition system
        if (player.weapon.ammoType) {
            player.ammunition[player.weapon.ammoType].current = player.weapon.ammo;
        }
        
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
                
                // Apply territory damage boost
                if (player.territoryBonus.active) {
                    damage *= player.territoryBonus.damageBoost;
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
            
            // Apply territory damage boost
            if (player.territoryBonus.active) {
                damage *= player.territoryBonus.damageBoost;
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
        // Check if we have reserve ammo for this weapon
        const ammoType = player.weapon.ammoType;
        
        if (!player.ammunition[ammoType] || player.ammunition[ammoType].reserve <= 0) {
            // No reserve ammo, can't reload
            showGameMessage("No reserve ammo!");
            return;
        }
        
        player.reloading = true;
        player.reloadStart = performance.now();
        
        // Play reload sound
        // playSound('reloadStart');
        
        // Show reload message
        showGameMessage("Reloading...");
    }
}

// Complete reload process
function completeReload() {
    player.reloading = false;
    
    const ammoType = player.weapon.ammoType;
    
    if (player.ammunition[ammoType]) {
        // Calculate how many bullets we need
        const bulletsNeeded = player.weapon.maxAmmo - player.weapon.ammo;
        
        // Calculate how many bullets we can actually add based on reserves
        const bulletsToAdd = Math.min(bulletsNeeded, player.ammunition[ammoType].reserve);
        
        // Add the bullets to weapon and remove from reserves
        player.weapon.ammo += bulletsToAdd;
        player.ammunition[ammoType].reserve -= bulletsToAdd;
        player.ammunition[ammoType].current = player.weapon.ammo;
        
        // Play reload complete sound
        // playSound('reloadComplete');
        
        // Update UI
        updateUI();
    }
}