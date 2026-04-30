(function() {
    // --- 1. THE NUCLEAR VIEWPORT & STATE ---
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover';

    const API = "https://jiosaavn-api-x10c.onrender.com/api";
    let queue = [];
    let currentIndex = -1;
    let favorites = JSON.parse(localStorage.getItem('tunify_favs')) || [];

    const encodeData = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    const decodeData = (str) => JSON.parse(decodeURIComponent(escape(atob(str))));

    // --- 2. PREMIUM CSS ---
    const style = document.createElement('style');
    style.textContent = `
        :root { --sp-green: #1DB954; --bg: #000; --glass: rgba(255, 255, 255, 0.1); --panel: #121212; }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body { width: 100%; height: 100%; background: #000; color: white; font-family: 'Segoe UI', Roboto, sans-serif; overflow: hidden; }
        #splash-screen { position: fixed; inset: 0; background: #000; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.5s; }
        #splash-logo { width: 80px; height: 80px; background: var(--sp-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-size: 2.5rem; }
        #auth-screen { position: fixed; inset: 0; background: #000; z-index: 5000; display: none; flex-direction: column; align-items: center; justify-content: center; padding: 30px; }
        #auth-screen.active { display: flex; }
        .login-btn { background: white; color: black; padding: 16px 24px; border-radius: 50px; font-weight: 700; display: flex; align-items: center; gap: 12px; margin-top: 40px; cursor: pointer; }
        #app-root { display: none; flex-direction: column; height: 100dvh; width: 100%; }
        #app-root.visible { display: flex; }
        header { padding: 50px 15px 10px; display: flex; align-items: center; justify-content: space-between; }
        .u-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: #333; }
        .u-avatar img { width: 100%; height: 100%; object-fit: cover; }
        main { flex: 1; overflow-y: auto; padding: 0 15px 200px; }
        .shelf { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px; }
        .item { min-width: 150px; }
        .item img { width: 100%; aspect-ratio: 1/1; border-radius: 8px; object-fit: cover; }
        #mini-player { position: fixed; bottom: 80px; left: 8px; right: 8px; height: 56px; background: #282828; border-radius: 6px; display: none; align-items: center; padding: 0 8px; z-index: 100; }
        #mini-player.show { display: flex; }
        nav { position: fixed; bottom: 0; left: 0; right: 0; height: 75px; background: #000; display: flex; justify-content: space-around; align-items: center; padding-bottom: 15px; }
        .nav-link.active { color: white; } .nav-link { color: #b3b3b3; display: flex; flex-direction: column; align-items: center; font-size: 0.6rem; }
    `;
    document.head.appendChild(style);

    // --- 3. HTML SKELETON ---
    document.getElementById('root').innerHTML = `
        <div id="splash-screen"><div id="splash-logo"><i class="fa-solid fa-music"></i></div></div>
        <div id="auth-screen">
            <h1 style="font-size:2rem; font-weight:900; color:white;">Tunify</h1>
            <div class="login-btn" onclick="Tunify.login()"><img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" style="width:20px;"> Continue with Google</div>
        </div>
        <div id="app-root">
            <header><div class="u-avatar" id="user-pfp"></div><span style="background:var(--sp-green); color:black; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:700;">Music</span></header>
            <main id="main-view"></main>
            <div id="mini-player">
                <img id="m-img" src="" style="width:40px; height:40px; border-radius:4px;"><div style="flex:1; margin-left:10px; overflow:hidden;"><div id="m-title" style="font-size:0.8rem; font-weight:700;"></div><div id="m-artist" style="font-size:0.7rem; color:#b3b3b3;"></div></div><i class="fa-solid fa-play" id="m-play-btn" style="padding:15px;"></i>
            </div>
            <nav>
                <div class="nav-link active" onclick="Tunify.tab('home', this)"><i class="fa-solid fa-house"></i><span>Home</span></div>
                <div class="nav-link" onclick="Tunify.tab('search', this)"><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></div>
                <div class="nav-link" onclick="Tunify.tab('favs', this)"><i class="fa-solid fa-lines-leaning"></i><span>Library</span></div>
            </nav>
        </div>
        <audio id="audio-engine"></audio>
    `;

    // --- 4. TUNIFY LOGIC ---
    window.Tunify = {
        login: () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).catch(e => alert("Login Error: " + e.message));
        },
        logout: () => firebase.auth().signOut().then(() => location.reload()),
        tab: (t, el) => {
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            if(t==='home') Tunify.loadHome();
        },
        loadHome: () => {
            document.getElementById('main-view').innerHTML = `<h2 style="margin:20px 0;">Trending</h2><div class="shelf" id="h1"></div>`;
            fetchShelf('Trending', 'h1');
        }
    };

    async function fetchShelf(q, id) {
        const r = await fetch(`${API}/search/songs?query=${encodeURIComponent(q)}`);
        const d = await r.json();
        if(d.success) {
            document.getElementById(id).innerHTML = d.data.results.map(s => `<div class="item"><img src="${s.image[2].url}"><p style="font-size:0.8rem; margin-top:5px;">${s.name}</p></div>`).join('');
        }
    }

    // --- 5. THE CRITICAL FIX ---
    firebase.initializeApp({ apiKey: "AIzaSyDWI8raVFZ4HEzxAUYGfY1vOfqHoPvQiD0", authDomain: "tunify-8592f.firebaseapp.com", projectId: "tunify-8592f" });

    // Ensure session is remembered even on refresh
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    firebase.auth().onAuthStateChanged(user => {
        const splash = document.getElementById('splash-screen');
        const auth = document.getElementById('auth-screen');
        const app = document.getElementById('app-root');

        if (user) {
            auth.classList.remove('active');
            app.classList.add('visible');
            document.getElementById('user-pfp').innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%;">`;
            Tunify.loadHome();
        } else {
            app.classList.remove('visible');
            auth.classList.add('active');
        }

        // DELAY splash hide to ensure "auth-screen" or "app-root" is fully rendered first
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 500);
        }, 1200);
    });

})();
