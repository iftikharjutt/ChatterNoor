/* ChatterNoor Game Shelf · saved-game poster carousel + fullscreen launcher */
(() => {
  'use strict';
  const KEY='NOOR_GAME_LIBRARY_V1', LIMIT=20;
  const $=id=>document.getElementById(id);
  let library=[];
  try{library=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(library))library=[];}catch(_){library=[];}
  const persist=()=>{localStorage.setItem(KEY,JSON.stringify(library));render();};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function posterCards(){return library.map(g=>'<article class="game-card" data-play="'+esc(g.id)+'" role="button" tabindex="0" aria-label="Play '+esc(g.title)+'"><div class="game-card-title">'+esc(g.title)+'</div><small>'+new Date(g.savedAt).toLocaleDateString()+'</small><div class="game-card-actions"><button data-play="'+esc(g.id)+'" type="button">▶ Play</button><button class="secondary" data-delete="'+esc(g.id)+'" type="button">✕</button></div></article>').join('');}
  function render(){
    const shelf=$('gameShelf'),list=$('savedGamesList'),count=$('gameShelfCount'),wrap=$('gameShelfWrap');
    if(count)count.textContent=library.length;
    const cards=posterCards();
    if(shelf){shelf.innerHTML=cards||'<div class="game-empty">Saved games will appear here.</div>';if(wrap)wrap.classList.toggle('has-games',library.length>0);}
    if(list)list.innerHTML=cards||'<p class="game-empty">Your saved games will appear here.</p>';
  }
  function openLibrary(){$('gamesDrawer')?.classList.add('open');$('gamesScrim')?.classList.add('open');}
  function saveCurrent(){
    const code=window.currentHtmlCode;
    if(!code){window.showToast?.('Create/open a game first, then save it.','bad');return;}
    const title=prompt('Name this game:','My HTML Game');
    if(!title||!title.trim())return;
    library.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:title.trim().slice(0,60),html:code,savedAt:Date.now()});
    library=library.slice(0,LIMIT);persist();window.showToast?.('Game saved on this device!','ok');
  }
  function play(id){
    const game=library.find(x=>x.id===id);if(!game)return;
    window.currentHtmlCode=game.html;
    if(typeof window.openFullscreenGame==='function')window.openFullscreenGame(game.html);
    else {const frame=$('fsGameFrame');if(frame)frame.srcdoc=game.html;$('fullscreenOverlay')?.classList.add('active');}
    $('gamesDrawer')?.classList.remove('open');$('gamesScrim')?.classList.remove('open');
  }
  function remove(id){
    const g=library.find(x=>x.id===id);if(!g||!confirm('Delete "'+g.title+'" from this device?'))return;
    library=library.filter(x=>x.id!==id);persist();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-play],[data-delete]');if(!b)return;
    if(b.dataset.delete)remove(b.dataset.delete);else if(b.dataset.play)play(b.dataset.play);
  });
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches('.game-shelf [data-play]')){e.preventDefault();play(e.target.dataset.play);}
  });
  $('kidPromptChips')?.addEventListener('click',e=>{const b=e.target.closest('[data-prompt]');if(!b)return;const input=$('input');input.value=b.dataset.prompt;input.focus();});
  $('saveGameBtn')?.addEventListener('click',saveCurrent);
  $('gameShelfToggle')?.addEventListener('click',openLibrary);
  window.addEventListener('noor-game-ready',()=>{
    const b=$('saveGameBtn');if(b)b.hidden=false;
    const code=window.currentHtmlCode;if(!code)return;
    library.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:'Recent game · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),html:code,savedAt:Date.now(),recent:true});
    library=library.slice(0,LIMIT);persist();
  });
  render();
  window.NoorGameLibrary={render,saveCurrent,play,openLibrary};
})();