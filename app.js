const $=s=>document.querySelector(s);
const db={get:(k,d=[])=>{try{return JSON.parse(localStorage.getItem('mw_'+k))??d}catch{return d}},set:(k,v)=>localStorage.setItem('mw_'+k,JSON.stringify(v))};

// MY WORLD — offline cosmic soundtrack
const cosmicTracks={
  'deep-space':{name:'Deep Space',src:'assets/audio/deep-space.mp3'},
  'interstellar':{name:'Interstellar',src:'assets/audio/interstellar.mp3'},
  'cyber-galaxy':{name:'Cyber Galaxy',src:'assets/audio/cyber-galaxy.mp3'}
};
const cosmicAudio=new Audio();
cosmicAudio.loop=true;
cosmicAudio.preload='none';
let cosmicPlaying=false;
function currentCosmicTrack(){return db.get('musicTrack','deep-space')}
function setCosmicTrack(key,playAfter=false){
  if(!cosmicTracks[key])key='deep-space';
  const changed=cosmicAudio.src!==new URL(cosmicTracks[key].src,document.baseURI).href;
  db.set('musicTrack',key);
  if(changed){cosmicAudio.src=cosmicTracks[key].src;cosmicAudio.load();}
  if(playAfter||cosmicPlaying){
    cosmicAudio.play().then(()=>{cosmicPlaying=true;db.set('musicEnabled',true);}).catch(()=>{cosmicPlaying=false;});
  }
}
function setCosmicVolume(value){
  const v=Math.max(0,Math.min(1,Number(value)/100));
  cosmicAudio.volume=v;
  db.set('musicVolume',Math.round(v*100));
}
async function toggleCosmicMusic(){
  if(cosmicPlaying){
    cosmicAudio.pause();cosmicPlaying=false;db.set('musicEnabled',false);return false;
  }
  setCosmicTrack(currentCosmicTrack());
  try{await cosmicAudio.play();cosmicPlaying=true;db.set('musicEnabled',true);return true;}
  catch{cosmicPlaying=false;db.set('musicEnabled',false);alert('Нажми ещё раз, чтобы разрешить воспроизведение музыки.');return false;}
}
cosmicAudio.addEventListener('pause',()=>{if(!cosmicAudio.ended)cosmicPlaying=false;});
cosmicAudio.volume=Math.max(0,Math.min(1,Number(db.get('musicVolume',35))/100));
setCosmicTrack(currentCosmicTrack(),false);db.set('musicEnabled',false);

