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
    
    // Update territory and torch counts if elements exist
    if (document.getElementById('territories')) {
        document.getElementById('territories').textContent = player.territoriesClaimed;
    }
    
    if (document.getElementById('torches')) {
        document.getElementById('torches').textContent = player.torchCount;
    }
    
    if (document.getElementById('sectionsCleared')) {
        document.getElementById('sectionsCleared').textContent = player.sectionCleared;
    }
    
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
            <p>Ammo: ${weaponData.maxAmmo} (${CONFIG.AMMO_TYPES[weaponData.ammoType].name})</p>
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
                if (purchaseWeapon(weaponData.id)) {
                    switchWeapon(weaponData.id);
                    updateUI();
                    closeShop();
                    
                    showGameMessage(`Purchased ${weaponData.name}!`);
                }
            }
        });
        
        weaponOptions.appendChild(weaponElement);
    });
    
    // Add ammunition purchase options
    const ammoSection = document.createElement('div');
    ammoSection.className = 'shop-section';
    ammoSection.innerHTML = '<h3>Ammunition</h3>';
    
    // Add each ammo type
    for (const ammoType in CONFIG.AMMO_TYPES) {
        const ammoConfig = CONFIG.AMMO_TYPES[ammoType];
        
        // Check if player has a weapon that uses this ammo
        const weaponUsingThisAmmo = WEAPONS.find(w => w.ammoType === ammoType && w.unlocked);
        if (!weaponUsingThisAmmo) continue;
        
        const ammoElement = document.createElement('div');
        ammoElement.className = 'shop-item';
        
        // Calculate how many packs to reach max
        const currentReserve = player.ammunition[ammoType].reserve;
        const maxReserve = ammoConfig.maxReserve;
        const packSize = ammoConfig.packSize;
        const packsToMax = Math.ceil((maxReserve - currentReserve) / packSize);
        
        // Create ammo item
        ammoElement.innerHTML = `
            <h3>${ammoConfig.name}</h3>
            <p>${weaponUsingThisAmmo.name} Ammunition</p>
            <p>Pack size: ${packSize} rounds</p>
            <p>Reserve: ${currentReserve}/${maxReserve}</p>
            <div class="item-cost">
                <span class="cost-value">${formatNumber(ammoConfig.cost)} coins</span>
                <button class="buy-ammo" data-type="${ammoType}" ${
                    (currentReserve >= maxReserve || player.coins < ammoConfig.cost) ? 'disabled' : ''
                }>
                    ${currentReserve >= maxReserve ? 'Max' : 'Buy'}
                </button>
            </div>
        `;
        
        // Add event listener
        const buyButton = ammoElement.querySelector('.buy-ammo');
        if (!buyButton.disabled) {
            buyButton.addEventListener('click', () => {
                if (purchaseAmmunition(ammoType)) {
                    updateUI();
                    
                    // Refresh ammo options
                    populateWeaponOptions();
                    
                    showGameMessage(`Purchased ${packSize} ${ammoConfig.name}!`);
                }
            });
        }
        
        ammoSection.appendChild(ammoElement);
    }
    
    // Add torch purchase option
    const torchElement = document.createElement('div');
    torchElement.className = 'shop-item';
    
    const torchCost = CONFIG.TERRITORY.TORCH_COST;
    
    torchElement.innerHTML = `
        <h3>Territory Torch</h3>
        <p>Used to claim territory after clearing zombies from a section</p>
        <p>Current: ${player.torchCount}</p>
        <div class="item-cost">
            <span class="cost-value">${formatNumber(torchCost)} coins</span>
            <button class="buy-torch" ${player.coins < torchCost ? 'disabled' : ''}>
                Buy
            </button>
        </div>
    `;
    
    // Add event listener for torch purchase
    const torchButton = torchElement.querySelector('.buy-torch');
    if (!torchButton.disabled) {
        torchButton.addEventListener('click', () => {
            if (player.coins >= torchCost) {
                // Purchase torch
                player.coins -= torchCost;
                addTorches(1);
                
                updateUI();
                
                // Refresh torch option
                populateWeaponOptions();
                
                showGameMessage(`Purchased 1 Territory Torch!`);
            }
        });
    }
    
    ammoSection.appendChild(torchElement);
    weaponOptions.appendChild(ammoSection);
    
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
    
    // Add territory upgrades section
    const territorySection = document.createElement('div');
    territorySection.className = 'shop-section';
    territorySection.innerHTML = '<h3>Territory System</h3>';
    
    // Add territory stats
    const territoryStatsElement = document.createElement('div');
    territoryStatsElement.className = 'shop-item';
    territoryStatsElement.innerHTML = `
        <h3>Territory Stats</h3>
        <p>Territories Claimed: ${player.territoriesClaimed}</p>
        <p>Sections Cleared: ${player.sectionCleared}</p>
        <p>Health Regen: ${CONFIG.TERRITORY.HEALTH_REGEN}/s</p>
        <p>Damage Boost: +${((CONFIG.TERRITORY.DAMAGE_BOOST - 1) * 100).toFixed(0)}%</p>
    `;
    
    territorySection.appendChild(territoryStatsElement);
    upgradeOptions.appendChild(territorySection);
}

