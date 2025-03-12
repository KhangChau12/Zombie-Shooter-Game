// Hiển thị màn hình home hoặc các màn hình đăng nhập/đăng ký
let homeScreenActive = true;
let isGameStarted = false;

// Tạo và hiển thị màn hình Home chính
function createHomeScreen() {
  // Xóa màn hình Home cũ nếu đã tồn tại
  const existingHomeScreen = document.getElementById('homeScreen');
  if (existingHomeScreen) {
    existingHomeScreen.remove();
  }

  // Kiểm tra xem người dùng đã đăng nhập chưa
  const currentUser = window.gameAuth.getCurrentUser();
  
  // Tạo container cho màn hình Home
  const homeScreen = document.createElement('div');
  homeScreen.id = 'homeScreen';
  homeScreen.className = 'home-screen';
  
  // Tạo nội dung HTML cho màn hình
  if (currentUser) {
    // Người dùng đã đăng nhập, hiển thị màn hình chính
    homeScreen.innerHTML = `
      <div class="home-content">
        <div class="game-logo">
          <h1>ZOMBIE APOCALYPSE</h1>
          <h2>SHOOTER</h2>
        </div>
        
        <div class="user-welcome">
          <p>Welcome back, <span class="username">${currentUser.username}</span>!</p>
        </div>
        
        <div class="main-buttons">
          <button id="newGameBtn" class="home-button">NEW GAME</button>
          <button id="loadGameBtn" class="home-button">LOAD GAME</button>
          <button id="settingsBtn" class="home-button">SETTINGS</button>
          <button id="logoutBtn" class="home-button">LOGOUT</button>
        </div>
        
        <div class="game-version">
          <p>Version 1.0</p>
        </div>
      </div>
      <div class="zombies-background"></div>
    `;
  } else {
    // Người dùng chưa đăng nhập, hiển thị màn hình đăng nhập/đăng ký
    homeScreen.innerHTML = `
      <div class="home-content">
        <div class="game-logo">
          <h1>ZOMBIE APOCALYPSE</h1>
          <h2>SHOOTER</h2>
        </div>
        
        <div class="auth-container">
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login">LOGIN</button>
            <button class="auth-tab" data-tab="register">REGISTER</button>
          </div>
          
          <div class="auth-content active" id="login-content">
            <form id="loginForm">
              <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" required>
              </div>
              <div class="form-group">
                <label for="loginPassword">Password</label>
                <input type="password" id="loginPassword" required>
              </div>
              <button type="submit" class="auth-button">LOGIN</button>
              <p class="auth-message" id="loginMessage"></p>
            </form>
          </div>
          
          <div class="auth-content" id="register-content">
            <form id="registerForm">
              <div class="form-group">
                <label for="registerUsername">Username</label>
                <input type="text" id="registerUsername" required>
              </div>
              <div class="form-group">
                <label for="registerEmail">Email</label>
                <input type="email" id="registerEmail" required>
              </div>
              <div class="form-group">
                <label for="registerPassword">Password</label>
                <input type="password" id="registerPassword" required minlength="6">
              </div>
              <button type="submit" class="auth-button">REGISTER</button>
              <p class="auth-message" id="registerMessage"></p>
            </form>
          </div>
        </div>
        
        <div class="game-version">
          <p>Version 1.0</p>
        </div>
      </div>
      <div class="zombies-background"></div>
    `;
  }
  
  // Thêm vào container game
  document.getElementById('gameContainer').appendChild(homeScreen);
  
  // Thêm sự kiện cho các phần tử
  addHomeScreenEventListeners();
  
  // Hiển thị màn hình Home
  homeScreen.style.display = 'flex';
  homeScreenActive = true;
}

