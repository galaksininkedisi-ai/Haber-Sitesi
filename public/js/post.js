document.getElementById('year').textContent = new Date().getFullYear();

const params = new URLSearchParams(location.search);
const id = params.get('id');

(async ()=>{
  try{
    const post = await apiGetPost(id);
    const hero = document.getElementById('hero');
    const title = document.getElementById('title');
    const meta = document.getElementById('meta');
    const gallery = document.getElementById('gallery');
    const content = document.getElementById('content');

    if(post.cover){
      const img = document.createElement('img');
      img.src = post.cover;
      img.alt = post.title || 'Kapak görseli';
      img.decoding = 'async';
      hero.appendChild(img);
    }

    title.textContent = post.title || 'Başlıksız';
    meta.textContent = new Date(post.createdAt).toLocaleString('tr-TR', { dateStyle:'medium', timeStyle:'short' }) + (post.updatedAt ? (' • güncellendi: ' + new Date(post.updatedAt).toLocaleString('tr-TR', { dateStyle:'medium', timeStyle:'short' })) : '');

    const media = post.media || [];
    if(media.length){
      gallery.hidden = false;
      for(const m of media){
        if(m.type === 'video'){
          const v = document.createElement('video');
          v.controls = true; v.src = m.src; v.preload = 'metadata';
          gallery.appendChild(v);
        } else {
          const img = document.createElement('img');
          img.src = m.src; img.alt = m.name || 'Medya'; img.loading = 'lazy';
          gallery.appendChild(img);
        }
      }
    }

    content.innerHTML = post.contentHTML || '';
  }catch(e){
    document.getElementById('not-found').hidden = false;
  }
})();

document.getElementById('shareBtn').addEventListener('click', async () => {
  try{
    if(navigator.share){
      await navigator.share({ title: document.title, url: location.href });
    } else {
      await navigator.clipboard.writeText(location.href);
      alert('Bağlantı panoya kopyalandı.');
    }
  }catch{}
});
