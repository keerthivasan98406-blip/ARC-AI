const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Universal CORS Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/generated-sites', express.static(path.join(__dirname, '../generated-sites')));
app.use('/deans', express.static(path.join(__dirname, '../public/deans')));
app.use(express.static(path.join(__dirname, '../public')));

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ── API Configuration ──────────────────────────────────────────
const AICC_API_KEY = process.env.AICC_API_KEY || 'sk-LmeoayPMfQIrDyuRJmZPmvI9L1VkFY9pAXWSBhE42yMuPxPM';
const AICC_HOST   = 'api.ai.cc';
const AICC_PATH   = '/v1/chat/completions';

// Map UI model IDs → low-cost verified working models with zero/minimal pre-deduction
const MODEL_MAP = {
  'gpt-5':       'qwen-flash',
  'claude-3-5':  'qwen-flash',
  'gemini-1-5':  'MiniMax-M2.5',
  'deepseek-r1': 'MiniMax-M2.5',
  'llama-3-3':   'qwen-flash'
};

// Vision-capable models for image analysis
const VISION_MODELS_LIST = ['qwen3-vl-plus', 'glm-5.2'];

const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 60000 });

// Default Arc AI System Prompt ensuring identity, Takshashila knowledge, and deans
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
  • Professional Memberships: IEEE Member; IETE – Fellow; ISTE – Life Member
  • Role: Shapes academic policies, enhances institutional quality, drives innovation in teaching and learning

  DR. A. SUPHALAKSHMI — Dean, Faculty of Engineering and Technology
  • Qualification: B.E. – Electronics & Communication Engineering, Government College of Engineering, Salem; M.E. – Computer Science & Engineering, Annamalai University, Chidambaram; Ph.D. – Medical Image Processing, MIT, Anna University, Chennai (2011)
  • Experience: 20+ years in technical education, research, and institutional development
  • Research: 43 papers in reputed national and international journals and conferences; 3 patents to her credit
  • Participation: 100+ workshops, seminars, and conferences
  • Professional Memberships: CSI – Life Member; ISTE – Life Member; IE – Fellow
  • Role: Drives academic excellence and innovation in engineering education

  DR. M. JAYASREE — Dean, Medical Sciences
  • Appointed: April 2024
  • Background: Medical professional from Kilpauk Medical College, Chennai, Tamil Nadu
  • Experience: ~27 years of excellence in medical career
  • Specialization: Obstetrics and Gynecology (OBGYN)
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
- ALWAYS use bullet points (- ) for structured/tabular information. NEVER use markdown tables (| col | val |) as they do not render properly.
- When asked about Takshashila University, provide accurate, specific, and clean structured information based on the Takshashila knowledge base.
- When asked about a specific dean or the Chancellor (M. Dhanasekaran, Dr. S. Deepa, Dr. R. Subramaniyan, Dr. A. Suphalakshmi, Dr. M. Jayasree), respond ONLY using the following DEAN_CARD format. Do NOT describe the image in text. Use this exact format:
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

// ── Core LLM call ──────────────────────────────────────────────
function executeAICCRequest(messages, modelName, hasImage) {
  return new Promise((resolve, reject) => {
    // Strip system message for vision models (they often don't support it)
    let cleanMessages = hasImage
      ? messages.filter(m => m.role !== 'system')
      : [...messages];

    // Ensure system prompt is present if not an image request and no system prompt was sent
    if (!hasImage && !cleanMessages.some(m => m.role === 'system')) {
      cleanMessages.unshift({ role: 'system', content: ARC_AI_SYSTEM_PROMPT });
    }

    const data = JSON.stringify({
      model: modelName,
      messages: cleanMessages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const TIMEOUT_MS = hasImage ? 90000 : 30000;

    const options = {
      hostname: AICC_HOST,
      path: AICC_PATH,
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer ' + AICC_API_KEY
      }
    };

    console.log(`[API] Model: ${modelName} | hasImage: ${hasImage} | payload: ${(Buffer.byteLength(data)/1024).toFixed(1)}KB`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const content = json.choices?.[0]?.message?.content ||
                          json.choices?.[0]?.message?.reasoning_content ||
                          json.choices?.[0]?.delta?.content;
          if (content !== undefined && content !== null && content !== '') {
            resolve(content);
          } else if (json.error) {
            reject(new Error(`API Error (${res.statusCode}): ${json.error.message || JSON.stringify(json.error)}`));
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${body.slice(0, 300)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message} — body: ${body.slice(0, 300)}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.setTimeout(TIMEOUT_MS, () => { req.destroy(); reject(new Error(`Request timeout after ${TIMEOUT_MS/1000}s`)); });
    req.write(data);
    req.end();
  });
}

// Groq Fallback Provider (ultra-fast, active API key)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Auto-detected quota status for AICC: if quota fails, bypass to Groq immediately
let aiccQuotaExhausted = true; 

function executeGroqStream(messages, modelName = 'qwen/qwen3.8-27b', res) {
  return new Promise((resolve, reject) => {
    const cleanMessages = messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content)
          ? (m.content.find(c => c.type === 'text')?.text || 'Analyze this image.')
          : ''
    }));

    if (!cleanMessages.some(m => m.role === 'system')) {
      cleanMessages.unshift({ role: 'system', content: ARC_AI_SYSTEM_PROMPT });
    }

    const data = JSON.stringify({
      model: modelName,
      messages: cleanMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer ' + GROQ_API_KEY
      }
    }, upstreamRes => {
      if (upstreamRes.statusCode !== 200) {
        let errBody = '';
        upstreamRes.on('data', d => errBody += d);
        upstreamRes.on('end', () => reject(new Error(`Groq HTTP ${upstreamRes.statusCode}: ${errBody}`)));
        return;
      }

      upstreamRes.on('data', chunk => {
        try { res.write(chunk); } catch (_) {}
      });

      upstreamRes.on('end', () => {
        try {
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (_) {}
        resolve();
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Groq stream request timeout')); });
    req.write(data);
    req.end();
  });
}

function executeGroqRequest(messages, modelName = 'qwen/qwen3.8-27b') {
  return new Promise((resolve, reject) => {
    const cleanMessages = messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content)
          ? (m.content.find(c => c.type === 'text')?.text || 'Analyze this image.')
          : ''
    }));

    if (!cleanMessages.some(m => m.role === 'system')) {
      cleanMessages.unshift({ role: 'system', content: ARC_AI_SYSTEM_PROMPT });
    }

    const data = JSON.stringify({
      model: modelName,
      messages: cleanMessages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer ' + GROQ_API_KEY
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const content = json.choices?.[0]?.message?.content;
          if (content) resolve(content);
          else reject(new Error(json.error?.message || `Groq status ${res.statusCode}`));
        } catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Groq request timeout')); });
    req.write(data);
    req.end();
  });
}

