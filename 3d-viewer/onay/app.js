
    // Негізгі функционал: бетті ауыстыру, кері қайту, хабарлама.
    const el = id => document.getElementById(id);
    function openNotifications() {
      el('page-notifications').classList.remove('hidden');
    }
    function closeNotifications() {
      el('page-notifications').classList.add('hidden');
    }

    // Автобус маршруттары: WikiRoutes Алматы және Алматыэлектркөлік каталогтары (23.10.2026 тексерілген).
    // Нөмірлер нақты уақыттағы GPS емес: дерек көзін маршрут бетінде ашуға болады.
    const routeData = {
      bus: `1 2 3 4 5 5А 5Б 5В 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 29Р 30 31 32 33 34 35 36 37 38 38А 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 63А 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 83 84 85 86 87 88 89 90 91 92 93 95 96 97 98 99 100 101 102 103 104 105 106 107 109 110 111 112 113 114 115 116 117 118 119 120 120А 121 122 123 124 125 126 127 128 129 130 131 132 133 133Ш 134 135 136 137 138 139 140 141 142 143Ш 145 201 202 203 204 205 206 207 208 209 210 211 212 213 214 215 216 217 218 219 220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246 247 248 249 250 251 252 254 255 256 257 258 302 305 306`.split(' '),
      trolley: `1 5 6 7 9 11 12 19 25`.split(' '),
      metro: `Райымбек батыр|Жібек жолы|Алмалы|Абай|Байқоңыр|М. Әуезов театры|Алатау|Сайран|Мәскеу|Сарыарқа|Б. Момышұлы`.split('|')
    };
    const routeHighlights = {
       '12':'Алматы-2 теміржол вокзалы — Медеу мұз айдыны',
       '35':'Адем сауда орталығы — Қарасу шағынауданы',
       '87':'Азаматтық авиация академиясы — Горный Гигант',
       '96':'Алматы халықаралық әуежайы — Нұркент',
       '130':'Көктөбе — №7 қалалық аурухана',
       '132':'Ұлжан-1 — Ұлжан-2 — Сайран метро станциясы',
       '134':'Алматы-1 теміржол вокзалы — Төле би / Яссауи',
       '140':'Райымбек батыр метро станциясы — Горный Гигант',
       '145':'Алматы-2 теміржол вокзалы — Гагарин / Жандосов',
       '202':'Алматы — Қаскелең', '230':'Алматы — Қаскелең',
       '256':'Төле би / Яссауи — Шамалған', '249':'Мәдениет және демалыс саябағы — Ақтас'
    };
    let routeCategory='bus',routeDisplay='grid',routeMainTab='transport',routeOnlyFavorites=false;
    let favoriteRouteNumbers=[];
    try {favoriteRouteNumbers=JSON.parse(localStorage.getItem('onay-demo-favorite-routes')||'[]');
       if(!Array.isArray(favoriteRouteNumbers))favoriteRouteNumbers=[];}catch(_){favoriteRouteNumbers=[];}
    function openRoutesPage(){
       el('page-routes').classList.remove('hidden'); renderRoutes();
    }
    function closeRoutesPage(){hideRouteDetail();el('page-routes').classList.add('hidden');}
    function openQrFromRoutes(){closeRoutesPage();openQrPage('scan');}
    function selectRouteMainTab(tab){
      routeMainTab=tab==='trip'?'trip':'transport';
      const isTrip=routeMainTab==='trip';
      el('route-tab-transport').classList.toggle('active',!isTrip);
      el('route-tab-trip').classList.toggle('active',isTrip);
      el('route-search-categories').hidden=isTrip;
      el('route-main-area').hidden=isTrip;
      el('route-trip-view').hidden=!isTrip;
      if(!isTrip)renderRoutes();
    }
    function chooseRouteCategory(cat){
      routeCategory=cat;
      ['bus','trolley','metro'].forEach(item=>{
        const btn=el('route-category-'+item);
        btn.classList.toggle('active',item===cat);
        btn.setAttribute('aria-selected',String(item===cat));
      });
      el('route-catalog-scroll').scrollTop=0;
      renderRoutes();
    }
    function routeNormalize(text){return String(text).toUpperCase().replaceAll('A','А').replaceAll('B','В').replaceAll('P','Р').replaceAll('Ш','Ш').replace(/\s+/g,'');}
    function renderRoutes(){
       const q=routeNormalize(el('route-search').value.trim());
       el('route-clear-search').style.display=q?'inline-block':'none';
       const items=routeData[routeCategory].filter(num=>(!q||routeNormalize(num).includes(q))&&
         (!routeOnlyFavorites||favoriteRouteNumbers.includes(routeCategory+':'+num)));
       const grid=el('route-number-grid');
       grid.replaceChildren();
       grid.classList.toggle('list-view',routeDisplay==='list');
       for(const num of items){
          const tile=document.createElement('button');
          tile.type='button';tile.className='route-tile';tile.textContent=num;
          tile.setAttribute('aria-label',(routeCategory==='bus'?'Автобус ':routeCategory==='trolley'?'Троллейбус ':'Метро ')+num);
          tile.onclick=()=>showRouteDetail(num);
          grid.appendChild(tile);
       }
       el('route-no-results').hidden=items.length!==0;
       el('route-fav-mark').style.fill=routeOnlyFavorites?'currentColor':'none';
    }
    function filterRoutes(){el('route-catalog-scroll').scrollTop=0;renderRoutes();}
    function clearRouteSearch(){el('route-search').value='';filterRoutes();}
    function resetRoutes(){
      el('route-search').value='';routeOnlyFavorites=false;
      routeDisplay='grid';el('route-layout-label').textContent='Тізім';
      selectRouteMainTab('transport');chooseRouteCategory('bus');
      showToast('Алматы маршруттарының анықтамалық тізімі');
    }
    function toggleRouteLayout(){
      routeDisplay=routeDisplay==='grid'?'list':'grid';
      el('route-layout-label').textContent=routeDisplay==='grid'?'Тізім':'Тор';renderRoutes();
    }
    function toggleRouteFavorites(){
      routeOnlyFavorites=!routeOnlyFavorites;
      renderRoutes();
      if(routeOnlyFavorites && !favoriteRouteNumbers.length) showToast('Таңдаулы бағыт әлі сақталмаған');
    }
    function filterFavoriteRoutes(type){
      document.getElementById('route-fav-'+type).classList.toggle('active');
      showToast('Жеке мекенжайды қосу демо-нұсқада іске қосылмаған');
    }
    function showRouteDetail(num){
      const catName=routeCategory==='bus'?'Автобус':routeCategory==='trolley'?'Троллейбус':'Метро';
      el('route-detail-title').textContent=catName+(routeCategory==='metro'?' — ':' №')+num;
      const text=routeCategory==='metro'?'Алматы метросының бекеті. Толық мәлімет ресми Метрополитен сайтында.':
          routeHighlights[num]||'Алматы қаласының қоғамдық көлік бағыттарының анықтамалық тізімінде көрсетілген маршрут. Нақты қозғалыс бағыты мен уақытын сыртқы сервистен тексеріңіз.';
      const key=routeCategory+':'+num;
      el('route-detail-description').textContent=text;
      const link=el('route-detail-link');
      link.href=routeCategory==='metro'?'https://metroalmaty.kz/kk/stations':'https://ru.wikiroutes.info/almaty/catalog';
      link.textContent=routeCategory==='metro'?'Метроның ресми сайты':'Бағытты интернеттен қарау ↗';
      let fav=el('route-detail-favorite');
      if(!fav){fav=document.createElement('button'); fav.type='button';fav.id='route-detail-favorite';
        fav.className='route-detail-link';fav.style.cssText='margin-top:10px;background:#f4f5f9';
        link.parentNode.appendChild(fav);}
      fav.textContent=favoriteRouteNumbers.includes(key)?'★ Таңдаулыдан алып тастау':'☆ Таңдаулыға қосу';
      fav.onclick=()=>{
         if(favoriteRouteNumbers.includes(key))favoriteRouteNumbers=favoriteRouteNumbers.filter(x=>x!==key);
         else favoriteRouteNumbers.push(key);
         try{localStorage.setItem('onay-demo-favorite-routes',JSON.stringify(favoriteRouteNumbers));}catch(_){}
         hideRouteDetail();renderRoutes();showToast('Таңдаулылар жаңартылды');
      };
      el('route-detail-overlay').hidden=false;
    }
    function hideRouteDetail(){el('route-detail-overlay').hidden=true;}
    function openTripMap(){
      const a=el('route-trip-from').value.trim(), b=el('route-trip-to').value.trim();
      if(!a||!b){showToast('Қайдан және қайда баратыныңызды енгізіңіз');return;}
      // 2GIS бетін қала/маршрут іздеу сұрауымен ашады; демода нақты қозғалыс есептелмейді.
      window.open('https://2gis.kz/almaty/search/'+encodeURIComponent(a+' → '+b),'_blank','noopener,noreferrer');
    }


    // Карта және орталық жарнама слайдері
    const cardSlidesData = [
      {title:'Virtual', badge:'Балалар', balance:'80', rides:'1 жол жүру, Алматы', theme:'blue'},
      {title:'Virtual', badge:'Бірыңғай', balance:'0', rides:'0 жол жүру, Алматы', theme:'purple'},
      {title:'Virtual', badge:'Студенттік', balance:'240', rides:'3 жол жүру, Алматы', theme:'yellow'}
    ];
    const promoSlidesData = [
      {src: 'assets/promo-01.png', alt: 'ONAY жарнамасы 1'},
      {src: 'assets/promo-02.png', alt: 'ONAY жарнамасы 2'},
      {src: 'assets/promo-03.png', alt: 'ONAY жарнамасы 3'},
      {src: 'assets/promo-04.png', alt: 'ONAY жарнамасы 4'},
      {src: 'assets/promo-05.png', alt: 'ONAY жарнамасы 5'},
      {src: 'assets/promo-06.png', alt: 'ONAY жарнамасы 6'},
      {src: 'assets/promo-07.png', alt: 'ONAY жарнамасы 7'}
    ];
    let activeCardIndex = 0;
    let activePromoIndex = 0;
    let promoAutoTimer = null;

    function cardWatermarkSvg() {
      return `<svg class="onay-card-watermark" viewBox="0 0 330 200" aria-hidden="true"><path d="M327 8C241-12 151 24 101 94C73 131 73 170 94 200H319C362 141 369 61 327 8Z" fill="#47a9e0" opacity=".22"/><path d="M270 41C189 54 154 113 156 138C158 164 206 147 230 147L212 170L247 199L320 123L248 54L220 75Z" fill="#99dbf7" opacity=".21"/></svg>`;
    }
    function renderCardSlides() {
      const track = el('onay-card-track');
      const dots = el('onay-card-dots');
      track.innerHTML = cardSlidesData.map((card, index) => `
        <div class="onay-card-slide" data-card-index="${index}">
          <div class="onay-main-card theme-${card.theme}">
            ${cardWatermarkSvg()}
            <div class="onay-card-header">
              <div class="onay-card-type">
                <div class="onay-virtual-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.3 15 8.5l6.9 1-5 5 .9 7-5.8-3.1-5.8 3.1.9-7-5-5 6.9-1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>${card.title}</div>
                <span class="onay-kids">${card.badge}</span>
              </div>
              <div class="onay-card-right">
                <div class="onay-balance-row"><span>${card.balance}</span><span>₸</span><button type="button" aria-label="Картаны толықтыру" class="onay-card-square" onclick="openTopUpPage()"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
                <div class="onay-ride-count">${card.rides}</div>
              </div>
            </div>
            <div class="onay-card-footer">
              <button type="button" onclick="openQrPage('create')" class="onay-show-qr"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3h7v7H3V3Zm2 2v3h3V5H5Zm9-2h7v7h-7V3Zm2 2v3h3V5h-3ZM3 14h7v7H3v-7Zm2 2v3h3v-3H5Zm9-2v3h3v-3h-3Zm5 0h2v2h-2zm-5 5h2v2h-2zm4-1h3v3h-3z" fill="currentColor"/></svg>QR көрсету</button>
              <button type="button" aria-label="Карта баптаулары" onclick="showToast('Карта баптаулары')" class="onay-card-square onay-next"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 4 8 8-8 8" stroke="currentColor" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </div>
        </div>`).join('');
      dots.innerHTML = cardSlidesData.map((_, index) => `<span class="onay-dot${index===0?' active':''}" role="button" aria-label="${index+1}-карта" onclick="setCardSlide(${index})"></span>`).join('');
      setupHorizontalSwipe(el('onay-card-slider'), (dir)=>setCardSlide(activeCardIndex + dir));
      updateCardSlide(false);
    }
    function setCardSlide(index) {
      // Картаны тек пайдаланушы өзі свайп жасағанда/нүктеге басқанда ауыстырады.
      const total = cardSlidesData.length;
      activeCardIndex = (index % total + total) % total;
      updateCardSlide();
    }
    function updateCardSlide() {
      const track = el('onay-card-track');
      const slide = track.querySelector('.onay-card-slide');
      if (!slide) return;
      const gap = 10;
      const move = activeCardIndex * (slide.getBoundingClientRect().width + gap);
      track.style.transform = `translateX(-${move}px)`;
      const dots = [...el('onay-card-dots').children];
      dots.forEach((dot, i) => {
        dot.className = 'onay-dot' + (i === activeCardIndex ? ' active' : '');
        if (i === activeCardIndex && cardSlidesData[activeCardIndex].theme === 'purple') dot.classList.add('theme-purple-active');
        if (i === activeCardIndex && cardSlidesData[activeCardIndex].theme === 'yellow') dot.classList.add('theme-yellow-active');
      });
      el('main-balance-text').textContent = cardSlidesData[activeCardIndex].balance;
    }
    function renderPromoSlides() {
      const track = el('onay-promo-track');
      track.innerHTML = promoSlidesData.map(item => `<div class="onay-promo-slide"><img src="${item.src}" alt="${item.alt}" class="onay-promo" /></div>`).join('');
      setupHorizontalSwipe(el('onay-promo-slider'), (dir)=>setPromoSlide(activePromoIndex + dir));
      updatePromoSlide();
    }
    function setPromoSlide(index, restart = true) {
      const total = promoSlidesData.length;
      activePromoIndex = (index % total + total) % total;
      updatePromoSlide();
      if (restart) restartPromoAuto();
    }
    function updatePromoSlide() {
      const track = el('onay-promo-track');
      track.style.transform = `translateX(-${activePromoIndex * 100}%)`;
    }
    function nextPromoAuto() {
      setPromoSlide(activePromoIndex + 1, false);
    }
    function restartPromoAuto() {
      clearInterval(promoAutoTimer);
      promoAutoTimer = setInterval(nextPromoAuto, 3200);
    }
    function setupHorizontalSwipe(container, onStep) {
      if (!container) return;
      let startX = 0, startY = 0, dragging = false;
      container.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        startX = t.clientX; startY = t.clientY; dragging = true;
      }, {passive:true});
      container.addEventListener('touchend', e => {
        if (!dragging) return;
        dragging = false;
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) onStep(dx > 0 ? -1 : 1);
      }, {passive:true});
    }
    function initCardPromoSliders() {
      renderCardSlides();
      renderPromoSlides();
      // Тек ортасындағы жарнама автоматты ауысады.
      restartPromoAuto();
      window.addEventListener('resize', updateCardSlide);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearInterval(promoAutoTimer);
        else restartPromoAuto();
      });
    }

    // Қойындыларды ауыстыру: басқа карталарға басқанда нақты экран ашылады.
    function setCardsTab(tab) {
      const isOther = tab === 'other';
      setMainFeedExpanded(false);
      el('my-cards-panel').hidden = isOther;
      el('other-cards-panel').hidden = !isOther;
      el('tab-my-cards').classList.toggle('active', !isOther);
      el('tab-other-cards').classList.toggle('active', isOther);
      el('tab-my-cards').setAttribute('aria-selected', String(!isOther));
      el('tab-other-cards').setAttribute('aria-selected', String(isOther));
      el('page-main').classList.toggle('show-other', isOther);
      closeOtherCardModal();
    }
    function openOtherCardModal(mode) {
      const help = mode === 'help';
      el('other-modal-title').textContent = help ? 'Қалай жұмыс істейді?' : 'Картаны қосу';
      el('other-modal-text').textContent = help
        ? 'Бұл бөлімде жақындарыңыздың ONAY! карталарын қоса аласыз. Картаны қосқаннан кейін оның балансын бақылау және толықтыру мүмкін болады. Бұл бет — интерфейс демосы.'
        : 'Жақын адамыңыздың ONAY! картасының нөмірін енгізіңіз. Бұл демода нақты карта қосылмайды.';
      el('other-card-number').hidden = help;
      el('other-modal-continue').hidden = help;
      el('other-card-modal').hidden = false;
      if (!help) el('other-card-number').focus();
    }
    function closeOtherCardModal() { el('other-card-modal').hidden = true; }
    function submitOtherCard() {
      const number = el('other-card-number').value.replace(/\D/g, '');
      if (number.length < 6) { showToast('Карта нөмірін дұрыс енгізіңіз'); return; }
      closeOtherCardModal();
      showToast('Бұл демо-нұсқа: нақты карта қосылмайды');
    }
    function openTransferPage() { el('page-transfer').classList.remove('hidden'); }
    function closeTransferPage() { el('page-transfer').classList.add('hidden'); }
    let currentTopupTab = 'manual';
    let autoTopupEnabled = false;
    let selectedTopupCardIndex = 0;
    function openTopUpPage(tab = 'manual') {
      el('page-topup').classList.remove('hidden');
      switchTopupTab(tab);
      refreshTopupCardInfo();
    }
    function closeTopUpPage() { el('page-topup').classList.add('hidden'); }
    function setTopupCard(index) {
      selectedTopupCardIndex = index;
      refreshTopupCardInfo();
    }
    function refreshTopupCardInfo(){
      const balanceEl = el('topup-card-balance-main');
      if (balanceEl) balanceEl.textContent = selectedTopupCardIndex === 0 ? '80' : '0';
    }
    function switchTopupTab(tab){
      currentTopupTab = tab;
      const isManual = tab === 'manual';
      el('tab-topup-manual')?.classList.toggle('active', isManual);
      el('tab-topup-auto')?.classList.toggle('active', !isManual);
      el('topup-manual-panel')?.classList.toggle('hidden', !isManual);
      el('topup-auto-panel')?.classList.toggle('hidden', isManual);
      if (!isManual) updateAutoTopupView();
    }
    function setQuickAmount(sum) { el('amount-input-field').value = sum; }
    function processTopUpPayment() {
      const sum = Number(el('amount-input-field').value);
      if (!Number.isFinite(sum) || sum < 200) { showToast('Ең аз сома — 200 ₸'); return; }
      showToast('Толықтыру интерфейсі дайын. Бұл демо-нұсқа.');
    }
    function toggleAutoTopup(forceValue = null){
      autoTopupEnabled = forceValue === null ? !autoTopupEnabled : !!forceValue;
      updateAutoTopupView();
    }
    function updateAutoTopupView(){
      const sw = el('autotopup-switch');
      sw?.classList.toggle('on', autoTopupEnabled);
      sw?.setAttribute('aria-pressed', autoTopupEnabled ? 'true' : 'false');
      el('autotopup-off-content')?.classList.toggle('hidden', autoTopupEnabled);
      el('autotopup-on-content')?.classList.toggle('hidden', !autoTopupEnabled);
    }
    function saveAutoTopup(){
      const threshold = Number(el('auto-threshold-input').value);
      const amount = Number(el('auto-amount-input').value);
      if (!Number.isFinite(threshold) || threshold < 80) { showToast('Ең аз шек — 80 ₸'); return; }
      if (!Number.isFinite(amount) || amount < 200) { showToast('Ең аз толықтыру — 200 ₸'); return; }
      showToast('Автотолықтыру интерфейсі дайын. Бұл демо-нұсқа.');
    }
    let toastTimer;
    function showToast(message) {
      const toast = el('toast'); toast.textContent=message; toast.classList.remove('hidden');
      clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.add('hidden'), 2800);
    }
    let qrStream = null;
    let qrTorchOn = false;
    let qrCameraStarting = false;
    let qrCameraRequestId = 0;
    function qrCameraMessage(message, showRetry = true) {
      el('qr-camera-status-text').textContent = message;
      el('qr-camera-retry').hidden = !showRetry;
      el('qr-camera-status').hidden = false;
    }
    function hideQrCameraMessage() { el('qr-camera-status').hidden = true; }


    // Метроға төлеу үшін картаны таңдаудың интерфейстік демосы.
    // QR суретіне/мәніне ешқандай өзгеріс жасалмайды.
    let selectedMetroCardIndex = 0;
    const metroSelectableCards = [
      {name:'Virtual', balance:80, color:'blue'},
      {name:'Virtual', balance:0, color:'purple'}
    ];
    let activeChooserContext = 'metro';
    function openSourceChooser(context='metro'){ activeChooserContext = context; openMetroCardChooser(); }
    function openMetroCardChooser(){
      const overlay=el('metro-card-chooser');
      if(!overlay) return;
      syncMetroChooser();
      overlay.hidden=false;
      // choice gets keyboard focus after opening
      el('metro-card-option-'+selectedMetroCardIndex)?.focus({preventScroll:true});
    }
    function closeMetroCardChooser(){
      const overlay=el('metro-card-chooser');
      if(!overlay) return;
      overlay.hidden=true;
    }
    function syncMetroChooser(){
      metroSelectableCards.forEach((card,i)=>{
        const option=el('metro-card-option-'+i);
        if (!option) return;
        option.classList.toggle('selected',i===selectedMetroCardIndex);
        option.setAttribute('aria-checked',String(i===selectedMetroCardIndex));
      });
    }
    function updateMetroSelectedCard(){
      const card=metroSelectableCards[selectedMetroCardIndex];
      if (!card) return;
      el('qr-card-balance').textContent=String(card.balance);
      el('qr-card-name').textContent=card.name;
      const cardIcon=el('qr-card-icon');
      cardIcon.classList.toggle('is-blue',selectedMetroCardIndex===0);
      cardIcon.classList.toggle('is-purple',selectedMetroCardIndex===1);
      syncMetroChooser();
    }

    // ONAY дизайн үлгісінің жұмыс істейтін ақпараттық терезелері.
    function openCodePayHelp(){
      const panel=el('codepay-help-overlay');
      panel.hidden=false;
      panel.querySelector('.codepay-help-ok')?.focus({preventScroll:true});
    }
    function closeCodePayHelp(){el('codepay-help-overlay').hidden=true;}
    function openMonthlyRules(){
      const panel=el('monthly-rules-overlay');
      panel.hidden=false;
      panel.querySelector('.monthly-rules-close')?.focus({preventScroll:true});
    }
    function closeMonthlyRules(){el('monthly-rules-overlay').hidden=true;}
    function openTicketsSheet(){el('tickets-sheet-overlay').hidden=false;}
    function closeTicketsSheet(){el('tickets-sheet-overlay').hidden=true;}
    function updateCodepaySelectedCard(){
      const card=metroSelectableCards[selectedMetroCardIndex];
      if(!card) return;
      const bal=el('codepay-balance');
      const icon=el('codepay-card-icon');
      const needs=el('codepay-needs-topup');
      if(bal) bal.textContent=String(card.balance);
      if(icon){
        const mini=icon.querySelector('.mini-virtual-icon');
        if(mini) mini.style.background=(card.color==='purple'?'#c6a3f7':'#78c2ec');
      }
      if(needs) needs.hidden=card.balance>0;
    }

    function selectMetroCard(index){
      if(index!==0 && index!==1) return;
      selectedMetroCardIndex=index;
      updateMetroSelectedCard();
      updateCodepaySelectedCard();
      closeMetroCardChooser();
    }

    function openQrPage(tab='scan') {
      el('page-qr').classList.remove('hidden');
      setQrTab(tab);
    }
    function closeQrPage() {
      closeMetroCardChooser();
      closeQrZoom(); closeQrManual();
      el('page-qr').classList.add('hidden');
      stopQrCamera();
    }
    function showQrModal() { openQrPage('scan'); }
    function hideQrModal() { closeQrPage(); }
    function setQrTab(tab) {
      const scan = tab !== 'create';
      el('qr-tab-scan').classList.toggle('active', scan);
      el('qr-tab-create').classList.toggle('active', !scan);
      el('qr-tab-scan').setAttribute('aria-selected', String(scan));
      el('qr-tab-create').setAttribute('aria-selected', String(!scan));
      el('qr-scanner').hidden = !scan;
      el('qr-create').hidden = scan;
      closeQrZoom(); closeQrManual();
      if (scan && !el('page-qr').classList.contains('hidden')) startQrCamera();
      else stopQrCamera();
      updateMetroSelectedCard();
    }
    function cameraTabIsOpen() {
      return !el('page-qr').classList.contains('hidden') && !el('qr-scanner').hidden;
    }
    async function startQrCamera() {
      if (!cameraTabIsOpen() || qrCameraStarting || qrStream) return;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        qrCameraMessage('Тікелей камера бұл ашылу тәсілінде жұмыс істемейді. Файлды content:// арқылы ашқанда Chrome камераға рұқсат бере алмайды.\n\nТірі камера үшін бетті HTTPS не http://localhost арқылы ашыңыз. Төмендегі батырма телефон камерасын фотоға ашады.',false);
        return;
      }
      const id=++qrCameraRequestId;
      qrCameraStarting=true;
      qrCameraMessage('Камераға рұқсат беріңіз. Chrome сұраса, «Рұқсат ету» батырмасын басыңыз.',false);
      let stream;
      try {
        try {
          stream=await navigator.mediaDevices.getUserMedia({
            audio:false,
            video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}
          });
        } catch (e) {
          // Кейбір телефондарда facingMode / өлшемге шектеу жасалады.
          if (!['OverconstrainedError','NotFoundError'].includes(e.name)) throw e;
          stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        }
        if (!cameraTabIsOpen() || id !== qrCameraRequestId) {
          stream.getTracks().forEach(t=>t.stop()); return;
        }
        const video=el('qr-camera');
        video.srcObject=stream;
        await video.play();
        if (!cameraTabIsOpen() || id !== qrCameraRequestId) {
          stream.getTracks().forEach(t=>t.stop()); video.srcObject=null; return;
        }
        qrStream=stream;
        hideQrCameraMessage();
        // Егер камераны жүйеден өшірсе, нәтижесін жасырмаймыз.
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          if (qrStream === stream) {
            stopQrCamera();
            if (cameraTabIsOpen()) qrCameraMessage('Камера тоқтады. Қайта қосып көріңіз.');
          }
        },{once:true});
      } catch(e) {
        stream?.getTracks().forEach(t=>t.stop());
        console.warn('QR camera:', e.name, e.message);
        if (id !== qrCameraRequestId || !cameraTabIsOpen()) return;
        let message='Камераны іске қосу мүмкін болмады. Қайта қосып көріңіз.';
        if (['NotAllowedError','PermissionDeniedError','SecurityError'].includes(e.name))
          message='Камера рұқсаты берілмеді. Chrome → Сайт параметрлері → Камера бөлімінен рұқсат беріп, қайталаңыз.';
        else if (['NotFoundError','DevicesNotFoundError'].includes(e.name))
          message='Телефонда қолжетімді камера табылмады.';
        else if (['NotReadableError','TrackStartError','AbortError'].includes(e.name))
          message='Камераны басқа қолданба пайдаланып жатқан болуы мүмкін. Оны жауып, қайталаңыз.';
        qrCameraMessage(message);
      } finally {
        if (id === qrCameraRequestId) qrCameraStarting=false;
      }
    }
    function stopQrCamera() {
      ++qrCameraRequestId; qrCameraStarting=false;
      if(qrStream) {qrStream.getTracks().forEach(t=>t.stop());qrStream=null;}
      el('qr-camera').pause();
      el('qr-camera').srcObject=null;
      qrTorchOn=false;
      el('qr-torch').classList.add('off');
      hideQrCameraMessage();
    }
    async function toggleQrTorch() {
      const track=qrStream?.getVideoTracks()?.[0];
      const caps=track?.getCapabilities?.();
      if(!track || !caps?.torch){showToast('Бұл құрылғыда жарқыл қолжетімсіз');return;}
      try {
        qrTorchOn=!qrTorchOn;
        await track.applyConstraints({advanced:[{torch:qrTorchOn}]});
        el('qr-torch').classList.toggle('off', !qrTorchOn);
      }catch(e){qrTorchOn=false;showToast('Жарқылды қосу мүмкін болмады');}
    }
    // content:// (жергілікті HTML) аша алмайтын кезде кемінде Android камера қолданбасын шақырады.
    // Бұл фототүсіру баламасы, нақты уақыттағы QR сканер емес.
    function openNativeQrCamera() { el('qr-native-photo').click(); }
    function onNativeQrPhoto(event) {
      const file=event.target.files?.[0];
      if (!file) return;
      qrCameraMessage('Камера сурет түсірді. Бұл — фото режимі; нақты уақыттағы сканер үшін HTTPS немесе localhost қажет.');
      event.target.value='';
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopQrCamera();
      else if (cameraTabIsOpen()) startQrCamera();
    });

    function openQrZoom(){el('qr-zoom').hidden=false;}
    function closeQrZoom(){el('qr-zoom').hidden=true;}
    function openQrManual(){ closeQrPage(); openCodePayPage(); setTimeout(()=>el('codepay-input')?.focus(), 30); }
    function closeQrManual(){el('qr-manual').hidden=true;}
    function submitQrManual(){
      const value=el('qr-manual-input').value.trim();
      if(!value){showToast('Кодты енгізіңіз');return;}
      closeQrManual();
      openCodePayPage();
      el('codepay-input').value = value;
    }

    function openCodePayPage(){ el('page-codepay').classList.remove('hidden'); }
    function closeCodePayPage(){ closeCodePayHelp(); el('page-codepay').classList.add('hidden'); }
    function openMyTicketsPage(){ el('page-my-tickets').classList.remove('hidden'); }
    function closeMyTicketsPage(){ el('page-my-tickets').classList.add('hidden'); }
    function openMonthlyPassPage(){const page=el('page-monthly-pass');page.querySelector('.monthly-sheet').style.transform='';page.classList.remove('hidden');}
    function closeMonthlyPassPage(){closeMonthlyRules();const page=el('page-monthly-pass');page.classList.add('hidden');page.querySelector('.monthly-sheet').style.transform='';}
    function submitCodePayment(){
      const value = el('codepay-input').value.trim();
      if(!value){ showToast('Көлік кодын енгізіңіз'); return; }
      showToast('Демо-нұсқа: төлем жасалмайды');
    }


    // Карталар бетіндегі жарнамалар панелі: төменнен жоғары сырғыту немесе басу.
    let mainFeedExpanded = false;
    function setMainFeedExpanded(expanded){
      const sheet=el('cards-peek-sheet');
      if (!sheet) return;
      mainFeedExpanded = !!expanded;
      sheet.classList.toggle('expanded',mainFeedExpanded);
      sheet.querySelector('.cards-feed-pull').setAttribute('aria-expanded',String(mainFeedExpanded));
      if(!mainFeedExpanded) el('cards-feed-scroll').scrollTop=0;
    }
    function toggleMainFeed(){setMainFeedExpanded(!mainFeedExpanded);}
    // Ашық жарнама панелін жоғарыдан төмен сырғытып жабу (Android touch/pointer).
    // Тізімнің ортасында сырғыту қалыпты скролл, басында төмен тарту жабады.
    let lastFeedSwipeTime = 0;
    function initMainFeed(){
      const sheet = el('cards-peek-sheet');
      const handle = el('cards-feed-pull');
      const feed = el('cards-feed-scroll');
      if(!sheet || !handle || !feed) return;
      const nav = el('cards-top-nav');
      const refreshHeader=()=>document.documentElement.style.setProperty('--cards-header-height',(nav?.getBoundingClientRect().height||56)+'px');
      refreshHeader(); window.addEventListener('resize',refreshHeader);

      // Ұзақ басып сырғытқаннан кейін пайда болатын click өңдеушісі панельді кері ашпасын.
      handle.removeAttribute('onclick');
      handle.addEventListener('click', e => {
        if(performance.now() - lastFeedSwipeTime < 350){ e.preventDefault(); return; }
        toggleMainFeed();
      });

      const snapBack=()=>{
        sheet.style.transition='transform 190ms ease-out, height .3s ease, border-radius .3s ease';
        sheet.style.transform='';
        window.setTimeout(()=>sheet.style.removeProperty('transition'),210);
      };
      // Жоғарғы ақ тұтқаны басып ұстап, төменге сүйресең — жабылады.
      let gesture=null;
      handle.addEventListener('pointerdown',e=>{
        if(e.button!==undefined && e.button!==0)return;
        gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dy:0,moved:false};
        try {handle.setPointerCapture(e.pointerId);}catch(_){ }
      });
      handle.addEventListener('pointermove',e=>{
        if(!gesture || e.pointerId!==gesture.id)return;
        const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
        if(Math.abs(dy)<Math.abs(dx))return;
        gesture.dy=dy;
        if(Math.abs(dy)>8)gesture.moved=true;
        if(gesture.moved && mainFeedExpanded && dy>0){
          sheet.style.transition='none';
          sheet.style.transform=`translateY(${Math.min(dy,280)}px)`;
        }
      });
      const finishHandle=e=>{
        if(!gesture||e.pointerId!==gesture.id)return;
        const {dy,moved}=gesture;gesture=null;
        if(moved&&Math.abs(dy)>48){
          lastFeedSwipeTime=performance.now();
          setMainFeedExpanded(dy<0);
        }
        snapBack();
      };
      handle.addEventListener('pointerup',finishHandle);
      handle.addEventListener('pointercancel',finishHandle);

      // Жарнамаларды төмен тартып жабу (толық ашылғанда), ал алдын ала көріністі
      // жоғары тартып ашу (жабықта). Қалыпты тізім скроллын бұзбайды.
      let touch=null;
      sheet.addEventListener('touchstart',e=>{
        if(e.target.closest('.cards-feed-pull') || e.touches.length!==1){touch=null;return;}
        const t=e.touches[0];
        touch={x:t.clientX,y:t.clientY,dy:0,canClose:mainFeedExpanded&&feed.scrollTop<=2,canOpen:!mainFeedExpanded,pulling:false};
      },{passive:true});
      sheet.addEventListener('touchmove',e=>{
        if(!touch||e.touches.length!==1)return;
        const t=e.touches[0],dy=t.clientY-touch.y,dx=t.clientX-touch.x;
        touch.dy=dy;
        if(Math.abs(dx)>Math.abs(dy)||Math.abs(dy)<8)return;
        if((touch.canClose&&dy>0)||(touch.canOpen&&dy<0)){
          touch.pulling=true;
          if(e.cancelable)e.preventDefault();
          sheet.style.transition='none';
          sheet.style.transform=`translateY(${Math.max(-65,Math.min(270,dy))}px)`;
        }
      },{passive:false});
      sheet.addEventListener('touchend',e=>{
        if(!touch)return;
        const {dy,pulling,canClose,canOpen}=touch;touch=null;
        if(pulling&&Math.abs(dy)>58){
          lastFeedSwipeTime=performance.now();
          if(canClose&&dy>0)setMainFeedExpanded(false);
          else if(canOpen&&dy<0)setMainFeedExpanded(true);
        }
        snapBack();
      },{passive:true});
      sheet.addEventListener('touchcancel',()=>{touch=null;snapBack();},{passive:true});
      // Жабық панельдегі көріністі бір басу да оны ашады.
      sheet.addEventListener('click',e=>{
        if(mainFeedExpanded||e.target.closest('.cards-feed-pull'))return;
        if(performance.now()-lastFeedSwipeTime<350)return;
        setMainFeedExpanded(true);
      });
    }

    // Айлық абонементті саусақпен төмен сырғытып жабу.
    // Handle және жоғарғы тақырып тұсы gesture үшін қолжетімді.
    let monthlyDrag={active:false,start:0,last:0,moved:false,suppressClick:false,id:null};
    function onMonthlyHandleClick(event){
      if(monthlyDrag.suppressClick){monthlyDrag.suppressClick=false;event.preventDefault();return;}
      closeMonthlyPassPage();
    }
    function initMonthlySwipe(){
      const page=el('page-monthly-pass');
      const sheet=page?.querySelector('.monthly-sheet');
      if(!page || !sheet)return;
      const targets=[el('monthly-drag-handle'),sheet.querySelector('.monthly-topbar')].filter(Boolean);
      targets.forEach(t=>{
        t.style.touchAction='none';
        t.addEventListener('pointerdown', e=>{
          if(e.target.closest('.monthly-help'))return;
          monthlyDrag.active=true;monthlyDrag.start=e.clientY;monthlyDrag.last=0;monthlyDrag.moved=false;monthlyDrag.id=e.pointerId;
          sheet.classList.remove('drag-return');sheet.classList.add('dragging');
          try{t.setPointerCapture(e.pointerId);}catch(_){ }
        });
        t.addEventListener('pointermove',e=>{
          if(!monthlyDrag.active || monthlyDrag.id!==e.pointerId)return;
          const dy=Math.max(0,e.clientY-monthlyDrag.start);
          monthlyDrag.last=dy;if(dy>8)monthlyDrag.moved=true;
          sheet.style.transform=`translateY(${dy}px)`;
        });
        const finish=e=>{
          if(!monthlyDrag.active || monthlyDrag.id!==e.pointerId)return;
          monthlyDrag.active=false;
          const dy=monthlyDrag.last;
          sheet.classList.remove('dragging');
          if(dy>75){
            monthlyDrag.suppressClick=true;
            closeMonthlyPassPage();sheet.style.transform='';
            setTimeout(()=>monthlyDrag.suppressClick=false,250);
          }else{
            sheet.classList.add('drag-return');sheet.style.transform='translateY(0px)';
            setTimeout(()=>{sheet.classList.remove('drag-return');sheet.style.transform='';},240);
          }
        };
        t.addEventListener('pointerup',finish);
        t.addEventListener('pointercancel',finish);
      });
      const backdrop=page.querySelector('.monthly-overlay');
      backdrop?.addEventListener('click',e=>{if(e.target===backdrop)closeMonthlyPassPage();});
    }

    initMainFeed();
    initMonthlySwipe();
    initCardPromoSliders();
    updateMetroSelectedCard();
    updateCodepaySelectedCard();

    // Android қайту батырмасы немесе браузер Escape.
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' || (e.key === 'Backspace' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))) {
        if(!el('metro-card-chooser').hidden){closeMetroCardChooser();return;}
        if(!el('codepay-help-overlay').hidden){closeCodePayHelp();return;}
        if(!el('monthly-rules-overlay').hidden){closeMonthlyRules();return;}
        if(!el('tickets-sheet-overlay').hidden){closeTicketsSheet();return;}
        if (mainFeedExpanded) { setMainFeedExpanded(false); return; }
        if (!el('page-notifications').classList.contains('hidden')) { closeNotifications(); return; }
        if (!el('page-routes').classList.contains('hidden')) { if (!el('route-detail-overlay').hidden) hideRouteDetail(); else closeRoutesPage(); return; }
        if (!el('page-codepay').classList.contains('hidden')) { closeCodePayPage(); return; }
        if (!el('page-my-tickets').classList.contains('hidden')) { closeMyTicketsPage(); return; }
        if (!el('page-monthly-pass').classList.contains('hidden')) { closeMonthlyPassPage(); return; }
        closeTransferPage(); closeTopUpPage(); closeQrPage(); closeOtherCardModal();
      }
    });
  