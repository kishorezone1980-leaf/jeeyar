/**
 * Ask Acharya — chat UI backed by HH Chinnajeeyar Swamiji's discourses.
 * Set window.ASK_SWAMIJI_API_URL to your RAG/LLM endpoint when ready.
 */

// Set window.ASK_CHAT_BASE_URL in a <script> tag before this file to override.
// Set it to "" (empty string) to force the local mock instead of the real API.
const CHAT_BASE_URL =
  typeof window !== "undefined" && window.ASK_CHAT_BASE_URL != null
    ? window.ASK_CHAT_BASE_URL
    : "http://localhost:8000";
const USE_MOCK = !CHAT_BASE_URL;

const STORAGE_KEY = "ask-swamiji-chats-v1";
const PROFILE_KEY = "ask-swamiji-profile";

const TOPIC_PROMPTS = {
  gita: "What does Swamiji teach about the Bhagavad Gita?",
  life: "How does Swamiji explain living a righteous life according to our religion?",
  rituals: "What is the significance of our rituals according to Swamiji's discourses?",
  ramanuja: "What does Swamiji say about Sri Ramanujacharya and his teachings?",
  devotion: "How does Swamiji describe true devotion (bhakti) in his discourses?",
};

const page = document.body;
const chatEl = document.getElementById("ask-chat");
const form = document.getElementById("ask-form");
const input = document.getElementById("ask-input");
const sendBtn = document.getElementById("ask-send");
const composerBox = document.getElementById("ask-composer-box");
const promptChips = document.querySelectorAll(".ask-composer__prompt-chip");
const promptsViewport = document.getElementById("ask-prompts-viewport");
const promptsFadeLeft = document.getElementById("ask-prompts-fade-left");
const promptsFadeRight = document.getElementById("ask-prompts-fade-right");
const topicPanel = document.getElementById("ask-topic-panel");
const topicPanelOverlay = document.getElementById("ask-topic-panel-overlay");
const topicPanelBody = document.getElementById("ask-topic-panel-body");

const TOPIC_PANEL_EXTERNAL_ICON = `<svg class="ask-topic-panel__external-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const TOPIC_PANEL_ARTICLE_ICON = `<svg class="ask-topic-panel__article-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const mainTitle = document.getElementById("ask-main-title");
const topicsStrip = document.getElementById("ask-topics-strip");
const topicsViewport = document.querySelector(".ask-topics__viewport");
const topicsTrack = document.getElementById("ask-topics-track");
const topicsPrev = document.getElementById("ask-topics-prev");
const topicsNext = document.getElementById("ask-topics-next");
const exploreSection = document.getElementById("ask-explore");
const exploreSearchInput = document.getElementById("ask-explore-search");
const exploreFeaturedTrack = document.getElementById("ask-explore-featured-track");
const exploreFeaturedDots = document.getElementById("ask-explore-featured-dots");
const exploreFeaturedNext = document.getElementById("ask-explore-featured-next");
const exploreFiltersEl = document.getElementById("ask-explore-filters");
const exploreGridEl = document.getElementById("ask-explore-grid");
const exploreEmptyEl = document.getElementById("ask-explore-empty");
const exploreSubtitleEl = document.getElementById("ask-explore-subtitle");
const sidebarOverlay = document.getElementById("ask-sidebar-overlay");
const sidebarToggle = document.getElementById("ask-sidebar-toggle");
const sidebarExpand = document.getElementById("ask-sidebar-expand");
const sidebarCollapse = document.getElementById("ask-sidebar-collapse");
const newChatBtn = document.getElementById("ask-new-chat");
const searchToggleBtn = document.getElementById("ask-search-toggle");
const exploreTopicsBtn = document.getElementById("ask-explore-topics");
const searchPanel = document.getElementById("ask-search-panel");
const searchInput = document.getElementById("ask-search-chats");
const chatListEl = document.getElementById("ask-chat-list");
const starredSection = document.getElementById("ask-starred-section");
const starredListEl = document.getElementById("ask-starred-list");
const sidebarEmpty = document.getElementById("ask-sidebar-empty");
const profileAvatarEl = document.getElementById("ask-profile-avatar");
const profileNameEl = document.getElementById("ask-profile-name");
const profileMetaEl = document.getElementById("ask-profile-meta");
const menuButtons = document.querySelectorAll(".ask-sidebar__menu-btn");

let appState = { activeChatId: null, chats: [], searchQuery: "", sidebarMenu: "new" };
let isLoading = false;
let exploreCategory = "featured";
let exploreSearch = "";
let featuredSlideIndex = 0;

const MOBILE_MQ = window.matchMedia("(max-width: 900px)");

function isMobileLayout() {
  return MOBILE_MQ.matches;
}

function setBodyScrollLock(lock) {
  document.documentElement.classList.toggle("ask-scroll-lock", lock);
}

function syncViewportInsets() {
  if (!window.visualViewport || !isMobileLayout()) {
    document.documentElement.style.setProperty("--ask-keyboard-offset", "0px");
    return;
  }

  const vv = window.visualViewport;
  const keyboardOffset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  document.documentElement.style.setProperty(
    "--ask-keyboard-offset",
    `${Math.round(keyboardOffset)}px`
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.chats)) {
      appState = {
        activeChatId: parsed.activeChatId ?? null,
        chats: parsed.chats,
        searchQuery: "",
        sidebarMenu: "new",
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
}

function getUserProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.name) return p;
    }
  } catch {
    /* ignore */
  }
  return { name: "Devotee", role: "Seeker" };
}

