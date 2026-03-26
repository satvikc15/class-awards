from pathlib import Path

nom = Path('nomination-site.jsx').read_text('utf-8')
vote = Path('voting-site.jsx').read_text('utf-8')

marker = 'SHELL'

nom_idx = nom.index(marker) - 5
new_shell = nom[nom_idx:]

vote_idx = vote.index(marker) - 5
vote_before = vote[:vote_idx]

# Add voting-specific CSS before the closing backtick
extra = """
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

# Find closing backtick+semicolon in new_shell
close_idx = new_shell.rindex('`;')
new_shell_with_extra = new_shell[:close_idx] + extra + new_shell[close_idx:]

result = vote_before + new_shell_with_extra
Path('voting-site.jsx').write_text(result, 'utf-8')
print('Done')
