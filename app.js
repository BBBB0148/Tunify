(function() {
    // --- 1. THE NUCLEAR VIEWPORT & STATE ---
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover';

    document.title = "Tunify";

    const API = "https://jiosaavn-api-x10c.onrender.com/api";
    const CLIENT_ID = "225207566367-mnpl8thi10bvr3md5u29berh0e9unbi8.apps.googleusercontent.com";
    
    let queue = [];
    let currentIndex = -1;
    let favorites = JSON.parse(localStorage.getItem('tunify_favs')) || [];

    const BLOCKED_KEYWORDS = ["hanuman", "aarti", "hindu", "bhajan", "mantra"];
    const filterResults = (list) => {
        return list.filter(item => {
            const content = `${item.name} ${item.primaryArtists}`.toLowerCase();
            return !BLOCKED_KEYWORDS.some(word => content.includes(word));
        });
    };

    const encodeData = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    const decodeData = (str) => JSON.parse(decodeURIComponent(escape(atob(str))));

    // --- 2. ENHANCED PREMIUM CSS ---
    const style = document.createElement('style');
    style.textContent = `
        :root { 
            --sp-green: #1DB954; 
            --bg: #050505; 
            --glass: rgba(255, 255, 255, 0.08); 
            --panel: #121212;
            --text-main: #FFFFFF;
            --text-dim: #b3b3b3;
            --dynamic-bg: #1e1e1e;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body { width: 100%; height: 100%; background: var(--bg); color: white; font-family: 'Inter', -apple-system, system-ui, sans-serif; overflow: hidden; }

        #profile-drawer {
            position: fixed; top: 0; left: 0; bottom: 0; width: 80%; max-width: 300px;
            background: #121212; z-index: 6000; transform: translateX(-100%);
            transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
            display: flex; flex-direction: column; padding: 40px 20px;
        }
        #profile-drawer.open { transform: translateX(0); box-shadow: 20px 0 80px rgba(0,0,0,0.8); }
        #drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 5999;
            display: none; backdrop-filter: blur(8px); transition: opacity 0.3s;
        }
        #drawer-overlay.active { display: block; }

        .drawer-header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .drawer-user { display: flex; align-items: center; gap: 15px; }
        #dr-pfp { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; background: #282828; }
        .drawer-menu { flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .menu-item { 
            padding: 12px 15px; border-radius: 8px; font-size: 0.95rem; font-weight: 600; 
            display: flex; align-items: center; gap: 15px; color: var(--text-main); transition: background 0.2s;
        }
        .menu-item i { width: 20px; font-size: 1.1rem; color: var(--text-dim); }
        .menu-item:active { background: rgba(255,255,255,0.1); }

        #splash-screen { position: fixed; inset: 0; background: #000; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.8s ease; }
        #splash-logo { width: 90px; height: 90px; background: var(--sp-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-size: 2.8rem; box-shadow: 0 0 30px rgba(29, 185, 84, 0.4); }
        
        #app-root { display: none; flex-direction: column; height: 100dvh; width: 100%; background: var(--bg); }
        #app-root.visible { display: flex; }
        
        header { padding: 45px 20px 15px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent); }
        .u-avatar { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.1); cursor: pointer; overflow: hidden; }
        .u-avatar img { width: 100%; height: 100%; object-fit: cover; }

        main { flex: 1; overflow-y: auto; padding: 0 20px 220px; scroll-behavior: smooth; }
        .section-title { font-size: 1.5rem; font-weight: 800; margin: 35px 0 18px; letter-spacing: -0.5px; }
        
        .shelf { display: flex; gap: 18px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .shelf::-webkit-scrollbar { display: none; }
        .item { min-width: 155px; width: 155px; cursor: pointer; transition: transform 0.3s; }
        .item:active { transform: scale(0.96); }
        .item img { width: 100%; aspect-ratio: 1/1; border-radius: 12px; object-fit: cover; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        .item p { font-size: 0.9rem; font-weight: 600; margin-top: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); }

        #mini-player { 
            position: fixed; bottom: 100px; left: 10px; right: 10px; height: 64px; 
            background: rgba(40, 40, 40, 0.75); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; display: none; align-items: center; padding: 0 12px; z-index: 100; 
        }
        #mini-player.show { display: flex; }

        nav { position: fixed; bottom: 0; left: 0; right: 0; height: 85px; background: rgba(0,0,0,0.9); display: flex; justify-content: space-around; align-items: center; z-index: 200; border-top: 1px solid rgba(255,255,255,0.05); }
        .nav-link { color: var(--text-dim); display: flex; flex-direction: column; align-items: center; font-size: 0.65rem; font-weight: 500; gap: 6px; }
        .nav-link.active { color: white; }

        #player-full { 
            position: fixed; inset: 0; z-index: 7000; transform: translateY(100%); 
            transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), background 0.8s ease; 
            background: linear-gradient(180deg, var(--dynamic-bg) 0%, #000000 100%); 
            display: flex; flex-direction: column; 
        }
        #player-full.active { transform: translateY(0); }
        .player-content { padding: 50px 30px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
        #f-img { width: 100%; aspect-ratio: 1/1; border-radius: 15px; box-shadow: 0 20px 60px rgba(0,0,0,0.7); object-fit: cover; }
        
        .progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; position: relative; margin: 35px 0; }
        .progress-fill { height: 100%; background: #fff; width: 0%; border-radius: 10px; }
        .heart-btn { font-size: 1.5rem; color: var(--text-dim); transition: 0.3s; }
        .heart-btn.liked { color: var(--sp-green); }
    `;
    document.head.appendChild(style);

    // --- 3. HTML SKELETON ---
    const root = document.getElementById('root');
    root.innerHTML = `
        <div id="splash-screen">
            <div id="splash-logo"><i class="fa-solid fa-music"></i></div>
            <div style="margin-top:20px; font-weight:800; letter-spacing:3px; font-size:0.8rem; opacity:0.7;">TUNIFY</div>
        </div>
        <canvas id="color-canvas" style="display:none;"></canvas>
        <div id="drawer-overlay" onclick="Tunify.closeDrawer()"></div>
        <div id="profile-drawer">
            <div class="drawer-header">
                <div class="drawer-user">
                    <img id="dr-pfp" src="">
                    <div>
                        <div id="dr-name" style="font-weight:700; font-size:1.1rem;">User</div>
                        <div style="font-size:0.75rem; color:var(--sp-green); font-weight:700;">PREMIUM ACCOUNT</div>
                    </div>
                </div>
            </div>
            <div class="drawer-menu">
                <div class="menu-item"><i class="fa-solid fa-user"></i> Profile</div>
                <div class="menu-item"><i class="fa-solid fa-heart"></i> Liked Songs</div>
                <div class="menu-item"><i class="fa-solid fa-gear"></i> Settings</div>
                <div class="menu-item" onclick="Tunify.logout()" style="margin-top:auto; color:#ff5555;">
                    <i class="fa-solid fa-arrow-right-from-bracket" style="color:#ff5555;"></i> Sign out
                </div>
            </div>
        </div>
        <div id="auth-screen" style="display:none; position:fixed; inset:0; background:#000; z-index:5000; align-items:center; justify-content:center; flex-direction:column; padding:30px;">
            <i class="fa-solid fa-music" style="font-size:4rem; color:var(--sp-green); margin-bottom:20px;"></i>
            <h1 style="margin-bottom:10px;">Millions of songs.</h1>
            <div id="g-btn"></div>
        </div>
        <div id="app-root">
            <header>
                <div class="u-avatar" onclick="Tunify.openDrawer()" id="user-pfp"></div>
                <div style="font-weight:800; letter-spacing:1px; font-size:0.9rem;">HOME</div>
                <i class="fa-solid fa-clock-rotate-left" style="font-size:1.2rem; color:var(--text-dim);"></i>
            </header>
            <main id="main-view"></main>
            <div id="mini-player">
                <img id="m-img" src="" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">
                <div style="flex:1; margin-left:12px; overflow:hidden;">
                    <div id="m-title" style="font-size:0.85rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>
                    <div id="m-artist" style="font-size:0.75rem; color:var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>
                </div>
                <i class="fa-solid fa-play" id="m-play-btn" style="font-size:1.3rem; padding:10px;"></i>
            </div>
            <nav>
                <div class="nav-link active" onclick="Tunify.tab('home', this)"><i class="fa-solid fa-house"></i><span>Home</span></div>
                <div class="nav-link" onclick="Tunify.tab('search', this)"><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></div>
                <div class="nav-link" onclick="Tunify.tab('favs', this)"><i class="fa-solid fa-compact-disc"></i><span>Library</span></div>
            </nav>
        </div>
        <div id="player-full">
            <div class="player-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
                    <i class="fa-solid fa-chevron-down" onclick="Tunify.closePlayer()" style="font-size:1.5rem;"></i>
                    <div style="font-size:0.7rem; font-weight:800; letter-spacing:2px; opacity:0.8;">NOW PLAYING</div>
                    <i class="fa-solid fa-ellipsis-vertical" style="font-size:1.2rem;"></i>
                </div>
                <img id="f-img" src="" crossorigin="anonymous">
                <div style="margin-top:50px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <div style="overflow:hidden; flex:1; margin-right:20px;">
                        <h2 id="f-title" style="font-size:1.6rem; font-weight:800; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></h2>
                        <p id="f-artist" style="color:var(--text-dim); font-size:1rem; font-weight:500;"></p>
                    </div>
                    <i class="fa-solid fa-heart heart-btn" id="f-fav-btn" onclick="Tunify.toggleFav()"></i>
                </div>
                <div class="progress-bar" id="p-bar"><div class="progress-fill" id="p-fill"></div></div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <i class="fa-solid fa-shuffle" style="color:var(--text-dim);"></i>
                    <div style="display:flex; align-items:center; gap:35px;">
                        <i class="fa-solid fa-backward-step" onclick="Tunify.prev()" style="font-size:2.2rem;"></i>
                        <div onclick="Tunify.toggle()" style="width:72px; height:72px; background:white; color:black; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem;"><i class="fa-solid fa-play" id="f-play-btn"></i></div>
                        <i class="fa-solid fa-forward-step" onclick="Tunify.next()" style="font-size:2.2rem;"></i>
                    </div>
                    <i class="fa-solid fa-repeat" style="color:var(--text-dim);"></i>
                </div>
            </div>
        </div>
        <audio id="audio-engine"></audio>
    `;

    const audio = document.getElementById('audio-engine');
    const mainView = document.getElementById('main-view');

    // --- 4. COLOR EXTRACTION LOGIC ---
    function updatePlayerTheme(imgUrl) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imgUrl;
        img.onload = () => {
            const canvas = document.getElementById('color-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 1; canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            const dimR = Math.floor(r * 0.5), dimG = Math.floor(g * 0.5), dimB = Math.floor(b * 0.5);
            document.documentElement.style.setProperty('--dynamic-bg', `rgb(${dimR}, ${dimG}, ${dimB})`);
        };
    }

    // --- 5. TUNIFY LOGIC ---
    window.Tunify = {
        openDrawer: () => { document.getElementById('profile-drawer').classList.add('open'); document.getElementById('drawer-overlay').classList.add('active'); },
        closeDrawer: () => { document.getElementById('profile-drawer').classList.remove('open'); document.getElementById('drawer-overlay').classList.remove('active'); },
        logout: () => { if(confirm("Log out of Tunify?")) { localStorage.removeItem('tunify_user'); location.reload(); } },
        tab: (t, el) => {
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            if(t==='home') Tunify.loadHome();
            if(t==='search') Tunify.loadSearch();
            if(t==='favs') Tunify.loadFavs();
        },
        loadHome: () => { mainView.innerHTML = `<h2 class="section-title">Editor's Picks</h2><div class="shelf" id="h1"></div><h2 class="section-title">New Releases</h2><div class="shelf" id="h2"></div>`; fetchShelf('New Hits', 'h1'); fetchShelf('Top Global', 'h2'); },
        loadSearch: () => { mainView.innerHTML = `<h2 class="section-title">Search</h2><input type="search" id="s-in" style="width:100%; padding:18px; border-radius:12px; background:#242424; border:none; color:white; margin-bottom:25px; outline:none;" placeholder="Artists or songs"><div id="s-res" style="display:flex; flex-wrap:wrap; gap:12px;"></div>`; document.getElementById('s-in').oninput = (e) => { if(e.target.value.length > 2) fetchShelf(e.target.value, 's-res', true); }; },
        loadFavs: () => { mainView.innerHTML = `<h2 class="section-title">Your Library</h2><div id="fav-res" style="display:flex; flex-wrap:wrap; gap:12px;"></div>`; if(favorites.length === 0) document.getElementById('fav-res').innerHTML = `<p style="color:#666; width:100%; text-align:center; margin-top:50px;">Your liked songs will appear here.</p>`; else renderList(favorites, 'fav-res', true); },
        play: (encSong, encList) => {
            const song = decodeData(encSong);
            queue = decodeData(encList);
            currentIndex = queue.findIndex(s => s.id === song.id);
            audio.src = song.downloadUrl[4].url; audio.play(); updateUI(song);
            document.getElementById('mini-player').classList.add('show');
        },
        toggle: () => audio.paused ? audio.play() : audio.pause(),
        next: () => { currentIndex = (currentIndex + 1) % queue.length; updateUI(queue[currentIndex]); audio.src = queue[currentIndex].downloadUrl[4].url; audio.play(); },
        prev: () => { currentIndex = (currentIndex - 1 + queue.length) % queue.length; updateUI(queue[currentIndex]); audio.src = queue[currentIndex].downloadUrl[4].url; audio.play(); },
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
        if(d.success) renderList(filterResults(d.data.results), id, grid);
    }

    function renderList(list, id, grid) {
        const cont = document.getElementById(id); if(!cont) return;
        const listEnc = encodeData(list);
        cont.innerHTML = list.map(s => `<div class="item" style="${grid ? 'width:calc(50% - 6px);' : ''}" onclick="Tunify.play('${encodeData(s)}', '${listEnc}')"><img src="${s.image[2].url}"><p>${s.name}</p></div>`).join('');
    }

    function updateUI(s) {
        // FIX: Ensure Artist Name is never 'Unknown' if data exists
        const artistName = s.primaryArtists || s.artists?.primary?.[0]?.name || 'Various Artists';
        
        document.getElementById('m-img').src = s.image[0].url;
        document.getElementById('m-title').innerText = s.name;
        document.getElementById('m-artist').innerText = artistName;
        document.getElementById('f-img').src = s.image[2].url;
        document.getElementById('f-title').innerText = s.name;
        document.getElementById('f-artist').innerText = artistName;
        
        updatePlayerTheme(s.image[2].url);
        updateFavState(s.id);

        // --- SPOTIFY NOTIFICATION BAR LOGIC ---
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: s.name,
                artist: artistName,
                album: 'Tunify Music',
                artwork: [
                    { src: s.image[0].url, sizes: '96x96', type: 'image/jpg' },
                    { src: s.image[1].url, sizes: '128x128', type: 'image/jpg' },
                    { src: s.image[2].url, sizes: '500x500', type: 'image/jpg' },
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => Tunify.toggle());
            navigator.mediaSession.setActionHandler('pause', () => Tunify.toggle());
            navigator.mediaSession.setActionHandler('previoustrack', () => Tunify.prev());
            navigator.mediaSession.setActionHandler('nexttrack', () => Tunify.next());
        }
    }

    function updateFavState(id) {
        const isLiked = favorites.some(f => f.id === id);
        document.getElementById('f-fav-btn').className = isLiked ? 'fa-solid fa-heart heart-btn liked' : 'fa-solid fa-heart heart-btn';
    }

    audio.ontimeupdate = () => { document.getElementById('p-fill').style.width = ((audio.currentTime / audio.duration) * 100 || 0) + '%'; };
    audio.onplay = () => { 
        document.getElementById('f-play-btn').className = 'fa-solid fa-pause'; 
        document.getElementById('m-play-btn').className = 'fa-solid fa-pause'; 
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
    };
    audio.onpause = () => { 
        document.getElementById('f-play-btn').className = 'fa-solid fa-play'; 
        document.getElementById('m-play-btn').className = 'fa-solid fa-play'; 
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
    };

    document.getElementById('mini-player').onclick = (e) => { if(e.target.id !== 'm-play-btn') document.getElementById('player-full').classList.add('active'); };
    document.getElementById('m-play-btn').onclick = (e) => { e.stopPropagation(); Tunify.toggle(); };

    window.onGoogleResponse = (res) => {
        const payload = JSON.parse(atob(res.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const user = { name: payload.name, photo: payload.picture, active: true };
        localStorage.setItem('tunify_user', JSON.stringify(user));
        startApp(user);
    };

    function startApp(user) {
        document.getElementById('auth-screen').style.display = 'none';
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
                splash.style.display = 'none';
                const saved = JSON.parse(localStorage.getItem('tunify_user'));
                if (saved && saved.active) {
                    startApp(saved);
                } else {
                    document.getElementById('auth-screen').style.display = 'flex';
                    const s = document.createElement('script');
                    s.src = "https://accounts.google.com/gsi/client";
                    s.async = true; s.defer = true;
                    s.onload = () => {
                        google.accounts.id.initialize({ client_id: CLIENT_ID, callback: window.onGoogleResponse });
                        google.accounts.id.renderButton(document.getElementById("g-btn"), { theme: "filled_blue", size: "large", shape: "pill", width: "280" });
                    };
                    document.head.appendChild(s);
                }
            }, 800);
        }, 2000);
    };
})();