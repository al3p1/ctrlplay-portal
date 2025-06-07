const supabaseUrl = "https://nyqjeyruewajkkyohplw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cWpleXJ1ZXdhamtreW9ocGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNTQ5MTQsImV4cCI6MjA2NDYzMDkxNH0.t2C7cEpTSVugFzrV4biLb5VrsrOFFBGwwEc3e929s3g";

const headers = {
  "apikey": supabaseKey,
  "Authorization": `Bearer ${supabaseKey}`,
  "Content-Type": "application/json"
};

let currentUser = {
  code: localStorage.getItem("login_code"),
  role: null
};

async function checkLogin() {
  if (!currentUser.code) return;
  const res = await fetch("/api/login", {
    method: "POST",
    headers,
    body: JSON.stringify({ code: currentUser.code })
  });
  const data = await res.json();
  if (data.success) {
    currentUser.role = data.role;
    document.body.classList.add("logged-in");
    loadEverything();
  } else {
    localStorage.removeItem("login_code");
  }
}

document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const code = document.getElementById("accessCodeInput")?.value;
  if (!code) return alert("Enter a code.");
  const res = await fetch("/api/login", {
    method: "POST",
    headers,
    body: JSON.stringify({ code })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem("login_code", code);
    location.reload();
  } else {
    alert(data.message || "Login failed");
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("login_code");
  location.reload();
});

async function loadEverything() {
  loadAnnouncements();
  loadSuggestions();
  loadChat();
  loadFiles();
  loadProfile();
  loadStockGuide();
}

async function loadAnnouncements() {
  const res = await fetch("/api/announcements");
  const data = await res.json();
  const container = document.getElementById("announcementsList");
  if (container) container.innerHTML = data.map(a => `
    <div class="announcement">
      <h3>${a.title}</h3>
      <p>${a.content}</p>
      <small>${new Date(a.timestamp).toLocaleString()}</small>
    </div>
  `).join("");
}

async function loadSuggestions() {
  const res = await fetch("/api/suggestions");
  const data = await res.json();
  const container = document.getElementById("suggestionsList");
  if (container) container.innerHTML = data.map(s => `
    <div class="suggestion">
      <p>${s.content}</p>
      <button onclick="voteSuggestion('${s.id}')">👍 ${s.votes}</button>
    </div>
  `).join("");
}

async function voteSuggestion(id) {
  await fetch("/api/suggestions/vote", {
    method: "POST",
    headers,
    body: JSON.stringify({ id })
  });
  loadSuggestions();
}

async function loadChat() {
  const res = await fetch("/api/chat");
  const data = await res.json();
  const chatBox = document.getElementById("chatMessages");
  if (chatBox) chatBox.innerHTML = data.map(msg => `
    <div class="message"><b>${msg.user}:</b> ${msg.message}</div>
  `).join("");
}

document.getElementById("chatSendBtn")?.addEventListener("click", async () => {
  const input = document.getElementById("chatInput");
  const msg = input?.value;
  if (!msg) return;
  await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ user: currentUser.code, message: msg })
  });
  input.value = "";
  loadChat();
});

async function loadFiles() {
  const res = await fetch("/api/files");
  const data = await res.json();
  const list = document.getElementById("fileList");
  if (list) list.innerHTML = data.map(f => `
    <li><a href="${f.url}" target="_blank">${f.name}</a></li>
  `).join("");
}

async function loadProfile() {
  const res = await fetch("/api/users");
  const data = await res.json();
  const profile = data.find(p => p.code === currentUser.code);
  if (profile) {
    document.getElementById("profileName").textContent = profile.name;
    document.getElementById("profileAvatar").src = profile.avatar;
  }
}

async function loadStockGuide() {
  const res = await fetch("/api/stock-guide");
  const data = await res.json();
  const guide = document.getElementById("stockGuideContent");
  if (guide) guide.innerHTML = data.content;
}

document.addEventListener("DOMContentLoaded", checkLogin);