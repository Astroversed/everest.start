const EVEREST_ACTIVE_USER_KEY = 'everest_active_user';
const EVEREST_USERS_KEY = 'everest_temp_users';
const EVEREST_SESSION_MS = 60 * 60 * 1000;
const DASHBOARD_FALLBACK_URL = 'https://astroversed.github.io/everest.dashboard/';
const FIRESTORE_LEADERBOARD_COLLECTION = 'leaderboard';
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCVb6UZ48mcD8tAW67LMMVPi2SMNiemcUY',
    authDomain: 'everest-dashboard-e58a5.firebaseapp.com',
    projectId: 'everest-dashboard-e58a5',
    storageBucket: 'everest-dashboard-e58a5.firebasestorage.app',
    messagingSenderId: '36464478604',
    appId: '1:36464478604:web:b8dfacd61af6c80aa3eea9',
    measurementId: 'G-EBP09MWQRD'
};

const courseSelect = document.getElementById('course');
const courseSelectShell = document.getElementById('courseSelect');
const courseTrigger = document.getElementById('courseTrigger');
const courseTriggerLabel = document.getElementById('courseTriggerLabel');
const courseDropdown = document.getElementById('courseDropdown');
const courseSearch = document.getElementById('courseSearch');
const courseOptions = document.getElementById('courseOptions');
const usernameInput = document.getElementById('username');
const registerForm = document.getElementById('registerForm');
const feedbackMessage = document.getElementById('feedbackMessage');
const previewAvatar = document.getElementById('profilePreviewAvatar');
const previewEmoji = document.getElementById('profilePreviewEmoji');
const previewName = document.getElementById('profilePreviewName');
const previewCourse = document.getElementById('profilePreviewCourse');
const randomizeProfileBtn = document.getElementById('randomizeProfileBtn');
const submitButton = registerForm ? registerForm.querySelector('button[type="submit"]') : null;
const stepNameSection = document.getElementById('stepNameSection');
const stepProfileSection = document.getElementById('stepProfileSection');
const stepCourseSection = document.getElementById('stepCourseSection');
const colorPickerToggle = document.getElementById('colorPickerToggle');
const emojiPickerToggle = document.getElementById('emojiPickerToggle');
const colorPickerBody = document.getElementById('colorPickerBody');
const emojiPickerBody = document.getElementById('emojiPickerBody');
const colorPickerBlock = colorPickerToggle ? colorPickerToggle.closest('.picker-block') : null;
const emojiPickerBlock = emojiPickerToggle ? emojiPickerToggle.closest('.picker-block') : null;
const projectQrTrigger = document.getElementById('projectQrTrigger');
const projectQrModal = document.getElementById('projectQrModal');
const projectQrClose = document.getElementById('projectQrClose');
const projectQrBackdrop = projectQrModal ? projectQrModal.querySelector('.project-qr-backdrop') : null;
const projectQrImage = document.getElementById('projectQrImage');

const customColorTrigger = document.getElementById('customColorTrigger');
const customColorPanel = document.getElementById('customColorPanel');
const customColorText = document.getElementById('customColorText');
const customColorPreview = document.getElementById('customColorPreview');
const customColorBar = document.getElementById('customColorBar');
const customColorHex = document.getElementById('customColorHex');
const customColorApply = document.getElementById('customColorApply');
const customColorClose = document.getElementById('customColorClose');
const customColorHeader = customColorPanel ? customColorPanel.querySelector('.custom-color-header') : null;
const customStudioTrigger = document.getElementById('customStudioTrigger');
const customColorStudio = document.getElementById('customColorStudio');
const customColorSurface = document.getElementById('customColorSurface');
const customColorSurfaceHandle = document.getElementById('customColorSurfaceHandle');
const customHueTrack = document.getElementById('customHueTrack');
const customHueHandle = document.getElementById('customHueHandle');
const customStudioTabs = Array.from(document.querySelectorAll('.custom-studio-tab'));
const customStudioModes = Array.from(document.querySelectorAll('.custom-studio-mode'));
const customColorR = document.getElementById('customColorR');
const customColorG = document.getElementById('customColorG');
const customColorB = document.getElementById('customColorB');
const customColorH = document.getElementById('customColorH');
const customColorS = document.getElementById('customColorS');
const customColorL = document.getElementById('customColorL');
const customColorTextStudio = document.getElementById('customColorTextStudio');
const customStudioClose = document.getElementById('customStudioClose');
const customStudioHeader = customColorStudio ? customColorStudio.querySelector('.custom-studio-heading') : null;
const customStudioDragIndicator = customColorStudio ? customColorStudio.querySelector('.custom-studio-drag-indicator') : null;

let selectedColor = '#667eea';
let selectedEmoji = '🧠';
let randomizeTimer = null;
let isRandomizing = false;
let isCustomColorPanelOpen = false;
let customColorDragState = null;
let customColorCloseTimer = null;
let customColorStudioOpen = false;
let customColorState = { h: 229, s: 0.56, v: 0.92 };
let customStudioMode = 'rgb';
let customColorStudioCloseTimer = null;
let customColorStudioDragState = null;
let customColorSyncFrame = null;
let mobilePanelReturnTimer = null;
let compactIdentityMobileMode = null;
let customColorOutsideCloseLockUntil = 0;
let sharedRegistry = null;
const EVEREST_START_URL = 'https://astroversed.github.io/everest.start/';
let projectQrCloseTimer = null;
let projectQrCodeInstance = null;

function readJsonStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.error(`Failed to parse storage key: ${key}`, error);
        return fallback;
    }
}

function writeJsonStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to write storage key: ${key}`, error);
    }
}

function setupSharedRegistry() {
    if (sharedRegistry) return sharedRegistry;
    if (!window.firebase || typeof window.firebase.initializeApp !== 'function' || typeof window.firebase.firestore !== 'function') {
        return null;
    }

    try {
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(FIREBASE_CONFIG);
        }
        sharedRegistry = window.firebase.firestore().collection(FIRESTORE_LEADERBOARD_COLLECTION);
    } catch (error) {
        console.error('Failed to initialize shared Everest registry', error);
        sharedRegistry = null;
    }

    return sharedRegistry;
}

async function getSharedUserRecord(username) {
    const normalized = normalizeUsername(username);
    const registry = setupSharedRegistry();
    if (!registry || !normalized) return null;

    try {
        const snapshot = await registry.doc(normalized).get();
        if (!snapshot.exists) return null;
        return snapshot.data() || null;
    } catch (error) {
        console.error('Failed to read shared Everest registry', error);
        return null;
    }
}

async function deleteSharedUserRecordById(userId) {
    const registry = setupSharedRegistry();
    if (!registry || !userId) return;

    try {
        await registry.doc(userId).delete();
    } catch (error) {
        console.error('Failed to delete shared Everest user', error);
    }
}

function removeStaleLocalUsername(normalizedUsername) {
    if (!normalizedUsername) return;
    const users = pruneExpiredUsers().filter((user) => normalizeUsername(user.username) !== normalizedUsername);
    writeJsonStorage(EVEREST_USERS_KEY, users);

    const activeUser = readJsonStorage(EVEREST_ACTIVE_USER_KEY, null);
    if (activeUser && normalizeUsername(activeUser.username) === normalizedUsername) {
        localStorage.removeItem(EVEREST_ACTIVE_USER_KEY);
    }
}

function normalizeUsername(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function sanitizeUsername(value) {
    return value
        .trim()
        .replace(/[^A-Za-z0-9_\- ]+/g, '')
        .replace(/\s{2,}/g, ' ')
        .slice(0, 24);
}

function formatUsernameDisplay(value) {
    return value.replace(/(^|[_ ])[a-z]/g, (match) => match.toUpperCase());
}

function normalizeHexColor(value) {
    const cleaned = value.trim().replace(/[^#0-9a-fA-F]/g, '');
    if (!cleaned) return null;

    const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
    const hex = withHash.slice(1);

    if (hex.length === 3 && /^[0-9a-fA-F]{3}$/.test(hex)) {
        return `#${hex.split('').map((char) => char + char).join('').toLowerCase()}`;
    }

    if (hex.length === 6 && /^[0-9a-fA-F]{6}$/.test(hex)) {
        return `#${hex.toLowerCase()}`;
    }

    return null;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function isCompactMobile() {
    return window.innerWidth <= 560;
}

function isDesktopCustomColorUI() {
    return window.innerWidth > 780;
}

function lockCustomColorOutsideClose(duration = 220) {
    customColorOutsideCloseLockUntil = Date.now() + duration;
}

function ensureDesktopCustomColorPortals() {
    if (!isDesktopCustomColorUI()) return;
    if (customColorPanel && customColorPanel.parentElement !== document.body) {
        document.body.appendChild(customColorPanel);
    }
    if (customColorStudio && customColorStudio.parentElement !== document.body) {
        document.body.appendChild(customColorStudio);
    }
}

function scheduleCustomColorSync(colorValue) {
    const normalized = normalizeHexColor(colorValue);
    if (!normalized) return;

    if (customColorSyncFrame) {
        window.cancelAnimationFrame(customColorSyncFrame);
    }

    customColorSyncFrame = window.requestAnimationFrame(() => {
        syncCustomColorUI(normalized);
        customColorSyncFrame = null;
    });
}

function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return null;

    return {
        r: parseInt(normalized.slice(1, 3), 16),
        g: parseInt(normalized.slice(3, 5), 16),
        b: parseInt(normalized.slice(5, 7), 16)
    };
}

function rgbToHsv(r, g, b) {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    let h = 0;

    if (delta) {
        if (max === red) {
            h = 60 * (((green - blue) / delta) % 6);
        } else if (max === green) {
            h = 60 * (((blue - red) / delta) + 2);
        } else {
            h = 60 * (((red - green) / delta) + 4);
        }
    }

    if (h < 0) h += 360;

    return {
        h,
        s: max === 0 ? 0 : delta / max,
        v: max
    };
}

function hsvToRgb(h, s, v) {
    const hue = ((h % 360) + 360) % 360;
    const chroma = v * s;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = v - chroma;
    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
        r = chroma; g = x;
    } else if (hue < 120) {
        r = x; g = chroma;
    } else if (hue < 180) {
        g = chroma; b = x;
    } else if (hue < 240) {
        g = x; b = chroma;
    } else if (hue < 300) {
        r = x; b = chroma;
    } else {
        r = chroma; b = x;
    }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function rgbToHsl(r, g, b) {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;

    if (delta !== 0) {
        saturation = delta / (1 - Math.abs((2 * lightness) - 1));

        if (max === red) {
            hue = 60 * (((green - blue) / delta) % 6);
        } else if (max === green) {
            hue = 60 * (((blue - red) / delta) + 2);
        } else {
            hue = 60 * (((red - green) / delta) + 4);
        }
    }

    if (hue < 0) hue += 360;

    return {
        h: Math.round(hue),
        s: Math.round(saturation * 100),
        l: Math.round(lightness * 100)
    };
}

function hslToRgb(h, s, l) {
    const hue = ((h % 360) + 360) % 360;
    const sat = clamp(s, 0, 100) / 100;
    const light = clamp(l, 0, 100) / 100;
    const chroma = (1 - Math.abs((2 * light) - 1)) * sat;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = light - (chroma / 2);
    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
        r = chroma; g = x;
    } else if (hue < 120) {
        r = x; g = chroma;
    } else if (hue < 180) {
        g = chroma; b = x;
    } else if (hue < 240) {
        g = x; b = chroma;
    } else if (hue < 300) {
        r = x; b = chroma;
    } else {
        r = chroma; b = x;
    }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function pruneExpiredUsers() {
    const now = Date.now();
    const storedUsers = readJsonStorage(EVEREST_USERS_KEY, []);
    const expiredUsers = storedUsers.filter((user) => user && typeof user.expiresAt === 'number' && user.expiresAt <= now);
    const activeUsers = storedUsers.filter((user) => user && typeof user.expiresAt === 'number' && user.expiresAt > now);
    writeJsonStorage(EVEREST_USERS_KEY, activeUsers);
    expiredUsers.forEach((user) => {
        void deleteSharedUserRecordById(normalizeUsername(user.username));
    });

    const activeUser = readJsonStorage(EVEREST_ACTIVE_USER_KEY, null);
    if (activeUser && typeof activeUser.expiresAt === 'number' && activeUser.expiresAt <= now) {
        void deleteSharedUserRecordById(normalizeUsername(activeUser.username));
        localStorage.removeItem(EVEREST_ACTIVE_USER_KEY);
    }

    return activeUsers;
}

async function isUsernameTaken(username) {
    const normalized = normalizeUsername(username);
    const users = pruneExpiredUsers();
    const localTaken = users.some((user) => normalizeUsername(user.username) === normalized);
    const remoteUser = await getSharedUserRecord(username);

    if (remoteUser && typeof remoteUser.expiresAt === 'number' && remoteUser.expiresAt > Date.now()) {
        return true;
    }

    if (localTaken) {
        removeStaleLocalUsername(normalized);
    }

    return false;
}

