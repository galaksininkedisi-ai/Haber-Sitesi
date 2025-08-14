// strogeData.js: LocalStorage helpers + simple auth (demo)

const STORAGE_KEY = 'newsPostsV1';
const CREDS_KEY   = 'adminCredsV1';
const AUTH_KEY    = 'adminAuthedV1';

// --- Auth (demo) ---
function ensureDefaultCreds(){
  if(!localStorage.getItem(CREDS_KEY)){
    const creds = { username: 'admin2', password: '5555' }; // demo only
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  }
}

function getCreds(){
  ensureDefaultCreds();
  try {
    return JSON.parse(localStorage.getItem(CREDS_KEY)) || { username:'admin2', password:'5555' };
  } catch(e){
    return { username:'admin2', password:'5555' };
  }
}

function setPassword(newPassword){
  const c = getCreds();
  c.password = newPassword;
  localStorage.setItem(CREDS_KEY, JSON.stringify(c));
}

function isAuthed(){
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function setAuthed(v){
  localStorage.setItem(AUTH_KEY, v ? 'true' : 'false');
}

// --- Posts CRUD ---
function getPosts(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch(e){
    return [];
  }
}

function savePosts(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function upsertPost(post){
  const list = getPosts();
  const idx = list.findIndex(p => p.id === post.id);
  if(idx >= 0){
    list[idx] = post;          // güncelle
  } else {
    list.unshift(post);        // yeni haberi başa ekle
  }
  savePosts(list);
}

function deletePost(id){
  const list = getPosts().filter(p => p.id !== id);
  savePosts(list);
}

function getPostById(id){
  return getPosts().find(p => p.id === id);
}

// --- Utils ---
function uuid(){
  return Date.now().toString(36) + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

function formatDate(dtStr){
  const d = new Date(dtStr);
  return d.toLocaleString('tr-TR', { dateStyle:'medium', timeStyle:'short' });
}

function stripHtml(html){
  return (html || '').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
}