function initialsFromName(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderUserProfile() {
  const profile = getUserProfile();
  if (profileNameEl) profileNameEl.textContent = profile.name;
  if (profileMetaEl) profileMetaEl.textContent = profile.role ?? "Seeker";
  if (profileAvatarEl) profileAvatarEl.textContent = initialsFromName(profile.name);
}

function setSidebarMenu(menu) {
  appState.sidebarMenu = menu;
  menuButtons.forEach((btn) => {
    btn.classList.toggle(
      "ask-sidebar__menu-btn--active",
      btn.dataset.menu === menu
    );
  });
}

function showSearchPanel() {
  setSidebarMenu("search");
  if (searchPanel) searchPanel.hidden = false;
  searchInput?.focus();
}

function hideSearchPanel() {
  if (searchPanel) searchPanel.hidden = true;
  if (searchInput) searchInput.value = "";
  appState.searchQuery = "";
  renderSidebar();
}

function showExploreTopics() {
  page.classList.add("ask-page--explore");
  page.classList.remove("ask-page--chatting");
  chatEl.hidden = true;
  if (exploreSection) exploreSection.hidden = false;
  if (mainTitle) mainTitle.textContent = EXPLORE_TOPICS?.title ?? "Explore topics";
  setSidebarMenu("explore");
  closeSidebarOnMobile();
  renderExploreTopics();

  requestAnimationFrame(() => {
    exploreSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    exploreSearchInput?.focus({ preventScroll: true });
  });
}

function exitExploreMode() {
  page.classList.remove("ask-page--explore");
  if (exploreSection) exploreSection.hidden = true;
  exploreSearch = "";
  exploreCategory = "featured";
  featuredSlideIndex = 0;
  if (exploreSearchInput) exploreSearchInput.value = "";
  renderExploreTopics();
  updateChatMode();
}

function handleTopicAction(topicKey) {
  if (topicKey === "gita" && TOPIC_PANELS?.gita) {
    openTopicPanel("gita");
    return;
  }

  const prompt = TOPIC_PROMPTS[topicKey];
  if (prompt) submitQuestion(prompt);
}

function getFilteredExploreTopics() {
  const items = EXPLORE_TOPICS?.topics ?? [];
  const q = exploreSearch.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);

    if (q) return matchesSearch;

    const matchesCategory =
      exploreCategory === "featured"
        ? item.featured === true
        : item.category === exploreCategory;

    return matchesCategory;
  });
}

function setFeaturedSlide(index) {
  const slides = EXPLORE_TOPICS?.featured ?? [];
  if (!slides.length || !exploreFeaturedTrack) return;

  featuredSlideIndex = ((index % slides.length) + slides.length) % slides.length;
  exploreFeaturedTrack.style.transform = `translateX(-${featuredSlideIndex * 100}%)`;

  exploreFeaturedDots?.querySelectorAll(".ask-explore__featured-dot").forEach((dot, i) => {
    dot.classList.toggle("ask-explore__featured-dot--active", i === featuredSlideIndex);
    dot.setAttribute("aria-selected", String(i === featuredSlideIndex));
  });
}

function renderExploreFeatured() {
  if (!exploreFeaturedTrack || !EXPLORE_TOPICS?.featured?.length) return;

  exploreFeaturedTrack.innerHTML = EXPLORE_TOPICS.featured
    .map(
      (slide) => `
    <article class="ask-explore__featured-slide">
      <div class="ask-explore__featured-card" style="background: ${slide.gradient}">
        <div class="ask-explore__featured-left">
          <div class="ask-explore__featured-icon" aria-hidden="true">${slide.icon}</div>
          <h3 class="ask-explore__featured-title">${slide.title}</h3>
          <p class="ask-explore__featured-subtitle">${slide.subtitle}</p>
          <button type="button" class="ask-explore__featured-cta" data-topic="${slide.topic}">${slide.cta}</button>
        </div>
        <div class="ask-explore__featured-preview">
          ${
            slide.previewImage
              ? `<img src="${slide.previewImage}" alt="" width="200" height="72" loading="lazy" />`
              : ""
          }
          <p class="ask-explore__featured-preview-text">${slide.previewText ?? ""}</p>
        </div>
      </div>
    </article>`
    )
    .join("");

  if (exploreFeaturedDots) {
    exploreFeaturedDots.innerHTML = EXPLORE_TOPICS.featured
      .map(
        (_, i) =>
          `<button type="button" class="ask-explore__featured-dot${i === 0 ? " ask-explore__featured-dot--active" : ""}" data-slide="${i}" role="tab" aria-label="Featured slide ${i + 1}" aria-selected="${i === 0}"></button>`
      )
      .join("");
  }

  setFeaturedSlide(featuredSlideIndex);
}

