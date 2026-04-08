import express, { Request, Response } from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', function(req: Request, res: Response) {
  const html = `
    <!DOCTYPE html>
    <html><body>
    <h1>Path: /</h1>
    <h2><a href=/login>/login</a></h2>
    <h2><a href=/images>/images</a></h2>
    <h2><a href=/uploads>/uploads</a></h2>
    <h3>Login first on /login</h3>
    </body></html>
  `;

  return res.type('.html').send(html);
});

router.get('/login', function(req: Request, res: Response) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Login</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .card { width: min(500px, 95vw); border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
        input { width: 100%; padding: 8px; margin: 8px 0; box-sizing: border-box; }
        button { padding: 10px 14px; margin-right: 6px; }
        pre { background: #f6f8fa; padding: 10px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Path: /login</h1>
      <h2><a href="/">HOME</a></h2>
      <div class="card">
        <label>Username</label>
        <input id="username" value="user1" />
        <label>Password</label>
        <input id="password" type="password" value="password1" />
        <button onclick="login()">Login</button>
        <button onclick="refreshToken()">Refresh token</button>
        <button onclick="logout()">Logout</button>
        <h3>Access token</h3>
        <pre id="token">(none)</pre>
        <p><a id="my-images-link" href="#" style="display:none;font-size:16px;">My images</a></p>
      </div>
      <script>
        function setToken(value) {
          localStorage.setItem('access_token', value || '');
          document.getElementById('token').textContent = value || '(none)';
        }

        async function login() {
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const body = await response.json();
          if (!response.ok) {
            alert(body.message || 'Login failed');
            return;
          }
          localStorage.setItem('user_id', String(body.userId || ''));
          setToken(body.token || '');
          updateMyImagesLink();
        }

        function updateMyImagesLink() {
          const userId = localStorage.getItem('user_id') || '';
          const link = document.getElementById('my-images-link');
          if (!link) return;
          if (userId) {
            link.href = '/images/' + userId + '/html';
            link.textContent = 'My images (user ' + userId + ')';
            link.style.display = '';
          } else {
            link.style.display = 'none';
          }
        }

        async function refreshToken() {
          const response = await fetch('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          const body = await response.json();
          if (!response.ok) {
            alert(body.message || 'Refresh failed');
            return;
          }
          setToken(body.token || '');
          alert('Token refreshed');
        }

        async function logout() {
          const token = localStorage.getItem('access_token') || '';
          await fetch('/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: 'Bearer ' + token } : {})
            },
            body: JSON.stringify({})
          });
          setToken('');
          localStorage.removeItem('user_id');
          updateMyImagesLink();
          alert('Logged out');
        }

        setToken(localStorage.getItem('access_token') || '');
        updateMyImagesLink();
      </script>
    </body>
    </html>
  `;

  return res.type('.html').send(html);
});

export = router;