// Pollinations AI Fallback Provider (100% Free, Unlimited Quota)
function executePollinationsRequest(messages) {
  return new Promise((resolve, reject) => {
    const cleanMessages = messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content)
          ? (m.content.find(c => c.type === 'text')?.text || 'Analyze this image.')
          : ''
    }));

    if (!cleanMessages.some(m => m.role === 'system')) {
      cleanMessages.unshift({ role: 'system', content: ARC_AI_SYSTEM_PROMPT });
    }

    const data = JSON.stringify({
      messages: cleanMessages,
      model: 'openai'
    });

    const req = https.request({
      hostname: 'text.pollinations.ai',
      path: '/openai/chat/completions',
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const content = json.choices?.[0]?.message?.content;
          if (content) resolve(content);
          else reject(new Error(`Pollinations status ${res.statusCode}`));
        } catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Pollinations request timeout')); });
    req.write(data);
    req.end();
  });
}

async function callAICCAPI(messages, requestedModel = 'claude-3-5', hasImage = false) {
  // If request contains an image, try vision models
  if (hasImage) {
    if (!aiccQuotaExhausted) {
      for (const vModel of VISION_MODELS_LIST) {
        try {
          const result = await executeAICCRequest(messages, vModel, true);
          return result;
        } catch (err) {
          if (err.message.includes('403') || err.message.includes('quota') || err.message.includes('预扣费额度失败')) {
            aiccQuotaExhausted = true;
            break;
          }
          console.warn(`[API] Vision model ${vModel} error: ${err.message}. Trying next fallback...`);
        }
      }
    }
    // Fallback vision requests to Groq reasoning (with text prompt preserved)
    console.warn('[API] Vision models routed to Groq reasoning...');
    try {
      return await executeGroqRequest(messages, 'qwen/qwen3.8-27b');
    } catch (groqErr) {
      console.warn('[API Fallback] Groq vision failed, trying Pollinations:', groqErr.message);
    }
    try {
      return await executePollinationsRequest(messages);
    } catch (polErr) {
      console.error('[API Fallback] Pollinations vision failed:', polErr.message);
    }
  }

  // If AICC quota is not exhausted, try AICC candidates
  if (!aiccQuotaExhausted) {
    const primaryModel = MODEL_MAP[requestedModel] || 'qwen-flash';
    const aiccCandidates = [primaryModel, 'qwen-flash', 'MiniMax-M2.5'];
    const triedModels = new Set();

    for (const modelName of aiccCandidates) {
      if (triedModels.has(modelName)) continue;
      triedModels.add(modelName);

      try {
        const res = await executeAICCRequest(messages, modelName, false);
        return res;
      } catch (err) {
        if (err.message.includes('403') || err.message.includes('quota') || err.message.includes('预扣费额度失败')) {
          aiccQuotaExhausted = true;
          console.warn(`[API] AICC quota exhausted. Permanently routing to Groq.`);
          break;
        }
        console.warn(`[API] AICC model ${modelName} failed (${err.message}). Checking next fallback...`);
      }
    }
  }

  // Tier 2: Groq (ultra-fast, active key)
  try {
    const groqRes = await executeGroqRequest(messages, 'qwen/qwen3.8-27b');
    return groqRes;
  } catch (groqErr) {
    console.warn('[API Fallback] Groq qwen failed, trying gpt-oss-120b:', groqErr.message);
    try {
      const groq120b = await executeGroqRequest(messages, 'openai/gpt-oss-120b');
      return groq120b;
    } catch (e2) {
      console.warn('[API Fallback] Groq 120b failed:', e2.message);
    }
  }

  // Tier 3: Pollinations AI (Unlimited, 100% free)
  console.log('[API Fallback] Routing to Pollinations AI (Unlimited Free)...');
  try {
    const polRes = await executePollinationsRequest(messages);
    return polRes;
  } catch (polErr) {
    console.error('[API Fallback] Pollinations failed:', polErr.message);
    throw new Error('All AI providers are temporarily busy. Please try again in a few moments.');
  }
}

