/**
 * Shared date formatting utilities for NoteSphere.
 * Formats timestamps in user local timezone and IST.
 */

/**
 * Format date for Journal cards according to NoteSphere specifications:
 * - Published blogs/articles: "Published on October 13, 2026 · 4:44 PM IST"
 * - Private or unpublished journals: "Created on October 13, 2026"
 *
 * @param {Object} journal - Journal entry object
 * @returns {string} Formatted date label
 */
export function formatJournalCardDate(journal) {
  if (!journal) return 'Created recently';

  const isPublished =
    (journal.visibility === 'PUBLIC' || journal.visibility === 'COMMUNITY') &&
    Boolean(journal.publishedAt || journal.createdAt);

  const rawDate = isPublished
    ? (journal.publishedAt || journal.createdAt)
    : journal.createdAt;

  if (!rawDate) {
    return isPublished ? 'Published recently' : 'Created recently';
  }

  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      return isPublished ? 'Published recently' : 'Created recently';
    }

    // Determine user's local timezone (fallback to Asia/Kolkata)
    let userTimezone = 'Asia/Kolkata';
    try {
      userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      userTimezone = 'Asia/Kolkata';
    }

    // Format date: "October 13, 2026"
    const dateStr = d.toLocaleDateString('en-US', {
      timeZone: userTimezone,
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (isPublished) {
      // Format time: "4:44 PM"
      const timeStr = d.toLocaleTimeString('en-US', {
        timeZone: userTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Format timezone label (prefer IST for Indian Standard Time)
      let tzAbbr = 'IST';
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          timeZoneName: 'short',
        }).formatToParts(d);
        const tzPart = parts.find((p) => p.type === 'timeZoneName');
        if (tzPart?.value) {
          tzAbbr = tzPart.value;
        }
      } catch {
        tzAbbr = 'IST';
      }

      if (
        userTimezone.includes('Calcutta') ||
        userTimezone.includes('Kolkata') ||
        tzAbbr.includes('GMT+5:30') ||
        tzAbbr.includes('GMT+5.5')
      ) {
        tzAbbr = 'IST';
      }

      return `Published on ${dateStr} · ${timeStr} ${tzAbbr}`;
    }

    return `Created on ${dateStr}`;
  } catch {
    return isPublished ? 'Published recently' : 'Created recently';
  }
}

/**
 * Format publication timestamp with time and IST for detail/preview pages.
 *
 * @param {string|Date} isoString - Date timestamp
 * @returns {string} Formatted date string
 */
export function formatPublishedDateIST(isoString) {
  if (!isoString) return 'Recently';

  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';

    let userTimezone = 'Asia/Kolkata';
    try {
      userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      userTimezone = 'Asia/Kolkata';
    }

    const dateStr = d.toLocaleDateString('en-US', {
      timeZone: userTimezone,
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const timeStr = d.toLocaleTimeString('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    let tzAbbr = 'IST';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        timeZoneName: 'short',
      }).formatToParts(d);
      const tzPart = parts.find((p) => p.type === 'timeZoneName');
      if (tzPart?.value) {
        tzAbbr = tzPart.value;
      }
    } catch {
      tzAbbr = 'IST';
    }

    if (
      userTimezone.includes('Calcutta') ||
      userTimezone.includes('Kolkata') ||
      tzAbbr.includes('GMT+5:30') ||
      tzAbbr.includes('GMT+5.5')
    ) {
      tzAbbr = 'IST';
    }

    return `${dateStr} · ${timeStr} ${tzAbbr}`;
  } catch {
    return 'Recently';
  }
}

export default {
  formatJournalCardDate,
  formatPublishedDateIST,
};
