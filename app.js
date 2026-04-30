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

    // --- UTILS ---
    const encodeData = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    const decodeData = (str) => JSON.parse(decodeURIComponent(escape(atob(str))));

    // --- 2. PREMIUM CSS ---
    const style = document.createElement('style');
    style.textContent = `
        :root { --sp-green: #1DB954; --bg: #000; --glass: rgba(255, 255, 255, 0.1); }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        
        html, body { width: 100%; height: 100%; background: #000; color: white; font-family: 'Segoe UI', Roboto, sans-serif; overflow: hidden; }

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

        /* Cool Login Screen */
        #auth-screen {
            position: fixed; inset: 0; background: linear-gradient(135deg, #121212 0%, #000 100%);
            z-index: 5000; display: none; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center;
        }
        #auth-screen.active { display: flex; }
        .login-card { width: 100%; max-width: 400px; }
        .login-btn {
            background: white; color: black; padding: 16px 24px; border-radius: 50px;
            font-weight: 700; display: flex; align-items: center; justify-content: center;
            gap: 12px; margin-top: 40px; cursor: pointer; transition: transform 0.2s;
        }
        .login-btn:active { transform: scale(0.98); }

        #app-root { 
            display: flex; flex-direction: column; height: 100dvh; width: 100%; 
            background: linear-gradient(to bottom, #121212 0%, #000 100%); 
            display: none;
        }
        #app-root.visible { display: flex; }
        
        header { padding: 50px 15px 10px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .u-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 1px solid var(--glass); }
        .u-avatar img { width: 100%; height: 100%; object-fit: cover; }

        main { flex: 1; overflow-y: auto; padding: 0 15px 200px; -webkit-overflow-scrolling: touch; }
        main::-webkit-scrollbar { display: none; }

        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 15px; }
        .hero-card { background: var(--glass); border-radius: 4px; display: flex; align-items: center; height: 55px; overflow: hidden; cursor: pointer; }
        .hero-card img { height: 100%; aspect-ratio: 1/1; object-fit: cover; }
        .hero-card span { font-size: 0.7rem; font-weight: 700; margin-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .section-title { font-size: 1.4rem; font-weight: 900; margin: 30px 0 15px; letter-spacing: -0.5px; }
        .shelf { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .shelf::-webkit-scrollbar { display: none; }
        
        .item { min-width: 150px; width: 150px; cursor: pointer; }
        .item img { width: 100%; aspect-ratio: 1/1; border-radius: 8px; object-fit: cover; }
        .item p { font-size: 0.85rem; font-weight: 700; margin-top: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .item span { font-size: 0.75rem; color: #b3b3b3; display: block; }

        #mini-player { position: fixed; bottom: 80px; left: 8px; right: 8px; height: 56px; background: #282828; border-radius: 6px; display: none; align-items: center; padding: 0 8px; z-index: 100; }
        #mini-player.show { display: flex; }
        
        nav { position: fixed; bottom: 0; left: 0; right: 0; height: 75px; background: #000; display: flex; justify-content: space-around; align-items: center; z-index: 200; padding-bottom: 15px; }
        .nav-link { color: #b3b3b3; display: flex; flex-direction: column; align-items: center; font-size: 0.6rem; gap: 5px; cursor: pointer; }
        .nav-link.active { color: white; }

        #player-full { position: fixed; inset: 0; z-index: 1000; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.3, 0, 0, 1); display: flex; flex-direction: column; background: #121212; }
        #player-full.active { transform: translateY(0); }
        .f-bg { position: absolute; inset: 0; filter: blur(60px) brightness(0.4); opacity: 0.8; z-index: -1; }
        
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

        <div id="auth-screen">
            <div class="login-card">
                <i class="fa-solid fa-headphones" style="font-size:4rem; color:var(--sp-green); margin-bottom:20px;"></i>
                <h1 style="font-size:2rem; font-weight:900;">Millions of songs.</h1>
                <p style="color:#b3b3b3; margin-top:10px;">Free on Tunify.</p>
                <div class="login-btn" onclick="Tunify.login()">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" style="width:20px;">
                    Continue with Google
                </div>
            </div>
        </div>

        <div id="app-root">
            <header>
                <div class="u-avatar" id="user-pfp"></div>
                <div style="display:flex; gap:15px; font-size:1.2rem;">
                    <i class="fa-regular fa-bell"></i>
                    <i class="fa-solid fa-arrow-right-from-bracket" onclick="Tunify.logout()"></i>
                </div>
            </header>
            <main id="main-view"></main>
            <div id="mini-player">
                <img id="m-img" src="" style="width:40px; height:40px; border-radius:4px;">
                <div style="flex:1; margin-left:10px; overflow:hidden;">
                    <div id="m-title" style="font-size:0.8rem; font-weight:700; white-space:nowrap;"></div>
                    <div id="m-artist" style="font-size:0.7rem; color:#b3b3b3;"></div>
                </div>
                <i class="fa-solid fa-play" id="m-play-btn" style="font-size:1.2rem; padding:15px;"></i>
            </div>
            <nav>
                <div class="nav-link active" onclick="Tunify.tab('home', this)"><i class="fa-solid fa-house"></i><span>Home</span></div>
                <div class="nav-link" onclick="Tunify.tab('search', this)"><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></div>
                <div class="nav-link" onclick="Tunify.tab('favs', this)"><i class="fa-solid fa-lines-leaning"></i><span>Library</span></div>
            </nav>
        </div>

        <div id="player-full">
            <div class="f-bg" id="f-bg"></div>
            <div style="padding: 40px 25px; flex:1; display:flex; flex-direction:column;">
                <i class="fa-solid fa-chevron-down" onclick="Tunify.closePlayer()" style="font-size:1.4rem; margin-bottom:40px;"></i>
                <img id="f-img" src="" style="width:100%; aspect-ratio:1/1; border-radius:8px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
                <div style="margin-top:40px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="overflow:hidden;"><h2 id="f-title" style="font-size:1.5rem;"></h2><p id="f-artist" style="color:#b3b3b3;"></p></div>
                    <i class="fa-solid fa-heart heart-btn" id="f-fav-btn" style="font-size:1.6rem;" onclick="Tunify.toggleFav()"></i>
                </div>
                <div class="progress-bar" id="p-bar"><div class="progress-fill" id="p-fill"></div></div>
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#b3b3b3; margin-top:-15px;"><span id="curr-time">0:00</span><span id="dur-time">0:00</span></div>
                <div style="display:flex; justify-content:space-around; align-items:center; margin-top:20px;">
                    <i class="fa-solid fa-shuffle" id="ctrl-shuf" onclick="Tunify.shuffle()" style="font-size:1.2rem; color:#555;"></i>
                    <i class="fa-solid fa-backward-step" onclick="Tunify.prev()" style="font-size:2rem;"></i>
                    <div onclick="Tunify.toggle()" style="width:65px; height:65px; background:white; color:black; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.8rem;"><i class="fa-solid fa-play" id="f-play-btn"></i></div>
                    <i class="fa-solid fa-forward-step" onclick="Tunify.next()" style="font-size:2rem;"></i>
                    <i class="fa-solid fa-repeat" id="ctrl-rep" onclick="Tunify.repeat()" style="font-size:1.2rem; color:#555;"></i>
                </div>
            </div>
        </div>
        <audio id="audio-engine"></audio>
    `;

    const audio = document.getElementById('audio-engine');
    const mainView = document.getElementById('main-view');

    // --- 4. TUNIFY LOGIC ---
    window.Tunify = {
        login: () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).catch(e => alert(e.message));
        },
        logout: () => firebase.auth().signOut(),
        
        tab: (t, el) => {
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            if(t==='home') Tunify.loadHome();
            if(t==='search') Tunify.loadSearch();
            if(t==='favs') Tunify.loadFavs();
        },

        loadHome: () => {
            const categories = ["Trending", "Phonk", "Global Hits", "Chill", "Party"];
            const randoms = categories.sort(() => 0.5 - Math.random()).slice(0, 3);
            mainView.innerHTML = `<div class="hero-grid" id="hero-area"></div><h2 class="section-title">${randoms[0]}</h2><div class="shelf" id="h1"></div><h2 class="section-title">${randoms[1]}</h2><div class="shelf" id="h2"></div><h2 class="section-title">${randoms[2]}</h2><div class="shelf" id="h3"></div>`;
            fetchHero(); fetchShelf(randoms[0], 'h1'); fetchShelf(randoms[1], 'h2'); fetchShelf(randoms[2], 'h3');
        },

        loadSearch: () => {
            mainView.innerHTML = `<h2 class="section-title">Search</h2><input type="search" id="s-in" style="width:100%; padding:15px; border-radius:8px; background:#282828; border:none; color:white; margin-bottom:20px; font-weight:600;" placeholder="Artists, songs..."><div id="s-res" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between;"></div>`;
            document.getElementById('s-in').oninput = (e) => { if(e.target.value.length > 2) fetchShelf(e.target.value, 's-res', true); };
        },

        loadFavs: () => {
            mainView.innerHTML = `<h2 class="section-title">Library</h2><div id="fav-res" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between;"></div>`;
            if(favorites.length === 0) document.getElementById('fav-res').innerHTML = `<p style="color:#b3b3b3; width:100%; text-align:center;">Empty library.</p>`;
            else renderList(favorites, 'fav-res', true);
        },

        play: (encSong, encList) => {
            const song = decodeData(encSong);
            queue = decodeData(encList);
            currentIndex = queue.findIndex(s => s.id === song.id);
            audio.src = song.downloadUrl[4].url;
            audio.play(); updateUI(song);
            document.getElementById('mini-player').classList.add('show');
        },

        toggle: () => audio.paused ? audio.play() : audio.pause(),
        next: () => {
            currentIndex = isShuffle ? Math.floor(Math.random() * queue.length) : (currentIndex + 1) % queue.length;
            const s = queue[currentIndex]; updateUI(s); audio.src = s.downloadUrl[4].url; audio.play();
        },
        prev: () => {
            currentIndex = (currentIndex - 1 + queue.length) % queue.length;
            const s = queue[currentIndex]; updateUI(s); audio.src = s.downloadUrl[4].url; audio.play();
        },
        shuffle: () => { isShuffle = !isShuffle; document.getElementById('ctrl-shuf').style.color = isShuffle ? 'var(--sp-green)' : '#555'; },
        repeat: () => { repeatMode = (repeatMode + 1) % 3; document.getElementById('ctrl-rep').style.color = repeatMode > 0 ? 'var(--sp-green)' : '#555'; },
        toggleFav: () => {
            const s = queue[currentIndex];
            const idx = favorites.findIndex(f => f.id === s.id);
            if(idx > -1) favorites.splice(idx, 1); else favorites.push(s);
            localStorage.setItem('tunify_favs', JSON.stringify(favorites));
            updateFavState(s.id);
        },
        closePlayer: () => document.getElementById('player-full').classList.remove('active')
    };

    // --- API & UI HELPERS ---
    async function fetchHero() {
        const r = await fetch(`${API}/search/songs?query=Popular`);
        const d = await r.json();
        if(d.success) {
            const songs = d.data.results.slice(0, 6);
            const listEnc = encodeData(d.data.results);
            document.getElementById('hero-area').innerHTML = songs.map(s => `
                <div class="hero-card" onclick="Tunify.play('${encodeData(s)}', '${listEnc}')">
                    <img src="${s.image[1].url}">
                    <span>${s.name}</span>
                </div>
            `).join('');
        }
    }

    async function fetchShelf(q, id, grid = false) {
        const r = await fetch(`${API}/search/songs?query=${encodeURIComponent(q)}`);
        const d = await r.json();
        if(d.success) {
            const filtered = d.data.results.filter(s => !blocklist.some(w => s.name.toLowerCase().includes(w)));
            renderList(filtered, id, grid);
        }
    }

    function renderList(list, id, grid) {
        const cont = document.getElementById(id); if(!cont) return;
        const listEnc = encodeData(list);
        cont.innerHTML = list.map(s => `<div class="item" style="${grid ? 'width:46%; margin-bottom:15px;' : ''}" onclick="Tunify.play('${encodeData(s)}', '${listEnc}')"><img src="${s.image[2].url}"><p>${s.name}</p><span>${s.primaryArtists}</span></div>`).join('');
    }

    function updateUI(s) {
        document.getElementById('m-img').src = s.image[0].url;
        document.getElementById('m-title').innerText = s.name;
        document.getElementById('m-artist').innerText = s.primaryArtists;
        document.getElementById('f-img').src = s.image[2].url;
        document.getElementById('f-bg').style.backgroundImage = `url(${s.image[2].url})`;
        document.getElementById('f-title').innerText = s.name;
        document.getElementById('f-artist').innerText = s.primaryArtists;
        updateFavState(s.id);
    }

    function updateFavState(id) {
        const isLiked = favorites.some(f => f.id === id);
        document.getElementById('f-fav-btn').className = isLiked ? 'fa-solid fa-heart heart-btn liked' : 'fa-solid fa-heart heart-btn';
    }

    // --- EVENTS & AUTH ---
    audio.ontimeupdate = () => {
        const p = (audio.currentTime / audio.duration) * 100 || 0;
        document.getElementById('p-fill').style.width = p + '%';
        const format = (t) => { if(!t) return "0:00"; const m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${s<10?'0':''}${s}`; };
        document.getElementById('curr-time').innerText = format(audio.currentTime);
        document.getElementById('dur-time').innerText = format(audio.duration);
    };
    audio.onended = () => repeatMode === 1 ? audio.play() : Tunify.next();
    audio.onplay = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-pause'; document.getElementById('m-play-btn').className = 'fa-solid fa-pause'; };
    audio.onpause = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-play'; document.getElementById('m-play-btn').className = 'fa-solid fa-play'; };

    document.getElementById('p-bar').onclick = (e) => {
        const rect = document.getElementById('p-bar').getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    };
    document.getElementById('mini-player').onclick = (e) => { if(e.target.id !== 'm-play-btn') document.getElementById('player-full').classList.add('active'); };
    document.getElementById('m-play-btn').onclick = (e) => { e.stopPropagation(); Tunify.toggle(); };

    // --- FIREBASE INITIALIZATION ---
    firebase.initializeApp({ apiKey: "AIzaSyDWI8raVFZ4HEzxAUYGfY1vOfqHoPvQiD0", authDomain: "tunify-8592f.firebaseapp.com", projectId: "tunify-8592f" });
    
    firebase.auth().onAuthStateChanged(user => {
        const splash = document.getElementById('splash-screen');
        const auth = document.getElementById('auth-screen');
        const app = document.getElementById('app-root');

        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.visibility = 'hidden';
                if (user) {
                    auth.classList.remove('active');
                    app.classList.add('visible');
                    document.getElementById('user-pfp').innerHTML = `<img src="${user.photoURL}">`;
                    Tunify.loadHome();
                } else {
                    app.classList.remove('visible');
                    auth.classList.add('active');
                }
            }, 600);
        }, 2000);
    });

})();
                                                                  
