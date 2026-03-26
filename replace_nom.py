import re

with open('nomination-site.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the return block inside nominate
start_str = '''    return (
      <Shell>
        <style>{css}</style>
        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 480, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 6 }}>
            <span>{idx + 1} / {CATEGORIES.length}</span>
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
        {/* Progress */}
        <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, zIndex: 100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 6, fontWeight: 600 }}>
            <span>{idx + 1} / {CATEGORIES.length}</span>
            <span>{pct}% done</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: 480, height: 600, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={idx}
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
    end_idx = content.find(end_str, start_idx) + len('        </div>\n            </motion.div>\n          </AnimatePresence>\n        </div>\n      </Shell>\n    );')
    # wait we need to preserve inner content
    inner_start = start_idx + len(start_str)
    inner_end = content.find(end_str, start_idx)
    inner_content = content[inner_start:inner_end]
    
    final_replacement = new_render + inner_content + '        </div>\n            </motion.div>\n          </AnimatePresence>\n        </div>\n      </Shell>\n    );'
    
    content = content[:start_idx] + final_replacement + content[inner_end + len(end_str):]


# Make Shells in other screens also hide left panel if we want to
content = content.replace('<Shell>\n      <style>{css}</style>\n      <div className="card fade-in"', '<Shell>\n      <div className="card fade-in"')
content = content.replace('<Shell>\n        <style>{css}</style>\n        <div style={{ maxWidth: 460', '<Shell hideLeftPanel={true}>\n        <div style={{ maxWidth: 460')

with open('nomination-site.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
