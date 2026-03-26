import re

with open('voting-site.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add framer-motion and CLASS_PHOTOS
if "import { motion, AnimatePresence } from \"framer-motion\";" not in content:
    content = content.replace('import { useState, useEffect } from "react";', 
                              'import { useState, useEffect } from "react";\nimport { motion, AnimatePresence } from "framer-motion";')

if "CLASS_PHOTOS" not in content:
    content = content.replace('const CATEGORIES = [', 
                              'const CLASS_PHOTOS = ["/cp1.jpeg", "/cp2.jpeg", "/cp3.jpeg", "/cp4.jpeg", "/cp5.jpeg", "/cp6.jpeg", "/cp7.jpeg"];\n\nconst CATEGORIES = [')

# Add direction state
if "const [direction, setDirection] = useState(0);" not in content:
    content = content.replace('const [voteIdx, setVoteIdx]         = useState(0);', 
                              'const [voteIdx, setVoteIdx]         = useState(0);\n  const [direction, setDirection]     = useState(0);')

# Update handleVoteNext
old_nav = """  const handleVoteNext = (choice) => {
    const cat = CATEGORIES[voteIdx];
    const newVotes = { ...votes };
    if (choice) newVotes[cat.id] = choice;
    setVotes(newVotes);
    if (voteIdx < CATEGORIES.length - 1) setVoteIdx(voteIdx + 1);
    else submitVotes(newVotes);
  };"""
new_nav = """  const handleVoteNext = (choice) => {
    const cat = CATEGORIES[voteIdx];
    const newVotes = { ...votes };
    if (choice) newVotes[cat.id] = choice;
    setVotes(newVotes);
    setDirection(1);
    if (voteIdx < CATEGORIES.length - 1) setVoteIdx(voteIdx + 1);
    else submitVotes(newVotes);
  };"""
content = content.replace(old_nav, new_nav)

content = content.replace('setVoteIdx(voteIdx - 1)', 'setDirection(-1); setVoteIdx(voteIdx - 1)')

# Replace the voting screen render block
start_str = '''    return (
      <Shell><style>{css}</style>
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>
            <span>{voteIdx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>'''

end_str = '''        </div>
      </Shell>
    );'''

new_render = """    const circleVariants = {
      enter: (dir) => ({ rotate: dir > 0 ? 45 : -45, opacity: 0, transformOrigin: "center 800px" }),
      center: { rotate: 0, opacity: 1, transformOrigin: "center 800px", transition: { type: "spring", bounce: 0.3, duration: 0.8 } },
      exit: (dir) => ({ rotate: dir < 0 ? 45 : -45, opacity: 0, transformOrigin: "center 800px", transition: { duration: 0.3 } })
    };

    return (
      <Shell hideLeftPanel={true}>
        <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, zIndex: 100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 6, fontWeight: 600 }}>
            <span>{voteIdx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: 480, height: 600, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={voteIdx}
              custom={direction}
              variants={circleVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ position: "absolute", width: "100%" }}
            >
              <div className="card" style={{ width: "100%", textAlign: "center" }}>"""

start_idx = content.find(start_str)
if start_idx != -1:
    inner_start = start_idx + len(start_str)
    inner_end = content.find(end_str, start_idx)
    inner_content = content[inner_start:inner_end]
    
    final_replacement = new_render + inner_content + '        </div>\n            </motion.div>\n          </AnimatePresence>\n        </div>\n      </Shell>\n    );'
    
    content = content[:start_idx] + final_replacement + content[inner_end + len(end_str):]


# Make Shells in other screens also hide left panel if we want to
content = content.replace('<Shell><style>{css}</style>\n      <div className="card fade-in"', '<Shell>\n      <div className="card fade-in"')
content = content.replace('<Shell><style>{css}</style>\n        <div style={{ maxWidth: 560', '<Shell hideLeftPanel={true}>\n        <div style={{ maxWidth: 560')
content = content.replace('<Shell><style>{css}</style>\n      <div style={{ maxWidth: 540', '<Shell hideLeftPanel={true}>\n      <div style={{ maxWidth: 540')

# Extract new Shell from nomination-site.jsx
with open('nomination-site.jsx', 'r', encoding='utf-8') as f:
    nom_content = f.read()
    
new_shell = nom_content[nom_content.find('/* ─── SHELL ─── */'):]

# Replace old Shell in voting-site.jsx
old_shell_start = content.find('/* ─── SHELL ─── */')
if old_shell_start != -1:
    content = content[:old_shell_start] + new_shell

with open('voting-site.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