// Thêm các sự kiện cho màn hình Home
function addHomeScreenEventListeners() {
  const currentUser = window.gameAuth.getCurrentUser();
  
  if (currentUser) {
    // Các sự kiện cho màn hình đã đăng nhập
    document.getElementById('newGameBtn').addEventListener('click', startNewGame);
    document.getElementById('loadGameBtn').addEventListener('click', showLoadGameScreen);
    document.getElementById('settingsBtn').addEventListener('click', showSettingsMenu);
    document.getElementById('logoutBtn').addEventListener('click', () => {
      window.gameAuth.logout();
      createHomeScreen();
    });
  } else {
    // Các sự kiện cho màn hình đăng nhập/đăng ký
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Hide all content
        document.querySelectorAll('.auth-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // Show selected content
        const tabName = tab.getAttribute('data-tab');
        document.getElementById(`${tabName}-content`).classList.add('active');
      });
    });
    
    // Form đăng nhập
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const messageEl = document.getElementById('loginMessage');
      
      try {
        messageEl.textContent = 'Logging in...';
        messageEl.classList.add('loading');
        
        await window.gameAuth.login(email, password);
        
        // Đăng nhập thành công, hiển thị lại màn hình home
        createHomeScreen();
      } catch (error) {
        messageEl.textContent = error.message || 'Login failed';
        messageEl.classList.remove('loading');
        messageEl.classList.add('error');
      }
    });
    
    // Form đăng ký
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('registerUsername').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const messageEl = document.getElementById('registerMessage');
      
      try {
        messageEl.textContent = 'Creating account...';
        messageEl.classList.add('loading');
        
        await window.gameAuth.register(username, email, password);
        
        // Đăng ký thành công, hiển thị lại màn hình home
        createHomeScreen();
      } catch (error) {
        messageEl.textContent = error.message || 'Registration failed';
        messageEl.classList.remove('loading');
        messageEl.classList.add('error');
      }
    });
  }
}

// Bắt đầu game mới
function startNewGame() {
  hideHomeScreen();
  isGameStarted = true;
  
  // Reset game state
  if (typeof restartGame === 'function') {
    restartGame();
  } else {
    // Fallback if restartGame doesn't exist
    location.reload();
  }
}

// Hiển thị màn hình load game
function showLoadGameScreen() {
  // Create load game screen
  const loadScreen = document.createElement('div');
  loadScreen.id = 'loadGameScreen';
  loadScreen.className = 'load-screen modal';
  
  // Set initial content
  loadScreen.innerHTML = `
    <div class="modal-content">
      <h2>Load Game</h2>
      <div id="saveSlotsContainer" class="save-slots-container">
        <div class="loading-saves">Loading saved games...</div>
      </div>
      <button id="backToHomeBtn" class="back-button">Back to Menu</button>
    </div>
  `;
  
  // Thêm vào container game
  document.getElementById('gameContainer').appendChild(loadScreen);
  
  // Hiển thị màn hình
  loadScreen.style.display = 'flex';
  
  // Thêm sự kiện nút Back
  document.getElementById('backToHomeBtn').addEventListener('click', () => {
    loadScreen.remove();
  });
  
  // Tải danh sách bản lưu
  loadSaveSlots();
}

