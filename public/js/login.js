// public/js/login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // ?username=... ile sayfanın yenilenmesini engeller

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Giriş başarısız');

    localStorage.setItem('token', data.token);
    location.href = 'admin.html';
  } catch (err) {
    const el = document.getElementById('err');
    el.textContent = err.message;
    el.hidden = false;
  }
});
