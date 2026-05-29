/**
 * Simulated Ask Acharya responses (third-person POV) for demo / offline mode.
 */
const ASK_MOCK_VIDEO = {
  id: "aNdAWJCe8N4",
  title: "Bhagavad Gita — Sri Chinna Jeeyar Swamiji | Episode 1",
  thumb: "https://img.youtube.com/vi/aNdAWJCe8N4/hqdefault.jpg",
};

const ASK_SRIKARYAM_GITA_COURSE = {
  url: "https://srikaryam.com/En/srimadbhagavadgitha/intro",
  label: "Explore this course",
};

const ASK_DEFAULT_ARTICLE = {
  url: "https://chinnajeeyar.org/githa-the-ultimate-guide/",
  title: "Githa, the Ultimate Guide — Chinnajeeyar.org",
};

function askNormalizeQuestion(q) {
  return q.toLowerCase().replace(/\s+/g, " ").trim();
}

function askMatchesPurposeOfLife(q) {
  return /purpose\s+of\s+life|meaning\s+of\s+life|why\s+(are\s+we|do\s+we)\s+live/.test(q);
}

function askMatchesGita(q) {
  return /bhagavad\s*gita|gita|chapter\s+\d+|sloka|adhyaya/.test(q);
}

function askMatchesBhakti(q) {
  return /bhakti|devotion|surrender|sharanagati/.test(q);
}

function askMatchesKarma(q) {
  return /karma|selfless|duty|dharma/.test(q);
}

function askBuildDiscourseMessage({ lead, body, article, videoStart = 0 }) {
  return {
    role: "assistant",
    kind: "discourse",
    lead,
    body,
    article: article ?? ASK_DEFAULT_ARTICLE,
    video: { startSeconds: videoStart },
  };
}

function askBuildCourseMessage() {
  return {
    role: "assistant",
    kind: "course",
    content:
      "If you want to learn Bhagavad Gita more deeply, you can join the Srikaryam Gita course, where you get access to Swamiji's all discourses on Bhagavad Gita, with a certificate.",
    course: ASK_SRIKARYAM_GITA_COURSE,
  };
}

function getAskMockReply(question) {
  const q = askNormalizeQuestion(question);
  const messages = [];

  if (askMatchesPurposeOfLife(q)) {
    messages.push(
      askBuildDiscourseMessage({
        lead:
          "Good one. Here is what Acharya has quoted in the event held in Vijayawada when someone raised the same question.",
        body:
          "Acharya taught that the purpose of life is to recognise one's true nature as the eternal servant of the Lord (Seshatva), to live by dharma, and to take shelter in Bhagavan through bhakti—not merely to chase passing pleasures. He encourages devotees to turn everyday duties into offerings for the Lord's pleasure, remembering Him in thought, word, and action.",
        article: {
          url: "https://chinnajeeyar.org/githa-the-ultimate-guide/",
          title: "Purpose of life — discourse highlights",
        },
        videoStart: 142,
      })
    );
    messages.push(askBuildCourseMessage());
    return { messages };
  }

  if (askMatchesGita(q)) {
    messages.push(
      askBuildDiscourseMessage({
        lead: "Here is what Acharya has explained from His Bhagavad Gita discourses on this topic.",
        body:
          "Acharya clarifies that the Gita was spoken when Arjuna stood at the crossroads of duty and doubt. He emphasises that each chapter (adhyaya) is named after a yoga—a practical means to overcome sorrow and act with faith, detachment, and devotion to the Lord.",
        article: {
          url: "bhagavad-gita-intro.html",
          title: "Bhagavad Gita — Introduction",
        },
        videoStart: 276,
      })
    );
    messages.push(askBuildCourseMessage());
    return { messages };
  }

  if (askMatchesBhakti(q)) {
    messages.push(
      askBuildDiscourseMessage({
        lead: "Acharya has addressed this often in His pravachanams on daily spiritual life.",
        body:
          "Acharya describes bhakti as loving remembrance of the Lord woven into one's routine—through nama sankirtan, selfless service, and surrender of the fruits of action. He teaches that true devotion is not a mood for a day, but a steady orientation of the heart toward Bhagavan.",
        videoStart: 388,
      })
    );
    messages.push(askBuildCourseMessage());
    return { messages };
  }

  if (askMatchesKarma(q)) {
    messages.push(
      askBuildDiscourseMessage({
        lead: "Here is how Acharya explains karma yoga in His discourses.",
        body:
          "Acharya teaches that karma yoga is performing one's prescribed duty without selfish attachment, offering actions to the Lord. He reminds devotees that action itself is not the problem—self-centred expectation of reward binds the soul, while selfless action purifies the heart.",
        videoStart: 224,
      })
    );
    return { messages };
  }

  messages.push(
    askBuildDiscourseMessage({
      lead: "Fair question. Here is what Acharya has shared from HH Sri Chinnajeeyar Swamiji's discourses on this subject.",
      body:
        "Acharya guides seekers to ground every question in sastra and the teachings of our acharyas. He encourages careful study, sincere practice, and taking shelter of the Lord through the path shown by Sri Ramanujacharya—applying wisdom in daily life rather than treating spirituality as mere theory.",
      videoStart: 45,
    })
  );

  return { messages };
}