function setFeedback(message, type) {
    if (!feedbackMessage) return;
    feedbackMessage.textContent = message;
    feedbackMessage.className = 'feedback-message';
    if (type) {
        feedbackMessage.classList.add(type);
    }
}

function clearStepErrors() {
    [stepNameSection, stepProfileSection, stepCourseSection].forEach((section) => {
        if (section) {
            section.classList.remove('error-state');
        }
    });
}

function showStepError(section) {
    if (!section) return;
    section.classList.remove('error-state');
    void section.offsetWidth;
    section.classList.add('error-state');
    window.setTimeout(() => {
        section.classList.remove('error-state');
    }, 1800);
}

function updatePreview() {
    const rawName = usernameInput ? usernameInput.value.trim() : '';
    const course = courseSelect ? courseSelect.value : '';

    if (previewAvatar) {
        previewAvatar.style.background = selectedColor;
    }

    if (previewEmoji) {
        previewEmoji.textContent = selectedEmoji;
    }

    if (previewName) {
        previewName.textContent = rawName || 'Your name here';
    }

    if (previewCourse) {
        previewCourse.textContent = course || 'Course pending';
    }
}

function setCourseDropdownState(isOpen) {
    if (!courseSelectShell || !courseTrigger || !courseDropdown) return;

    if (isOpen) {
        courseDropdown.hidden = false;
        courseTrigger.setAttribute('aria-expanded', 'true');
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                courseSelectShell.classList.add('open');
            });
        });
        if (courseSearch) {
            window.requestAnimationFrame(() => courseSearch.focus());
        }
        return;
    }

    courseSelectShell.classList.remove('open');
    courseTrigger.setAttribute('aria-expanded', 'false');

    window.setTimeout(() => {
        if (!courseSelectShell.classList.contains('open')) {
            courseDropdown.hidden = true;
        }
    }, 240);
}

function updateCourseTriggerLabel(value) {
    if (!courseTriggerLabel) return;
    courseTriggerLabel.textContent = value || 'Select your course';
}

function filterCourseOptions(query) {
    if (!courseOptions) return;
    const normalizedQuery = query.trim().toLowerCase();
    const options = courseOptions.querySelectorAll('.course-option');

    options.forEach((option) => {
        const haystack = (option.dataset.search || option.dataset.value || '').toLowerCase();
        const matches = haystack.includes(normalizedQuery);
        option.classList.toggle('hidden', !matches);
    });
}

function selectCourse(value) {
    if (!courseSelect) return;
    courseSelect.value = value;
    updateCourseTriggerLabel(value);

    const options = document.querySelectorAll('.course-option');
    options.forEach((option) => {
        option.classList.toggle('active', option.dataset.value === value);
    });

    if (courseSearch) {
        courseSearch.value = '';
        filterCourseOptions('');
    }

    updatePreview();
    setCourseDropdownState(false);
}

