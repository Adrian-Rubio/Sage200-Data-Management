import re
import os

path = r"frontend/src/pages/DubesDashboard.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace extreme text sizes with standard tailwind sizes
content = re.sub(r'text-\[8px\]|text-\[9px\]|text-\[10px\]', 'text-xs', content)
content = re.sub(r'text-\[11px\]', 'text-sm', content)

# Replace extreme letter spacing
content = re.sub(r'tracking-\[0\.[2-4]em\]', 'tracking-wider', content)
content = re.sub(r'tracking-widest', 'tracking-wider', content)

# Replace low contrast colors
content = re.sub(r'text-white/20|text-white/30|text-white/40', 'text-slate-400', content)
content = re.sub(r'text-white/50|text-white/60', 'text-slate-300', content)
content = re.sub(r'text-white/80|text-white/90', 'text-slate-200', content)

# Replace glass-card and premium-gradient
content = re.sub(r'\bglass-card\b', 'bg-[#172035]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl', content)
content = re.sub(r'\bpremium-gradient\b', 'bg-[#0b0f1a] text-slate-200', content)
content = re.sub(r'\bpremium-button\b', 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg px-4 py-2 rounded-xl transition-all', content)

# Colors translation
content = re.sub(r'\btext-primary\b', 'text-indigo-400', content)
content = re.sub(r'\bbg-primary/10\b', 'bg-indigo-500/20 border border-indigo-500/30', content)
content = re.sub(r'\bbg-primary/20\b', 'bg-indigo-500/30', content)
content = re.sub(r'\bbg-primary\b', 'bg-indigo-600', content)
content = re.sub(r'\bborder-primary/20\b', 'border-indigo-500/30', content)
content = re.sub(r'\bshadow-primary/20\b', 'shadow-indigo-500/20', content)

# Recharts custom colors
content = re.sub(r'hsl\(0,\s*84\.2%,\s*60\.2%\)', '#6366f1', content) # indigo-500 for charts instead of red
content = re.sub(r'from-primary to-accent', 'from-indigo-500 to-fuchsia-500', content)
content = re.sub(r'text-emerald-400', 'text-emerald-400', content) # emerald is fine
content = re.sub(r'text-rose-400', 'text-rose-400', content) # rose is fine

# Massive padding adjustments
content = re.sub(r'\bp-10\b', 'p-6', content)
content = re.sub(r'\bp-8\b', 'p-6', content)
content = re.sub(r'\bh-20\b', 'h-16', content)

# Remove explicit font family Inter if applied globally, or let it be
content = re.sub(r"font-\['Inter'\]", "", content)

# White/5 to white/10 for slightly more visible borders
content = re.sub(r'border-white/5', 'border-white/10', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Transformaciones completadas con éxito.")
