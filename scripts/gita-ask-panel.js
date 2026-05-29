/**
 * Ask Acharya slide-over panel on Bhagavad Gita intro page (simulated chat).
 */
(function () {
  const GREETING =
    "Jai Srimannarayana! I hope you are liking this article. Let me know if you got any questions. I can fetch responses from Sri HH's discourses.";

  const VIDEO_ID = "aNdAWJCe8N4";
  const VIDEO_TITLE = "Bhagavad Gita — Sri Chinna Jeeyar Swamiji | Episode 1";
  const THUMB_URL = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;

  const DEFAULT_ARTICLE = {
    url: "https://chinnajeeyar.org/githa-the-ultimate-guide/",
    title: "Githa, the Ultimate Guide",
  };

  const INTRO_ARTICLE = {
    url: "bhagavad-gita-intro.html",
    title: "Bhagavad Gita — Introduction (this article)",
  };

  const panel = document.getElementById("gita-ask-panel");
  const overlay = document.getElementById("gita-ask-panel-overlay");
  const closeBtn = document.getElementById("gita-ask-panel-close");
  const fab = document.getElementById("gita-ask-fab");
  const chatEl = document.getElementById("gita-ask-chat");
  const form = document.getElementById("gita-ask-form");
  const input = document.getElementById("gita-ask-input");
  const sendBtn = document.getElementById("gita-ask-send");
  const openLinks = document.querySelectorAll("[data-open-gita-ask]");
  const videoModal = document.getElementById("gita-video-modal");
  const videoModalBackdrop = document.getElementById("gita-video-modal-backdrop");
  const videoModalClose = document.getElementById("gita-video-modal-close");
  const videoIframe = document.getElementById("gita-video-iframe");
  const videoModalTitle = document.getElementById("gita-video-modal-title");

  const GITA_CHAT_BASE_URL =
    typeof window !== "undefined" && window.ASK_CHAT_BASE_URL != null
      ? window.ASK_CHAT_BASE_URL
      : "http://localhost:8000";
  const GITA_USE_MOCK = !GITA_CHAT_BASE_URL;

  let isLoading = false;
  let greeted = false;
  let sessionId = null;

  function formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function buildEmbedUrl(startSeconds) {
    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
    });
    if (startSeconds > 0) params.set("start", String(startSeconds));
    return `https://www.youtube.com/embed/${VIDEO_ID}?${params.toString()}`;
  }

  function openVideoModal(startSeconds) {
    if (!videoModal || !videoIframe) return;
    if (videoModalTitle) {
      videoModalTitle.textContent =
        startSeconds > 0
          ? `${VIDEO_TITLE} (from ${formatTimestamp(startSeconds)})`
          : VIDEO_TITLE;
    }
    videoIframe.src = buildEmbedUrl(startSeconds);
    videoModal.hidden = false;
    videoModal.classList.add("gita-video-modal--open");
    document.documentElement.classList.add("gita-video-open");
    videoModalClose?.focus();
  }

  function closeVideoModal() {
    if (!videoModal || !videoIframe) return;
    videoModal.hidden = true;
    videoModal.classList.remove("gita-video-modal--open");
    document.documentElement.classList.remove("gita-video-open");
    videoIframe.src = "";
  }

  function isVideoModalOpen() {
    return videoModal?.classList.contains("gita-video-modal--open");
  }

  function openPanel() {
    panel?.classList.add("gita-ask-panel--open");
    panel?.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("gita-ask-open");

    if (!greeted && chatEl) {
      appendAssistantMessage(GREETING);
      greeted = true;
    }

    requestAnimationFrame(() => input?.focus());
  }

  function closePanel() {
    closeVideoModal();
    panel?.classList.remove("gita-ask-panel--open");
    panel?.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("gita-ask-open");
  }

  function scrollChatToBottom() {
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
  }

  function createUserMessage(text) {
    const article = document.createElement("article");
    article.className = "gita-ask-panel__message gita-ask-panel__message--user";

    const label = document.createElement("span");
    label.className = "gita-ask-panel__message-label";
    label.textContent = "You";

    const bubble = document.createElement("div");
    bubble.className = "gita-ask-panel__bubble";
    bubble.textContent = text;

    article.append(label, bubble);
    return article;
  }

  function createAssistantMessage(text) {
    const article = document.createElement("article");
    article.className = "gita-ask-panel__message gita-ask-panel__message--assistant";

    const label = document.createElement("span");
    label.className = "gita-ask-panel__message-label";
    label.textContent = "Ask Acharya";

    const bubble = document.createElement("div");
    bubble.className = "gita-ask-panel__bubble";
    bubble.textContent = text;

    article.append(label, bubble);
    return article;
  }

  function createDiscourseMessage({ answer, article, startSeconds }) {
    const articleEl = document.createElement("article");
    articleEl.className = "gita-ask-panel__message gita-ask-panel__message--assistant";

    const label = document.createElement("span");
    label.className = "gita-ask-panel__message-label";
    label.textContent = "Ask Acharya";

    const bubble = document.createElement("div");
    bubble.className = "gita-ask-panel__bubble gita-ask-panel__bubble--rich";

    const lead = document.createElement("p");
    lead.className = "gita-ask-panel__lead";
    lead.textContent = "Fair question. Here is what I have found from HH's discourses:";

    const body = document.createElement("p");
    body.className = "gita-ask-panel__answer";
    body.textContent = answer;

    const articleLink = document.createElement("a");
    articleLink.className = "gita-ask-panel__article";
    articleLink.href = article.url;
    articleLink.target = article.url.startsWith("http") ? "_blank" : "_self";
    articleLink.rel = article.url.startsWith("http") ? "noopener noreferrer" : "";
    articleLink.innerHTML = `<span class="gita-ask-panel__article-icon" aria-hidden="true">📄</span><span>${article.title}</span>`;

    const videoBtn = document.createElement("button");
    videoBtn.type = "button";
    videoBtn.className = "gita-ask-panel__video";
    videoBtn.setAttribute("data-start", String(startSeconds));
    videoBtn.setAttribute(
      "aria-label",
      `Play discourse clip from ${formatTimestamp(startSeconds)}`
    );

    const thumbWrap = document.createElement("span");
    thumbWrap.className = "gita-ask-panel__video-thumb-wrap";

    const thumb = document.createElement("img");
    thumb.className = "gita-ask-panel__video-thumb";
    thumb.src = THUMB_URL;
    thumb.alt = "";
    thumb.width = 320;
    thumb.height = 180;
    thumb.loading = "lazy";

    const play = document.createElement("span");
    play.className = "gita-ask-panel__video-play";
    play.setAttribute("aria-hidden", "true");
    play.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

    thumbWrap.append(thumb, play);

    const videoMeta = document.createElement("span");
    videoMeta.className = "gita-ask-panel__video-meta";

    const videoTitle = document.createElement("span");
    videoTitle.className = "gita-ask-panel__video-title";
    videoTitle.textContent = VIDEO_TITLE;

    const videoTime = document.createElement("span");
    videoTime.className = "gita-ask-panel__video-time";
    videoTime.textContent =
      startSeconds > 0
        ? `Clip starts at ${formatTimestamp(startSeconds)}`
        : "Watch from the beginning of this episode";

    videoMeta.append(videoTitle, videoTime);
    videoBtn.append(thumbWrap, videoMeta);

    videoBtn.addEventListener("click", () => openVideoModal(startSeconds));

    bubble.append(lead, body, articleLink, videoBtn);
    articleEl.append(label, bubble);
    return articleEl;
  }

  function appendUserMessage(text) {
    chatEl?.appendChild(createUserMessage(text));
    scrollChatToBottom();
  }

  function appendAssistantMessage(text) {
    chatEl?.appendChild(createAssistantMessage(text));
    scrollChatToBottom();
  }

  function appendDiscourseMessage(payload) {
    chatEl?.appendChild(createDiscourseMessage(payload));
    scrollChatToBottom();
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "gita-ask-panel__typing";
    el.id = "gita-ask-typing";
    el.setAttribute("aria-live", "polite");
    el.innerHTML = '<span></span><span></span><span></span><em class="gita-ask-panel__status" id="gita-ask-typing-status" aria-live="polite"></em>';
    chatEl?.appendChild(el);
    scrollChatToBottom();
  }

  function hideTyping() {
    document.getElementById("gita-ask-typing")?.remove();
  }

  function buildDiscourseReply(question) {
    const q = question.toLowerCase();
    let answer =
      "Swamiji's discourses on the Bhagavad Gita remind us that this scripture is a practical guide for duty, devotion, and surrender—especially when life feels difficult.";
    let startSeconds = 45;
    let article = DEFAULT_ARTICLE;

    if (/gita\s*jayanti|margasira|11th\s*day/.test(q)) {
      answer =
        "Swamiji explains that Gita Jayanti marks the day Sanjaya revealed Lord Krishna's teaching to Dhritarashtra—on the 11th day of Margasira—when Bhishmacharya fell. Chanting the Gita on this day is especially meritorious.";
      startSeconds = 512;
      article = INTRO_ARTICLE;
    } else if (/arjuna|vishada|refus/.test(q)) {
      answer =
        "According to Swamiji's discourses, Arjuna's sorrow on the battlefield was not weakness alone—it opened the way for Krishna to teach duty (dharma) without attachment. The Gita begins from that moment of surrender to the Lord's guidance.";
      startSeconds = 198;
    } else if (/krishna|charioteer/.test(q)) {
      answer =
        "Swamiji teaches that Krishna as Arjuna's charioteer symbolizes the Lord guiding the jiva. Krishna took no weapons in that role, showing that spiritual instruction—not force—is how the Lord uplifts the devoted soul.";
      startSeconds = 334;
    } else if (/pandava|kaurava|duryodhana|war|kurukshetra|mahabharata/.test(q)) {
      answer =
        "The introduction describes how exile and failed negotiations led to the Maha Bharata war. Swamiji often connects this history to the need for righteous action: the Gita was spoken when duty seemed hardest, not when it was easy.";
      startSeconds = 128;
      article = INTRO_ARTICLE;
    } else if (/sanja|divya|drishti|dhritarashtra|dhritharashtra/.test(q)) {
      answer =
        "Sanjaya received divya drishti from Sage Vedavyasa so he could narrate the war to the blind king Dhritarashtra. Swamiji highlights Sanjaya's devotion to Krishna and his honest service—through him the world received the Gita's message.";
      startSeconds = 468;
      article = {
        url: "https://srikaryam.com/En/srimadbhagavadgitha/intro",
        title: "Srimad Bhagavad Gita — Introduction (Srikaryam)",
      };
    } else if (/chapter|adhyaya|yoga|sloka|700/.test(q)) {
      answer =
        "The Bhagavad Gita has 700 slokas in 18 chapters, each named after a yoga—a spiritual means to overcome sorrow. Swamiji's discourses walk through these yogas as practical paths for daily life, not mere philosophy.";
      startSeconds = 276;
    } else if (/why|purpose|what is|meaning/.test(q)) {
      answer =
        "Swamiji teaches that the Gita makes one dutiful, relieves distress, and shows the right path when studied with faith. It is relevant for every age because it answers how to live, act, and remember the Lord amid difficulty.";
      startSeconds = 62;
      article = INTRO_ARTICLE;
    } else if (/bhakti|devotion|surrender|sharanagati/.test(q)) {
      answer =
        "In Swamiji's teaching, bhakti and sharanagati are the heart of the Gita's message—the soul turns to the Lord for refuge while performing one's duty without selfish attachment.";
      startSeconds = 388;
    } else if (/karma|duty|dharma/.test(q)) {
      answer =
        "Swamiji explains karma yoga as selfless action offered to the Lord—doing one's duty without being bound by pride, fear, or the fruits of action.";
      startSeconds = 224;
    }

    return { answer, article, startSeconds };
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

  async function streamChatAnswer(query, sid, callbacks) {
    const response = await fetch(`${GITA_CHAT_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, session_id: sid || undefined, stream: true }),
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

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        dispatchSseEvent(line, callbacks);
      }
    }

    if (buffer) dispatchSseEvent(buffer, callbacks);
  }

  function updatePanelStatus(text) {
    const el = document.getElementById("gita-ask-typing-status");
    if (el) el.textContent = text;
  }

  function setLoading(loading) {
    isLoading = loading;
    if (sendBtn) sendBtn.disabled = loading || !input?.value.trim();
    if (input) input.disabled = loading;
  }

  function updateSendState() {
    if (sendBtn) sendBtn.disabled = isLoading || !input?.value.trim();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input?.value.trim();
    if (!text || isLoading) return;

    appendUserMessage(text);
    input.value = "";
    input.style.height = "auto";
    updateSendState();
    setLoading(true);
    showTyping();

    if (GITA_USE_MOCK) {
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
      hideTyping();
      appendDiscourseMessage(buildDiscourseReply(text));
      setLoading(false);
      input?.focus();
      return;
    }

    // Live streaming bubble
    const streamEl = document.createElement("article");
    streamEl.className = "gita-ask-panel__message gita-ask-panel__message--assistant";
    const streamLabel = document.createElement("span");
    streamLabel.className = "gita-ask-panel__message-label";
    streamLabel.textContent = "Ask Acharya";
    const streamBubble = document.createElement("div");
    streamBubble.className = "gita-ask-panel__bubble";
    streamEl.append(streamLabel, streamBubble);

    let accumulatedText = "";
    let hasTextStarted = false;

    const attachStream = () => {
      if (!hasTextStarted) {
        hasTextStarted = true;
        hideTyping();
        chatEl?.appendChild(streamEl);
        scrollChatToBottom();
      }
    };

    try {
      await streamChatAnswer(text, sessionId, {
        onStatus(statusText) {
          updatePanelStatus(statusText);
        },
        onText(chunk) {
          attachStream();
          accumulatedText += chunk;
          streamBubble.textContent = accumulatedText;
          scrollChatToBottom();
        },
        onResponse(fullMarkdown) {
          attachStream(); // ensure bubble is in DOM even if no text events arrived
          accumulatedText = fullMarkdown;
          streamBubble.innerHTML = renderMarkdown(fullMarkdown);
          scrollChatToBottom();
        },
        onSessionId(sid) {
          sessionId = sid;
        },
        onDone() {
          hideTyping();
          if (!hasTextStarted) attachStream();
        },
        onError(errText) {
          attachStream();
          accumulatedText = errText || "An error occurred. Please try again.";
          streamBubble.textContent = accumulatedText;
          scrollChatToBottom();
        },
      });
    } catch {
      hideTyping();
      if (!hasTextStarted) {
        appendAssistantMessage(
          "We could not reach the discourse service just now. Please try again in a moment."
        );
      }
    } finally {
      setLoading(false);
      input?.focus();
    }
  }

  function resizeInput() {
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }

  fab?.addEventListener("click", (e) => {
    e.preventDefault();
    openPanel();
  });

  openLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openPanel();
    });
  });

  overlay?.addEventListener("click", closePanel);
  closeBtn?.addEventListener("click", closePanel);
  videoModalBackdrop?.addEventListener("click", closeVideoModal);
  videoModalClose?.addEventListener("click", closeVideoModal);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isVideoModalOpen()) {
      closeVideoModal();
      return;
    }
    if (panel?.classList.contains("gita-ask-panel--open")) {
      closePanel();
    }
  });

  form?.addEventListener("submit", handleSubmit);
  input?.addEventListener("input", () => {
    resizeInput();
    updateSendState();
  });
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form?.requestSubmit();
    }
  });

  updateSendState();
})();