// ── Routes ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Arc AI Engine running — api.ai.cc backend',
    hasApiKey: !!AICC_API_KEY,
    endpoint: `https://${AICC_HOST}${AICC_PATH}`
  });
});

app.post('/api/chat', async (req, res) => {
  const { messages = [], model = 'claude-3-5', hasImage = false } = req.body || {};

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Automatic Image Generation Intent Detection (Matches Main Arc AI behavior)
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText = typeof lastUserMsg?.content === 'string'
    ? lastUserMsg.content
    : Array.isArray(lastUserMsg?.content)
      ? (lastUserMsg.content.find(c => c.type === 'text')?.text || '')
      : '';

  const lowerPrompt = userText.toLowerCase();
  const isImageRequest =
    !hasImage && userText && (
      /\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b.*\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/i.test(userText) ||
      /\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b.*\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/i.test(userText) ||
      lowerPrompt.includes('image genrate') || lowerPrompt.includes('photo generate') || lowerPrompt.includes('image panna')
    );

  if (isImageRequest) {
    const cleanSubject = userText
      .replace(/\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/gi, '')
      .replace(/\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/gi, '')
      .replace(/\b(of|a|an|the|me|for|in|with|please)\b/gi, '')
      .trim() || userText;

    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanSubject + ', 8k resolution, cinematic lighting, masterpiece')}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
    const resultText = `🎨 **Arc AI Image Generation**\n\n![Generated AI Artwork](${imageUrl})\n\n✨ **Concept**: "${userText.trim()}"\n\n*Click image to view in high resolution.*`;
    const payload = JSON.stringify({ choices: [{ delta: { content: resultText } }] });
    res.write(`data: ${payload}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  // Fast Real-Time Streaming Path via Groq AI (Tokens in <300ms)
  try {
    await executeGroqStream(messages, 'qwen/qwen3.8-27b', res);
  } catch (streamErr) {
    console.warn('[Chat Stream Error] Groq stream failed, attempting standard fallback:', streamErr.message);
    try {
      const aiResponseText = await callAICCAPI(messages, model, hasImage);
      const payload = JSON.stringify({ choices: [{ delta: { content: aiResponseText } }] });
      res.write(`data: ${payload}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('[Chat API Error]', err.message);

      // Emergency rescue: Attempt direct Pollinations AI
      try {
        console.log('[API Fallback] Emergency rescue: Attempting Pollinations AI directly...');
        const emergencyRes = await executePollinationsRequest(messages);
        const payload = JSON.stringify({ choices: [{ delta: { content: emergencyRes } }] });
        res.write(`data: ${payload}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (emErr) {
        console.error('[Chat API Emergency Fallback Failed]', emErr.message);
      }

      const is401 = err.message.includes('401') || err.message.includes('Invalid API Key') || err.message.includes('NO_API_KEY');
      const is403Quota = err.message.includes('403') || err.message.includes('预扣费额度失败') || err.message.includes('quota') || err.message.includes('balance');

      let errorMsg = `⚠️ **Connection Error**\n\n${err.message}\n\nPlease check your internet connection or backend server status.`;
      if (is401) {
        errorMsg = `⚠️ **API Key Error**\n\nThe AI provider key returned an authentication error.\n\nPlease check \`server/.env\` → \`AICC_API_KEY\`.`;
      } else if (is403Quota) {
        errorMsg = `⚠️ **Account Balance Notice**\n\nYour \`api.ai.cc\` balance is temporarily exhausted. Arc AI automatically attempted secondary fallback models. Please top up your \`api.ai.cc\` balance or check your Groq API key in \`server/.env\`.`;
      }

      const errorPayload = JSON.stringify({ choices: [{ delta: { content: errorMsg } }] });
      res.write(`data: ${errorPayload}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

if (fs.existsSync(distPath)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/deans') || req.path.startsWith('/generated-sites')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Arc AI Server] Running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
  console.log(`[Arc AI Server] Backend: https://${AICC_HOST}${AICC_PATH}`);
  console.log(`[Arc AI Server] API Key: ${AICC_API_KEY ? AICC_API_KEY.slice(0, 8) + '...' : 'NOT SET'}`);
});
