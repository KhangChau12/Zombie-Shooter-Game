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
    territoriesClaimed: 0,
    
    // New properties for feature enhancements
    pickupAttractionRange: 100, // Base range for pickup attraction
    pickupAttractionMultiplier: 1.0, // Multiplier for attraction range (upgradeable)
    ammoReserveMultiplier: 1.0 // Multiplier for max ammo reserves
};

// Initialize player for a new game
function initPlayer() {
    // Reset position
    player.x = 0;
    player.y = 0;
    player.startX = 0;
    player.startY = 0;
    
    // Reset stats to starting values
    player.ammoReserveMultiplier = 1.0;
    player.pickupAttractionRange = 100;
    player.pickupAttractionMultiplier = 1.0;
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
        
        // Apply the ammo reserve multiplier to maxReserve
        const adjustedMaxReserve = Math.floor(ammoConfig.maxReserve * player.ammoReserveMultiplier);
        
        player.ammunition[ammoType] = {
            current: 0,
            reserve: Math.floor(adjustedMaxReserve * 0.3) // Start with 30% of max reserve
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
            speedBoost: CONFIG.TERRITORY.SPEED_BOOST * CONFIG.TERRITORY.HOME_BONUS_MULTIPLIER*0.75,
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
    if (!previousInTerritory && !previousInHome && (player.inTerritory || player.inHomeRadius)) {
        // Just entered territory
        createScreenFlash('territory');
        showGameMessage("Entered Safe Territory");
    } else if (previousInTerritory && !player.inTerritory && !player.inHomeRadius) {
        // Just left territory
        showGameMessage("Left Safe Territory");
    }
    
    // Visual feedback for home radius - chỉ khi KHÔNG ở trong territory trước đó
    if (!previousInHome && !previousInTerritory && player.inHomeRadius) {
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

// Add XP and handle level up
function addXP(amount) {
    // Add XP
    player.xp += amount;
    
    // Check if player has reached enough XP to level up
    if (player.xp >= player.xpToNextLevel) {
        // Level up
        player.level++;
        
        // Calculate overflow XP
        const overflowXP = player.xp - player.xpToNextLevel;
        
        // Calculate new XP requirement for next level
        player.xpToNextLevel = Math.floor(CONFIG.XP_TO_FIRST_LEVEL * Math.pow(CONFIG.XP_LEVEL_MULTIPLIER, player.level - 1));
        
        // Apply overflow XP to new level
        player.xp = overflowXP;
        
        // Create level up effect
        createEffect(
            player.x,
            player.y,
            50, // radius
            2, // duration
            'levelUp'
        );
        
        // Create screen flash
        createScreenFlash('level');
        
        // Show level up message
        showGameMessage(`Level ${player.level} reached!`);
        
        // Open level up menu
        showLevelUpMenu();
    }
    
    // Update UI
    updateUI();
}

// Add torches to player inventory
function addTorches(amount) {
    player.torchCount += amount;
    showGameMessage(`+${amount} Torch${amount > 1 ? 'es' : ''} added!`);
    
    // Create torch visual effect at player position
    for (let i = 0; i < Math.min(amount, 3); i++) {
        const angle = (i / 3) * Math.PI * 2;
        const offsetX = Math.cos(angle) * 30;
        const offsetY = Math.sin(angle) * 30;
        
        // Create torch visual effect
        createEffect(
            player.x + offsetX,
            player.y + offsetY,
            15, // radius
            2, // duration
            'torch'
        );
    }
    
    // Update UI
    updateUI();
}

// Add ammunition to player reserves
function addAmmunition(ammoType, amount) {
    if (!player.ammunition[ammoType]) return;
    
    const ammoConfig = CONFIG.AMMO_TYPES[ammoType];
    if (!ammoConfig) return;
    
    // Add ammo to reserves, capped at maximum
    player.ammunition[ammoType].reserve = Math.min(
        player.ammunition[ammoType].reserve + amount,
        ammoConfig.maxReserve
    );
    
    // Update UI
    updateUI();
}

// Place a torch at player's position
function placeTorch() {
    // Check if player has torches
    if (player.torchCount <= 0) {
        showGameMessage("No torches available!");
        return;
    }
    
    // Get current section
    const sectionX = Math.floor(player.x / CONFIG.SECTION_SIZE);
    const sectionY = Math.floor(player.y / CONFIG.SECTION_SIZE);
    
    // Find the section object
    const section = mapSections.find(s => 
        Math.floor(s.x / CONFIG.SECTION_SIZE) === sectionX && 
        Math.floor(s.y / CONFIG.SECTION_SIZE) === sectionY
    );
    
    // Only allow placing torches in cleared sections
    if (!section || !section.isCleared) {
        showGameMessage("Clear this area of zombies first!");
        createScreenFlash('damage'); // Thêm hiệu ứng flash đỏ để cảnh báo
        return;
    }
    
    // Check if this section is already territory
    if (section.isTerritory) {
        showGameMessage("This section is already claimed territory.");
        return;
    }
    
    // Check if we're near an existing torch (avoid placing too close)
    const sectionCenterX = section.x + CONFIG.SECTION_SIZE / 2;
    const sectionCenterY = section.y + CONFIG.SECTION_SIZE / 2;
    const isLeftHalf = player.x < sectionCenterX;
    const isTopHalf = player.y < sectionCenterY;
    
    let currentQuadrant = "";
    if (isTopHalf && isLeftHalf) currentQuadrant = "top-left";
    else if (isTopHalf && !isLeftHalf) currentQuadrant = "top-right";
    else if (!isTopHalf && isLeftHalf) currentQuadrant = "bottom-left";
    else currentQuadrant = "bottom-right";
    
    // Check if there's already a torch in this quadrant
    if (section.torches) {
        let quadrantHasTorch = false;
        
        for (const torch of section.torches) {
            const torchIsLeftHalf = torch.x < sectionCenterX;
            const torchIsTopHalf = torch.y < sectionCenterY;
            
            let torchQuadrant = "";
            if (torchIsTopHalf && torchIsLeftHalf) torchQuadrant = "top-left";
            else if (torchIsTopHalf && !torchIsLeftHalf) torchQuadrant = "top-right";
            else if (!torchIsTopHalf && torchIsLeftHalf) torchQuadrant = "bottom-left";
            else torchQuadrant = "bottom-right";
            
            if (torchQuadrant === currentQuadrant) {
                quadrantHasTorch = true;
                break;
            }
        }
        
        if (quadrantHasTorch) {
            showGameMessage(`A torch is already placed in the ${currentQuadrant} quadrant!`);
            return;
        }
    }
    
    // For backward compatibility, still check minimum distance
    const minTorchDistance = 100; // Minimum distance between torches
    
    // Existing torches in this section
    if (section.torches) {
        for (const torch of section.torches) {
            const dist = distance(player.x, player.y, torch.x, torch.y);
            if (dist < minTorchDistance) {
                showGameMessage("Too close to another torch!");
                return;
            }
        }
    }
    
    // Initialize torches array if not exists
    if (!section.torches) {
        section.torches = [];
    }
    
    // Add torch at player position
    section.torches.push({
        x: player.x,
        y: player.y,
        radius: CONFIG.TERRITORY.TORCH_RADIUS,
        lightRadius: CONFIG.TERRITORY.TORCH_LIGHT_RADIUS,
        time: performance.now()
    });
    
    // Decrease torch count
    player.torchCount--;
    
    // Create torch placement effect
    createEffect(
        player.x,
        player.y,
        CONFIG.TERRITORY.TORCH_LIGHT_RADIUS,
        1, // duration
        'torchActivate'
    );
    
    // Check if territory can be claimed (4 torches needed)
    if (section.torches.length >= 4) {
        claimTerritory(section);
    } else {
        showGameMessage(`Torch placed! ${4 - section.torches.length} more needed to claim territory.`);
    }
    
    // Update UI
    updateUI();
}

// Claim a section as territory
function claimTerritory(section) {
    // Mark section as territory
    section.isTerritory = true;
    
    // Update player stats
    player.territoriesClaimed++;
    
    // Create territory claim effect
    createEffect(
        section.x + CONFIG.SECTION_SIZE / 2,
        section.y + CONFIG.SECTION_SIZE / 2,
        CONFIG.SECTION_SIZE / 2,
        2, // duration
        'territoryClaim'
    );
    
    // Create screen flash
    createScreenFlash('territory');
    
    // Show message
    showGameMessage("Territory claimed! You gain health regen and other bonuses inside.");
    
    // Thêm hiệu ứng phần thưởng
    // XP bonus
    const xpBonus = 50 * player.level;
    addXP(xpBonus);
    
    // Hiệu ứng văn bản
    createFloatingText(
        section.x + CONFIG.SECTION_SIZE / 2,
        section.y + CONFIG.SECTION_SIZE / 2 - 20,
        `+${xpBonus} XP BONUS!`,
        '#00FF00',
        3
    );
    
    // Hiệu ứng hồi máu ngay lập tức
    const healthBonus = Math.min(player.maxHealth * 0.2, player.maxHealth - player.health);
    if (healthBonus > 0) {
        player.health += healthBonus;
        
        createFloatingText(
            section.x + CONFIG.SECTION_SIZE / 2,
            section.y + CONFIG.SECTION_SIZE / 2,
            `+${Math.ceil(healthBonus)} HEALTH`,
            '#FF0000',
            3
        );
    }
    
    // Update UI
    updateUI();
}

// Áp dụng nâng cấp cho nhân vật
// Bổ sung hiệu ứng trực quan cho tất cả loại nâng cấp trong function applyStatUpgrade
function applyStatUpgrade(upgrade) {
    // Kiểm tra xem thuộc tính tồn tại chưa
    if (!(upgrade.property in player)) {
        console.error(`Property ${upgrade.property} does not exist on player`);
        return false;
    }
   
    // Áp dụng nâng cấp dựa trên loại
    if (upgrade.value) {
        // Trường hợp tăng giá trị cố định
        player[upgrade.property] += upgrade.value;
       
        // Giới hạn giá trị tối đa nếu có
        if (upgrade.max && player[upgrade.property] > upgrade.max) {
            player[upgrade.property] = upgrade.max;
        }
       
        // Hồi máu nếu đặt thuộc tính healOnUpgrade
        if (upgrade.healOnUpgrade && upgrade.property === 'maxHealth') {
            player.health += upgrade.value;
        }
    } else if (upgrade.multiplier) {
        // Trường hợp nhân với hệ số
        player[upgrade.property] *= upgrade.multiplier;
    }
    
    // Tạo hiệu ứng nâng cấp tùy chỉnh dựa vào loại nâng cấp
    switch (upgrade.property) {
        case 'baseDamage':
            // Hiệu ứng tăng sát thương cơ bản
            createEffect(
                player.x,
                player.y,
                40, // radius
                1.2, // duration
                'statUpgrade',
                {
                    text: `+${upgrade.value} Damage`,
                    color: '#FF4500' // Màu cam đỏ cho sát thương
                }
            );
            
            // Hiệu ứng vũ khí mạnh hơn
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const distance = 60;
                setTimeout(() => {
                    createEffect(
                        player.x + Math.cos(angle) * distance,
                        player.y + Math.sin(angle) * distance,
                        20, // radius
                        0.8, // duration
                        'muzzleFlash',
                        {
                            color: '#FF4500'
                        }
                    );
                }, i * 100);
            }
            break;
            
        case 'critChance':
            // Hiệu ứng tăng tỉ lệ chí mạng
            createEffect(
                player.x,
                player.y,
                40, // radius
                1.2, // duration
                'statUpgrade',
                {
                    text: `+${upgrade.value}% Crit`,
                    color: '#FFD700' // Màu vàng gold cho chí mạng
                }
            );
            
            // Hiệu ứng lấp lánh chí mạng
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 30 + Math.random() * 50;
                setTimeout(() => {
                    createEffect(
                        player.x + Math.cos(angle) * distance,
                        player.y + Math.sin(angle) * distance,
                        8 + Math.random() * 5, // radius
                        0.7 + Math.random() * 0.5, // duration
                        'critHit',
                        {
                            color: '#FFD700'
                        }
                    );
                }, i * 50 + Math.random() * 200);
            }
            break;
            
        case 'maxHealth':
            // Hiệu ứng tăng máu tối đa
            createEffect(
                player.x,
                player.y,
                40, // radius
                1.2, // duration
                'statUpgrade',
                {
                    text: `+${upgrade.value} Health`,
                    color: '#FF0000' // Màu đỏ cho máu
                }
            );
            
            // Hiệu ứng phục hồi tim
            createEffect(
                player.x,
                player.y,
                50, // radius
                1.5, // duration
                'healthPulse',
                {
                    color: 'rgba(255, 0, 0, 0.3)'
                }
            );
            
            // Các trái tim nhỏ bay lên
            for (let i = 0; i < 8; i++) {
                const offsetX = (Math.random() - 0.5) * 60;
                const offsetY = (Math.random() - 0.5) * 60;
                setTimeout(() => {
                    createEffect(
                        player.x + offsetX,
                        player.y + offsetY,
                        10, // radius
                        1.2, // duration
                        'floatingHeart',
                        {
                            text: '❤️',
                            dy: -40 - Math.random() * 20
                        }
                    );
                }, i * 120);
            }
            break;
            
        case 'speed':
            // Hiệu ứng tăng tốc độ
            createEffect(
                player.x,
                player.y,
                40, // radius
                1.2, // duration
                'statUpgrade',
                {
                    text: `+10% Speed`,
                    color: '#00BFFF' // Màu xanh da trời cho tốc độ
                }
            );
            
            // Hiệu ứng đường chạy tốc độ
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                setTimeout(() => {
                    createEffect(
                        player.x,
                        player.y,
                        80, // radius
                        0.7, // duration
                        'speedLines',
                        {
                            angle: angle,
                            color: 'rgba(0, 191, 255, 0.5)'
                        }
                    );
                }, i * 30);
            }
            break;
            
        case 'pickupAttractionMultiplier':
            // Hiệu ứng tăng phạm vi hút
            createEffect(
                player.x,
                player.y,
                40, // radius
                1.2, // duration
                'statUpgrade',
                {
                    text: `+20% Pickup Range`,
                    color: '#FFFFFF' // Màu trắng cho phạm vi hút
                }
            );
            
            // Hiệu ứng vòng tròn mở rộng
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    createEffect(
                        player.x,
                        player.y,
                        player.pickupAttractionRange * player.pickupAttractionMultiplier,
                        1.5, // duration
                        'ring',
                        {
                            color: 'rgba(255, 255, 255, 0.3)'
                        }
                    );
                }, i * 300);
            }
            
            // Hiệu ứng các vật phẩm nhỏ bay về người chơi
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = player.pickupAttractionRange * 0.8;
                const endDistance = 20;
                
                setTimeout(() => {
                    const startX = player.x + Math.cos(angle) * distance;
                    const startY = player.y + Math.sin(angle) * distance;
                    const endX = player.x + Math.cos(angle) * endDistance;
                    const endY = player.y + Math.sin(angle) * endDistance;
                    
                    createEffect(
                        startX,
                        startY,
                        5, // radius
                        0.8, // duration
                        'movingPickup',
                        {
                            targetX: endX,
                            targetY: endY,
                            color: i % 3 === 0 ? '#FF0000' : (i % 3 === 1 ? '#FFD700' : '#4169E1')
                        }
                    );
                }, i * 50);
            }
            break;
            
        case 'ammoReserveMultiplier':
            // Hiệu ứng tăng đạn dự trữ
            createEffect(
                player.x,
                player.y,
                40, // radius
                1.2, // duration
                'statUpgrade',
                {
                    text: `+20% Ammo Capacity`,
                    color: '#FFDD00' // Màu vàng cho đạn
                }
            );
            
            // Hiệu ứng hộp đạn xung quanh
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const distance = 50;
                setTimeout(() => {
                    createEffect(
                        player.x + Math.cos(angle) * distance,
                        player.y + Math.sin(angle) * distance,
                        15, // radius
                        1, // duration
                        'ammoBox',
                        {
                            color: '#FFDD00'
                        }
                    );
                }, i * 75);
            }
            break;
            
        default:
            // Hiệu ứng mặc định cho các nâng cấp khác
            createEffect(
                player.x,
                player.y,
                40, // radius
                1, // duration
                'statUpgrade',
                {
                    text: `${upgrade.name} +`,
                    color: '#00FF00'
                }
            );
            break;
    }
    
    // Cập nhật UI
    updateUI();
    
    return true;
}

