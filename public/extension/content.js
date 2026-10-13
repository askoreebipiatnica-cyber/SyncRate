/**
 * SyncRate - Content Script (DOM & Selection Engine)
 * Robust selection detection for popups, modal subscription overlays, Shadow DOM & iframes.
 * Features Shadow DOM encapsulation for tooltip isolation against host page CSS !important.
 * 
 * @license Apache-2.0
 */

let hideTimeout = null;
let currentTooltipHost = null;

// ============================================================================
// 1. SELECTION & SHADOW DOM RESOLVER
// ============================================================================

/**
 * Recursively locates the deep active element through open ShadowRoots.
 * @param {Document|ShadowRoot} root
 * @returns {Element|null}
 */
function getDeepActiveElement(root = document) {
    let active = root.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
        active = active.shadowRoot.activeElement;
    }
    return active;
}

/**
 * Extracts text selection from normal DOM, open ShadowRoots, or input/textarea elements.
 * @returns {{ text: string, rect: DOMRect | null }}
 */
function getDeepSelection() {
    let text = '';
    let rect = null;

    // 1. Check standard window selection
    const winSel = window.getSelection();
    if (winSel && winSel.rangeCount > 0) {
        const candidate = winSel.toString();
        if (candidate && candidate.trim()) {
            text = candidate;
            try {
                rect = winSel.getRangeAt(0).getBoundingClientRect();
            } catch (e) {}
        }
    }

    // 2. Check ShadowRoot selection if standard selection is empty
    if (!text.trim()) {
        let el = document.activeElement;
        while (el) {
            if (el.shadowRoot) {
                const sRoot = el.shadowRoot;
                if (typeof sRoot.getSelection === 'function') {
                    const sSel = sRoot.getSelection();
                    if (sSel && sSel.rangeCount > 0 && sSel.toString().trim()) {
                        text = sSel.toString();
                        try {
                            rect = sSel.getRangeAt(0).getBoundingClientRect();
                        } catch (e) {}
                        break;
                    }
                }
                el = sRoot.activeElement;
            } else {
                break;
            }
        }
    }

    // 3. Check selected text within active input or textarea (common in subscription inputs)
    if (!text.trim()) {
        const deepActive = getDeepActiveElement(document);
        if (deepActive && (deepActive.tagName === 'INPUT' || deepActive.tagName === 'TEXTAREA')) {
            const input = deepActive;
            const start = input.selectionStart;
            const end = input.selectionEnd;
            if (typeof start === 'number' && typeof end === 'number' && start !== end) {
                text = input.value.substring(start, end);
                try {
                    rect = input.getBoundingClientRect();
                } catch (e) {}
            }
        }
    }

    return { text, rect };
}

/**
 * Checks if the selection or active element resides inside sensitive fields (password, credit card, CVV).
 * @returns {boolean}
 */
function isSelectionInSensitiveField() {
    const deepActive = getDeepActiveElement(document);
    if (deepActive) {
        const tag = deepActive.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
            const type = (deepActive.getAttribute('type') || '').toLowerCase();
            const name = (deepActive.getAttribute('name') || '').toLowerCase();
            const id = (deepActive.getAttribute('id') || '').toLowerCase();
            const autocomplete = (deepActive.getAttribute('autocomplete') || '').toLowerCase();

            if (type === 'password' || type === 'hidden') return true;
            if (name.includes('cc') || name.includes('card') || name.includes('cvv') || name.includes('cvc') || name.includes('secret') || name.includes('token')) return true;
            if (id.includes('cc') || id.includes('card') || id.includes('cvv') || id.includes('cvc') || id.includes('secret') || id.includes('token')) return true;
            if (autocomplete.includes('cc-') || autocomplete.includes('current-password')) return true;
        }
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).commonAncestorContainer;
        const el = node.nodeType === 1 ? node : node.parentElement;
        if (el) {
            const closestInput = el.closest('input, textarea');
            if (closestInput) {
                const type = (closestInput.type || '').toLowerCase();
                const name = (closestInput.name || '').toLowerCase();
                const id = (closestInput.id || '').toLowerCase();
                return type === 'password' || type === 'hidden' ||
                       name.includes('cc') || name.includes('card') || name.includes('cvv') || name.includes('secret') ||
                       id.includes('cc') || id.includes('card') || id.includes('cvv') || id.includes('secret');
            }
        }
    }

    return false;
}

// ============================================================================
// 2. PARSER INTEGRATION
// ============================================================================

function parseCurrency(text) {
    if (typeof window !== 'undefined' && window.SyncRateParser && typeof window.SyncRateParser.parse === 'function') {
        return window.SyncRateParser.parse(text);
    }
    return null;
}