// Tải danh sách các bản lưu
async function loadSaveSlots() {
  const container = document.getElementById('saveSlotsContainer');
  
  try {
    // Lấy danh sách bản lưu từ server
    const saves = await window.gameAuth.getSaves();
    
    // Clear loading message
    container.innerHTML = '';
    
    // Tạo slot cho mỗi vị trí từ 1-3, bất kể đã có dữ liệu hay chưa
    for (let slotNum = 1; slotNum <= 3; slotNum++) {
      // Tìm bản lưu cho slot này nếu có
      const save = saves.find(s => s.slot === slotNum);
      
      // Tạo phần tử slot
      const slotElement = document.createElement('div');
      slotElement.className = `save-slot ${save ? 'has-save' : 'empty-slot'}`;
      
      if (save) {
        // Format date
        const saveDate = new Date(save.updatedAt || save.createdAt);
        const dateStr = saveDate.toLocaleDateString() + ' ' + saveDate.toLocaleTimeString();
        
        // Tạo nội dung cho slot đã có dữ liệu
        slotElement.innerHTML = `
          <div class="save-preview">
            <img src="${save.screenshot || 'img/no-screenshot.jpg'}" alt="Save Preview">
          </div>
          <div class="save-info">
            <h3>${save.name || `Save Slot ${slotNum}`}</h3>
            <p class="save-date">Saved: ${dateStr}</p>
            <p class="save-stats">Level: ${save.stats?.level || 1} | Kills: ${save.stats?.kills || 0}</p>
            <p class="save-stats">Coins: ${save.stats?.coins || 0} | Territories: ${save.stats?.territories || 0}</p>
          </div>
          <div class="save-actions">
            <button class="load-save-btn" data-slot="${slotNum}">Load Game</button>
            <button class="delete-save-btn" data-slot="${slotNum}">Delete</button>
          </div>
        `;
      } else {
        // Tạo nội dung cho slot trống
        slotElement.innerHTML = `
          <div class="save-preview empty">
            <span class="empty-slot-text">Empty Slot</span>
          </div>
          <div class="save-info">
            <h3>Save Slot ${slotNum}</h3>
            <p class="empty-text">No saved game data</p>
          </div>
          <div class="save-actions">
            <button class="load-save-btn" disabled>Load Game</button>
            <button class="delete-save-btn" disabled>Delete</button>
          </div>
        `;
      }
      
      container.appendChild(slotElement);
    }
    
    // Thêm sự kiện cho các nút
    document.querySelectorAll('.load-save-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.getAttribute('data-slot');
        loadGameFromSlot(slot);
      });
    });
    
    document.querySelectorAll('.delete-save-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this save?')) {
          const slot = btn.getAttribute('data-slot');
          try {
            await window.gameAuth.deleteSave(slot);
            // Refresh save slots
            loadSaveSlots();
          } catch (error) {
            alert('Failed to delete save: ' + error.message);
          }
        }
      });
    });
    
  } catch (error) {
    container.innerHTML = `<div class="error-message">Error loading saves: ${error.message}</div>`;
  }
}

// Load game from a specific slot
async function loadGameFromSlot(slot) {
  try {
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-overlay';
    loadingMessage.innerHTML = '<div class="loading-spinner"></div><p>Loading game...</p>';
    document.getElementById('gameContainer').appendChild(loadingMessage);
    
    // Fetch the save data
    const saveData = await window.gameAuth.loadSave(slot);
    
    // Hide the load screen
    document.getElementById('loadGameScreen').remove();
    hideHomeScreen();
    
    // Apply save data to restore the game state
    restoreGameState(saveData.gameState);
    
    // Show success message
    showGameMessage('Game loaded successfully!');
    
    // Remove loading message
    loadingMessage.remove();
    
    isGameStarted = true;
  } catch (error) {
    alert('Error loading game: ' + error.message);
    document.querySelector('.loading-overlay')?.remove();
  }
}

// Restore the game state from save data
function restoreGameState(gameState) {
  // Restore player
  Object.assign(player, gameState.player);
  
  // Restore zombies
  zombies.length = 0;
  gameState.zombies.forEach(z => zombies.push(z));
  
  // Restore map sections
  mapSections.length = 0;
  gameState.mapSections.forEach(s => mapSections.push(s));
  
  // Restore pickups
  pickups.length = 0;
  gameState.pickups.forEach(p => pickups.push(p));
  
  // Restore bullets
  bullets.length = 0;
  gameState.bullets.forEach(b => bullets.push(b));
  
  // Restore effects
  effects.length = 0;
  gameState.effects.forEach(e => effects.push(e));
  
  // Restore evolution level
  zombieEvolutionLevel = gameState.evolutionLevel || 0;
  
  // Recreate weapon object from weapon id
  player.weapon = createWeapon(player.activeWeaponId);
  
  // Update camera position to center on player
  updateCamera();
  
  // Update UI
  updateUI();
}

// Ẩn màn hình Home
function hideHomeScreen() {
  const homeScreen = document.getElementById('homeScreen');
  if (homeScreen) {
    homeScreen.style.display = 'none';
  }
  homeScreenActive = false;
}

