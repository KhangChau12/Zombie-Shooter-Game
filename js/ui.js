// UI handling and menus

// Update UI elements with current player stats
function updateUI() {
    // Update health, armor, xp, and ammo values
    document.getElementById('health').textContent = Math.ceil(player.health);
    document.getElementById('maxHealth').textContent = player.maxHealth;
    document.getElementById('armor').textContent = Math.ceil(player.armor);
    document.getElementById('maxArmor').textContent = player.maxArmor;
    document.getElementById('xp').textContent = player.xp;
    document.getElementById('xpNext').textContent = player.xpToNextLevel;
    document.getElementById('ammo').textContent = player.weapon.ammo;
    document.getElementById('maxAmmo').textContent = player.weapon.maxAmmo;
    
    // Update stats
    document.getElementById('level').textContent = player.level;
    document.getElementById('coins').textContent = formatNumber(player.coins);
    document.getElementById('kills').textContent = formatNumber(player.kills);
    document.getElementById('explored').textContent = player.exploredSections.size;
    
    // Update character stats
    document.getElementById('baseDamage').textContent = Math.round(player.baseDamage);
    document.getElementById('critChance').textContent = Math.round(player.critChance);
    document.getElementById('moveSpeed').textContent = player.speed.toFixed(1);
    document.getElementById('fireRate').textContent = (1000 / player.weapon.fireRate).toFixed(1);
    
    // Calculate distance from start
    const distanceFromStart = Math.sqrt(
        Math.pow(player.x - player.startX, 2) + 
        Math.pow(player.y - player.startY, 2)
    );
    document.getElementById('distance').textContent = Math.floor(distanceFromStart);
    
    // Update progress bars
    document.getElementById('healthBar').style.width = (player.health / player.maxHealth * 100) + '%';
    document.getElementById('armorBar').style.width = (player.armor / player.maxArmor * 100) + '%';
    document.getElementById('xpBar').style.width = (player.xp / player.xpToNextLevel * 100) + '%';
    document.getElementById('ammoBar').style.width = (player.weapon.ammo / player.weapon.maxAmmo * 100) + '%';
    
    // Update shop coin displays
    document.getElementById('shopCoins').textContent = formatNumber(player.coins);
    document.getElementById('weaponUpgradeCoins').textContent = formatNumber(player.coins);
    
    // Update game over stats
    document.getElementById('finalKills').textContent = formatNumber(player.kills);
    document.getElementById('finalLevel').textContent = player.level;
    document.getElementById('survivalTime').textContent = getPlayerSurvivalTime();
}

// Open the shop menu
function openShop() {
    const shopMenu = document.getElementById('shopMenu');
    
    // Fill weapon options
    populateWeaponOptions();
    
    // Fill upgrade options
    populateUpgradeOptions();
    
    // Fill equipment options
    populateEquipmentOptions();
    
    // Show the shop
    shopMenu.style.display = 'flex';
    
    // Pause the game
    gameRunning = false;
}

// Close the shop menu
function closeShop() {
    document.getElementById('shopMenu').style.display = 'none';
    gameRunning = true;
}

// Populate weapon options in the shop
function populateWeaponOptions() {
    const weaponOptions = document.getElementById('weaponOptions');
    weaponOptions.innerHTML = '';
    
    // Add each weapon to the shop
    WEAPONS.forEach(weaponData => {
        // Skip if it's already the active weapon
        if (weaponData.id === player.activeWeaponId) {
            return;
        }
        
        const weaponElement = document.createElement('div');
        weaponElement.className = 'shop-item';
        
        // Base HTML
        weaponElement.innerHTML = `
            <h3>${weaponData.name}</h3>
            <p>${weaponData.description}</p>
            <p>Damage: ${weaponData.damage}</p>
            <p>Fire Rate: ${(1000 / weaponData.fireRate).toFixed(1)} shots/sec</p>
            <p>Ammo: ${weaponData.maxAmmo}</p>
            <div class="item-cost">
                <span class="cost-value">${formatNumber(weaponData.cost)} coins</span>
                <button class="buy-weapon" data-id="${weaponData.id}" ${
                    (!weaponData.unlocked && player.coins < weaponData.cost) ? 'disabled' : ''
                }>
                    ${weaponData.unlocked ? 'Equip' : 'Buy'}
                </button>
            </div>
        `;
        
        // Add event listener
        const buyButton = weaponElement.querySelector('.buy-weapon');
        buyButton.addEventListener('click', () => {
            if (weaponData.unlocked) {
                // Already unlocked, just equip it
                switchWeapon(weaponData.id);
                closeShop();
            } else if (player.coins >= weaponData.cost) {
                // Buy and equip the weapon
                player.coins -= weaponData.cost;
                weaponData.unlocked = true;
                switchWeapon(weaponData.id);
                updateUI();
                closeShop();
                
                showGameMessage(`Purchased ${weaponData.name}!`);
            }
        });
        
        weaponOptions.appendChild(weaponElement);
    });
    
    // If no weapons to show
    if (weaponOptions.children.length === 0) {
        weaponOptions.innerHTML = '<p>You have all available weapons.</p>';
    }
}