const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const prettyDate=s=>parseDate(s).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
function updateClock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});$('#weekday').textContent=d.toLocaleDateString('ru-RU',{weekday:'long'});$('#date').textContent=d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});}
updateClock();setInterval(updateClock,30000);
function counts(){$('#taskCount').textContent=db.get('tasks').filter(x=>!x.done).length;$('#noteCount').textContent=db.get('notes').length}
counts();
const sheet=$('#sheet'),backdrop=$('#sheetBackdrop'),sheetBody=$('#sheetBody');
function openSheet(title,html){sheet.classList.remove('create-mode');$('#sheetTitle').textContent=title;sheetBody.innerHTML=html;sheet.classList.add('open');backdrop.classList.add('open');}
function closeSheet(){sheet.classList.remove('open','create-mode');backdrop.classList.remove('open')}
$('#sheetClose').onclick=closeSheet;backdrop.onclick=closeSheet;
function showTasks(){const items=db.get('tasks');openSheet('Задачи',`<form id="taskForm"><input class="field" id="taskText" placeholder="Что нужно сделать?" required><label class="muted" for="taskDue">Срок (необязательно)</label><input class="field date-field" id="taskDue" type="date" min="${dateKey(new Date())}"><button class="primary">Добавить задачу</button></form><div>${items.map((x,i)=>`<div class="row-item"><input type="checkbox" data-check="${i}" ${x.done?'checked':''}><span class="grow" style="${x.done?'text-decoration:line-through;opacity:.55':''}">${escapeHTML(x.text)}${x.due?`<small class="muted" style="display:block;margin-top:4px">Срок: ${prettyDate(x.due)}</small>`:''}</span><button data-remove="${i}">Удалить</button></div>`).join('')||'<p class="empty">Пока нет задач. Добавь первую.</p>'}</div>`);$('#taskForm').onsubmit=e=>{e.preventDefault();items.unshift({text:$('#taskText').value.trim(),due:$('#taskDue').value||'',done:false,created:dateKey(new Date())});db.set('tasks',items);showTasks();counts()};sheetBody.querySelectorAll('[data-check]').forEach(el=>el.onchange=()=>{items[+el.dataset.check].done=el.checked;db.set('tasks',items);showTasks();counts()});sheetBody.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{items.splice(+el.dataset.remove,1);db.set('tasks',items);showTasks();counts()})}
function showNotes(){const items=db.get('notes');openSheet('Заметки',`<form id="noteForm"><textarea class="field" id="noteText" rows="4" placeholder="Запиши мысль, идею или напоминание..." required></textarea><button class="primary">Сохранить заметку</button></form>${items.map((x,i)=>`<div class="row-item"><span class="grow">${escapeHTML(x)}</span><button data-remove="${i}">Удалить</button></div>`).join('')||'<p class="empty">Здесь будут твои записи.</p>'}`);$('#noteForm').onsubmit=e=>{e.preventDefault();items.unshift($('#noteText').value);db.set('notes',items);showNotes();counts()};sheetBody.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{items.splice(+el.dataset.remove,1);db.set('notes',items);showNotes();counts()})}
function showGoals(){const items=db.get('goals');const done=items.filter(x=>x.done).length;openSheet('Мои цели',`<p class="muted">Большие достижения начинаются с одной цели.</p><form id="goalForm"><input class="field" id="goalText" placeholder="Например, выучить новый язык" required><button class="primary">Добавить цель</button></form><div class="muted" style="margin-top:16px">Выполнено ${done} из ${items.length}</div><div class="progress-bar"><i style="width:${items.length?done/items.length*100:0}%"></i></div>${items.map((x,i)=>`<div class="row-item"><input type="checkbox" data-done="${i}" ${x.done?'checked':''}><span class="grow" style="${x.done?'text-decoration:line-through;opacity:.55':''}">${escapeHTML(x.text)}</span><button data-del="${i}">×</button></div>`).join('')||'<p class="empty">Твои цели появятся здесь.</p>'}`);$('#goalForm').onsubmit=e=>{e.preventDefault();items.push({text:$('#goalText').value.trim(),done:false});db.set('goals',items);showGoals()};sheetBody.querySelectorAll('[data-done]').forEach(el=>el.onchange=()=>{items[+el.dataset.done].done=el.checked;db.set('goals',items);showGoals()});sheetBody.querySelectorAll('[data-del]').forEach(el=>el.onclick=()=>{items.splice(+el.dataset.del,1);db.set('goals',items);showGoals()})}
let calendarMonth=new Date();calendarMonth.setDate(1);let selectedDay=dateKey(new Date());
function showCalendar(){const events=db.get('events');const tasks=db.get('tasks');const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();const first=new Date(year,month,1);const offset=(first.getDay()+6)%7;const days=new Date(year,month+1,0).getDate();const prevDays=new Date(year,month,0).getDate();let cells='';for(let i=0;i<42;i++){let day,dt,muted=false;if(i<offset){day=prevDays-offset+i+1;dt=new Date(year,month-1,day);muted=true}else if(i>=offset+days){day=i-offset-days+1;dt=new Date(year,month+1,day);muted=true}else{day=i-offset+1;dt=new Date(year,month,day)}const key=dateKey(dt);const has=events.some(x=>x.date===key)||tasks.some(x=>x.due===key&&!x.done);cells+=`<button class="calendar-day ${muted?'muted-day':''} ${key===dateKey(new Date())?'today':''} ${key===selectedDay?'selected':''} ${has?'has-event':''}" data-day="${key}">${day}</button>`}
const dayEvents=events.filter(x=>x.date===selectedDay);const dayTasks=tasks.filter(x=>x.due===selectedDay&&!x.done);openSheet('Календарь',`<div class="calendar-head"><button id="monthPrev" aria-label="Предыдущий месяц">‹</button><strong>${first.toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</strong><button id="monthNext" aria-label="Следующий месяц">›</button></div><div class="calendar-grid">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<div class="calendar-weekday">${x}</div>`).join('')}${cells}</div><div class="calendar-events"><h3>Планы на ${prettyDate(selectedDay)}</h3>${dayEvents.map((x,i)=>`<div class="row-item"><span class="grow">${escapeHTML(x.title)}${x.time?`<small class="muted" style="display:block">${escapeHTML(x.time)}</small>`:''}</span><button data-event-delete="${events.indexOf(x)}">Удалить</button></div>`).join('')}${dayTasks.map(x=>`<div class="row-item"><span class="grow">✓ ${escapeHTML(x.text)} <small class="muted">Задача</small></span></div>`).join('')}${!dayEvents.length&&!dayTasks.length?'<p class="empty">На этот день пока ничего не запланировано.</p>':''}</div><form id="eventForm" style="margin-top:16px"><label class="muted" for="eventTitle">Добавить событие</label><input class="field" id="eventTitle" placeholder="Например, встреча или поездка" required><input class="field date-field" id="eventTime" type="time" aria-label="Время (необязательно)"><button class="primary">Сохранить событие</button></form>`);
$('#monthPrev').onclick=()=>{calendarMonth=new Date(year,month-1,1);showCalendar()};$('#monthNext').onclick=()=>{calendarMonth=new Date(year,month+1,1);showCalendar()};sheetBody.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{selectedDay=b.dataset.day;showCalendar()});$('#eventForm').onsubmit=e=>{e.preventDefault();events.push({title:$('#eventTitle').value.trim(),date:selectedDay,time:$('#eventTime').value||''});db.set('events',events);showCalendar()};sheetBody.querySelectorAll('[data-event-delete]').forEach(b=>b.onclick=()=>{events.splice(+b.dataset.eventDelete,1);db.set('events',events);showCalendar()})}
$('#calendarLaunch').addEventListener('click',showCalendar);$('#calendarLaunch').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showCalendar()}});
const descriptions={fitness:['Спорт','Здесь позже появится журнал тренировок и статистика.'],travels:['Путешествия','Сохраняй города, страны и места, которые хочешь посетить.'],library:['Библиотека','Личный каталог книг, ссылок и полезных материалов.'],world:['Мой мир','Твоя карта путешествий и личных открытий.']};
function showProgress(){const tasks=db.get('tasks'),goals=db.get('goals'),events=db.get('events'),doneTasks=tasks.filter(x=>x.done).length,doneGoals=goals.filter(x=>x.done).length;openSheet('Твой прогресс',`<p class="muted">Твои результаты в MY WORLD</p><div class="progress-stat"><div class="progress-tile"><b>${doneTasks}/${tasks.length}</b><span>Задачи выполнены</span></div><div class="progress-tile"><b>${doneGoals}/${goals.length}</b><span>Цели достигнуты</span></div><div class="progress-tile"><b>${events.length}</b><span>События в календаре</span></div><div class="progress-tile"><b>${db.get('notes').length}</b><span>Личные заметки</span></div></div><div class="muted">Выполнение задач</div><div class="progress-bar"><i style="width:${tasks.length?doneTasks/tasks.length*100:0}%"></i></div><div class="muted">Достижение целей</div><div class="progress-bar"><i style="width:${goals.length?doneGoals/goals.length*100:0}%"></i></div><p class="muted">Статистика обновляется автоматически, когда ты отмечаешь задачи и цели выполненными.</p>`)}
function showCapsule(){const items=db.get('capsules');openSheet('Капсула времени',`<p class="muted">Напиши послание себе в будущее и выбери дату, когда его можно будет открыть.</p><textarea class="field" id="capsuleText" rows="4" placeholder="Привет, будущий я..." required></textarea><label class="muted">Дата открытия</label><input class="field date-field" id="capsuleDate" type="date" required><button class="primary" id="sealCapsule">Запечатать послание</button>${items.map((x,i)=>`<div class="row-item"><span class="grow">Послание от ${prettyDate(x.date)}</span><button data-open-cap="${i}">${parseDate(x.date)<=new Date()?'Открыть':'Запечатано'}</button></div>`).join('')}`);$('#sealCapsule').onclick=()=>{const text=$('#capsuleText').value,date=$('#capsuleDate').value;if(!text||!date)return;items.push({text,date});db.set('capsules',items);showCapsule()};sheetBody.querySelectorAll('[data-open-cap]').forEach(el=>el.onclick=()=>{const x=items[+el.dataset.openCap];if(parseDate(x.date)>new Date())return;openSheet('Твоё послание',`<p>${escapeHTML(x.text)}</p>`)})}
const siddurReader=$('#siddurReader'),siddurLoading=$('#siddurLoading');
const siddurPageImage=$('#siddurPageImage'),siddurTurner=$('#siddurPageTurner'),siddurTurnFront=$('#siddurTurnFront'),siddurTurnBack=$('#siddurTurnBack');
const siddurPageCount=$('#siddurPageCount'),siddurProgress=$('#siddurProgress'),siddurStage=$('#siddurBookStage');
const SIDDUR_URL='assets/siddur/siddur.pdf',SIDDUR_PAGE_COUNT=18,SIDDUR_PAGE_PATH=i=>`assets/siddur/pages/page-${String(i+1).padStart(2,'0')}.jpg`;
let siddurOpening=false,siddurPage=0,siddurTurning=false,siddurTouchStart=null;
function siddurImageUrl(index){return SIDDUR_PAGE_PATH(index)}
function updateSiddurPage(){
  siddurPageImage.src=siddurImageUrl(siddurPage);
  siddurPageImage.alt=`Страница ${siddurPage+1} из ${SIDDUR_PAGE_COUNT}`;
  siddurPageCount.textContent=`${siddurPage+1} / ${SIDDUR_PAGE_COUNT}`;
  siddurProgress.style.width=`${((siddurPage+1)/SIDDUR_PAGE_COUNT)*100}%`;
  $('#siddurPrev').disabled=siddurPage===0||siddurTurning;
  $('#siddurNext').disabled=siddurPage===SIDDUR_PAGE_COUNT-1||siddurTurning;
  try{localStorage.setItem('my-world-siddur-page',String(siddurPage))}catch(e){}
  [siddurPage-1,siddurPage+1].filter(i=>i>=0&&i<SIDDUR_PAGE_COUNT).forEach(i=>{const im=new Image();im.src=siddurImageUrl(i)});
}
function turnSiddurPage(direction){
  if(siddurTurning)return;
  const target=siddurPage+direction;
  if(target<0||target>=SIDDUR_PAGE_COUNT)return;
  siddurTurning=true;
  siddurTurnFront.src=siddurImageUrl(siddurPage);
  siddurTurnBack.src=siddurImageUrl(target);
  siddurPageImage.src=siddurImageUrl(target);
  siddurTurner.className='siddur-page-turner '+(direction>0?'turn-forward':'turn-backward');
  siddurTurner.getBoundingClientRect();
  requestAnimationFrame(()=>siddurTurner.classList.add('turning'));
  const finish=()=>{
    siddurTurner.removeEventListener('animationend',finish);
    siddurTurner.className='siddur-page-turner';
    siddurPage=target;siddurTurning=false;updateSiddurPage();
  };
  siddurTurner.addEventListener('animationend',finish,{once:true});
  setTimeout(()=>{if(siddurTurning)finish()},760);
}
async function openSiddur(){
  if(siddurOpening)return;siddurOpening=true;closeSheet();
  document.body.classList.add('siddur-open');siddurReader.classList.add('open');siddurReader.setAttribute('aria-hidden','false');
  siddurLoading.textContent='Подготавливаем страницы сидура…';
  try{
    try{const saved=Number(localStorage.getItem('my-world-siddur-page'));if(Number.isInteger(saved)&&saved>=0&&saved<SIDDUR_PAGE_COUNT)siddurPage=saved}catch(e){}
    updateSiddurPage();
    siddurReader.classList.add('ready');
  }catch(err){
    siddurLoading.textContent='Не удалось открыть страницы. Проверь подключение и попробуй ещё раз.';
    siddurReader.classList.remove('ready');
  }finally{siddurOpening=false;}
}
function closeSiddur(){
  siddurReader.classList.remove('open','ready');siddurReader.setAttribute('aria-hidden','true');document.body.classList.remove('siddur-open');
}
$('#siddurLaunch').addEventListener('click',openSiddur);$('#siddurBack').addEventListener('click',closeSiddur);
$('#siddurPrev').addEventListener('click',()=>turnSiddurPage(-1));$('#siddurNext').addEventListener('click',()=>turnSiddurPage(1));
siddurStage.addEventListener('touchstart',e=>{if(e.touches.length===1)siddurTouchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
siddurStage.addEventListener('touchend',e=>{if(!siddurTouchStart)return;const dx=e.changedTouches[0].clientX-siddurTouchStart.x,dy=e.changedTouches[0].clientY-siddurTouchStart.y;siddurTouchStart=null;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.2)turnSiddurPage(dx<0?1:-1)},{passive:true});
siddurStage.addEventListener('click',e=>{if(e.target.closest('button'))return;const rect=siddurStage.getBoundingClientRect(),x=e.clientX-rect.left;if(x<rect.width*.28)turnSiddurPage(-1);else if(x>rect.width*.72)turnSiddurPage(1)});
document.addEventListener('keydown',e=>{if(!siddurReader.classList.contains('open'))return;if(e.key==='ArrowLeft')turnSiddurPage(1);if(e.key==='ArrowRight')turnSiddurPage(-1);if(e.key==='Escape')closeSiddur()});
function showSection(key){if(key==='tasks')return showTasks();if(key==='notes')return showNotes();if(key==='goals')return showGoals();if(key==='capsule')return showCapsule();if(key==='settings')return showSettings();if(key==='progress')return showProgress();if(key==='calendar')return showCalendar();const [title,desc]=descriptions[key]||['Раздел','Скоро здесь появятся новые возможности.'];openSheet(title,`<p class="muted">${desc}</p><span class="pill">MY WORLD</span>`)}
function showSettings(){
  const track=currentCosmicTrack();
  const volume=Number(db.get('musicVolume',35));
  const enabled=!!db.get('musicEnabled',false);
  openSheet('Настройки',`<div class="row-item"><span class="grow">Имя на главном экране</span></div><input class="field" id="nameField" value="${escapeHTML(db.get('name','Шимон'))}" placeholder="Твоё имя"><button class="primary" id="saveName">Сохранить имя</button>
  <div class="music-settings">
    <div class="music-heading"><span class="music-orbit">♫</span><div><b>Космическая музыка</b><small>Три оригинальных саундтрека MY WORLD</small></div></div>
    <button class="primary music-toggle" id="musicToggle">${enabled?'Выключить музыку':'Включить музыку'}</button>
    <label class="music-label" for="musicTrack">Выбрать мелодию</label>
    <select class="field" id="musicTrack">
      <option value="deep-space" ${track==='deep-space'?'selected':''}>Deep Space</option>
      <option value="interstellar" ${track==='interstellar'?'selected':''}>Interstellar</option>
      <option value="cyber-galaxy" ${track==='cyber-galaxy'?'selected':''}>Cyber Galaxy</option>
    </select>
    <div class="music-volume-row"><label class="music-label" for="musicVolume">Громкость</label><output id="musicVolumeValue">${volume}%</output></div>
    <input class="music-range" id="musicVolume" type="range" min="0" max="100" value="${volume}">
    <p class="muted music-hint">Музыка работает офлайн после загрузки и первого запуска. На iPhone воспроизведение запускается нажатием кнопки.</p>
  </div>
  <div class="row-item"><span class="grow">Космический фон</span></div><p class="muted">Загрузи собственную фотографию. Она останется на этом устройстве.</p><button class="primary" id="chooseWallpaper">Выбрать фотографию</button><div class="row-item"><span class="grow">Вернуть исходный космос</span><button id="resetWallpaper">Сбросить</button></div><p class="muted">Данные MY WORLD хранятся локально в браузере на этом устройстве.</p>`);
  $('#saveName').onclick=()=>{db.set('name',$('#nameField').value.trim()||'Друг');$('#userName').textContent=db.get('name');closeSheet()};
  $('#chooseWallpaper').onclick=()=>$('#wallpaperInput').click();
  $('#resetWallpaper').onclick=()=>{localStorage.removeItem('mw_wallpaper');applyWallpaper();closeSheet()};
  $('#musicToggle').onclick=async()=>{const playing=await toggleCosmicMusic();$('#musicToggle').textContent=playing?'Выключить музыку':'Включить музыку'};
  $('#musicTrack').onchange=e=>{setCosmicTrack(e.target.value,cosmicPlaying);};
  $('#musicVolume').oninput=e=>{setCosmicVolume(e.target.value);$('#musicVolumeValue').textContent=e.target.value+'%'};
}
function navigate(key){document.querySelectorAll('.dock-item').forEach(x=>x.classList.toggle('active',x.dataset.route===key));if(key==='home'){closeSheet();return}showSection(key)}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
$('#quickAdd').onclick=()=>{openSheet('Создать новое',`<p class="create-subtitle">Что добавим в твоё пространство?</p><div class="create-grid"><button class="create-card" data-create="calendar"><span class="create-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 9.5h16M12 13v5M9.5 15.5h5"/></svg></span><span><b>Событие</b><small>Встреча или план</small></span><i>›</i></button><button class="create-card" data-create="tasks"><span class="create-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 9l1.5 1.5L12 8M14 9h2M8 15h8"/></svg></span><span><b>Задача</b><small>То, что нужно сделать</small></span><i>›</i></button><button class="create-card" data-create="notes"><span class="create-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg></span><span><b>Заметка</b><small>Мысль или идея</small></span><i>›</i></button><button class="create-card" data-create="goals"><span class="create-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg></span><span><b>Цель</b><small>Твой следующий шаг</small></span><i>›</i></button></div>`);requestAnimationFrame(()=>sheet.classList.add('create-mode'));};
sheetBody.addEventListener('click',e=>{const b=e.target.closest('[data-create]');if(b){sheet.classList.remove('create-mode');showSection(b.dataset.create)}});
const ideas=['Попробуй сегодня новый маршрут.','Выдели 20 минут на то, что давно откладывал.','Запиши одну цель, которая действительно важна.','Открой для себя новое место в своём городе.','Сделай небольшую тренировку и отметь прогресс.','Позвони человеку, с которым давно не общался.'];$('#newIdea').onclick=()=>$('#ideaText').textContent=ideas[Math.floor(Math.random()*ideas.length)];
function applyWallpaper(){const custom=localStorage.getItem('mw_wallpaper');$('#spaceBg').style.backgroundImage=`linear-gradient(180deg,rgba(5,4,15,.22),rgba(5,4,15,.18) 42%,rgba(5,4,15,.52)),url("${custom||'cosmos-wallpaper.jpg'}")`;}
$('#wallpaperInput').onchange=e=>{const file=e.target.files[0];if(!file)return;if(file.size>8*1024*1024){alert('Выбери изображение до 8 МБ.');return}const reader=new FileReader();reader.onload=()=>{try{localStorage.setItem('mw_wallpaper',reader.result);applyWallpaper();closeSheet()}catch{alert('Не удалось сохранить фото. Попробуй изображение меньшего размера.')}};reader.readAsDataURL(file);e.target.value=''};
applyWallpaper();document.body.classList.toggle('cinematic-off',!db.get('cinematicEnabled',true));$('#userName').textContent=db.get('name','Шимон');
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
setTimeout(()=>$('#splash').classList.add('hide'),1900);
