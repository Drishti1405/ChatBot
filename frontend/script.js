/**
 * NOVA AI — INTELLIGENT COPILOT & CONVERSATIONAL ENGINE
 * Features:
 *  - Neural Preloader & Aesthetic Reloader
 *  - Marked.js + Highlight.js Code Highlighting & Copy
 *  - Web Speech API (Voice Dictation) & SpeechSynthesis (TTS)
 *  - PDF Document Intelligence with PDF.js
 *  - Web Audio API Synthesized UI Chimes
 *  - Persona Engine (Architect, Resume Coach, Research, Copilot)
 *  - Dual Mode (Studio Desktop vs Floating Widget)
 *  - Live Gemini API + Interactive Showcase Demo Fallback
 */

// ========================================================
// 1. STATE & CONFIGURATION
// ========================================================
const BACKEND_API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "/api/chat"
  : "https://chatbot-backend-drishti1405s-projects.vercel.app/api/chat";

const APP_STATE = {
  theme: localStorage.getItem("nova_theme") || "dark",
  soundEnabled: localStorage.getItem("nova_sound") !== "false",
  apiMode: (localStorage.getItem("nova_api_mode") === "gemini") ? "gemini" : "live",
  apiKey: localStorage.getItem("nova_api_key") || "",
  model: localStorage.getItem("nova_model") || "gemini-1.5-flash",
  persona: "assistant",
  viewMode: localStorage.getItem("nova_view_mode") || "studio", // 'studio' or 'widget'
  chatHistory: [],
  attachedDoc: null, // { name, text, pages }
  isGenerating: false,
  isRecordingVoice: false
};

// Persona System Instructions
const PERSONA_PROMPTS = {
  assistant: "You are Nova AI, a world-class AI Copilot. You are intelligent, insightful, concise, and helpful. Format your responses with clean Markdown, bullet points, and code blocks where suitable.",
  architect: "You are Nova AI acting as a Principal Full-Stack & Cloud Architect. You prioritize clean architecture, scalability, security, clean code, design patterns (SOLID, Microservices, Event-Driven), and production-grade code examples.",
  resume: "You are Nova AI acting as an Executive Tech Recruiter & Resume Architect. You critique resumes using the Google X-Y-Z and STAR methods (Situation, Task, Action, Result). You highlight high-impact action verbs, quantitative metrics, and ATS optimization.",
  research: "You are Nova AI acting as a Senior Research Scientist & Document Analyst. You specialize in synthesizing complex PDFs, academic papers, and technical whitepapers into executive summaries, key findings, and actionable takeaways."
};

