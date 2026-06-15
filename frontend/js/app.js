// ============================================
// NEOBET FRONTEND APPLICATION
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Display alert message
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.insertBefore(alertDiv, document.body.firstChild);

    setTimeout(() => alertDiv.remove(), 3000);
}

/**
 * Get authorization token
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Get current user
 */
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Generic API request function
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

/**
 * Load dashboard data
 */
async function loadDashboard() {
    requireAuth();

    const user = getUser();
    if (!user) return;

    // Update user info
    document.getElementById('username').textContent = user.username;
    document.getElementById('userEmail').textContent = user.email;

    // Load balance
    try {
        const balanceData = await apiRequest('/user/balance');
        document.getElementById('balance').textContent = formatCurrency(balanceData.balance);
    } catch (error) {
        console.error('Failed to load balance:', error);
    }

    // Load statistics
    try {
        const statsData = await apiRequest('/user/stats');
        document.getElementById('totalBets').textContent = statsData.stats.totalBets;
        document.getElementById('wonBets').textContent = statsData.stats.wonBets;
        document.getElementById('lostBets').textContent = statsData.stats.lostBets;
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }

    // Load games
    await loadGames();

    // Load history
    await loadHistory();
}

/**
 * Load available games
 */
async function loadGames() {
    try {
        const gamesData = await apiRequest('/user/games');
        const gamesList = document.getElementById('gamesList');
        gamesList.innerHTML = '';

        gamesData.matches.forEach(match => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-header">
                    <h3>${match.title}</h3>
                    <small>${formatDate(match.matchDate)}</small>
                </div>
                <div class="game-content">
                    <div class="game-teams">
                        <span>${match.team1}</span>
                        <span>vs</span>
                        <span>${match.team2}</span>
                    </div>
                    <div class="game-odds">
                        <button class="odds-btn" onclick="placeBet('${match._id}', ${match.odds1}, 'team1')">${match.odds1}</button>
                        ${match.oddsDraw > 0 ? `<button class="odds-btn" onclick="placeBet('${match._id}', ${match.oddsDraw}, 'draw')">${match.oddsDraw}</button>` : ''}
                        <button class="odds-btn" onclick="placeBet('${match._id}', ${match.odds2}, 'team2')">${match.odds2}</button>
                    </div>
                </div>
            `;
            gamesList.appendChild(gameCard);
        });
    } catch (error) {
        console.error('Failed to load games:', error);
        showAlert('Failed to load games', 'error');
    }
}

/**
 * Load transaction history
 */
async function loadHistory() {
    try {
        const historyData = await apiRequest('/user/game-history');
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        if (historyData.games.length === 0) {
            historyList.innerHTML = '<p>No transaction history</p>';
            return;
        }

        historyData.games.forEach(game => {
            const historyCard = document.createElement('div');
            historyCard.className = 'card';
            historyCard.innerHTML = `
                <div class="history-item">
                    <div>
                        <strong>${game.matchId.title}</strong>
                        <p>${formatDate(game.placedAt)}</p>
                    </div>
                    <div>
                        <p>Bet: ${formatCurrency(game.betAmount)}</p>
                        <p>Status: <span class="status-${game.result}">${game.result.toUpperCase()}</span></p>
                    </div>
                </div>
            `;
            historyList.appendChild(historyCard);
        });
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

/**
 * Show/hide sections
 */
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }

    // Add active class to corresponding sidebar link
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
}

/**
 * Place bet
 */
async function placeBet(matchId, odds, team) {
    const betAmount = prompt('Enter bet amount:');
    if (!betAmount) return;

    try {
        const result = await apiRequest('/user/place-bet', 'POST', {
            matchId,
            betAmount: parseFloat(betAmount),
            selectedTeam: team
        });

        showAlert('Bet placed successfully!', 'success');
        loadDashboard();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

/**
 * Handle deposit form submission
 */
async function handleDeposit(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const description = document.getElementById('description').value;

    try {
        const result = await apiRequest('/deposits/request', 'POST', {
            amount,
            paymentMethod,
            description
        });

        showAlert('Deposit request submitted successfully!', 'success');
        document.getElementById('depositForm').reset();
        loadDashboard();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// ============================================
// HAMBURGER MENU
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu?.classList.toggle('active');
        });
    }

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu?.classList.remove('active');
        });
    });
});