// Populate equipment options in the shop
function populateEquipmentOptions() {
    const equipmentOptions = document.getElementById('equipmentOptions');
    equipmentOptions.innerHTML = '';
    
    // Add weapon attachment info and management
    const attachmentSection = document.createElement('div');
    attachmentSection.className = 'shop-section';
    attachmentSection.innerHTML = '<h3>Weapon Attachments</h3>';
    
    // Display current weapon's attachments
    const currentWeapon = getWeaponById(player.activeWeaponId);
    
    const weaponElement = document.createElement('div');
    weaponElement.className = 'shop-item';
    
    let attachmentsHTML = '';
    if (currentWeapon.attachments && currentWeapon.attachments.length > 0) {
        attachmentsHTML = '<ul class="attachment-list">';
        
        for (const attachmentId of currentWeapon.attachments) {
            const attachment = CONFIG.ATTACHMENTS.find(a => a.id === attachmentId);
            if (attachment) {
                attachmentsHTML += `
                    <li>
                        ${attachment.name} - ${attachment.description}
                        <button class="remove-attachment" data-id="${attachmentId}">Remove</button>
                    </li>
                `;
            }
        }
        
        attachmentsHTML += '</ul>';
    } else {
        attachmentsHTML = '<p>No attachments equipped</p>';
    }
    
    weaponElement.innerHTML = `
        <h3>${currentWeapon.name} Attachments</h3>
        <p>${currentWeapon.attachments.length}/${currentWeapon.attachmentSlots} slots used</p>
        ${attachmentsHTML}
        <p class="attachment-help">Find attachments in treasure chests after clearing sections</p>
    `;
    
    // Add event listeners for remove buttons
    weaponElement.querySelectorAll('.remove-attachment').forEach(button => {
        button.addEventListener('click', () => {
            const attachmentId = button.getAttribute('data-id');
            if (removeAttachmentFromWeapon(currentWeapon.id, attachmentId)) {
                // Refresh the equipment tab
                populateEquipmentOptions();
                updateUI();
            }
        });
    });
    
    attachmentSection.appendChild(weaponElement);
    equipmentOptions.appendChild(attachmentSection);
    
    // Add "Coming soon" section
    const comingSoonElement = document.createElement('div');
    comingSoonElement.className = 'shop-item';
    comingSoonElement.innerHTML = '<p>More equipment options will be available in future updates.</p>';
    
    equipmentOptions.appendChild(comingSoonElement);
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
    
    // Add current weapon stats
    const statsElement = document.createElement('div');
    statsElement.className = 'weapon-stats';
    
    // Get stats description
    const statsDescription = getWeaponStatsDescription(currentWeapon);
    
    statsElement.innerHTML = `
        <h3>Current Stats</h3>
        <pre>${statsDescription}</pre>
    `;
    
    weaponUpgradeOptions.appendChild(statsElement);
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
    
    // Add territory stats
    const statsElement = document.createElement('p');
    statsElement.textContent = `Territories claimed: ${player.territoriesClaimed} | Sections cleared: ${player.sectionCleared}`;
    
    // Add to game over modal if it doesn't already exist
    const modalContent = document.querySelector('#gameOver .modal-content');
    if (!modalContent.querySelector('.territory-stats')) {
        statsElement.className = 'territory-stats';
        modalContent.insertBefore(statsElement, document.getElementById('restartButton'));
    }
    
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

// Show territory claim confirmation dialog
function showTerritoryClaimConfirmation(section) {
    // Create confirmation dialog if it doesn't exist
    if (!document.getElementById('territoryConfirm')) {
        const confirmDialog = document.createElement('div');
        confirmDialog.id = 'territoryConfirm';
        confirmDialog.className = 'modal';
        
        confirmDialog.innerHTML = `
            <div class="modal-content">
                <h2>Claim Territory</h2>
                <p>Do you want to place a torch here? (${player.torchCount} remaining)</p>
                <p>When you place 4 torches in each corner of a section, you will claim it as territory and gain health regeneration while inside.</p>
                <div class="button-group">
                    <button id="confirmTorchButton">Place Torch</button>
                    <button id="cancelTorchButton">Cancel</button>
                </div>
            </div>
        `;
        
        document.getElementById('gameContainer').appendChild(confirmDialog);
        
        // Add event listeners
        document.getElementById('confirmTorchButton').addEventListener('click', () => {
            placeTorch();
            document.getElementById('territoryConfirm').style.display = 'none';
            gameRunning = true;
        });
        
        document.getElementById('cancelTorchButton').addEventListener('click', () => {
            document.getElementById('territoryConfirm').style.display = 'none';
            gameRunning = true;
        });
    }
    
    // Update torch count
    const confirmText = document.querySelector('#territoryConfirm p');
    if (confirmText) {
        confirmText.textContent = `Do you want to place a torch here? (${player.torchCount} remaining)`;
    }
    
    // Show the confirmation dialog
    document.getElementById('territoryConfirm').style.display = 'flex';
    
    // Pause the game while confirming
    gameRunning = false;
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
    
    // Add territory and torch stats to UI if they don't exist
    addTerritoryStatsToUI();
}

// Add territory system stats to the UI
function addTerritoryStatsToUI() {
    // Get the stats section
    const statsSection = document.querySelector('.stats-section');
    
    // Check if territory stats already exist
    if (!document.getElementById('territories')) {
        // Create territory stats row
        const territoriesRow = document.createElement('div');
        territoriesRow.className = 'stat-row';
        territoriesRow.innerHTML = 'Territories: <span id="territories">0</span>';
        statsSection.appendChild(territoriesRow);
    }
    
    // Check if torches stat already exists
    if (!document.getElementById('torches')) {
        // Create torches stats row
        const torchesRow = document.createElement('div');
        torchesRow.className = 'stat-row';
        torchesRow.innerHTML = 'Torches: <span id="torches">0</span>';
        statsSection.appendChild(torchesRow);
    }
    
    // Check if sections cleared stat already exists
    if (!document.getElementById('sectionsCleared')) {
        // Create sections cleared stats row
        const clearedRow = document.createElement('div');
        clearedRow.className = 'stat-row';
        clearedRow.innerHTML = 'Cleared: <span id="sectionsCleared">0</span>';
        statsSection.appendChild(clearedRow);
    }
}