// ========================================================
// 2. DOM ELEMENT REFERENCES
// ========================================================
const elements = {
  preloader: document.getElementById("app-preloader"),
  preloaderBar: document.getElementById("preloader-progress-bar"),
  preloaderStatus: document.getElementById("preloader-status-text"),
  
  reloaderSweep: document.getElementById("reloader-sweep"),
  reloaderBtn: document.getElementById("reloader-btn"),
  
  chatPopup: document.getElementById("chatbot-popup"),
  chatBody: document.getElementById("chat-body"),
  chatForm: document.getElementById("chat-form"),
  messageInput: document.getElementById("message-input"),
  sendBtn: document.getElementById("send-btn"),
  
  fileInput: document.getElementById("file-input"),
  fileUploadBtn: document.getElementById("file-upload"),
  filePreviewBar: document.getElementById("file-preview-bar"),
  docNameLabel: document.getElementById("doc-name-label"),
  docMetaLabel: document.getElementById("doc-meta-label"),
  removeFileBtn: document.getElementById("remove-file-btn"),
  
  voiceInputBtn: document.getElementById("voice-input-btn"),
  voiceStatusBar: document.getElementById("voice-status-bar"),
  cancelVoiceBtn: document.getElementById("cancel-voice-btn"),
  
  emojiBtn: document.getElementById("emoji-btn"),
  emojiPickerContainer: document.getElementById("emoji-picker-container"),
  emojiPicker: document.querySelector("emoji-picker"),
  
  personaSelect: document.getElementById("persona-select"),
  soundToggleBtn: document.getElementById("sound-toggle-btn"),
  soundIcon: document.getElementById("sound-icon"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  themeIcon: document.getElementById("theme-icon"),
  viewModeBtn: document.getElementById("view-mode-btn"),
  viewModeIcon: document.getElementById("view-mode-icon"),
  exportChatBtn: document.getElementById("export-chat-btn"),
  
  chatbotToggler: document.getElementById("chatbot-toggler"),
  closeChatbotBtn: document.getElementById("close-chatbot"),
  
  settingsBtn: document.getElementById("settings-btn"),
  settingsModal: document.getElementById("settings-modal"),
  closeModalBtn: document.getElementById("close-modal-btn"),
  cancelSettingsBtn: document.getElementById("cancel-settings-btn"),
  saveSettingsBtn: document.getElementById("save-settings-btn"),
  apiModeSelect: document.getElementById("api-mode-select"),
  customApiKeyInput: document.getElementById("custom-api-key"),
  modelSelect: document.getElementById("model-select"),
  toggleKeyVisibilityBtn: document.getElementById("toggle-key-visibility"),
  eyeIcon: document.getElementById("eye-icon"),
  
  activeModeLabel: document.getElementById("active-mode-label"),
  toastContainer: document.getElementById("toast-container"),
  welcomeCard: document.getElementById("welcome-card")
};

// ========================================================
// 3. SYNTHESIZED AUDIO ENGINE (Web Audio API)
// ========================================================
class SoundFXEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  play(type) {
    if (!APP_STATE.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === "send") {
        // Uplifting smooth pop chime (420Hz -> 840Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "receive") {
        // Delicate two-tone glass chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.07); // A5
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "reload") {
        // Futuristic sweep
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "click") {
        // Subtle micro tick
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }
}
const audioFX = new SoundFXEngine();

// ========================================================
// 4. TOAST NOTIFICATIONS
// ========================================================
function showToast(message, icon = "info") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="material-symbols-rounded">${icon}</span>
    <span>${message}</span>
  `;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fadeout");
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

// ========================================================
// 5. AESTHETIC INITIAL PRELOADER ("NEURAL LOADER")
// ========================================================
function runPreloaderSequence() {
  const steps = [
    { progress: 25, status: "Initializing Gemini 2.0 Engine..." },
    { progress: 55, status: "Mounting PDF.js & Vector Extractors..." },
    { progress: 85, status: "Configuring Marked & Syntax Highlighters..." },
    { progress: 100, status: "Neural Copilot Ready!" }
  ];

  let currentStep = 0;
  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      if (elements.preloaderBar) elements.preloaderBar.style.width = `${step.progress}%`;
      if (elements.preloaderStatus) elements.preloaderStatus.textContent = step.status;
      currentStep++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        if (elements.preloader) {
          elements.preloader.classList.add("preloader-hidden");
          setTimeout(() => elements.preloader.remove(), 700);
        }
      }, 350);
    }
  }, 260);
}

// ========================================================
// 6. AESTHETIC RELOADER SWEEP EFFECT & SESSION RESET
// ========================================================
function triggerAestheticReload() {
  audioFX.play("reload");
  
  if (elements.reloaderSweep) {
    elements.reloaderSweep.classList.add("active");
  }

  setTimeout(() => {
    // Reset state & messages
    APP_STATE.chatHistory = [];
    clearAttachedDocument();
    
    // Clear chat body and restore welcome card
    elements.chatBody.innerHTML = "";
    if (elements.welcomeCard) {
      elements.chatBody.appendChild(elements.welcomeCard.cloneNode(true));
      bindStarterChips();
    }
    
    elements.messageInput.value = "";
    adjustTextareaHeight();

    showToast("Session reloaded with refreshed neural context", "sync");
  }, 450);

  setTimeout(() => {
    if (elements.reloaderSweep) {
      elements.reloaderSweep.classList.remove("active");
    }
  }, 950);
}

// ========================================================
// 7. MARKDOWN & CODE HIGHLIGHTING CONFIGURATION
// ========================================================
if (window.marked) {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    }
  });
}

function renderMarkdownSafely(text) {
  if (!window.marked) return text;
  
  // Custom marked renderer
  const rawHtml = marked.parse(text);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = rawHtml;

  // Wrap code blocks with high-tech header and copy button
  tempDiv.querySelectorAll("pre code").forEach((codeEl) => {
    const pre = codeEl.parentElement;
    if (pre.parentElement && pre.parentElement.classList.contains("code-block-container")) {
      return; // Already wrapped
    }

    const langMatch = codeEl.className.match(/language-([a-z0-9_-]+)/i);
    const lang = langMatch ? langMatch[1] : "code";

    const container = document.createElement("div");
    container.className = "code-block-container";

    const header = document.createElement("div");
    header.className = "code-header";
    header.innerHTML = `
      <span class="code-lang">${lang.toUpperCase()}</span>
      <button type="button" class="copy-code-btn" title="Copy code">
        <span class="material-symbols-rounded">content_copy</span>
        <span>Copy</span>
      </button>
    `;

    pre.parentNode.insertBefore(container, pre);
    container.appendChild(header);
    container.appendChild(pre);

    const copyBtn = header.querySelector(".copy-code-btn");
    copyBtn.addEventListener("click", () => {
      audioFX.play("click");
      navigator.clipboard.writeText(codeEl.innerText).then(() => {
        copyBtn.innerHTML = `
          <span class="material-symbols-rounded" style="color: #10b981;">check</span>
          <span style="color: #10b981;">Copied!</span>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <span class="material-symbols-rounded">content_copy</span>
            <span>Copy</span>
          `;
        }, 2000);
      });
    });
  });

  return tempDiv.innerHTML;
}

// ========================================================
// 8. CHAT MESSAGE RENDERING & STREAMING
// ========================================================
function appendMessage(sender, text, isHtml = false) {
  const welcomeCardEl = elements.chatBody.querySelector(".welcome-card");
  if (welcomeCardEl) {
    welcomeCardEl.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";
  avatarDiv.innerHTML = `<span class="material-symbols-rounded">${sender === "bot" ? "neurology" : "person"}</span>`;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content-wrapper";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble";

  if (sender === "user") {
    bubbleDiv.textContent = text;
  } else {
    bubbleDiv.innerHTML = isHtml ? text : renderMarkdownSafely(text);
  }

  contentWrapper.appendChild(bubbleDiv);

  // Bot message actions (Read Aloud, Copy)
  if (sender === "bot" && !isHtml) {
    const actionsBar = document.createElement("div");
    actionsBar.className = "message-actions";
    actionsBar.innerHTML = `
      <button type="button" class="msg-action-btn speak-btn" title="Read Aloud">
        <span class="material-symbols-rounded">volume_up</span>
        <span>Listen</span>
      </button>
      <button type="button" class="msg-action-btn copy-msg-btn" title="Copy text">
        <span class="material-symbols-rounded">content_copy</span>
        <span>Copy</span>
      </button>
    `;

    const speakBtn = actionsBar.querySelector(".speak-btn");
    speakBtn.addEventListener("click", () => speakText(bubbleDiv.innerText, speakBtn));

    const copyBtn = actionsBar.querySelector(".copy-msg-btn");
    copyBtn.addEventListener("click", () => {
      audioFX.play("click");
      navigator.clipboard.writeText(bubbleDiv.innerText).then(() => {
        showToast("Response copied to clipboard", "done");
      });
    });

    contentWrapper.appendChild(actionsBar);
  }

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentWrapper);
  elements.chatBody.appendChild(messageDiv);
  elements.chatBody.scrollTop = elements.chatBody.scrollHeight;

  return messageDiv;
}

function showThinkingIndicator() {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message bot-message thinking-msg";
  messageDiv.id = "thinking-indicator";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";
  avatarDiv.innerHTML = `<span class="material-symbols-rounded">neurology</span>`;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content-wrapper";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble thinking-bubble";
  bubbleDiv.innerHTML = `
    <span class="thinking-text">Nova is thinking</span>
    <div class="thinking-dots">
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
    </div>
  `;

  contentWrapper.appendChild(bubbleDiv);
  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentWrapper);
  elements.chatBody.appendChild(messageDiv);
  elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
  return messageDiv;
}

// Smooth Typewriter Streaming Effect
async function streamBotResponse(fullText) {
  const indicator = document.getElementById("thinking-indicator");
  if (indicator) indicator.remove();

  const welcomeCardEl = elements.chatBody.querySelector(".welcome-card");
  if (welcomeCardEl) welcomeCardEl.remove();

  audioFX.play("receive");

  const messageDiv = document.createElement("div");
  messageDiv.className = "message bot-message";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";
  avatarDiv.innerHTML = `<span class="material-symbols-rounded">neurology</span>`;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content-wrapper";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble";
  
  contentWrapper.appendChild(bubbleDiv);
  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentWrapper);
  elements.chatBody.appendChild(messageDiv);

  // Typewriter streaming chunk by chunk
  let currentText = "";
  const words = fullText.split(" ");
  const chunkSize = Math.max(1, Math.floor(words.length / 35));

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(" ") + " ";
    currentText += chunk;
    bubbleDiv.innerHTML = renderMarkdownSafely(currentText) + `<span class="typing-cursor"></span>`;
    elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
    await new Promise((r) => setTimeout(r, 22));
  }

  // Final render without cursor
  bubbleDiv.innerHTML = renderMarkdownSafely(fullText);

  // Add action buttons
  const actionsBar = document.createElement("div");
  actionsBar.className = "message-actions";
  actionsBar.innerHTML = `
    <button type="button" class="msg-action-btn speak-btn" title="Read Aloud">
      <span class="material-symbols-rounded">volume_up</span>
      <span>Listen</span>
    </button>
    <button type="button" class="msg-action-btn copy-msg-btn" title="Copy text">
      <span class="material-symbols-rounded">content_copy</span>
      <span>Copy</span>
    </button>
  `;

  const speakBtn = actionsBar.querySelector(".speak-btn");
  speakBtn.addEventListener("click", () => speakText(bubbleDiv.innerText, speakBtn));

  const copyBtn = actionsBar.querySelector(".copy-msg-btn");
  copyBtn.addEventListener("click", () => {
    audioFX.play("click");
    navigator.clipboard.writeText(bubbleDiv.innerText).then(() => {
      showToast("Response copied to clipboard", "done");
    });
  });

  contentWrapper.appendChild(actionsBar);
  elements.chatBody.scrollTop = elements.chatBody.scrollHeight;

  // Celebrate with confetti if it's a resume or architectural solution!
  if (fullText.includes("STAR method") || fullText.includes("Architecture Diagram") || fullText.includes("```")) {
    if (window.confetti) {
      window.confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.85 }
      });
    }
  }
}

