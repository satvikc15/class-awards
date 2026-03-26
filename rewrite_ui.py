import re

def update_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Common modifications
    if "import { motion, AnimatePresence } from \"framer-motion\";" not in content:
        content = content.replace('import { useState, useEffect } from "react";', 
                                  'import { useState, useEffect } from "react";\nimport { motion, AnimatePresence } from "framer-motion";')
    
    if "CLASS_PHOTOS" not in content:
        content = content.replace('const CATEGORIES = [', 
                                  'const CLASS_PHOTOS = ["cp1.jpeg", "cp2.jpeg", "cp3.jpeg", "cp4.jpeg", "cp5.jpeg", "cp6.jpeg", "cp7.jpeg"];\n\nconst CATEGORIES = [')

    # Add direction state and navigate
    if filename == "nomination-site.jsx":
        if "const [direction, setDirection] = useState(0);" not in content:
            content = content.replace('const [idx, setIdx] = useState(0);', 'const [idx, setIdx] = useState(0);\n  const [direction, setDirection] = useState(0);')
            
            nav_func = """  const navigate = (dir) => {
    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < CATEGORIES.length) {
      setInp("");
      setIdx(nextIdx);
    } else if (dir === 1) {
      setScreen("review");
    }
  };"""
            new_nav_func = """  const navigate = (dir) => {
    const nextIdx = idx + dir;
    setDirection(dir);
    if (nextIdx >= 0 && nextIdx < CATEGORIES.length) {
      setInp("");
      setIdx(nextIdx);
    } else if (dir === 1) {
      setScreen("review");
    }
  };"""
            content = content.replace(nav_func, new_nav_func)
            
            # Replace the render block
            render_start = content.find('    return (\n      <Shell>\n        <style>{css}</style>\n        {/* Progress */}')
            if render_start != -1:
                render_end = content.find('      </Shell>\n    );', render_start) + len('      </Shell>\n    );')
                if render_end > len('      </Shell>\n    );'):
                    old_render = content[render_start:render_end]
                    
                    new_render = """    const circleVariants = {
      enter: (dir) => ({ rotate: dir > 0 ? 90 : -90, opacity: 0, scale: 0.8 }),
      center: { rotate: 0, opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.4, duration: 0.8 } },
      exit: (dir) => ({ rotate: dir < 0 ? 90 : -90, opacity: 0, scale: 0.8, transition: { duration: 0.3 } })
    };

    return (
      <Shell>
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 16, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 6, fontWeight: 500 }}>
            <span>{idx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: 500, height: 600, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={idx}
              custom={direction}
              variants={circleVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ position: "absolute", width: "100%", transformOrigin: "center 800px" }}
            >""" + old_render.replace('      <Shell>\n        <style>{css}</style>\n        {/* Progress */}\n        <div style={{ width: "100%", maxWidth: 480, marginBottom: 16 }}>\n          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 6 }}>\n            <span>{idx + 1} / {CATEGORIES.length}</span>\n            <span>{pct}% done</span>\n          </div>\n          <div className="bar-track"><div className="bar-fill" style={{ width: \`${pct}%\` }} /></div>\n        </div>\n\n        <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>', '          <div className="card" style={{ width: "100%", textAlign: "center" }}>').replace('        </div>\n      </Shell>\n    );', '          </div>\n            </motion.div>\n          </AnimatePresence>\n        </div>\n      </Shell>\n    );')
                    
                    content = content[:render_start] + new_render + content[render_end:]

    if filename == "voting-site.jsx":
        if "const [direction, setDirection] = useState(0);" not in content:
            content = content.replace('const [voteIdx, setVoteIdx]         = useState(0);', 'const [voteIdx, setVoteIdx]         = useState(0);\n  const [direction, setDirection]     = useState(0);')
            
            nav_func = """  const handleVoteNext = (choice) => {
    const cat = CATEGORIES[voteIdx];
    const newVotes = { ...votes };
    if (choice) newVotes[cat.id] = choice;
    setVotes(newVotes);
    if (voteIdx < CATEGORIES.length - 1) setVoteIdx(voteIdx + 1);
    else submitVotes(newVotes);
  };"""
            new_nav_func = """  const handleVoteNext = (choice) => {
    const cat = CATEGORIES[voteIdx];
    const newVotes = { ...votes };
    if (choice) newVotes[cat.id] = choice;
    setVotes(newVotes);
    setDirection(1);
    if (voteIdx < CATEGORIES.length - 1) setVoteIdx(voteIdx + 1);
    else submitVotes(newVotes);
  };"""
            content = content.replace(nav_func, new_nav_func)
            content = content.replace('setVoteIdx(voteIdx - 1)', 'setDirection(-1); setVoteIdx(voteIdx - 1)')
            
            render_start = content.find('    return (\n      <Shell><style>{css}</style>\n        <div style={{ width: "100%", maxWidth: 480, marginBottom: 14 }}>')
            if render_start != -1:
                render_end = content.find('        </div>\n      </Shell>\n    );', render_start) + len('        </div>\n      </Shell>\n    );')
                if render_end > len('        </div>\n      </Shell>\n    );'):
                    old_render = content[render_start:render_end]
                    new_render = """    const circleVariants = {
      enter: (dir) => ({ rotate: dir > 0 ? 90 : -90, opacity: 0, scale: 0.8 }),
      center: { rotate: 0, opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.4, duration: 0.8 } },
      exit: (dir) => ({ rotate: dir < 0 ? 90 : -90, opacity: 0, scale: 0.8, transition: { duration: 0.3 } })
    };

    return (
      <Shell>
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 16, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 6, fontWeight: 500 }}>
            <span>{voteIdx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: 500, height: 600, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={voteIdx}
              custom={direction}
              variants={circleVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ position: "absolute", width: "100%", transformOrigin: "center 800px" }}
            >""" + old_render.replace('      <Shell><style>{css}</style>\n        <div style={{ width: "100%", maxWidth: 480, marginBottom: 14 }}>\n          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>\n            <span>{voteIdx + 1} / {CATEGORIES.length}</span>\n            <span>{pct}% done</span>\n          </div>\n          <div className="bar-track"><div className="bar-fill" style={{ width: \`${pct}%\` }} /></div>\n        </div>\n\n        <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>', '          <div className="card" style={{ width: "100%", textAlign: "center" }}>').replace('        </div>\n      </Shell>\n    );', '          </div>\n            </motion.div>\n          </AnimatePresence>\n        </div>\n      </Shell>\n    );')
                    
                    content = content[:render_start] + new_render + content[render_end:]

    # Replace Shell component
    shell_start = content.find('/* ─── SHELL ─── */')
    if shell_start != -1:
        new_shell = """/* ─── SHELL ─── */
function Shell({ children }) {
  return (
    <div className="app-container">
      <style>{css}</style>
      <div className="left-panel">
        <div className="masonry-wrapper">
          <div className="masonry-col col-left">
            {[...CLASS_PHOTOS.slice(0, 4), ...CLASS_PHOTOS.slice(0, 4)].map((p, i) => (
              <div key={i} className="photo-card" style={{ backgroundImage: `url(${p})` }} />
            ))}
          </div>
          <div className="masonry-col col-right">
            {[...CLASS_PHOTOS.slice(3, 7), ...CLASS_PHOTOS.slice(3, 7), "cp1.jpeg"].map((p, i) => (
              <div key={i} className="photo-card" style={{ backgroundImage: `url(${p})` }} />
            ))}
          </div>
        </div>
        <div className="overlay-gradient" />
      </div>
      
      <div className="right-panel">
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />
        {children}
      </div>
    </div>
  );
}

/* ─── CSS ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #06060c; overflow: hidden; margin: 0; }

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #06060c;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
}

.left-panel {
  flex: 1.2;
  position: relative;
  overflow: hidden;
  background: #0a0a12;
  border-right: 1px solid rgba(255,255,255,0.05);
  display: block;
}

.masonry-wrapper {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: 150vh;
  transform: rotate(-4deg) scale(1.1);
  margin-top: -10vh;
}

.masonry-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.col-left { animation: scrollUp 40s linear infinite; }
.col-right { animation: scrollDown 40s linear infinite; }

@keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-30%); } }
@keyframes scrollDown { 0% { transform: translateY(-30%); } 100% { transform: translateY(0); } }

.photo-card {
  width: 100%;
  padding-bottom: 130%;
  background-size: cover;
  background-position: center;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  border: 4px solid rgba(255,255,255,0.05);
}

.overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 60%, #06060c 100%),
              radial-gradient(circle at center, transparent 30%, rgba(6,6,12,0.85) 100%);
  pointer-events: none;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  z-index: 10;
}

.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
  pointer-events: none;
  z-index: -1;
}
.glow-1 { width: 500px; height: 500px; background: #f5c842; top: -100px; right: -100px; }
.glow-2 { width: 600px; height: 600px; background: #50c8ff; bottom: -150px; left: -150px; }

.card {
  background: rgba(16, 16, 26, 0.7);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 32px;
  backdrop-filter: blur(24px);
  color: #fff;
  padding: 40px 36px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
}

.trophy { font-size: 72px; margin-bottom: 16px; text-align: center; }
.title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 900; line-height: 1.1; text-align: center; }
.sub { color: rgba(255,255,255,0.6); font-size: 15px; margin-top: 10px; line-height: 1.6; text-align: center;}
.err { color: #ff8080; font-size: 14px; margin-top: 10px; font-weight: 500; text-align: center;}
.hint { color: rgba(255,255,255,0.3); font-size: 13px; margin-top: 20px; text-align: center;}

.q-title { font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 700; line-height: 1.3; margin: 8px 0 16px; }
.badge { display: inline-block; background: rgba(245,200,66,0.1); border: 1px solid rgba(245,200,66,0.3); color: #f5c842; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 14px; border-radius: 99px; }

.btn-gold {
  background: linear-gradient(135deg, #f5c842, #ff9d00);
  color: #1a1000;
  font-weight: 700;
  font-family: inherit;
  font-size: 15px;
  border: none;
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 20px rgba(245,200,66,0.25);
  display: inline-block;
  text-align: center;
}
.btn-gold:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(245,200,66,0.35); filter: brightness(1.1); }
.btn-gold:active:not(:disabled) { transform: translateY(1px); }
.btn-gold:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; filter: grayscale(0.5); }

.btn-ghost {
  background: rgba(255,255,255,0.05);
  color: #fff;
  font-weight: 600;
  font-family: inherit;
  font-size: 15px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 15px 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-block;
  text-align: center;
}
.btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

.bar-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #f5c842, #ff9d00); border-radius: 99px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px rgba(245,200,66,0.5); }

.scroll-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 480px; width: 100%; padding-right: 6px; }
.scroll-list::-webkit-scrollbar { width: 6px; }
.scroll-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

.row-item { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 14px 20px; transition: background 0.2s; }
.row-item:hover { background: rgba(255,255,255,0.06); }
.row-label { font-size: 14px; color: rgba(255,255,255,0.7); flex: 1; font-weight: 500; text-align: left; }
.row-val { font-size: 14px; font-weight: 700; color: #f5c842; }
.row-skip { font-size: 13px; color: rgba(255,255,255,0.3); font-style: italic; }

.gender-pill { display: inline-block; margin: 8px auto 0; padding: 5px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; }
.pill-m { background: rgba(80,200,255,0.1); border-color: rgba(80,200,255,0.3); color: #78d9ff; }
.pill-f { background: rgba(255,120,190,0.1); border-color: rgba(255,120,190,0.3); color: #ff9bd2; }

.admin-cat-row { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px 16px; margin-bottom: 8px; }
.nom-chip { display: inline-block; background: rgba(255,255,255,0.1); border-radius: 99px; padding: 4px 12px; font-size: 13px; color: rgba(255,255,255,0.8); }
.chip-lead { background: rgba(245,200,66,0.2); color: #f5c842; font-weight: 600; }
.phase-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; }
.phase-nominating { background: rgba(80,200,255,0.15); color: #50c8ff; }
.phase-voting { background: rgba(80,255,120,0.15); color: #50ff78; }
.phase-results { background: rgba(245,200,66,0.15); color: #f5c842; }

.nominee-btn { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 16px 18px; color: #fff; font-family: inherit; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
.nominee-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(245,200,66,0.4); }
.nominee-selected { background: rgba(245,200,66,0.15) !important; border-color: #f5c842 !important; color: #f5c842; }

.field { width: 100%; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.18); border-radius: 14px; padding: 14px 18px; color: #fff; font-size: 16px; font-family: inherit; outline: none; transition: border-color 0.2s; }
.field:focus { border-color: rgba(245,200,66,0.7); }
.field::placeholder { color: rgba(255,255,255,0.3); }

.dropdown { position: absolute; left: 0; right: 0; margin-top: 10px; background: rgba(10,10,20,0.95); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 18px 50px rgba(0,0,0,0.6); z-index: 40; }
.drop-item { width: 100%; text-align: left; padding: 12px 14px; border: none; background: transparent; color: #fff; cursor: pointer; display: flex; justify-content: space-between; font-size: 14px; }
.drop-item:hover { background: rgba(255,255,255,0.08); }

@media (max-width: 900px) {
  .left-panel { display: none; }
}
`;"""
        content = content[:shell_start] + new_shell
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

update_file("nomination-site.jsx")
update_file("voting-site.jsx")
