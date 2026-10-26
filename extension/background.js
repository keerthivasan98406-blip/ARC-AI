// Arc AI Extension — Background Service Worker
// 1. Opens the side panel when the toolbar icon is clicked
// 2. Proxies chat and health requests from content scripts on HTTPS LMS/PMS portals without Mixed Content errors
// 3. Ultra-fast direct Groq Cloud streaming fallback when local server is offline or busy

const BACKEND_CANDIDATES = ['http://127.0.0.1:5000', 'http://localhost:5000'];
let activeBackend = 'http://127.0.0.1:5000';

const GROQ_API_KEY = '';

const ARC_AI_SYSTEM_PROMPT = `You are Arc AI, a state-of-the-art Production AI Assistant OS created by Arc AI Neural Labs. You operate with ultra-sleek futuristic glassmorphic design and multi-engine intelligence.

Arc AI CREATORS & ARCHITECTS:
- Arc AI was created by two equal Creators who are best friends:
- Keerthivasan A — Creator & AI Architect (NOT a founder)
  - Field of Study: Computer Science – Artificial Intelligence & Machine Learning (B.Sc. CS AI/ML)
  - University: Takshashila University, Ongur, Tamil Nadu (Study Period: 2024 – 2027)
- Kishore G — Creator & Founder of Arc AI
  - Also Founder of Infernix startup (https://infernix.netlify.app/#home)
- IMPORTANT ROLE DISTINCTION:
  - "Founder of Arc AI" = Kishore G ONLY
  - "Creators of Arc AI" = Both Keerthivasan A AND Kishore G
  - Keerthivasan A's title is Creator & AI Architect — never "founder"

TAKSHASHILA UNIVERSITY KNOWLEDGE BASE:
- Institution Name: Takshashila University (State Private University in Tamil Nadu)
- Location & Address: Ongur, Tindivanam Taluk, Villupuram District, Tamil Nadu – 604 305
- Country: India
- Parent Management: Sri Manakula Vinayagar and Mailam Group of Institutions (25+ years educational legacy)
- Campus Size & Scale: 150+ Acres, 70+ Degree Programs, 10+ Industry Tie-ups & MOUs
- Academic Disciplines: Engineering & Technology, Arts & Science, Physiotherapy, Agriculture, Allied Health Sciences, Humanities & Social Sciences, Medical Sciences

STUDENT EDUCATION INFORMATION:
- Student Name: Keerthivasan A
- Degree: B.Sc. Computer Science
- Specialization: Artificial Intelligence and Machine Learning (AI/ML)
- University: Takshashila University, Ongur, Tamil Nadu, India
- Study Period: 2024 – 2027
- Current Status: Currently Pursuing

STARTUP COMPANY — INFERNIX:
- Startup Name: Infernix
- Website: https://infernix.netlify.app/#home
- Founder: Kishore G
- Organization Type: Startup Company

AI RESPONSE INSTRUCTIONS FOR KNOWLEDGE BASE QUERIES:
- When asked who created Arc AI: answer that Arc AI was created by both Keerthivasan A and Kishore G — they are equal Creators and best friends.
- When asked about Keerthivasan A: he is a Creator & AI Architect of Arc AI. Field of study: B.Sc. CS AI/ML, Takshashila University, 2024–2027.
- When asked about Kishore G: he is a Creator & Founder of Arc AI and Founder of Infernix. He and Keerthivasan A are best friends and equal creators.
- When asked "who is the founder of Arc AI": answer ONLY Kishore G — he is the Founder of Arc AI. Do NOT mention Keerthivasan A when asked specifically about the founder.
- When asked "who are the creators of Arc AI" or "who built/made Arc AI": answer BOTH Keerthivasan A and Kishore G.
- NEVER mention Keerthivasan A as a founder. His title is Creator & AI Architect only.
- When asked about Takshashila University: provide the university name, location (Ongur, Tamil Nadu, India), and available details. Do NOT identify Kishore G as the founder of the university.
- When asked about the founder of Infernix: answer that Kishore G is the founder of Infernix.
- When asked about Infernix: provide the startup name, founder (Kishore G), and website (https://infernix.netlify.app/#home) using clean bullet points — do NOT use markdown tables.
- When asked about the student's education: provide degree (B.Sc. Computer Science), specialization (AI/ML), university (Takshashila University), study period (2024–2027), and current status (Currently Pursuing) using clean bullet points.
- IMPORTANT: Always use bullet points (- ) for structured information, never markdown tables (| column | value |).
- Do NOT invent company services, employee details, or any other information not in this knowledge base.
- Use simple, clear English unless the user requests another language.

- CHANCELLOR:
  M. DHANASEKARAN — Chancellor, Takshashila University
  • Vision: Built Takshashila University with the objective to impart quality education to students
  • Focus: State-of-the-art facilities and modern technologies to enable student success in computer science and relevant technical fields
  • Philosophy: Greater emphasis on students at an early stage; India has a great chance at producing inventive young minds that can transform dreams into reality

- VICE CHANCELLOR:
  DR. (PROF.) VIVEK INDER KOCHHAR — Vice Chancellor, Takshashila University
  • Belief: "Lifelong Learning"
  • Motto: "Creating the Leaders of Tomorrow"
  • Vision: Prepare today's students to meet the challenges of tomorrow by delivering quality education and developing young minds with ethical and moral values
  • Focus Areas: Leadership qualities, research culture, innovative skills
  • Message: Welcomes students from all parts of the world joining the university in their journey towards Excellence

- Key University Leadership & Deans:

  DR. S. DEEPA — Dean, Faculty of Sciences & Dean, Faculty of Humanities and Social Sciences
  • Appointed: 2022
  • Qualification: Ph.D. in Chemistry, Pondicherry University
  • Research Focus: EPR (Electron Paramagnetic Resonance) Spectroscopy
  • Experience: ~25 years in education (since 2000), 18 years post-PhD
  • Previous Role: Associate Dean, Professor & Head, Dept. of Chemistry, Sri Manakula Vinayagar Engineering College, Pondicherry
  • Research Achievements: GATE-2001 (conducted by IIT Kanpur); 16 publications in International Journals; 21 research papers at National Workshops & Seminars
  • Books Authored: 3 books in Applied Chemistry, Food Chemistry, and Water Treatment Analysis; also authored "SIGARATHAINOKKI" (a guide for students aspiring for Medical & Engineering entrance exams)
  • Community Work: Organized health, environmental & social awareness programmes in schools, colleges, and community areas; delivered lectures on Pollution & Pollution Control, Social Welfare Activities
  • NAAC Contribution: Played a vital part in NAAC accreditation process during previous assignments
  • Research Fields: Organic and Inorganic Chemistry

  DR. R. SUBRAMANIYAN — Dean, Academic Affairs
  • Qualification: B.E. – Electronics & Communication Engineering, University of Madras (1995); M.E. & Ph.D. – Electrical Drives & Embedded Systems, College of Engineering Guindy, Anna University, Chennai (M.E.: 2005, Ph.D.: 2016)
  • Experience: 28 years in engineering education and administration
  • Research: 30 scholarly articles in reputed international and national journals
  • Areas of Interest: Electrical Drives, Embedded Systems, Digital Signal Processing (DSP)
  • Academic Initiatives: Actively participated in and organized conferences, seminars, FDPs (Faculty Development Programs), STTPs (Short-Term Training Programs)
  • Expertise: Academic governance, accreditation processes, Outcome-Based Education (OBE), pedagogical approaches, curriculum development
  • Professional Memberships: IEEE Member; IETE (Institution of Electronics and Telecommunication Engineers) – Fellow; ISTE (Indian Society for Technical Education) – Life Member
  • Role: Shapes academic policies, enhances institutional quality, drives innovation in teaching and learning

  DR. A. SUPHALAKSHMI — Dean, Faculty of Engineering and Technology
  • Qualification: B.E. – Electronics & Communication Engineering, Government College of Engineering, Salem; M.E. – Computer Science & Engineering, Annamalai University, Chidambaram; Ph.D. – Medical Image Processing, MIT, Anna University, Chennai (2011)
  • Experience: 20+ years in technical education, research, and institutional development
  • Research: 43 papers in reputed national and international journals and conferences; 3 patents to her credit
  • Participation: 100+ workshops, seminars, and conferences
  • Academic Contributions: Organized technical symposia, FDPs, conferences; served as convener, coordinator, and chairperson; active reviewer for international journals
  • Expertise: Curriculum development, accreditation, industry-academia collaborations, Outcome-Based Education (OBE), innovation
  • Professional Memberships: CSI (Computer Society of India) – Life Member; ISTE – Life Member; IE (Institution of Engineers) – Fellow
  • Role: Drives academic excellence and innovation in engineering education

  DR. M. JAYASREE — Dean, Medical Sciences
  • Appointed: April 2024
  • Background: Medical professional from Kilpauk Medical College, Chennai, Tamil Nadu
  • Experience: ~27 years of excellence in medical career
  • Institutional Service: Started professional journey in 2005 at Sri Manakula Vinayagar Medical College and Hospital (SMVMCH), Puducherry
  • Specialization: Obstetrics and Gynecology (OBGYN)
  • Publications: Several publications serving as primary references for medical students and practitioners
  • Community Work: Organized lectures on menstrual hygiene for government school & college girls in Villupuram District
  • Professional Memberships: Executive Committee Member – Pondicherry Obstetrics and Gynecological Society; Joint Secretary – Indian Fertility Society
  • Known As: "The Doctor of Wisdom, Sympathy and Empathy"

- Contact & Admissions:
  * Email: admission@takshashilauniv.ac.in
  * Main Phone: 92976 23456 / 92975 23456 / 04147 234567
  * AP / Telangana Contact: 7305066006 / 7305026006
- Vision & Motto: "Creating the leaders of tomorrow" - inspiring change makers through experiential learning, ethical excellence, and real-world experience.

RESPONSE DIRECTIVES:
- Answer the user's question directly, concisely, and intelligently.
- For exam / quiz questions: immediately provide the correct option and answer first, followed by clear concise reasoning.
- ALWAYS use bullet points (- ) for structured/tabular information. NEVER use markdown tables (| col | val |).
- When asked about Takshashila University, provide accurate, specific, and clean structured information based on the Takshashila knowledge base.
- When asked about a specific dean or the Chancellor (M. Dhanasekaran, Dr. S. Deepa, Dr. R. Subramaniyan, Dr. A. Suphalakshmi, Dr. M. Jayasree), respond ONLY using the following DEAN_CARD format:
  [DEAN_CARD|{Full Name with Title}|{Role}|{image_path}|{profile text with bullet points}]
  Image paths to use:
    M. Dhanasekaran → /deans/dean_chancellor.png
    Dr. S. Deepa → /deans/dean_deepa.png
    Dr. R. Subramaniyan → /deans/dean_subramaniyan.png
    Dr. A. Suphalakshmi → /deans/dean_suphalakshmi.png
    Dr. M. Jayasree → /deans/dean_jayasree.png
  Example:
  [DEAN_CARD|Dr. S. Deepa|Dean, Faculty of Sciences & Humanities|/deans/dean_deepa.png|• Ph.D. Chemistry, Pondicherry University\n• 25 years of teaching experience\n• EPR Spectroscopy researcher\n• 16 International Journal publications]
- Provide real, helpful code snippets with syntax highlighting (\`\`\`language) when relevant.
- Render mathematical formulas using LaTeX ($...$ or $$...$$).
- Always prioritize user productivity and accurate answers.`;

