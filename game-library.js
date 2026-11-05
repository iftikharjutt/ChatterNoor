/* ChatterNoor Game Shelf · local-only reusable HTML games */
(() => {
  'use strict';
  const KEY = 'NOOR_GAME_LIBRARY_V1', LIMIT = 20;
  const $ = id => document.getElementById(id);
  let library = [];
  try { library = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(library)) library=[]; } catch (_) { library=[]; }
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(library)); render(); };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const shelf=$('gameShelf'), list=$('savedGamesList'), count=$('gameShelfCount');
    if (!shelf || !list) return;
    if (count) count.textContent=library.length;
    const cards=library.map(g=>'<article class="game-card"><div class="game-card-title">'+esc(g.title)+'</div><small>'+new Date(g.savedAt).toLocaleDateString()+'</small><div class="game-card-actions"><button data-play="'+g.id+'">▶ Play</button><button class="secondary" data-delete="'+g.id+'">✕</button></div></article>').join('');
    shelf.innerHTML=cards || '<div class="game-empty">No saved games yet. Create a game, then tap “Save game”.</div>';
    list.innerHTML=cards || '<p class="game-empty">Your saved games will appear here.</p>';
  }
  function openLibrary() {
    $('gamesDrawer')?.classList.add('open');
    $('gamesScrim')?.classList.add('open');
  }
  function saveCurrent() {
    const code=window.currentHtmlCode;
    if (!code) { window.showToast?.('Create/open a game first, then save it.','bad'); return; }
    const title=prompt('Name this game:', 'My HTML Game');
    if (!title || !title.trim()) return;
    library.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:title.trim().slice(0,60),html:code,savedAt:Date.now()});
    library=library.slice(0,LIMIT); persist(); window.showToast?.('Game saved on this device!','ok');
  }
  function play(id) {
    const game=library.find(x=>x.id===id); if(!game)return;
    window.currentHtmlCode=game.html;
    const frame=$('gameFrame'); if(frame) frame.srcdoc=game.html;
    if(typeof window.switchScreenMode==='function') window.switchScreenMode('game');
    $('gamesDrawer')?.classList.remove('open'); $('gamesScrim')?.classList.remove('open');
    window.showToast?.('Loaded '+game.title,'ok');
  }
  function remove(id) {
    const g=library.find(x=>x.id===id); if(!g || !confirm('Delete "'+g.title+'" from this device?'))return;
    library=library.filter(x=>x.id!==id); persist();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-play],[data-delete]');
    if(!b)return;
    if(b.dataset.play)play(b.dataset.play); else remove(b.dataset.delete);
  });
  $('kidPromptChips')?.addEventListener('click',e=>{const b=e.target.closest('[data-prompt]');if(!b)return;const input=$('input');input.value=b.dataset.prompt;input.focus();});
  $('saveGameBtn')?.addEventListener('click',saveCurrent);
  $('gameShelfToggle')?.addEventListener('click',openLibrary);
  $('openLibraryBtn')?.addEventListener('click',openLibrary);
  window.addEventListener('noor-game-ready',()=>{
    const b=$('saveGameBtn'); if(b)b.hidden=false;
    const code=window.currentHtmlCode; if(!code)return;
    library.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:'Recent game · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),html:code,savedAt:Date.now(),recent:true});
    library=library.slice(0,LIMIT); persist();
  });
  render();
  window.NoorGameLibrary={render,saveCurrent,play,openLibrary};
})();
