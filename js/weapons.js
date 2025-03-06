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
        bulletSpeed: 1000,
        bulletSize: 4,
        bulletLifetime: 0.7, // seconds
        automatic: false,
        description: 'Standard sidearm with balanced stats.',
        cost: 0,
        unlocked: true,
        color: '#FFD700', // Gold
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
        bulletSpeed: 800,
        bulletSize: 3,
        bulletLifetime: 0.5,
        automatic: false,
        description: 'Powerful at close range. Fires multiple pellets.',
        cost: 1000,
        unlocked: false,
        color: '#FF4500', // OrangeRed
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
        bulletSpeed: 1100,
        bulletSize: 3,
        bulletLifetime: 0.8,
        automatic: true,
        description: 'Rapid fire weapon with good all-around stats.',
        cost: 2500,
        unlocked: false,
        color: '#32CD32', // LimeGreen
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
        bulletSpeed: 950,
        bulletSize: 2,
        bulletLifetime: 0.6,
        automatic: true,
        description: 'High fire rate, low damage per bullet.',
        cost: 3500,
        unlocked: false,
        color: '#1E90FF', // DodgerBlue
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
        bulletSpeed: 1500,
        bulletSize: 5,
        bulletLifetime: 1.5,
        automatic: false,
        description: 'High damage, accurate shots at long range.',
        cost: 5000,
        unlocked: false,
        color: '#8A2BE2', // BlueViolet
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
    
    return weapon;
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