import "./style.css";

// API configuration for local development
const API_BASE = "http://localhost/BackPix/api";

// Mobile Menu Functionality
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
  const mobileMenuClose = document.getElementById("mobile-menu-close");
  const hamburgerLines = document.querySelectorAll(".hamburger-line");

  // Skip mobile menu setup if elements don't exist (like on callback page)
  if (
    !mobileMenuButton ||
    !mobileMenu ||
    !mobileMenuOverlay ||
    !mobileMenuClose
  ) {
    return;
  }

  // Function to open mobile menu
  function openMobileMenu() {
    mobileMenu.classList.remove("translate-x-full");
    mobileMenuOverlay.classList.remove("hidden");
    document.body.classList.add("menu-open");

    // Animate hamburger to X
    hamburgerLines[0].style.transform = "rotate(45deg) translate(5px, 5px)";
    hamburgerLines[1].style.opacity = "0";
    hamburgerLines[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
  }

  // Function to close mobile menu
  function closeMobileMenu() {
    mobileMenu.classList.add("translate-x-full");
    mobileMenuOverlay.classList.add("hidden");
    document.body.classList.remove("menu-open");

    // Reset hamburger animation
    hamburgerLines[0].style.transform = "none";
    hamburgerLines[1].style.opacity = "1";
    hamburgerLines[2].style.transform = "none";
  }

  // Event listeners
  mobileMenuButton.addEventListener("click", openMobileMenu);
  mobileMenuClose.addEventListener("click", closeMobileMenu);
  mobileMenuOverlay.addEventListener("click", closeMobileMenu);

  // Close menu when clicking on menu links
  const menuLinks = document.querySelectorAll("#mobile-menu a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  // Close menu on escape key
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      !mobileMenu.classList.contains("translate-x-full")
    ) {
      closeMobileMenu();
    }
  });
});

// Google OAuth2 Configuration
const GOOGLE_CLIENT_ID =
  "1083202700290-5gi4he96crtfrbb7cp6p4u1al7592glh.apps.googleusercontent.com";
const GOOGLE_REDIRECT_URI = window.location.origin + "/auth/callback";
const GOOGLE_SCOPE = "openid email profile";

// Google OAuth2 Login Function
window.handleGoogleLogin = function () {
  console.log("handleGoogleLogin called - redirecting to Google OAuth");

  // Generate a random state parameter for security
  const state = generateRandomString(32);
  localStorage.setItem("oauth_state", state);

  // Build the Google OAuth2 authorization URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_SCOPE);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  console.log("Redirecting to:", authUrl.toString());

  // Redirect to Google OAuth
  window.location.href = authUrl.toString();
};

