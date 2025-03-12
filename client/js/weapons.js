// Weapons System
const WEAPONS = [
    {
        id: 'pistol',
        name: 'Pistol',
        damage: 25,
        fireRate: 350, // ms between shots (lower is faster)
        ammo: 30,
        maxAmmo: 30,
        reloadTime: 2000, // ms
        spread: 0.05, // bullet spread (0 = perfect accuracy)
        bulletSpeed: 2000,
        bulletSize: 6,
        bulletLifetime: 0.7, // seconds
        automatic: false,
        description: 'Standard sidearm with balanced stats.',
        cost: 0,
        unlocked: true,
        color: '#FFD700', // Gold
        ammoType: 'pistol',
        attachmentSlots: 2,
        attachments: [],
        upgrades: {
            damage: 0,
            fireRate: 0,
            spread: 0,
            reloadTime: 0,
            maxAmmo: 0
        }
    },
    {
        id: 'shotgun',
        name: 'Shotgun',
        damage: 15, // per pellet
        fireRate: 800,
        ammo: 8,
        maxAmmo: 8,
        reloadTime: 2500,
        spread: 0.3,
        pellets: 5,
        bulletSpeed: 1600,
        bulletSize: 4.5,
        bulletLifetime: 0.5,
        automatic: false,
        description: 'Powerful at close range. Fires multiple pellets.',
        cost: 1000,
        unlocked: false,
        color: '#FF4500', // OrangeRed
        ammoType: 'shotgun',
        attachmentSlots: 2,
        attachments: [],
        upgrades: {
            damage: 0,
            fireRate: 0,
            spread: 0,
            reloadTime: 0,
            maxAmmo: 0
        }
    },
    {
        id: 'assaultRifle',
        name: 'Assault Rifle',
        damage: 20,
        fireRate: 120,
        ammo: 40,
        maxAmmo: 40,
        reloadTime: 2200,
        spread: 0.08,
        bulletSpeed: 2200,
        bulletSize: 4.5,
        bulletLifetime: 0.8,
        automatic: true,
        description: 'Rapid fire weapon with good all-around stats.',
        cost: 2500,
        unlocked: false,
        color: '#32CD32', // LimeGreen
        ammoType: 'rifle',
        attachmentSlots: 3,
        attachments: [],
        upgrades: {
            damage: 0,
            fireRate: 0,
            spread: 0,
            reloadTime: 0,
            maxAmmo: 0
        }
    },
    {
        id: 'smg',
        name: 'SMG',
        damage: 15,
        fireRate: 80,
        ammo: 60,
        maxAmmo: 60,
        reloadTime: 1800,
        spread: 0.12,
        bulletSpeed: 1900,
        bulletSize: 3,
        bulletLifetime: 0.6,
        automatic: true,
        description: 'High fire rate, low damage per bullet.',
        cost: 3500,
        unlocked: false,
        color: '#1E90FF', // DodgerBlue
        ammoType: 'smg',
        attachmentSlots: 2,
        attachments: [],
        upgrades: {
            damage: 0,
            fireRate: 0,
            spread: 0,
            reloadTime: 0,
            maxAmmo: 0
        }
    },
    {
        id: 'sniperRifle',
        name: 'Sniper Rifle',
        damage: 120,
        fireRate: 1200,
        ammo: 5,
        maxAmmo: 5,
        reloadTime: 3000,
        spread: 0.01,
        bulletSpeed: 3000,
        bulletSize: 7.5,
        bulletLifetime: 1.5,
        automatic: false,
        description: 'High damage, accurate shots at long range.',
        cost: 5000,
        unlocked: false,
        color: '#8A2BE2', // BlueViolet
        ammoType: 'sniper',
        attachmentSlots: 3,
        attachments: [],
        upgrades: {
            damage: 0,
            fireRate: 0,
            spread: 0,
            reloadTime: 0,
            maxAmmo: 0
        }
    }
];

// Create a copy of the weapon with current stats based on upgrades
function createWeapon(weaponId) {
    const baseWeapon = WEAPONS.find(w => w.id === weaponId);
    if (!baseWeapon) return null;
    
    // Create deep copy
    const weapon = JSON.parse(JSON.stringify(baseWeapon));
    
    // Apply upgrades to weapon stats
    if (weapon.upgrades.damage > 0) {
        weapon.damage *= Math.pow(1.15, weapon.upgrades.damage);
    }
    
    if (weapon.upgrades.fireRate > 0) {
        weapon.fireRate *= Math.pow(0.9, weapon.upgrades.fireRate); // Lower is faster
    }
    
    if (weapon.upgrades.spread > 0) {
        weapon.spread *= Math.pow(0.8, weapon.upgrades.spread);
    }
    
    if (weapon.upgrades.reloadTime > 0) {
        weapon.reloadTime *= Math.pow(0.85, weapon.upgrades.reloadTime);
    }
    
    if (weapon.upgrades.maxAmmo > 0) {
        weapon.maxAmmo *= Math.pow(1.25, weapon.upgrades.maxAmmo);
        weapon.maxAmmo = Math.floor(weapon.maxAmmo);
    }
    
    // Apply effects from attachments
    if (weapon.attachments && weapon.attachments.length > 0) {
        for (const attachmentId of weapon.attachments) {
            const attachment = CONFIG.ATTACHMENTS.find(a => a.id === attachmentId);
            
            if (attachment && attachment.effect) {
                if (Array.isArray(attachment.effect)) {
                    // Multiple effects
                    for (const effect of attachment.effect) {
                        applyAttachmentEffect(weapon, effect);
                    }
                } else {
                    // Single effect
                    applyAttachmentEffect(weapon, attachment.effect);
                }
            }
        }
    }
    
    return weapon;
}