function setupCourseSelect() {
    if (!courseSelectShell || !courseTrigger || !courseDropdown || !courseOptions || !courseSelect) return;

    updateCourseTriggerLabel(courseSelect.value);

    courseTrigger.addEventListener('click', () => {
        const willOpen = courseDropdown.hidden;
        setCourseDropdownState(willOpen);
    });

    courseOptions.querySelectorAll('.course-option').forEach((option) => {
        option.addEventListener('click', () => {
            selectCourse(option.dataset.value);
        });
    });

    if (courseSearch) {
        courseSearch.addEventListener('input', () => {
            filterCourseOptions(courseSearch.value);
        });
    }

    document.addEventListener('click', (event) => {
        if (!courseSelectShell.contains(event.target)) {
            setCourseDropdownState(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setCourseDropdownState(false);
        }
    });
}

function closeCustomColorPanel() {
    if (!customColorPanel) return;

    if (customColorCloseTimer) {
        window.clearTimeout(customColorCloseTimer);
        customColorCloseTimer = null;
    }

    customColorPanel.classList.remove('dragging');
    customColorPanel.classList.add('closing');
    if (customColorTrigger) {
        customColorTrigger.classList.remove('active');
        customColorTrigger.setAttribute('aria-expanded', 'false');
    }
    isCustomColorPanelOpen = false;
    closeCustomColorStudio();

    customColorCloseTimer = window.setTimeout(() => {
        customColorPanel.hidden = true;
        customColorPanel.classList.remove('closing');
        customColorCloseTimer = null;
    }, 200);
}

function openCustomColorPanel() {
    if (!customColorPanel) return;
    ensureDesktopCustomColorPortals();

    if (customColorCloseTimer) {
        window.clearTimeout(customColorCloseTimer);
        customColorCloseTimer = null;
    }

    const triggerRect = customColorTrigger ? customColorTrigger.getBoundingClientRect() : null;
    const panelWidth = Math.min(340, window.innerWidth - 24);
    const preferredLeft = triggerRect ? triggerRect.left + (triggerRect.width / 2) - (panelWidth / 2) : (window.innerWidth - panelWidth) / 2;
    const safeLeft = Math.min(Math.max(12, preferredLeft), Math.max(12, window.innerWidth - panelWidth - 12));
    const safeTop = Math.max(16, triggerRect ? triggerRect.bottom + 16 : 160);
    customColorPanel.style.left = `${safeLeft}px`;
    customColorPanel.style.top = `${safeTop}px`;
    customColorPanel.style.transform = 'none';
    customColorPanel.classList.remove('closing', 'dragging');
    customColorPanel.hidden = false;
    if (customColorTrigger) {
        customColorTrigger.classList.add('active');
        customColorTrigger.setAttribute('aria-expanded', 'true');
    }
    isCustomColorPanelOpen = true;
    lockCustomColorOutsideClose(isDesktopCustomColorUI() ? 320 : 160);
}

function toggleCustomColorPanel() {
    if (isCustomColorPanelOpen) {
        closeCustomColorPanel();
        return;
    }

    openCustomColorPanel();
}

function activateCustomColorTrigger(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (isRandomizing) return;
    syncCustomColorUI(selectedColor);
    openCustomColorPanel();
}

function openCustomColorStudio() {
    if (!customColorStudio || !customStudioTrigger) return;
    ensureDesktopCustomColorPortals();
    if (isDesktopCustomColorUI() && !isCustomColorPanelOpen) {
        openCustomColorPanel();
    }
    if (customColorStudioCloseTimer) {
        window.clearTimeout(customColorStudioCloseTimer);
        customColorStudioCloseTimer = null;
    }
    if (isCompactMobile() && customColorPanel) {
        customColorPanel.classList.add('studio-hidden-mobile');
    }
    customColorStudio.hidden = false;
    customColorStudio.classList.remove('closing');
    customStudioTrigger.classList.add('active');
    customStudioTrigger.setAttribute('aria-expanded', 'true');
    customColorStudioOpen = true;
    positionCustomColorStudio();
    lockCustomColorOutsideClose(isDesktopCustomColorUI() ? 320 : 160);
}

function closeCustomColorStudio() {
    if (!customColorStudio || !customStudioTrigger) return;
    if (customColorStudioCloseTimer) {
        window.clearTimeout(customColorStudioCloseTimer);
        customColorStudioCloseTimer = null;
    }
    customColorStudio.classList.add('closing');
    customStudioTrigger.classList.remove('active');
    customStudioTrigger.setAttribute('aria-expanded', 'false');
    customColorStudioOpen = false;
    customColorStudioCloseTimer = window.setTimeout(() => {
        customColorStudio.hidden = true;
        customColorStudio.classList.remove('closing');
        if (customColorPanel) {
            customColorPanel.classList.remove('studio-hidden-mobile');
            if (isCompactMobile()) {
                if (mobilePanelReturnTimer) {
                    window.clearTimeout(mobilePanelReturnTimer);
                }
                customColorPanel.classList.remove('studio-returning-mobile');
                void customColorPanel.offsetWidth;
                customColorPanel.classList.add('studio-returning-mobile');
                mobilePanelReturnTimer = window.setTimeout(() => {
                    customColorPanel.classList.remove('studio-returning-mobile');
                    mobilePanelReturnTimer = null;
                }, 240);
            }
        }
        customColorStudioCloseTimer = null;
    }, 200);
}

function toggleCustomColorStudio() {
    if (customColorStudioOpen) {
        closeCustomColorStudio();
        return;
    }

    openCustomColorStudio();
}

function setCompactPickerState(block, toggle, body, isOpen, options = {}) {
    if (!block || !toggle || !body) return;

    block.classList.toggle('compact-open', isOpen);
    block.classList.toggle('compact-collapsed', !isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    body.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (!isOpen && options.closeFloatingColorUI) {
        closeCustomColorStudio();
        closeCustomColorPanel();
    }
}

function syncCompactIdentityDropdowns(forceReset = false) {
    const mobile = isCompactMobile();

    if (!forceReset && compactIdentityMobileMode === mobile) {
        return;
    }

    compactIdentityMobileMode = mobile;

    if (!mobile) {
        setCompactPickerState(colorPickerBlock, colorPickerToggle, colorPickerBody, true);
        setCompactPickerState(emojiPickerBlock, emojiPickerToggle, emojiPickerBody, true);
        return;
    }

    setCompactPickerState(colorPickerBlock, colorPickerToggle, colorPickerBody, false, { closeFloatingColorUI: true });
    setCompactPickerState(emojiPickerBlock, emojiPickerToggle, emojiPickerBody, false);
}

function setupCompactIdentityDropdowns() {
    if (colorPickerToggle && colorPickerBlock && colorPickerBody) {
        colorPickerToggle.addEventListener('click', () => {
            const nextOpen = !colorPickerBlock.classList.contains('compact-open');
            setCompactPickerState(colorPickerBlock, colorPickerToggle, colorPickerBody, nextOpen, { closeFloatingColorUI: !nextOpen });
        });
    }

    if (emojiPickerToggle && emojiPickerBlock && emojiPickerBody) {
        emojiPickerToggle.addEventListener('click', () => {
            const nextOpen = !emojiPickerBlock.classList.contains('compact-open');
            setCompactPickerState(emojiPickerBlock, emojiPickerToggle, emojiPickerBody, nextOpen);
        });
    }

    syncCompactIdentityDropdowns(true);
    window.addEventListener('resize', () => {
        syncCompactIdentityDropdowns();
    });
}

function renderProjectQrCode() {
    if (!projectQrImage) return;

    projectQrImage.classList.remove('is-fallback');
    projectQrImage.replaceChildren();

    if (typeof window.QRCodeStyling !== 'function') {
        projectQrImage.classList.add('is-fallback');
        return;
    }

    if (!projectQrCodeInstance) {
        projectQrCodeInstance = new window.QRCodeStyling({
            width: 256,
            height: 256,
            type: 'canvas',
            data: EVEREST_START_URL,
            margin: 12,
            image: 'icons/Logo B - Everest.png',
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.23,
                margin: 6,
                crossOrigin: 'anonymous'
            },
            qrOptions: {
                errorCorrectionLevel: 'Q'
            },
            dotsOptions: {
                type: 'rounded',
                gradient: {
                    type: 'linear',
                    rotation: Math.PI / 3,
                    colorStops: [
                        { offset: 0, color: '#1c2358' },
                        { offset: 0.34, color: '#4b74f0' },
                        { offset: 0.7, color: '#7fd9f7' },
                        { offset: 1, color: '#d8f6ef' }
                    ]
                }
            },
            cornersSquareOptions: {
                color: '#1c2358',
                type: 'extra-rounded'
            },
            cornersDotOptions: {
                color: '#4b74f0',
                type: 'dot'
            },
            backgroundOptions: {
                color: '#ffffff'
            }
        });
    } else {
        projectQrCodeInstance.update({
            data: EVEREST_START_URL
        });
    }

    projectQrCodeInstance.append(projectQrImage);
}

function openProjectQrModal() {
    if (!projectQrModal) return;

    if (projectQrCloseTimer) {
        window.clearTimeout(projectQrCloseTimer);
        projectQrCloseTimer = null;
    }

    renderProjectQrCode();

    projectQrModal.hidden = false;
    projectQrModal.classList.remove('is-closing');
    projectQrModal.setAttribute('aria-hidden', 'false');
    projectQrTrigger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}

function closeProjectQrModal() {
    if (!projectQrModal) return;

    if (projectQrCloseTimer) {
        window.clearTimeout(projectQrCloseTimer);
        projectQrCloseTimer = null;
    }

    projectQrModal.classList.add('is-closing');
    projectQrTrigger?.setAttribute('aria-expanded', 'false');

    projectQrCloseTimer = window.setTimeout(() => {
        projectQrModal.hidden = true;
        projectQrModal.classList.remove('is-closing');
        projectQrModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        projectQrCloseTimer = null;
    }, 220);
}

function setupProjectQrModal() {
    if (!projectQrTrigger || !projectQrModal) return;

    projectQrTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        openProjectQrModal();
    });

    projectQrClose?.addEventListener('click', (event) => {
        event.preventDefault();
        closeProjectQrModal();
    });

    projectQrBackdrop?.addEventListener('click', () => {
        closeProjectQrModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && projectQrModal && !projectQrModal.hidden) {
            closeProjectQrModal();
        }
    });
}

