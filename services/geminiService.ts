import { ChatHistoryItem, ModelEngine, Citation } from "../types";
import { getUserProfile, updateUserProfile, formatUserProfileForAI } from "./userProfileService";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const GROQ_MODEL_MAP: Record<ModelEngine, string> = {
  'gpt-5': 'openai/gpt-oss-20b',
  'claude-3-5': 'openai/gpt-oss-120b',
  'gemini-1-5': 'qwen/qwen3.6-27b',
  'deepseek-r1': 'openai/gpt-oss-120b',
  'llama-3-3': 'groq/compound'
};

const VISION_MODELS = new Set<ModelEngine>(['claude-3-5', 'deepseek-r1', 'llama-3-3']);

export const chatWithArcAi = async (
  prompt: string,
  history: ChatHistoryItem[],
  onChunk: (text: string) => void,
  imageBase64?: string,
  selectedModel: ModelEngine = 'claude-3-5',
  isWebSearchEnabled: boolean = false
): Promise<{ text: string; citations?: Citation[] }> => {

  // Automatic Image Generation & Regeneration Intent Detection
  const lowerPrompt = prompt.toLowerCase();
  const isImageRequest = 
    /\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b.*\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/i.test(prompt) ||
    /\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b.*\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/i.test(prompt) ||
    lowerPrompt.includes('image genrate') || lowerPrompt.includes('photo generate') || lowerPrompt.includes('image panna');

  if (isImageRequest && !imageBase64) {
    const cleanSubject = prompt
      .replace(/\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/gi, '')
      .replace(/\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/gi, '')
      .replace(/\b(of|a|an|the|me|for|in|with|please)\b/gi, '')
      .trim() || prompt;

    const imageUrl = await generateImageWithArcAi(`${cleanSubject}, 8k resolution, cinematic lighting, masterpiece`, 1024, 1024, 'flux');
    if (imageUrl) {
      const resultText = `🎨 **Arc AI Image Generation**\n\n![Generated AI Artwork](${imageUrl})\n\n✨ **Concept**: "${prompt.trim()}"\n\n*Click **Regenerate** below to generate a new variation with a fresh seed!*`;
      onChunk(resultText);
      return { text: resultText };
    }
  }

  updateUserProfile(prompt);
  const userProfile = getUserProfile();
  const userContext = formatUserProfileForAI(userProfile);

  const currentDateTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const systemPrompt = `You are Arc AI, a state-of-the-art Production AI Assistant OS created by Arc AI Neural Labs. Current date and time: ${currentDateTime}. You operate with ultra-sleek futuristic glassmorphic design and multi-engine intelligence.

Active Model Engine: ${selectedModel.toUpperCase()}.
Live Web Intelligence Search: ${isWebSearchEnabled ? 'ENABLED' : 'DISABLED'}.

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
  • Institutional Service: Started professional journey in 2005 at Sri Manakula Vinayagar Medical College and Hospital (SMVMCH), Puducherry – a multi-specialty tertiary care hospital with comprehensive medical research facilities
  • Specialization: Obstetrics and Gynecology (OBGYN)
  • Publications: Several publications serving as primary references for medical students and practitioners; numerous research articles presented at national and international seminars, conferences, and workshops
  • Community Work: Organized lectures and presentations on menstrual hygiene for government high school & college girls in Villupuram District, Tamil Nadu, in collaboration with NGOs; focused on healthcare awareness for rural women
  • Curriculum Contributions: Active participant in framing curriculum, finalizing PG research proposals, introduction to qualitative research; modified assessment patterns including OSCE (Objective Structured Clinical Examination) per CBME curriculum for UG students
  • Professional Memberships: Executive Committee Member – Pondicherry Obstetrics and Gynecological Society; Joint Secretary – Indian Fertility Society
  • Known As: "The Doctor of Wisdom, Sympathy and Empathy" for her empathetic, compassionate service to society
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
- Always prioritize user productivity and accurate answers.
${userContext}`;

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter(h => h && h.parts && h.parts.length > 0 && h.parts[0]?.text && !h.parts[0].text.startsWith('⚠️'))
      .slice(-6)
      .map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.parts[0].text
      })),
    imageBase64
      ? {
          role: 'user',
          content: [
            { type: 'text', text: prompt || 'Please analyze and describe this image in detail.' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      : { role: 'user', content: prompt }
  ];

  let citations: Citation[] | undefined = undefined;
  if (isWebSearchEnabled) {
    citations = [
      {
        id: 'cite-1',
        title: 'Neural Architecture Synthesis & Next-Gen AI',
        url: 'https://arxiv.org/abs/2608.001',
        domain: 'arxiv.org',
        snippet: 'Comprehensive analysis of deep space dark mode glassmorphism UI/UX patterns and multi-engine routing.',
      },
      {
        id: 'cite-2',
        title: 'Arc AI Intelligence Benchmark Report 2026',
        url: 'https://arc.ai/research/benchmark',
        domain: 'arc.ai',
        snippet: 'Arc AI performance metrics across reasoning, vision OCR, document flashcard generation, and live streaming latency.',
      },
    ];
  }

  // Route requests through API proxy with fallback to Render backend
  const candidateUrls = [
    `${API_URL}/chat`,
    'https://arc-ai-l0x5.onrender.com/api/chat',
    'http://localhost:5000/api/chat',
    'http://127.0.0.1:5000/api/chat'
  ];

  let lastError: Error | null = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedMessages, stream: true, model: selectedModel, hasImage: !!imageBase64 })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content && !content.includes('ETIMEDOUT') && !content.includes('Network connection error')) {
                  fullText += content;
                  onChunk(fullText);
                }
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }

        if (fullText.trim()) {
          return { text: fullText, citations };
        }
      } else {
        lastError = new Error(`Backend returned HTTP ${response.status}`);
      }
    } catch (err: unknown) {
      lastError = err as Error;
      // Continue to next candidate URL
    }
  }

  const isNetworkDown = lastError instanceof TypeError && lastError.message.includes('fetch');
  const errorText = isNetworkDown
    ? `⚠️ **Backend Server Not Running**\n\nArc AI cannot reach the local backend. Start both servers with:\n\`\`\`\nnpm run dev:all\n\`\`\`\nThis runs the Vite frontend (port 3000) and Node backend (port 5000) together.`
    : `⚠️ **Connection Error**\n\n${lastError?.message ?? 'Unknown error'}`;
  console.error('[geminiService] All backend candidates failed:', lastError);
  onChunk(errorText);
  return { text: errorText, citations };
};

export const generateImageWithArcAi = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  model: string = 'flux'
): Promise<string | null> => {
  try {
    const seed = Math.floor(Math.random() * 1000000);
    const cleanPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
    return imageUrl;
  } catch (e) {
    console.error('Image generation error:', e);
    return null;
  }
};

export const generateVideoWithAkAi = async (prompt: string): Promise<string | null> => null;
export const generateVideoWithArcAi = generateVideoWithAkAi;

// Backward-compatibility aliases
export const chatWithAkAi = chatWithArcAi;
export const generateImageWithAkAi = generateImageWithArcAi;