// ============================================================================
// 3. EVENT HANDLERS & MODAL/IFRAME PIPELINE
// ============================================================================

let selectionDebounceTimer = null;

async function handleSelectionEvent(event) {
    try {
        if (!chrome.runtime?.id) return;
        if (isSelectionInSensitiveField()) return;

        const { text, rect } = getDeepSelection();
        const cleanedText = (text || '').replace(/[\u00A0\u202F\u200B-\u200D\uFEFF]/g, ' ').trim();
        if (!cleanedText || cleanedText.length > 80) return;

        const parseResult = parseCurrency(cleanedText);
        if (!parseResult) return;

        // Calculate absolute coordinates
        let posX = 0;
        let posY = 0;

        if (rect && (rect.width > 0 || rect.height > 0)) {
            posX = rect.left + (window.scrollX || window.pageXOffset || 0);
            posY = rect.bottom + (window.scrollY || window.pageYOffset || 0);
        } else if (event && (event.pageX !== undefined || event.clientX !== undefined)) {
            posX = event.pageX || (event.clientX + (window.scrollX || 0));
            posY = event.pageY || (event.clientY + (window.scrollY || 0));
        }

        const isIframe = window !== window.top;
        if (isIframe) {
            chrome.runtime.sendMessage({
                action: "RENDER_IN_TOP_FRAME",
                text: cleanedText,
                clientX: event ? event.clientX : 0,
                clientY: event ? event.clientY : 0
            }).catch(() => {});
            return;
        }

        await processSelectionText(cleanedText, posX, posY, false);
    } catch (e) {
        // Suppress unexpected browser extension context lifecycle errors
    }
}

async function processSelectionText(text, x, y, fromIframe = false) {
    try {
        const parseResult = parseCurrency(text);
        if (!parseResult) return;

        const settings = await chrome.storage.local.get({
            targetCurrency: 'RUB',
            rateSource: 'market',
            lang: 'auto'
        });

        let currentLang = settings.lang === 'auto' ? (navigator.language.split('-')[0] || 'en') : settings.lang;
        if (currentLang === 'ua') currentLang = 'uk';

        const targetCurrencyUpper = (settings.targetCurrency || "RUB").trim().toUpperCase();
        if (parseResult.currency === targetCurrencyUpper) {
            showTooltip(x, y, parseResult.amount, "Live", targetCurrencyUpper, currentLang, fromIframe);
            return;
        }

        const actualSource = settings.rateSource || 'market';
        const res = await chrome.runtime.sendMessage({
            action: "GET_RATE",
            from: parseResult.currency,
            to: targetCurrencyUpper,
            source: actualSource
        });

        if (res && res.success && res.rate) {
            const displayDate = res.fallback ? (res.date + ' ⚠️') : res.date;
            showTooltip(x, y, parseResult.amount * res.rate, displayDate, targetCurrencyUpper, currentLang, fromIframe);
        }
    } catch (e) {}
}

// ============================================================================
// 4. CROSS-FRAME COMMUNICATION & SUBSCRIPTION MODAL SUPPORT
// ============================================================================

chrome.runtime.onMessage.addListener((message) => {
    if (message && message.action === "RENDER_IN_TOP_FRAME") {
        const isIframe = window !== window.top;
        if (!isIframe) {
            processSelectionText(message.text, 0, 0, true);
        }
    }
});

// Event registration with CAPTURE phase:
// Intercepts selections before modal overlays, checkout iframes or dialogs can stopPropagation()!
const captureOptions = { capture: true, passive: true };

document.addEventListener('mouseup', handleSelectionEvent, captureOptions);
document.addEventListener('pointerup', handleSelectionEvent, captureOptions);
document.addEventListener('keyup', (e) => {
    if (!e || typeof e.key !== 'string') return;
    if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
        clearTimeout(selectionDebounceTimer);
        selectionDebounceTimer = setTimeout(() => handleSelectionEvent(e), 200);
    }
}, captureOptions);

document.addEventListener('mousedown', (e) => {
    if (currentTooltipHost && currentTooltipHost.contains(e.target)) return;
    removeTooltip();
}, captureOptions);

// ============================================================================
// 5. TOOLTIP RENDERER (Shadow DOM Isolation & High Z-Index Overlays)
// ============================================================================

