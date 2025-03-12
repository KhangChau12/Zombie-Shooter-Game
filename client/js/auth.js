// API URL - thay đổi khi deploy
const API_URL = 'https://zombie-apocalypse-backend.onrender.com/api';

// Lưu thông tin user vào localStorage
const saveUserToLocalStorage = (user) => {
  localStorage.setItem('gameUser', JSON.stringify(user));
};

// Lấy thông tin user từ localStorage
const getUserFromLocalStorage = () => {
  const userStr = localStorage.getItem('gameUser');
  return userStr ? JSON.parse(userStr) : null;
};

// Xóa thông tin user khỏi localStorage
const removeUserFromLocalStorage = () => {
  localStorage.removeItem('gameUser');
};

// Đăng ký user mới
const register = async (username, email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Đăng ký thất bại');
    }

    // Lưu user vào localStorage
    saveUserToLocalStorage(data);
    return data;
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    throw error;
  }
};

// Đăng nhập
const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    // Lưu user vào localStorage
    saveUserToLocalStorage(data);
    return data;
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    throw error;
  }
};

// Đăng xuất
const logout = () => {
  removeUserFromLocalStorage();
  // Chuyển về màn hình đăng nhập
  window.location.reload();
};

// Lấy thông tin user hiện tại
const getCurrentUser = () => {
  return getUserFromLocalStorage();
};

// Lưu game
const saveGame = async (slot, gameData) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Bạn cần đăng nhập để lưu game');
    }

    // Tạo ảnh chụp màn hình
    const canvas = document.getElementById('gameCanvas');
    const screenshot = canvas.toDataURL('image/jpeg', 0.3); // Chất lượng 30% để giảm kích thước

    // Chuẩn bị dữ liệu
    const saveData = {
      slot,
      name: `Game Save ${slot}`,
      screenshot,
      stats: {
        level: player.level,
        kills: player.kills,
        coins: player.coins,
        explored: player.exploredSections.size,
        territories: player.territoriesClaimed
      },
      gameState: {
        player: player,
        zombies: zombies,
        mapSections: mapSections,
        pickups: pickups,
        bullets: bullets,
        effects: effects,
        evolutionLevel: zombieEvolutionLevel
      }
    };

    const response = await fetch(`${API_URL}/saves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify(saveData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Lưu game thất bại');
    }

    return data;
  } catch (error) {
    console.error('Lỗi khi lưu game:', error);
    throw error;
  }
};

// Lấy danh sách bản lưu
const getSaves = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Bạn cần đăng nhập để xem bản lưu');
    }

    const response = await fetch(`${API_URL}/saves`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Không thể lấy danh sách bản lưu');
    }

    return data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bản lưu:', error);
    throw error;
  }
};

// Tải một bản lưu
const loadSave = async (slot) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Bạn cần đăng nhập để tải game');
    }

    const response = await fetch(`${API_URL}/saves/${slot}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Không thể tải bản lưu');
    }

    return data;
  } catch (error) {
    console.error('Lỗi khi tải bản lưu:', error);
    throw error;
  }
};

// Xóa một bản lưu
const deleteSave = async (slot) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Bạn cần đăng nhập để xóa bản lưu');
    }

    const response = await fetch(`${API_URL}/saves/${slot}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Không thể xóa bản lưu');
    }

    return data;
  } catch (error) {
    console.error('Lỗi khi xóa bản lưu:', error);
    throw error;
  }
};

// Export các function để sử dụng trong các file khác
window.gameAuth = {
  register,
  login,
  logout,
  getCurrentUser,
  saveGame,
  getSaves,
  loadSave,
  deleteSave
};