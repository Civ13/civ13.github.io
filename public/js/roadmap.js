(function (root) {
  'use strict';
  const STATES = ['draft', 'open', 'closed', 'merged'];
  function validate(data) {
    if (!data || data.schema_version !== 1 || !Array.isArray(data.milestones) || data.milestones.length > 30) throw new Error('Invalid roadmap');
    const ids = new Set();
    let count = 0;
    for (const m of data.milestones) {
      if (!m || !/^[a-z0-9-]+$/.test(m.id) || ids.has(m.id) || !['planned', 'in_progress', 'completed'].includes(m.status)) throw new Error('Invalid milestone');
      ids.add(m.id);
      for (const key of ['title', 'summary', 'availability_note']) if (typeof m[key] !== 'string' || !m[key].trim() || m[key].length > 800) throw new Error('Invalid copy');
      if (!['unverified', 'verified'].includes(m.availability) || !Array.isArray(m.evidence)) throw new Error('Invalid availability');
      if (m.availability === 'verified' && !/^https:\/\//.test(m.availability_evidence || '')) throw new Error('Missing live evidence');
      for (const e of m.evidence) {
        if (!/^Civ13\/[A-Za-z0-9_.-]+$/.test(e.repository) || !Number.isSafeInteger(e.number) || e.number < 1 || !['prerequisite', 'implementation'].includes(e.role) || !STATES.includes(e.state) || typeof e.label !== 'string' || !e.label.trim()) throw new Error('Invalid evidence');
        count++;
      }
      if (m.completion !== null) {
        const c = m.completion;
        if (!c || c.acceptance_verified !== true || typeof c.basis !== 'string' || !c.basis.trim() || !Array.isArray(c.required_prs) || !c.required_prs.length || c.required_prs.some(key => !m.evidence.some(e => e.role === 'implementation' && key === `${e.repository}#${e.number}`))) throw new Error('Invalid completion contract');
      }
      if (m.status === 'completed' && !m.completion) throw new Error('Completion needs reviewed acceptance');
    }
    if (count > 40) throw new Error('Too many requests');
    return data;
  }
  function progress(pr, evidence) {
    if (!pr || pr.number !== evidence.number || pr.base?.repo?.full_name !== evidence.repository || typeof pr.draft !== 'boolean' || !['open', 'closed'].includes(pr.state) || typeof pr.merged !== 'boolean') throw new Error('Invalid GitHub response');
    if (pr.merged && (pr.state !== 'closed' || !/^[a-f0-9]{40}$/.test(pr.merge_commit_sha || ''))) throw new Error('Invalid merge evidence');
    return {state: pr.merged ? 'merged' : pr.state === 'closed' ? 'closed' : pr.draft ? 'draft' : 'open', merge_sha: pr.merged ? pr.merge_commit_sha : null};
  }
  async function refresh(data, fetchPR) {
    validate(data);
    const next = JSON.parse(JSON.stringify(data));
    const cache = new Map();
    for (const m of next.milestones) {
      for (const e of m.evidence) {
        const key = `${e.repository}#${e.number}`;
        if (!cache.has(key)) cache.set(key, await fetchPR(e));
        Object.assign(e, progress(cache.get(key), e));
      }
      if (m.completion && m.completion.required_prs.every(key => m.evidence.some(e => `${e.repository}#${e.number}` === key && e.state === 'merged'))) m.status = 'completed';
      // Availability is maintainer-verified independently of GitHub merges.
    }
    return validate(next);
  }
  const api = {validate, progress, refresh};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document) return;
  const embedded = root.document.getElementById('roadmap-data');
  if (!embedded) return;
  const labels = {draft: 'Early draft', open: 'Under development', closed: 'Closed without merging', merged: 'Merged'};
  (async function () {
    try {
      const next = await refresh(JSON.parse(embedded.textContent), async e => {
        const response = await fetch(`https://api.github.com/repos/${e.repository}/pulls/${e.number}`, {headers: {Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(8000)});
        if (!response.ok) throw new Error('Progress unavailable');
        return response.json();
      });
      for (const m of next.milestones) {
        const card = root.document.querySelector(`[data-milestone="${m.id}"]`);
        if (m.status === 'completed' && m.availability !== 'verified') card.querySelector('.roadmap-status').textContent = 'Code complete';
        for (const e of m.evidence) card.querySelector(`[data-evidence="${e.repository}#${e.number}"]`).textContent = labels[e.state];
      }
      root.document.getElementById('roadmap-refresh').textContent = 'Linked development progress checked just now. Server availability is verified separately.';
    } catch (_) {
      root.document.getElementById('roadmap-refresh').textContent = 'Live progress could not be checked. The last saved roadmap is still shown.';
    }
  }());
}(typeof globalThis !== 'undefined' ? globalThis : this));
