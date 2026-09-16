import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCH1ynVoBfFGW6j9q96KSWZiYnBogLjj-s",
  authDomain: "the-poster-wala-auth.firebaseapp.com",
  projectId: "the-poster-wala-auth",
  storageBucket: "the-poster-wala-auth.firebasestorage.app",
  messagingSenderId: "815822365858",
  appId: "1:815822365858:web:2cedcafc0d31ddfcaaa3fb"
};

const PAYMENT_API = "https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const GOOGLE_OAUTH_CLIENT_ID = "815822365858-lllftvbcggneq01pjj97m9r29bsgbst6.apps.googleusercontent.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
auth.useDeviceLanguage();
const useMobileRedirect = /Android/i.test(navigator.userAgent);
const useGoogleTokenLogin = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const redirectPendingKey = "tpw-login-redirect-pending";
const popupFallbackKey = "tpw-login-popup-fallback";
const persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Local login persistence could not be initialized", error);
});
if (!useMobileRedirect) {
  sessionStorage.removeItem(redirectPendingKey);
  sessionStorage.removeItem(popupFallbackKey);
}

let googleTokenClient = null;
let googleIdentityReady = false;
if (useGoogleTokenLogin) {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.onload = () => {
    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      scope: "openid email profile",
      callback: async (response) => {
        if (response?.error || !response?.access_token) {
          notify(`Google Login error: ${response?.error || "token_missing"}`, true);
          return;
        }
        try {
          await persistenceReady;
          const credential = GoogleAuthProvider.credential(null, response.access_token);
          await signInWithCredential(auth, credential);
          notify("Google Login ਹੋ ਗਿਆ।");
        } catch (error) {
          console.error("Google token sign-in failed", error);
          notify(`Google Login error: ${error?.code || "unknown"}`, true);
        }
      }
    });
    googleIdentityReady = true;
  };
  script.onerror = () => notify("Google Login service load ਨਹੀਂ ਹੋਈ। Page refresh ਕਰੋ।", true);
  document.head.append(script);
}

let currentUser = null;
let currentServerSession = null;
let authChangeSequence = 0;
let resolveReady;
const ready = new Promise((resolve) => { resolveReady = resolve; });

async function syncServerSession(user, sequence) {
  const idToken = await user.getIdToken();
  const response = await fetch(`${PAYMENT_API}/auth/session`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: "{}"
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "Secure login session could not be created");
  }

  if (sequence !== authChangeSequence || auth.currentUser?.uid !== user.uid) return null;
  currentServerSession = result;
  if (result.isOwner && shell && !location.pathname.endsWith("owner-dashboard.html")) {
    const controls = shell.querySelector(".tpw-user-controls");
    if (controls && !controls.querySelector(".tpw-owner-link")) {
      const ownerLink = document.createElement("a");
      ownerLink.className = "tpw-owner-link";
      ownerLink.href = "./owner-dashboard.html";
      ownerLink.textContent = "Owner Dashboard";
      controls.append(ownerLink);
    }
  }
  window.dispatchEvent(new CustomEvent("tpw-server-session", { detail: result }));
  return result;
}

