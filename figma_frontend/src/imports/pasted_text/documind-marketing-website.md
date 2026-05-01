Design a complete B2B SaaS marketing website for "DocuMind" — 
an AI document intelligence platform. Modern, clean, enterprise-grade.
Let Figma choose the color system — recommended direction: 
cool slate/indigo with warm amber accents. NOT dark/gamer. 
Think Linear.app, Vercel, Stripe, Resend.ai aesthetic.
Full desktop (1440px) + mobile (390px) frames for every section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM (Figma to define exact shades)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Direction: Clean white base, deep slate for text, 
indigo-600 as primary accent, amber-500 as highlight,
emerald-500 for success states, rose-500 for errors.
Cards: white bg, slate-100 border, soft drop shadow.
Dark mode variant: slate-950 bg, slate-100 text.
Font: Inter for everything. 
  Display: 72px/700weight
  H1: 56px/700
  H2: 40px/600
  H3: 28px/600
  Body: 16px/400
  Small: 14px/400
  Mono: JetBrains Mono for code blocks
Border radius: 12px cards, 8px inputs, 999px pills/badges
Spacing system: 8px base unit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAVBAR (sticky, 72px height)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background: white/95 with backdrop blur, bottom border slate-100.
Scrolled state: shadow-sm appears.

Left: Logo mark (abstract hexagon or "D" lettermark in indigo) 
      + "DocuMind" in Inter 600.

Center: Navigation links with dropdown chevrons
  "Product ▾" dropdown panel (mega menu):
    Left col — Core Features:
      📄 Document Extraction
      🤖 AI Chat Agent  
      🔍 Semantic Search
      📊 Schema Builder
    Right col — AI Models:
      Groq LLaMA 3.1
      Gemini 1.5 Flash
      Qwen 2.5 VL
      Mistral 7B
      "Multi-model fallback — always online"
  
  "Solutions ▾" dropdown:
    🏥 Healthcare · ⚖️ Legal · 💰 Finance
    🎓 Education · 💻 Developers · 🏢 Enterprise
  
  "Pricing" direct link
  "Docs" direct link

Right:
  GitHub button: GitHub icon + "Star on GitHub" + star count badge
    → links to your GitHub repo
    Style: slate border, slate text, hover: fill slate-900
  "Sign In" ghost button
  "Start Free →" filled indigo button, white text

Mobile nav: hamburger → slide-down drawer, full links stacked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — HERO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Height: 100vh. White background.
Subtle background: very light indigo/slate grid pattern 
(CSS, 1px lines, 48px gap, opacity 4%) behind content.
Center-right: abstract blob/gradient in indigo-100 + amber-50, 
blurred 80px, opacity 40%. Decorative only.

TOP CENTER: Announcement pill badge
  Indigo-50 bg, indigo-600 border, indigo-700 text:
  "✨ Now with Qwen 2.5 VL + Gemini 1.5 → Read the update →"
  Hover: bg-indigo-100. Arrow icon right.

H1 (centered, max-width 800px):
  "Every Document."    ← slate-900
  "Structured."        ← indigo-600 (color break, same line or below)
  "Instantly."         ← slate-900
  
  Animation note: Each word slides up from translateY 40px 
  with stagger 80ms, opacity 0→1.

Subtext (Inter 20px, slate-500, max-w-600px, centered):
  "DocuMind extracts structured JSON from any PDF, image, or scan —
  with AI chat, RAG search, and zero hallucinations. 
  Used by healthcare teams, lawyers, developers, and students."

CTA row (centered, gap 12px):
  Primary: "Try Free — No Card →"
    indigo-600 bg, white text, 48px height, rounded-lg
    Hover: indigo-700 + slight scale 1.02
    → scrolls to #demo section
  Secondary: "View API Docs"  
    white bg, slate-300 border, slate-700 text
    Hover: bg-slate-50
    → links to /docs