function renderExploreFilters() {
  if (!exploreFiltersEl || !EXPLORE_TOPICS?.categories) return;

  exploreFiltersEl.innerHTML = EXPLORE_TOPICS.categories
    .map(
      (cat) => `
    <button
      type="button"
      class="ask-explore__filter${cat.id === exploreCategory ? " ask-explore__filter--active" : ""}"
      data-category="${cat.id}"
      role="tab"
      aria-selected="${cat.id === exploreCategory}"
    >${cat.label}</button>`
    )
    .join("");
}

function renderExploreGrid() {
  if (!exploreGridEl) return;

  const items = getFilteredExploreTopics();

  exploreGridEl.innerHTML = items
    .map(
      (item) => `
    <button type="button" class="ask-explore__item" data-topic="${item.topic}" role="listitem">
      <span class="ask-explore__item-icon" style="background: ${item.iconBg}20; color: ${item.iconBg}" aria-hidden="true">${item.icon}</span>
      <span class="ask-explore__item-copy">
        <span class="ask-explore__item-title">${item.title}</span>
        <span class="ask-explore__item-desc">${item.description}</span>
      </span>
      <span class="ask-explore__item-chevron" aria-hidden="true">›</span>
    </button>`
    )
    .join("");

  if (exploreEmptyEl) {
    exploreEmptyEl.hidden = items.length > 0;
  }
}

function renderExploreTopics() {
  if (!EXPLORE_TOPICS) return;

  const heading = document.getElementById("ask-explore-heading");
  if (heading) heading.textContent = EXPLORE_TOPICS.title;
  if (exploreSubtitleEl) exploreSubtitleEl.textContent = EXPLORE_TOPICS.subtitle;

  renderExploreFeatured();
  renderExploreFilters();
  renderExploreGrid();
}

function updateTopicsCarousel() {
  if (!topicsTrack || !topicsViewport) return;

  const { scrollLeft, scrollWidth, clientWidth } = topicsTrack;
  const atStart = scrollLeft <= 4;
  const atEnd = scrollLeft + clientWidth >= scrollWidth - 4;

  if (topicsPrev) topicsPrev.disabled = atStart;
  if (topicsNext) topicsNext.disabled = atEnd;
  topicsViewport.classList.toggle("ask-topics__viewport--fade-start", !atStart);
  topicsViewport.classList.toggle("ask-topics__viewport--fade-end", !atEnd);
}

function scrollTopics(direction) {
  const card = topicsTrack?.querySelector(".ask-topic-card");
  if (!card || !topicsTrack) return;

  const gap = parseFloat(getComputedStyle(topicsTrack).gap) || 8;
  topicsTrack.scrollBy({
    left: direction * (card.offsetWidth + gap),
    behavior: "smooth",
  });
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeChatId: appState.activeChatId,
      chats: appState.chats,
    })
  );
}