// Populate upgrade options in the shop
function populateUpgradeOptions() {
    const upgradeOptions = document.getElementById('upgradeOptions');
    upgradeOptions.innerHTML = '';
    
    // Add upgrades to shop
    CONFIG.STAT_UPGRADE_TYPES.forEach(upgrade => {
        // Create upgrade element
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'shop-item';
        
        // Calculate cost based on player level
        const upgradeCost = 500 + (player.level - 1) * 100;
        
        // Base HTML
        upgradeElement.innerHTML = `
            <h3>${upgrade.name}</h3>
            <p>${upgrade.description}</p>
            <div class="item-cost">
                <span class="cost-value">${formatNumber(upgradeCost)} coins</span>
                <button class="buy-upgrade" ${player.coins < upgradeCost ? 'disabled' : ''}>
                    Upgrade
                </button>
            </div>
        `;
        
        // Add event listener
        const buyButton = upgradeElement.querySelector('.buy-upgrade');
        buyButton.addEventListener('click', () => {
            if (player.coins >= upgradeCost) {
                player.coins -= upgradeCost;
                applyStatUpgrade(upgrade);
                updateUI();
                
                showGameMessage(`${upgrade.name} upgraded!`);
                
                // Refresh shop
                populateUpgradeOptions();
            }
        });
        
        upgradeOptions.appendChild(upgradeElement);
    });
}

// Populate equipment options in the shop
function populateEquipmentOptions() {
    const equipmentOptions = document.getElementById('equipmentOptions');
    equipmentOptions.innerHTML = '<p>Equipment will be available in future updates.</p>';
}

// Open weapon upgrade menu
function openWeaponUpgradeMenu() {
    const weaponUpgradeMenu = document.getElementById('weaponUpgradeMenu');
    
    // Populate weapon upgrade options
    populateWeaponUpgradeOptions();
    
    // Show the menu
    weaponUpgradeMenu.style.display = 'flex';
    
    // Pause the game
    gameRunning = false;
}

// Close weapon upgrade menu
function closeWeaponUpgradeMenu() {
    document.getElementById('weaponUpgradeMenu').style.display = 'none';
    gameRunning = true;
}

