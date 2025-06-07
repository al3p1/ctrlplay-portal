// ctrlplay.js – Real-Time CTRLPLAY Portal Sync

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://nyqjeyruewajkkyohplw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cWpleXJ1ZXdhamtreW9ocGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNTQ5MTQsImV4cCI6MjA2NDYzMDkxNH0.t2C7cEpTSVugFzrV4biLb5VrsrOFFBGwwEc3e929s3g";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const loginCode = localStorage.getItem("login_code") || "Guest";

document.addEventListener("DOMContentLoaded", async () => {
  await loadAll();
  setupRealtime();
  setupEvents();
});

async function loadAll() {
  await Promise.all([
    loadChat(),
    loadSuggestions(),
    loadComments(),
    loadAnnouncements(),
    loadStockGuide(),
    loadProfile(),
    loadFiles()
  ]);
}

function setupEvents() {
  document.getElementById("chatSendBtn")?.addEventListener("click", sendChat);
  document.getElementById("suggestionSubmitBtn")?.addEventListener("click", submitSuggestion);
  document.getElementById("announcementPostBtn")?.addEventListener("click", postAnnouncement);
  document.getElementById("saveGuideBtn")?.addEventListener("click", saveStockGuide);
  document.getElementById("saveProfileBtn")?.addEventListener("click", updateProfile);
  document.getElementById("uploadFileBtn")?.addEventListener("click", uploadFile);
}

function setupRealtime() {
  supabase.channel("realtime")
    .on("postgres_changes", { event: "*", schema: "public" }, payload => {
      const table = payload.table;
      if (table === "chat_messages") loadChat();
      if (table === "suggestions") loadSuggestions();
      if (table === "suggestion_comments") loadComments();
      if (table === "announcements") loadAnnouncements();
      if (table === "stock_guide") loadStockGuide();
      if (table === "files") loadFiles();
    })
    .subscribe();
}

async function loadChat() {
  const { data } = await supabase.from("chat_messages").select("*").order("timestamp", { ascending: false });
  const chatBox = document.getElementById("chatMessages");
  if (!chatBox) return;
  chatBox.innerHTML = data.map(m => `<div><strong>${m.user}</strong>: ${m.message}</div>`).join("");
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  if (!input?.value) return;
  await supabase.from("chat_messages").insert({ user: loginCode, message: input.value });
  input.value = "";
}

async function loadSuggestions() {
  const { data } = await supabase.from("suggestions").select("*").order("timestamp", { ascending: false });
  const box = document.getElementById("suggestionsList");
  if (!box) return;
  box.innerHTML = data.map(s => `
    <div>
      <p>${s.message}</p>
      <button onclick="voteSuggestion('${s.id}')">👍 ${s.votes || 0}</button>
      <input id="commentInput-${s.id}" placeholder="Add comment..." />
      <button onclick="submitComment('${s.id}')">Reply</button>
    </div>
  `).join("");
}

async function submitSuggestion() {
  const input = document.getElementById("suggestionContent");
  if (!input?.value) return;
  await supabase.from("suggestions").insert({ message: input.value, votes: 0 });
  input.value = "";
}

async function voteSuggestion(id) {
  const { data } = await supabase.from("suggestions").select("votes").eq("id", id).single();
  await supabase.from("suggestions").update({ votes: (data?.votes || 0) + 1 }).eq("id", id);
}

async function submitComment(suggestionId) {
  const input = document.getElementById(`commentInput-${suggestionId}`);
  if (!input?.value) return;
  await supabase.from("suggestion_comments").insert({
    suggestion_id: suggestionId,
    user: loginCode,
    comment: input.value
  });
  input.value = "";
}

async function loadComments() {
  const { data } = await supabase.from("suggestion_comments").select("*");
  data.forEach(c => {
    const boxId = `comments-${c.suggestion_id}`;
    let box = document.getElementById(boxId);
    if (!box) {
      const suggestionDiv = document.querySelector(`[id^="commentInput-${c.suggestion_id}"]`)?.parentElement;
      box = document.createElement("div");
      box.id = boxId;
      suggestionDiv?.appendChild(box);
    }
    if (box) {
      box.innerHTML += `<div><strong>${c.user}</strong>: ${c.comment}</div>`;
    }
  });
}

async function loadAnnouncements() {
  const { data } = await supabase.from("announcements").select("*").order("timestamp", { ascending: false });
  const box = document.getElementById("announcementsList");
  if (!box) return;
  box.innerHTML = data.map(a => `<div><h3>${a.title}</h3><p>${a.body}</p><small>${new Date(a.timestamp).toLocaleString()}</small></div>`).join("");
}

async function postAnnouncement() {
  const title = document.getElementById("announcementTitle")?.value;
  const body = document.getElementById("announcementContent")?.value;
  if (!title || !body) return;
  await supabase.from("announcements").insert({ title, body });
}

async function loadStockGuide() {
  const { data } = await supabase.from("stock_guide").select("*").limit(1).single();
  document.getElementById("stockGuideEditor").value = data?.content || "";
}

async function saveStockGuide() {
  const content = document.getElementById("stockGuideEditor")?.value;
  await supabase.from("stock_guide").upsert({ id: 1, content });
}

async function loadProfile() {
  const { data } = await supabase.from("users").select("*").eq("code", loginCode).single();
  if (data) {
    document.getElementById("profileNameInput").value = data.display_name || "";
    document.getElementById("avatarUrlInput").value = data.avatar_url || "";
  }
}

async function updateProfile() {
  const name = document.getElementById("profileNameInput")?.value;
  const avatar = document.getElementById("avatarUrlInput")?.value;
  await supabase.from("users").upsert({ code: loginCode, display_name: name, avatar_url: avatar });
}

async function loadFiles() {
  const { data } = await supabase.from("files").select("*").order("uploaded_at", { ascending: false });
  const box = document.getElementById("fileList");
  if (!box) return;
  box.innerHTML = data.map(f => `<div><a href="${f.url}" target="_blank">${f.name}</a> (${f.file_type})</div>`).join("");
}

async function uploadFile() {
  const input = document.getElementById("fileInput");
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    await supabase.from("files").insert({
      name: file.name,
      url: reader.result,
      file_type: file.type,
      uploaded_by: loginCode
    });
    input.value = "";
  };
  reader.readAsDataURL(file);
}
