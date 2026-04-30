(function() {
    // --- 1. THE NUCLEAR VIEWPORT & STATE ---
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover';

    const API = "https://jiosaavn-api-x10c.onrender.com/api";
    let queue = [];
    let currentIndex = -1;
    let isShuffle = false;
    let repeatMode = 0; 
    let favorites = JSON.parse(localStorage.getItem('tunify_favs')) || [];
    const blocklist = ["hanuman", "aarti", "bhajan", "chalisa", "shlok"];

    const encodeData = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    const decodeData = (str) => JSON.parse(decodeURIComponent(escape(atob(str))));

    // --- 2. PREMIUM CSS (OLED DARK MODE & GLASSMORPHISM) ---
    const style = document.createElement('style');
    style.textContent = `
        :root { --sp-green: #1DB954; --bg: #000; --glass: rgba(255, 255, 255, 0.1); --panel: #121212; }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; outline: none; }
        
        html, body { width: 100%; height: 100%; background: #000; color: white; font-family: 'Segoe UI', Roboto, sans-serif; overflow: hidden; }

        /* Splash Screen */
        #splash-screen {
            position: fixed; inset: 0; background: #000; z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transition: opacity 0.6s ease, visibility 0.6s;
        }
        #splash-logo {
            width: 80px; height: 80px; background: var(--sp-green);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            color: #000; font-size: 2.5rem; animation: splashPulse 1.5s ease-out infinite;
        }
        @keyframes splashPulse {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.8; }
        }

        /* Profile Drawer System */
        #profile-drawer {
            position: fixed; top: 0; left: 0; bottom: 0; width: 85%; max-width: 320px;
            background: var(--panel); z-index: 6000; transform: translateX(-100%);
            transition: transform 0.4s cubic-bezier(0.3, 0, 0, 1);
            display: flex; flex-direction: column; box-shadow: 20px 0 50px rgba(0,0,0,0.8);
        }
        #profile-drawer.open { transform: translateX(0); }
        #drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 5999;
            display: none; backdrop-filter: blur(8px); opacity: 0; transition: opacity 0.3s;
        }
        #drawer-overlay.active { display: block; opacity: 1; }

        .drawer-header { padding: 50px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .drawer-user { display: flex; align-items: center; gap: 15px; }
        .drawer-user img { width: 55px; height: 55px; border-radius: 50%; border: 2px solid var(--glass); }
        
        .drawer-menu { flex: 1; overflow-y: auto; padding: 20px 0; }
        .menu-item { 
            padding: 16px 20px; display: flex; align-items: center; gap: 18px; 
            font-size: 0.9rem; font-weight: 600; cursor: pointer; color: #eee;
        }
        .menu-item:active { background: rgba(255,255,255,0.08); }
        .menu-item i { font-size: 1.2rem; width: 25px; color: #b3b3b3; text-align: center; }

        /* Auth Screen */
        #auth-screen {
            position: fixed; inset: 0; background: #000;
            z-index: 5000; display: none; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center;
        }
        #auth-screen.active { display: flex; }
        .login-btn {
            background: white; color: black; padding: 18px 32px; border-radius: 50px;
            font-weight: 800; display: flex; align-items: center; justify-content: center;
            gap: 12px; margin-top: 50px; width: 100%; max-width: 300px;
        }

        /* Core Layout */
        #app-root { display: none; flex-direction: column; height: 100dvh; width: 100%; }
        #app-root.visible { display: flex; }
        header { padding: 55px 15px 15px; display: flex; align-items: center; justify-content: space-between; }
        .u-avatar { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: #222; }
        .u-avatar img { width: 100%; height: 100%; object-fit: cover; }

        main { flex: 1; overflow-y: auto; padding: 0 15px 180px; scroll-behavior: smooth; }
        .section-title { font-size: 1.5rem; font-weight: 900; margin: 35px 0 15px; letter-spacing: -0.5px; }
        .shelf { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px; }
        .shelf::-webkit-scrollbar { display: none; }
        
        .item { min-width: 155px; width: 155px; }
        .item img { width: 100%; aspect-ratio: 1/1; border-radius: 12px; object-fit: cover; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        .item p { font-size: 0.85rem; font-weight: 700; margin-top: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Navigation & Players */
        nav { position: fixed; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(transparent, #000 40%); display: flex; justify-content: space-around; align-items: center; z-index: 200; padding-bottom: 10px; }
        .nav-link { color: #b3b3b3; display: flex; flex-direction: column; align-items: center; font-size: 0.65rem; gap: 6px; }
        .nav-link.active { color: white; }

        #mini-player { position: fixed; bottom: 85px; left: 10px; right: 10px; height: 60px; background: #282828; border-radius: 8px; display: none; align-items: center; padding: 0 10px; z-index: 150; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        #mini-player.show { display: flex; }

        #player-full { position: fixed; inset: 0; z-index: 7000; transform: translateY(100%); transition: transform 0.5s cubic-bezier(0.3, 0, 0, 1); background: #121212; display: flex; flex-direction: column; }
        #player-full.active { transform: translateY(0); }
        .heart-btn.liked { color: var(--sp-green) !important; }
    `;
    document.head.appendChild(style);

    // --- 3. HTML SKELETON ---
    const root = document.getElementById('root');
    root.innerHTML = `
        <div id="splash-screen">
            <div id="splash-logo"><i class="fa-solid fa-music"></i></div>
            <div style="margin-top:20px; font-weight:900; letter-spacing:3px; font-size:1rem;">TUNIFY</div>
        </div>

        <div id="drawer-overlay" onclick="Tunify.closeDrawer()"></div>
        <div id="profile-drawer">
            <div class="drawer-header">
                <div class="drawer-user">
                    <img id="dr-pfp" src="">
                    <div>
                        <div id="dr-name" style="font-weight:800; font-size:1.2rem;">User</div>
                        <div style="font-size:0.8rem; color:#b3b3b3;">View profile</div>
                    </div>
                </div>
            </div>
            <div class="drawer-menu">
                <div class="menu-item"><i class="fa-solid fa-plus"></i> Add account</div>
                <div class="menu-item"><i class="fa-solid fa-bolt"></i> What's new</div>
                <div class="menu-item"><i class="fa-solid fa-chart-simple"></i> Listening stats</div>
                <div class="menu-item"><i class="fa-solid fa-clock-rotate-left"></i> Recents</div>
                <div class="menu-item"><i class="fa-solid fa-bullhorn"></i> Your Updates</div>
                <div class="menu-item"><i class="fa-solid fa-gear"></i> Settings and privacy</div>
                <div class="menu-item" onclick="Tunify.logout()" style="margin-top:20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:25px;">
                    <i class="fa-solid fa-power-off" style="color:#ff4444;"></i> Log out
                </div>
            </div>
        </div>

        <div id="auth-screen">
            <i class="fa-solid fa-headphones" style="font-size:4.5rem; color:var(--sp-green); margin-bottom:25px;"></i>
            <h1 style="font-size:2.2rem; font-weight:900; line-height:1.1;">Millions of songs.<br>Free on Tunify.</h1>
            <div class="login-btn" onclick="Tunify.login()">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" style="width:22px;">
                Continue with Google
            </div>
        </div>

        <div id="app-root">
            <header>
                <div class="u-avatar" onclick="Tunify.openDrawer()" id="user-pfp"></div>
                <div id="header-chip" style="background:var(--sp-green); color:black; padding:5px 14px; border-radius:20px; font-size:0.75rem; font-weight:800;">Music</div>
            </header>
            <main id="main-view"></main>
            <div id="mini-player">
                <img id="m-img" src="" style="width:44px; height:44px; border-radius:4px;">
                <div style="flex:1; margin-left:12px; overflow:hidden;">
                    <div id="m-title" style="font-size:0.85rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>
                    <div id="m-artist" style="font-size:0.75rem; color:#b3b3b3;"></div>
                </div>
                <i class="fa-solid fa-play" id="m-play-btn" style="font-size:1.3rem; padding:15px;"></i>
            </div>
            <nav>
                <div class="nav-link active" onclick="Tunify.tab('home', this)"><i class="fa-solid fa-house"></i><span>Home</span></div>
                <div class="nav-link" onclick="Tunify.tab('search', this)"><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></div>
                <div class="nav-link" onclick="Tunify.tab('favs', this)"><i class="fa-solid fa-lines-leaning"></i><span>Library</span></div>
            </nav>
        </div>

        <div id="player-full">
            <div style="padding: 50px 25px; flex:1; display:flex; flex-direction:column;">
                <i class="fa-solid fa-chevron-down" onclick="Tunify.closePlayer()" style="font-size:1.5rem; margin-bottom:50px;"></i>
                <img id="f-img" src="" style="width:100%; aspect-ratio:1/1; border-radius:12px; box-shadow: 0 30px 60px rgba(0,0,0,0.9);">
                <div style="margin-top:45px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="overflow:hidden;"><h2 id="f-title" style="font-size:1.6rem; font-weight:900;"></h2><p id="f-artist" style="color:#b3b3b3; font-size:1.1rem;"></p></div>
                    <i class="fa-solid fa-heart heart-btn" id="f-fav-btn" style="font-size:1.8rem;" onclick="Tunify.toggleFav()"></i>
                </div>
                <div class="progress-bar" id="p-bar"><div class="progress-fill" id="p-fill"></div></div>
                <div style="display:flex; justify-content:space-around; align-items:center; margin-top:30px;">
                    <i class="fa-solid fa-backward-step" onclick="Tunify.prev()" style="font-size:2.2rem;"></i>
                    <div onclick="Tunify.toggle()" style="width:75px; height:75px; background:white; color:black; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem;"><i class="fa-solid fa-play" id="f-play-btn"></i></div>
                    <i class="fa-solid fa-forward-step" onclick="Tunify.next()" style="font-size:2.2rem;"></i>
                </div>
            </div>
        </div>
        <audio id="audio-engine"></audio>
    `;

    const audio = document.getElementById('audio-engine');
    const mainView = document.getElementById('main-view');

    // --- 4. TUNIFY LOGIC ---
    window.Tunify = {
        openDrawer: () => {
            document.getElementById('profile-drawer').classList.add('open');
            document.getElementById('drawer-overlay').classList.add('active');
        },
        closeDrawer: () => {
            document.getElementById('profile-drawer').classList.remove('open');
            document.getElementById('drawer-overlay').classList.remove('active');
        },
        login: () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithRedirect(provider); // Redirect to prevent blank screen glitch
        },
        logout: () => { Tunify.closeDrawer(); firebase.auth().signOut(); },
        tab: (t, el) => {
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            if(t==='home') Tunify.loadHome();
            if(t==='search') Tunify.loadSearch();
            if(t==='favs') Tunify.loadFavs();
        },
        loadHome: () => {
            mainView.innerHTML = `<h2 class="section-title">Trending Now</h2><div class="shelf" id="h1"></div><h2 class="section-title">Fresh Hits</h2><div class="shelf" id="h2"></div>`;
            fetchShelf('Trending', 'h1'); fetchShelf('Top Hits', 'h2');
        },
        loadSearch: () => {
            mainView.innerHTML = `<h2 class="section-title">Search</h2><input type="search" id="s-in" style="width:100%; padding:18px; border-radius:12px; background:#222; border:none; color:white; margin-bottom:25px; font-weight:600;" placeholder="What do you want to listen to?"><div id="s-res" style="display:flex; flex-wrap:wrap; gap:12px;"></div>`;
            document.getElementById('s-in').oninput = (e) => { if(e.target.value.length > 2) fetchShelf(e.target.value, 's-res', true); };
        },
        loadFavs: () => {
            mainView.innerHTML = `<h2 class="section-title">Your Library</h2><div id="fav-res" style="display:flex; flex-wrap:wrap; gap:12px;"></div>`;
            if(favorites.length === 0) document.getElementById('fav-res').innerHTML = `<p style="color:#b3b3b3; width:100%; text-align:center; padding-top:40px;">No liked songs yet.</p>`;
            else renderList(favorites, 'fav-res', true);
        },
        play: (encSong, encList) => {
            const song = decodeData(encSong);
            queue = decodeData(encList);
            currentIndex = queue.findIndex(s => s.id === song.id);
            audio.src = song.downloadUrl[4].url;
            audio.play().catch(e => console.log("Playback failed", e));
            updateUI(song);
            document.getElementById('mini-player').classList.add('show');
        },
        toggle: () => audio.paused ? audio.play() : audio.pause(),
        next: () => {
            currentIndex = (currentIndex + 1) % queue.length;
            const s = queue[currentIndex]; updateUI(s); audio.src = s.downloadUrl[4].url; audio.play();
        },
        prev: () => {
            currentIndex = (currentIndex - 1 + queue.length) % queue.length;
            const s = queue[currentIndex]; updateUI(s); audio.src = s.downloadUrl[4].url; audio.play();
        },
        toggleFav: () => {
            const s = queue[currentIndex];
            const idx = favorites.findIndex(f => f.id === s.id);
            if(idx > -1) favorites.splice(idx, 1); else favorites.push(s);
            localStorage.setItem('tunify_favs', JSON.stringify(favorites));
            updateFavState(s.id);
        },
        closePlayer: () => document.getElementById('player-full').classList.remove('active')
    };

    async function fetchShelf(q, id, grid = false) {
        try {
            const r = await fetch(`${API}/search/songs?query=${encodeURIComponent(q)}`);
            const d = await r.json();
            if(d.success) renderList(d.data.results, id, grid);
        } catch(e) { console.error("API error", e); }
    }

    function renderList(list, id, grid) {
        const cont = document.getElementById(id); if(!cont) return;
        const listEnc = encodeData(list);
        cont.innerHTML = list.map(s => `<div class="item" style="${grid ? 'width:47%; margin-bottom:15px;' : ''}" onclick="Tunify.play('${encodeData(s)}', '${listEnc}')"><img src="${s.image[2].url}"><p>${s.name}</p></div>`).join('');
    }

    function updateUI(s) {
        document.getElementById('m-img').src = s.image[0].url;
        document.getElementById('m-title').innerText = s.name;
        document.getElementById('m-artist').innerText = s.primaryArtists;
        document.getElementById('f-img').src = s.image[2].url;
        document.getElementById('f-title').innerText = s.name;
        document.getElementById('f-artist').innerText = s.primaryArtists;
        updateFavState(s.id);
    }

    function updateFavState(id) {
        const isLiked = favorites.some(f => f.id === id);
        document.getElementById('f-fav-btn').className = isLiked ? 'fa-solid fa-heart heart-btn liked' : 'fa-solid fa-heart heart-btn';
    }

    audio.ontimeupdate = () => {
        const p = (audio.currentTime / audio.duration) * 100 || 0;
        document.getElementById('p-fill').style.width = p + '%';
    };
    audio.onplay = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-pause'; document.getElementById('m-play-btn').className = 'fa-solid fa-pause'; };
    audio.onpause = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-play'; document.getElementById('m-play-btn').className = 'fa-solid fa-play'; };

    document.getElementById('mini-player').onclick = (e) => { if(e.target.id !== 'm-play-btn') document.getElementById('player-full').classList.add('active'); };
    document.getElementById('m-play-btn').onclick = (e) => { e.stopPropagation(); Tunify.toggle(); };

    // --- 5. FIREBASE AUTH & BOOTSTRAP ---
    firebase.initializeApp({ apiKey: "AIzaSyDWI8raVFZ4HEzxAUYGfY1vOfqHoPvQiD0", authDomain: "tunify-8592f.firebaseapp.com", projectId: "tunify-8592f" });
    
    firebase.auth().onAuthStateChanged(async (user) => {
        const splash = document.getElementById('splash-screen');
        const auth = document.getElementById('auth-screen');
        const app = document.getElementById('app-root');

        // Capture redirect result to prevent blank screen flicker
        try { await firebase.auth().getRedirectResult(); } catch(e) { console.error(e); }

        if (user) {
            auth.classList.remove('active');
            app.classList.add('visible');
            document.getElementById('user-pfp').innerHTML = `<img src="${user.photoURL}">`;
            document.getElementById('dr-pfp').src = user.photoURL;
            document.getElementById('dr-name').innerText = user.displayName;
            Tunify.loadHome();
        } else {
            app.classList.remove('visible');
            auth.classList.add('active');
        }

        // Smooth transition from Splash
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.visibility = 'hidden', 600);
        }, 800);
    });

})();