Trust row below CTAs (slate-400 text, 14px):
  "✓ 50 docs free · ✓ No credit card · ✓ Live in 10 minutes"

HERO VISUAL (below CTAs, full width):
  Rounded-2xl container, slate-100 border, shadow-xl.
  Shows a 3-panel mockup screenshot of the actual app:
  - Left panel: PDF viewer showing an invoice
  - Center panel: Extracted JSON with syntax highlight
    { "vendor": "Acme Corp", "total": "$4,250.00",
      "_confidence": { "vendor": 0.98, "total": 0.99 } }
  - Right panel: AI chat showing Q&A about the document
  
  Above the mockup container: 3 small indicator pills floating:
    "⚡ Processing..." (amber, animated pulse)
    "✓ Schema Valid" (emerald)
    "🔒 Grounded" (indigo)
  
  Design this as a realistic UI mockup, not wireframe.
  Subtle reflection/gradient below the container fading to white.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — SOCIAL PROOF TICKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Height: 64px. slate-50 bg. border-y slate-100.
Two-row infinite marquee (top row scrolls left, bottom right):

Row 1 — Company logos (gray, desaturated):
  HealthTech Co · LegalAI · InvoiceBot · EduTech · 
  MedParse · ContractOS · DataExtract · DocuFlow ·
  (Use placeholder wordmarks in slate-300/400, 
   hover: slate-600 — mimics real logo wall)

Row 2 — Stats ticker:
  "📄 10K docs processed today"  
  "✓ 99.6% schema accuracy"  
  "⚡ <30s avg processing time"  
  "🌍 500+ teams using DocuMind"  
  "🤖 5 AI models, zero downtime"  
  "💰 $2.4M saved in manual entry"
  Slate-500 text, 14px. Separated by · in indigo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — THE PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
White bg. Padding 120px vertical.

Label pill: "The Problem" — rose-50 bg, rose-600 text
H2: "The World Runs on Documents."
Sub: "And wastes billions of hours processing them manually."
Both centered.

4 cards in 2x2 grid (max-width 1000px, centered):
Each card is CSS flip card (3D flip on hover, 600ms):

CARD FRONT:
  White bg, slate-100 border, shadow-sm, rounded-2xl.
  Top: large emoji icon (64px)
  Large rose-600 stat (Inter 700, 48px)
  Pain description in slate-600, 15px, 3-4 lines
  Small "Hover to see solution →" label, slate-400, 12px

CARD BACK:
  Indigo-50 bg, indigo-200 border.
  "DocuMind fixes this:" label in indigo-600, bold, 12px
  Solution text in slate-800, 15px
  "→ Try it now" link in indigo-600

Card 1: 🏥 "3 Hours" — Doctor, 40 prescriptions, manual entry
Card 2: ⚖️ "$800" — Founder, 200-page contract, 3 days lawyer
Card 3: 💻 "$160" — Developer, GPT-4V image tokens, textbook
Card 4: 🧾 "$180K/yr" — Startup, 3 ops staff, 50K invoices

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — INTERACTIVE DEMO (id="demo")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Slate-950 bg (dark section for contrast). Padding 120px.
Label pill: "Live Demo" — indigo bg, white text
H2 (white): "See It Process Your Document"
Sub (slate-400): "Drop any file. Watch DocuMind think."

UPLOAD ZONE (centered, max-width 680px):
  Dashed border-2 indigo-400/50, rounded-2xl, 240px height.
  White/5 bg (glassmorphism on dark bg).
  
  Center content stacked:
    Cloud upload icon (48px, indigo-400, animated bounce)
    "Drop your PDF, image, or scan here"
      (white text, 18px Inter 500)
    "or choose source:" (slate-400, 14px)
    
    Source button row (5 buttons, icon + label):
    [💻 Computer] [☁️ Google Drive] [📦 Dropbox] 
    [🔗 URL] [📂 GitHub Repo]
    Style: slate-800 bg, slate-600 border, slate-300 text
    * Drive/Dropbox/URL/GitHub show "Coming Soon" tooltip on hover
    * Computer triggers actual file input
    
    Supported formats pill row:
    PDF · DOCX · PNG · JPG · TIFF · WEBP
    Each: slate-700 bg, slate-400 text, small pill

  Drag-over state (design this state):
    Solid indigo border, indigo/10 bg fill
    "Release to extract! ⚡" centered, indigo-300 text