// Generate random string for state parameter
function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle OAuth callback when user returns from Google
async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const error = urlParams.get("error");

  // Check for errors
  if (error) {
    console.error("OAuth error:", error);
    alert("Login cancelled or failed: " + error);
    // Redirect back to home
    window.location.href = "/";
    return;
  }

  // Verify state parameter
  const storedState = localStorage.getItem("oauth_state");
  if (!state || state !== storedState) {
    console.error("Invalid state parameter");
    alert("Security error: Invalid state parameter");
    window.location.href = "/";
    return;
  }

  // Clean up stored state
  localStorage.removeItem("oauth_state");

  if (!code) {
    console.error("No authorization code received");
    alert("Login failed: No authorization code received");
    window.location.href = "/";
    return;
  }

  try {
    console.log("Processing OAuth callback with code:", code);

    // Send the authorization code to our backend
    const result = await fetch(`${API_BASE}/auth/google-oauth-callback.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code,
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    const data = await result.json();
    console.log("OAuth callback result:", data);

    if (data.success) {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to home page
      window.location.href = "/";
    } else {
      alert("Login failed: " + data.error);
      window.location.href = "/";
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    alert("Login error. Please try again.");
    window.location.href = "/";
  }
}

// Check if we're on the callback page or have OAuth parameters
if (
  window.location.pathname === "/auth/callback" ||
  window.location.search.includes("code=")
) {
  handleOAuthCallback();
}

// Check if user is already logged in when page loads
document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const authToken = localStorage.getItem("authToken");

  if (user && authToken) {
    console.log("User already logged in:", user);
    updateUserInterface(user);
    showCreditsDisplay(user.credits);
  }
});

// Helper functions for UI updates
function updateUserInterface(user) {
  // Update the "Get Started" button to show user dashboard
  const getStartedBtns = document.querySelectorAll(
    'button[onclick="handleGoogleLogin()"]'
  );
  getStartedBtns.forEach((btn) => {
    btn.innerHTML = `
      <img src="${user.avatar}" alt="${user.name}" class="w-6 h-6 rounded-full inline mr-2">
      Dashboard
    `;
    btn.onclick = () => showUserDashboard(user);
  });

  // Show credits
  showCreditsDisplay(user.credits);
}

// Show User Dashboard
function showUserDashboard(user) {
  // Create dashboard modal
  const dashboardHTML = `
    <div id="dashboard-overlay" class="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <!-- Dashboard Header -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <img src="${user.avatar}" alt="${user.name}" class="w-12 h-12 rounded-full border-2 border-white">
              <div>
                <h2 class="text-xl font-bold">${user.name}</h2>
                <p class="text-blue-100 text-sm">${user.email}</p>
              </div>
            </div>
            <button onclick="closeDashboard()" class="group p-2 hover:bg-white/20 rounded-full transition-all duration-200 cursor-pointer">
              <svg class="w-5 h-5 text-white group-hover:text-white group-hover:rotate-90 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div class="p-6 space-y-6">
          <!-- Credits Section -->
          <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">Available Credits</h3>
                  <p class="text-sm text-gray-600">Each transformation uses 1 credit</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-green-600">${user.credits}</div>
                <div class="text-xs text-gray-500">credits</div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-3">
            <h3 class="font-semibold text-gray-800">Quick Actions</h3>
            <div class="grid grid-cols-1 gap-3">
              <button onclick="closeDashboard(); scrollToUpload();" class="flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <div class="text-left">
                  <div class="font-medium text-gray-800">Transform Images</div>
                  <div class="text-sm text-gray-600">Upload and transform your photos</div>
                </div>
              </button>
              
              <button onclick="showCreditHistory()" class="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <div class="text-left">
                  <div class="font-medium text-gray-800">Credit History</div>
                  <div class="text-sm text-gray-600">View your usage history</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Account Actions -->
          <div class="pt-4 border-t border-gray-200">
            <button onclick="handleLogout()" class="w-full flex items-center justify-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span class="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing dashboard
  const existingDashboard = document.getElementById("dashboard-overlay");
  if (existingDashboard) {
    existingDashboard.remove();
  }

  // Add dashboard to page
  document.body.insertAdjacentHTML("beforeend", dashboardHTML);
}

// Close dashboard
window.closeDashboard = function () {
  const dashboard = document.getElementById("dashboard-overlay");
  if (dashboard) {
    dashboard.remove();
  }
};

// Scroll to upload section
window.scrollToUpload = function () {
  const uploadSection = document.querySelector("#dropzone");
  if (uploadSection) {
    uploadSection.scrollIntoView({ behavior: "smooth" });
  }
};

// Show credit history (placeholder)
window.showCreditHistory = function () {
  alert("Credit history feature coming soon!");
};

// Handle logout
window.handleLogout = function () {
  if (confirm("Are you sure you want to sign out?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    location.reload();
  }
};

function showCreditsDisplay(credits) {
  // Add credits display after the hero section
  const heroSection = document.querySelector("section");
  const creditsHTML = `
    <div id="credits-display" class="max-w-4xl mx-auto mt-6 px-4">
      <div class="bg-white rounded-lg shadow-sm border border-neutral-light-gray p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-brand-primary-blue/10 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-primary-blue" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-brand-dark-navy">Available Credits</h3>
              <p class="text-sm text-neutral-medium-gray">Each image uses 1 credit</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-brand-primary-blue">${credits}</div>
            <div class="text-sm text-neutral-medium-gray">credits left</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing credits display
  const existingCredits = document.getElementById("credits-display");
  if (existingCredits) {
    existingCredits.remove();
  }

  heroSection.insertAdjacentHTML("afterend", creditsHTML);
}

function updateCreditsDisplay(newCredits) {
  const creditsElement = document.querySelector("#credits-display .text-2xl");
  if (creditsElement) {
    creditsElement.textContent = newCredits;
  }
}

function showWelcomeMessage(message) {
  showNotification(message, "success", 8000);
}

// Modern Notification System
function showNotification(message, type = "info", duration = 5000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(
    ".custom-notification"
  );
  existingNotifications.forEach((notification) => notification.remove());

  const notification = document.createElement("div");
  notification.className = `custom-notification fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 transform translate-x-full transition-transform duration-300 ease-in-out`;

  // Set border color based on type
  const borderColors = {
    info: "border-blue-500",
    success: "border-green-500",
    warning: "border-yellow-500",
    error: "border-red-500",
  };

  const iconColors = {
    info: "text-blue-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  const icons = {
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    warning:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z",
    error:
      "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  notification.classList.add(borderColors[type]);

  notification.innerHTML = `
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 ${iconColors[type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icons[type]}"></path>
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900">${message}</p>
        </div>
        <div class="ml-4 flex-shrink-0">
          <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 100);

  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, duration);
  }
}

