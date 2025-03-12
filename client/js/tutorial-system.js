// Consolidated Tutorial System for Zombie Apocalypse Shooter
// Combines tutorial-system.js, first-time-experience.js, and integration functionality

// =============== TUTORIAL STATE VARIABLES ===============
const tutorial = {
    enabled: true,              // Whether tutorial is enabled
    currentStep: 0,             // Current tutorial step
    completed: false,           // Whether tutorial has been completed
    steps: [],                  // Will be populated with tutorial steps
    activePopup: null,          // Reference to active popup element
    highlightedElement: null,   // Element currently being highlighted
    seenTips: new Set(),        // Tips that have been shown already
};

// First-time experience state
const firstTimeExperience = {
    enabled: true,
    completed: false,
    introShown: false,
    achievementsQueue: [],
    achievementsUnlocked: new Set(),
    objectivesCompleted: new Set(),
    objectivesList: []
};

// Achievement tracking
const achievementSystem = {
    achievementsUnlocked: 0,
    zombiesKilled: 0,
    sectionsCleared: 0,
    territoriesClaimed: 0,
    treasureChestsOpened: 0,
    itemsPurchased: 0,
    timeAlive: 0
};

// =============== TUTORIAL STEPS ===============
const tutorialSteps = [
    {
        id: 'welcome',
        title: 'Welcome to Zombie Apocalypse!',
        content: 'Survive the zombie horde, claim territories, and upgrade your arsenal. This tutorial will guide you through the basic mechanics of the game.',
        position: 'center',
        highlight: null,
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'movement',
        title: 'Basic Movement',
        content: 'Use the WASD keys to move around. Try moving now!',
        position: 'center',
        highlight: null,
        action: highlightKeys,
        advanceCondition: 'movement', // Advance when player moves
    },
    {
        id: 'shooting',
        title: 'Shooting',
        content: 'Use your mouse to aim and left-click to shoot. Try shooting now!',
        position: 'center',
        highlight: null,
        action: null,
        advanceCondition: 'shoot', // Advance when player shoots
    },
    {
        id: 'reload',
        title: 'Reloading',
        content: 'Press R to reload your weapon when you run out of ammo.',
        position: 'bottom',
        highlight: '#ammoBar',
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'health',
        title: 'Health & Armor',
        content: 'Your health and armor are shown here. If your health reaches zero, it\'s game over!',
        position: 'left',
        highlight: '#healthBar',
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'zombies',
        title: 'Zombies',
        content: 'Different types of zombies will attack you. Regular zombies are cyan, fast zombies are green, tank zombies are purple, and boss zombies are red.',
        position: 'center',
        highlight: null,
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'sections',
        title: 'Map Sections',
        content: 'The map is divided into sections. Clear all zombies in a section to mark it as cleared.',
        position: 'right',
        highlight: '#minimap',
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'territory',
        title: 'Territory System',
        content: 'After clearing a section, place 4 torches (press F) in different quadrants to claim it as your territory. In your territory, you gain health regeneration and damage boosts!',
        position: 'right',
        highlight: '.torch-display', 
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'treasure',
        title: 'Treasure Chests',
        content: 'After clearing a section, a treasure chest will appear. Approach it to collect rewards like coins, ammo, and torches.',
        position: 'center',
        highlight: null,
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'shop',
        title: 'Shop',
        content: 'Press E or click the Shop button to buy new weapons, ammo, and torches.',
        position: 'top-left',
        highlight: '#shopButton',
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'upgrade',
        title: 'Upgrades',
        content: 'Press Tab or click the Upgrade button to upgrade your character stats and weapons.',
        position: 'top-left',
        highlight: '#upgradeButton',
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'weapons',
        title: 'Weapon Selection',
        content: 'Use 1-5 keys, Q, or mouse wheel to switch between equipped weapons.',
        position: 'bottom',
        highlight: '#weaponBar',
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'evolution',
        title: 'Zombie Evolution',
        content: 'Beware! Zombies evolve and become stronger over time. Watch the evolution timer at the top of the screen.',
        position: 'top',
        highlight: '#evolutionTimer',
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
    {
        id: 'final',
        title: 'Ready to Survive!',
        content: 'You\'re now ready to face the zombie apocalypse! Remember, the farther you go from your starting point, the more difficult zombies become. Good luck!',
        position: 'center',
        highlight: null,
        action: null,
        advanceCondition: 'button', // Advance with button click
    },
];

// Contextual tips that appear during gameplay after tutorial
const contextualTips = [
    {
        id: 'low-health',
        condition: () => player.health < player.maxHealth * 0.3,
        title: 'Low Health!',
        content: 'Your health is low! Find health pickups or return to your territory for health regeneration.',
        cooldown: 60000, // Show at most once per minute
        lastShown: 0
    },
    {
        id: 'low-ammo',
        condition: () => player.weapon.ammo < player.weapon.maxAmmo * 0.2,
        title: 'Low Ammo!',
        content: 'You\'re running low on ammo! Press R to reload or find ammo pickups.',
        cooldown: 30000, // Show at most once per 30 seconds
        lastShown: 0
    },
    {
        id: 'evolving-soon',
        condition: () => evolutionTimer < 10000 && zombieEvolutionLevel > 0,
        title: 'Evolution Imminent!',
        content: 'Zombies are about to evolve! Prepare for stronger enemies.',
        cooldown: 45000, // Show at most once per 45 seconds
        lastShown: 0
    },
    {
        id: 'section-almost-clear',
        condition: () => {
            const sectionX = Math.floor(player.x / CONFIG.SECTION_SIZE);
            const sectionY = Math.floor(player.y / CONFIG.SECTION_SIZE);
            const section = mapSections.find(s => 
                Math.floor(s.x / CONFIG.SECTION_SIZE) === sectionX && 
                Math.floor(s.y / CONFIG.SECTION_SIZE) === sectionY
            );
            return section && !section.isCleared && section.zombiesRemaining <= 3;
        },
        title: 'Almost Cleared!',
        content: 'This section is almost cleared! Eliminate the remaining zombies to spawn a treasure chest.',
        cooldown: 30000, // Show at most once per 30 seconds
        lastShown: 0
    },
    {
        id: 'territory-benefits',
        condition: () => player.inTerritory && !tutorial.seenTips.has('territory-benefits'),
        title: 'Territory Benefits',
        content: 'You\'re in your territory! You gain health regeneration, movement speed boost, and damage boost here.',
        cooldown: 120000, // Show once per 2 minutes
        lastShown: 0
    },
    {
        id: 'home-benefits',
        condition: () => player.inHomeRadius && !tutorial.seenTips.has('home-benefits'),
        title: 'Home Zone Benefits',
        content: 'You\'re in your home zone! Benefits here are stronger than in regular territories.',
        cooldown: 120000, // Show once per 2 minutes
        lastShown: 0
    },
    {
        id: 'place-torch',
        condition: () => {
            const sectionX = Math.floor(player.x / CONFIG.SECTION_SIZE);
            const sectionY = Math.floor(player.y / CONFIG.SECTION_SIZE);
            const section = mapSections.find(s => 
                Math.floor(s.x / CONFIG.SECTION_SIZE) === sectionX && 
                Math.floor(s.y / CONFIG.SECTION_SIZE) === sectionY
            );
            return section && section.isCleared && !section.isTerritory && player.torchCount > 0;
        },
        title: 'Place a Torch',
        content: 'This section is cleared! Press F to place a torch. Place 4 torches in different quadrants to claim this section as your territory.',
        cooldown: 45000, // Show once per 45 seconds
        lastShown: 0
    },
    {
        id: 'level-up',
        condition: () => player.xp >= player.xpToNextLevel * 0.9,
        title: 'Level Up Soon!',
        content: 'You\'re close to leveling up! When you level up, you\'ll be able to choose a stat to increase.',
        cooldown: 60000, // Show once per minute
        lastShown: 0
    }
];

// =============== FIRST TIME EXPERIENCE OBJECTIVES ===============
function initObjectives() {
    firstTimeExperience.objectivesList = [
        {
            id: "kill_first_zombie",
            title: "First Blood",
            description: "Kill your first zombie",
            rewardCoins: 100,
            rewardXP: 50
        },
        {
            id: "clear_first_section",
            title: "Section Clear",
            description: "Clear your first section of zombies",
            rewardCoins: 200,
            rewardXP: 100
        },
        {
            id: "claim_first_territory",
            title: "Claim Territory",
            description: "Claim your first territory by placing 4 torches",
            rewardCoins: 300,
            rewardXP: 150
        },
        {
            id: "open_first_treasure",
            title: "Treasure Hunter",
            description: "Open your first treasure chest",
            rewardCoins: 200,
            rewardXP: 100
        },
        {
            id: "buy_first_item",
            title: "Shopping Spree",
            description: "Buy your first item from the shop",
            rewardCoins: 150,
            rewardXP: 75
        },
        {
            id: "upgrade_first_stat",
            title: "Power Up",
            description: "Upgrade your first stat",
            rewardCoins: 150,
            rewardXP: 75
        },
        {
            id: "reach_level_5",
            title: "Rising Star",
            description: "Reach level 5",
            rewardCoins: 500,
            rewardXP: 200
        },
        {
            id: "survive_5_minutes",
            title: "Survivor",
            description: "Survive for 5 minutes",
            rewardCoins: 300,
            rewardXP: 150
        }
    ];
}

// =============== MAIN INITIALIZATION FUNCTIONS ===============

// Main initialization function
function initTutorialSystem() {
    // Set up necessary states and data
    tutorial.enabled = true;
    tutorial.steps = [...tutorialSteps];
    tutorial.completed = false;
    
    // Setup first-time experience
    firstTimeExperience.enabled = true;
    firstTimeExperience.introShown = false;
    firstTimeExperience.achievementsUnlocked = new Set();
    firstTimeExperience.objectivesCompleted = new Set();
    
    // Initialize objectives
    initObjectives();
    
    // Add tutorial UI style
    addTutorialStyle();
    
    // Add guide tooltips style
    addGuideTooltipStyles();
    
    // Add help button style
    addHelpButtonStyles();
    
    // Add achievement styles
    addAchievementStyles();
    
    // Create UI elements
    createUICheatSheet();
    createDifficultyIndicator();
    addHelpButton();
    
    // Show intro screen if this is the first time
    if (!firstTimeExperience.introShown) {
        createIntroScreen();
    }
    
    // Show welcome message and start tutorial with a slight delay
    setTimeout(() => {
        showGameMessage("Welcome to Zombie Apocalypse Shooter!");
        showTutorialStep(0);
    }, 1000);
    
    // Hook into game functions for achievements and objectives
    setupGameHooks();
}

// Set up hooks into various game systems
function setupGameHooks() {
    // Hook into weapon purchase
    if (typeof purchaseWeapon === 'function') {
        const originalPurchaseWeapon = window.purchaseWeapon;
        
        window.purchaseWeapon = function(weaponId) {
            const result = originalPurchaseWeapon(weaponId);
            
            if (result) {
                // Complete objective
                if (typeof completeObjective === 'function') {
                    completeObjective("buy_first_item");
                }
                
                // Unlock achievement
                if (typeof unlockAchievement === 'function') {
                    unlockAchievement("buy_weapon");
                }
            }
            
            return result;
        };
    }
    
    // Hook into stat upgrade
    if (typeof applyStatUpgrade === 'function') {
        const originalApplyStatUpgrade = window.applyStatUpgrade;
        
        window.applyStatUpgrade = function(upgrade) {
            const result = originalApplyStatUpgrade(upgrade);
            
            if (result) {
                // Complete objective
                if (typeof completeObjective === 'function') {
                    completeObjective("upgrade_first_stat");
                }
                
                // Unlock achievement
                if (typeof unlockAchievement === 'function') {
                    unlockAchievement("level_up");
                }
            }
            
            return result;
        };
    }
    
    // Hook into treasure chest opening
    if (typeof openTreasureChest === 'function') {
        const originalOpenTreasureChest = window.openTreasureChest;
        
        window.openTreasureChest = function(section) {
            originalOpenTreasureChest(section);
            
            // Increment treasure chest count
            if (window.achievementSystem) {
                achievementSystem.treasureChestsOpened++;
            }
            
            // Complete objective
            if (typeof completeObjective === 'function') {
                completeObjective("open_first_treasure");
            }
        };
    }
    
    // Hook into zombie kills
    const originalKillZombie = window.killZombie;
    
    window.killZombie = function(zombie) {
        // Call original function
        originalKillZombie(zombie);
        
        // Check if this is the player's first kill
        if (player.kills === 1) {
            // Complete objective
            if (typeof completeObjective === 'function') {
                completeObjective("kill_first_zombie");
            }
            
            // Show tip about collecting drops if tutorial completed
            if (tutorial.completed) {
                // Show tip about collecting drops
                showContextualTip({
                    title: "Collect Drops",
                    content: "Zombies may drop health, ammo, or coins when killed. Move close to pick them up automatically.",
                    id: "first-kill-drops"
                });
            }
        }
        
        // Check if this is a section-clearing kill
        if (zombie.isSectionZombie) {
            const sectionX = Math.floor(zombie.x / CONFIG.SECTION_SIZE);
            const sectionY = Math.floor(zombie.y / CONFIG.SECTION_SIZE);
            
            const section = mapSections.find(s => 
                Math.floor(s.x / CONFIG.SECTION_SIZE) === sectionX && 
                Math.floor(s.y / CONFIG.SECTION_SIZE) === sectionY
            );
            
            if (section && section.zombiesRemaining === 0 && !section.isCleared) {
                // This kill cleared the section - show tip about treasure chests
                setTimeout(() => {
                    showContextualTip({
                        title: "Section Cleared!",
                        content: "Approach the treasure chest to collect rewards. After that, place torches to claim this section.",
                        id: "section-cleared"
                    });
                }, 1000);
            }
        }
    };
    
    // Hook into player damage
    const originalDamagePlayer = window.damagePlayer;
    
    window.damagePlayer = function(damage) {
        // Call original function
        originalDamagePlayer(damage);
        
        // Check if health is low after damage
        if (player.health < player.maxHealth * 0.3 && tutorial.completed) {
            // Show low health warning if not in territory
            if (!player.inTerritory && !player.inHomeRadius) {
                showContextualTip({
                    title: "Low Health Warning!",
                    content: "Your health is critically low! Return to your territory for health regeneration or find health pickups.",
                    id: "critical-health"
                });
            }
        }
    };
}

// =============== TUTORIAL UI FUNCTIONS ===============

// Show a tutorial step
function showTutorialStep(stepIndex) {
    // Remove previous popup if exists
    if (tutorial.activePopup) {
        tutorial.activePopup.remove();
    }
    
    // Remove previous highlight if exists
    if (tutorial.highlightedElement) {
        tutorial.highlightedElement.remove();
    }
    
    // Set current step
    tutorial.currentStep = stepIndex;
    
    // Get step data
    const step = tutorial.steps[stepIndex];
    if (!step) return;
    
    // Create overlay if this is the first step
    if (stepIndex === 0) {
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        document.body.appendChild(overlay);
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = `tutorial-popup ${step.position}`;
    
    // Set content
    popup.innerHTML = `
        <div class="tutorial-title">${step.title}</div>
        <div class="tutorial-content">${step.content}</div>
        <div class="tutorial-buttons">
            <button class="tutorial-skip-btn">Skip Tutorial</button>
            <button class="tutorial-next-btn">Next</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(popup);
    tutorial.activePopup = popup;
    
    // Add event listeners
    const nextButton = popup.querySelector('.tutorial-next-btn');
    const skipButton = popup.querySelector('.tutorial-skip-btn');
    
    nextButton.addEventListener('click', () => advanceTutorial('button'));
    skipButton.addEventListener('click', skipTutorial);
    
    // Highlight element if specified
    if (step.highlight) {
        highlightElement(step.highlight);
    }
    
    // Run step action if specified
    if (step.action) {
        step.action();
    }
    
    // Set up advance condition listener
    if (step.advanceCondition === 'movement') {
        // Listen for WASD key presses
        const originalKeyDown = window.handleKeyDown;
        window.handleKeyDown = function(e) {
            originalKeyDown(e);
            if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                advanceTutorial('movement');
                window.handleKeyDown = originalKeyDown; // Restore original handler
            }
        };
    } else if (step.advanceCondition === 'shoot') {
        // Listen for mouse clicks
        const originalMouseDown = canvas.onmousedown;
        canvas.onmousedown = function(e) {
            if (originalMouseDown) originalMouseDown(e);
            advanceTutorial('shoot');
            canvas.onmousedown = originalMouseDown; // Restore original handler
        };
    }
    
    // Pause the game during the tutorial
    if (!tutorial.completed) {
        gameRunning = false;
    }
}

// Advance to the next tutorial step
function advanceTutorial(condition) {
    const currentStep = tutorial.steps[tutorial.currentStep];
    
    // Check if this is the correct advance condition
    if (currentStep.advanceCondition !== condition && condition !== 'force') {
        return;
    }
    
    // If this is the last step, end tutorial
    if (tutorial.currentStep >= tutorial.steps.length - 1) {
        endTutorial();
        return;
    }
    
    // Advance to next step
    showTutorialStep(tutorial.currentStep + 1);
}

// Skip the tutorial
function skipTutorial() {
    // Remove tutorial elements
    if (tutorial.activePopup) {
        tutorial.activePopup.remove();
    }
    
    if (tutorial.highlightedElement) {
        tutorial.highlightedElement.remove();
    }
    
    // Remove overlay
    const overlay = document.querySelector('.tutorial-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Mark tutorial as completed
    tutorial.completed = true;
    
    // Resume game
    gameRunning = true;
}

// End tutorial successfully
function endTutorial() {
    // Remove tutorial elements
    if (tutorial.activePopup) {
        tutorial.activePopup.remove();
    }
    
    if (tutorial.highlightedElement) {
        tutorial.highlightedElement.remove();
    }
    
    // Remove overlay
    const overlay = document.querySelector('.tutorial-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Mark tutorial as completed
    tutorial.completed = true;
    
    // Resume game
    gameRunning = true;
    
    // Show completion message
    showGameMessage("Tutorial completed! Good luck!");
    
    // Create interactive guides after tutorial
    createInteractiveGuides();
}

// Highlight an element
function highlightElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    // Get element position and size
    const rect = element.getBoundingClientRect();
    
    // Create highlight element
    const highlight = document.createElement('div');
    highlight.className = 'tutorial-highlight';
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    
    // Add to document
    document.body.appendChild(highlight);
    tutorial.highlightedElement = highlight;
}

// Highlight WASD keys for movement tutorial
function highlightKeys() {
    const keysContainer = document.createElement('div');
    keysContainer.className = 'wasd-keys';
    
    // Create each key
    const keys = ['w', 'a', 's', 'd'];
    keys.forEach(key => {
        const keyElement = document.createElement('div');
        keyElement.className = `key ${key}`;
        keyElement.textContent = key.toUpperCase();
        keysContainer.appendChild(keyElement);
    });
    
    // Add to document
    document.body.appendChild(keysContainer);
    tutorial.highlightedElement = keysContainer;
}

// Check for contextual tips during gameplay
function checkContextualTips() {
    // Only show tips if tutorial is completed
    if (!tutorial.completed) return;
    
    // Don't show tips if game is paused
    if (!gameRunning) return;
    
    // Don't show if another tip is visible
    if (document.querySelector('.contextual-tip')) return;
    
    const currentTime = performance.now();
    
    // Check each tip
    for (const tip of contextualTips) {
        // Check if condition is met, cooldown has elapsed, and tip wasn't just shown
        if (tip.condition && tip.condition() && currentTime - tip.lastShown > tip.cooldown) {
            // Show tip
            showContextualTip(tip);
            
            // Update last shown time
            tip.lastShown = currentTime;
            tutorial.seenTips.add(tip.id);
            
            // Only show one tip at a time
            break;
        }
    }
}

// Show a contextual tip
function showContextualTip(tip) {
    // Create tip element
    const tipElement = document.createElement('div');
    tipElement.className = 'contextual-tip';
    
    // Set content
    tipElement.innerHTML = `
        <div class="contextual-tip-title">${tip.title}</div>
        <div class="contextual-tip-content">${tip.content}</div>
        <div class="contextual-tip-close">×</div>
    `;
    
    // Add to document
    document.body.appendChild(tipElement);
    
    // Add event listener to close button
    const closeButton = tipElement.querySelector('.contextual-tip-close');
    closeButton.addEventListener('click', () => {
        tipElement.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (tipElement.parentNode) {
            tipElement.remove();
        }
    }, 5000);
}

// =============== FIRST-TIME EXPERIENCE UI ===============

// Create intro splash screen
function createIntroScreen() {
    // Check if intro has been shown before
    if (firstTimeExperience.introShown) return;
    
    // Create splash screen overlay
    const introScreen = document.createElement('div');
    introScreen.id = 'introScreen';
    introScreen.className = 'intro-screen';
    
    // Add content
    introScreen.innerHTML = `
        <div class="intro-content">
            <h1 class="intro-title">ZOMBIE APOCALYPSE</h1>
            <div class="intro-subtitle">Survive. Claim. Upgrade.</div>
            
            <div class="intro-story">
                <p>The infection has spread. Civilization has fallen.</p>
                <p>You are one of the few survivors with immunity to the virus.</p>
                <p>Establish your territory, upgrade your arsenal, and fight back against the undead horde.</p>
            </div>
            
            <div class="intro-objectives">
                <h3>Your Mission:</h3>
                <ul>
                    <li>Clear sections of zombies</li>
                    <li>Claim territory using torches</li>
                    <li>Upgrade weapons and abilities</li>
                    <li>Survive as long as possible</li>
                </ul>
            </div>
            
            <div class="intro-controls">
                <div class="control-category">
                    <h3>Movement</h3>
                    <div class="key-group">
                        <div class="key key-w">W</div>
                        <div class="key-row">
                            <div class="key key-a">A</div>
                            <div class="key key-s">S</div>
                            <div class="key key-d">D</div>
                        </div>
                    </div>
                </div>
                
                <div class="control-category">
                    <h3>Combat</h3>
                    <div class="key-group">
                        <div class="mouse-icon"></div>
                        <div class="key-desc">Aim & Shoot</div>
                    </div>
                    <div class="key-group">
                        <div class="key">R</div>
                        <div class="key-desc">Reload</div>
                    </div>
                </div>
                
                <div class="control-category">
                    <h3>Actions</h3>
                    <div class="key-group">
                        <div class="key">F</div>
                        <div class="key-desc">Place Torch</div>
                    </div>
                    <div class="key-group">
                        <div class="key">E</div>
                        <div class="key-desc">Shop</div>
                    </div>
                    <div class="key-group">
                        <div class="key">Tab</div>
                        <div class="key-desc">Upgrades</div>
                    </div>
                </div>
            </div>
            
            <button id="startGameBtn" class="start-game-btn">START GAME</button>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(introScreen);
    
    // Add styles
    addIntroScreenStyles();
    
    // Pause game until intro is dismissed
    if (typeof gameRunning !== 'undefined') {
        gameRunning = false;
    }
    
    // Add click event to start button
    document.getElementById('startGameBtn').addEventListener('click', () => {
        // Hide intro screen with fade out
        introScreen.classList.add('fade-out');
        
        // Remove after animation
        setTimeout(() => {
            introScreen.remove();
            
            // Resume game
            if (typeof gameRunning !== 'undefined') {
                gameRunning = true;
            }
            
            // Mark intro as shown
            firstTimeExperience.introShown = true;
        }, 500);
    });
}

// Create a difficulty indicator to help new players
function createDifficultyIndicator() {
    // Create the indicator container if it doesn't exist
    if (!document.getElementById('difficultyIndicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'difficultyIndicator';
        indicator.className = 'difficulty-indicator';
        
        // Build indicator content
        indicator.innerHTML = `
            <div class="difficulty-label">Danger Level:</div>
            <div class="difficulty-bar">
                <div class="difficulty-fill" id="difficultyFill"></div>
            </div>
            <div class="difficulty-text" id="difficultyText">Safe</div>
        `;
        
        // Add to DOM
        document.getElementById('gameContainer').appendChild(indicator);
        
        // Add styles
        addDifficultyIndicatorStyles();
    }
}

// Add styles for difficulty indicator
function addDifficultyIndicatorStyles() {
    if (document.getElementById('difficultyIndicatorStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'difficultyIndicatorStyles';
    style.textContent = `
        .difficulty-indicator {
            position: absolute;
            top: 160px;
            right: 20px;
            background-color: rgba(10, 20, 35, 0.85);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(80, 130, 170, 0.4);
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            width: 150px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
            z-index: 5;
        }
        
        .difficulty-label {
            font-family: 'Orbitron', sans-serif;
            font-size: 12px;
            color: #7ac6ff;
            margin-bottom: 5px;
        }
        
        .difficulty-bar {
            height: 8px;
            background-color: rgba(20, 20, 30, 0.8);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 5px;
        }
        
        .difficulty-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(to right, #4bff7e, #ffdc4b, #ff4b4b);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        .difficulty-text {
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            text-align: center;
            color: #4bff7e;
            transition: color 0.5s ease;
        }
    `;
    
    document.head.appendChild(style);
}

// Create UI cheat sheet button
function createUICheatSheet() {
    // Check if cheat sheet button already exists
    if (document.getElementById('uiCheatSheetBtn')) return;
    
    // Create button
    const button = document.createElement('button');
    button.id = 'uiCheatSheetBtn';
    button.className = 'ui-cheatsheet-btn';
    button.innerHTML = '❓';
    button.title = 'Game UI Guide';
    
    // Add to game container
    document.getElementById('gameContainer').appendChild(button);
    
    // Add click event
    button.addEventListener('click', toggleUICheatSheet);
    
    // Add styles
    addUICheatSheetStyles();
}

// Toggle UI cheat sheet
function toggleUICheatSheet() {
    let cheatSheet = document.getElementById('uiCheatSheet');
    
    if (cheatSheet) {
        // Already exists, toggle visibility
        if (cheatSheet.style.display === 'none') {
            cheatSheet.style.display = 'block';
            gameRunning = false;
        } else {
            cheatSheet.style.display = 'none';
            gameRunning = true;
        }
    } else {
        // Create new cheat sheet
        createCheatSheetContent();
    }
}

// Create cheat sheet content
function createCheatSheetContent() {
    const cheatSheet = document.createElement('div');
    cheatSheet.id = 'uiCheatSheet';
    cheatSheet.className = 'ui-cheatsheet';
    
    cheatSheet.innerHTML = `
        <div class="cheatsheet-header">
            <h2>Game UI Guide</h2>
            <div class="cheatsheet-close">×</div>
        </div>
        
        <div class="cheatsheet-content">
            <div class="ui-section">
                <h3>Game Status</h3>
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight health-bar"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Health Bar</h4>
                        <p>Shows your current health. If it reaches zero, it's game over.</p>
                    </div>
                </div>
                
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight armor-bar"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Armor Bar</h4>
                        <p>Armor absorbs 50% of damage. Collect armor pickups to replenish.</p>
                    </div>
                </div>
                
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight xp-bar"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Experience Bar</h4>
                        <p>Kill zombies to gain XP. Level up to choose stat upgrades.</p>
                    </div>
                </div>
                
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight ammo-bar"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Ammo Bar</h4>
                        <p>Shows current weapon ammo. Press R to reload when low.</p>
                    </div>
                </div>
            </div>
            
            <div class="ui-section">
                <h3>Map & Navigation</h3>
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight minimap"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Minimap</h4>
                        <p>Shows discovered sections, territories, and nearby zombies.
                        <br>- <span style="color:#0F0;">Green</span>: Fast zombies
                        <br>- <span style="color:#0FF;">Cyan</span>: Regular zombies
                        <br>- <span style="color:#800080;">Purple</span>: Tank zombies
                        <br>- <span style="color:#F00;">Red</span>: Boss zombies
                        <br>- <span style="color:#0F0;">Green sections</span>: Claimed territories
                        <br>- <span style="color:#00F;">Blue sections</span>: Cleared but not claimed
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="ui-section">
                <h3>Weapons & Items</h3>
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight weapon-bar"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Weapon Selection</h4>
                        <p>Shows equipped weapons. Switch using 1-5 keys, Q key, or mouse wheel.</p>
                    </div>
                </div>
                
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight torch-display"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Torch Count</h4>
                        <p>Shows available torches. Press F to place torches in cleared sections. Place 4 torches in different quadrants to claim territory.</p>
                    </div>
                </div>
            </div>
            
            <div class="ui-section">
                <h3>Game Mechanics</h3>
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight evolution-timer"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Evolution Timer</h4>
                        <p>Zombies evolve and become stronger when this timer reaches zero. Each evolution increases zombie stats by 5%.</p>
                    </div>
                </div>
                
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight section-progress"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Section Clearing</h4>
                        <p>Shows progress toward clearing the current section of zombies. When cleared, a treasure chest will appear.</p>
                    </div>
                </div>
                
                <div class="ui-element">
                    <div class="ui-screenshot">
                        <div class="ui-highlight territory-indicator"></div>
                    </div>
                    <div class="ui-description">
                        <h4>Territory Indicator</h4>
                        <p>Appears when in territory or home zone. In these areas, you gain health regeneration, movement speed boost, and damage boost.</p>
                    </div>
                </div>
            </div>
            
            <div class="ui-section">
                <h3>Key Controls</h3>
                <div class="controls-grid">
                    <div class="control-item">
                        <div class="key-label">W, A, S, D</div>
                        <div class="key-desc">Movement</div>
                    </div>
                    <div class="control-item">
                        <div class="key-label">Mouse</div>
                        <div class="key-desc">Aim & Shoot</div>
                    </div>
                    <div class="control-item">
                        <div class="key-label">R</div>
                        <div class="key-desc">Reload</div>
                    </div>
                    <div class="control-item">
                        <div class="key-label">F</div>
                        <div class="key-desc">Place Torch</div>
                    </div>
                    <div class="control-item">
                        <div class="key-label">E</div>
                        <div class="key-desc">Shop</div>
                    </div>
                    <div class="control-item">
                        <div class="key-label">Tab</div>
                        <div class="key-desc">Upgrades</div>
                    </div>
                    <div class="control-item">
                        <div class="key-label">1-5</div>
                        <div class="key-desc">Switch Weapons</div>
                    </div>
                    <div class="control-item">
                        <div class="key-label">Q</div>
                        <div class="key-desc">Previous Weapon</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add to game container
    document.getElementById('gameContainer').appendChild(cheatSheet);
    
    // Add close handler
    cheatSheet.querySelector('.cheatsheet-close').addEventListener('click', () => {
        cheatSheet.style.display = 'none';
        gameRunning = true;
    });
    
    // Pause game
    gameRunning = false;
}

// Add UI cheat sheet styles
function addUICheatSheetStyles() {
    if (document.getElementById('uiCheatSheetStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'uiCheatSheetStyles';
    style.textContent = `
        .ui-cheatsheet-btn {
            position: absolute;
            top: 90px;
            right: 20px;
            width: 36px;
            height: 36px;
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            border: 2px solid #4a80b0;
            border-radius: 50%;
            color: #fff;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 5;
            box-shadow: 0 0 10px rgba(0, 100, 200, 0.3);
            transition: all 0.2s ease;
        }
        
        .ui-cheatsheet-btn:hover {
            background: linear-gradient(to bottom, #4a70a0, #3a5070);
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(0, 100, 200, 0.5);
        }
        
        .ui-cheatsheet {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(10, 20, 35, 0.95);
            backdrop-filter: blur(8px);
            border: 2px solid #4a80b0;
            border-radius: 10px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
            padding: 20px;
        }
        
        .cheatsheet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #4a80b0;
            padding-bottom: 10px;
        }
        
        .cheatsheet-header h2 {
            font-family: 'Orbitron', sans-serif;
            color: #7ac6ff;
            margin: 0;
        }
        
        .cheatsheet-close {
            width: 30px;
            height: 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ccc;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s ease;
        }
        
        .cheatsheet-close:hover {
            background: rgba(255, 50, 50, 0.2);
            color: #fff;
        }
        
        .cheatsheet-content {
            padding-right: 10px;
        }
        
        .ui-section {
            margin-bottom: 25px;
        }
        
        .ui-section h3 {
            font-family: 'Orbitron', sans-serif;
            color: #7ac6ff;
            margin: 0 0 15px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #333;
        }
        
        .ui-element {
            display: flex;
            margin-bottom: 20px;
            background-color: rgba(30, 30, 40, 0.6);
            border-radius: 8px;
            padding: 15px;
            transition: all 0.2s ease;
        }
        
        .ui-element:hover {
            background-color: rgba(40, 40, 50, 0.6);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .ui-screenshot {
            width: 100px;
            height: 80px;
            background-color: rgba(20, 20, 30, 0.5);
            border-radius: 5px;
            margin-right: 15px;
            position: relative;
            border: 1px solid #444;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ui-highlight {
            background-color: rgba(122, 198, 255, 0.3);
            border: 1px dashed #7ac6ff;
            border-radius: 4px;
            position: absolute;
            animation: highlight-pulse 2s infinite;
        }
        
        .ui-highlight.health-bar {
            width: 80%;
            height: 20%;
            top: 10%;
            left: 10%;
            background-color: rgba(255, 75, 75, 0.3);
            border-color: #ff4b4b;
        }
        
        .ui-highlight.armor-bar {
            width: 80%;
            height: 20%;
            top: 40%;
            left: 10%;
            background-color: rgba(75, 127, 255, 0.3);
            border-color: #4b7fff;
        }
        
        .ui-highlight.xp-bar {
            width: 80%;
            height: 20%;
            top: 70%;
            left: 10%;
            background-color: rgba(75, 255, 126, 0.3);
            border-color: #4bff7e;
        }
        
        .ui-highlight.ammo-bar {
            width: 80%;
            height: 20%;
            bottom: 10%;
            left: 10%;
            background-color: rgba(255, 220, 75, 0.3);
            border-color: #ffdc4b;
        }
        
        .ui-highlight.minimap {
            width: 80%;
            height: 80%;
            top: 10%;
            left: 10%;
        }
        
        .ui-highlight.weapon-bar {
            width: 80%;
            height: 50%;
            bottom: 10%;
            left: 10%;
        }
        
        .ui-highlight.torch-display {
            width: 50%;
            height: 50%;
            top: 25%;
            right: 25%;
            background-color: rgba(255, 165, 0, 0.3);
            border-color: #ffa500;
            border-radius: 50%;
        }
        
        .ui-highlight.evolution-timer {
            width: 80%;
            height: 60%;
            top: 20%;
            left: 10%;
            background-color: rgba(255, 50, 50, 0.2);
            border-color: #ff3232;
        }
        
        .ui-highlight.section-progress {
            width: 80%;
            height: 40%;
            top: 30%;
            left: 10%;
            background-color: rgba(255, 100, 100, 0.2);
            border-color: #ff6464;
        }
        
        .ui-highlight.territory-indicator {
            width: 60%;
            height: 60%;
            top: 20%;
            left: 20%;
            background-color: rgba(0, 255, 100, 0.2);
            border-color: #00ff64;
            border-radius: 50%;
        }
        
        .ui-description {
            flex: 1;
        }
        
        .ui-description h4 {
            font-family: 'Orbitron', sans-serif;
            color: #7ac6ff;
            margin: 0 0 8px 0;
            font-size: 15px;
        }
        
        .ui-description p {
            font-size: 13px;
            line-height: 1.4;
            color: #ccc;
            margin: 0;
        }
        
        .controls-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 10px;
        }
        
        .control-item {
            display: flex;
            align-items: center;
            padding: 8px;
            background-color: rgba(20, 20, 30, 0.5);
            border-radius: 5px;
            transition: all 0.2s ease;
        }
        
        .control-item:hover {
            background-color: rgba(30, 30, 40, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }
        
        .key-label {
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            padding: 5px 10px;
            border-radius: 5px;
            margin-right: 10px;
            font-family: 'Orbitron', sans-serif;
            font-size: 12px;
            min-width: 60px;
            text-align: center;
            border: 1px solid #4a7faf;
        }
        
        .key-desc {
            flex: 1;
            font-size: 13px;
            color: #ddd;
        }
        
        @keyframes highlight-pulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
        }
    `;
    
    document.head.appendChild(style);
}

// Add help button to top action buttons
function addHelpButton() {
    const topActionButtons = document.querySelector('.top-action-buttons');
    if (!topActionButtons) return;
    
    // Create help button
    const helpButton = document.createElement('button');
    helpButton.id = 'helpButton';
    helpButton.className = 'action-button';
    helpButton.textContent = 'Help';
    
    // Add to buttons
    topActionButtons.appendChild(helpButton);
    
    // Add click event
    helpButton.addEventListener('click', showHelpMenu);
}

// Add styles for help button
function addHelpButtonStyles() {
    if (document.getElementById('helpButtonStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'helpButtonStyles';
    style.textContent = `
        #helpButton {
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            color: #e0e0e0;
            border: 1px solid #4a80b0;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        #helpButton:hover {
            background: linear-gradient(to bottom, #4a70a0, #3a5070);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }
    `;
    
    document.head.appendChild(style);
}

// Create and show the help menu
function showHelpMenu() {
    // Check if help menu already exists
    if (document.getElementById('helpMenu')) {
        document.getElementById('helpMenu').style.display = 'flex';
        gameRunning = false;
        return;
    }
    
    // Create help menu
    const helpMenu = document.createElement('div');
    helpMenu.id = 'helpMenu';
    helpMenu.className = 'modal';
    
    helpMenu.innerHTML = `
        <div class="modal-content">
            <h2>Game Help</h2>
            
            <div class="help-tabs">
                <button class="tab-button active" data-tab="controls">Controls</button>
                <button class="tab-button" data-tab="mechanics">Game Mechanics</button>
                <button class="tab-button" data-tab="enemies">Enemies</button>
                <button class="tab-button" data-tab="weapons">Weapons</button>
                <button class="tab-button" data-tab="upgrades">Upgrades</button>
            </div>
            
            <div class="help-tab-content active" id="controls-tab">
                <h3>Basic Controls</h3>
                <div class="help-section">
                    <div class="help-item"><span class="key-label">W, A, S, D</span> Move character</div>
                    <div class="help-item"><span class="key-label">Mouse</span> Aim</div>
                    <div class="help-item"><span class="key-label">Left Click</span> Shoot</div>
                    <div class="help-item"><span class="key-label">R</span> Reload weapon</div>
                    <div class="help-item"><span class="key-label">1-5</span> Switch weapons</div>
                    <div class="help-item"><span class="key-label">Q</span> Previous weapon</div>
                    <div class="help-item"><span class="key-label">Mouse Wheel</span> Cycle weapons</div>
                    <div class="help-item"><span class="key-label">F</span> Place torch</div>
                    <div class="help-item"><span class="key-label">E</span> Open shop</div>
                    <div class="help-item"><span class="key-label">Tab</span> Open upgrade menu</div>
                </div>
                
                <div class="help-action">
                    <button id="restartTutorialBtn" class="help-action-btn">Restart Tutorial</button>
                </div>
            </div>
            
            <div class="help-tab-content" id="mechanics-tab">
                <h3>Game Mechanics</h3>
                
                <div class="help-section">
                    <h4>Territory System</h4>
                    <p>The map is divided into sections. Clear all zombies in a section to mark it as cleared. 
                    After clearing, place 4 torches in different quadrants to claim it as your territory.</p>
                    
                    <h4>Territory Benefits</h4>
                    <ul>
                        <li>Health regeneration over time</li>
                        <li>Movement speed boost</li>
                        <li>Damage boost against zombies</li>
                        <li>Zombies move slower in your territory</li>
                        <li>Zombies take damage over time in your territory</li>
                    </ul>
                    
                    <h4>Home Zone</h4>
                    <p>Your starting area provides stronger territory benefits. It's a safe zone to retreat to.</p>
                    
                    <h4>Treasure Chests</h4>
                    <p>After clearing a section, a treasure chest will appear. Approach it to collect rewards like coins, ammo, weapon attachments, and torches.</p>
                    
                    <h4>Zombie Evolution</h4>
                    <p>Zombies evolve and become stronger over time. Watch the evolution timer at the top of the screen.</p>
                </div>
            </div>
            
            <div class="help-tab-content" id="enemies-tab">
                <h3>Enemy Types</h3>
                
                <div class="help-section">
                    <div class="enemy-type">
                        <div class="enemy-color" style="background-color: #00FFFF;"></div>
                        <div class="enemy-info">
                            <h4>Regular Zombie</h4>
                            <p>Balanced stats, medium speed and health.</p>
                        </div>
                    </div>
                    
                    <div class="enemy-type">
                        <div class="enemy-color" style="background-color: #00FF00;"></div>
                        <div class="enemy-info">
                            <h4>Fast Zombie</h4>
                            <p>High speed but lower health. Can quickly close in on you.</p>
                        </div>
                    </div>
                    
                    <div class="enemy-type">
                        <div class="enemy-color" style="background-color: #800080;"></div>
                        <div class="enemy-info">
                            <h4>Tank Zombie</h4>
                            <p>High health and damage but slow. Takes more shots to kill.</p>
                        </div>
                    </div>
                    
                    <div class="enemy-type">
                        <div class="enemy-color" style="background-color: #FF0000;"></div>
                        <div class="enemy-info">
                            <h4>Boss Zombie</h4>
                            <p>Extremely tough with high damage. Always drops loot when killed.</p>
                        </div>
                    </div>
                    
                    <div class="strategy-tip">
                        <h4>Strategy Tip</h4>
                        <p>Enemy difficulty increases the further you go from your starting point. 
                        Build a network of territories and upgrade your weapons before venturing too far.</p>
                    </div>
                </div>
            </div>
            
            <div class="help-tab-content" id="weapons-tab">
                <h3>Weapons</h3>
                
                <div class="help-section">
                    <div class="weapon-type">
                        <div class="weapon-color" style="background-color: #FFD700;"></div>
                        <div class="weapon-info">
                            <h4>Pistol</h4>
                            <p>Starting weapon. Balanced stats with medium damage and fire rate.</p>
                        </div>
                    </div>
                    
                    <div class="weapon-type">
                        <div class="weapon-color" style="background-color: #FF4500;"></div>
                        <div class="weapon-info">
                            <h4>Shotgun</h4>
                            <p>High damage at close range. Fires multiple pellets per shot.</p>
                        </div>
                    </div>
                    
                    <div class="weapon-type">
                        <div class="weapon-color" style="background-color: #32CD32;"></div>
                        <div class="weapon-info">
                            <h4>Assault Rifle</h4>
                            <p>Good all-around weapon with automatic fire.</p>
                        </div>
                    </div>
                    
                    <div class="weapon-type">
                        <div class="weapon-color" style="background-color: #1E90FF;"></div>
                        <div class="weapon-info">
                            <h4>SMG</h4>
                            <p>Very high fire rate but lower damage per bullet.</p>
                        </div>
                    </div>
                    
                    <div class="weapon-type">
                        <div class="weapon-color" style="background-color: #8A2BE2;"></div>
                        <div class="weapon-info">
                            <h4>Sniper Rifle</h4>
                            <p>High damage and accuracy but slow fire rate.</p>
                        </div>
                    </div>
                    
                    <h4>Attachments</h4>
                    <p>Find weapon attachments in treasure chests to improve your weapons. Each weapon has 2-3 attachment slots.</p>
                </div>
            </div>
            
            <div class="help-tab-content" id="upgrades-tab">
                <h3>Upgrades</h3>
                
                <div class="help-section">
                    <h4>Character Upgrades</h4>
                    <p>When you level up, you can choose one of these stats to improve:</p>
                    <ul>
                        <li>Base Damage: Increases damage for all weapons</li>
                        <li>Critical Chance: Increases probability of critical hits</li>
                        <li>Max Health: Improves maximum health capacity</li>
                        <li>Movement Speed: Increases player movement speed</li>
                        <li>Pickup Range: Expands the area that automatically attracts items</li>
                        <li>Ammo Reserves: Increases maximum ammunition capacity</li>
                    </ul>
                    
                    <h4>Weapon Upgrades</h4>
                    <p>Use the Upgrade Menu (Tab key) to improve your weapons:</p>
                    <ul>
                        <li>Damage: Increases weapon damage output</li>
                        <li>Fire Rate: Improves weapon firing speed</li>
                        <li>Accuracy: Reduces bullet spread</li>
                        <li>Reload Time: Decreases time needed to reload</li>
                        <li>Ammo Capacity: Increases magazine size</li>
                    </ul>
                </div>
            </div>
            
            <button id="closeHelpButton" class="close-button">Back to Game</button>
        </div>
    `;
    
    // Add help menu to the game container
    document.getElementById('gameContainer').appendChild(helpMenu);
    
    // Add CSS for help menu
    addHelpMenuStyle();
    
    // Add event listeners for tab switching
    const tabButtons = helpMenu.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(b => b.classList.remove('active'));
            helpMenu.querySelectorAll('.help-tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabName = button.getAttribute('data-tab');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    // Add event listener for close button
    helpMenu.querySelector('#closeHelpButton').addEventListener('click', () => {
        helpMenu.style.display = 'none';
        gameRunning = true;
    });
    
    // Add event listener for restart tutorial button
    helpMenu.querySelector('#restartTutorialBtn').addEventListener('click', () => {
        // Close help menu
        helpMenu.style.display = 'none';
        
        // Reset tutorial state
        tutorial.completed = false;
        tutorial.currentStep = 0;
        tutorial.steps = [...tutorialSteps];
        
        // Show first tutorial step
        setTimeout(() => {
            showTutorialStep(0);
        }, 500);
    });
    
    // Pause the game
    gameRunning = false;
}

// Add CSS for help menu
function addHelpMenuStyle() {
    if (document.getElementById('helpMenuStyle')) return;
    
    const style = document.createElement('style');
    style.id = 'helpMenuStyle';
    style.textContent = `
        .help-tabs {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #444;
            flex-wrap: wrap;
        }
        
        .help-tab-content {
            display: none;
            max-height: 50vh;
            overflow-y: auto;
            padding-right: 8px;
        }
        
        .help-tab-content.active {
            display: block;
            animation: fadeIn 0.3s ease-in-out;
        }
        
        .help-section {
            background-color: rgba(30, 30, 40, 0.6);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        
        .help-section h4 {
            color: #7ac6ff;
            margin: 12px 0 8px 0;
            font-family: 'Orbitron', sans-serif;
        }
        
        .help-section p {
            margin-bottom: 10px;
            line-height: 1.4;
        }
        
        .help-section ul {
            padding-left: 20px;
            margin-bottom: 15px;
        }
        
        .help-section ul li {
            margin-bottom: 5px;
        }
        
        .help-item {
            display: flex;
            margin-bottom: 8px;
            align-items: center;
        }
        
        .key-label {
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            padding: 3px 8px;
            border-radius: 5px;
            margin-right: 10px;
            font-family: 'Orbitron', sans-serif;
            font-size: 12px;
            min-width: 80px;
            text-align: center;
            border: 1px solid #4a7faf;
        }
        
        .enemy-type, .weapon-type {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dotted #444;
        }
        
        .enemy-color, .weapon-color {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            margin-right: 15px;
            border: 1px solid #fff;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        }
        
        .enemy-info, .weapon-info {
            flex: 1;
        }
        
        .enemy-info h4, .weapon-info h4 {
            margin: 0 0 5px 0;
        }
        
        .enemy-info p, .weapon-info p {
            font-size: 13px;
            margin: 0;
            color: #ccc;
        }
        
        .strategy-tip {
            background-color: rgba(122, 198, 255, 0.1);
            padding: 10px;
            border-radius: 5px;
            border-left: 3px solid #7ac6ff;
            margin-top: 15px;
        }
        
        .help-action {
            display: flex;
            justify-content: center;
            margin-top: 20px;
        }
        
        .help-action-btn {
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            color: #fff;
            border: 1px solid #4a7faf;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
            transition: all 0.2s ease;
        }
        
        .help-action-btn:hover {
            background: linear-gradient(to bottom, #4a70a0, #3a5070);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        
        .close-button {
            display: block;
            margin: 20px auto 0;
            background: linear-gradient(to bottom, #2a5080, #1a3050);
            color: #e0e0e0;
            padding: 10px 20px;
            border: 1px solid #3a6090;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            transition: all 0.2s ease;
        }
        
        .close-button:hover {
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }
    `;
    
    document.head.appendChild(style);
}

// =============== ACHIEVEMENT SYSTEM ===============

// Add styles for achievements
function addAchievementStyles() {
    if (document.getElementById('achievementStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'achievementStyles';
    style.textContent = `
        .achievement-notification {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background-color: rgba(10, 20, 35, 0.95);
            backdrop-filter: blur(8px);
            border: 2px solid #4a80b0;
            border-radius: 10px;
            padding: 15px 20px;
            width: 300px;
            box-shadow: 0 0 20px rgba(0, 100, 200, 0.4);
            z-index: 1000;
            display: flex;
            align-items: center;
            animation: achievement-slide-in 0.5s forwards, achievement-slide-out 0.5s 4.5s forwards;
        }
        
        .achievement-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-right: 15px;
            background: linear-gradient(135deg, #4a80b0, #3a6090);
            box-shadow: 0 0 10px rgba(122, 198, 255, 0.5);
            flex-shrink: 0;
        }
        
        .achievement-text {
            flex: 1;
        }
        
        .achievement-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            color: #7ac6ff;
            margin-bottom: 5px;
        }
        
        .achievement-desc {
            font-size: 13px;
            color: #e0e0e0;
        }
        
        .achievement-reward {
            font-size: 13px;
            color: #ffdc4b;
            margin-top: 5px;
        }
        
        @keyframes achievement-slide-in {
            from { transform: translateX(-50%) translateY(-100px); }
            to { transform: translateX(-50%) translateY(0); }
        }
        
        @keyframes achievement-slide-out {
            from { transform: translateX(-50%) translateY(0); }
            to { transform: translateX(-50%) translateY(-100px); }
        }
        
        .objective-notification {
            position: absolute;
            bottom: 120px;
            left: 20px;
            background-color: rgba(10, 20, 35, 0.95);
            backdrop-filter: blur(8px);
            border: 2px solid #4a80b0;
            border-radius: 10px;
            padding: 12px 15px;
            width: 280px;
            box-shadow: 0 0 15px rgba(0, 100, 200, 0.4);
            z-index: 1000;
            display: flex;
            align-items: center;
            animation: objective-slide-in 0.5s forwards, objective-slide-out 0.5s 4.5s forwards;
        }
        
        .objective-check {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            margin-right: 15px;
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
            flex-shrink: 0;
        }
        
        .objective-text {
            flex: 1;
        }
        
        .objective-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            color: #2ecc71;
            margin-bottom: 3px;
        }
        
        .objective-desc {
            font-size: 12px;
            color: #e0e0e0;
        }
        
        .objective-reward {
            font-size: 12px;
            color: #ffdc4b;
            margin-top: 3px;
        }
        
        @keyframes objective-slide-in {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
        
        @keyframes objective-slide-out {
            from { transform: translateX(0); }
            to { transform: translateX(-100%); }
        }
    `;
    
    document.head.appendChild(style);
}

// Complete an objective
function completeObjective(objectiveId) {
    // Check if objective exists and is not already completed
    if (firstTimeExperience.objectivesCompleted.has(objectiveId)) {
        return false;
    }
    
    // Find the objective
    const objective = firstTimeExperience.objectivesList.find(obj => obj.id === objectiveId);
    if (!objective) return false;
    
    // Mark as completed
    firstTimeExperience.objectivesCompleted.add(objectiveId);
    
    // Give rewards
    if (objective.rewardCoins) {
        player.coins += objective.rewardCoins;
    }
    
    if (objective.rewardXP) {
        addXP(objective.rewardXP);
    }
    
    // Show notification
    showObjectiveNotification(objective);
    
    return true;
}

// Show objective completion notification
function showObjectiveNotification(objective) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'objective-notification';
    
    // Set content
    notification.innerHTML = `
        <div class="objective-check">✓</div>
        <div class="objective-text">
            <div class="objective-title">Objective Complete!</div>
            <div class="objective-desc">${objective.title} - ${objective.description}</div>
            <div class="objective-reward">
                ${objective.rewardCoins ? `+${objective.rewardCoins} coins` : ''}
                ${objective.rewardCoins && objective.rewardXP ? ' | ' : ''}
                ${objective.rewardXP ? `+${objective.rewardXP} XP` : ''}
            </div>
        </div>
    `;
    
    // Add to game container
    document.getElementById('gameContainer').appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Unlock an achievement
function unlockAchievement(achievementId) {
    // Check if achievement was already unlocked
    if (firstTimeExperience.achievementsUnlocked.has(achievementId)) {
        return false;
    }
    
    // Add achievement to queue for display
    firstTimeExperience.achievementsQueue.push(achievementId);
    
    // Mark as unlocked
    firstTimeExperience.achievementsUnlocked.add(achievementId);
    
    // Process queue if this is the first item
    if (firstTimeExperience.achievementsQueue.length === 1) {
        processAchievementQueue();
    }
    
    return true;
}

// Process achievements queue (show one at a time)
function processAchievementQueue() {
    if (firstTimeExperience.achievementsQueue.length === 0) return;
    
    const achievementId = firstTimeExperience.achievementsQueue[0];
    
    // Show notification
    showAchievementNotification(achievementId);
    
    // Remove from queue
    firstTimeExperience.achievementsQueue.shift();
    
    // Process next item after delay
    if (firstTimeExperience.achievementsQueue.length > 0) {
        setTimeout(processAchievementQueue, 5000);
    }
}

// Show achievement notification
function showAchievementNotification(achievementId) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    
    // Set icon and text based on achievement
    let icon = '🏆';
    let title = 'Achievement Unlocked!';
    let description = 'You\'ve unlocked a new achievement.';
    let reward = '';
    
    // Set specific content based on achievement ID
    switch(achievementId) {
        case 'first_kill':
            icon = '☠️';
            title = 'First Blood';
            description = 'Kill your first zombie';
            reward = '+50 XP';
            break;
        case 'first_section':
            icon = '🗺️';
            title = 'Cartographer';
            description = 'Clear your first section of zombies';
            reward = '+100 coins, +50 XP';
            break;
        case 'first_territory':
            icon = '🏠';
            title = 'Home Sweet Home';
            description = 'Claim your first territory';
            reward = '+200 coins, +100 XP';
            break;
        case 'first_treasure':
            icon = '💎';
            title = 'Treasure Hunter';
            description = 'Open your first treasure chest';
            reward = '+100 coins';
            break;
        case 'buy_weapon':
            icon = '🔫';
            title = 'Armed and Dangerous';
            description = 'Purchase your first weapon';
            reward = '+75 XP';
            break;
        case 'level_up':
            icon = '⭐';
            title = 'Level Up!';
            description = 'Reach level 2';
            reward = 'New stat upgrade available';
            break;
        case 'kill_10_zombies':
            icon = '💀';
            title = 'Zombie Slayer';
            description = 'Kill 10 zombies';
            reward = '+100 coins';
            break;
        case 'kill_50_zombies':
            icon = '☢️';
            title = 'Exterminator';
            description = 'Kill 50 zombies';
            reward = '+200 coins, +100 XP';
            break;
        case 'survive_5_minutes':
            icon = '⏱️';
            title = 'Survivor';
            description = 'Survive for 5 minutes';
            reward = '+250 coins, +100 XP';
            break;
    }
    
    // Set content
    notification.innerHTML = `
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-text">
            <div class="achievement-title">${title}</div>
            <div class="achievement-desc">${description}</div>
            ${reward ? `<div class="achievement-reward">${reward}</div>` : ''}
        </div>
    `;
    
    // Add to game container
    document.getElementById('gameContainer').appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Apply rewards if any
    if (reward.includes('coins')) {
        const coinAmount = parseInt(reward.match(/\+(\d+) coins/)[1]);
        player.coins += coinAmount;
    }
    
    if (reward.includes('XP')) {
        const xpAmount = parseInt(reward.match(/\+(\d+) XP/)[1]);
        addXP(xpAmount);
    }
    
    // Update UI
    updateUI();
}

// Check for achievements based on player stats
function checkAchievements() {
    const stats = player;
    
    // First kill achievement
    if (stats.kills >= 1 && !firstTimeExperience.achievementsUnlocked.has('first_kill')) {
        unlockAchievement('first_kill');
        completeObjective('kill_first_zombie');
    }
    
    // Kill count achievements
    if (stats.kills >= 10 && !firstTimeExperience.achievementsUnlocked.has('kill_10_zombies')) {
        unlockAchievement('kill_10_zombies');
    }
    
    if (stats.kills >= 50 && !firstTimeExperience.achievementsUnlocked.has('kill_50_zombies')) {
        unlockAchievement('kill_50_zombies');
    }
    
    // Sections cleared achievement
    if (stats.sectionCleared >= 1 && !firstTimeExperience.achievementsUnlocked.has('first_section')) {
        unlockAchievement('first_section');
        completeObjective('clear_first_section');
    }
    
    // Territory claimed achievement
    if (stats.territoriesClaimed >= 1 && !firstTimeExperience.achievementsUnlocked.has('first_territory')) {
        unlockAchievement('first_territory');
        completeObjective('claim_first_territory');
    }
    
    // Level achievement
    if (stats.level >= 5 && !firstTimeExperience.achievementsUnlocked.has('reach_level_5')) {
        unlockAchievement('reach_level_5');
        completeObjective('reach_level_5');
    }
    
    // Survival time achievement
    if (!firstTimeExperience.achievementsUnlocked.has('survive_5_minutes')) {
        const currentTime = performance.now();
        const survivalTimeMs = currentTime - player.gameStartTime;
        const survivalTimeMinutes = survivalTimeMs / (1000 * 60);
        
        if (survivalTimeMinutes >= 5) {
            unlockAchievement('survive_5_minutes');
            completeObjective('survive_5_minutes');
        }
    }
}

// =============== GUIDE TOOLTIPS SYSTEM ===============

// Add guide tooltip styles
function addGuideTooltipStyles() {
    if (document.getElementById('guideTooltipStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'guideTooltipStyles';
    style.textContent = `
        .guide-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 900;
        }
        
        .guide-tooltip {
            position: absolute;
            background-color: rgba(10, 20, 35, 0.95);
            backdrop-filter: blur(8px);
            border: 2px solid #4a80b0;
            border-radius: 8px;
            padding: 12px;
            width: 200px;
            box-shadow: 0 0 15px rgba(0, 100, 200, 0.4);
            z-index: 901;
            pointer-events: none;
            animation: tooltip-appear 0.2s ease-out;
        }
        
        .guide-tooltip.left:after {
            content: '';
            position: absolute;
            top: 50%;
            right: -10px;
            transform: translateY(-50%);
            border-width: 10px 0 10px 10px;
            border-style: solid;
            border-color: transparent transparent transparent rgba(10, 20, 35, 0.95);
        }
        
        .guide-tooltip.right:after {
            content: '';
            position: absolute;
            top: 50%;
            left: -10px;
            transform: translateY(-50%);
            border-width: 10px 10px 10px 0;
            border-style: solid;
            border-color: transparent rgba(10, 20, 35, 0.95) transparent transparent;
        }
        
        .guide-tooltip.top:after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 10px 10px 0 10px;
            border-style: solid;
            border-color: rgba(10, 20, 35, 0.95) transparent transparent transparent;
        }
        
        .guide-tooltip.bottom:after {
            content: '';
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 0 10px 10px 10px;
            border-style: solid;
            border-color: transparent transparent rgba(10, 20, 35, 0.95) transparent;
        }
        
        .tooltip-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            color: #7ac6ff;
            margin-bottom: 5px;
        }
        
        .tooltip-description {
            font-size: 12px;
            line-height: 1.4;
            color: #e0e0e0;
        }
        
        @keyframes tooltip-appear {
            from { opacity: 0; transform: scale(0.95) translateY(-50%); }
            to { opacity: 1; transform: scale(1) translateY(-50%); }
        }
        
        /* Adjust animations for different positions */
        .guide-tooltip.top {
            animation: tooltip-appear-top 0.2s ease-out;
        }
        
        .guide-tooltip.bottom {
            animation: tooltip-appear-bottom 0.2s ease-out;
        }
        
        @keyframes tooltip-appear-top {
            from { opacity: 0; transform: scale(0.95) translateX(-50%); }
            to { opacity: 1; transform: scale(1) translateX(-50%); }
        }
        
        @keyframes tooltip-appear-bottom {
            from { opacity: 0; transform: scale(0.95) translateX(-50%); }
            to { opacity: 1; transform: scale(1) translateX(-50%); }
        }
    `;
    
    document.head.appendChild(style);
}

// Add styles for intro screen
function addIntroScreenStyles() {
    if (document.getElementById('introStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'introStyles';
    style.textContent = `
        @keyframes bg-pulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .intro-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(-45deg, #1a1a2e, #0f3460, #440a67, #331e38);
            background-size: 400% 400%;
            animation: bg-pulse 15s ease infinite;
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            overflow-y: auto;
            transition: opacity 0.5s ease;
        }
        
        .intro-screen.fade-out {
            opacity: 0;
        }
        
        .intro-content {
            max-width: 800px;
            width: 90%;
            padding: 30px;
            background-color: rgba(10, 10, 20, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(80, 130, 170, 0.4);
            text-align: center;
            max-height: 90vh;
            overflow-y: auto;
            margin: 20px;
        }
        
        .intro-title {
            font-size: 42px;
            margin: 0 0 10px 0;
            text-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
            color: #ff3a3a;
            letter-spacing: 2px;
        }
        
        .intro-subtitle {
            font-size: 20px;
            margin-bottom: 25px;
            color: #7ac6ff;
            letter-spacing: 3px;
        }
        
        .intro-story {
            margin: 25px 0;
            color: #ddd;
            font-family: 'Roboto', sans-serif;
            font-weight: 300;
            line-height: 1.6;
            font-size: 16px;
        }
        
        .intro-story p {
            margin: 10px 0;
        }
        
        .intro-objectives {
            margin: 25px 0;
            text-align: left;
            padding: 20px;
            background-color: rgba(30, 30, 50, 0.7);
            border-radius: 10px;
        }
        
        .intro-objectives h3 {
            color: #7ac6ff;
            margin-top: 0;
            margin-bottom: 15px;
        }
        
        .intro-objectives ul {
            padding-left: 20px;
        }
        
        .intro-objectives li {
            margin-bottom: 10px;
            position: relative;
            list-style-type: none;
            padding-left: 25px;
        }
        
        .intro-objectives li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #4bff7e;
        }
        
        .intro-controls {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            margin: 30px 0;
        }
        
        .control-category {
            margin: 15px;
            text-align: center;
        }
        
        .control-category h3 {
            color: #7ac6ff;
            margin-bottom: 15px;
        }
        
        .key-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .key-row {
            display: flex;
            gap: 5px;
            margin-top: 5px;
        }
        
        .key {
            width: 40px;
            height: 40px;
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            border: 2px solid #4a80b0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            color: #fff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        .mouse-icon {
            width: 30px;
            height: 50px;
            border: 2px solid #4a80b0;
            border-radius: 15px;
            position: relative;
            background: linear-gradient(to bottom, #3a6090, #2a4060);
        }
        
        .mouse-icon::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 10px;
            background-color: #7ac6ff;
            border-radius: 2px;
            animation: mouse-scroll 1.5s infinite;
        }
        
        @keyframes mouse-scroll {
            0% { transform: translate(-50%, 0); opacity: 1; }
            100% { transform: translate(-50%, 10px); opacity: 0; }
        }
        
        .key-desc {
            margin-top: 10px;
            font-size: 14px;
            color: #ddd;
        }
        
        .start-game-btn {
            background: linear-gradient(to bottom, #d44, #a22);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-family: 'Orbitron', sans-serif;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
            box-shadow: 0 5px 15px rgba(255, 50, 50, 0.4);
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 50, 50, 0.6);
        }
        
        .start-game-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(255, 50, 50, 0.6);
            background: linear-gradient(to bottom, #f55, #b33);
        }
    `;
    
    document.head.appendChild(style);
}

// Add tutorial CSS styles
function addTutorialStyle() {
    if (document.getElementById('tutorialStyle')) return;
    
    const style = document.createElement('style');
    style.id = 'tutorialStyle';
    style.textContent = `
        .tutorial-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            pointer-events: none;
        }
        
        .tutorial-popup {
            position: absolute;
            background-color: rgba(10, 20, 35, 0.95);
            backdrop-filter: blur(8px);
            border: 2px solid #4a80b0;
            border-radius: 10px;
            padding: 20px;
            max-width: 400px;
            box-shadow: 0 0 20px rgba(0, 100, 200, 0.4);
            z-index: 1001;
            pointer-events: auto;
            animation: tutorial-popup-appear 0.3s ease-out;
        }
        
        .tutorial-popup.center {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .tutorial-popup.top {
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .tutorial-popup.bottom {
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .tutorial-popup.top-left {
            top: 120px;
            left: 20px;
        }
        
        .tutorial-popup.left {
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .tutorial-popup.right {
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .tutorial-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 18px;
            color: #7ac6ff;
            margin-bottom: 10px;
            border-bottom: 1px solid #4a80b0;
            padding-bottom: 5px;
        }
        
        .tutorial-content {
            font-size: 14px;
            line-height: 1.5;
            color: #e0e0e0;
            margin-bottom: 15px;
        }
        
        .tutorial-buttons {
            display: flex;
            justify-content: space-between;
        }
        
        .tutorial-next-btn {
            background: linear-gradient(to bottom, #2a5080, #1a3050);
            color: #e0e0e0;
            padding: 8px 15px;
            border: 1px solid #3a6090;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .tutorial-next-btn:hover {
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        
        .tutorial-skip-btn {
            background: transparent;
            color: #999;
            padding: 8px 15px;
            border: 1px solid #444;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .tutorial-skip-btn:hover {
            background: rgba(255, 50, 50, 0.2);
            color: #ff5050;
            border-color: #ff5050;
        }
        
        .tutorial-highlight {
            position: absolute;
            z-index: 999;
            box-shadow: 0 0 0 5px rgba(122, 198, 255, 0.7);
            border-radius: 5px;
            pointer-events: none;
            animation: tutorial-highlight-pulse 1.5s infinite ease-in-out;
        }
        
        .wasd-keys {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: grid;
            grid-template-areas:
                ". up ."
                "left down right";
            grid-gap: 5px;
            z-index: 1002;
            pointer-events: none;
        }
        
        .key {
            width: 50px;
            height: 50px;
            background: linear-gradient(to bottom, #3a6090, #2a4060);
            border: 2px solid #4a80b0;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Orbitron', sans-serif;
            font-size: 18px;
            color: #fff;
            box-shadow: 0 0 10px rgba(122, 198, 255, 0.7);
            animation: tutorial-key-pulse 1.5s infinite ease-in-out;
        }
        
        .key.w { grid-area: up; }
        .key.a { grid-area: left; }
        .key.s { grid-area: down; }
        .key.d { grid-area: right; }
        
        .contextual-tip {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(10, 20, 35, 0.95);
            backdrop-filter: blur(8px);
            border: 2px solid #4a80b0;
            border-radius: 10px;
            padding: 15px;
            max-width: 350px;
            box-shadow: 0 0 15px rgba(0, 100, 200, 0.4);
            z-index: 900;
            pointer-events: all;
            animation: contextual-tip-appear 0.3s ease-out, contextual-tip-disappear 0.3s ease-in 5s forwards;
        }
        
        .contextual-tip-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            color: #7ac6ff;
            margin-bottom: 8px;
        }
        
        .contextual-tip-content {
            font-size: 14px;
            line-height: 1.4;
            color: #e0e0e0;
        }
        
        .contextual-tip-close {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ccc;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .contextual-tip-close:hover {
            background: rgba(255, 50, 50, 0.2);
            color: #fff;
        }
        
        @keyframes tutorial-popup-appear {
            from { opacity: 0; transform: translateY(20px) translateX(-50%); }
            to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        
        @keyframes tutorial-highlight-pulse {
            0% { box-shadow: 0 0 0 5px rgba(122, 198, 255, 0.4); }
            50% { box-shadow: 0 0 0 5px rgba(122, 198, 255, 0.7); }
            100% { box-shadow: 0 0 0 5px rgba(122, 198, 255, 0.4); }
        }
        
        @keyframes tutorial-key-pulse {
            0% { transform: scale(1); box-shadow: 0 0 10px rgba(122, 198, 255, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(122, 198, 255, 0.7); }
            100% { transform: scale(1); box-shadow: 0 0 10px rgba(122, 198, 255, 0.4); }
        }
        
        @keyframes contextual-tip-appear {
            from { opacity: 0; transform: translateY(-20px) translateX(-50%); }
            to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        
        @keyframes contextual-tip-disappear {
            from { opacity: 1; transform: translateY(0) translateX(-50%); }
            to { opacity: 0; transform: translateY(-20px) translateX(-50%); }
        }
    `;
    
    document.head.appendChild(style);
}

// Create interactive guides for important stats
function createInteractiveGuides() {
    // Create guide overlay container if it doesn't exist
    if (!document.getElementById('guideOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'guideOverlay';
        overlay.className = 'guide-overlay';
        document.getElementById('gameContainer').appendChild(overlay);
    }
    
    // Create guide for health bar
    addGuideTooltip('#healthBar', 'Health', 'Your health decreases when hit by zombies. Game over if it reaches zero.', 'left');
    
    // Create guide for armor bar
    addGuideTooltip('#armorBar', 'Armor', 'Armor absorbs 50% of incoming damage. Collect armor pickups to replenish.', 'left');
    
    // Create guide for experience bar
    addGuideTooltip('#xpBar', 'Experience', 'Gain XP by killing zombies. Level up to choose stat upgrades.', 'left');
    
    // Create guide for ammo bar
    addGuideTooltip('#ammoBar', 'Ammo', 'Current weapon ammo. Press R to reload when low.', 'left');
    
    // Create guide for minimap
    addGuideTooltip('#minimap', 'Minimap', 'Shows discovered sections, territories, and zombies nearby.', 'left');
    
    // Create guide for torch display
    addGuideTooltip('.torch-display', 'Torches', 'Place torches (F key) to claim territory after clearing a section.', 'top');
    
    // Create guide for weapon bar
    addGuideTooltip('#weaponBar', 'Weapons', 'Your equipped weapons. Switch using 1-5 keys or mouse wheel.', 'top');
    
    // Create guide for evolution timer
    addGuideTooltip('#evolutionTimer', 'Evolution Timer', 'Zombies become stronger when this timer reaches zero.', 'bottom');
}

// Add an interactive tooltip to an element
function addGuideTooltip(selector, title, description, position) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    // Add tooltip attribute
    element.setAttribute('data-tooltip', 'true');
    element.setAttribute('data-tooltip-title', title);
    element.setAttribute('data-tooltip-description', description);
    element.setAttribute('data-tooltip-position', position);
    
    // Add hover event listeners
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
}

// Show tooltip
function showTooltip(event) {
    // Don't show tooltips during tutorial
    if (!tutorial.completed) return;
    
    const element = event.currentTarget;
    const title = element.getAttribute('data-tooltip-title');
    const description = element.getAttribute('data-tooltip-description');
    const position = element.getAttribute('data-tooltip-position');
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = `guide-tooltip ${position}`;
    tooltip.innerHTML = `
        <div class="tooltip-title">${title}</div>
        <div class="tooltip-description">${description}</div>
    `;
    
    // Get element position
    const rect = element.getBoundingClientRect();
    
    // Position tooltip based on specified position
    if (position === 'left') {
        tooltip.style.right = `${window.innerWidth - rect.left + 10}px`;
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.transform = 'translateY(-50%)';
    } else if (position === 'right') {
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.transform = 'translateY(-50%)';
    } else if (position === 'top') {
        tooltip.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
    } else if (position === 'bottom') {
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
    }
    
    // Add to guide overlay
    document.getElementById('guideOverlay').appendChild(tooltip);
}

// Hide tooltip
function hideTooltip() {
    // Remove all tooltips
    const tooltips = document.querySelectorAll('.guide-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
}

// Update difficulty indicator based on player distance from start
function updateDifficultyIndicator() {
    const fill = document.getElementById('difficultyFill');
    const text = document.getElementById('difficultyText');
    
    if (!fill || !text) return;
    
    // Calculate distance from start point
    const distanceFromStart = Math.sqrt(
        Math.pow(player.x - player.startX, 2) + 
        Math.pow(player.y - player.startY, 2)
    );
    
    // Convert to section distance
    const sectionSize = CONFIG.SECTION_SIZE;
    const sectionDistance = distanceFromStart / sectionSize;
    
    // Calculate difficulty percentage (cap at 100%)
    const difficultyPercent = Math.min(100, sectionDistance * 15);
    
    // Update fill width
    fill.style.width = `${difficultyPercent}%`;
    
    // Update text based on difficulty
    let difficultyText = 'Safe';
    let textColor = '#4bff7e';
    
    if (difficultyPercent >= 80) {
        difficultyText = 'Extreme';
        textColor = '#ff4b4b';
    } else if (difficultyPercent >= 60) {
        difficultyText = 'High';
        textColor = '#ff7847';
    } else if (difficultyPercent >= 40) {
        difficultyText = 'Medium';
        textColor = '#ffdc4b';
    } else if (difficultyPercent >= 20) {
        difficultyText = 'Low';
        textColor = '#b8ff4b';
    }
    
    text.textContent = difficultyText;
    text.style.color = textColor;
}

// =============== INTEGRATED UPDATE FUNCTION ===============

// Integrated update function for tutorial system
function updateTutorialSystem() {
    // Check for contextual tips
    checkContextualTips();
    
    // Check for achievements
    checkAchievements();
    
    // Update difficulty indicator
    updateDifficultyIndicator();
}

// =============== GAME INTEGRATION ===============

// Integrate with game update loop
function integrateTutorialSystem() {
    // Add to the game's update function
    const originalUpdate = window.update;
    window.update = function(currentTime) {
        // Call original update
        originalUpdate(currentTime);
        
        // Update tutorial system
        if (typeof updateTutorialSystem === 'function') {
            updateTutorialSystem();
        }
    };
}

// Main entry point for the tutorial system
function initializeGameGuide() {
    // Initialize the tutorial system
    initTutorialSystem();
    
    // Integrate with the game loop
    integrateTutorialSystem();
}

// Export the main initialization function
window.initializeGameGuide = initializeGameGuide;