function positionCustomColorStudio() {
    if (!customColorPanel || !customColorStudio) return;

    const panelRect = customColorPanel.getBoundingClientRect();
    const studioWidth = Math.min(360, window.innerWidth - 24);

    if (window.innerWidth <= 780) {
        const centeredLeft = Math.max(10, (window.innerWidth - studioWidth) / 2);
        const stackedTop = Math.min(
            Math.max(16, panelRect.bottom + 12),
            Math.max(16, window.innerHeight - customColorStudio.offsetHeight - 16)
        );
        customColorStudio.style.left = `${centeredLeft}px`;
        customColorStudio.style.top = `${stackedTop}px`;
        return;
    }

    const preferredLeft = panelRect.right + 14;
    const fallbackLeft = panelRect.left - studioWidth - 14;
    let left = preferredLeft;

    if (preferredLeft + studioWidth > window.innerWidth - 12) {
        left = fallbackLeft > 12
            ? fallbackLeft
            : Math.min(Math.max(12, panelRect.left), window.innerWidth - studioWidth - 12);
    }

    const top = Math.min(
        Math.max(16, panelRect.top),
        Math.max(16, window.innerHeight - customColorStudio.offsetHeight - 16)
    );
    customColorStudio.style.left = `${left}px`;
    customColorStudio.style.top = `${top}px`;
}

function setCustomStudioMode(mode) {
    if (!isCompactMobile() && mode === 'hex') {
        mode = 'rgb';
    }

    customStudioMode = mode;

    customStudioTabs.forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    customStudioModes.forEach((panel) => {
        const active = panel.dataset.modePanel === mode;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
    });
}

function syncCustomColorUI(colorValue) {
    const normalized = normalizeHexColor(colorValue) || selectedColor;
    const rgb = hexToRgb(normalized);
    if (!rgb) return;

    customColorState = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    if (customColorText) {
        customColorText.value = normalized;
    }

    if (customColorTextStudio) {
        customColorTextStudio.value = normalized;
    }

    if (customColorPreview) {
        customColorPreview.style.background = normalized;
    }

    if (customColorBar) {
        customColorBar.style.background = `linear-gradient(90deg, rgba(255,255,255,0.2) 0%, ${normalized} 22%, ${normalized} 78%, rgba(0,0,0,0.12) 100%)`;
    }

    if (customColorHex) {
        customColorHex.textContent = normalized;
    }

    if (customColorTrigger) {
        customColorTrigger.style.setProperty('--swatch-color', normalized);
        customColorTrigger.dataset.color = normalized;
    }

    if (customColorR) customColorR.value = String(rgb.r);
    if (customColorG) customColorG.value = String(rgb.g);
    if (customColorB) customColorB.value = String(rgb.b);
    if (customColorH) customColorH.value = String(hsl.h);
    if (customColorS) customColorS.value = String(hsl.s);
    if (customColorL) customColorL.value = String(hsl.l);

    updateCustomStudioControls();
}

function updateCustomStudioControls() {
    if (!customColorSurface || !customColorSurfaceHandle || !customHueTrack || !customHueHandle) return;

    const pureHue = hsvToRgb(customColorState.h, 1, 1);
    customColorSurface.style.background = rgbToHex(pureHue.r, pureHue.g, pureHue.b);
    customColorSurfaceHandle.style.left = `${customColorState.s * 100}%`;
    customColorSurfaceHandle.style.top = `${(1 - customColorState.v) * 100}%`;
    customHueHandle.style.left = `${(customColorState.h / 360) * 100}%`;
    customHueHandle.style.top = '50%';
}

function applyCustomStateToUI() {
    const rgb = hsvToRgb(customColorState.h, customColorState.s, customColorState.v);
    scheduleCustomColorSync(rgbToHex(rgb.r, rgb.g, rgb.b));
}

function updateSurfaceFromPointer(event) {
    if (!customColorSurface) return;
    const rect = customColorSurface.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    customColorState.s = x;
    customColorState.v = 1 - y;
    applyCustomStateToUI();
}

function updateHueFromPointer(event) {
    if (!customHueTrack) return;
    const rect = customHueTrack.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    customColorState.h = x * 360;
    applyCustomStateToUI();
}

function applyCustomColor(colorValue) {
    const normalized = normalizeHexColor(colorValue);
    if (!normalized || !customColorTrigger) return;

    syncCustomColorUI(normalized);
    applySelectedColor(customColorTrigger, normalized);
    closeCustomColorPanel();
    setFeedback('Your color was forged successfully. Everest now reflects your custom climb tone.', 'success');
}