// Show login notification
function showLoginNotification() {
  const notification = document.createElement("div");
  notification.className =
    "fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4";
  notification.id = "login-notification";

  notification.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform scale-95 transition-transform duration-200">
      <div class="text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Sign In Required</h3>
        <p class="text-gray-600 mb-6">Please sign in with your Google account to upload and transform images.</p>
        
        <div class="space-y-3">
          <button onclick="handleGoogleLogin()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
          
          <button onclick="closeLoginNotification()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    const modal = notification.querySelector("div > div");
    modal.classList.remove("scale-95");
    modal.classList.add("scale-100");
  }, 100);
}

// Close login notification
window.closeLoginNotification = function () {
  const notification = document.getElementById("login-notification");
  if (notification) {
    const modal = notification.querySelector("div > div");
    modal.classList.add("scale-95");
    setTimeout(() => {
      notification.remove();
    }, 200);
  }
};

// Show proceed section with modern text field
function showProceedSection() {
  const proceedSection = document.getElementById("proceed-section");
  if (proceedSection) {
    proceedSection.classList.remove("hidden");
    return;
  }

  // Create proceed section with modern transformation input
  const dropzoneSection = document.querySelector(
    ".bg-white.rounded-xl.shadow-sm.border.border-neutral-light-gray.p-8"
  );
  const proceedHTML = `
    <div id="proceed-section" class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Describe Your Transformation</h3>
        <p class="text-gray-600 mb-6">Tell us exactly what you want to do with your images.</p>
      </div>

      <!-- Modern Transformation Input -->
      <div class="mb-6">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v1z"></path>
            </svg>
          </div>
          <textarea 
            id="transformation-description" 
            rows="4" 
            placeholder="Describe exactly what you want to do with your images... (e.g., 'Change the background to a sunset beach', 'Mix all images into a collage', 'Apply vintage filter', 'Remove the background')" 
            class="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none shadow-sm hover:border-gray-300 focus:shadow-md"
          ></textarea>
          <div class="absolute bottom-3 right-3 text-xs text-gray-400">
            <span id="char-count">0</span>/500
          </div>
        </div>
        
        <!-- Quick Suggestions -->
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Quick suggestions:</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="suggestion-btn px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full transition-colors cursor-pointer" data-suggestion="Change the background to a beautiful sunset">
              🌅 Sunset background
            </button>
            <button type="button" class="suggestion-btn px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full transition-colors cursor-pointer" data-suggestion="Mix all images into a seamless collage">
              🎨 Mix images
            </button>
            <button type="button" class="suggestion-btn px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full transition-colors cursor-pointer" data-suggestion="Apply vintage filter with warm tones">
              📸 Vintage style
            </button>
            <button type="button" class="suggestion-btn px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full transition-colors cursor-pointer" data-suggestion="Remove the background completely">
              ✂️ Remove background
            </button>
          </div>
        </div>
      </div>
      
      <div class="text-center">
        <button id="proceed-button" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center space-x-2 cursor-pointer">
          <span>Proceed to Transform</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  dropzoneSection.insertAdjacentHTML("beforeend", proceedHTML);

  // Add event listeners
  const transformationInput = document.getElementById(
    "transformation-description"
  );
  const charCount = document.getElementById("char-count");
  const proceedButton = document.getElementById("proceed-button");
  const suggestionBtns = document.querySelectorAll(".suggestion-btn");

  // Character count functionality
  transformationInput.addEventListener("input", function () {
    const length = this.value.length;
    charCount.textContent = Math.min(length, 500);

    if (length > 500) {
      this.value = this.value.substring(0, 500);
      charCount.textContent = 500;
    }

    // Update character count color
    if (length > 450) {
      charCount.classList.add("text-red-500");
      charCount.classList.remove("text-gray-400");
    } else {
      charCount.classList.remove("text-red-500");
      charCount.classList.add("text-gray-400");
    }
  });

  // Suggestion buttons functionality
  suggestionBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const suggestion = this.dataset.suggestion;
      transformationInput.value = suggestion;
      transformationInput.dispatchEvent(new Event("input"));
      transformationInput.focus();
    });
  });

  // Add event listener to proceed button
  proceedButton.addEventListener("click", function () {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const authToken = localStorage.getItem("authToken");

    if (!user || !authToken) {
      // Show login notification for non-logged users
      showLoginNotification();
      return;
    }

    const description = transformationInput.value.trim();
    if (!description) {
      showNotification(
        "Please describe what you want to do with your images.",
        "warning"
      );
      transformationInput.focus();
      return;
    }

    // Store transformation data
    localStorage.setItem(
      "transformationData",
      JSON.stringify({
        type: "custom",
        description: description,
      })
    );

    hideProceedSection();
    promptSection.classList.remove("hidden");

    // Pre-fill prompt with user description
    const promptField = document.getElementById("image-prompt");
    promptField.value = description;

    // Scroll to prompt section
    promptSection.scrollIntoView({ behavior: "smooth" });
  });
}

// Hide proceed section
function hideProceedSection() {
  const proceedSection = document.getElementById("proceed-section");
  if (proceedSection) {
    proceedSection.classList.add("hidden");
  }
}

// Dropzone Functionality
document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const browseButton = document.querySelector(".browse-button");
  const uploadProgress = document.getElementById("upload-progress");
  const progressBar = document.getElementById("progress-bar");
  const progressPercentage = document.getElementById("progress-percentage");
  const previewArea = document.getElementById("preview-area");
  const imagePreviews = document.getElementById("image-previews");
  const promptSection = document.getElementById("prompt-section");
  const transformButton = document.getElementById("transform-button");

  // Skip dropzone setup if elements don't exist (like on callback page)
  if (
    !dropzone ||
    !fileInput ||
    !uploadProgress ||
    !progressBar ||
    !progressPercentage ||
    !previewArea ||
    !imagePreviews ||
    !promptSection ||
    !transformButton
  ) {
    return;
  }

  let uploadedFiles = [];
  const MAX_FILES = 3;

  // File validation
  function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload only image files (JPG, PNG, GIF, WebP)");
      return false;
    }

    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return false;
    }

    return true;
  }

  // Update dropzone state based on file count
  function updateDropzoneState() {
    const dropzoneContent = document.querySelector(".dropzone-content");
    const fileCountInfo = document.getElementById("file-count-info");

    if (uploadedFiles.length >= MAX_FILES) {
      dropzone.classList.add("disabled");
      dropzoneContent.innerHTML = `
        <div class="dropzone-icon">
          <svg class="w-12 h-12 text-neutral-medium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-brand-dark-navy mb-2">Maximum images uploaded</h3>
        <p class="text-neutral-medium-gray mb-4">You can upload up to ${MAX_FILES} images</p>
        <p class="text-sm text-neutral-medium-gray">Remove an image to upload more</p>
      `;
    } else {
      dropzone.classList.remove("disabled");
      dropzoneContent.innerHTML = `
        <div class="dropzone-icon">
          <svg class="w-12 h-12 text-neutral-medium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-brand-dark-navy mb-2">Drop your image here</h3>
        <p class="text-neutral-medium-gray mb-4">or click to browse files</p>
        <button class="browse-button">Browse Files</button>
        <p class="text-sm text-neutral-medium-gray mt-3">
          Supports: JPG, PNG, GIF, WebP (Max 10MB) • ${uploadedFiles.length}/${MAX_FILES} images
        </p>
      `;

      // Browse button click will be handled by event delegation below
    }
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Create image preview
  function createImagePreview(file, index) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const previewDiv = document.createElement("div");
      previewDiv.className = "image-preview";
      previewDiv.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}">
        <div class="image-preview-info">
          <div class="image-preview-name">${file.name}</div>
          <div class="image-preview-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="image-preview-remove" onclick="removeImage(${index})" title="Remove image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      imagePreviews.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  }

  // Remove image
  window.removeImage = function (index) {
    uploadedFiles.splice(index, 1);
    updatePreviews();
    updateDropzoneState();

    if (uploadedFiles.length === 0) {
      previewArea.classList.add("hidden");
      hideProceedSection();
    }
  };

  // Update previews after removal
  function updatePreviews() {
    imagePreviews.innerHTML = "";
    uploadedFiles.forEach((file, index) => {
      createImagePreview(file, index);
    });
  }

  // Handle file selection
  function handleFiles(files) {
    const validFiles = Array.from(files).filter(validateFile);

    if (validFiles.length === 0) return;

    // Allow file upload for both logged and non-logged users
    // Login check will happen when they click "Proceed to Transform"

    // Check if adding these files would exceed the limit
    const remainingSlots = MAX_FILES - uploadedFiles.length;
    if (remainingSlots === 0) {
      showNotification(
        `Maximum of ${MAX_FILES} images allowed. Please remove some images first.`,
        "warning"
      );
      return;
    }

    // If trying to upload more files than remaining slots, take only what fits
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      showNotification(
        `You can only upload ${remainingSlots} more image(s). Only the first ${remainingSlots} file(s) will be uploaded.`,
        "info"
      );
    }

    // Simulate upload progress
    uploadProgress.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressPercentage.textContent = "0%";

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Add files to uploaded files array
        uploadedFiles.push(...filesToUpload);

        // Show previews and proceed section (instead of prompt section)
        previewArea.classList.remove("hidden");
        showProceedSection();

        // Update dropzone state
        updateDropzoneState();

        // Create previews
        filesToUpload.forEach((file, index) => {
          createImagePreview(
            file,
            uploadedFiles.length - filesToUpload.length + index
          );
        });

        // Hide progress after a short delay
        setTimeout(() => {
          uploadProgress.classList.add("hidden");
        }, 500);
      }

      progressBar.style.width = `${Math.min(progress, 100)}%`;
      progressPercentage.textContent = `${Math.round(
        Math.min(progress, 100)
      )}%`;
    }, 100);
  }

  // Prevent default drag behaviors on document
  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
  });

  // Drag and drop events for dropzone
  dropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadedFiles.length < MAX_FILES) {
      dropzone.classList.add("dragover");
    }
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadedFiles.length < MAX_FILES) {
      dropzone.classList.add("dragover");
    }
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only remove dragover if we're leaving the dropzone completely
    if (!dropzone.contains(e.relatedTarget)) {
      dropzone.classList.remove("dragover");
    }
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
    if (uploadedFiles.length < MAX_FILES) {
      const files = e.dataTransfer.files;
      handleFiles(files);
    }
  });

  // Use event delegation for browse button clicks (handles dynamically created buttons)
  dropzone.addEventListener("click", (e) => {
    if (uploadedFiles.length < MAX_FILES) {
      // Handle browse button clicks
      if (e.target.classList.contains("browse-button")) {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
        return;
      }

      // Handle general dropzone clicks
      if (e.target === dropzone || e.target.closest(".dropzone-content")) {
        fileInput.click();
      }
    }
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    // Clear the input so the same files can be selected again if needed
    e.target.value = "";
  });

  // Initialize dropzone state
  updateDropzoneState();

  // Transform button functionality
  transformButton.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const authToken = localStorage.getItem("authToken");

    if (!user || !authToken) {
      alert("Please sign in to transform images");
      handleGoogleLogin();
      return;
    }

    if (user.credits < uploadedFiles.length) {
      alert(
        `Insufficient credits! You need ${uploadedFiles.length} credits but only have ${user.credits}.`
      );
      return;
    }

    const prompt = document.getElementById("image-prompt").value.trim();

    if (!prompt) {
      alert("Please enter a description for your image transformation");
      return;
    }

    if (uploadedFiles.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    // Process images with PHP backend
    await processImages(uploadedFiles, prompt, authToken);
  });

  // Image processing function
  async function processImages(files, prompt, authToken) {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });
    formData.append("prompt", prompt);

    // Include transformation data if available
    const transformationData = localStorage.getItem("transformationData");
    if (transformationData) {
      formData.append("transformation_data", transformationData);
    }

    try {
      // Show processing state
      transformButton.disabled = true;
      transformButton.textContent = "Processing...";

      const response = await fetch(`${API_BASE}/images/upload.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update credits in UI
        updateCreditsDisplay(result.remaining_credits);

        // Update user data in localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        user.credits = result.remaining_credits;
        localStorage.setItem("user", JSON.stringify(user));

        alert(
          `✅ Success!\n\nJob ID: ${result.job_id}\nRemaining Credits: ${result.remaining_credits}\n\n${result.message}`
        );

        // Clear the form
        document.getElementById("image-prompt").value = "";
        uploadedFiles = [];
        updatePreviews();
        updateDropzoneState();
        document.getElementById("preview-area").classList.add("hidden");
        document.getElementById("prompt-section").classList.add("hidden");
        hideProceedSection();

        // Clear transformation data
        localStorage.removeItem("transformationData");
      } else {
        alert("Processing failed: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      // Reset button state
      transformButton.disabled = false;
      transformButton.textContent = "Transform Image";
    }
  }
});