// Xử lý người chơi bị tấn công
function damagePlayer(damage) {
    // Kiểm tra xem người chơi có đang bất tử không
    if (player.invincible) return;
    
    // Áp dụng áo giáp trước (nếu có)
    if (player.armor > 0) {
        // Giáp hấp thụ 50% sát thương
        const armorAbsorption = 0.5;
        const damageTaken = damage * armorAbsorption;
        
        // Giảm giáp dựa trên sát thương được hấp thụ
        player.armor -= damageTaken;
        
        // Nếu giáp hết, phần sát thương còn lại chuyển sang máu
        if (player.armor < 0) {
            // Phần sát thương vượt quá giáp
            const remainingDamage = -player.armor;
            player.armor = 0;
            
            // Trừ máu người chơi
            player.health -= remainingDamage + (damage * (1 - armorAbsorption));
        } else {
            // Giáp vẫn còn, trừ máu với phần không được hấp thụ
            player.health -= damage * (1 - armorAbsorption);
        }
    } else {
        // Không có giáp, trừ toàn bộ sát thương vào máu
        player.health -= damage;
    }
    
    // Kiểm tra game over
    if (player.health <= 0) {
        player.health = 0;
        gameOver();
        return;
    }
    
    // Kích hoạt thời gian bất tử sau khi bị tấn công
    player.invincible = true;
    player.invincibleTimer = 0;
    
    // Tạo hiệu ứng bị tấn công
    createScreenFlash('damage');
    
    // Hiển thị lượng sát thương
    createEffect(
        player.x,
        player.y - player.radius - 20,
        10,
        0.7,
        'floatingText',
        {
            text: `-${Math.round(damage)}`,
            color: '#FF0000',
            dy: -30
        }
    );
    
    // Chơi âm thanh bị đánh
    // playSound('playerHit');
    
    // Cập nhật UI
    updateUI();
}