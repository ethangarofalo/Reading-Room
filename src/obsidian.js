import { CATEGORIES, today } from './data.js';

const safeLinkTitle = (value) =>
  String(value || 'Untitled')
    .replace(/[\[\]|#^]/g, '')
    .trim() || 'Untitled';

const formatBookLink = (book) => `[[${safeLinkTitle(book.title)}]]`;

const sortByDateThenTitle = (a, b) =>
  a.entry.date.localeCompare(b.entry.date) || safeLinkTitle(a.book.title).localeCompare(safeLinkTitle(b.book.title));

const sortAnnotationByDateThenTitle = (a, b) =>
  a.annotation.date.localeCompare(b.annotation.date) || safeLinkTitle(a.book.title).localeCompare(safeLinkTitle(b.book.title));

const quoteBlock = (value) =>
  String(value || '')
    .trim()
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

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

function collectAnnotations(state) {
  const current = state.books.flatMap((book) =>
    ((state.annotations || {})[book.id] || []).map((annotation) => ({ annotation, book, status: 'current' }))
  );

  const finished = state.completed.flatMap((book) =>
    (book.annotations || []).map((annotation) => ({ annotation, book, status: 'finished' }))
  );

  return [...current, ...finished]
    .filter(({ annotation }) => annotation?.date && ((annotation.quote || '').trim() || (annotation.note || '').trim()))
    .sort(sortAnnotationByDateThenTitle);
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

function annotationMarkdown({ annotation, book, status }) {
  const category = CATEGORIES[book.category]?.label || CATEGORIES.other.label;
  const tags = (annotation.tags || []).map((tag) => `#${tag}`).join(' ');
  const lines = [
    `### ${formatBookLink(book)}`,
    '',
    `- Author: ${book.author || 'Unknown'}`,
    `- Category: ${category}`,
    `- Status: ${status}`,
    annotation.source === 'photo' ? '- Source: photo scan' : null,
    annotation.location ? `- Location: ${annotation.location}` : null,
    tags ? `- Tags: ${tags}` : null,
  ].filter((line) => line != null);

  if ((annotation.quote || '').trim()) {
    lines.push('', quoteBlock(annotation.quote));
  }

  if ((annotation.note || '').trim()) {
    lines.push('', '**My note**', '', annotation.note.trim());
  }

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

function buildDailyAnnotations(rows) {
  const groups = rows.reduce((acc, row) => {
    if (!acc[row.annotation.date]) acc[row.annotation.date] = [];
    acc[row.annotation.date].push(row);
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([date, annotations]) => [
      `## [[${date}]]`,
      ...annotations.map(annotationMarkdown),
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

function buildAnnotationBookIndex(rows) {
  const groups = rows.reduce((acc, row) => {
    const key = `${safeLinkTitle(row.book.title)}::${row.book.author || ''}`;
    if (!acc[key]) acc[key] = { book: row.book, rows: [] };
    acc[key].rows.push(row);
    return acc;
  }, {});

  return Object.values(groups)
    .sort((a, b) => safeLinkTitle(a.book.title).localeCompare(safeLinkTitle(b.book.title)))
    .map(({ book, rows: bookRows }) => {
      const dates = bookRows
        .slice()
        .sort((a, b) => a.annotation.date.localeCompare(b.annotation.date))
        .map(({ annotation }) => {
          const location = annotation.location ? ` - ${annotation.location}` : '';
          const tags = annotation.tags?.length ? ` - ${annotation.tags.map((tag) => `#${tag}`).join(' ')}` : '';
          return `- [[${annotation.date}]]${location}${tags}`;
        });

      return [
        `## ${formatBookLink(book)}`,
        '',
        `- Author: ${book.author || 'Unknown'}`,
        `- Annotations: ${bookRows.length}`,
        '',
        ...dates,
      ].join('\n');
    })
    .join('\n\n');
}

export function buildObsidianMarkdown(state) {
  const rows = collectEntries(state);
  const annotationRows = collectAnnotations(state);
  const exportDate = today();
  const dailyJournal = buildDailyJournal(rows);
  const dailyAnnotations = buildDailyAnnotations(annotationRows);
  const bookIndex = buildBookIndex(rows);
  const annotationIndex = buildAnnotationBookIndex(annotationRows);

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
    '- [[#Marginalia]]',
    '- [[#Book Index]]',
    '- [[#Marginalia Book Index]]',
    '',
    '# Daily Journal',
    '',
    dailyJournal || '_No journal entries yet._',
    '',
    '# Marginalia',
    '',
    dailyAnnotations || '_No annotations yet._',
    '',
    '# Book Index',
    '',
    bookIndex || '_No book entries yet._',
    '',
    '# Marginalia Book Index',
    '',
    annotationIndex || '_No annotation index yet._',
    '',
  ].join('\n');

  return { markdown, count: rows.length + annotationRows.length };
}
