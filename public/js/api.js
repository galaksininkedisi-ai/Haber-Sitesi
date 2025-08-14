const API_BASE = ""; // aynı origin: /api/... (backend ile aynı sunucuda çalışıyoruz)

function getToken(){ return localStorage.getItem("token") || ""; }
function setToken(t){ localStorage.setItem("token", t || ""); }
function authHeader(){
  const t = getToken();
  return t ? { "Authorization": "Bearer " + t } : {};
}

// Auth
async function apiLogin(username, password){
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ username, password })
  });
  if(!r.ok) throw new Error((await r.json()).error || "Giriş başarısız");
  return r.json(); // {token}
}

// Posts (public)
async function apiListPosts(){
  const r = await fetch("/api/posts");
  if(!r.ok) throw new Error("Liste alınamadı");
  return r.json();
}
async function apiGetPost(id){
  const r = await fetch("/api/posts/" + encodeURIComponent(id));
  if(!r.ok) throw new Error("Haber bulunamadı");
  return r.json();
}

// Posts (admin)
async function apiCreatePost({ title, contentHTML, coverFile, mediaFiles }){
  const fd = new FormData();
  fd.append("title", title);
  fd.append("contentHTML", contentHTML);
  if(coverFile) fd.append("cover", coverFile);
  (mediaFiles || []).forEach(f => fd.append("media", f));

  const r = await fetch("/api/posts", {
    method: "POST",
    headers: { ...authHeader() },
    body: fd
  });
  if(!r.ok) throw new Error((await r.json()).error || "Kaydedilemedi");
  return r.json();
}

async function apiUpdatePost(id, { title, contentHTML, coverFile, mediaFiles, keepMedia = true }){
  const fd = new FormData();
  if(title) fd.append("title", title);
  if(contentHTML) fd.append("contentHTML", contentHTML);
  fd.append("keepMedia", keepMedia ? "true" : "false");
  if(coverFile) fd.append("cover", coverFile);
  (mediaFiles || []).forEach(f => fd.append("media", f));

  const r = await fetch("/api/posts/" + encodeURIComponent(id), {
    method: "PUT",
    headers: { ...authHeader() },
    body: fd
  });
  if(!r.ok) throw new Error((await r.json()).error || "Güncellenemedi");
  return r.json();
}

async function apiDeletePost(id){
  const r = await fetch("/api/posts/" + encodeURIComponent(id), {
    method: "DELETE",
    headers: { ...authHeader() }
  });
  if(!r.ok) throw new Error((await r.json()).error || "Silinemedi");
  return r.json();
}
