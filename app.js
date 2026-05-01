(function() {
    // --- 1. THE NUCLEAR VIEWPORT & STATE ---
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover';

    const API = "https://jiosaavn-api-x10c.onrender.com/api";
    const CLIENT_ID = "225207566367-mnpl8thi10bvr3md5u29berh0e9unbi8.apps.googleusercontent.com";
    
    let queue = [];
    let currentIndex = -1;
    let favorites = JSON.parse(localStorage.getItem('tunify_favs')) || [];

    // --- UTILS ---
    const encodeData = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    const decodeData = (str) => JSON.parse(decodeURIComponent(escape(atob(str))));

    // --- 2. PREMIUM CSS ---
    const style = document.createElement('style');
    style.textContent = `
        :root { --sp-green: #1DB954; --bg: #000; --glass: rgba(255, 255, 255, 0.1); --panel: #121212; }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body { width: 100%; height: 100%; background: #000; color: white; font-family: 'Segoe UI', Roboto, sans-serif; overflow: hidden; }

        #profile-drawer {
            position: fixed; top: 0; left: 0; bottom: 0; width: 85%; max-width: 320px;
            background: var(--panel); z-index: 6000; transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; flex-direction: column; box-shadow: 20px 0 50px rgba(0,0,0,0.5);
        }
        #profile-drawer.open { transform: translateX(0); }
        #drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 5999;
            display: none; backdrop-filter: blur(4px);
        }
        #drawer-overlay.active { display: block; }
        .drawer-header { padding: 40px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .drawer-user { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
        .drawer-user img { width: 50px; height: 50px; border-radius: 50%; }
        .drawer-menu { flex: 1; overflow-y: auto; padding: 20px 0; }
        .menu-item { padding: 15px 20px; display: flex; align-items: center; gap: 15px; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .menu-item:active { background: rgba(255,255,255,0.05); }
        .menu-item i { font-size: 1.2rem; width: 25px; color: #b3b3b3; }

        #splash-screen { position: fixed; inset: 0; background: #000; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.6s ease, visibility 0.6s; }
        #splash-logo { width: 80px; height: 80px; background: var(--sp-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-size: 2.5rem; animation: splashPulse 1.5s ease-out infinite; }
        @keyframes splashPulse { 0% { transform: scale(0.9); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.8; } }

        #auth-screen { position: fixed; inset: 0; background: linear-gradient(135deg, #121212 0%, #000 100%); z-index: 5000; display: none; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; }
        #auth-screen.active { display: flex; }
        .login-card { background: white; color: black; padding: 40px 20px; border-radius: 24px; text-align: center; width: 90%; max-width: 340px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        #g-btn { width: 100%; margin-top: 10px; display: flex; justify-content: center; }

        #app-root { display: none; flex-direction: column; height: 100dvh; width: 100%; background: #000; }
        #app-root.visible { display: flex; }
        header { padding: 50px 15px 10px; display: flex; align-items: center; justify-content: space-between; }
        .u-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: #333; cursor: pointer; }
        .u-avatar img { width: 100%; height: 100%; object-fit: cover; }
        main { flex: 1; overflow-y: auto; padding: 0 15px 200px; }
        .section-title { font-size: 1.4rem; font-weight: 900; margin: 30px 0 15px; }
        .shelf { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .shelf::-webkit-scrollbar { display: none; }
        .item { min-width: 150px; width: 150px; cursor: pointer; }
        .item img { width: 100%; aspect-ratio: 1/1; border-radius: 8px; object-fit: cover; }
        .item p { font-size: 0.85rem; font-weight: 700; margin-top: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        #mini-player { position: fixed; bottom: 80px; left: 8px; right: 8px; height: 56px; background: #282828; border-radius: 6px; display: none; align-items: center; padding: 0 8px; z-index: 100; cursor: pointer; }
        #mini-player.show { display: flex; }
        nav { position: fixed; bottom: 0; left: 0; right: 0; height: 75px; background: #000; display: flex; justify-content: space-around; align-items: center; z-index: 200; padding-bottom: 15px; }
        .nav-link { color: #b3b3b3; display: flex; flex-direction: column; align-items: center; font-size: 0.6rem; gap: 5px; cursor: pointer; }
        .nav-link.active { color: white; }

        #player-full { position: fixed; inset: 0; z-index: 7000; transform: translateY(100%); transition: transform 0.4s; background: #121212; display: flex; flex-direction: column; }
        #player-full.active { transform: translateY(0); }
        .progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; position: relative; margin: 25px 0; }
        .progress-fill { height: 100%; background: #fff; border-radius: 2px; width: 0%; }
        .heart-btn.liked { color: var(--sp-green) !important; }
    `;
    document.head.appendChild(style);

    // --- 3. HTML SKELETON ---
    const root = document.getElementById('root');
    root.innerHTML = `
        <div id="splash-screen">
            <div id="splash-logo"><i class="fa-solid fa-music"></i></div>
            <div style="margin-top:20px; font-weight:800; letter-spacing:2px; font-size:0.9rem;">TUNIFY</div>
        </div>
        <div id="drawer-overlay" onclick="Tunify.closeDrawer()"></div>
        <div id="profile-drawer">
            <div class="drawer-header">
                <div class="drawer-user">
                    <img id="dr-pfp" src="">
                    <div>
                        <div id="dr-name" style="font-weight:700; font-size:1.1rem;">User</div>
                        <div style="font-size:0.75rem; color:#b3b3b3;">View profile</div>
                    </div>
                </div>
            </div>
            <div class="drawer-menu">
                <div class="menu-item"><i class="fa-solid fa-plus"></i> Add account</div>
                <div class="menu-item"><i class="fa-solid fa-gear"></i> Settings</div>
                <div class="menu-item" onclick="Tunify.logout()" style="margin-top:20px; color:#ff4444;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Log out
                </div>
            </div>
        </div>
        <div id="auth-screen">
            <div class="login-card">
                <i class="fa-solid fa-bolt" style="font-size: 3rem; color: var(--sp-green); margin-bottom: 15px;"></i>
                <h2>Tunify</h2>
                <p style="color:#666; margin-bottom:20px; font-size:0.9rem;">Sign in to start listening</p>
                <div id="g-btn"></div>
            </div>
        </div>
        <div id="app-root">
            <header>
                <div class="u-avatar" onclick="Tunify.openDrawer()" id="user-pfp"></div>
                <span style="background:var(--sp-green); color:black; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:700;">Music</span>
            </header>
            <main id="main-view"></main>
            <div id="mini-player">
                <img id="m-img" src="" style="width:40px; height:40px; border-radius:4px;">
                <div style="flex:1; margin-left:10px; overflow:hidden;">
                    <div id="m-title" style="font-size:0.8rem; font-weight:700; white-space:nowrap;"></div>
                    <div id="m-artist" style="font-size:0.7rem; color:#b3b3b3;"></div>
                </div>
                <i class="fa-solid fa-play" id="m-play-btn" style="font-size:1.2rem; padding:15px; cursor:pointer;"></i>
            </div>
            <nav>
                <div class="nav-link active" onclick="Tunify.tab('home', this)"><i class="fa-solid fa-house"></i><span>Home</span></div>
                <div class="nav-link" onclick="Tunify.tab('search', this)"><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></div>
                <div class="nav-link" onclick="Tunify.tab('favs', this)"><i class="fa-solid fa-lines-leaning"></i><span>Library</span></div>
            </nav>
        </div>
        <div id="player-full">
            <div style="padding: 40px 25px; flex:1; display:flex; flex-direction:column;">
                <i class="fa-solid fa-chevron-down" onclick="Tunify.closePlayer()" style="font-size:1.4rem; margin-bottom:40px; cursor:pointer;"></i>
                <img id="f-img" src="" style="width:100%; aspect-ratio:1/1; border-radius:8px;">
                <div style="margin-top:40px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="overflow:hidden;"><h2 id="f-title" style="font-size:1.5rem;"></h2><p id="f-artist" style="color:#b3b3b3;"></p></div>
                    <i class="fa-solid fa-heart heart-btn" id="f-fav-btn" onclick="Tunify.toggleFav()"></i>
                </div>
                <div class="progress-bar" id="p-bar"><div class="progress-fill" id="p-fill"></div></div>
                <div style="display:flex; justify-content:space-around; align-items:center;">
                    <i class="fa-solid fa-backward-step" onclick="Tunify.prev()" style="font-size:2rem;"></i>
                    <div onclick="Tunify.toggle()" style="width:65px; height:65px; background:white; color:black; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.8rem;"><i class="fa-solid fa-play" id="f-play-btn"></i></div>
                    <i class="fa-solid fa-forward-step" onclick="Tunify.next()" style="font-size:2rem;"></i>
                </div>
            </div>
        </div>
        <audio id="audio-engine"></audio>
    `;

    const audio = document.getElementById('audio-engine');
    const mainView = document.getElementById('main-view');

    // --- 4. TUNIFY LOGIC ---
    window.Tunify = {
        openDrawer: () => { document.getElementById('profile-drawer').classList.add('open'); document.getElementById('drawer-overlay').classList.add('active'); },
        closeDrawer: () => { document.getElementById('profile-drawer').classList.remove('open'); document.getElementById('drawer-overlay').classList.remove('active'); },
        logout: () => { if(confirm("Logout?")) { localStorage.removeItem('tunify_user'); location.reload(); } },
        tab: (t, el) => {
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            if(t==='home') Tunify.loadHome();
            if(t==='search') Tunify.loadSearch();
            if(t==='favs') Tunify.loadFavs();
        },
        loadHome: () => { mainView.innerHTML = `<h2 class="section-title">Trending</h2><div class="shelf" id="h1"></div><h2 class="section-title">Fresh Hits</h2><div class="shelf" id="h2"></div>`; fetchShelf('Trending', 'h1'); fetchShelf('Top Hits', 'h2'); },
        loadSearch: () => { mainView.innerHTML = `<h2 class="section-title">Search</h2><input type="search" id="s-in" style="width:100%; padding:15px; border-radius:8px; background:#282828; border:none; color:white; margin-bottom:20px;" placeholder="What do you want to listen to?"><div id="s-res" style="display:flex; flex-wrap:wrap; gap:10px;"></div>`; document.getElementById('s-in').oninput = (e) => { if(e.target.value.length > 2) fetchShelf(e.target.value, 's-res', true); }; },
        loadFavs: () => { mainView.innerHTML = `<h2 class="section-title">Library</h2><div id="fav-res" style="display:flex; flex-wrap:wrap; gap:10px;"></div>`; if(favorites.length === 0) document.getElementById('fav-res').innerHTML = `<p style="color:#b3b3b3;">Nothing here yet.</p>`; else renderList(favorites, 'fav-res', true); },
        play: (encSong, encList) => {
            const song = decodeData(encSong);
            queue = decodeData(encList);
            currentIndex = queue.findIndex(s => s.id === song.id);
            audio.src = song.downloadUrl[4].url; audio.play(); updateUI(song);
            document.getElementById('mini-player').classList.add('show');
        },
        toggle: () => audio.paused ? audio.play() : audio.pause(),
        next: () => { currentIndex = (currentIndex + 1) % queue.length; const s = queue[currentIndex]; updateUI(s); audio.src = s.downloadUrl[4].url; audio.play(); },
        prev: () => { currentIndex = (currentIndex - 1 + queue.length) % queue.length; const s = queue[currentIndex]; updateUI(s); audio.src = s.downloadUrl[4].url; audio.play(); },
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
        const r = await fetch(`${API}/search/songs?query=${encodeURIComponent(q)}`);
        const d = await r.json();
        if(d.success) renderList(d.data.results, id, grid);
    }

    function renderList(list, id, grid) {
        const cont = document.getElementById(id); if(!cont) return;
        const listEnc = encodeData(list);
        cont.innerHTML = list.map(s => `<div class="item" style="${grid ? 'width:46%;' : ''}" onclick="Tunify.play('${encodeData(s)}', '${listEnc}')"><img src="${s.image[2].url}"><p>${s.name}</p></div>`).join('');
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

    audio.ontimeupdate = () => { document.getElementById('p-fill').style.width = ((audio.currentTime / audio.duration) * 100 || 0) + '%'; };
    audio.onplay = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-pause'; document.getElementById('m-play-btn').className = 'fa-solid fa-pause'; };
    audio.onpause = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-play'; document.getElementById('m-play-btn').className = 'fa-solid fa-play'; };

    document.getElementById('mini-player').onclick = (e) => { if(e.target.id !== 'm-play-btn') document.getElementById('player-full').classList.add('active'); };
    document.getElementById('m-play-btn').onclick = (e) => { e.stopPropagation(); Tunify.toggle(); };

    // --- 5. GOOGLE AUTH & STARTUP ---
    window.onGoogleResponse = (res) => {
        const payload = JSON.parse(atob(res.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const user = { name: payload.name, photo: payload.picture, active: true };
        localStorage.setItem('tunify_user', JSON.stringify(user));
        startApp(user);
    };

    function startApp(user) {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('app-root').classList.add('visible');
        document.getElementById('user-pfp').innerHTML = `<img src="${user.photo}">`;
        document.getElementById('dr-pfp').src = user.photo;
        document.getElementById('dr-name').innerText = user.name;
        Tunify.loadHome();
    }

    window.onload = () => {
        const splash = document.getElementById('splash-screen');
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.visibility = 'hidden';
                const saved = JSON.parse(localStorage.getItem('tunify_user'));
                if (saved && saved.active) {
                    startApp(saved);
                } else {
                    document.getElementById('auth-screen').classList.add('active');
                    const s = document.createElement('script');
                    s.src = "https://accounts.google.com/gsi/client";
                    s.async = true; s.defer = true;
                    s.onload = () => {
                        // The Fix: Enhanced initialization to prevent AbortError
                        google.accounts.id.initialize({ 
                            client_id: CLIENT_ID, 
                            callback: window.onGoogleResponse,
                            auto_select: false, // Disables automatic native prompt
                            use_fedcm_for_prompt: false // Explicitly bypass FedCM
                        });
                        
                        google.accounts.id.renderButton(
                            document.getElementById("g-btn"),
                            { theme: "outline", size: "large", width: "250", shape: "pill" }
                        );

                        // Optional: Wrap prompt in a slight timeout or remove it if rendering the button is enough
                        // google.accounts.id.prompt(); 
                    };
                    document.head.appendChild(s);
                }
            }, 600);
        }, 1500);
    };
})();
                                                                                                                                                                                                                                                                                                                                                                                                                     