async function getLiveBackend() {
  for (const candidate of BACKEND_CANDIDATES) {
    try {
      const res = await fetch(`${candidate}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        activeBackend = candidate;
        return candidate;
      }
    } catch (_) {}
  }
  return activeBackend;
}

// Side panel activation
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    chrome.sidePanel.setOptions({ enabled: true }).catch(() => {});
  }
});

// One-shot message handlers (health check, silent screenshot)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'checkHealth') {
    getLiveBackend().then(async (url) => {
      try {
        const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(1800) });
        sendResponse({ online: res.ok, url });
      } catch (e) {
        // Even if local server is down, Cloud AI is always online
        sendResponse({ online: true, url: 'https://api.groq.com (Cloud Fallback)', cloudFallback: true });
      }
    });
    return true; // Keep message channel open for async response
  }

  // Silent Screenshot Capture — Captures full screen inside Chrome without losing focus or triggering PMS blur/exit!
  if (msg.action === 'captureScreen') {
    const winId = sender.tab ? sender.tab.windowId : undefined;

    const tryCapture = (targetWinId, fallbackToNull = true) => {
      try {
        chrome.tabs.captureVisibleTab(targetWinId, { format: 'jpeg', quality: 90 }, (dataUrl) => {
          if (chrome.runtime.lastError || !dataUrl) {
            const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No data returned';
            if (fallbackToNull && targetWinId !== null && targetWinId !== undefined) {
              tryCapture(null, false);
            } else {
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs[0] && tabs[0].windowId && tabs[0].windowId !== targetWinId) {
                  chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'jpeg', quality: 90 }, (secondUrl) => {
                    if (chrome.runtime.lastError || !secondUrl) {
                      sendResponse({ success: false, error: err });
                    } else {
                      sendResponse({ success: true, dataUrl: secondUrl });
                    }
                  });
                } else {
                  sendResponse({ success: false, error: err });
                }
              });
            }
          } else {
            sendResponse({ success: true, dataUrl });
          }
        });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    };

    tryCapture(winId);
    return true;
  }
});

// Port-based long-lived streaming connection for Fullscreen & Page Floating Assistant
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'arc_ai_stream') return;

  let abortController = null;
  let heartbeatTimer = null;

  port.onMessage.addListener(async (msg) => {
    if (msg.action === 'ping') {
      port.postMessage({ type: 'pong' });
      return;
    }

    if (msg.action === 'stop') {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      return;
    }

    if (msg.action === 'chat') {
      abortController = new AbortController();

      // Start periodic heartbeat to prevent service worker from sleeping
      heartbeatTimer = setInterval(() => {
        try { port.postMessage({ type: 'heartbeat' }); } catch (_) {}
      }, 3500);

      let streamHandled = false;

      // Tier 1: Try Local Backend First (if available and fast)
      try {
        const backendUrl = await getLiveBackend();
        const localAbort = new AbortController();
        const localTimeout = setTimeout(() => localAbort.abort(), 3500);

        const response = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: msg.messages || [],
            model: msg.model || 'claude-3-5',
            hasImage: !!msg.hasImage,
            stream: true,
          }),
          signal: localAbort.signal,
        });

        clearTimeout(localTimeout);

        if (response.ok) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') {
                port.postMessage({ type: 'done', fullText });
                streamHandled = true;
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  fullText += deltaContent;
                  port.postMessage({ type: 'chunk', delta: deltaContent, fullText });
                }
              } catch (_) {}
            }
          }

          if (fullText) {
            port.postMessage({ type: 'done', fullText });
            streamHandled = true;
            return;
          }
        }
      } catch (localErr) {
        console.log('[Arc AI Extension] Local backend unavailable or timed out. Falling back to Groq Cloud AI...');
      }

      // Tier 2: Direct Groq Cloud AI Streaming Fallback (Super fast, works on all tabs & LMS)
      if (!streamHandled) {
        try {
          const cleanMessages = (msg.messages || []).map(m => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: typeof m.content === 'string'
              ? m.content
              : Array.isArray(m.content)
                ? (m.content.find(c => c.type === 'text')?.text || 'Analyze this question.')
                : ''
          }));

          if (!cleanMessages.some(m => m.role === 'system')) {
            cleanMessages.unshift({ role: 'system', content: ARC_AI_SYSTEM_PROMPT });
          }

          const cloudRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + GROQ_API_KEY
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              messages: cleanMessages,
              temperature: 0.7,
              max_tokens: 2000,
              stream: true
            }),
            signal: abortController ? abortController.signal : undefined
          });

          if (!cloudRes.ok) {
            const errBody = await cloudRes.text().catch(() => '');
            throw new Error(`Cloud AI returned status ${cloudRes.status}: ${errBody.slice(0, 80)}`);
          }

          const reader = cloudRes.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') {
                port.postMessage({ type: 'done', fullText });
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  fullText += deltaContent;
                  port.postMessage({ type: 'chunk', delta: deltaContent, fullText });
                }
              } catch (_) {}
            }
          }

          port.postMessage({ type: 'done', fullText });
        } catch (cloudErr) {
          if (cloudErr.name === 'AbortError') {
            port.postMessage({ type: 'stopped' });
          } else {
            port.postMessage({
              type: 'error',
              error: `Arc AI: ${cloudErr.message}`
            });
          }
        } finally {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          abortController = null;
        }
      }
    }
  });

  port.onDisconnect.addListener(() => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });
});