PROCESSING STATE (design as separate frame):
  Same container, now shows:
  Left 50%: Document thumbnail (gray placeholder) with 
    thin indigo horizontal laser sweep animation overlay
  Right 50%: Neural progress log — monospace lines appearing:
    "⬡ Initializing pipeline..."
    "📄 Detecting document type..."  
    "🔍 Running Docling parser..."
    "📐 Extracting bounding boxes..."
    "🌳 Building RAPTOR tree..."
    "🤖 Groq LLaMA extracting schema..."
    "✅ Pydantic validation passed..."
    "🎉 Ready!"
  Progress bar bottom: indigo fill, 0→100%, glow effect

RESULT STATE (design as third frame):
  Full width 3-column layout, white bg cards on dark:
  Col 1 (40%): PDF viewer mockup with page controls
  Col 2 (35%): Summary + Key Points cards stacked
  Col 3 (25%): AI chat interface with streaming response

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — USE CASES (100 total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
White bg. Label: "Use Cases"
H2: "One Platform. Every Industry."
Sub: "100+ ways teams use DocuMind daily."

5 vertical tabs left (280px), content right:
Tabs: 🏥 Healthcare · ⚖️ Legal · 💰 Finance · 
      🎓 Education · 💻 Developers

Each tab shows 6 use cases initially as icon+text chips 
in a 3x2 grid. Below: "Show all 20 →" button (indigo ghost).

Expanding state: grid extends to show all 20 use cases.
"Show less ↑" to collapse. Smooth height animation.

CHIP DESIGN: white bg, slate-100 border, rounded-lg, 
12px padding. Emoji icon left (24px), text right.
Hover: indigo-50 bg, indigo-300 border.

Healthcare 20 uses with emojis:
💊 Prescription drug extraction
🏥 Patient intake digitization  
📋 Insurance claim processing
🧪 Lab report parsing
📝 Medical history summary
🚑 Discharge note extraction
💉 Prior auth document processing
🔒 HIPAA-compliant retrieval
👩‍⚕️ Nurse shift handoff notes
💊 Clinical trial consent parsing
☢️ Radiology report keywords
💳 Medicare billing code extraction
📊 EHR data migration
🩺 Symptom extraction from notes
💊 Drug interaction PDF parsing
📁 Medical record digitization
🏨 Hospital invoice reconciliation
📈 Patient outcome report analysis
🔬 Research trial document triage
📜 Medical license verification

Legal 20 (⚖️🏛️📜🔍📝💼🤝📋🗂️🔐💰⚡🏢📊🔑🎯📌✅❌🔒):
Contract clause extraction, NDA comparison, Court filings,
Settlement parsing, IP licensing, Due diligence, Employment 
agreements, Lease terms, Patent claims, Compliance docs,
Regulatory filings, Board resolutions, M&A documents,
Arbitration records, Corporate bylaws, Legal invoices,
Trademark filings, Court order parsing, Subpoena processing,
Partnership agreements

Finance 20 (💰💳🧾📊📈💵🏦📉🔢💹💲🏷️🪙📋📌💼🔍✅📁🎯):
Invoice line extraction, Receipt OCR, Tax doc parsing,
Bank statement transactions, Purchase orders, Audit trails,
Financial reports, Loan applications, Insurance policies,
Payroll docs, P&L extraction, Expense reports,
Vendor contracts, Cap table docs, Wire transfer records,
Crypto transaction statements, Investment memos,
Quarterly earnings, Budget proposals, Grant applications

Education 20 (🎓📚📖✏️🏫📝🔬🧪🧬💡📊🗂️📋📌📐🖊️🎯✅🔍💻):
Homework Q&A, Textbook search, Lecture slides,
Research papers, Exam prep, Thesis search,
Syllabus parsing, Assignment rubrics, Study flashcards,
Citation extraction, Bibliography parsing, Case studies,
Academic transcripts, Scholarship applications,
Course material indexing, Lab reports, Dissertation analysis,
Conference paper triage, Grant proposals, Curriculum docs

Developers 20 (💻⚡🔌🛠️🔑📦🔧🌐🚀📊🔍💾🤖🔐📡🧩🔄✅🏗️🎯):
Stop GPT-4V image token burn, PDF→JSON pipeline,
Schema registry, Webhook delivery, Batch processing,
Multi-tenant API, RAG-ready chunks, OpenAPI docs,
SDK integration, RAPTOR retrieval, Custom schemas,
Async job queue, Presigned URL delivery, SSE streaming,
Celery worker scaling, pgvector search, BM25 hybrid,
Confidence scoring, Grounding validation, Rate limiting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Slate-50 bg. Centered.
H2: "From Chaos to Structure in 4 Steps."

4 steps horizontal, connected by dashed indigo line:
Each step card: white bg, slate-100 border, rounded-2xl,
indigo numbered circle top (1/2/3/4), shadow-sm.

Step 1 — INGEST
  Icon: cloud-upload (indigo)
  "Feed Any Document"
  PDF · DOCX · Images · Handwriting
  Tech badges: "Docling" "Celery" "async"

Step 2 — PARSE
  Icon: scan (indigo)
  "Layout-Aware Parsing"
  Bounding boxes · Tables · TOON objects
  Tech badges: "pgvector" "spaCy" "MiniLM"

Step 3 — EXTRACT
  Icon: cpu (indigo)  
  "Schema-Driven Extraction"
  Groq + Gemini + Qwen + Mistral
  Tech badges: "Instructor" "Pydantic" "Groq"

Step 4 — INTEGRATE
  Icon: zap (indigo)
  "Pipe Anywhere"
  JSON · Markdown · Webhooks · SSE
  Tech badges: "REST API" "RAPTOR" "BM25+Dense"

Connecting line between cards: dashed indigo, 
chevron arrow at each joint.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — AI MODELS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
White bg.
Label: "Multi-Model Intelligence"
H2: "5 AI Models. Zero Downtime."
Sub: "When one model hits its limit, the next takes over 
     automatically. Your pipeline never stops."

6 model cards in 3x2 grid:
Each card: white bg, slate-100 border, rounded-xl,
logo placeholder + model name + use case + "Free tier" badge.

Groq LLaMA 3.1 70B — "Agent chat, extraction" — indigo badge "Primary"
Gemini 1.5 Flash — "OCR, summarization" — green badge "1M tokens/day"
Qwen 2.5 VL — "Handwriting OCR, vision" — amber badge "Vision"
Mistral 7B — "Classification, fast parse" — purple badge "Fast"
Cohere Command R — "RAG, reranking" — blue badge "Retrieval"
DeepSeek V3 — "Fallback extraction" — slate badge "Fallback"

Below grid: indigo info bar:
"⚡ Automatic failover — if Groq rate limits, 
  Gemini picks up instantly. 99.9% uptime."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Indigo-950 bg (dark, full bleed). White text.
H2 (white): "Numbers That Don't Lie."

6 metric boxes in 3x2 grid:
Each: dark card, indigo/20 border, rounded-2xl.
Large number: Inter 700, 64px, indigo-300
Label: slate-400, 14px

  "99.6%"   Schema validation accuracy
  "< 30s"   Avg processing time  
  "900×"    Faster than manual search
  "$0.003"  Per doc vs $800 manual review
  "10M+"    Chunks at <50ms retrieval
  "0"       Hallucinations (bbox grounded)

Count-up animation note: numbers animate from 0 on scroll enter.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — TESTIMONIALS + LIVE REVIEWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
White bg. Padding 120px.
H2: "Real Teams. Real Results."
Sub: "Drop your review — it appears instantly."

TOP: Infinite horizontal scroll ticker (2 rows):
Row 1 scrolls LEFT, Row 2 scrolls RIGHT. Speed: 35s loop.

TESTIMONIAL CARD DESIGN (each, 320px wide):
  White bg, slate-100 border, rounded-2xl, shadow-sm.
  Top row: 5 ★★★★★ stars in amber-400 + date right (slate-400)
  Quote text: slate-700, 14px, italic, 3-4 lines
  Bottom: User avatar circle (initials, indigo bg) + 
          Name (slate-900, 500 weight) + 
          Role · Company (slate-500, 14px)

8 testimonials for ticker (use the ones from previous prompt).

LIVE REVIEW SUBMISSION (below ticker):
  Centered card, max-width 560px, white bg, 
  slate-100 border, rounded-2xl, shadow-md, padding 40px.
  
  Label: "📝 Share Your Experience"
  Subtext: "Appears in the ticker above in real-time."
  
  POLISHED USER CARD FORM:
  
  Row 1: Two inputs side by side:
    Name* (placeholder: "Your name")
    Role* (placeholder: "ML Engineer · Startup")
  
  Star Rating row:
    "Your rating:" label left
    5 clickable stars right, amber on hover/select
    Stars are large (32px), interactive fill effect
  
  Review textarea (4 rows):
    placeholder: "What problem did DocuMind solve for you?"
    Character counter bottom-right: "0 / 500"
    Focus: indigo border-2
  
  Submit button: full width, indigo-600 bg, white text,
    "Publish Review →" label, rounded-lg, 48px height
    Loading state: spinner + "Publishing..."
    Success: green checkmark + "✓ Review live!"
  
  Privacy note below: "🔒 Name and role only. No email required."
  
  SUBMITTED REVIEW CARD (appears at start of ticker):
    Animate in from top with slide+fade
    Identical design to ticker cards above
    "🆕 Just posted" amber badge top-right corner

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — PRICING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Slate-50 bg.
H2: "Simple Pricing. No Surprises."
Annual/Monthly toggle pill above (switch, "Save 20% yearly").

3 pricing cards (3-column):
Middle card elevated: scale 1.04, indigo border-2, 
"Most Popular" badge indigo top-right.

FREE — $0/mo
  50 documents/month
  All file types
  AI Chat: 100 msgs/mo
  3 AI models (Groq, Gemini, Mistral)
  JSON + Markdown output
  Community support
  [Get Started Free] — indigo ghost button

PRO — $29/mo (most popular, elevated)
  2,000 documents/month
  Custom JSON schema registry
  Webhook delivery
  All 5 AI models with auto-failover
  RAPTOR retrieval
  Priority queue
  Email support
  [Start Pro Trial] — solid indigo button, white text

ENTERPRISE — Custom
  Unlimited documents
  Dedicated worker cluster
  Custom model fine-tuning
  SOC2-ready audit logs
  SLA + uptime guarantee
  White-label option
  Slack + phone support
  [Talk to Sales] — slate button

Beneath cards: "🔒 Stripe-secured · Cancel anytime · 
GDPR compliant · Data never used to train models"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — DEVELOPER + GITHUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Slate-950 bg. White text.
H2 (white): "Built API-First. Open Source Friendly."

Left column (55%): Code block tabs (Python / cURL / Node.js)
Dark code editor mockup, rounded-2xl, slate-900 bg,
colored syntax: keys=slate-300, strings=indigo-300,
numbers=emerald-400, keywords=amber-400.
JetBrains Mono 14px. Line numbers left in slate-600.
"Copy" button top-right of code block.

Python tab content:
import documind
client = documind.Client(api_key="dm_sk_xxxx")

result = client.extract(
  file="prescription.pdf",
  schema={
    "patient_name": "string",
    "drug_name": "string", 
    "dosage": "string",
    "doctor": "string"
  }
)
# → Groq→Gemini→Qwen auto-failover
print(result.json)

Right column (45%):
  GITHUB CARD (prominent):
    GitHub icon (white) + "Star DocuMind on GitHub"
    Star count: ★ 1.2k (placeholder badge)
    Fork count: ⑂ 340
    [⭐ Star] button — slate-700 bg, white text
    [⑂ Fork] button — slate-700 bg, white text
    "Open source · MIT license · PRs welcome"
    
    Last commit badge: "🟢 Updated 2 days ago"
    Language badges: Python 68% · TypeScript 32%

  Feature checklist below GitHub card:
    ✓ REST API with full OpenAPI docs
    ✓ Multi-model auto-failover (5 models)
    ✓ Webhook + SSE streaming  
    ✓ Custom JSON schema registry
    ✓ RAPTOR hierarchical retrieval
    ✓ Multi-tenant, SOC2-ready
    ✓ Docker compose — 1 command setup
    ✓ Groq · Gemini · Qwen · Mistral · Cohere

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — FINAL CTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
White bg. Centered. Generous padding 160px.
Subtle indigo radial gradient behind content (very light).

H2 (56px, slate-900):
  "Start extracting in 5 minutes."
Sub (slate-500):
  "No credit card. No setup headaches. 50 free documents."

Two CTAs:
  "Try Free Now →" — solid indigo, white text, large
  "Book a Demo" — slate border ghost button

Micro line below: "✓ Free forever plan · ✓ Upgrade anytime · 
✓ Your data stays yours"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOOTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Slate-950 bg. 4-column layout.

Col 1: Logo + "Document intelligence without limits." 
        (slate-400, 14px)
        Social icons row: GitHub · Twitter/X · LinkedIn
        (slate-400, hover: white)

Col 2 — Product:
  Document Extraction
  AI Chat Agent
  Schema Builder  
  API Reference
  Changelog

Col 3 — Solutions:
  Healthcare
  Legal Teams
  Finance & Accounting
  Education
  Developers

Col 4 — Company:
  About
  Blog
  Careers
  Privacy Policy
  Terms of Service
  team@documind.ai

Bottom bar (slate-800 border-top):
  Left: "© 2026 DocuMind, Inc. All rights reserved."
  Right: "Built with FastAPI · PostgreSQL · Groq · Docling · pgvector"
  Both: slate-500, 13px.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API VARIABLE NAMES (exact, for dev handoff)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const API_BASE = process.env.NEXT_PUBLIC_API_URL 
                 || "http://localhost:8000"

Endpoints wired to backend:
POST   {API_BASE}/v1/upload              → upload doc
GET    {API_BASE}/v1/documents/{doc_id}/status    → poll status
GET    {API_BASE}/v1/documents/{doc_id}/metadata  → get results
GET    {API_BASE}/v1/documents/{doc_id}/file      → presigned URL
GET    {API_BASE}/v1/agent/extraction/{doc_id}    → summary+findings
POST   {API_BASE}/v1/agent/chat          → SSE stream
POST   {API_BASE}/v1/auth/tenants        → create account
POST   {API_BASE}/v1/auth/token          → get JWT
POST   {API_BASE}/v1/reviews             → submit review (add later)

Backend response field names (use exactly):
doc_id · job_id · status · doc_type · page_count · word_count
keyword_freq · entity_map · structured_json · presigned_url
summary · key_findings · key_points · ignore_points
extracted_json · confidence_scores · grounding_map

Status enum values (for badge colors):
PENDING=gray · PROCESSING=blue · PARSED=yellow
EMBEDDING=purple · EXTRACTING=orange · READY=green · FAILED=red

SSE event types from /v1/agent/chat:
{ type: "sources", sources: [{page, bbox}] }
{ type: "token", token: "..." }  
{ type: "done", full_text: "..." }