function setupCustomColorPicker() {
    if (!customColorTrigger || !customColorPanel) return;

    customColorPanel.hidden = true;
    customColorPanel.classList.remove('closing', 'dragging', 'studio-hidden-mobile', 'studio-returning-mobile');
    isCustomColorPanelOpen = false;
    if (customColorStudio) {
        customColorStudio.hidden = true;
        customColorStudio.classList.remove('closing', 'dragging');
    }
    customColorStudioOpen = false;
    syncCustomColorUI(selectedColor);
    ensureDesktopCustomColorPortals();

    customColorTrigger.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
    });
    customColorTrigger.addEventListener('click', activateCustomColorTrigger);
    customColorTrigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            activateCustomColorTrigger(event);
        }
    });

    if (customStudioTrigger) {
        customStudioTrigger.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });
        customStudioTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleCustomColorStudio();
        });
    }

    if (customStudioClose) {
        customStudioClose.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });
        customStudioClose.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeCustomColorStudio();
        });
    }

    customStudioTabs.forEach((tab) => {
        tab.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            setCustomStudioMode(tab.dataset.mode || 'rgb');
        });
    });

    customColorPanel.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
    });
    customColorPanel.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    customColorStudio?.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
    });
    customColorStudio?.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    if (customColorText) {
        customColorText.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });
        customColorText.addEventListener('click', (event) => {
            event.stopPropagation();
        });
        customColorText.addEventListener('input', () => {
            const partial = customColorText.value.trim();
            if (customColorPreview && /^#?[0-9a-fA-F]{3,6}$/.test(partial)) {
                const normalized = normalizeHexColor(partial);
                if (normalized) {
                    scheduleCustomColorSync(normalized);
                }
            }
        });

        customColorText.addEventListener('blur', () => {
            const normalized = normalizeHexColor(customColorText.value) || selectedColor;
            syncCustomColorUI(normalized);
        });
    }

    if (customColorTextStudio) {
        customColorTextStudio.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });
        customColorTextStudio.addEventListener('click', (event) => {
            event.stopPropagation();
        });
        customColorTextStudio.addEventListener('input', () => {
            const partial = customColorTextStudio.value.trim();
            const normalized = normalizeHexColor(partial);
            if (normalized) {
                scheduleCustomColorSync(normalized);
            }
        });

        customColorTextStudio.addEventListener('blur', () => {
            const normalized = normalizeHexColor(customColorTextStudio.value) || selectedColor;
            syncCustomColorUI(normalized);
        });
    }

    [
        { input: customColorR, max: 255 },
        { input: customColorG, max: 255 },
        { input: customColorB, max: 255 }
    ].forEach(({ input, max }) => {
        if (!input) return;

        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '').slice(0, 3);
            const r = clamp(Number(customColorR ? customColorR.value || 0 : 0), 0, max);
            const g = clamp(Number(customColorG ? customColorG.value || 0 : 0), 0, max);
            const b = clamp(Number(customColorB ? customColorB.value || 0 : 0), 0, max);
            scheduleCustomColorSync(rgbToHex(r, g, b));
        });
    });

    [
        { input: customColorH, max: 360 },
        { input: customColorS, max: 100 },
        { input: customColorL, max: 100 }
    ].forEach(({ input }) => {
        if (!input) return;

        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '').slice(0, 3);
            const h = clamp(Number(customColorH ? customColorH.value || 0 : 0), 0, 360);
            const s = clamp(Number(customColorS ? customColorS.value || 0 : 0), 0, 100);
            const l = clamp(Number(customColorL ? customColorL.value || 0 : 0), 0, 100);
            const rgb = hslToRgb(h, s, l);
            scheduleCustomColorSync(rgbToHex(rgb.r, rgb.g, rgb.b));
        });
    });

    if (customColorSurface) {
        customColorSurface.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            customColorSurface.setPointerCapture(event.pointerId);
            updateSurfaceFromPointer(event);
            const move = (moveEvent) => {
                updateSurfaceFromPointer(moveEvent);
            };
            const up = (upEvent) => {
                customColorSurface.removeEventListener('pointermove', move);
                customColorSurface.removeEventListener('pointerup', up);
                customColorSurface.removeEventListener('pointercancel', up);
                try {
                    customColorSurface.releasePointerCapture(upEvent.pointerId);
                } catch (error) {
                    void error;
                }
            };
            customColorSurface.addEventListener('pointermove', move);
            customColorSurface.addEventListener('pointerup', up);
            customColorSurface.addEventListener('pointercancel', up);
        });
    }

    if (customHueTrack) {
        customHueTrack.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            customHueTrack.setPointerCapture(event.pointerId);
            updateHueFromPointer(event);
            const move = (moveEvent) => {
                updateHueFromPointer(moveEvent);
            };
            const up = (upEvent) => {
                customHueTrack.removeEventListener('pointermove', move);
                customHueTrack.removeEventListener('pointerup', up);
                customHueTrack.removeEventListener('pointercancel', up);
                try {
                    customHueTrack.releasePointerCapture(upEvent.pointerId);
                } catch (error) {
                    void error;
                }
            };
            customHueTrack.addEventListener('pointermove', move);
            customHueTrack.addEventListener('pointerup', up);
            customHueTrack.addEventListener('pointercancel', up);
        });
    }

    if (customColorApply) {
        customColorApply.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });
        customColorApply.addEventListener('click', (event) => {
            event.stopPropagation();
            const normalized = normalizeHexColor(customColorText ? customColorText.value : '');
            applyCustomColor(normalized || selectedColor);
        });
    }

    if (customColorClose) {
        customColorClose.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        customColorClose.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeCustomColorPanel();
        });
    }

    document.addEventListener('pointerdown', (event) => {
        if (!isDesktopCustomColorUI()) {
            return;
        }
        if (Date.now() < customColorOutsideCloseLockUntil || customColorDragState || customColorStudioDragState) {
            return;
        }
        const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : [];
        const clickedInsidePanel = eventPath.includes(customColorPanel);
        const clickedTrigger = eventPath.includes(customColorTrigger);
        const clickedStudio = customColorStudio ? eventPath.includes(customColorStudio) : false;
        const clickedStudioTrigger = customStudioTrigger ? eventPath.includes(customStudioTrigger) : false;

        if (!clickedInsidePanel && !clickedTrigger && !clickedStudio && !clickedStudioTrigger) {
            closeCustomColorPanel();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (customColorStudioOpen) {
                closeCustomColorStudio();
                return;
            }
            closeCustomColorPanel();
        }
    });

    window.addEventListener('resize', () => {
        ensureDesktopCustomColorPortals();
        if (isCustomColorPanelOpen && customColorStudioOpen) {
            positionCustomColorStudio();
        }
        if (!isCompactMobile() && customStudioMode === 'hex') {
            setCustomStudioMode('rgb');
        }
        if (!customColorStudioOpen && customColorPanel) {
            customColorPanel.classList.remove('studio-hidden-mobile');
        }
    });

    setupCustomColorDrag();
    setupCustomColorStudioDrag();
    setCustomStudioMode('rgb');
}