// ========================================================
// 9. VOICE ENGINE (SPEECH-TO-TEXT & TEXT-TO-SPEECH)
// ========================================================
function toggleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Speech recognition not supported in this browser", "mic_off");
    return;
  }

  if (APP_STATE.isRecordingVoice) {
    stopVoiceRecognition();
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    APP_STATE.recognitionInstance = recognition;
    APP_STATE.isRecordingVoice = true;

    elements.voiceInputBtn.classList.add("listening");
    elements.voiceStatusBar.classList.add("active");
    audioFX.play("click");

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      elements.messageInput.value = (elements.messageInput.value + " " + speechResult).trim();
      adjustTextareaHeight();
      showToast("Voice transcribed successfully!", "mic");
    };

    recognition.onerror = (event) => {
      stopVoiceRecognition();
      showToast(`Mic error: ${event.error}`, "mic_off");
    };

    recognition.onend = () => {
      stopVoiceRecognition();
    };

    recognition.start();
  } catch (err) {
    stopVoiceRecognition();
    showToast("Microphone access denied or busy", "mic_off");
  }
}

function stopVoiceRecognition() {
  APP_STATE.isRecordingVoice = false;
  if (elements.voiceInputBtn) elements.voiceInputBtn.classList.remove("listening");
  if (elements.voiceStatusBar) elements.voiceStatusBar.classList.remove("active");
  if (APP_STATE.recognitionInstance) {
    try { APP_STATE.recognitionInstance.stop(); } catch (e) {}
    APP_STATE.recognitionInstance = null;
  }
}