function createChatId() {
  return crypto.randomUUID?.() ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getActiveChat() {
  return appState.chats.find((c) => c.id === appState.activeChatId) ?? null;
}

function chatTitleFromText(text) {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "New chat";
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

function pruneEmptyChats(exceptId = null) {
  appState.chats = appState.chats.filter(
    (c) => c.messages.length > 0 || c.id === exceptId
  );
}

function createChat() {
  const chat = {
    id: createChatId(),
    title: "New chat",
    starred: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
  appState.chats.unshift(chat);
  appState.activeChatId = chat.id;
  saveState();
  return chat;
}

function ensureActiveChat() {
  let chat = getActiveChat();
  if (!chat) {
    chat = createChat();
  }
  return chat;
}

function setLoading(loading) {
  isLoading = loading;
  sendBtn.disabled = loading || !input.value.trim();
  input.disabled = loading;
  composerBox?.classList.toggle("ask-composer__box--loading", loading);
}

function updatePromptVisibility() {
  const hasText = Boolean(input.value.trim());
  composerBox?.classList.toggle("ask-composer__box--has-input", hasText);
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
}

function hasActiveMessages() {
  const chat = getActiveChat();
  return Boolean(chat && chat.messages.length > 0);
}

function updateChatMode() {
  const chatting = hasActiveMessages();
  page.classList.toggle("ask-page--chatting", chatting);
  chatEl.hidden = !chatting;

  const chat = getActiveChat();
  if (mainTitle) {
    mainTitle.textContent = chat?.title ?? "Ask Acharya";
  }
}

function syncSidebarExpandUi() {
  const collapsed = page.classList.contains("ask-page--sidebar-collapsed");
  const isMobile = isMobileLayout();

  if (sidebarExpand) {
    sidebarExpand.hidden = !collapsed || isMobile;
  }

  if (sidebarToggle) {
    sidebarToggle.setAttribute(
      "aria-label",
      collapsed && !isMobile ? "Expand sidebar" : "Open sidebar"
    );
  }
}

function expandSidebar() {
  page.classList.remove("ask-page--sidebar-collapsed");
  syncSidebarExpandUi();
}

function collapseSidebar() {
  page.classList.add("ask-page--sidebar-collapsed");
  closeSidebar();
  syncSidebarExpandUi();
}

function openSidebar() {
  expandSidebar();
  page.classList.add("ask-page--sidebar-open");
  sidebarOverlay.hidden = false;
  sidebarToggle?.setAttribute("aria-expanded", "true");
  if (isMobileLayout()) {
    setBodyScrollLock(true);
  }
}

function closeSidebar() {
  page.classList.remove("ask-page--sidebar-open");
  sidebarOverlay.hidden = true;
  sidebarToggle?.setAttribute("aria-expanded", "false");
  if (!page.classList.contains("ask-page--sidebar-open")) {
    setBodyScrollLock(false);
  }
}

function closeSidebarOnMobile() {
  if (isMobileLayout()) {
    closeSidebar();
  }
}

function isTopicPanelOpen() {
  return page.classList.contains("ask-page--topic-panel-open");
}

function renderTopicPanel(data) {
  if (!topicPanelBody || !data) return;

  const thumb = data.heroImage;
  const featuredVideos = data.videos.slice(0, 4);

  const videosHtml = featuredVideos
    .map(
      (v) => `
      <a class="ask-topic-panel__video-card" href="${v.url}" target="_blank" rel="noopener noreferrer">
        <span class="ask-topic-panel__video-thumb">
          <img src="${v.thumbnail || thumb}" alt="" loading="lazy" />
          <span class="ask-topic-panel__play" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </span>
        <span class="ask-topic-panel__video-title">${v.title}</span>
      </a>`
    )
    .join("");

  const viewAll = data.videosViewAll;
  const viewAllHtml = viewAll
    ? `<a class="ask-topic-panel__view-all" href="${viewAll.url}" target="_blank" rel="noopener noreferrer">${viewAll.label}</a>`
    : "";

  const articlesHtml = data.articles
    .map(
      (a) => `
      <li>
        <a class="ask-topic-panel__article-link" href="${a.url}" target="_blank" rel="noopener noreferrer">
          <span class="ask-topic-panel__article-icon-wrap" aria-hidden="true">${TOPIC_PANEL_ARTICLE_ICON}</span>
          <span class="ask-topic-panel__article-text">${a.title}</span>
          <span class="ask-topic-panel__article-external" aria-hidden="true">${TOPIC_PANEL_EXTERNAL_ICON}</span>
        </a>
      </li>`
    )
    .join("");

  topicPanelBody.innerHTML = `
    <div class="ask-topic-panel__hero-wrap">
      <img class="ask-topic-panel__hero" src="${data.heroImage}" alt="${data.heroAlt}" width="420" height="168" />
      <div class="ask-topic-panel__hero-gradient" aria-hidden="true"></div>
      <button type="button" class="ask-topic-panel__close" id="ask-topic-panel-close" aria-label="Close panel">
        <span aria-hidden="true">×</span>
      </button>
      <div class="ask-topic-panel__hero-heading">
        <h2 class="ask-topic-panel__title" id="ask-topic-panel-title">${data.title}</h2>
        <p class="ask-topic-panel__subtitle">${data.subtitle}</p>
      </div>
    </div>
    <section class="ask-topic-panel__section">
      <div class="ask-topic-panel__section-head">
        <h3 class="ask-topic-panel__section-title">Chapter-wise discourses</h3>
        ${viewAllHtml}
      </div>
      <div class="ask-topic-panel__video-grid">${videosHtml}</div>
    </section>
    <section class="ask-topic-panel__section">
      <h3 class="ask-topic-panel__section-title">Articles on Bhagavad Gita</h3>
      <ul class="ask-topic-panel__articles">${articlesHtml}</ul>
    </section>
    <section class="ask-topic-panel__section ask-topic-panel__section--faqs">
      <h3 class="ask-topic-panel__section-title">Frequently asked</h3>
      <div class="ask-topic-panel__faq-list" id="ask-topic-panel-faqs"></div>
    </section>
  `;

  topicPanelBody.querySelector("#ask-topic-panel-close")?.addEventListener("click", closeTopicPanel);

  const faqList = topicPanelBody.querySelector("#ask-topic-panel-faqs");
  data.faqs.forEach((faq) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "ask-topic-panel__faq-pill";
    pill.textContent = faq.label;
    pill.addEventListener("click", () => {
      closeTopicPanel();
      submitQuestion(faq.prompt);
    });
    faqList?.appendChild(pill);
  });
}

function openTopicPanel(topicId) {
  const data = TOPIC_PANELS?.[topicId];
  if (!data || !topicPanel) return;

  renderTopicPanel(data);
  page.classList.add("ask-page--topic-panel-open");
  topicPanel.setAttribute("aria-hidden", "false");
  setBodyScrollLock(true);
  closeSidebarOnMobile();
  topicPanelBody.querySelector("#ask-topic-panel-close")?.focus();
}

function closeTopicPanel() {
  if (!isTopicPanelOpen()) return;

  page.classList.remove("ask-page--topic-panel-open");
  topicPanel?.setAttribute("aria-hidden", "true");

  if (!page.classList.contains("ask-page--sidebar-open")) {
    setBodyScrollLock(false);
  }
}

function formatVideoTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildAskVideoEmbedUrl(startSeconds) {
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1" });
  if (startSeconds > 0) params.set("start", String(startSeconds));
  return `https://www.youtube.com/embed/${ASK_MOCK_VIDEO.id}?${params.toString()}`;
}

function openAskVideoModal(startSeconds) {
  const modal = document.getElementById("ask-video-modal");
  const iframe = document.getElementById("ask-video-iframe");
  const titleEl = document.getElementById("ask-video-modal-title");
  if (!modal || !iframe) return;

  if (titleEl) {
    titleEl.textContent =
      startSeconds > 0
        ? `${ASK_MOCK_VIDEO.title} (from ${formatVideoTimestamp(startSeconds)})`
        : ASK_MOCK_VIDEO.title;
  }
  iframe.src = buildAskVideoEmbedUrl(startSeconds);
  modal.hidden = false;
  modal.classList.add("ask-video-modal--open");
  document.documentElement.classList.add("ask-video-open");
  document.getElementById("ask-video-modal-close")?.focus();
}

function closeAskVideoModal() {
  const modal = document.getElementById("ask-video-modal");
  const iframe = document.getElementById("ask-video-iframe");
  if (!modal || !iframe) return;
  modal.hidden = true;
  modal.classList.remove("ask-video-modal--open");
  document.documentElement.classList.remove("ask-video-open");
  iframe.src = "";
}

function isAskVideoModalOpen() {
  return document.getElementById("ask-video-modal")?.classList.contains("ask-video-modal--open");
}

function buildDiscourseBubble(msg) {
  const bubble = document.createElement("div");
  bubble.className = "ask-message__bubble ask-message__bubble--rich";

  const lead = document.createElement("p");
  lead.className = "ask-message__lead";
  lead.textContent = msg.lead;

  const body = document.createElement("p");
  body.className = "ask-message__body";
  body.textContent = msg.body;

  bubble.append(lead, body);

  if (msg.article) {
    const articleLink = document.createElement("a");
    articleLink.className = "ask-message__article";
    articleLink.href = msg.article.url;
    if (msg.article.url.startsWith("http")) {
      articleLink.target = "_blank";
      articleLink.rel = "noopener noreferrer";
    }
    articleLink.innerHTML = `<span class="ask-message__article-icon" aria-hidden="true">📄</span><span>${msg.article.title}</span>`;
    bubble.appendChild(articleLink);
  }

  if (msg.video) {
    const start = msg.video.startSeconds ?? 0;
    const videoBtn = document.createElement("button");
    videoBtn.type = "button";
    videoBtn.className = "ask-message__video";
    videoBtn.setAttribute("aria-label", `Play discourse clip from ${formatVideoTimestamp(start)}`);

    const thumbWrap = document.createElement("span");
    thumbWrap.className = "ask-message__video-thumb-wrap";

    const thumb = document.createElement("img");
    thumb.className = "ask-message__video-thumb";
    thumb.src = ASK_MOCK_VIDEO.thumb;
    thumb.alt = "";
    thumb.width = 320;
    thumb.height = 180;
    thumb.loading = "lazy";

    const play = document.createElement("span");
    play.className = "ask-message__video-play";
    play.setAttribute("aria-hidden", "true");
    play.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

    thumbWrap.append(thumb, play);

    const videoMeta = document.createElement("span");
    videoMeta.className = "ask-message__video-meta";

    const videoTitle = document.createElement("span");
    videoTitle.className = "ask-message__video-title";
    videoTitle.textContent = ASK_MOCK_VIDEO.title;

    const videoTime = document.createElement("span");
    videoTime.className = "ask-message__video-time";
    videoTime.textContent =
      start > 0 ? `Clip starts at ${formatVideoTimestamp(start)}` : "Watch from the beginning";

    videoMeta.append(videoTitle, videoTime);
    videoBtn.append(thumbWrap, videoMeta);
    videoBtn.addEventListener("click", () => openAskVideoModal(start));
    bubble.appendChild(videoBtn);
  }

  return bubble;
}

function buildCourseBubble(msg) {
  const bubble = document.createElement("div");
  bubble.className = "ask-message__bubble ask-message__bubble--course";
  bubble.textContent = msg.content;

  if (msg.course) {
    const cta = document.createElement("a");
    cta.className = "ask-message__course-btn";
    cta.href = msg.course.url;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.textContent = msg.course.label;
    bubble.appendChild(cta);
  }

  return bubble;
}

function buildMessageElement(msg) {
  const wrap = document.createElement("article");
  wrap.className = `ask-message ask-message--${msg.role}`;
  if (msg.role === "assistant" && (msg.kind === "discourse" || msg.kind === "course")) {
    wrap.classList.add("ask-message--wide");
  }

  const label = document.createElement("span");
  label.className = "ask-message__label";
  label.textContent = msg.role === "user" ? "You" : "Ask Acharya";

  let bubble;
  if (msg.role === "assistant" && msg.kind === "discourse") {
    bubble = buildDiscourseBubble(msg);
  } else if (msg.role === "assistant" && msg.kind === "course") {
    bubble = buildCourseBubble(msg);
  } else {
    bubble = document.createElement("div");
    bubble.className = "ask-message__bubble";
    if (msg.role === "assistant" && msg.content) {
      bubble.innerHTML = renderMarkdown(msg.content);
    } else {
      bubble.textContent = msg.content ?? "";
    }
  }

  wrap.append(label, bubble);

  if (msg.role === "assistant" && msg.sources?.length) {
    const src = document.createElement("p");
    src.className = "ask-message__sources";
    src.innerHTML = msg.sources
      .map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a>`)
      .join(" · ");
    wrap.appendChild(src);
  }

  return wrap;
}

function renderChatMessages() {
  chatEl.innerHTML = "";
  const chat = getActiveChat();
  if (!chat) return;

  chat.messages.forEach((msg) => {
    chatEl.appendChild(buildMessageElement(msg));
  });

  chatEl.scrollTop = chatEl.scrollHeight;
  updateChatMode();
}

function createSidebarItem(chat) {
  const li = document.createElement("li");
  li.className = "ask-sidebar__item";
  if (chat.id === appState.activeChatId) {
    li.classList.add("ask-sidebar__item--active");
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ask-sidebar__chat-btn";
  btn.textContent = chat.title;
  btn.title = chat.title;
  btn.addEventListener("click", () => {
    switchChat(chat.id);
    closeSidebarOnMobile();
  });

  const starBtn = document.createElement("button");
  starBtn.type = "button";
  starBtn.className = "ask-sidebar__star";
  if (chat.starred) starBtn.classList.add("ask-sidebar__star--on");
  starBtn.setAttribute("aria-label", chat.starred ? "Unstar chat" : "Star chat");
  starBtn.textContent = chat.starred ? "★" : "☆";
  starBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleStar(chat.id);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "ask-sidebar__delete";
  deleteBtn.setAttribute("aria-label", "Delete chat");
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteChat(chat.id);
  });

  li.append(btn, starBtn, deleteBtn);
  return li;
}

function getChatGroupLabel(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - 6 * 86400000;

  const t = date.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfYesterday) return "Yesterday";
  if (t >= startOfWeek) return "Previous 7 days";
  return "Older";
}

function getFilteredChats() {
  const q = appState.searchQuery.trim().toLowerCase();
  const sorted = [...appState.chats].sort((a, b) => b.updatedAt - a.updatedAt);

  if (!q) return sorted;

  return sorted.filter((chat) => {
    if (chat.title.toLowerCase().includes(q)) return true;
    return chat.messages.some((m) => m.content.toLowerCase().includes(q));
  });
}

function renderSidebarList(targetEl, chats) {
  targetEl.innerHTML = "";
  chats.forEach((chat) => {
    targetEl.appendChild(createSidebarItem(chat));
  });
}

function renderSidebar() {
  const filtered = getFilteredChats();
  const starred = filtered.filter((c) => c.starred);
  const unstarred = filtered.filter((c) => !c.starred);

  starredSection.hidden = starred.length === 0;
  renderSidebarList(starredListEl, starred);

  chatListEl.innerHTML = "";

  const groups = new Map();
  unstarred.forEach((chat) => {
    const label = getChatGroupLabel(chat.updatedAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(chat);
  });

  const order = ["Today", "Yesterday", "Previous 7 days", "Older"];

  order.forEach((label) => {
    const chats = groups.get(label);
    if (!chats?.length) return;

    const section = document.createElement("section");
    section.className = "ask-sidebar__section";

    const heading = document.createElement("h2");
    heading.className = "ask-sidebar__section-title";
    heading.textContent = label;

    const ul = document.createElement("ul");
    ul.className = "ask-sidebar__list";
    renderSidebarList(ul, chats);

    section.append(heading, ul);
    chatListEl.appendChild(section);
  });

  const hasVisible = starred.length > 0 || unstarred.length > 0;

  if (appState.searchQuery.trim() && !hasVisible) {
    sidebarEmpty.textContent = "No chats found";
    sidebarEmpty.hidden = false;
  } else if (!hasVisible) {
    sidebarEmpty.textContent = "No chats yet";
    sidebarEmpty.hidden = false;
  } else {
    sidebarEmpty.hidden = true;
  }
}

function renderAll() {
  renderChatMessages();
  renderSidebar();
  updateChatMode();
}

function startNewChat() {
  exitExploreMode();
  hideSearchPanel();
  setSidebarMenu("new");

  const current = getActiveChat();
  if (current && current.messages.length === 0) {
    renderAll();
    closeSidebarOnMobile();
    input.focus();
    return;
  }

  pruneEmptyChats();
  createChat();
  renderAll();
  closeSidebarOnMobile();
  input.focus();
}

function switchChat(id) {
  exitExploreMode();
  hideSearchPanel();
  setSidebarMenu("new");
  appState.activeChatId = id;
  saveState();
  renderAll();
  input.focus();
}

function toggleStar(id) {
  const chat = appState.chats.find((c) => c.id === id);
  if (!chat) return;
  chat.starred = !chat.starred;
  saveState();
  renderSidebar();
}

function deleteChat(id) {
  const idx = appState.chats.findIndex((c) => c.id === id);
  if (idx === -1) return;

  appState.chats.splice(idx, 1);

  if (appState.activeChatId === id) {
    appState.activeChatId = appState.chats[0]?.id ?? null;
    if (!appState.activeChatId && appState.chats.length === 0) {
      /* stay on landing */
    } else if (!getActiveChat()) {
      createChat();
    }
  }

  pruneEmptyChats(appState.activeChatId);
  saveState();
  renderAll();
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "ask-typing";
  el.id = "ask-typing-indicator";
  el.setAttribute("aria-label", "Acharya's teachings are being retrieved");
  el.innerHTML = '<span></span><span></span><span></span><em class="ask-typing__status" id="ask-typing-status" aria-live="polite"></em>';
  chatEl.appendChild(el);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function hideTyping() {
  document.getElementById("ask-typing-indicator")?.remove();
}

function renderMarkdown(text) {
  if (typeof marked !== "undefined") {
    return marked.parse(text);
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function dispatchSseEvent(line, { onStatus, onText, onResponse, onSessionId, onDone, onError }) {
  if (!line.startsWith("data: ")) return;
  try {
    const event = JSON.parse(line.slice(6));
    if (event.session_id) onSessionId(event.session_id);
    if (event.type === "status") onStatus(event.content);
    if (event.type === "text") onText(event.content);
    if (event.type === "response") onResponse(event.content);
    if (event.type === "done") onDone();
    if (event.type === "error") onError(event.content);
  } catch {
    // ignore malformed lines
  }
}

async function streamChatAnswer(query, sessionId, callbacks) {
  const response = await fetch(`${CHAT_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, session_id: sessionId || undefined, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Accumulate into buffer so lines split across chunks are reassembled
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // last entry may be an incomplete line — hold it

    for (const line of lines) {
      dispatchSseEvent(line, callbacks);
    }
  }

  // Flush any remaining complete line
  if (buffer) dispatchSseEvent(buffer, callbacks);
}

function updateTypingStatus(text) {
  const el = document.getElementById("ask-typing-status");
  if (el) el.textContent = text;
}

async function submitQuestion(text) {
  const question = text.trim();
  if (!question || isLoading) return;

  exitExploreMode();
  setSidebarMenu("new");

  const chat = ensureActiveChat();
  const isFirstMessage = chat.messages.length === 0;

  chat.messages.push({ role: "user", content: question });
  if (isFirstMessage) {
    chat.title = chatTitleFromText(question);
  }
  chat.updatedAt = Date.now();
  saveState();
  renderChatMessages();
  renderSidebar();

  input.value = "";
  resizeInput();
  updatePromptVisibility();
  setLoading(true);
  showTyping();

  if (USE_MOCK) {
    try {
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      hideTyping();
      const reply = getAskMockReply(question);
      const assistantMessages = reply.messages ?? [
        { role: "assistant", kind: "plain", content: reply.answer ?? "", sources: reply.sources ?? [] },
      ];
      assistantMessages.forEach((msg) => {
        chat.messages.push({ role: "assistant", ...msg });
      });
      chat.updatedAt = Date.now();
      saveState();
      renderChatMessages();
      renderSidebar();
    } catch {
      hideTyping();
      chat.messages.push({
        role: "assistant",
        content: "We could not reach the discourse service just now. Please try again in a moment.",
        sources: [],
      });
      chat.updatedAt = Date.now();
      saveState();
      renderChatMessages();
      renderSidebar();
    } finally {
      setLoading(false);
      input.focus();
    }
    return;
  }

  // Live streaming element — appended to chatEl once first text arrives
  const streamWrap = document.createElement("article");
  streamWrap.className = "ask-message ask-message--assistant";
  const streamLabel = document.createElement("span");
  streamLabel.className = "ask-message__label";
  streamLabel.textContent = "Ask Acharya";
  const streamBubble = document.createElement("div");
  streamBubble.className = "ask-message__bubble";
  streamWrap.append(streamLabel, streamBubble);

  let accumulatedText = "";
  let hasTextStarted = false;

  const attachStream = () => {
    if (!hasTextStarted) {
      hasTextStarted = true;
      hideTyping();
      chatEl.appendChild(streamWrap);
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  };

  try {
    await streamChatAnswer(question, chat.sessionId, {
      onStatus(statusText) {
        updateTypingStatus(statusText);
      },
      onText(chunk) {
        attachStream();
        accumulatedText += chunk;
        streamBubble.textContent = accumulatedText;
        chatEl.scrollTop = chatEl.scrollHeight;
      },
      onResponse(fullMarkdown) {
        attachStream(); // ensure bubble is in DOM even if no text events arrived
        accumulatedText = fullMarkdown;
        streamBubble.innerHTML = renderMarkdown(fullMarkdown);
        chatEl.scrollTop = chatEl.scrollHeight;
      },
      onSessionId(sid) {
        chat.sessionId = sid;
      },
      onDone() {
        hideTyping();
        if (!hasTextStarted) attachStream();
      },
      onError(errText) {
        attachStream();
        accumulatedText = errText || "An error occurred. Please try again.";
        streamBubble.textContent = accumulatedText;
        chatEl.scrollTop = chatEl.scrollHeight;
      },
    });

    // Commit the streamed message to chat state
    streamWrap.remove();
    chat.messages.push({ role: "assistant", kind: "plain", content: accumulatedText });
  } catch {
    hideTyping();
    streamWrap.remove();
    chat.messages.push({
      role: "assistant",
      content: "We could not reach the discourse service just now. Please try again in a moment.",
      sources: [],
    });
  }

  chat.updatedAt = Date.now();
  saveState();
  renderChatMessages();
  renderSidebar();
  setLoading(false);
  input.focus();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitQuestion(input.value);
});

input.addEventListener("input", () => {
  resizeInput();
  updatePromptVisibility();
  if (!isLoading) sendBtn.disabled = !input.value.trim();
});

function updatePromptsFade() {
  if (!promptsViewport) return;

  const atStart = promptsViewport.scrollLeft <= 4;
  const atEnd =
    promptsViewport.scrollLeft + promptsViewport.clientWidth >=
    promptsViewport.scrollWidth - 4;

  promptsFadeLeft?.classList.toggle("ask-composer__prompts-fade--hidden", atStart);
  promptsFadeRight?.classList.toggle("ask-composer__prompts-fade--hidden", atEnd);
}

function initPromptsCarousel() {
  if (!promptsViewport) return;

  let isDragging = false;
  let didDrag = false;
  let startX = 0;
  let scrollStart = 0;

  const onPointerDown = (clientX) => {
    isDragging = true;
    didDrag = false;
    startX = clientX;
    scrollStart = promptsViewport.scrollLeft;
    promptsViewport.classList.add("is-dragging");
  };

  const onPointerMove = (clientX) => {
    if (!isDragging) return;
    const delta = clientX - startX;
    if (Math.abs(delta) > 4) didDrag = true;
    promptsViewport.scrollLeft = scrollStart - delta;
    updatePromptsFade();
  };

  const onPointerUp = () => {
    isDragging = false;
    promptsViewport.classList.remove("is-dragging");
  };

  promptsViewport.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    onPointerDown(e.clientX);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    onPointerMove(e.clientX);
  });

  window.addEventListener("mouseup", onPointerUp);

  promptsViewport.addEventListener("scroll", updatePromptsFade, { passive: true });
  window.addEventListener("resize", updatePromptsFade);

  promptChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      if (didDrag) {
        didDrag = false;
        return;
      }
      const prompt = chip.dataset.prompt;
      if (prompt && !isLoading) submitQuestion(prompt);
    });
  });

  updatePromptsFade();
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

