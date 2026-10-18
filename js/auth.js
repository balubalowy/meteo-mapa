// js/auth.js
// Firebase Auth (Google) z bramką dostępu do bazy Firebase RTDB

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { AUTH_CONFIG } from '../assets/js/auth-config.js';

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "TWOJ_API_KEY";

function isUserAuthorized(email) {
    if (!AUTH_CONFIG.requireWhitelist) return true;
    if (!email) return false;
    const lowerEmail = email.toLowerCase().trim();
    return AUTH_CONFIG.allowedEmails.some(allowed => lowerEmail === allowed.toLowerCase().trim());
}

function updateRtdbSelectUI(isAuth) {
    const okresSelect = document.getElementById('imgw-okres');
    const badge = document.getElementById('rtdb-status-badge');
    
    if (badge) {
        badge.textContent = isAuth ? 'RTDB: Aktywne' : 'Tylko dla zalogowanych';
        badge.style.color = isAuth ? 'var(--accent-success, #22c55e)' : 'var(--text-muted, #94a3b8)';
    }

    if (!okresSelect) return;
    okresSelect.querySelectorAll('option').forEach(opt => {
        if (opt.value === 'now') return;
        opt.disabled = !isAuth;
        opt.title = isAuth ? '' : 'Wymaga zalogowania kontem Google';
    });

    if (!isAuth && okresSelect.value !== 'now') {
        okresSelect.value = 'now';
        if (typeof window.renderIMGW === 'function') window.renderIMGW();
    }
}

if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.getElementById('auth-login-btn');
        const logoutBtn = document.getElementById('auth-logout-btn');
        const userBadge = document.getElementById('auth-user-badge');
        const userEmailSpan = document.getElementById('auth-user-email');

        const performLogin = () => {
            signInWithPopup(auth, provider).catch(error => {
                console.error("Błąd logowania Firebase:", error);
                alert("Nie udało się zalogować: " + (error.message || error.code));
            });
        };

        if (loginBtn) loginBtn.addEventListener('click', performLogin);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    window.location.reload();
                });
            });
        }

        onAuthStateChanged(auth, (user) => {
            if (user && isUserAuthorized(user.email)) {
                window.firebaseUser = user;
                window.getFirebaseToken = async () => {
                    try {
                        return await user.getIdToken();
                    } catch (err) {
                        console.error("Błąd tokena Firebase:", err);
                        return null;
                    }
                };

                if (loginBtn) loginBtn.style.display = 'none';
                if (userBadge) userBadge.style.display = 'inline-flex';
                if (userEmailSpan) {
                    userEmailSpan.textContent = user.email;
                    userEmailSpan.title = user.email;
                }

                updateRtdbSelectUI(true);
                window.dispatchEvent(new CustomEvent('bmeteo-authenticated', { detail: { user } }));
            } else {
                window.firebaseUser = null;
                window.getFirebaseToken = null;
                if (loginBtn) loginBtn.style.display = 'inline-flex';
                if (userBadge) userBadge.style.display = 'none';

                updateRtdbSelectUI(false);
            }
        });
    });
}