function speakText(text, btnElement) {
  if (!("speechSynthesis" in window)) {
    showToast("Text-to-Speech not supported in this browser", "volume_off");
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (btnElement) btnElement.querySelector("span:last-child").textContent = "Listen";
    return;
  }

  const cleanText = text.replace(/```[\s\S]*?```/g, "Code block omitted.").replace(/[#*`_~]/g, "");
  const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 300));
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  if (btnElement) {
    btnElement.querySelector("span:last-child").textContent = "Stop";
    utterance.onend = () => {
      btnElement.querySelector("span:last-child").textContent = "Listen";
    };
    utterance.onerror = () => {
      btnElement.querySelector("span:last-child").textContent = "Listen";
    };
  }

  window.speechSynthesis.speak(utterance);
}

// ========================================================
// 10. PDF DOCUMENT INTELLIGENCE
// ========================================================
async function handlePdfUpload(file) {
  if (!file || file.type !== "application/pdf") {
    showToast("Please upload a valid PDF document", "warning");
    return;
  }

  showToast(`Parsing PDF: ${file.name}...`, "sync");

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
      }

      APP_STATE.attachedDoc = {
        name: file.name,
        text: fullText.trim().slice(0, 8000), // Cap context window safely
        pages: pdf.numPages
      };

      // Show preview bar
      elements.docNameLabel.textContent = file.name;
      elements.docMetaLabel.textContent = `PDF Extracted • ${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'} (${(file.size / 1024).toFixed(1)} KB)`;
      elements.filePreviewBar.classList.add("active");

      showToast(`Document Ready: ${file.name} (${pdf.numPages} pages)`, "description");
      audioFX.play("receive");
    } catch (err) {
      showToast(`PDF parsing failed: ${err.message}`, "error");
    }
  };
  reader.readAsArrayBuffer(file);
}

