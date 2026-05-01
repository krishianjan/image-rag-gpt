import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-white font-semibold text-lg">IMAGE-OCR-GPT</span>
            </div>
            <p className="text-sm mb-6">Document intelligence without limits.</p>
            <div className="flex items-center gap-3">
              <a href="https://github.com" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Document Extraction</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Chat Agent</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Schema Builder</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Solutions</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Healthcare</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Legal Teams</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Finance & Accounting</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>

              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="mailto:team@image-ocr-gpt.ai" className="hover:text-white transition-colors">team@image-ocr-gpt.ai</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© 2026 IMAGE-OCR-GPT, Inc. All rights reserved.</p>
          <p className="text-slate-500">Built with FastAPI · PostgreSQL · Groq · Docling · redis  celery </p>
        </div>
      </div>
    </footer>
  );
}
