const CRYPTO_MAP={'BTC':'BTC','BITCOIN':'BTC','БИТКОИН':'BTC','БИТОК':'BTC','ETH':'ETH','ETHEREUM':'ETH','ЭФИРИУМ':'ETH','ЭФИР':'ETH','USDT':'USDT','TETHER':'USDT','ТЕЗЕР':'USDT','BNB':'BNB','BINANCECOIN':'BNB','SOL':'SOL','SOLANA':'SOL','СОЛАНА':'SOL','XRP':'XRP','RIPPLE':'XRP','РИПЛ':'XRP','USDC':'USDC','USDCOIN':'USDC','ADA':'ADA','CARDANO':'ADA','КАРДАНО':'ADA','AVAX':'AVAX','AVALANCHE':'AVAX','АВАКС':'AVAX','DOGE':'DOGE','DOGECOIN':'DOGE','ДОГИКОИН':'DOGE','ДОГИ':'DOGE','DOT':'DOT','POLKADOT':'DOT','ПОЛКАДОТ':'DOT','TRX':'TRX','TRON':'TRX','ТРОН':'TRX','LINK':'LINK','CHAINLINK':'LINK','ЛИНК':'LINK','MATIC':'MATIC','POLYGON':'MATIC','МАТИК':'MATIC','TON':'TON','TONCOIN':'TON','ТОН':'TON','SHIB':'SHIB','SHIBAINU':'SHIB','ШИБА':'SHIB','LTC':'LTC','LITECOIN':'LTC','ЛАЙТКОИН':'LTC','BCH':'BCH','BITCOINCASH':'BCH','БИТКОИНКЕШ':'BCH','SAT':'SAT','SATOSHI':'SAT','САТОШИ':'SAT','WAVES':'WAVES','ВЕЙВС':'WAVES'};const FIAT_MAP={'$':'USD','USD':'USD','€':'EUR','EUR':'EUR','£':'GBP','GBP':'GBP','¥':'CNY','CNY':'CNY','JPY':'JPY','₣':'CHF','FR.':'CHF','CHF':'CHF','A$':'AUD','AUD':'AUD','C$':'CAD','CAD':'CAD','₺':'TRY','TRY':'TRY','AED':'AED','₴':'UAH','UAH':'UAH','ГРН':'UAH','ГРИВНА':'UAH','ГРИВЕН':'UAH','₸':'KZT','KZT':'KZT','ТНГ':'KZT','ТЕНГЕ':'KZT','₼':'AZN','AZN':'AZN','BGN':'BGN','LEV':'BGN','BR':'BYN','BYN':'BYN','БР':'BYN','БЕЛРУБ':'BYN','BYR':'BYN','РБ':'BYN','₹':'INR','INR':'INR','KGS':'KGS','₩':'KRW','KRW':'KRW','L':'MDL','MDL':'MDL','SM':'TJS','TJS':'TJS','TMT':'TMT','UZS':'UZS','SUM':'UZS','₪':'ILS','ILS':'ILS','¢':'USD','₽':'RUB','Р':'RUB','РУБ':'RUB','РУБ.':'RUB','РУБЛЕЙ':'RUB','RUB':'RUB','ДОЛЛАР':'USD','ДОЛЛАРОВ':'USD','ЕВРО':'EUR','ЮАНЬ':'CNY','ИЕНА':'JPY','ТЕНГЕ':'KZT'};const CURRENCY_MAP={...FIAT_MAP,...CRYPTO_MAP};const CRYPTO_CODES=Object.values(CRYPTO_MAP);const PRO_CURRENCIES=['USD','EUR','GBP','CHF','JPY','CAD','CNY','AED'];let hideTimeout=null,currentTooltip=null;document.addEventListener('mouseup',handleSelection);document.addEventListener('mousedown',(e)=>{if(currentTooltip&&currentTooltip.contains(e.target))return;removeTooltip();});async function handleSelection(event){try{if(!chrome.runtime?.id)return;const selection=window.getSelection();let text=selection.toString();text=text.replace(/[\u00A0\u202F\u200B-\u200D\uFEFF]/g,' ').trim();if(!text||text.length>50)return;function isSelectionInSensitiveField(){const sel=window.getSelection();if(!sel.rangeCount)return false;const node=sel.getRangeAt(0).commonAncestorContainer;const el=node.nodeType===1?node:node.parentElement;if(!el)return false;if(el.closest('[contenteditable="true"]'))return true;const closestInput=el.closest('input, textarea');if(!closestInput)return false;const type=(closestInput.type||'').toLowerCase();const name=(closestInput.name||'').toLowerCase();const id=(closestInput.id||'').toLowerCase();return type==='password'||type==='hidden'||name.includes('cc')||name.includes('card')||name.includes('cvv')||name.includes('password')||name.includes('secret')||id.includes('cc')||id.includes('card')||id.includes('cvv')||id.includes('password')||id.includes('secret');}if(isSelectionInSensitiveField())return;const parseResult=parseCurrencyString(text);if(!parseResult)return;const settings=await chrome.storage.local.get({appTier:'basic',targetCurrency:'RUB',rateSource:'market',trialStart:null,lang:'auto'});let currentLang=settings.lang==='auto'?(navigator.language.split('-')[0]||'en'):settings.lang;if(currentLang==='ua')currentLang='uk';const C_DICT={'uk':{lock:'Блокування',req:'Потрібен тариф'},'ru':{lock:'Блокировка',req:'Требуется тариф'},'en':{lock:'Locked',req:'Requires plan'},'de':{lock:'Gesperrt',req:'Erfordert Plan'},'es':{lock:'Bloqueado',req:'Requiere plan'},'zh':{lock:'已锁定',req:'需要方案'},'kk':{lock:'Блокталған',req:'Тариф қажет'}};const m=C_DICT[currentLang]||C_DICT['en'];if(parseResult.isSat){showTooltip(event.pageX,event.pageY,parseResult.amount,"Live","BTC",currentLang);return;}const targetCurrencyUpper = (settings.targetCurrency || "RUB").trim().toUpperCase();if(parseResult.currency===targetCurrencyUpper){showTooltip(event.pageX,event.pageY,parseResult.amount,"Live",targetCurrencyUpper,currentLang);return;}const isTrialActive=settings.trialStart&&((Date.now()-settings.trialStart)<48*60*60*1000);const activeTier=(settings.appTier==='pro_plus'||isTrialActive)?'pro_plus':settings.appTier;const isByDomain=window.location.hostname.endsWith('.by');const allowedBasic=['USD','EUR','RUB'];if(isByDomain)allowedBasic.push('BYN');if(activeTier==='basic'&&!allowedBasic.includes(parseResult.currency))return showUpsell(event.pageX,event.pageY,parseResult.currency,"PRO",m);if(activeTier==='pro'&&!PRO_CURRENCIES.includes(parseResult.currency))return showUpsell(event.pageX,event.pageY,parseResult.currency,"PRO+",m);const actualSource=activeTier==='pro_plus'?settings.rateSource:'market';const res=await chrome.runtime.sendMessage({action:"GET_RATE",from:parseResult.currency,to:targetCurrencyUpper,source:actualSource});if(res&&res.success&&res.rate)showTooltip(event.pageX,event.pageY,parseResult.amount*res.rate,res.date,targetCurrencyUpper,currentLang);}catch(e){}}function parseCurrencyString(text){    const suffixRegex=/^([0-9\s.,]+)\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\.?|млн\.?|млрд\.?|трлн\.?))?\s*([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\s]{1,25})$/i;
    const prefixRegex=/^([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\s]{1,25})\s*([0-9\s.,]+)\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\.?|млн\.?|млрд\.?|трлн\.?))?$/i;
    let match=text.match(suffixRegex);
    let isSuffix=true;
    if(!match){
        match=text.match(prefixRegex);
        isSuffix=false;
    }
    if(!match)return null;
    const originalMatchedCur = isSuffix ? match[3] : match[1];
    let numStr,curStr,multStr;
    if(isSuffix){
        numStr=match[1];
        multStr=match[2]||"";
        curStr=match[3];
    }else{
        curStr=match[1];
        numStr=match[2];
        multStr=match[3]||"";
    }
    numStr=numStr.trim();
    curStr=curStr.trim().toUpperCase();
    multStr=multStr.trim().toLowerCase();
    if(curStr.endsWith('.')&&curStr!=='FR.')curStr=curStr.slice(0,-1);
    const cleanCurStr=curStr.replace(/[^A-ZА-ЯЁ$€£¥₽₺₴₸₼₹₩₪¢]/g,'');
    let isoCode=CURRENCY_MAP[cleanCurStr]||(Object.values(CURRENCY_MAP).includes(cleanCurStr)?cleanCurStr:null);
    if(!isoCode)return null;
    if(isoCode==='RUB'&&(cleanCurStr==='Р'||cleanCurStr==='P')){
        if(!isSuffix)return null;
        const rawCur = originalMatchedCur.trim();
        if(rawCur==='P'||rawCur==='p')return null;
        const charBefore=text.charAt(text.length-originalMatchedCur.length-1);
        if(!/[\s.,]/.test(charBefore))return null;
    }
    if(window.location.hostname.endsWith('.by')&&isoCode==='RUB'&&curStr!=='RUB')isoCode='BYN';
    let cleanNum=numStr.replace(/\s/g,'');
    let separators=cleanNum.match(/[.,]/g);
    let amount=0;
    if(!separators){
        amount=parseFloat(cleanNum);
    }else if(separators.length===1){
        let sep=separators[0];
        let parts=cleanNum.split(sep);
        if(parts[1].length===3&&parts[0]!=='0'&&parts[0]!=='-0'&&!CRYPTO_CODES.includes(isoCode))amount=parseFloat(cleanNum.replace(sep,''));
        else amount=parseFloat(cleanNum.replace(sep,'.'));
    }else{
        let lastSepIdx=Math.max(cleanNum.lastIndexOf('.'),cleanNum.lastIndexOf(','));
        amount=parseFloat(cleanNum.substring(0,lastSepIdx).replace(/[.,]/g,'')+'.'+cleanNum.substring(lastSepIdx+1));
    }
    if(isNaN(amount))return null;
    multStr=multStr.replace('.','');
    if(multStr==='k'||multStr==='тыс'||multStr==='к'||multStr==='т')amount*=1000;
    else if(multStr==='m'||multStr==='млн'||multStr==='м')amount*=1000000;
    else if(multStr==='b'||multStr==='млрд'||multStr==='б')amount*=1000000000;
    else if(multStr==='t'||multStr==='трлн')amount*=1000000000000;
    if(!CRYPTO_CODES.includes(isoCode)){
        if(cleanCurStr==='¢')amount*=0.01;
    }
    const isSatVal=isoCode==='SAT';
    if(isSatVal)amount*=0.00000001;
    const finalCur=isSatVal?'BTC':isoCode;
    return{amount,currency:finalCur,isSat:isSatVal};
}function createBase(x,y,callback){removeTooltip();const duplicate=document.getElementById('edge-currency-converter-tooltip');if(duplicate)duplicate.remove();const t=document.createElement('div');t.id='edge-currency-converter-tooltip';t.style.cssText='all: initial; position: absolute !important; left: '+(x+15)+'px !important; top: '+(y+35)+'px !important; padding: 12px 16px !important; border-radius: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important; z-index: 2147483647 !important; font-family: -apple-system, BlinkMacSystemFont, sans-serif !important; pointer-events: none !important; opacity: 0 !important; transform: translateY(5px) !important; transition: opacity 0.2s, transform 0.2s !important; display: flex !important; flex-direction: column !important; min-width: 140px !important; background-color: #161b22 !important; color: #f0f6fc !important; border: 1px solid #30363d !important;';chrome.storage.local.get({theme:'dark'},(res)=>{const isDark=res.theme==='dark';const bgColor=isDark?'#161b22':'#ffffff';const textColor=isDark?'#f0f6fc':'#1a1a1a';const borderColor=isDark?'#30363d':'#e0e0e0';t.style.setProperty('background',bgColor,'important');t.style.setProperty('background-color',bgColor,'important');t.style.setProperty('color',textColor,'important');t.style.setProperty('border','1px solid '+borderColor,'important');callback(t,textColor);requestAnimationFrame(()=>{t.style.setProperty('opacity','1','important');t.style.setProperty('transform','translateY(0)','important');});});document.body.appendChild(t);currentTooltip=t;hideTimeout=setTimeout(removeTooltip,7000);}function showTooltip(x,y,val,date,target,lang){
    const locales = {
        'uk': 'uk-UA',
        'ru': 'ru-RU',
        'de': 'de-DE',
        'es': 'es-ES',
        'zh': 'zh-CN',
        'kk': 'kk-KZ'
    };
    const locale = locales[lang] || 'en-US';
    createBase(x,y,(t,textColor)=>{
        const formatted=new Intl.NumberFormat(locale,{
            style:'decimal',
            minimumFractionDigits: val < 0.01 ? 2 : 2,
            maximumFractionDigits: val < 0.01 ? 8 : 2
        }).format(val);
        const icon=date==='Live'?'⚡':'🏛';
        
        const mainSpan = document.createElement('span');
        mainSpan.style.cssText = 'color: '+textColor+' !important; font-family: inherit !important; font-size: 16px!important; font-weight: 800!important; margin-bottom: 4px!important; display: block !important;';
        mainSpan.textContent = formatted + ' ' + target;
        
        const subSpan = document.createElement('span');
        subSpan.style.cssText = 'font-family: inherit !important; font-size: 11px!important; color:#8b949e!important; display: block !important;';
        subSpan.textContent = icon + ' ' + date;
        
        t.appendChild(mainSpan);
        t.appendChild(subSpan);
    });
}
function showUpsell(x,y,cur,tier,m){
    createBase(x,y,(t,textColor)=>{
        const mainSpan = document.createElement('span');
        mainSpan.style.cssText = 'color: '+textColor+' !important; font-family: inherit !important; font-size:13px!important; font-weight:700!important; margin-bottom:4px!important; display: block !important;';
        mainSpan.textContent = '🔒 ' + m.lock + ' ' + cur;
        
        const subSpan = document.createElement('span');
        subSpan.style.cssText = 'font-family: inherit !important; font-size:12px!important; color:#8b949e!important; display: block !important;';
        subSpan.textContent = m.req + ' ';
        
        const b = document.createElement('b');
        b.style.cssText = 'color:#8957e5!important';
        b.textContent = tier;
        
        subSpan.appendChild(b);
        t.appendChild(mainSpan);
        t.appendChild(subSpan);
    });
}function removeTooltip(){if(hideTimeout)clearTimeout(hideTimeout);const existing=document.getElementById('edge-currency-converter-tooltip');if(existing)existing.remove();if(currentTooltip&&currentTooltip.parentNode){try{currentTooltip.remove()}catch(err){}}currentTooltip=null;}