function clearAttachedDocument() {
  APP_STATE.attachedDoc = null;
  if (elements.filePreviewBar) {
    elements.filePreviewBar.classList.remove("active");
  }
  if (elements.fileInput) {
    elements.fileInput.value = "";
  }
}

// ========================================================
// 11. AI INFERENCE ENGINE (LIVE NEURAL ENGINE & OPTIONAL GEMINI)
// ========================================================
async function generateAIResponse(userPrompt) {
  APP_STATE.isGenerating = true;
  elements.sendBtn.disabled = true;
  showThinkingIndicator();

  // Combine user prompt with attached PDF document context if present
  let augmentedPrompt = userPrompt;
  if (APP_STATE.attachedDoc) {
    augmentedPrompt = `[ATTACHED PDF DOCUMENT: ${APP_STATE.attachedDoc.name} (${APP_STATE.attachedDoc.pages} pages)]\n"""\n${APP_STATE.attachedDoc.text}\n"""\n\nUser Question/Task:\n${userPrompt}`;
  }

  const systemInstruction = PERSONA_PROMPTS[APP_STATE.persona] || PERSONA_PROMPTS.assistant;
  let botReply = "";

  // 1. Google Gemini API (if user selected Gemini and provided an active API key)
  if (APP_STATE.apiMode === "gemini" && APP_STATE.apiKey.trim()) {
    try {
      const modelName = APP_STATE.model || "gemini-1.5-flash";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${APP_STATE.apiKey.trim()}`;

      const contents = [
        ...APP_STATE.chatHistory.slice(-6).map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        })),
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\n${augmentedPrompt}` }]
        }
      ];

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      const data = await res.json();
      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        botReply = data.candidates[0].content.parts[0].text;
      } else {
        throw new Error(data?.error?.message || `HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to Live Neural Engine:", err);
      showToast("Gemini key issue: automatically using Live AI Engine.", "info");
    }
  }

  // 2. Free Cloud Neural Engine (No API key needed, answers everything like a real chatbot)
  if (!botReply) {
    const messages = [
      { role: "system", content: systemInstruction },
      ...APP_STATE.chatHistory.slice(-8).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      })),
      { role: "user", content: augmentedPrompt }
    ];

    // Try direct client fetch first
    try {
      const directRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });

      if (directRes.ok) {
        const text = await directRes.text();
        if (text && !text.startsWith('{"error":') && text.trim().length > 0) {
          botReply = text.trim();
        }
      }
    } catch (directErr) {
      console.warn("Direct live AI fetch failed, trying local proxy /api/chat:", directErr);
    }

    // If direct fetch was blocked by browser privacy/CORS, use server /api/chat proxy
    if (!botReply) {
      try {
        const proxyRes = await fetch(BACKEND_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages })
        });

        if (proxyRes.ok) {
          const text = await proxyRes.text();
          if (text && !text.startsWith('{"error":') && text.trim().length > 0) {
            botReply = text.trim();
          }
        }
      } catch (proxyErr) {
        console.warn("Local proxy /api/chat fetch failed:", proxyErr);
      }
    }
  }

  // 3. Fallback only if device is completely offline or no network connection
  if (!botReply) {
    if (APP_STATE.attachedDoc && (userPrompt.toLowerCase().includes("text") || userPrompt.toLowerCase().includes("convert"))) {
      botReply = `### 📄 Extracted PDF Content: \`${APP_STATE.attachedDoc.name}\`\n\n${APP_STATE.attachedDoc.text}`;
    } else {
      botReply = `I'm currently unable to reach the AI server. Please check your internet connection and send your message again.`;
    }
  }

  APP_STATE.chatHistory.push({ sender: "bot", text: botReply });
  await streamBotResponse(botReply);

  APP_STATE.isGenerating = false;
  elements.sendBtn.disabled = false;
}

