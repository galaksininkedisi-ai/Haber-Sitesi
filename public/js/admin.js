// basit admin: token bazlı login + CRUD
const loginCard = document.getElementById('loginCard');
const adminPanel = document.getElementById('adminPanel');

function refreshAuthUI(){
  if(getToken()){
    loginCard.hidden = true;
    adminPanel.hidden = false;
    renderTable();
  } else {
    loginCard.hidden = false;
    adminPanel.hidden = true;
  }
}
refreshAuthUI();

// Login
document.getElementById('loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const err = document.getElementById('err');
  try{
    const { token } = await apiLogin(u, p);
    setToken(token);
    err.hidden = true;
    refreshAuthUI();
  }catch(ex){
    err.textContent = ex.message || 'Giriş başarısız';
    err.hidden = false;
  }
});

document.getElementById('logoutBtn').addEventListener('click', ()=>{
  setToken("");
  location.reload();
});

// Editor toolbar
const editor = document.getElementById('editor');
document.getElementById('toolbar').addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const cmd = btn.dataset.cmd;
  if(!cmd) return;
  document.execCommand(cmd, false, null);
  editor.focus();
});
document.getElementById('block').addEventListener('change', (e)=>{
  document.execCommand('formatBlock', false, e.target.value);
  editor.focus();
});
document.getElementById('fontSize').addEventListener('change', (e)=>{
  document.execCommand('fontSize', false, e.target.value);
  editor.focus();
});
document.getElementById('addLink').addEventListener('click', ()=>{
  const url = prompt('Bağlantı adresi:');
  if(url){ document.execCommand('createLink', false, url); }
});
document.getElementById('removeFormat').addEventListener('click', ()=>{
  document.execCommand('removeFormat', false, null);
  ['bold','italic','underline','strikeThrough'].forEach(c=> document.execCommand(c, false, null));
});

// File inputs
const coverInput = document.getElementById('cover');
const coverPreview = document.getElementById('coverPreview');
const mediaInput = document.getElementById('media');
const mediaPreview = document.getElementById('mediaPreview');

function readLocalPreview(file){
  return new Promise((resolve)=>{
    const fr = new FileReader();
    fr.onload = ()=> resolve(fr.result);
    fr.readAsDataURL(file);
  });
}

coverInput.addEventListener('change', async ()=>{
  coverPreview.innerHTML = '';
  if(coverInput.files[0]){
    const src = await readLocalPreview(coverInput.files[0]);
    const img = document.createElement('img');
    img.src = src; coverPreview.appendChild(img);
  }
});

let mediaBuffer = []; // sadece önizleme için (dosyalar formdata ile gidecek)
mediaInput.addEventListener('change', async ()=>{
  for(const f of mediaInput.files) mediaBuffer.push(f);
  renderMediaPreview();
  mediaInput.value = '';
});
function renderMediaPreview(){
  mediaPreview.innerHTML = '';
  mediaBuffer.forEach((f, idx)=>{
    const wrap = document.createElement('div');
    if(f.type.startsWith('video')){
      const v = document.createElement('video'); v.controls = true;
      readLocalPreview(f).then(src=> v.src = src);
      wrap.appendChild(v);
    }else{
      const img = document.createElement('img');
      readLocalPreview(f).then(src=> img.src = src);
      wrap.appendChild(img);
    }
    const rm = document.createElement('button');
    rm.textContent = 'Kaldır'; rm.className = 'btn outline'; rm.style.marginTop='6px';
    rm.addEventListener('click', ()=>{ mediaBuffer.splice(idx,1); renderMediaPreview(); });
    wrap.appendChild(rm);
    mediaPreview.appendChild(wrap);
  });
}

// CRUD
const postForm = document.getElementById('postForm');
const saveMsg = document.getElementById('saveMsg');

postForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = document.getElementById('postId').value.trim();
  const title = document.getElementById('title').value.trim();
  const contentHTML = editor.innerHTML.trim();
  const coverFile = coverInput.files[0] || null;

  if(!title || !contentHTML){
    alert('Başlık ve haber yazısı zorunludur.');
    return;
  }

  try{
    if(id){
      await apiUpdatePost(id, { title, contentHTML, coverFile, mediaFiles: mediaBuffer, keepMedia: true });
    }else{
      await apiCreatePost({ title, contentHTML, coverFile, mediaFiles: mediaBuffer });
    }
    saveMsg.hidden = false;
    setTimeout(()=> saveMsg.hidden = true, 1200);
    resetForm();
    renderTable();
  }catch(ex){
    alert(ex.message || 'Kaydetme hatası');
  }
});

function resetForm(){
  postForm.reset();
  coverPreview.innerHTML = '';
  mediaBuffer = [];
  mediaPreview.innerHTML = '';
  editor.innerHTML = '';
  document.getElementById('postId').value = '';
}
document.getElementById('resetBtn')?.addEventListener('click', resetForm);

// Tablo
async function renderTable(){
  const tbody = document.querySelector('#postTable tbody');
  tbody.innerHTML = '';
  const list = (await apiListPosts()).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  for(const p of list){
    const tr = document.createElement('tr');

    const tdCover = document.createElement('td');
    const img = document.createElement('img');
    img.src = p.cover || '';
    img.style.width='72px'; img.style.height='54px'; img.style.objectFit='cover'; img.style.borderRadius='8px';
    tdCover.appendChild(img);

    const tdTitle = document.createElement('td'); tdTitle.textContent = p.title;
    const tdDate = document.createElement('td');
    tdDate.textContent = new Date(p.createdAt).toLocaleString('tr-TR', { dateStyle:'medium', timeStyle:'short' });

    const tdAct = document.createElement('td');
    const editBtn = document.createElement('button'); editBtn.className='btn outline'; editBtn.textContent='Düzenle';
    const viewBtn = document.createElement('a'); viewBtn.className='btn'; viewBtn.textContent='Görüntüle'; viewBtn.href=`article.html?id=${encodeURIComponent(p.id)}`; viewBtn.target='_blank';
    const delBtn = document.createElement('button'); delBtn.className='btn danger'; delBtn.textContent='Sil';

    editBtn.addEventListener('click', ()=> loadToForm(p));
    delBtn.addEventListener('click', async ()=>{
      if(confirm('Bu haberi silmek istediğinize emin misiniz?')){
        try{ await apiDeletePost(p.id); renderTable(); if(document.getElementById('postId').value === p.id){ resetForm(); } }
        catch(ex){ alert(ex.message || 'Silinemedi'); }
      }
    });

    tdAct.append(editBtn, ' ', viewBtn, ' ', delBtn);
    tr.append(tdCover, tdTitle, tdDate, tdAct);
    tbody.appendChild(tr);
  }
}

function loadToForm(p){
  document.getElementById('postId').value = p.id;
  document.getElementById('title').value = p.title || '';
  editor.innerHTML = p.contentHTML || '';
  coverPreview.innerHTML = p.cover ? `<img src="${p.cover}">` : '';
  mediaBuffer = []; // yeni medya eklenecekse eklersin; mevcut medya korunur (keepMedia=true)
  mediaPreview.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}



