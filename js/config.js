// Game Configuration and Constants
const CONFIG = {
    // Canvas and display
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    VIEWPORT_PADDING: 200,
    
    // Map generation
    MAP_INFINITE: true,
    SECTION_SIZE: 500,
    
    // Player settings
    PLAYER_START_STATS: {
        radius: 20,
        speed: 5,
        health: 100,
        maxHealth: 100,
        armor: 0,
        maxArmor: 100,
        baseDamage: 10,
        critChance: 5, // percentage
        critMultiplier: 1.5
    },
    
    // XP and leveling
    XP_TO_FIRST_LEVEL: 100,
    XP_LEVEL_MULTIPLIER: 1.2,
    
    // Zombie types and properties
    ZOMBIE_TYPES: {
        regular: {
            radius: 20,
            speedMultiplier: 1,
            healthMultiplier: 1,
            damageMultiplier: 1,
            color: '#00FFFF', // Cyan
            xpMultiplier: 1,
            coinMultiplier: 1
        },
        fast: {
            radius: 15,
            speedMultiplier: 1.5, 
            healthMultiplier: 0.7,
            damageMultiplier: 0.8,
            color: '#00FF00', // Green
            xpMultiplier: 1.5,
            coinMultiplier: 1.5
        },
        tank: {
            radius: 30,
            speedMultiplier: 0.7,
            healthMultiplier: 2.5,
            damageMultiplier: 1.5,
            color: '#800080', // Purple
            xpMultiplier: 2.5,
            coinMultiplier: 2.5
        },
        boss: {
            radius: 40,
            speedMultiplier: 0.6,
            healthMultiplier: 6,
            damageMultiplier: 2,
            color: '#FF0000', // Red
            xpMultiplier: 8,
            coinMultiplier: 10
        }
    },
    
    // Zombie spawning
    ZOMBIE_BASE_STATS: {
        health: 50,
        speed: 2,
        damage: 10
    },
    
    // Difficulty scaling with distance
    DIFFICULTY_DISTANCE_MULTIPLIER: 0.5,
    ZOMBIE_DENSITY_BASE: 0.5,
    ZOMBIE_DENSITY_MULTIPLIER: 0.05,
    SPAWN_DISTANCE_MIN: 800,
    SPAWN_DISTANCE_MAX: 1000,
    MAX_ZOMBIES_ON_SCREEN: 30,
    
    // Pickups
    PICKUP_TYPES: {
        health: {
            radius: 10,
            color: '#FF0000',
            value: 20
        },
        ammo: {
            radius: 10,
            color: '#FFFF00',
            value: 'maxAmmo'
        },
        armor: {
            radius: 10,
            color: '#4169E1',
            value: 15
        },
        coins: {
            radius: 8,
            color: '#FFD700'
        }
    },
    
    // Weapon upgrade options
    WEAPON_UPGRADE_TYPES: [
        {
            name: 'Damage Boost',
            description: '+15% weapon damage',
            cost: 500,
            property: 'damage',
            multiplier: 1.15,
            maxLevel: 20
        },
        {
            name: 'Fire Rate',
            description: '+10% fire rate',
            cost: 600,
            property: 'fireRate',
            multiplier: 1.1,
            inverseMultiplier: true, // Lower fireRate value = faster firing
            maxLevel: 20
        },
        {
            name: 'Accuracy',
            description: '-20% bullet spread',
            cost: 400,
            property: 'spread',
            multiplier: 0.8,
            maxLevel: 12
        },
        {
            name: 'Reloading',
            description: '-15% reload time',
            cost: 450,
            property: 'reloadTime',
            multiplier: 0.85,
            maxLevel: 12
        },
        {
            name: 'Ammo Capacity',
            description: '+25% ammo capacity',
            cost: 700,
            property: 'maxAmmo',
            multiplier: 1.25,
            maxLevel: 12
        }
    ],
    
    // Character stat upgrade options (on level up)
    STAT_UPGRADE_TYPES: [
        {
            name: 'Base Damage',
            description: 'Increase base damage by 5',
            property: 'baseDamage',
            value: 5
        },
        {
            name: 'Critical Chance',
            description: 'Increase critical hit chance by 5%',
            property: 'critChance',
            value: 5,
            max: 50
        },
        {
            name: 'Max Health',
            description: 'Increase max health by 20',
            property: 'maxHealth',
            value: 20,
            healOnUpgrade: true
        },
        {
            name: 'Movement Speed',
            description: 'Increase movement speed by 5%',
            property: 'speed',
            multiplier: 1.05
        }
    ]
};