// ========================================================
// 12. EVENT LISTENERS & UI INTERACTIONS
// ========================================================
function setupEventListeners() {
  // Chat form submit
  elements.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = elements.messageInput.value.trim();
    if (!text || APP_STATE.isGenerating) return;

    audioFX.play("send");
    appendMessage("user", text);
    APP_STATE.chatHistory.push({ sender: "user", text });

    elements.messageInput.value = "";
    adjustTextareaHeight();

    generateAIResponse(text);
  });

  // Enter to send, Shift+Enter for newline
  elements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      elements.chatForm.dispatchEvent(new Event("submit"));
    }
  });

  // Auto-expanding textarea
  elements.messageInput.addEventListener("input", adjustTextareaHeight);

  // Reloader button
  elements.reloaderBtn.addEventListener("click", () => {
    triggerAestheticReload();
  });

  // Theme toggle
  elements.themeToggleBtn.addEventListener("click", () => {
    APP_STATE.theme = APP_STATE.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", APP_STATE.theme);
    localStorage.setItem("nova_theme", APP_STATE.theme);
    elements.themeIcon.textContent = APP_STATE.theme === "dark" ? "light_mode" : "dark_mode";
    audioFX.play("click");
    showToast(`Switched to ${APP_STATE.theme} mode`, "palette");
  });

  // Sound FX toggle
  elements.soundToggleBtn.addEventListener("click", () => {
    APP_STATE.soundEnabled = !APP_STATE.soundEnabled;
    localStorage.setItem("nova_sound", APP_STATE.soundEnabled);
    elements.soundToggleBtn.classList.toggle("active", APP_STATE.soundEnabled);
    elements.soundIcon.textContent = APP_STATE.soundEnabled ? "volume_up" : "volume_off";
    audioFX.play("click");
    showToast(`Sound FX ${APP_STATE.soundEnabled ? "Enabled" : "Muted"}`, APP_STATE.soundEnabled ? "volume_up" : "volume_off");
  });

  // View mode switcher (Studio vs Widget)
  elements.viewModeBtn.addEventListener("click", () => {
    APP_STATE.viewMode = APP_STATE.viewMode === "studio" ? "widget" : "studio";
    applyViewMode(APP_STATE.viewMode);
    audioFX.play("click");
  });

  // Export chat
  elements.exportChatBtn.addEventListener("click", exportConversationToMarkdown);

  // Persona select
  elements.personaSelect.addEventListener("change", (e) => {
    APP_STATE.persona = e.target.value;
    audioFX.play("click");
    showToast(`Persona active: ${e.target.options[e.target.selectedIndex].text}`, "psychology");
  });

  // File upload (PDF)
  elements.fileUploadBtn.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handlePdfUpload(file);
  });
  elements.removeFileBtn.addEventListener("click", clearAttachedDocument);

  // Voice input
  elements.voiceInputBtn.addEventListener("click", toggleVoiceInput);
  elements.cancelVoiceBtn.addEventListener("click", stopVoiceRecognition);

  // Emoji picker
  elements.emojiBtn.addEventListener("click", () => {
    document.body.classList.toggle("show-emoji-picker");
    audioFX.play("click");
  });

  if (elements.emojiPicker) {
    elements.emojiPicker.addEventListener("emoji-click", (e) => {
      elements.messageInput.value += e.detail.unicode;
      adjustTextareaHeight();
      audioFX.play("click");
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("emoji-picker") && !e.target.closest("#emoji-btn")) {
      document.body.classList.remove("show-emoji-picker");
    }
  });

  // Floating toggler & close button for widget mode
  elements.chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot");
    audioFX.play("click");
  });

  elements.closeChatbotBtn.addEventListener("click", () => {
    if (APP_STATE.viewMode === "studio") {
      // In studio mode, offer to switch to widget or reload
      APP_STATE.viewMode = "widget";
      applyViewMode("widget");
    } else {
      document.body.classList.remove("show-chatbot");
    }
    audioFX.play("click");
  });

  // Settings Modal
  elements.settingsBtn.addEventListener("click", openSettingsModal);
  elements.closeModalBtn.addEventListener("click", closeSettingsModal);
  elements.cancelSettingsBtn.addEventListener("click", closeSettingsModal);
  elements.saveSettingsBtn.addEventListener("click", saveSettings);
  elements.toggleKeyVisibilityBtn.addEventListener("click", toggleKeyVisibility);
  elements.apiModeSelect.addEventListener("change", updateApiKeyVisibility);

  // Bind starter chips in welcome card
  bindStarterChips();
}

