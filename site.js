(() => {
  'use strict';
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#nav-links');
  function closeMenu() { toggle?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('open'); }
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); nav?.classList.toggle('open', open);
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); toggle?.focus(); } });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    let visible = 0;
    document.querySelectorAll('[data-category]').forEach(card => { card.hidden = filter !== 'all' && card.dataset.category !== filter; if (!card.hidden) visible++; });
    const note = document.querySelector('.filter-note'); if (note) note.textContent = `${visible} ${visible === 1 ? 'project' : 'projects'}`;
  }));
  // Initial status remains usable without JavaScript or GitHub API access.
  // Public API results are cached briefly to avoid fetching on every page visit.
  async function refreshStatuses() {
    const badges = [...document.querySelectorAll('[data-pr]')];
    const results = await Promise.allSettled(badges.map(async badge => {
      const [repo, number] = badge.dataset.pr.split('#'); const key = `prem-pr-${repo}-${number}`;
      let cached; try { cached = JSON.parse(sessionStorage.getItem(key)); } catch {}
      let data;
      if (cached && Date.now() - cached.at < 900000) data = cached.data;
      else {
        const response = await fetch(`https://api.github.com/repos/${repo}/pulls/${number}`, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok) return false;
        const raw = await response.json();
        if (raw.user?.login !== 'premsinghsodha7') return false;
        data = { state: raw.merged_at ? 'merged' : raw.state };
        try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch {}
      }
      if (!['open', 'closed', 'merged'].includes(data.state)) return false;
      badge.classList.remove('open', 'closed', 'merged'); badge.classList.add(data.state);
      badge.textContent = data.state === 'merged' ? 'Merged' : data.state === 'open' ? 'Open PR' : 'Closed';
      badge.title = 'Current status from GitHub'; return true;
    }));
    if (results.length && results.every(r => r.status === 'fulfilled' && r.value)) {
      document.querySelectorAll('.contribution-date').forEach(el => { el.textContent = 'PR status refreshed from GitHub · View each pull request for details.'; });
    }
  }
  refreshStatuses().catch(() => {});
})();
