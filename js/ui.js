    // UI handling and menus

    // Update UI elements with current player stats
    function updateUI() {
        // Safely update text content of an element
        function safeUpdateText(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
        
        // Safely update style width of an element
        function safeUpdateWidth(id, percentage) {
            const element = document.getElementById(id);
            if (element) {
                element.style.width = percentage + '%';
            }
        }
        
        // Update health, armor, xp, and ammo values
        safeUpdateText('health', Math.ceil(player.health));
        safeUpdateText('maxHealth', player.maxHealth);
        safeUpdateText('armor', Math.ceil(player.armor));
        safeUpdateText('maxArmor', player.maxArmor);
        safeUpdateText('xp', player.xp);
        safeUpdateText('xpNext', player.xpToNextLevel);
        safeUpdateText('ammo', player.weapon.ammo);
        safeUpdateText('maxAmmo', player.weapon.maxAmmo);
        
        // Update stats
        safeUpdateText('level', player.level);
        safeUpdateText('coins', formatNumber(player.coins));
        safeUpdateText('kills', formatNumber(player.kills));
        safeUpdateText('explored', player.exploredSections.size);
        
        // Update character stats
        safeUpdateText('baseDamage', Math.round(player.baseDamage));
        safeUpdateText('critChance', Math.round(player.critChance));
        safeUpdateText('moveSpeed', player.speed.toFixed(1));
        safeUpdateText('fireRate', (1000 / player.weapon.fireRate).toFixed(1));
        
        // Calculate distance from start
        const distanceFromStart = Math.sqrt(
            Math.pow(player.x - player.startX, 2) + 
            Math.pow(player.y - player.startY, 2)
        );
        safeUpdateText('distance', Math.floor(distanceFromStart));
        
        // Update progress bars
        safeUpdateWidth('healthBar', (player.health / player.maxHealth * 100));
        safeUpdateWidth('armorBar', (player.armor / player.maxArmor * 100));
        safeUpdateWidth('xpBar', (player.xp / player.xpToNextLevel * 100));
        safeUpdateWidth('ammoBar', (player.weapon.ammo / player.weapon.maxAmmo * 100));
        
        // Update territory and torch counts if elements exist
        safeUpdateText('territories', player.territoriesClaimed);
        safeUpdateText('torches', player.torchCount);
        safeUpdateText('sectionsCleared', player.sectionCleared);
        
        // Update shop coin displays
        safeUpdateText('shopCoins', formatNumber(player.coins));
        safeUpdateText('upgradeCoins', formatNumber(player.coins));
        
        // Update game over stats
        safeUpdateText('finalKills', formatNumber(player.kills));
        safeUpdateText('finalLevel', player.level);
        safeUpdateText('survivalTime', getPlayerSurvivalTime());

        // Update top coin display
        safeUpdateText('topCoins', formatNumber(player.coins));
        
        // Update bottom weapon bar
        if (typeof updateBottomBar === 'function' && document.getElementById('bottomBar')) {
            updateBottomBar();
        }
        
        // If upgrade menu is open, update relevant panels
        if (document.getElementById('upgradeMenu').style.display === 'flex') {
            // Find which tab is active
            const activeTab = document.querySelector('#upgradeMenu .tab-button.active');
            if (activeTab) {
                const tabName = activeTab.getAttribute('data-tab');
                
                if (tabName === 'character') {
                    populateCharacterStats();
                    populateCharacterUpgradeOptions();
                } else if (tabName === 'weapons') {
                    // Update weapon selector (don't reset the selected weapon)
                    const selectedWeapon = document.querySelector('#weapons-tab #weaponSelector .weapon-select-item.active');
                    const selectedWeaponId = selectedWeapon ? selectedWeapon.querySelector('.weapon-select-name').textContent : null;
                    
                    populateWeaponSelectorForUpgrade();
                    
                    // Re-select the previously selected weapon if it exists
                    if (selectedWeaponId) {
                        const newSelectedWeapon = Array.from(document.querySelectorAll('#weapons-tab #weaponSelector .weapon-select-item'))
                            .find(item => item.querySelector('.weapon-select-name').textContent === selectedWeaponId);
                        
                        if (newSelectedWeapon) {
                            newSelectedWeapon.click();
                        }
                    }
                }
            }
        }
        
        // If shop menu is open, update relevant panels
        if (document.getElementById('shopMenu').style.display === 'flex') {
            // Find which tab is active
            const activeTab = document.querySelector('#shopMenu .tab-button.active');
            if (activeTab) {
                const tabName = activeTab.getAttribute('data-tab');
                
                if (tabName === 'weapons') {
                    populateWeaponOptions();
                } else if (tabName === 'ammo') {
                    populateAmmoOptions();
                } else if (tabName === 'others') {
                    populateOthersOptions();
                }
            }
        }
    }

    // Open the shop menu
    function openShop() {
        const shopMenu = document.getElementById('shopMenu');
        
        // Update coins display
        document.getElementById('shopCoins').textContent = formatNumber(player.coins);
        
        // Fill weapon options by default
        populateWeaponOptions();
        
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
            // Skip if it's already unlocked
            if (weaponData.unlocked && weaponData.id !== 'pistol') {
                return;
            }
            
            const weaponElement = document.createElement('div');
            weaponElement.className = 'shop-item weapon-shop-item';
            
            // Create weapon icon with the same style as weapon selector
            const iconColor = getWeaponColor(weaponData.id);
            const iconHtml = `
                <div class="weapon-shop-icon" style="color: ${iconColor};">
                    <div class="weapon-icon-body" style="background-color: ${iconColor};"></div>
                </div>
            `;
            
            // Base HTML
            weaponElement.innerHTML = `
                ${iconHtml}
                <h3>${weaponData.name}</h3>
                <p>${weaponData.description}</p>
                <div class="weapon-stats-grid">
                    <div class="weapon-stat">
                        <span class="stat-name">Damage:</span>
                        <span class="stat-value">${weaponData.damage}</span>
                    </div>
                    <div class="weapon-stat">
                        <span class="stat-name">Fire Rate:</span>
                        <span class="stat-value">${(1000 / weaponData.fireRate).toFixed(1)} shots/sec</span>
                    </div>
                    <div class="weapon-stat">
                        <span class="stat-name">Ammo:</span>
                        <span class="stat-value">${weaponData.maxAmmo} (${CONFIG.AMMO_TYPES[weaponData.ammoType].name})</span>
                    </div>
                    <div class="weapon-stat">
                        <span class="stat-name">Reload:</span>
                        <span class="stat-value">${(weaponData.reloadTime / 1000).toFixed(1)}s</span>
                    </div>
                </div>
                <div class="item-cost">
                    <span class="cost-value">${weaponData.id === 'pistol' ? 'Default' : formatNumber(weaponData.cost) + ' coins'}</span>
                    <button class="buy-weapon" data-id="${weaponData.id}" ${
                        (weaponData.id === 'pistol' || (weaponData.unlocked && player.coins < weaponData.cost)) ? 'disabled' : ''
                    }>
                        ${weaponData.id === 'pistol' ? 'Equipped' : (weaponData.unlocked ? 'Equip' : 'Buy')}
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
    }

    // Hàm tiện ích để lấy màu cho mỗi loại vũ khí
    function getWeaponColor(weaponId) {
        switch (weaponId) {
            case 'pistol': return '#FFD700'; // Gold
            case 'shotgun': return '#FF4500'; // OrangeRed
            case 'assaultRifle': return '#32CD32'; // LimeGreen
            case 'smg': return '#1E90FF'; // DodgerBlue
            case 'sniperRifle': return '#8A2BE2'; // BlueViolet
            default: return '#FFFFFF';
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
        // Chỉ tạo các phần tử UI cần thiết
        createUIElements();
        
        // Setup tabs cho cả hai menu
        setupTabSwitching();
        
        // Thiết lập sự kiện cho các nút đã có sẵn trong HTML
        document.getElementById('upgradeButton')?.addEventListener('click', openUpgradeMenu);
        document.getElementById('closeUpgradeButton')?.addEventListener('click', closeUpgradeMenu);
        document.getElementById('shopButton')?.addEventListener('click', openShop);
        document.getElementById('closeShopButton')?.addEventListener('click', closeShop);
        document.getElementById('settingsButton')?.addEventListener('click', showSettingsMenu);
        
        // Tạo các thành phần UI động khác
        createBottomBar();
        createLootNotificationContainer();
        
        // Chỉ thêm coin display nếu chưa tồn tại
        if (!document.getElementById('topCoinDisplay')) {
            addCoinDisplay();
        }
        
        // Xóa bất kỳ phần tử không mong muốn nào còn sót lại
        const oldElements = [
            document.getElementById('statsButton'),
            document.getElementById('weaponUpgradeButton')
        ];
        
        oldElements.forEach(element => {
            if (element) element.remove();
        });
    }

    // Thêm hàm addCoinDisplay mới
    function addCoinDisplay() {
        // Kiểm tra nếu đã tồn tại
        if (document.getElementById('topCoinDisplay')) return;
        
        // Tạo container hiển thị coin
        const coinDisplay = document.createElement('div');
        coinDisplay.id = 'topCoinDisplay';
        coinDisplay.className = 'top-coin-display';
        
        // Thêm icon và text
        coinDisplay.innerHTML = `
            <span class="coin-icon">💰</span>
            <span class="coin-value" id="topCoins">0</span>
        `;
        
        // Thêm vào sau các nút
        document.getElementById('gameContainer').appendChild(coinDisplay);
    }

    // Create or ensure all necessary UI elements exist
    function createUIElements() {
        // Check if any elements are missing and create them
        const elements = [
            'health', 'maxHealth', 'armor', 'maxArmor',
            'xp', 'xpNext', 'ammo', 'maxAmmo',
            'level', 'coins', 'kills', 'explored',
            'baseDamage', 'critChance', 'moveSpeed', 'fireRate',
            'distance', 'healthBar', 'armorBar', 'xpBar', 'ammoBar',
            'shopCoins', 'upgradeCoins',
            'finalKills', 'finalLevel', 'survivalTime'
        ];
        
        elements.forEach(id => {
            if (!document.getElementById(id)) {
                console.log(`Creating missing UI element: ${id}`);
                const element = document.createElement('span');
                element.id = id;
                
                // Find an appropriate container based on id
                let container;
                if (id.includes('Bar')) {
                    container = document.querySelector('.stat-bar');
                } else if (id.includes('max') || id.includes('health') || id.includes('armor') || id.includes('xp') || id.includes('ammo')) {
                    container = document.querySelector('.ui-section');
                } else {
                    container = document.querySelector('.stats-section');
                }
                
                if (container) {
                    container.appendChild(element);
                } else {
                    // If no appropriate container found, create a hidden element in the body
                    element.style.display = 'none';
                    document.body.appendChild(element);
                }
            }
        });
        
        // Create stats panel close button if it doesn't exist
        if (document.getElementById('statsPanel') && !document.querySelector('.stats-panel-close')) {
            const closeButton = document.createElement('div');
            closeButton.className = 'stats-panel-close';
            closeButton.textContent = '×';
            closeButton.addEventListener('click', toggleStatsPanel);
            document.querySelector('.stats-panel-content').appendChild(closeButton);
        }
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

    // Bổ sung vào file ui.js

    // Vẽ chỉ báo lãnh thổ khi người chơi đang trong lãnh thổ
    function drawTerritoryIndicator() {
        // Nếu không có canvas hoặc người chơi không trong lãnh thổ, không cần vẽ
        if (!canvas || (!player.inTerritory && !player.inHomeRadius)) return;
        
        // Vị trí hiển thị chỉ báo
        const padding = 20;
        const iconSize = 30;
        
        // Đặt ở bên dưới chỉ báo đuốc trong góc trên bên phải
        const x = canvas.width - padding - iconSize;
        const y = padding + iconSize * 3;
        
        // Hiệu ứng nhấp nháy theo thời gian
        const pulseIntensity = Math.sin(performance.now() / 500) * 0.2 + 0.8;
        
        // Màu dựa vào loại lãnh thổ (home zone hoặc claimed territory)
        let color;
        let label;
        let effectText;
        let effectStrength;
        
        if (player.inHomeRadius) {
            color = `rgba(255, 215, 0, ${pulseIntensity})`; // Màu vàng gold cho home
            label = 'HOME ZONE';
            effectStrength = CONFIG.TERRITORY.HOME_BONUS_MULTIPLIER;
        } else {
            color = `rgba(0, 255, 100, ${pulseIntensity})`; // Màu xanh lá cho territory
            label = 'TERRITORY';
            effectStrength = 1;
        }
        
        // Vẽ biểu tượng khiên
        ctx.beginPath();
        ctx.moveTo(x, y - iconSize/2);
        ctx.lineTo(x - iconSize/2, y - iconSize/4);
        ctx.lineTo(x - iconSize/2, y + iconSize/4);
        ctx.lineTo(x, y + iconSize/2 + 5);
        ctx.lineTo(x + iconSize/2, y + iconSize/4);
        ctx.lineTo(x + iconSize/2, y - iconSize/4);
        ctx.closePath();
        
        // Tô màu biểu tượng
        ctx.fillStyle = color;
        ctx.fill();
        
        // Viền biểu tượng
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Vẽ văn bản
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'right';
        ctx.fillText(label, x - iconSize/2 - 5, y);
        
        // Vẽ hiệu ứng
        ctx.font = '10px Orbitron';
        ctx.fillText(`+${Math.round(CONFIG.TERRITORY.HEALTH_REGEN * effectStrength)}/s HEALTH`, x - iconSize/2 - 5, y + 15);
        ctx.fillText(`+${Math.round((CONFIG.TERRITORY.DAMAGE_BOOST - 1) * 100 * effectStrength)}% DMG`, x - iconSize/2 - 5, y + 30);
        ctx.fillText(`+${Math.round((CONFIG.TERRITORY.SPEED_BOOST - 1) * 100 * effectStrength)}% SPEED`, x - iconSize/2 - 5, y + 45);
    }

    // Hiển thị và xử lý menu cài đặt
    function showSettingsMenu() {
        // Kiểm tra nếu menu cài đặt đã tồn tại
        let settingsMenu = document.getElementById('settingsMenu');
        
        // Nếu chưa có, tạo mới
        if (!settingsMenu) {
            settingsMenu = document.createElement('div');
            settingsMenu.id = 'settingsMenu';
            settingsMenu.className = 'modal';
            
            // Tạo nội dung menu
            settingsMenu.innerHTML = `
                <div class="modal-content">
                    <h2>Game Settings</h2>
                    
                    <div class="settings-section">
                        <h3>Sound Settings</h3>
                        <div class="setting-row">
                            <label for="soundToggle">Sound Effects:</label>
                            <label class="switch">
                                <input type="checkbox" id="soundToggle" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        
                        <div class="setting-row">
                            <label for="soundVolume">Sound Volume:</label>
                            <input type="range" id="soundVolume" min="0" max="100" value="70">
                        </div>
                        
                        <div class="setting-row">
                            <label for="musicToggle">Music:</label>
                            <label class="switch">
                                <input type="checkbox" id="musicToggle" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        
                        <div class="setting-row">
                            <label for="musicVolume">Music Volume:</label>
                            <input type="range" id="musicVolume" min="0" max="100" value="50">
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Display Settings</h3>
                        <div class="setting-row">
                            <label for="showFPS">Show FPS:</label>
                            <label class="switch">
                                <input type="checkbox" id="showFPS">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Controls</h3>
                        <p>Movement: WASD</p>
                        <p>Shoot: Left Mouse</p>
                        <p>Reload: R</p>
                        <p>Place Torch: F</p>
                        <p>Shop: E</p>
                        <p>Weapon Upgrade: TAB</p>
                        <p>Switch Weapons: Q, Mouse Wheel, or 1-3</p>
                    </div>
                    
                    <div class="button-group">
                        <button id="closeSettingsButton">Back to Game</button>
                    </div>
                </div>
            `;
            
            // Thêm vào DOM
            document.getElementById('gameContainer').appendChild(settingsMenu);
            
            // Thêm event listeners
            document.getElementById('closeSettingsButton').addEventListener('click', closeSettingsMenu);
            document.getElementById('soundToggle').addEventListener('change', function() {
                toggleSound();
            });
            document.getElementById('musicToggle').addEventListener('change', function() {
                toggleMusic();
            });
            document.getElementById('soundVolume').addEventListener('input', function() {
                setSoundVolume(this.value / 100);
            });
            document.getElementById('musicVolume').addEventListener('input', function() {
                setMusicVolume(this.value / 100);
            });
            document.getElementById('showFPS').addEventListener('change', function() {
                // Hàm chuyển đổi hiển thị FPS, có thể triển khai sau
            });
        }
        
        // Hiển thị menu
        settingsMenu.style.display = 'flex';
        
        // Tạm dừng game
        gameRunning = false;
    }

    // Đóng menu cài đặt
    function closeSettingsMenu() {
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu) {
            settingsMenu.style.display = 'none';
        }
        
        // Tiếp tục game
        gameRunning = true;
    }

    // Tạo thanh vũ khí mới + hiển thị đuốc
    function createBottomBar() {
        // Xóa thanh vũ khí cũ nếu có (sử dụng selector cụ thể hơn để không xóa trong menu upgrade)
        const oldBottomBar = document.getElementById('bottomBar');
        if (oldBottomBar) oldBottomBar.remove();
        
        // Tạo container chính
        const bottomBar = document.createElement('div');
        bottomBar.id = 'bottomBar';
        bottomBar.className = 'bottom-bar';
        
        // Tạo thanh vũ khí
        const weaponBar = document.createElement('div');
        weaponBar.id = 'weaponBar';
        weaponBar.className = 'weapon-bar';
        
        // Tạo 5 ô vũ khí cố định (từ 1-5)
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = 'weapon-slot empty';
            slot.dataset.index = i;
            
            // Thêm số ô (1-5 thay vì 6-10)
            const slotNumber = document.createElement('div');
            slotNumber.className = 'slot-number';
            slotNumber.textContent = (i + 1); // Số từ 1-5
            slot.appendChild(slotNumber);
            
            // Thêm sự kiện click
            slot.addEventListener('click', () => {
                if (player.equippedWeapons[i]) {
                    switchWeapon(player.equippedWeapons[i]);
                }
            });
            
            weaponBar.appendChild(slot);
        }
        
        // Tạo ô hiển thị đuốc
        const torchDisplay = document.createElement('div');
        torchDisplay.id = 'torchDisplay';
        torchDisplay.className = 'torch-display';
        
        // Icon đuốc
        const torchIcon = document.createElement('div');
        torchIcon.className = 'torch-icon';
        torchIcon.innerHTML = '🔥';
        torchDisplay.appendChild(torchIcon);
        
        // Số lượng đuốc
        const torchCount = document.createElement('div');
        torchCount.id = 'bottomTorchCount';
        torchCount.className = 'torch-count';
        torchCount.textContent = player.torchCount;
        torchDisplay.appendChild(torchCount);
        
        // Gợi ý phím F
        const keyHint = document.createElement('div');
        keyHint.className = 'key-hint';
        keyHint.textContent = '[F]';
        torchDisplay.appendChild(keyHint);
        
        // Thêm sự kiện click
        torchDisplay.addEventListener('click', () => {
            placeTorch();
        });
        
        // Thêm các phần tử vào DOM
        bottomBar.appendChild(weaponBar);
        bottomBar.appendChild(torchDisplay);
        document.getElementById('gameContainer').appendChild(bottomBar);
        
        // Cập nhật lần đầu
        updateBottomBar();
    }

    // Cập nhật trạng thái thanh vũ khí
    function updateBottomBar() {
        if (!document.getElementById('bottomBar')) return;
        
        // Cập nhật số đuốc
        const torchCount = document.getElementById('bottomTorchCount');
        if (torchCount) {
            torchCount.textContent = player.torchCount;
        }
        
        // Cập nhật các ô vũ khí
        const slots = document.querySelectorAll('#weaponBar .weapon-slot');
        
        slots.forEach((slot, index) => {
            // Reset trạng thái
            slot.className = 'weapon-slot empty';
            
            // Xóa tất cả các phần tử con trừ số ô
            const slotNumber = slot.querySelector('.slot-number');
            slot.innerHTML = '';
            
            // Thêm lại số ô (đảm bảo số từ 1-5)
            if (slotNumber) {
                const newSlotNumber = document.createElement('div');
                newSlotNumber.className = 'slot-number';
                newSlotNumber.textContent = (index + 1); // Số từ 1-5
                slot.appendChild(newSlotNumber);
            }
            
            const weaponId = player.equippedWeapons[index];
            
            if (weaponId) {
                // Có vũ khí
                const weapon = getWeaponById(weaponId);
                
                // Kiểm tra vũ khí đang active
                if (index === player.activeWeaponIndex) {
                    slot.classList.add('active');
                } else {
                    slot.classList.remove('empty');
                }
                
                // Thêm icon vũ khí (dùng ký tự thay thế)
                const weaponIcon = document.createElement('div');
                weaponIcon.className = 'weapon-icon';
                
                // Dùng ký tự emoji tạm thời
                if (weaponId === 'pistol') {
                    weaponIcon.style.backgroundColor = '#FFD700';  // Gold
                    weaponIcon.style.width = '20px';
                    weaponIcon.style.height = '14px';
                    weaponIcon.style.margin = '0 auto 5px';
                    weaponIcon.style.borderRadius = '2px';
                    // Thêm phần nòng súng
                    const barrel = document.createElement('div');
                    barrel.style.width = '10px';
                    barrel.style.height = '4px';
                    barrel.style.backgroundColor = '#444';
                    barrel.style.margin = '-4px auto 5px';
                    barrel.style.borderRadius = '1px';
                    weaponIcon.appendChild(barrel);
                } else if (weaponId === 'shotgun') {
                    weaponIcon.style.backgroundColor = '#FF4500';  // OrangeRed
                    weaponIcon.style.width = '25px';
                    weaponIcon.style.height = '10px';
                    weaponIcon.style.margin = '0 auto 5px';
                    weaponIcon.style.borderRadius = '2px';
                    // Thêm phần nòng súng
                    const barrel = document.createElement('div');
                    barrel.style.width = '15px';
                    barrel.style.height = '6px';
                    barrel.style.backgroundColor = '#444';
                    barrel.style.margin = '-3px auto 5px'; 
                    barrel.style.borderRadius = '1px';
                    weaponIcon.appendChild(barrel);
                } else if (weaponId === 'assaultRifle') {
                    weaponIcon.style.backgroundColor = '#32CD32';  // LimeGreen
                    weaponIcon.style.width = '28px';
                    weaponIcon.style.height = '8px';
                    weaponIcon.style.margin = '0 auto 5px';
                    weaponIcon.style.borderRadius = '2px';
                    // Thêm phần nòng súng
                    const barrel = document.createElement('div');
                    barrel.style.width = '12px';
                    barrel.style.height = '4px';
                    barrel.style.backgroundColor = '#444';
                    barrel.style.margin = '-2px auto 5px';
                    barrel.style.borderRadius = '1px';
                    weaponIcon.appendChild(barrel);
                } else if (weaponId === 'smg') {
                    weaponIcon.style.backgroundColor = '#1E90FF';  // DodgerBlue
                    weaponIcon.style.width = '22px';
                    weaponIcon.style.height = '12px';
                    weaponIcon.style.margin = '0 auto 5px';
                    weaponIcon.style.borderRadius = '2px';
                    // Thêm phần nòng súng
                    const barrel = document.createElement('div');
                    barrel.style.width = '8px';
                    barrel.style.height = '4px';
                    barrel.style.backgroundColor = '#444';
                    barrel.style.margin = '-3px auto 5px';
                    barrel.style.borderRadius = '1px';
                    weaponIcon.appendChild(barrel);
                } else if (weaponId === 'sniperRifle') {
                    weaponIcon.style.backgroundColor = '#8A2BE2';  // BlueViolet
                    weaponIcon.style.width = '30px';
                    weaponIcon.style.height = '7px';
                    weaponIcon.style.margin = '0 auto 5px';
                    weaponIcon.style.borderRadius = '2px';
                    // Thêm phần nòng súng
                    const barrel = document.createElement('div');
                    barrel.style.width = '18px';
                    barrel.style.height = '3px';
                    barrel.style.backgroundColor = '#444';
                    barrel.style.margin = '-2px auto 5px';
                    barrel.style.borderRadius = '1px';
                    weaponIcon.appendChild(barrel);
                }
                
                slot.appendChild(weaponIcon);
                
                // Thêm tên vũ khí
                const weaponName = document.createElement('div');
                weaponName.className = 'weapon-name';
                weaponName.textContent = weapon.name;
                slot.appendChild(weaponName);
                
                // Thêm thông tin đạn
                const weaponAmmo = document.createElement('div');
                weaponAmmo.className = 'weapon-ammo';
                weaponAmmo.textContent = `${player.ammunition[weapon.ammoType].current}/${player.ammunition[weapon.ammoType].reserve}`;
                slot.appendChild(weaponAmmo);
            } else {
                // Trống hoặc chưa mở khóa
                if (index < WEAPONS.length) {
                    const weapon = WEAPONS[index];
                    
                    if (!weapon.unlocked) {
                        slot.classList.add('locked');
                        
                        // Thêm icon khóa
                        const lockIcon = document.createElement('div');
                        lockIcon.className = 'weapon-icon';
                        lockIcon.textContent = '🔒';
                        slot.appendChild(lockIcon);
                        
                        // Thêm tên vũ khí
                        const weaponName = document.createElement('div');
                        weaponName.className = 'weapon-name';
                        weaponName.textContent = weapon.name;
                        slot.appendChild(weaponName);
                        
                        // Thêm giá tiền
                        const weaponCost = document.createElement('div');
                        weaponCost.className = 'weapon-ammo';
                        weaponCost.textContent = `${weapon.cost} coins`;
                        slot.appendChild(weaponCost);
                    }
                }
            }
        });
    }

    // Tạo container thông báo nhận vật phẩm
    function createLootNotificationContainer() {
        if (!document.getElementById('loot-notifications')) {
            const container = document.createElement('div');
            container.id = 'loot-notifications';
            document.getElementById('gameContainer').appendChild(container);
        }
    }

    // Hiển thị thông báo nhận vật phẩm cải tiến
    function showLootNotification(type, text) {
        createLootNotificationContainer();
        
        const container = document.getElementById('loot-notifications');
        const notification = document.createElement('div');
        notification.className = `loot-notification ${type}`;
        
        // Icon container
        const icon = document.createElement('div');
        icon.className = 'loot-icon';
        
        switch (type) {
            case 'coins':
                icon.innerHTML = '<i class="icon">💰</i>';
                icon.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
                break;
            case 'ammo':
                icon.innerHTML = '<i class="icon">🔄</i>';
                icon.style.backgroundColor = 'rgba(255, 69, 0, 0.3)';
                break;
            case 'health':
                icon.innerHTML = '<i class="icon">❤️</i>';
                icon.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                break;
            case 'torch':
                icon.innerHTML = '<i class="icon">🔥</i>';
                icon.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
                break;
            case 'attachment':
                icon.innerHTML = '<i class="icon">🔧</i>';
                icon.style.backgroundColor = 'rgba(65, 105, 225, 0.3)';
                break;
            case 'xp':
                icon.innerHTML = '<i class="icon">✨</i>';
                icon.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
                break;
            case 'progress':
                icon.innerHTML = '<i class="icon">📊</i>';
                icon.style.backgroundColor = 'rgba(100, 149, 237, 0.3)';
                break;
            default:
                icon.innerHTML = '<i class="icon">📦</i>';
                icon.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }
        
        // Text
        const textElement = document.createElement('div');
        textElement.className = 'loot-text';
        textElement.textContent = text;
        
        notification.appendChild(icon);
        notification.appendChild(textElement);
        container.appendChild(notification);
        
        // Xóa sau 5 giây
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Cập nhật hàm initUI() để thêm các UI mới
    function extendUI() {
        // Thêm CSS cho menu cài đặt nếu chưa có
        addSettingsStyles();
    
        // Add evolution UI
        extendUIWithEvolution();
    
        // Tạo thanh vũ khí mới + hiển thị đuốc
        createBottomBar();
        
        // Tạo container thông báo loot
        createLootNotificationContainer();
        
        // Xóa các phần tử cũ không cần thiết
        const deleteSelectors = [
            '.weapon-selector:not(.weapon-selector-upgrade)'
        ];
        
        deleteSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
        
        // Đảm bảo chỉ có một nhóm top-action-buttons
        const actionButtonGroups = document.querySelectorAll('.top-action-buttons');
        if (actionButtonGroups.length > 1) {
            for (let i = 1; i < actionButtonGroups.length; i++) {
                actionButtonGroups[i].remove();
            }
        }
    }

    function extendUIWithEvolution() {
        // Create evolution UI elements
        createEvolutionUI();
        
        // Add CSS for evolution
        addEvolutionStyles();
    }

    // Thêm CSS cho menu cài đặt
    function addSettingsStyles() {
        // Kiểm tra nếu style đã tồn tại
        if (document.getElementById('settingsStyles')) return;
        
        // Tạo style element
        const style = document.createElement('style');
        style.id = 'settingsStyles';
        
        style.textContent = `
            .settings-section {
                margin: 15px 0;
                padding: 10px;
                background-color: rgba(40, 40, 60, 0.6);
                border-radius: 5px;
            }
            
            .settings-section h3 {
                margin-top: 0;
                color: #7ac6ff;
                border-bottom: 1px solid #444;
                padding-bottom: 5px;
            }
            
            .setting-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0;
            }
            
            /* Switch styling */
            .switch {
                position: relative;
                display: inline-block;
                width: 60px;
                height: 30px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #4a5264;
                transition: .3s;
            }
            
            .slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .3s;
            }
            
            input:checked + .slider {
                background-color: #7ac6ff;
            }
            
            input:focus + .slider {
                box-shadow: 0 0 1px #7ac6ff;
            }
            
            input:checked + .slider:before {
                transform: translateX(30px);
            }
            
            .slider.round {
                border-radius: 30px;
            }
            
            .slider.round:before {
                border-radius: 50%;
            }
            
            /* Slider controls */
            input[type=range] {
                -webkit-appearance: none;
                width: 60%;
                height: 8px;
                background: #4a5264;
                border-radius: 5px;
                outline: none;
            }
            
            input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #7ac6ff;
                cursor: pointer;
            }
            
            input[type=range]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #7ac6ff;
                cursor: pointer;
            }
        `;
        
        // Thêm vào head
        document.head.appendChild(style);
    }

    // Toggle stats panel visibility
    function toggleStatsPanel() {
        const statsPanel = document.getElementById('statsPanel');
        const isVisible = statsPanel.style.display === 'block';
        
        if (isVisible) {
            statsPanel.style.display = 'none';
        } else {
            statsPanel.style.display = 'block';
            updateStatsPanel(); // Update the stats when showing panel
        }
    }

    // Update stats panel with current values
    function updateStatsPanel() {
        // Game stats
        document.getElementById('stats-level').textContent = player.level;
        document.getElementById('stats-coins').textContent = formatNumber(player.coins);
        document.getElementById('stats-kills').textContent = formatNumber(player.kills);
        document.getElementById('stats-explored').textContent = player.exploredSections.size;
        document.getElementById('stats-distance').textContent = Math.floor(distance(player.x, player.y, player.startX, player.startY));
        document.getElementById('stats-territories').textContent = player.territoriesClaimed;
        document.getElementById('stats-torches').textContent = player.torchCount;
        document.getElementById('stats-sectionsCleared').textContent = player.sectionCleared;
        
        // Character stats
        document.getElementById('stats-baseDamage').textContent = Math.round(player.baseDamage);
        document.getElementById('stats-critChance').textContent = Math.round(player.critChance);
        document.getElementById('stats-moveSpeed').textContent = player.speed.toFixed(1);
        document.getElementById('stats-fireRate').textContent = (1000 / player.weapon.fireRate).toFixed(1);
    }

    // Add evolution CSS
    function addEvolutionStyles() {
        // Only add if not already present
        if (!document.getElementById('evolutionStyles')) {
            const style = document.createElement('style');
            style.id = 'evolutionStyles';
            
            // Add CSS for evolution effects
            style.textContent = `
                .evolution-flash {
                    background-color: rgba(255, 50, 50, 0.2);
                    animation: evolution-flash-fade 1.5s ease-out;
                }
                
                @keyframes evolution-flash-fade {
                    0% { opacity: 0; }
                    20% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
                
                .evolution-timer {
                    position: absolute;
                    top: 20px; /* Changed from 80px to 20px */
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(10, 20, 35, 0.85);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 50, 50, 0.7);
                    border-radius: 10px;
                    padding: 10px 15px;
                    box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
                    width: 250px;
                    text-align: center;
                    z-index: 10;
                }
                
                /* Rest of the CSS remains the same */
                .evolution-timer-title {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 14px;
                    margin-bottom: 5px;
                    text-shadow: 0 0 8px rgba(255, 50, 50, 0.8);
                }
                
                .evolution-tier {
                    font-weight: bold;
                    font-size: 18px;
                    padding: 0 5px;
                    border-radius: 4px;
                    background-color: rgba(255, 50, 50, 0.2);
                }
                
                .evolution-timer-countdown {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 12px;
                    margin: 5px 0;
                }
                
                .evolution-timer-bar {
                    height: 8px;
                    background-color: rgba(50, 50, 60, 0.7);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 5px;
                    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
                }
                
                .evolution-timer-fill {
                    height: 100%;
                    width: 100%;
                    background: linear-gradient(90deg, rgba(255, 60, 60, 0.9), rgba(255, 150, 0, 0.9));
                    border-radius: 4px;
                    transition: width 1s linear;
                }
                
                .evolution-announcement {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 36px;
                    color: #FF3333;
                    text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
                    z-index: 100;
                    pointer-events: none;
                    opacity: 0;
                    animation: evolution-announce 3s ease-in-out;
                }
                
                @keyframes evolution-announce {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    25% { transform: translate(-50%, -50%) scale(1); }
                    75% { opacity: 1; }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
                }
                
                @keyframes pulse-warning {
                    0% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 0.6; transform: scale(1); }
                }
                
                .evolution-warning {
                    animation: pulse-warning 0.8s infinite;
                    color: #ff3838;
                }
            `;
            
            // Add to head
            document.head.appendChild(style);
        }
    }

    // Create evolution UI elements
    function createEvolutionUI() {
        // Create HTML element for evolution timer if it doesn't exist
        if (!document.getElementById('evolutionTimer')) {
            const evolutionTimer = document.createElement('div');
            evolutionTimer.id = 'evolutionTimer';
            evolutionTimer.className = 'evolution-timer';
            
            // Create inner structure
            evolutionTimer.innerHTML = `
                <div class="evolution-timer-title">ZOMBIE EVOLUTION: <span id="evolutionTier" class="evolution-tier">TIER 0</span></div>
                <div id="evolutionCountdown" class="evolution-timer-countdown">Next evolution in: 45s</div>
                <div class="evolution-timer-bar">
                    <div id="evolutionProgress" class="evolution-timer-fill" style="width: 100%;"></div>
                </div>
            `;
            
            // Add to game container
            document.getElementById('gameContainer').appendChild(evolutionTimer);
        }
    }

    // Thêm hàm mới vào ui.js
    function openUpgradeMenu() {
        const upgradeMenu = document.getElementById('upgradeMenu');
        
        // Update coins display
        document.getElementById('upgradeCoins').textContent = formatNumber(player.coins);
        
        // Populate upgrade options for character by default
        populateCharacterStats();
        populateCharacterUpgradeOptions();
        
        // Populate weapon selector
        populateWeaponSelectorForUpgrade();
        
        // Populate equipment options
        populateEquipmentOptions();
        
        // Show the upgrade menu
        upgradeMenu.style.display = 'flex';
        
        // Pause the game
        gameRunning = false;
    }

    function closeUpgradeMenu() {
        document.getElementById('upgradeMenu').style.display = 'none';
        gameRunning = true;
    }

    // Hàm để thiết lập chuyển đổi tab
    function setupTabSwitching() {
        // Lấy tất cả nút tab trong tất cả các menu
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Xác định menu cha
                const parentMenu = button.closest('.modal');
                
                // Xóa class active từ tất cả các tab và nội dung tab trong menu hiện tại
                parentMenu.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                parentMenu.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));
                
                // Thêm class active cho tab được nhấp
                button.classList.add('active');
                
                // Hiển thị nội dung tương ứng
                const tabName = button.getAttribute('data-tab');
                const tabContent = parentMenu.querySelector(`#${tabName}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
                
                // Cập nhật nội dung dựa trên tab được chọn
                if (parentMenu.id === 'upgradeMenu') {
                    if (tabName === 'character') {
                        populateCharacterStats();
                        populateCharacterUpgradeOptions();
                    } else if (tabName === 'weapons') {
                        populateWeaponSelectorForUpgrade();
                        // Mặc định nút đầu tiên được chọn
                        const firstWeapon = document.querySelector('.weapon-select-item:not(.locked)');
                        if (firstWeapon) {
                            firstWeapon.click();
                        }
                    } else if (tabName === 'equipment') {
                        populateEquipmentOptions();
                    }
                } else if (parentMenu.id === 'shopMenu') {
                    if (tabName === 'weapons') {
                        populateWeaponOptions();
                    } else if (tabName === 'ammo') {
                        populateAmmoOptions();
                    } else if (tabName === 'others') {
                        populateOthersOptions();
                    }
                }
            });
        });
    }

    // Thêm các hàm mới vào ui.js
    function populateCharacterStats() {
        const statsContainer = document.getElementById('characterStats');
        
        // Clear previous content
        statsContainer.innerHTML = '';
        
        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Character Stats';
        title.className = 'stats-section-title';
        
        // Create stats container
        const statsPanel = document.createElement('div');
        statsPanel.className = 'character-stats-panel';
        
        // Add stats
        const stats = [
            { label: 'Level', value: player.level },
            { label: 'Base Damage', value: Math.round(player.baseDamage) },
            { label: 'Crit Chance', value: `${Math.round(player.critChance)}%` },
            { label: 'Move Speed', value: player.speed.toFixed(1) },
            { label: 'Kills', value: formatNumber(player.kills) },
            { label: 'Territories', value: player.territoriesClaimed },
            { label: 'Sections Cleared', value: player.sectionCleared },
            { label: 'Distance', value: `${Math.floor(distance(player.x, player.y, player.startX, player.startY))}m` }
        ];
        
        stats.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const statLabel = document.createElement('span');
            statLabel.className = 'stat-label';
            statLabel.textContent = stat.label + ':';
            
            const statValue = document.createElement('span');
            statValue.className = 'stat-value';
            statValue.textContent = stat.value;
            
            statItem.appendChild(statLabel);
            statItem.appendChild(statValue);
            statsPanel.appendChild(statItem);
        });
        
        // Add title and stats panel to container
        statsContainer.appendChild(title);
        statsContainer.appendChild(statsPanel);
    }

    function populateCharacterUpgradeOptions() {
        const upgradeOptions = document.getElementById('characterUpgradeOptions');
        upgradeOptions.innerHTML = '';
        
        // Add upgrades to shop
        CONFIG.STAT_UPGRADE_TYPES.forEach(upgrade => {
            // Create upgrade element
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade-item';
            
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
                    
                    // Refresh options
                    populateCharacterStats();
                    populateCharacterUpgradeOptions();
                }
            });
            
            upgradeOptions.appendChild(upgradeElement);
        });
    }

    // Thêm vào ui.js
    function populateWeaponSelectorForUpgrade() {
        const weaponSelector = document.querySelector('#weapons-tab #weaponSelector');
        weaponSelector.innerHTML = '';
        
        // Add each weapon to the selector
        WEAPONS.forEach(weaponData => {
            const weaponElement = document.createElement('div');
            weaponElement.className = `weapon-select-item ${weaponData.unlocked ? '' : 'locked'}`;
            if (weaponData.id === player.activeWeaponId) {
                weaponElement.classList.add('active');
            }
            
            // Create icon element
            const iconElement = document.createElement('div');
            iconElement.className = 'weapon-select-icon';
            
            // Different color for each weapon type
            let iconColor;
            switch (weaponData.id) {
                case 'pistol': iconColor = '#FFD700'; break; // Gold
                case 'shotgun': iconColor = '#FF4500'; break; // OrangeRed
                case 'assaultRifle': iconColor = '#32CD32'; break; // LimeGreen
                case 'smg': iconColor = '#1E90FF'; break; // DodgerBlue
                case 'sniperRifle': iconColor = '#8A2BE2'; break; // BlueViolet
                default: iconColor = '#FFFFFF';
            }
            
            // Create a simple weapon icon
            const icon = document.createElement('div');
            icon.style.backgroundColor = iconColor;
            icon.style.width = '20px';
            icon.style.height = '8px';
            icon.style.borderRadius = '2px';
            
            // Add a barrel
            const barrel = document.createElement('div');
            barrel.style.width = '10px';
            barrel.style.height = '4px';
            barrel.style.backgroundColor = '#333';
            barrel.style.position = 'absolute';
            barrel.style.top = '50%';
            barrel.style.left = '60%';
            barrel.style.transform = 'translateY(-50%)';
            barrel.style.borderRadius = '1px';
            
            iconElement.appendChild(icon);
            iconElement.appendChild(barrel);
            
            // Create name element
            const nameElement = document.createElement('div');
            nameElement.className = 'weapon-select-name';
            nameElement.textContent = weaponData.name;
            
            weaponElement.appendChild(iconElement);
            weaponElement.appendChild(nameElement);
            
            // Add event listener if weapon is unlocked
            if (weaponData.unlocked) {
                weaponElement.addEventListener('click', () => {
                    // Remove active class from all weapons
                    document.querySelectorAll('.weapon-select-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Add active class to this weapon
                    weaponElement.classList.add('active');
                    
                    // Show upgrade options for this weapon
                    populateWeaponUpgradeOptions(weaponData.id);
                });
            }
            
            weaponSelector.appendChild(weaponElement);
        });
        
        // Initially populate upgrade options for the active weapon
        populateWeaponUpgradeOptions(player.activeWeaponId);
    }

    // Chỉnh sửa hàm populateWeaponUpgradeOptions để nó nhận ID vũ khí
    function populateWeaponUpgradeOptions(weaponId) {
        const weaponUpgradeOptions = document.getElementById('weaponUpgradeOptions');
        weaponUpgradeOptions.innerHTML = '';
        
        // Get current weapon
        const currentWeapon = WEAPONS.find(w => w.id === weaponId);
        
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
                    if (currentWeapon.id === player.activeWeaponId) {
                        player.weapon = createWeapon(currentWeapon.id);
                    }
                    
                    // Update UI
                    updateUI();
                    
                    // Refresh options
                    populateWeaponUpgradeOptions(currentWeapon.id);
                    
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

    // Thêm hàm populateAmmoOptions
    function populateAmmoOptions() {
        const ammoOptions = document.getElementById('ammoOptions');
        ammoOptions.innerHTML = '';
        
        // Add each ammo type
        for (const ammoType in CONFIG.AMMO_TYPES) {
            const ammoConfig = CONFIG.AMMO_TYPES[ammoType];
            
            // Check if player has a weapon that uses this ammo
            const weaponUsingThisAmmo = WEAPONS.find(w => w.ammoType === ammoType);
            const isUnlocked = weaponUsingThisAmmo && weaponUsingThisAmmo.unlocked;
            
            const ammoElement = document.createElement('div');
            ammoElement.className = `ammo-item ${!isUnlocked ? 'locked' : ''}`;
            
            // Calculate how many packs to reach max
            const currentReserve = player.ammunition[ammoType]?.reserve || 0;
            
            // Apply multiplier to max reserve
            const adjustedMaxReserve = Math.floor(ammoConfig.maxReserve * player.ammoReserveMultiplier);
            
            const packSize = ammoConfig.packSize;
            
            // Calculate percentage of current ammo
            const percentage = Math.min(100, (currentReserve / adjustedMaxReserve * 100));
            
            // Create ammo item
            ammoElement.innerHTML = `
                <div class="ammo-icon" style="color: ${ammoConfig.color};"></div>
                <div class="ammo-name">${ammoConfig.name}</div>
                <div class="ammo-count">${currentReserve}/${adjustedMaxReserve}</div>
                <div class="ammo-progress">
                    <div class="ammo-progress-fill" style="width: ${percentage}%;"></div>
                </div>
                <div class="item-cost">
                    <span class="cost-value">${formatNumber(ammoConfig.cost)} coins</span>
                    <button class="buy-ammo" data-type="${ammoType}" ${
                        (!isUnlocked || currentReserve >= adjustedMaxReserve || player.coins < ammoConfig.cost) ? 'disabled' : ''
                    }>
                        ${!isUnlocked ? 'Locked' : (currentReserve >= adjustedMaxReserve ? 'Max' : 'Buy')}
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
                        populateAmmoOptions();
                        
                        showGameMessage(`Purchased ${packSize} ${ammoConfig.name}!`);
                    }
                });
            }
            
            ammoOptions.appendChild(ammoElement);
        }
    }

    // Thêm hàm populateOthersOptions
    function populateOthersOptions() {
        const othersOptions = document.getElementById('othersOptions');
        othersOptions.innerHTML = '';
        
        // Add torch purchase option
        const torchElement = document.createElement('div');
        torchElement.className = 'torch-shop-item';
        
        const torchCost = CONFIG.TERRITORY.TORCH_COST;
        
        torchElement.innerHTML = `
            <div class="torch-shop-icon"></div>
            <div class="torch-count-display">Torches: ${player.torchCount}</div>
            <div class="torch-description">Used to claim territory after clearing zombies from a section. Place 4 torches in each corner of a section to claim it.</div>
            <div class="item-cost">
                <span class="cost-value">${formatNumber(torchCost)} coins</span>
                <button class="buy-torch" ${player.coins < torchCost ? 'disabled' : ''}>
                    Buy Torch
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
                    populateOthersOptions();
                    
                    showGameMessage(`Purchased 1 Territory Torch!`);
                }
            });
        }
        
        othersOptions.appendChild(torchElement);
    }