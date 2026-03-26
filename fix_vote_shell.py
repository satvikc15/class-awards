from pathlib import Path

# Read nomination-site to extract Shell + CSS
nom = Path('nomination-site.jsx').read_text('utf-8')
shell_start = nom.index('/* \u2500\u2500\u2500 SHELL \u2500\u2500\u2500 */')
new_shell_css = nom[shell_start:]

# Read voting-site
vote = Path('voting-site.jsx').read_text('utf-8')
old_shell_start = vote.index('/* \u2500\u2500\u2500 SHELL \u2500\u2500\u2500 */')

# Replace everything from Shell onwards
vote_new = vote[:old_shell_start] + new_shell_css

# Add voting-specific CSS classes that nomination doesn't have
# Insert them before the closing backtick of CSS
insert_point = vote_new.rindex('`;')
extra_css = """
.nominee-btn {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 16px 18px;
  color: #f7f8ff; font-family: inherit; font-size: 15px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; text-align: left; width: 100%;
}
.nominee-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
.nominee-selected { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.4) !important; }

.admin-cat-row { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 14px 16px; }
.nom-chip { display: inline-block; background: rgba(255,255,255,0.06); border-radius: 99px; padding: 4px 12px; font-size: 13px; color: rgba(255,255,255,0.8); }
.chip-lead { background: rgba(255,255,255,0.12); color: #f7f8ff; font-weight: 600; }

.phase-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; }
.phase-nominating { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
.phase-voting     { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
.phase-results    { background: rgba(255,255,255,0.1); color: #f7f8ff; }
"""

vote_new = vote_new[:insert_point] + extra_css + vote_new[insert_point:]

Path('voting-site.jsx').write_text(vote_new, 'utf-8')
print("Done! voting-site.jsx Shell + CSS updated.")
