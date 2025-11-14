// js/memory-game-clash.js - memory game using icons in assets/clash-icons/
// Make sure your images are in assets/clash-icons/ and background is at assets/backgrounds/bg.jpg

(function(){
  const iconFiles = [
  "bal.png",
  "dragon.png",
  "goblin.png",
  "golem.png",
  "hog.png",
  "lava.png",
  "log.png",
  "mega.png",
  "sparky.png",
  "Card_Barbarians.png" // <-- Add this line
];

  // Icon images are located in the project's `images/` folder
  // (files like bal.png, dragon.png, goblin.png are in /images)
  const IMAGES_PATH = "assets/clash-icons/";

  const SOUNDS_PATH = "assets/sounds/"; // optional

  let pairsCount = iconFiles.length;
  let deck = [];
  let first = null, second = null, lock = false;
  let matchedPairs = 0;
  let moves = 0;
  let timerInterval = null;
  let secondsElapsed = 0;
  let gameStarted = false;
  let muted = false;

  // DOM
  const grid = document.getElementById("gameGrid");
  const movesEl = document.getElementById("moves");
  const timerEl = document.getElementById("timer");
  const announcer = document.getElementById('gameAnnouncer');
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const muteBtn = document.getElementById("muteBtn");
  const overlay = document.getElementById("overlay");
  const winMessage = document.getElementById("winMessage");
  const winStats = document.getElementById("winStats");
  const playAgain = document.getElementById("playAgain");
  const gameAudio = document.getElementById("gameAudio");

  // helper
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function formatTime(s){ const m = String(Math.floor(s/60)).padStart(2,'0'); const sec = String(s%60).padStart(2,'0'); return `${m}:${sec}`; }

  function createDeck(){
    const pairs = iconFiles.slice(0, pairsCount);
    const doubled = pairs.concat(pairs);
    return shuffle(doubled);
  }

  function buildBoard(){
    deck = createDeck();
    grid.innerHTML = "";
    deck.forEach((name,i)=>{
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.icon = name;
      tile.tabIndex = 0;

      const inner = document.createElement("div"); inner.className = "tile-inner";

      const front = document.createElement("div"); front.className = "face front"; front.textContent = "❓";
      const back = document.createElement("div"); back.className = "face back";

      const img = document.createElement("img");
      img.src = IMAGES_PATH + encodeURIComponent(name);
      // If an image fails to load, swap to a local placeholder so the tile still shows a graphic
      img.addEventListener('error', ()=>{
        console.warn('Memory game image failed to load:', img.src);
        // fallback placeholder - use an available image in the repo or a tiny data URI
        const fallback = IMAGES_PATH + 'rename.png';
        if(img.src !== fallback){
          img.src = fallback;
        } else {
          // last resort: make the image visually subtle and show the alt text
          img.style.opacity = '0.25';
        }
      });
      img.alt = name.replace(/[_\-\.]/g,' ').replace(/\.(png|jpg|jpeg)$/i,'');
      back.appendChild(img);

      inner.appendChild(front); inner.appendChild(back);
      tile.appendChild(inner);

  tile.addEventListener('click', onTileClick);
  tile.addEventListener('keydown', onTileKeyDown);

      grid.appendChild(tile);
    });
  }

  function announce(text){
    try{ if(announcer) announcer.textContent = text; }catch(e){}
    // also log for debugging
    console.log('Announce:', text);
  }

  function onTileKeyDown(e){
    const tile = e.currentTarget;
    const tiles = Array.from(grid.querySelectorAll('.tile'));
    const idx = tiles.indexOf(tile);
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 5;

    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      tile.click();
      return;
    }

    // Arrow navigation
    let targetIndex = null;
    if(e.key === 'ArrowRight') targetIndex = idx + 1;
    if(e.key === 'ArrowLeft') targetIndex = idx - 1;
    if(e.key === 'ArrowDown') targetIndex = idx + cols;
    if(e.key === 'ArrowUp') targetIndex = idx - cols;

    if(targetIndex !== null){
      e.preventDefault();
      if(targetIndex >=0 && targetIndex < tiles.length){
        tiles[targetIndex].focus();
      }
    }
  }

  function onTileClick(e){
    if(lock) return;
    const tile = e.currentTarget;
    if(tile.classList.contains('matched') || tile.classList.contains('flipped')) return;
    
    // Start game if not already started (when first tile is clicked)
    if(!gameStarted){
      gameStarted = true;
      startTimer();
      playGameAudio();
    }
    
    flipTile(tile);
    // announce flip
    announce(`Flipped ${tile.dataset.icon.replace(/\.(png|jpg|jpeg)$/,'')}`);
    if(!first){ first = tile; return; }
    second = tile;
    moves++;
    movesEl.textContent = `Moves: ${moves}`;
    announce(`Moves ${moves}`);

    if(first.dataset.icon === second.dataset.icon){
      first.classList.add('matched');
      second.classList.add('matched');
      matchedPairs++;
      first=null; second=null;
      announce('Match!');
      if(matchedPairs === pairsCount) onWin();
    } else {
      lock = true;
      setTimeout(()=>{
        unflipTile(first);
        unflipTile(second);
        first=null; second=null; lock=false;
        announce('Not a match');
      }, 900);
    }
  }

  // Rely on CSS for the flip transform (add/remove the .flipped class)
  function flipTile(t){ t.classList.add('flipped'); }
  function unflipTile(t){ t.classList.remove('flipped'); }

  function startTimer(){
    if(timerInterval) clearInterval(timerInterval);
    secondsElapsed = 0;
    timerEl.textContent = 'Time: 00:00';
    timerInterval = setInterval(()=>{ secondsElapsed++; timerEl.textContent = 'Time: ' + formatTime(secondsElapsed); },1000);
  }
  function stopTimer(){ if(timerInterval) clearInterval(timerInterval); timerInterval=null; }

  function resetGame(full=true){
    stopTimer();
    matchedPairs=0; moves=0; movesEl.textContent='Moves: 0'; timerEl.textContent='Time: 00:00';
    first=null; second=null; lock=false; gameStarted=false;
    overlay.classList.remove('active');
    winMessage && (winMessage.hidden = true);
    if(full) buildBoard();
  }

  function onWin(){
    stopTimer();
    overlay.classList.add('active');
    if(winMessage){
      winMessage.hidden = false;
      winStats.textContent = `You finished in ${formatTime(secondsElapsed)} with ${moves} moves.`;
    }
  }

  // Audio functions
  function playGameAudio() {
    if(gameAudio && !muted) {
      gameAudio.currentTime = 0; // Reset to beginning
      gameAudio.play().catch(e => {
        console.log('Audio play failed:', e);
      });
    }
  }

  function stopGameAudio() {
    if(gameAudio) {
      gameAudio.pause();
      gameAudio.currentTime = 0; // Reset to beginning
    }
  }

  // UI events
  startBtn && startBtn.addEventListener('click', ()=>{
    if(!gameStarted){ 
      gameStarted=true; 
      startTimer(); 
      playGameAudio();
    }
  });

  restartBtn && restartBtn.addEventListener('click', ()=>{ 
    resetGame(true);
    stopGameAudio();
  });

  muteBtn && muteBtn.addEventListener('click', ()=>{
    muted = !muted;
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.textContent = muted ? '🔇' : '🔊';
    
    // Control audio based on mute state
    if(gameAudio) {
      if(muted) {
        gameAudio.pause();
      } else if(gameStarted) {
        playGameAudio();
      }
    }
  });

  playAgain && playAgain.addEventListener('click', ()=>{ 
    resetGame(true);
    stopGameAudio();
  });

  // init
  buildBoard();
  resetGame(false);
})();