// Apply an attachment effect to a weapon
function applyAttachmentEffect(weapon, effect) {
    if (effect.property && effect.multiplier) {
        if (effect.property === 'damage') {
            weapon.damage *= effect.multiplier;
        } else if (effect.property === 'spread') {
            weapon.spread *= effect.multiplier;
        } else if (effect.property === 'fireRate') {
            weapon.fireRate *= effect.multiplier;
        } else if (effect.property === 'reloadTime') {
            weapon.reloadTime *= effect.multiplier;
        } else if (effect.property === 'maxAmmo') {
            weapon.maxAmmo = Math.floor(weapon.maxAmmo * effect.multiplier);
        } else if (effect.property === 'noise') {
            // Noise reduction doesn't affect stats directly but is used in other logic
            weapon.noiseReduction = effect.multiplier;
        }
    }
}

// Calculate effective DPS (damage per second) for a weapon
function calculateWeaponDPS(weapon) {
    const shotsPerSecond = 1000 / weapon.fireRate;
    let damagePerShot = weapon.damage;
    
    // For shotgun, multiply by number of pellets
    if (weapon.pellets) {
        damagePerShot *= weapon.pellets;
    }
    
    return damagePerShot * shotsPerSecond;
}

// Apply weapon upgrade
function applyWeaponUpgrade(weaponId, upgradeType) {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return false;
    
    const property = upgradeType.property;
    
    // Check if max level reached
    if (weapon.upgrades[property] >= upgradeType.maxLevel) {
        return false;
    }
    
    // Apply upgrade
    weapon.upgrades[property]++;
    return true;
}

// Add attachment to weapon
function addAttachmentToWeapon(weaponId, attachmentId) {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return false;
    
    const attachment = CONFIG.ATTACHMENTS.find(a => a.id === attachmentId);
    if (!attachment) return false;
    
    // Check if attachment is compatible with this weapon
    if (!attachment.compatibleWeapons.includes(weaponId)) {
        return false;
    }
    
    // Check if weapon has free attachment slots
    if (weapon.attachments.length >= weapon.attachmentSlots) {
        return false;
    }
    
    // Check if weapon already has this attachment
    if (weapon.attachments.includes(attachmentId)) {
        return false;
    }
    
    // Add attachment
    weapon.attachments.push(attachmentId);
    
    // If this is the active weapon, recreate it to apply attachment effects
    if (player.activeWeaponId === weaponId) {
        player.weapon = createWeapon(weaponId);
    }
    
    return true;
}

// Remove attachment from weapon
function removeAttachmentFromWeapon(weaponId, attachmentId) {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return false;
    
    // Check if weapon has this attachment
    const index = weapon.attachments.indexOf(attachmentId);
    if (index === -1) {
        return false;
    }
    
    // Remove attachment
    weapon.attachments.splice(index, 1);
    
    // If this is the active weapon, recreate it to remove attachment effects
    if (player.activeWeaponId === weaponId) {
        player.weapon = createWeapon(weaponId);
    }
    
    return true;
}

// Get weapon by ID
function getWeaponById(weaponId) {
    return WEAPONS.find(w => w.id === weaponId);
}

// Get all unlocked weapons
function getUnlockedWeapons() {
    return WEAPONS.filter(w => w.unlocked);
}

// Purchase a new weapon
function purchaseWeapon(weaponId) {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    
    if (!weapon || weapon.unlocked || player.coins < weapon.cost) {
        return false;
    }
    
    // Deduct coins
    player.coins -= weapon.cost;
    
    // Unlock weapon
    weapon.unlocked = true;
    
    // Give some initial ammo
    const ammoType = weapon.ammoType;
    if (player.ammunition[ammoType]) {
        const ammoConfig = CONFIG.AMMO_TYPES[ammoType];
        // Give one full magazine of ammo (in the gun) plus one magazine in reserve
        player.ammunition[ammoType].current = weapon.maxAmmo;
        player.ammunition[ammoType].reserve += weapon.maxAmmo;
    }
    
    return true;
}

