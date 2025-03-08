// Game Configuration and Constants
const CONFIG = {
    // Canvas and display
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    VIEWPORT_PADDING: 200,
    
    // Map generation
    MAP_INFINITE: true,
    SECTION_SIZE: 1500,  // Tăng từ 500 lên 1500
    
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
    
    // Territory system
    TERRITORY: {
        HEALTH_REGEN: 5,         // Health regen per second in territory
        SPEED_BOOST: 1.2,        // Movement speed multiplier in territory
        DAMAGE_BOOST: 1.15,      // Damage multiplier in territory
        ZOMBIE_SLOW: 0.7,        // Zombie speed multiplier in territory
        ZOMBIE_DAMAGE: 2,        // Damage per second to zombies in territory
        HOME_RADIUS: 150,        // Home base radius
        HOME_BONUS_MULTIPLIER: 1.5, // Bonus multiplier for effects near home
        TORCH_INITIAL: 4,        // Starting number of torches
        TORCH_RADIUS: 15,        // Visual radius of torch
        TORCH_LIGHT_RADIUS: 375,  // Light radius of torch
        TORCH_COST: 150,         // Cost to buy a new torch
    },
    
    // Ammunition system
    AMMO_TYPES: {
        pistol: {
            name: 'Pistol Rounds',
            color: '#FFD700',
            packSize: 30,
            maxReserve: 150,
            cost: 50
        },
        shotgun: {
            name: 'Shotgun Shells',
            color: '#FF4500',
            packSize: 8,
            maxReserve: 64,
            cost: 100
        },
        rifle: {
            name: 'Rifle Rounds',
            color: '#32CD32',
            packSize: 40,
            maxReserve: 240,
            cost: 150
        },
        smg: {
            name: 'SMG Rounds',
            color: '#1E90FF',
            packSize: 60,
            maxReserve: 300,
            cost: 120
        },
        sniper: {
            name: 'Sniper Rounds',
            color: '#8A2BE2',
            packSize: 5,
            maxReserve: 30,
            cost: 200
        }
    },
    
    // Weapon attachments
    ATTACHMENTS: [
        {
            id: 'extendedMag',
            name: 'Extended Magazine',
            description: '+50% ammo capacity',
            compatibleWeapons: ['pistol', 'assaultRifle', 'smg', 'shotgun'],
            effect: {
                property: 'maxAmmo',
                multiplier: 1.5
            },
            rarity: 'common'
        },
        {
            id: 'redDotSight',
            name: 'Red Dot Sight',
            description: '-30% bullet spread',
            compatibleWeapons: ['pistol', 'assaultRifle', 'smg', 'sniperRifle'],
            effect: {
                property: 'spread',
                multiplier: 0.7
            },
            rarity: 'common'
        },
        {
            id: 'quickLoader',
            name: 'Quick Loader',
            description: '-25% reload time',
            compatibleWeapons: ['pistol', 'shotgun', 'sniperRifle'],
            effect: {
                property: 'reloadTime',
                multiplier: 0.75
            },
            rarity: 'uncommon'
        },
        {
            id: 'rifledBarrel',
            name: 'Rifled Barrel',
            description: '+20% damage',
            compatibleWeapons: ['shotgun', 'assaultRifle'],
            effect: {
                property: 'damage',
                multiplier: 1.2
            },
            rarity: 'uncommon'
        },
        {
            id: 'tacticalGrip',
            name: 'Tactical Grip',
            description: '-40% bullet spread, +10% fire rate',
            compatibleWeapons: ['assaultRifle', 'smg'],
            effect: [
                {
                    property: 'spread',
                    multiplier: 0.6
                },
                {
                    property: 'fireRate',
                    multiplier: 0.9 // Lower is faster
                }
            ],
            rarity: 'rare'
        },
        {
            id: 'highPowerScope',
            name: 'High Power Scope',
            description: '+30% damage, -60% spread',
            compatibleWeapons: ['sniperRifle', 'assaultRifle'],
            effect: [
                {
                    property: 'damage',
                    multiplier: 1.3
                },
                {
                    property: 'spread',
                    multiplier: 0.4
                }
            ],
            rarity: 'rare'
        },
        {
            id: 'suppressorBarrel',
            name: 'Suppressor',
            description: 'Zombies less aware of shots',
            compatibleWeapons: ['pistol', 'smg', 'sniperRifle'],
            effect: {
                property: 'noise',
                multiplier: 0.3
            },
            rarity: 'rare'
        }
    ],
    
    // Treasure chests
    TREASURE_CHEST: {
        RADIUS: 20,
        COMMON_LOOT: [
            { type: 'coins', value: [1000, 2000] },
            { type: 'ammo', value: [0.5, 1] }, // Multiplier of pack size
            { type: 'health', value: [20, 40] }
        ],
        UNCOMMON_LOOT: [
            { type: 'coins', value: [2000, 4000] },
            { type: 'attachment', rarity: 'common', chance: 0.7 },
            { type: 'torch', value: 1 }
        ],
        RARE_LOOT: [
            { type: 'coins', value: [3000, 6000] },
            { type: 'attachment', rarity: 'uncommon', chance: 0.6 },
            { type: 'attachment', rarity: 'rare', chance: 0.3 },
            { type: 'torch', value: 2 }
        ]
    },
    
    // XP and leveling
    XP_TO_FIRST_LEVEL: 100,
    XP_LEVEL_MULTIPLIER: 1.1,
    
    // Zombie types and properties
    ZOMBIE_TYPES: {
        regular: {
            radius: 20,
            speedMultiplier: 5,
            healthMultiplier: 1,
            damageMultiplier: 1,
            color: '#00FFFF', // Cyan
            xpMultiplier: 1,
            coinMultiplier: 1
        },
        fast: {
            radius: 15,
            speedMultiplier: 7.5, 
            healthMultiplier: 0.7,
            damageMultiplier: 0.8,
            color: '#00FF00', // Green
            xpMultiplier: 1.5,
            coinMultiplier: 1.5
        },
        tank: {
            radius: 30,
            speedMultiplier: 3.5,
            healthMultiplier: 2.5,
            damageMultiplier: 1.5,
            color: '#800080', // Purple
            xpMultiplier: 2.5,
            coinMultiplier: 2.5
        },
        boss: {
            radius: 40,
            speedMultiplier: 3,
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
        speed: 5,
        damage: 10
    },
    
    // Section clearing
    SECTION_INITIAL_ZOMBIES: {
        MIN: 10,          // Minimum zombies per section
        BASE_FACTOR: 5,   // Base multiplier for difficulty
        RANDOM_FACTOR: 3  // Random additional zombies per difficulty level
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
        },
        torch: {
            radius: 12,
            color: '#FFA500',
            value: 1
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