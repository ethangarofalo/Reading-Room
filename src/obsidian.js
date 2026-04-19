import { CATEGORIES, today } from './data.js';

const safeLinkTitle = (value) =>
  String(value || 'Untitled')
    .replace(/[\[\]|#^]/g, '')
    .trim() || 'Untitled';

const formatBookLink = (book) => `[[${safeLinkTitle(book.title)}]]`;

const sortByDateThenTitle = (a, b) =>
  a.entry.date.localeCompare(b.entry.date) || safeLinkTitle(a.book.title).localeCompare(safeLinkTitle(b.book.title));

function collectEntries(state) {
  const current = state.books.flatMap((book) =>
    (state.entries[book.id] || []).map((entry) => ({ entry, book, status: 'current' }))
  );

  const finished = state.completed.flatMap((book) =>
    (book.entries || []).map((entry) => ({ entry, book, status: 'finished' }))
  );

  return [...current, ...finished]
    .filter(({ entry }) => entry?.date && ((entry.text || '').trim() || Number(entry.pages) > 0))
    .sort(sortByDateThenTitle);
}

function entryMarkdown({ entry, book, status }) {
  const category = CATEGORIES[book.category]?.label || CATEGORIES.other.label;
  const lines = [
    `### ${formatBookLink(book)}`,
    '',
    `- Author: ${book.author || 'Unknown'}`,
    `- Category: ${category}`,
    `- Status: ${status}`,
    `- Pages: ${Number(entry.pages) || 0}`,
  ];

  if (book.totalPages) lines.push(`- Total pages: ${book.totalPages}`);

  lines.push('', (entry.text || '').trim() || '_No note text._');
  return lines.join('\n');
}

function buildDailyJournal(rows) {
  const groups = rows.reduce((acc, row) => {
    if (!acc[row.entry.date]) acc[row.entry.date] = [];
    acc[row.entry.date].push(row);
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([date, entries]) => [
      `## [[${date}]]`,
      ...entries.map(entryMarkdown),
    ].join('\n\n'))
    .join('\n\n---\n\n');
}

function buildBookIndex(rows) {
  const groups = rows.reduce((acc, row) => {
    const key = `${safeLinkTitle(row.book.title)}::${row.book.author || ''}`;
    if (!acc[key]) acc[key] = { book: row.book, rows: [] };
    acc[key].rows.push(row);
    return acc;
  }, {});

  return Object.values(groups)
    .sort((a, b) => safeLinkTitle(a.book.title).localeCompare(safeLinkTitle(b.book.title)))
    .map(({ book, rows: bookRows }) => {
      const category = CATEGORIES[book.category]?.label || CATEGORIES.other.label;
      const dates = bookRows
        .slice()
        .sort((a, b) => a.entry.date.localeCompare(b.entry.date))
        .map(({ entry }) => `- [[${entry.date}]] - ${Number(entry.pages) || 0} pp`);

      return [
        `## ${formatBookLink(book)}`,
        '',
        `- Author: ${book.author || 'Unknown'}`,
        `- Category: ${category}`,
        `- Entries: ${bookRows.length}`,
        book.totalPages ? `- Total pages: ${book.totalPages}` : null,
        '',
        ...dates,
      ].filter((line) => line != null).join('\n');
    })
    .join('\n\n');
}

export function buildObsidianMarkdown(state) {
  const rows = collectEntries(state);
  const exportDate = today();
  const dailyJournal = buildDailyJournal(rows);
  const bookIndex = buildBookIndex(rows);

  const markdown = [
    '---',
    'type: reading-journal-export',
    'source: Reading Room',
    `exported: ${exportDate}`,
    'tags:',
    '  - reading',
    '  - reading-room',
    '---',
    '',
    '# Reading Journal',
    '',
    '## Contents',
    '',
    '- [[#Daily Journal]]',
    '- [[#Book Index]]',
    '',
    '# Daily Journal',
    '',
    dailyJournal || '_No journal entries yet._',
    '',
    '# Book Index',
    '',
    bookIndex || '_No book entries yet._',
    '',
  ].join('\n');

  return { markdown, count: rows.length };
}