// Purchase ammunition
function purchaseAmmunition(ammoType) {
    if (!player.ammunition[ammoType]) return false;
    
    const ammoConfig = CONFIG.AMMO_TYPES[ammoType];
    if (!ammoConfig || player.coins < ammoConfig.cost) {
        return false;
    }
    
    // Calculate adjusted max reserve with player's multiplier
    const adjustedMaxReserve = Math.floor(ammoConfig.maxReserve * player.ammoReserveMultiplier);
    
    // Check if already at max reserve
    if (player.ammunition[ammoType].reserve >= adjustedMaxReserve) {
        return false;
    }
    
    // Deduct coins
    player.coins -= ammoConfig.cost;
    
    // Add ammo with new max limit
    player.ammunition[ammoType].reserve = Math.min(
        player.ammunition[ammoType].reserve + ammoConfig.packSize,
        adjustedMaxReserve
    );
    
    // Update UI
    updateUI();
    
    return true;
}

// Find compatible attachments for a weapon
function getCompatibleAttachments(weaponId) {
    return CONFIG.ATTACHMENTS.filter(attachment => 
        attachment.compatibleWeapons.includes(weaponId)
    );
}

// Find equipped attachment by slot for a weapon
function getEquippedAttachmentBySlot(weaponId, slotIndex) {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon || !weapon.attachments || slotIndex >= weapon.attachments.length) {
        return null;
    }
    
    return weapon.attachments[slotIndex];
}

// Get formatted description of all weapon stats
function getWeaponStatsDescription(weapon) {
    // Create weapon instance with all upgrades and attachments
    const weaponInstance = createWeapon(weapon.id);
    
    // Calculate DPS
    const dps = calculateWeaponDPS(weaponInstance);
    
    // Format the description
    let description = `
        Damage: ${Math.round(weaponInstance.damage)}
        Fire Rate: ${(1000 / weaponInstance.fireRate).toFixed(1)} shots/sec
        DPS: ${Math.round(dps)}
        Ammo: ${weaponInstance.maxAmmo}
        Reload Time: ${(weaponInstance.reloadTime / 1000).toFixed(1)}s
        Accuracy: ${Math.round((1 - weaponInstance.spread) * 100)}%
    `;
    
    // Add attachments
    if (weaponInstance.attachments.length > 0) {
        description += `\nAttachments (${weaponInstance.attachments.length}/${weaponInstance.attachmentSlots}):`;
        
        for (const attachmentId of weaponInstance.attachments) {
            const attachment = CONFIG.ATTACHMENTS.find(a => a.id === attachmentId);
            if (attachment) {
                description += `\n- ${attachment.name}`;
            }
        }
    }
    
    return description;
}

// Chức năng chuyển đổi vũ khí
function switchWeapon(weaponId) {
    // Tìm vũ khí theo ID
    const weapon = getWeaponById(weaponId);
    
    // Kiểm tra vũ khí tồn tại và đã mở khóa
    if (!weapon || !weapon.unlocked) return false;
    
    // Cập nhật vũ khí hiện tại
    player.activeWeaponId = weaponId;
    
    // Cập nhật chỉ số active weapon index
    const weaponIndex = player.equippedWeapons.indexOf(weaponId);
    if (weaponIndex !== -1) {
        player.activeWeaponIndex = weaponIndex;
    } else {
        // Nếu vũ khí chưa được trang bị, thêm vào nếu còn slot
        if (player.equippedWeapons.length < 3) {
            player.equippedWeapons.push(weaponId);
            player.activeWeaponIndex = player.equippedWeapons.length - 1;
        } else {
            // Thay thế vũ khí hiện tại
            player.equippedWeapons[player.activeWeaponIndex] = weaponId;
        }
    }
    
    // Tạo object vũ khí mới với các nâng cấp hiện tại
    player.weapon = createWeapon(weaponId);
    
    // Cập nhật số đạn hiện tại nếu có sẵn trong ammunition
    if (player.ammunition[weapon.ammoType]) {
        player.weapon.ammo = player.ammunition[weapon.ammoType].current;
    }
    
    // Cập nhật UI
    updateUI();
    
    // Tạo hiệu ứng chuyển vũ khí
    createEffect(
        player.x,
        player.y,
        30, // radius
        0.3, // duration
        'weaponSwitch'
    );
    
    return true;
}

function switchToPreviousWeapon() {
    if (player.equippedWeapons.length <= 1) return;
    
    // Giảm index và đảm bảo nó không âm (quay vòng lại cuối nếu ở đầu)
    player.activeWeaponIndex = (player.activeWeaponIndex - 1 + player.equippedWeapons.length) % player.equippedWeapons.length;
    
    // Chuyển sang vũ khí mới
    switchWeapon(player.equippedWeapons[player.activeWeaponIndex]);
}

function switchToNextWeapon() {
    if (player.equippedWeapons.length <= 1) return;
    
    // Tăng index và đảm bảo nó không vượt quá số vũ khí (quay về đầu nếu ở cuối)
    player.activeWeaponIndex = (player.activeWeaponIndex + 1) % player.equippedWeapons.length;
    
    // Chuyển sang vũ khí mới
    switchWeapon(player.equippedWeapons[player.activeWeaponIndex]);
}