function notify(message, isError = false) {
  let toast = document.querySelector(".tpw-auth-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "tpw-auth-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

async function login() {
  try {
    if (useGoogleTokenLogin) {
      if (!googleIdentityReady || !googleTokenClient) {
        notify("Google Login ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ—ਇੱਕ ਵਾਰ ਫਿਰ ਦਬਾਓ।", true);
        return;
      }
      googleTokenClient.requestAccessToken({ prompt: "select_account" });
      return;
    }
    const shouldUsePopupFallback = sessionStorage.getItem(popupFallbackKey) === "1";
    if (useMobileRedirect && !shouldUsePopupFallback) {
      await persistenceReady;
      sessionStorage.setItem(redirectPendingKey, "1");
      await signInWithRedirect(auth, provider);
      return;
    }
    // Keep this call as the first asynchronous browser action after the tap.
    // Safari blocks popups when another awaited task runs before this call.
    const popupResult = signInWithPopup(auth, provider);
    await popupResult;
    sessionStorage.removeItem(redirectPendingKey);
    sessionStorage.removeItem(popupFallbackKey);
  } catch (error) {
    if (useMobileRedirect && ["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(error?.code)) {
      await signInWithRedirect(auth, provider);
      return;
    }
    if (error?.code === "auth/popup-blocked") {
      notify("Safari Settings ਵਿੱਚ Pop-ups Allow ਕਰਕੇ Login ਦੁਬਾਰਾ ਦਬਾਓ।", true);
      return;
    }
    if (!["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(error?.code)) {
      console.error("Google sign-in failed", error);
      notify("Google Login ਨਹੀਂ ਹੋ ਸਕਿਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।", true);
    }
  }
}

async function logout() {
  try {
    await signOut(auth);
    notify("ਤੁਸੀਂ Logout ਹੋ ਗਏ ਹੋ।");
  } catch (error) {
    console.error("Sign-out failed", error);
    notify("Logout ਨਹੀਂ ਹੋ ਸਕਿਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।", true);
  }
}

function loginButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tpw-google-login";
  button.setAttribute("aria-label", "Google account ਨਾਲ Login ਕਰੋ");
  const mark = document.createElement("span");
  mark.className = "tpw-google-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "G";
  const label = document.createElement("span");
  label.textContent = sessionStorage.getItem(popupFallbackKey) === "1"
    ? "Google Login ਦੁਬਾਰਾ ਕਰੋ"
    : "Google ਨਾਲ Login";
  button.append(mark, label);
  button.addEventListener("click", login);
  return button;
}

function userControls(user) {
  const controls = document.createElement("div");
  controls.className = "tpw-user-controls";
  const identity = document.createElement("div");
  identity.className = "tpw-user-identity";
  identity.title = user.email || user.displayName || "Signed-in user";

  let avatar;
  if (user.photoURL?.startsWith("https://")) {
    avatar = document.createElement("img");
    avatar.src = user.photoURL;
    avatar.alt = "";
    avatar.referrerPolicy = "no-referrer";
  } else {
    avatar = document.createElement("span");
    avatar.textContent = (user.displayName || user.email || "U").trim().charAt(0).toUpperCase();
    avatar.setAttribute("aria-hidden", "true");
    avatar.classList.add("tpw-user-avatar-fallback");
  }
  avatar.classList.add("tpw-user-avatar");

  const copy = document.createElement("span");
  copy.className = "tpw-user-copy";
  const name = document.createElement("strong");
  name.textContent = user.displayName || "Google User";
  const status = document.createElement("small");
  status.textContent = "Login ਹੋਇਆ";
  copy.append(name, status);
  identity.append(avatar, copy);

  const out = document.createElement("button");
  out.type = "button";
  out.className = "tpw-logout-button";
  out.textContent = "Logout";
  out.addEventListener("click", logout);
  controls.append(identity, out);
  return controls;
}

const actions = document.querySelector(".topbar-actions");
let shell = null;
if (actions) {
  shell = document.createElement("div");
  shell.className = "tpw-auth-shell";
  shell.setAttribute("aria-live", "polite");
  const loading = document.createElement("span");
  loading.className = "tpw-auth-loading";
  loading.textContent = "Login ਚੈੱਕ ਹੋ ਰਿਹਾ…";
  shell.append(loading);
  actions.prepend(shell);
}

onAuthStateChanged(auth, (user) => {
  const sequence = ++authChangeSequence;
  currentUser = user;
  currentServerSession = null;
  if (shell) shell.replaceChildren(user ? userControls(user) : loginButton());
  resolveReady?.(user);
  resolveReady = null;
  window.dispatchEvent(new CustomEvent("tpw-auth-changed", {
    detail: user ? {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || ""
    } : null
  }));

  if (user) {
    syncServerSession(user, sequence).catch((error) => {
      if (sequence === authChangeSequence) {
        console.warn("Secure login session sync failed", error);
      }
    });
  } else {
    window.dispatchEvent(new CustomEvent("tpw-server-session", { detail: null }));
  }
});

getRedirectResult(auth)
  .then((result) => {
    const redirectWasPending = sessionStorage.getItem(redirectPendingKey) === "1";
    if (result?.user) {
      sessionStorage.removeItem(redirectPendingKey);
      sessionStorage.removeItem(popupFallbackKey);
      return;
    }
    if (redirectWasPending) {
      sessionStorage.removeItem(redirectPendingKey);
      sessionStorage.setItem(popupFallbackKey, "1");
      const label = document.querySelector(".tpw-google-login span:last-child");
      if (label) label.textContent = "Google Login ਦੁਬਾਰਾ ਕਰੋ";
      notify("Safari ਵਿੱਚ Google Login ਬਟਨ ਦੁਬਾਰਾ ਦਬਾਓ।", true);
    }
  })
  .catch((error) => {
    sessionStorage.removeItem(redirectPendingKey);
    sessionStorage.setItem(popupFallbackKey, "1");
    console.error("Google redirect sign-in failed", error);
    notify("Safari ਵਿੱਚ Google Login ਬਟਨ ਦੁਬਾਰਾ ਦਬਾਓ।", true);
  });

window.ThePosterWalaAuth = Object.freeze({
  auth,
  ready,
  getCurrentUser: () => currentUser,
  getServerSession: () => currentServerSession,
  syncServerSession: async () => {
    const user = currentUser || await ready;
    return user ? syncServerSession(user, authChangeSequence) : null;
  },
  getIdToken: async (forceRefresh = false) => {
    const user = currentUser || await ready;
    return user ? user.getIdToken(forceRefresh) : null;
  },
  requireUser: async () => {
    if (currentUser) return currentUser;
    await login();
    return auth.currentUser;
  },
  signIn: login,
  signOut: logout
});
