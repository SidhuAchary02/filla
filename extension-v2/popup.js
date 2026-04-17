/**
 * popup.js
 * Filla Autofill — Popup UI Logic
 *
 * ─── Hardcoded demo credentials (replace with real API call in production) ───
 * Email:    siddhuachary2005@gmail.com
 * Password: filla123
 */

"use strict";

// ─── Static User Data ──────────────────────────────────────────────────────
const DEMO_CREDENTIALS = {
    email: "siddhuachary2005@gmail.com",
    password: "filla123",
};

const DEMO_USER_DATA = {
    email: "siddhuachary2005@gmail.com",
    profile: {
        first_name: "Siddhu",
        last_name: "Achary",
        preferred_name: "Sidhu Achary",
        phone: "+91-7208387440",
        gender: "Male",
        role: "AI Engineer",
        experience_level: "entry",
        current_ctc: 800000,
        min_salary: 1500000,
        notice_period: "immediate",
        location: {
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
        },
        address: "f-31/4, sion",
        skills: ["SQL", "PostgreSQL", "Python", "React", "Artificial Intelligence", "Generative AI", "AWS"],
        languages: ["Hindi", "English", "Telugu"],
        links: {
            github: "https://github.com/SidhuAchary02",
            linkedin: "https://www.linkedin.com/in/sidhu2",
            portfolio: "https://sidhuachary02.github.io",
        },
    },
};

// ─── DOM References ────────────────────────────────────────────────────────
const viewLogin = document.getElementById("view-login");
const viewDashboard = document.getElementById("view-dashboard");

const inputEmail = document.getElementById("input-email");
const inputPassword = document.getElementById("input-password");
const signinBtn = document.getElementById("signin-btn");
const loginError = document.getElementById("login-error");
const loginErrorText = document.getElementById("login-error-text");

const logoutBtn = document.getElementById("logout-btn");
const autofillBtn = document.getElementById("autofill-btn");
const autofillMsg = document.getElementById("autofill-msg");
const userEmailDisplay = document.getElementById("user-email-display");
const userAvatar = document.getElementById("user-avatar");
const manageProfileBtn = document.getElementById("manage-profile-btn");

// ─── View Switching ────────────────────────────────────────────────────────
function showView(name) {
    viewLogin.classList.add("hidden");
    viewLogin.classList.remove("visible");
    viewDashboard.classList.add("hidden");
    viewDashboard.classList.remove("visible");

    const target = name === "login" ? viewLogin : viewDashboard;
    // tiny rAF delay so CSS transition triggers correctly
    requestAnimationFrame(() => {
        target.classList.remove("hidden");
        requestAnimationFrame(() => target.classList.add("visible"));
    });
}

// ─── Auth Helpers ──────────────────────────────────────────────────────────
function showLoginError(msg) {
    loginErrorText.textContent = msg;
    loginError.classList.remove("hidden");
}
function clearLoginError() {
    loginError.classList.add("hidden");
}

function setSigninLoading(loading) {
    signinBtn.classList.toggle("loading", loading);
    signinBtn.disabled = loading;
}

// ─── Dashboard Helpers ────────────────────────────────────────────────────
function populateDashboard(userData) {
    userEmailDisplay.textContent = userData.email;
    userAvatar.textContent = (userData.profile?.first_name?.[0] || userData.email[0]).toUpperCase();
}

function showAutofillMsg(type, text) {
    autofillMsg.className = `msg ${type}`;
    autofillMsg.innerHTML = `<span>${type === "success" ? "✓" : "⚠"}</span><span>${text}</span>`;
    // Auto-hide after 4s
    clearTimeout(autofillMsg._timer);
    autofillMsg._timer = setTimeout(() => {
        autofillMsg.classList.add("hidden");
    }, 4000);
}

function setAutofillLoading(loading) {
    autofillBtn.classList.toggle("loading", loading);
    autofillBtn.disabled = loading;
}

// ─── Sign In Handler ──────────────────────────────────────────────────────
signinBtn.addEventListener("click", async () => {
    clearLoginError();

    const email = inputEmail.value.trim();
    const password = inputPassword.value.trim();

    console.log({ email, password });
    if (!email || !password) {
        showLoginError("Please enter your email and password.");
        return;
    }

    setSigninLoading(true);

    try {
        // 🔥 CALL YOUR BACKEND (Supabase / API)
        const res = await fetch("http://localhost:8000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        console.log("API RESPONSE:", data);

        if (!res.ok) {
            throw new Error(data.message || "Login failed");
        }

        // ✅ EXPECTED RESPONSE FORMAT
        // {
        //   token: "...",
        //   user: { ...your full userData object... }
        // }

        await chrome.storage.local.set({
            fillaToken: data.token,
            fillaUserData: data.user,
        });

        populateDashboard(data.user);
        showView("dashboard");

    } catch (err) {
        console.error("[Filla] Login error:", err);
        showLoginError(err.message || "Something went wrong");
    }

    setSigninLoading(false);
});

// Allow Enter key in password field
inputPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") signinBtn.click();
});
inputEmail.addEventListener("keydown", (e) => {
    if (e.key === "Enter") inputPassword.focus();
});

// ─── Logout Handler ────────────────────────────────────────────────────────
logoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove(["fillaToken", "fillaUserData"]);
    inputEmail.value = "";
    inputPassword.value = "";
    clearLoginError();
    autofillMsg.classList.add("hidden");
    showView("login");
});

// ─── Autofill Handler ─────────────────────────────────────────────────────
autofillBtn.addEventListener("click", async () => {
    autofillMsg.classList.add("hidden");
    setAutofillLoading(true);

    const { fillaUserData } = await chrome.storage.local.get("fillaUserData");

    if (!fillaUserData) {
        setAutofillLoading(false);
        showAutofillMsg("error", "No profile data found. Please log in again.");
        return;
    }

    chrome.runtime.sendMessage(
        { type: "FILLA_AUTOFILL", userData: fillaUserData },
        (response) => {
            setAutofillLoading(false);

            if (chrome.runtime.lastError) {
                showAutofillMsg("error", "Could not reach the page. Try refreshing.");
                return;
            }

            if (response?.success) {
                showAutofillMsg("success", "Form filled successfully!");
            } else {
                showAutofillMsg("error", `Fill error: ${response?.error || "Unknown error"}`);
            }
        }
    );
});

// ─── Manage Profile Handler ───────────────────────────────────────────────
manageProfileBtn.addEventListener("click", () => {
    // Opens LinkedIn profile as a stand-in for profile management
    // Replace with your actual profile management URL
    chrome.tabs.create({ url: "https://www.linkedin.com/in/sidhu2" });
});

// ─── Init: Check existing session ─────────────────────────────────────────
(async function init() {
    const { fillaToken, fillaUserData } = await chrome.storage.local.get([
        "fillaToken",
        "fillaUserData",
    ]);

    if (fillaToken && fillaUserData) {
        populateDashboard(fillaUserData);
        showView("dashboard");
    } else {
        showView("login");
    }
})();