function adjustTextareaHeight() {
  elements.messageInput.style.height = "auto";
  elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 140) + "px";
}

function bindStarterChips() {
  document.querySelectorAll(".starter-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) {
        elements.messageInput.value = prompt;
        adjustTextareaHeight();
        audioFX.play("click");
        elements.chatForm.dispatchEvent(new Event("submit"));
      }
    });
  });
}

function applyViewMode(mode) {
  localStorage.setItem("nova_view_mode", mode);
  if (mode === "studio") {
    document.body.classList.add("studio-mode");
    document.body.classList.add("show-chatbot");
    elements.viewModeIcon.textContent = "fullscreen_exit";
    elements.viewModeBtn.setAttribute("data-tooltip", "Switch to Widget Mode");
    showToast("Full Studio Workspace activated", "aspect_ratio");
  } else {
    document.body.classList.remove("studio-mode");
    elements.viewModeIcon.textContent = "fullscreen";
    elements.viewModeBtn.setAttribute("data-tooltip", "Switch to Studio Workspace");
    showToast("Compact Widget Mode activated", "pip");
  }
}

// ========================================================
// 13. SETTINGS & PERSISTENCE
// ========================================================
function openSettingsModal() {
  audioFX.play("click");
  elements.apiModeSelect.value = (APP_STATE.apiMode === "gemini") ? "gemini" : "live";
  elements.customApiKeyInput.value = APP_STATE.apiKey;
  elements.modelSelect.value = APP_STATE.model;
  updateApiKeyVisibility();
  elements.settingsModal.classList.add("open");
}