function setupCustomColorDrag() {
    if (!customColorPanel || !customColorHeader) return;

    customColorHeader.addEventListener('pointerdown', (event) => {
        if (event.target instanceof Element && event.target.closest('button, input, textarea, select, a')) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        lockCustomColorOutsideClose(360);

        customColorDragState = {
            startX: event.clientX,
            startY: event.clientY,
            panelLeft: customColorPanel.offsetLeft,
            panelTop: customColorPanel.offsetTop
        };

        customColorPanel.classList.add('dragging');
        customColorHeader.setPointerCapture(event.pointerId);
    });

    customColorHeader.addEventListener('pointermove', (event) => {
        if (!customColorDragState) return;
        event.preventDefault();
        event.stopPropagation();

        const nextLeft = customColorDragState.panelLeft + (event.clientX - customColorDragState.startX);
        const nextTop = customColorDragState.panelTop + (event.clientY - customColorDragState.startY);
        const maxLeft = Math.max(12, window.innerWidth - customColorPanel.offsetWidth - 12);
        const maxTop = Math.max(12, window.innerHeight - customColorPanel.offsetHeight - 12);

        customColorPanel.style.left = `${Math.min(Math.max(12, nextLeft), maxLeft)}px`;
        customColorPanel.style.top = `${Math.min(Math.max(12, nextTop), maxTop)}px`;
    });

    const finishDrag = (event) => {
        if (!customColorDragState) return;

        customColorDragState = null;
        customColorPanel.classList.remove('dragging');
        lockCustomColorOutsideClose(240);

        if (event && typeof event.pointerId === 'number') {
            try {
                customColorHeader.releasePointerCapture(event.pointerId);
            } catch (error) {
                void error;
            }
        }
    };

    customColorHeader.addEventListener('pointerup', finishDrag);
    customColorHeader.addEventListener('pointercancel', finishDrag);
}

function setupCustomColorStudioDrag() {
    if (!customColorStudio || !customStudioDragIndicator) return;

    customStudioDragIndicator.addEventListener('pointerdown', (event) => {
        if (event.target instanceof Element && event.target.closest('button, input, textarea, select, a')) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        lockCustomColorOutsideClose(360);

        customColorStudioDragState = {
            startX: event.clientX,
            startY: event.clientY,
            panelLeft: customColorStudio.offsetLeft,
            panelTop: customColorStudio.offsetTop
        };

        customColorStudio.classList.add('dragging');
        customStudioDragIndicator.setPointerCapture(event.pointerId);
    });

    customStudioDragIndicator.addEventListener('pointermove', (event) => {
        if (!customColorStudioDragState) return;
        event.preventDefault();
        event.stopPropagation();

        const nextLeft = customColorStudioDragState.panelLeft + (event.clientX - customColorStudioDragState.startX);
        const nextTop = customColorStudioDragState.panelTop + (event.clientY - customColorStudioDragState.startY);
        const maxLeft = Math.max(12, window.innerWidth - customColorStudio.offsetWidth - 12);
        const maxTop = Math.max(12, window.innerHeight - customColorStudio.offsetHeight - 12);

        customColorStudio.style.left = `${Math.min(Math.max(12, nextLeft), maxLeft)}px`;
        customColorStudio.style.top = `${Math.min(Math.max(12, nextTop), maxTop)}px`;
    });

    const finishDrag = (event) => {
        if (!customColorStudioDragState) return;

        customColorStudioDragState = null;
        customColorStudio.classList.remove('dragging');
        lockCustomColorOutsideClose(240);

        if (event && typeof event.pointerId === 'number') {
            try {
                customStudioDragIndicator.releasePointerCapture(event.pointerId);
            } catch (error) {
                void error;
            }
        }
    };

    customStudioDragIndicator.addEventListener('pointerup', finishDrag);
    customStudioDragIndicator.addEventListener('pointercancel', finishDrag);
}

function attachColorSelection() {
    const colorButtons = document.querySelectorAll('.color-swatch');
    colorButtons.forEach((button) => {
        if (button.classList.contains('custom-color-trigger')) return;

        button.addEventListener('click', () => {
            if (isRandomizing) return;
            applySelectedColor(button);
        });
    });
}

function attachEmojiSelection() {
    const emojiButtons = document.querySelectorAll('.emoji-choice');
    emojiButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (isRandomizing) return;
            applySelectedEmoji(button);
        });
    });
}

function applySelectedColor(button, explicitColor) {
    const colorButtons = document.querySelectorAll('.color-swatch');
    colorButtons.forEach((item) => item.classList.remove('selected'));
    if (!button) return;

    const nextColor = explicitColor || button.dataset.color || '#667eea';

    button.classList.add('selected');
    selectedColor = nextColor;
    button.style.setProperty('--swatch-color', nextColor);

    if (button.classList.contains('custom-color-trigger')) {
        syncCustomColorUI(nextColor);
    }

    updatePreview();

    if (previewAvatar) {
        previewAvatar.classList.remove('random-finish', 'manual-color');
    }

    if (!isRandomizing && previewAvatar) {
        void previewAvatar.offsetWidth;
        previewAvatar.classList.add('manual-color');
        window.setTimeout(() => {
            previewAvatar.classList.remove('manual-color');
        }, 360);
    }
}

function applySelectedEmoji(button) {
    const emojiButtons = document.querySelectorAll('.emoji-choice');
    emojiButtons.forEach((item) => item.classList.remove('selected'));
    if (!button) return;

    button.classList.add('selected');
    selectedEmoji = button.dataset.emoji || '🧠';
    updatePreview();

    if (previewAvatar) {
        previewAvatar.classList.remove('random-finish', 'manual-emoji');
    }

    if (!isRandomizing && previewAvatar) {
        void previewAvatar.offsetWidth;
        previewAvatar.classList.add('manual-emoji');
        window.setTimeout(() => {
            previewAvatar.classList.remove('manual-emoji');
        }, 380);
    }
}

function randomizeProfile() {
    if (isRandomizing) return;
    const colorButtons = Array.from(document.querySelectorAll('.color-swatch'));
    const emojiButtons = Array.from(document.querySelectorAll('.emoji-choice'));
    if (!colorButtons.length || !emojiButtons.length) return;

    isRandomizing = true;
    closeCustomColorPanel();

    if (previewAvatar) {
        previewAvatar.classList.remove('manual-color', 'manual-emoji', 'random-finish');
        previewAvatar.classList.add('randomizing');
    }

    if (randomizeProfileBtn) {
        randomizeProfileBtn.classList.add('randomizing');
    }

    let ticks = 0;
    const totalTicks = 14;

    randomizeTimer = window.setInterval(() => {
        const randomColorButton = colorButtons[Math.floor(Math.random() * colorButtons.length)];
        const randomEmojiButton = emojiButtons[Math.floor(Math.random() * emojiButtons.length)];

        if (randomColorButton.classList.contains('custom-color-trigger')) {
            const generatedColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
            syncCustomColorUI(generatedColor);
            applySelectedColor(randomColorButton, generatedColor);
        } else {
            applySelectedColor(randomColorButton);
        }

        applySelectedEmoji(randomEmojiButton);

        ticks += 1;
        if (ticks >= totalTicks) {
            window.clearInterval(randomizeTimer);
            randomizeTimer = null;
            isRandomizing = false;

            if (previewAvatar) {
                previewAvatar.classList.remove('randomizing');
                previewAvatar.classList.remove('random-finish');
                void previewAvatar.offsetWidth;
                previewAvatar.classList.add('random-finish');

                window.setTimeout(() => {
                    previewAvatar.classList.remove('random-finish');
                }, 420);
            }

            if (randomizeProfileBtn) {
                randomizeProfileBtn.classList.remove('randomizing');
            }

            setFeedback('Your new Everest identity is ready. Keep it, or roll again until it matches your climb.', 'success');
        }
    }, 110);
}