newChatBtn?.addEventListener("click", startNewChat);

searchToggleBtn?.addEventListener("click", () => {
  if (searchPanel && !searchPanel.hidden) {
    hideSearchPanel();
    setSidebarMenu("new");
  } else {
    showSearchPanel();
  }
});

searchInput?.addEventListener("input", () => {
  appState.searchQuery = searchInput.value;
  renderSidebar();
});

sidebarCollapse?.addEventListener("click", collapseSidebar);

sidebarExpand?.addEventListener("click", expandSidebar);

sidebarToggle?.addEventListener("click", () => {
  if (page.classList.contains("ask-page--sidebar-collapsed")) {
    expandSidebar();
    return;
  }

  if (isMobileLayout()) {
    if (page.classList.contains("ask-page--sidebar-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
});

window.addEventListener("resize", syncSidebarExpandUi);

sidebarOverlay?.addEventListener("click", closeSidebar);

let touchStartX = 0;
document.addEventListener(
  "touchstart",
  (e) => {
    if (!isMobileLayout() || !page.classList.contains("ask-page--sidebar-open")) return;
    touchStartX = e.touches[0]?.clientX ?? 0;
  },
  { passive: true }
);

document.addEventListener(
  "touchend",
  (e) => {
    if (!isMobileLayout() || !page.classList.contains("ask-page--sidebar-open")) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    if (touchStartX - touchEndX > 60) {
      closeSidebar();
    }
  },
  { passive: true }
);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncViewportInsets);
  window.visualViewport.addEventListener("scroll", syncViewportInsets);
}

MOBILE_MQ.addEventListener("change", () => {
  syncSidebarExpandUi();
  syncViewportInsets();
  if (!isMobileLayout()) {
    setBodyScrollLock(false);
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "n") {
    e.preventDefault();
    startNewChat();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    openSidebar();
    showSearchPanel();
  }
  if (e.key === "Escape") {
    if (isAskVideoModalOpen()) {
      closeAskVideoModal();
      return;
    }
    closeSidebar();
  }
});

document.getElementById("ask-video-modal-backdrop")?.addEventListener("click", closeAskVideoModal);
document.getElementById("ask-video-modal-close")?.addEventListener("click", closeAskVideoModal);

document.getElementById("ask-gita-btn")?.addEventListener("click", () => {
  const current = getActiveChat();
  if (!current || current.messages.length > 0) {
    pruneEmptyChats();
    createChat();
    renderAll();
  }
  input.value = "What is the Bhagavad Gita, and what does Swamiji teach about it?";
  resizeInput();
  updatePromptVisibility();
  sendBtn.disabled = false;
  closeSidebarOnMobile();
  input.focus();
});

loadState();
pruneEmptyChats();
if (appState.activeChatId && !getActiveChat()) {
  appState.activeChatId = appState.chats[0]?.id ?? null;
}
renderUserProfile();
setSidebarMenu("new");
syncSidebarExpandUi();
syncViewportInsets();
renderAll();
resizeInput();
updatePromptVisibility();
initPromptsCarousel();