function closeSettingsModal() {
  audioFX.play("click");
  elements.settingsModal.classList.remove("open");
}

function updateApiKeyVisibility() {
  const isGemini = elements.apiModeSelect.value === "gemini";
  const group = document.getElementById("api-key-group");
  const modelGroup = document.getElementById("model-group");
  if (group) group.style.display = isGemini ? "flex" : "none";
  if (modelGroup) modelGroup.style.display = isGemini ? "flex" : "none";
}

function toggleKeyVisibility() {
  const isPass = elements.customApiKeyInput.type === "password";
  elements.customApiKeyInput.type = isPass ? "text" : "password";
  elements.eyeIcon.textContent = isPass ? "visibility_off" : "visibility";
}

function saveSettings() {
  APP_STATE.apiMode = elements.apiModeSelect.value;
  APP_STATE.apiKey = elements.customApiKeyInput.value.trim();
  APP_STATE.model = elements.modelSelect.value;

  localStorage.setItem("nova_api_mode", APP_STATE.apiMode);
  localStorage.setItem("nova_api_key", APP_STATE.apiKey);
  localStorage.setItem("nova_model", APP_STATE.model);

  if (elements.activeModeLabel) {
    elements.activeModeLabel.textContent = APP_STATE.apiMode === "gemini" && APP_STATE.apiKey
      ? `Gemini API (${APP_STATE.model})`
      : "Nova Live AI • Ready";
  }

  audioFX.play("receive");
  closeSettingsModal();
  showToast(APP_STATE.apiMode === "gemini" ? "Gemini configuration saved!" : "Live AI Engine active!", "check_circle");
}

// ========================================================
// 14. EXPORT CONVERSATION
// ========================================================
function exportConversationToMarkdown() {
  if (APP_STATE.chatHistory.length === 0) {
    showToast("No conversation to export yet!", "warning");
    return;
  }

  let mdContent = `# Nova AI Conversation Transcript\n`;
  mdContent += `*Exported on: ${new Date().toLocaleString()}*\n`;
  mdContent += `*Persona: ${APP_STATE.persona.toUpperCase()} | Model: ${APP_STATE.model}*\n\n---\n\n`;

  APP_STATE.chatHistory.forEach((msg) => {
    mdContent += `### ${msg.sender === "user" ? "👤 User" : "✨ Nova AI"}\n\n${msg.text}\n\n---\n\n`;
  });

  const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nova-ai-transcript-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);

  audioFX.play("receive");
  showToast("Conversation exported as Markdown file", "download_done");
}

// ========================================================
// 15. INITIALIZATION
// ========================================================
function initApp() {
  // Apply saved theme
  document.documentElement.setAttribute("data-theme", APP_STATE.theme);
  if (elements.themeIcon) {
    elements.themeIcon.textContent = APP_STATE.theme === "dark" ? "light_mode" : "dark_mode";
  }

  // Apply sound toggle state
  if (elements.soundToggleBtn) {
    elements.soundToggleBtn.classList.toggle("active", APP_STATE.soundEnabled);
  }
  if (elements.soundIcon) {
    elements.soundIcon.textContent = APP_STATE.soundEnabled ? "volume_up" : "volume_off";
  }

  // Apply view mode
  applyViewMode(APP_STATE.viewMode);

  // Setup UI event listeners
  setupEventListeners();

  // Run initial preloader sequence
  runPreloaderSequence();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