function setupScrollablePopAnimation(containerSelector, itemSelector) {
    const containers = document.querySelectorAll(containerSelector);
    if (!containers.length) return;

    containers.forEach((container) => {
        const items = container.querySelectorAll(itemSelector);
        if (!items.length) return;

        items.forEach((item) => item.classList.add('scroll-item'));

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
                        entry.target.classList.add('in-view');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                root: container,
                threshold: [0.2, 0.55, 0.85],
                rootMargin: '12px 0px 12px 0px'
            }
        );

        items.forEach((item) => observer.observe(item));
    });
}

function buildUserProfile() {
    const now = Date.now();
    const username = formatUsernameDisplay(sanitizeUsername(usernameInput.value));
    return {
        username,
        usernameNormalized: normalizeUsername(username),
        profileEmoji: selectedEmoji,
        profileColor: selectedColor,
        course: courseSelect.value,
        createdAt: now,
        expiresAt: now + EVEREST_SESSION_MS
    };
}

function persistUserProfile(profile) {
    const users = pruneExpiredUsers();
    users.push(profile);
    writeJsonStorage(EVEREST_USERS_KEY, users);
    writeJsonStorage(EVEREST_ACTIVE_USER_KEY, profile);
}

async function validateForm() {
    const username = formatUsernameDisplay(sanitizeUsername(usernameInput.value));
    const course = courseSelect.value;

    if (!username) {
        return {
            message: 'Step 1 is still empty. Enter the name you want to use in Everest.',
            section: stepNameSection
        };
    }

    if (username.length < 3) {
        return {
            message: 'Your name is almost ready. Add at least 3 characters to continue.',
            section: stepNameSection
        };
    }

    if (normalizeUsername(username).length < 3) {
        return {
            message: 'Step 1 needs a clearer name so your temporary profile can be identified.',
            section: stepNameSection
        };
    }

    if (await isUsernameTaken(username)) {
        return {
            message: 'That Everest name is already active right now. Choose another one and keep climbing.',
            section: stepNameSection
        };
    }

    if (!course) {
        return {
            message: 'You are one step away from entering Everest. Choose your course path to continue the climb.',
            section: stepCourseSection
        };
    }

    return null;
}

function getDashboardTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || DASHBOARD_FALLBACK_URL;
}

async function submitRegistration(event) {
    event.preventDefault();
    if (!registerForm) return;

    const cleaned = formatUsernameDisplay(sanitizeUsername(usernameInput.value));
    usernameInput.value = cleaned;
    clearStepErrors();

    const validationError = await validateForm();
    if (validationError) {
        showStepError(validationError.section);
        setFeedback(validationError.message, 'error');
        updatePreview();
        return;
    }

    const profile = buildUserProfile();
    persistUserProfile(profile);

    setFeedback('Access created successfully. Everest is preparing your dashboard for the next step in your English climb...', 'success');

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Access created';
    }

    setTimeout(() => {
        window.location.href = getDashboardTarget();
    }, 900);
}

function syncDashboardAvatar() {
    pruneExpiredUsers();
    const avatarImage = document.querySelector('img.user');
    const activeUser = readJsonStorage(EVEREST_ACTIVE_USER_KEY, null);

    if (!avatarImage || !activeUser) return;

    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'dashboard-user-avatar';
    avatarWrapper.setAttribute('aria-label', `${activeUser.username} profile avatar`);
    avatarWrapper.title = `${activeUser.username} - ${activeUser.course}`;
    avatarWrapper.style.width = '2.1rem';
    avatarWrapper.style.height = '2.1rem';
    avatarWrapper.style.borderRadius = '50%';
    avatarWrapper.style.display = 'inline-flex';
    avatarWrapper.style.alignItems = 'center';
    avatarWrapper.style.justifyContent = 'center';
    avatarWrapper.style.fontSize = '1.1rem';
    avatarWrapper.style.background = activeUser.profileColor;
    avatarWrapper.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.18)';
    avatarWrapper.textContent = activeUser.profileEmoji;

    avatarImage.replaceWith(avatarWrapper);
}

function bindLiveInputs() {
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const sanitized = usernameInput.value.replace(/[^A-Za-z0-9_\- ]+/g, '');
            usernameInput.value = formatUsernameDisplay(sanitized);
            updatePreview();
            if (feedbackMessage && feedbackMessage.classList.contains('error')) {
                setFeedback('', '');
            }
            if (stepNameSection) {
                stepNameSection.classList.remove('error-state');
            }
        });

        usernameInput.addEventListener('blur', () => {
            usernameInput.value = formatUsernameDisplay(sanitizeUsername(usernameInput.value));
            updatePreview();
        });
    }

    if (courseSelect) {
        courseSelect.addEventListener('change', () => {
            updatePreview();
            if (stepCourseSection) {
                stepCourseSection.classList.remove('error-state');
            }
            if (feedbackMessage && feedbackMessage.classList.contains('error')) {
                setFeedback('', '');
            }
        });
    }
}

function initRegisterPage() {
    if (!registerForm) return;

    pruneExpiredUsers();
    attachColorSelection();
    attachEmojiSelection();
    setupCustomColorPicker();
    setupCompactIdentityDropdowns();
    setupProjectQrModal();
    setupScrollablePopAnimation('.color-options', '.color-swatch');
    setupScrollablePopAnimation('.emoji-options', '.emoji-choice');
    setupScrollablePopAnimation('.course-options', '.course-option');
    setupCourseSelect();
    bindLiveInputs();
    updatePreview();

    registerForm.addEventListener('submit', submitRegistration);

    if (randomizeProfileBtn) {
        randomizeProfileBtn.addEventListener('click', randomizeProfile);
    }
}

function init() {
    initRegisterPage();
    syncDashboardAvatar();
}

init();
