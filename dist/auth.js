import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
auth.useDeviceLanguage();

let currentUser = null;
let resolveReady;
const ready = new Promise((resolve) => { resolveReady = resolve; });

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
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(error?.code)) {
      await signInWithRedirect(auth, provider);
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
  label.textContent = "Google ਨਾਲ Login";
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
  currentUser = user;
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
});

getRedirectResult(auth).catch((error) => {
  console.error("Google redirect sign-in failed", error);
  notify("Google Login ਪੂਰਾ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।", true);
});

window.ThePosterWalaAuth = Object.freeze({
  auth,
  ready,
  getCurrentUser: () => currentUser,
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