function createBase(x, y, callback, fromIframe = false) {
    removeTooltip();
    const duplicate = document.getElementById('edge-currency-converter-tooltip');
    if (duplicate) duplicate.remove();

    // Host element attached to body / fullscreenElement
    const host = document.createElement('div');
    host.id = 'edge-currency-converter-tooltip';

    // Host container positioning style
    const hostBaseStyle = 'all: initial; pointer-events: none !important; z-index: 2147483647 !important; display: block !important;';
    if (fromIframe) {
        host.style.cssText = hostBaseStyle + ' position: fixed !important; bottom: 20px !important; left: 50% !important; transform: translate(-50%, 0) !important;';
    } else {
        host.style.cssText = hostBaseStyle + ' position: absolute !important; left: 0px !important; top: 0px !important;';
    }

    // Attach Open Shadow DOM for complete CSS isolation from host page
    const shadow = host.attachShadow({ mode: 'open' });

    // Inner visual card container
    const t = document.createElement('div');
    t.className = 'syncrate-tooltip-card';

    const cardBaseStyle = 'box-sizing: border-box; visibility: hidden; padding: 12px 16px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; opacity: 0; transition: opacity 0.2s ease, transform 0.2s ease; display: flex; flex-direction: column; min-width: 140px; pointer-events: none;';
    t.style.cssText = cardBaseStyle;

    chrome.storage.local.get({ theme: 'dark' }, (res) => {
        const isDark = res.theme === 'dark';
        const bgColor = isDark ? '#161b22' : '#ffffff';
        const textColor = isDark ? '#f0f6fc' : '#1a1a1a';
        const borderColor = isDark ? '#30363d' : '#e0e0e0';

        t.style.backgroundColor = bgColor;
        t.style.color = textColor;
        t.style.border = '1px solid ' + borderColor;

        callback(t, textColor);
        shadow.appendChild(t);

        requestAnimationFrame(() => {
            if (fromIframe) {
                t.style.opacity = '1';
                t.style.visibility = 'visible';
                t.style.transform = 'translateY(0)';
            } else {
                const rect = t.getBoundingClientRect();
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const scrollX = window.scrollX || window.pageXOffset || 0;
                const scrollY = window.scrollY || window.pageYOffset || 0;

                let targetX = x + 10;
                let targetY = y + 15;
                const clientXVal = targetX - scrollX;
                const clientYVal = targetY - scrollY;

                if (clientXVal + rect.width > viewportWidth) {
                    targetX = Math.max(scrollX + 10, scrollX + viewportWidth - rect.width - 20);
                }
                if (targetX < scrollX) {
                    targetX = scrollX + 10;
                }
                if (clientYVal + rect.height > viewportHeight) {
                    const aboveY = y - rect.height - 15;
                    if (aboveY - scrollY > 10) {
                        targetY = aboveY;
                    } else {
                        targetY = Math.max(scrollY + 10, scrollY + viewportHeight - rect.height - 20);
                    }
                }
                if (targetY < scrollY) {
                    targetY = scrollY + 10;
                }

                host.style.setProperty('left', targetX + 'px', 'important');
                host.style.setProperty('top', targetY + 'px', 'important');
                t.style.opacity = '1';
                t.style.visibility = 'visible';
                t.style.transform = 'translateY(0)';
            }
        });
    });

    const hostContainer = document.fullscreenElement || document.body || document.documentElement;
    hostContainer.appendChild(host);
    currentTooltipHost = host;
    hideTimeout = setTimeout(removeTooltip, 7000);
}

function showTooltip(x, y, val, date, target, lang, fromIframe = false) {
    const locales = { 'uk': 'uk-UA', 'ru': 'ru-RU', 'de': 'de-DE', 'es': 'es-ES', 'zh': 'zh-CN', 'kk': 'kk-KZ' };
    const locale = locales[lang] || 'en-US';

    createBase(x, y, (t, textColor) => {
        const formatted = new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits: val < 0.01 ? 2 : 2,
            maximumFractionDigits: val < 0.01 ? 8 : 2
        }).format(val);

        const icon = date.includes('⚠️') ? '⚠️' : (date === 'Live' ? '⚡' : '🏛');
        const mainSpan = document.createElement('span');
        mainSpan.style.cssText = 'color: ' + textColor + '; font-family: inherit; font-size: 16px; font-weight: 800; margin-bottom: 4px; display: block;';
        mainSpan.textContent = formatted + ' ' + target;

        const subSpan = document.createElement('span');
        subSpan.style.cssText = 'font-family: inherit; font-size: 11px; color: #8b949e; display: block;';
        subSpan.textContent = icon + ' ' + date;

        t.appendChild(mainSpan);
        t.appendChild(subSpan);
    }, fromIframe);
}

function removeTooltip() {
    if (hideTimeout) clearTimeout(hideTimeout);
    const existing = document.getElementById('edge-currency-converter-tooltip');
    if (existing) existing.remove();
    if (currentTooltipHost && currentTooltipHost.parentNode) {
        try { currentTooltipHost.remove(); } catch (err) {}
    }
    currentTooltipHost = null;
}