// Populate weapon upgrade options
function populateWeaponUpgradeOptions() {
    const weaponUpgradeOptions = document.getElementById('weaponUpgradeOptions');
    weaponUpgradeOptions.innerHTML = '';
    
    // Get current weapon
    const currentWeapon = WEAPONS.find(w => w.id === player.activeWeaponId);
    
    // Add title for current weapon
    const weaponTitle = document.createElement('div');
    weaponTitle.className = 'upgrade-title';
    weaponTitle.innerHTML = `<h3>Upgrades for ${currentWeapon.name}</h3>`;
    weaponUpgradeOptions.appendChild(weaponTitle);
    
    // Add each upgrade type
    CONFIG.WEAPON_UPGRADE_TYPES.forEach(upgradeType => {
        const property = upgradeType.property;
        const currentLevel = currentWeapon.upgrades[property] || 0;
        const isMaxLevel = currentLevel >= upgradeType.maxLevel;
        
        // Calculate cost based on current upgrade level
        const upgradeCost = upgradeType.cost * (1 + currentLevel * 0.5);
        
        // Create upgrade element
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'upgrade-item';
        
        // Base HTML
        upgradeElement.innerHTML = `
            <h3>${upgradeType.name}</h3>
            <p>${upgradeType.description}</p>
            <p>Level: ${currentLevel}/${upgradeType.maxLevel}</p>
            <div class="item-cost">
                <span class="cost-value">${isMaxLevel ? 'MAXED' : formatNumber(upgradeCost) + ' coins'}</span>
                <button class="upgrade-weapon" data-property="${property}" 
                    ${(isMaxLevel || player.coins < upgradeCost) ? 'disabled' : ''}>
                    ${isMaxLevel ? 'Maxed' : 'Upgrade'}
                </button>
            </div>
        `;
        
        // Add event listener
        const upgradeButton = upgradeElement.querySelector('.upgrade-weapon');
        upgradeButton.addEventListener('click', () => {
            if (!isMaxLevel && player.coins >= upgradeCost) {
                // Apply the upgrade
                player.coins -= upgradeCost;
                applyWeaponUpgrade(currentWeapon.id, upgradeType);
                
                // Update the weapon instance
                player.weapon = createWeapon(currentWeapon.id);
                
                // Update UI
                updateUI();
                
                // Refresh options
                populateWeaponUpgradeOptions();
                
                showGameMessage(`${upgradeType.name} upgraded!`);
            }
        });
        
        weaponUpgradeOptions.appendChild(upgradeElement);
    });
}

// Show level up menu
function showLevelUpMenu() {
    const levelUpMenu = document.getElementById('levelUp');
    const statUpgradeOptions = document.getElementById('statUpgradeOptions');
    statUpgradeOptions.innerHTML = '';
    
    // Create options for each stat
    CONFIG.STAT_UPGRADE_TYPES.forEach(upgrade => {
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'upgrade-item';
        
        // Check if stat is at maximum
        let isMaxed = false;
        if (upgrade.max && player[upgrade.property] >= upgrade.max) {
            isMaxed = true;
        }
        
        // Calculate the new value after upgrade
        let newValue;
        if (upgrade.value) {
            newValue = player[upgrade.property] + upgrade.value;
            if (upgrade.max) {
                newValue = Math.min(newValue, upgrade.max);
            }
        } else if (upgrade.multiplier) {
            newValue = (player[upgrade.property] * upgrade.multiplier).toFixed(1);
        }
        
        // Create HTML
        upgradeElement.innerHTML = `
            <h3>${upgrade.name}</h3>
            <p>${upgrade.description}</p>
            <p>Current: ${player[upgrade.property]}</p>
            <p>New: ${newValue}</p>
            <button class="select-upgrade" ${isMaxed ? 'disabled' : ''}>
                ${isMaxed ? 'Maxed' : 'Select'}
            </button>
        `;
        
        // Add event listener
        const selectButton = upgradeElement.querySelector('.select-upgrade');
        if (!isMaxed) {
            selectButton.addEventListener('click', () => {
                applyStatUpgrade(upgrade);
                levelUpMenu.style.display = 'none';
                gameRunning = true;
                
                showGameMessage(`Level ${player.level} reached!`);
            });
        }
        
        statUpgradeOptions.appendChild(upgradeElement);
    });
    
    // Show the menu
    levelUpMenu.style.display = 'flex';
    
    // Pause the game
    gameRunning = false;
}

// Show game over screen
function gameOver() {
    gameRunning = false;
    document.getElementById('survivalTime').textContent = getPlayerSurvivalTime();
    document.getElementById('finalKills').textContent = formatNumber(player.kills);
    document.getElementById('finalLevel').textContent = player.level;
    document.getElementById('gameOver').style.display = 'flex';
    
    // Play game over sound
    // playSound('gameOver');
}

// Setup shop tab navigation
function setupShopTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            
            // Show corresponding content
            const tabName = button.getAttribute('data-tab');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Initialize UI event listeners
function initUI() {
    // Setup shop tabs
    setupShopTabs();
    
    // Button event listeners
    document.getElementById('shopButton').addEventListener('click', openShop);
    document.getElementById('closeShopButton').addEventListener('click', closeShop);
    document.getElementById('weaponUpgradeButton').addEventListener('click', openWeaponUpgradeMenu);
    document.getElementById('closeWeaponUpgradeButton').addEventListener('click', closeWeaponUpgradeMenu);
    document.getElementById('restartButton').addEventListener('click', restartGame);
}