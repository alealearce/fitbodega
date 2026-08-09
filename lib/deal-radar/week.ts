// Week identity: the Monday of the current week in Pacific time, as
// YYYY-MM-DD. Collection runs Monday 06:00 PT, so a normal run's slug is
// that same day; manual runs later in the week snap back to Monday.

export function currentWeekSlug(now = new Date()): string {
  const ptDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = ptDate.getDay(); // 0 Sun .. 6 Sat
  const sinceMonday = (day + 6) % 7;
  ptDate.setDate(ptDate.getDate() - sinceMonday);
  const y = ptDate.getFullYear();
  const m = String(ptDate.getMonth() + 1).padStart(2, '0');
  const d = String(ptDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function weekSlugToTitleDate(slug: string): string {
  return new Date(`${slug}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}
