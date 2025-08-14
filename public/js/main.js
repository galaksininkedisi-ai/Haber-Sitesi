document.getElementById('year').textContent = new Date().getFullYear();

const container = document.getElementById('cards');
const empty = document.getElementById('empty');

(async ()=>{
  const posts = (await apiListPosts()).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  if(!posts.length){ empty.hidden = false; }
  for(const p of posts){
    const a = document.createElement('a');
    a.href = `article.html?id=${encodeURIComponent(p.id)}`;
    a.className = 'card';

    const cover = document.createElement('img');
    cover.className = 'cover';
    cover.alt = p.title || 'Kapak görseli';
    cover.loading = 'lazy';
    cover.src = p.cover || '';
    a.appendChild(cover);

    const h3 = document.createElement('h3');
    h3.textContent = p.title || 'Başlıksız';
    a.appendChild(h3);

    const meta = document.createElement('p');
    meta.className = 'meta';
    const mediaCount = (p.media || []).length;
    meta.textContent = new Date(p.createdAt).toLocaleString('tr-TR', { dateStyle:'medium', timeStyle:'short' }) + ` • ${mediaCount} medya`;
    a.appendChild(meta);

    const excerpt = document.createElement('p');
    excerpt.className = 'excerpt';
    const plain = (p.contentHTML || '').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
    excerpt.textContent = plain.length > 160 ? plain.slice(0,157)+'…' : plain;
    a.appendChild(excerpt);

    container.appendChild(a);
  }
})();