// Hiển thị màn hình Home
function showHomeScreen() {
  const homeScreen = document.getElementById('homeScreen');
  if (homeScreen) {
    homeScreen.style.display = 'flex';
  } else {
    createHomeScreen();
  }
  homeScreenActive = true;
}

// Thêm tính năng Save Game vào Settings Menu
function enhanceSettingsMenu() {
  // Kiểm tra user đã đăng nhập chưa
  const currentUser = window.gameAuth.getCurrentUser();
  if (!currentUser) return;

  // Chờ cho đến khi settings menu được tạo
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu && settingsMenu.style.display === 'flex') {
          addSaveGameSection();
          observer.disconnect();
        }
      }
    });
  });

  observer.observe(document.getElementById('gameContainer'), { childList: true, subtree: true });
}

// Thêm section Save Game vào menu Settings
function addSaveGameSection() {
  const settingsContent = document.querySelector('#settingsMenu .modal-content');
  if (!settingsContent || settingsContent.querySelector('.save-game-section')) return;

  // Tạo section Save Game
  const saveSection = document.createElement('div');
  saveSection.className = 'settings-section save-game-section';
  saveSection.innerHTML = `
    <h3>Save Game</h3>
    <p>Save your current game progress to continue later.</p>
    <div class="save-slots">
      <button class="save-slot-btn" data-slot="1">Save to Slot 1</button>
      <button class="save-slot-btn" data-slot="2">Save to Slot 2</button>
      <button class="save-slot-btn" data-slot="3">Save to Slot 3</button>
    </div>
    <div id="saveGameMessage"></div>
  `;

  // Thêm vào trước nút Back
  const backButton = settingsContent.querySelector('button#closeSettingsButton').parentNode;
  settingsContent.insertBefore(saveSection, backButton);

  // Thêm sự kiện cho các nút save
  document.querySelectorAll('.save-slot-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slot = btn.getAttribute('data-slot');
      const messageEl = document.getElementById('saveGameMessage');
      
      try {
        messageEl.textContent = 'Saving game...';
        messageEl.className = 'save-message loading';
        
        // Lưu game
        const result = await window.gameAuth.saveGame(slot, null);
        
        messageEl.textContent = 'Game saved successfully!';
        messageEl.className = 'save-message success';
        
        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          messageEl.textContent = '';
          messageEl.className = '';
        }, 3000);
      } catch (error) {
        messageEl.textContent = 'Failed to save game: ' + error.message;
        messageEl.className = 'save-message error';
      }
    });
  });
}

// Kiểm tra và hiển thị Home Screen khi tải trang
window.addEventListener('DOMContentLoaded', function() {
  // Đảm bảo homeScreen.css được tải
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = 'css/homeScreen.css';
  document.head.appendChild(link);
  
  // Tạo màn hình Home
  setTimeout(() => {
    createHomeScreen();
    
    // Override showSettingsMenu để thêm tính năng Save Game
    const originalShowSettingsMenu = window.showSettingsMenu;
    if (originalShowSettingsMenu) {
      window.showSettingsMenu = function() {
        originalShowSettingsMenu();
        enhanceSettingsMenu();
      };
    }
  }, 100);
});

// Override hàm gameOver để thêm nút quay về Home
const originalGameOver = window.gameOver;
if (originalGameOver) {
  window.gameOver = function() {
    originalGameOver();
    
    // Thêm nút Home nếu chưa có
    const gameOverModal = document.getElementById('gameOver');
    if (gameOverModal && !gameOverModal.querySelector('#homeButton')) {
      const restartButton = document.getElementById('restartButton');
      
      const homeButton = document.createElement('button');
      homeButton.id = 'homeButton';
      homeButton.textContent = 'Back to Home';
      homeButton.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        createHomeScreen();
      });
      
      restartButton.parentNode.appendChild(homeButton);
    }
  };
}

// Export các functions cần thiết
window.homeScreen = {
  show: showHomeScreen,
  hide: hideHomeScreen,
  isActive: () => homeScreenActive,
  isGameStarted: () => isGameStarted
};