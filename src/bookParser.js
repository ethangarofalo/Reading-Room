const AUTHORS = [
  { name: 'Aeschylus', aliases: ['aeschylus'], category: 'play' },
  { name: 'Sophocles', aliases: ['sophocles'], category: 'play' },
  { name: 'Euripides', aliases: ['euripides'], category: 'play' },
  { name: 'Aristophanes', aliases: ['aristophanes'], category: 'play' },
  { name: 'Homer', aliases: ['homer'], category: 'other' },
  { name: 'Herodotus', aliases: ['herodotus'], category: 'other' },
  { name: 'Thucydides', aliases: ['thucydides'], category: 'other' },
  { name: 'Plato', aliases: ['plato'], category: 'philosophy' },
  { name: 'Aristotle', aliases: ['aristotle'], category: 'philosophy' },
  { name: 'Xenophon', aliases: ['xenophon'], category: 'other' },
  { name: 'Cicero', aliases: ['cicero'], category: 'philosophy' },
  { name: 'Seneca', aliases: ['seneca'], category: 'philosophy' },
  { name: 'Epictetus', aliases: ['epictetus'], category: 'philosophy' },
  { name: 'Marcus Aurelius', aliases: ['marcus aurelius', 'aurelius'], category: 'philosophy' },
  { name: 'Augustine', aliases: ['augustine', 'st augustine'], category: 'philosophy' },
  { name: 'Dante Alighieri', aliases: ['dante', 'dante alighieri'], category: 'other' },
  { name: 'Niccolo Machiavelli', aliases: ['machiavelli', 'niccolo machiavelli'], category: 'philosophy' },
  { name: 'Thomas Hobbes', aliases: ['hobbes', 'thomas hobbes'], category: 'philosophy' },
  { name: 'John Locke', aliases: ['locke', 'john locke'], category: 'philosophy' },
  { name: 'Jean-Jacques Rousseau', aliases: ['rousseau', 'jean jacques rousseau'], category: 'philosophy' },
  { name: 'Immanuel Kant', aliases: ['kant', 'immanuel kant'], category: 'philosophy' },
  { name: 'G. W. F. Hegel', aliases: ['hegel', 'g w f hegel'], category: 'philosophy' },
  { name: 'Friedrich Nietzsche', aliases: ['nietzsche', 'friedrich nietzsche'], category: 'philosophy' },
  { name: 'Martin Heidegger', aliases: ['heidegger', 'martin heidegger'], category: 'philosophy' },
  { name: 'Leo Strauss', aliases: ['strauss', 'leo strauss'], category: 'secondary' },
  { name: 'Shakespeare', aliases: ['shakespeare', 'william shakespeare'], category: 'play' },
  { name: 'Miguel de Cervantes', aliases: ['cervantes', 'miguel de cervantes'], category: 'other' },
  { name: 'Jane Austen', aliases: ['austen', 'jane austen'], category: 'other' },
  { name: 'Fyodor Dostoevsky', aliases: ['dostoevsky', 'fyodor dostoevsky', 'dostoyevsky'], category: 'other' },
  { name: 'Leo Tolstoy', aliases: ['tolstoy', 'leo tolstoy'], category: 'other' },
  { name: 'W. G. Sebald', aliases: ['sebald', 'w g sebald'], category: 'other' },
];

const WORKS = [
  { title: 'The Oresteia', author: 'Aeschylus', category: 'play', aliases: ['oresteia', 'the oresteia'] },
  { title: 'Agamemnon', author: 'Aeschylus', category: 'play', aliases: ['agamemnon'] },
  { title: 'Antigone', author: 'Sophocles', category: 'play', aliases: ['antigone'] },
  { title: 'Oedipus Rex', author: 'Sophocles', category: 'play', aliases: ['oedipus rex', 'oedipus the king'] },
  { title: 'The Bacchae', author: 'Euripides', category: 'play', aliases: ['bacchae', 'the bacchae'] },
  { title: 'The Iliad', author: 'Homer', category: 'other', aliases: ['iliad', 'the iliad'] },
  { title: 'The Odyssey', author: 'Homer', category: 'other', aliases: ['odyssey', 'the odyssey'] },
  { title: 'Histories', author: 'Herodotus', category: 'other', aliases: ['histories', 'the histories'] },
  { title: 'History of the Peloponnesian War', author: 'Thucydides', category: 'other', aliases: ['peloponnesian war', 'history of the peloponnesian war'] },
  { title: 'Republic', author: 'Plato', category: 'philosophy', aliases: ['republic', 'the republic'] },
  { title: 'Apology', author: 'Plato', category: 'philosophy', aliases: ['apology'] },
  { title: 'Crito', author: 'Plato', category: 'philosophy', aliases: ['crito'] },
  { title: 'Phaedo', author: 'Plato', category: 'philosophy', aliases: ['phaedo'] },
  { title: 'Symposium', author: 'Plato', category: 'philosophy', aliases: ['symposium'] },
  { title: 'Gorgias', author: 'Plato', category: 'philosophy', aliases: ['gorgias'] },
  { title: 'Meno', author: 'Plato', category: 'philosophy', aliases: ['meno'] },
  { title: 'Laws', author: 'Plato', category: 'philosophy', aliases: ['laws', 'the laws'] },
  { title: 'Nicomachean Ethics', author: 'Aristotle', category: 'philosophy', aliases: ['ethics', 'nicomachean ethics'] },
  { title: 'Politics', author: 'Aristotle', category: 'philosophy', aliases: ['politics'] },
  { title: 'Rhetoric', author: 'Aristotle', category: 'philosophy', aliases: ['rhetoric'] },
  { title: 'Poetics', author: 'Aristotle', category: 'philosophy', aliases: ['poetics'] },
  { title: 'Meditations', author: 'Marcus Aurelius', category: 'philosophy', aliases: ['meditations'] },
  { title: 'Confessions', author: 'Augustine', category: 'philosophy', aliases: ['confessions'] },
  { title: 'Divine Comedy', author: 'Dante Alighieri', category: 'other', aliases: ['divine comedy', 'the divine comedy'] },
  { title: 'The Prince', author: 'Niccolo Machiavelli', category: 'philosophy', aliases: ['prince', 'the prince'] },
  { title: 'Leviathan', author: 'Thomas Hobbes', category: 'philosophy', aliases: ['leviathan'] },
  { title: 'Second Treatise of Government', author: 'John Locke', category: 'philosophy', aliases: ['second treatise', 'second treatise of government'] },
  { title: 'The Social Contract', author: 'Jean-Jacques Rousseau', category: 'philosophy', aliases: ['social contract', 'the social contract'] },
  { title: 'Critique of Pure Reason', author: 'Immanuel Kant', category: 'philosophy', aliases: ['critique of pure reason'] },
  { title: 'Phenomenology of Spirit', author: 'G. W. F. Hegel', category: 'philosophy', aliases: ['phenomenology of spirit'] },
  { title: 'Beyond Good and Evil', author: 'Friedrich Nietzsche', category: 'philosophy', aliases: ['beyond good and evil'] },
  { title: 'The Birth of Tragedy', author: 'Friedrich Nietzsche', category: 'philosophy', aliases: ['birth of tragedy', 'the birth of tragedy'] },
  { title: 'Being and Time', author: 'Martin Heidegger', category: 'philosophy', aliases: ['being and time'] },
  { title: 'Hamlet', author: 'Shakespeare', category: 'play', aliases: ['hamlet'] },
  { title: 'King Lear', author: 'Shakespeare', category: 'play', aliases: ['king lear'] },
  { title: 'Macbeth', author: 'Shakespeare', category: 'play', aliases: ['macbeth'] },
  { title: 'Don Quixote', author: 'Miguel de Cervantes', category: 'other', aliases: ['don quixote'] },
  { title: 'Pride and Prejudice', author: 'Jane Austen', category: 'other', aliases: ['pride and prejudice'] },
  { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', category: 'other', aliases: ['crime and punishment'] },
  { title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', category: 'other', aliases: ['brothers karamazov', 'the brothers karamazov'] },
  { title: 'War and Peace', author: 'Leo Tolstoy', category: 'other', aliases: ['war and peace'] },
  { title: 'The Rings of Saturn', author: 'W. G. Sebald', category: 'other', aliases: ['rings of saturn', 'the rings of saturn'] },
];

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const containsPhrase = (haystack, phrase) =>
  new RegExp(`(^| )${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(haystack);

const findAuthor = (value) => {
  const haystack = normalize(value);
  return AUTHORS
    .flatMap((author) => author.aliases.map((alias) => ({ author, alias: normalize(alias) })))
    .filter(({ alias }) => alias && containsPhrase(haystack, alias))
    .sort((a, b) => b.alias.length - a.alias.length)[0]?.author || null;
};

const findWork = (value) => {
  const haystack = normalize(value);
  return WORKS
    .flatMap((work) => work.aliases.map((alias) => ({ work, alias: normalize(alias) })))
    .filter(({ alias }) => alias && containsPhrase(haystack, alias))
    .sort((a, b) => b.alias.length - a.alias.length)[0]?.work || null;
};

const explicitCategory = (value) => {
  const text = normalize(value);
  if (/\b(play|plays|tragedy|tragedies|drama)\b/.test(text)) return 'play';
  if (/\b(secondary|commentary|criticism|scholarship|article|essay)\b/.test(text)) return 'secondary';
  if (/\b(philosophy|philosophical|political theory|theory)\b/.test(text)) return 'philosophy';
  return null;
};

const smartTitle = (value) => {
  const cleaned = String(value || '')
    .replace(/\b(reading|read|reread|currently|start|starting|pages?|pp)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-:,\s]+|[-:,\s]+$/g, '')
    .trim();

  if (!cleaned) return '';
  if (/[a-z]/.test(cleaned) && /[A-Z]/.test(cleaned.slice(1))) return cleaned;

  const small = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to']);
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, index) => (index > 0 && small.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
};

const stripAuthor = (value, author) => {
  if (!author) return value;
  return author.aliases.reduce((text, alias) => (
    text.replace(new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'ig'), ' ')
  ), value);
};

const stripPages = (value) => value.replace(/\b\d{1,5}\s*(pages?|pp|p)\b/gi, ' ');

export function parseBookIntake(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const pagesMatch = raw.match(/\b(\d{1,5})\s*(pages?|pp|p)\b/i);
  const totalPages = pagesMatch ? Number(pagesMatch[1]) : null;
  const category = explicitCategory(raw);
  let working = stripPages(raw);

  const byMatch = working.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    const author = findAuthor(byMatch[2]);
    const titleWork = findWork(byMatch[1]);
    return {
      title: titleWork?.title || smartTitle(byMatch[1]),
      author: author?.name || smartTitle(byMatch[2]),
      category: titleWork?.category || category || author?.category || 'other',
      totalPages,
      confidence: author || titleWork ? 'high' : 'medium',
    };
  }

  const parts = working.split(/\s+[-:]\s+|,\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const leftAuthor = findAuthor(parts[0]);
    const rightAuthor = findAuthor(parts[1]);
    const work = findWork(working);
    if (leftAuthor || rightAuthor || work) {
      const author = leftAuthor || rightAuthor || findAuthor(working);
      const titlePart = leftAuthor ? parts.slice(1).join(' ') : rightAuthor ? parts[0] : work?.title;
      return {
        title: work?.title || smartTitle(titlePart),
        author: author?.name || work?.author || '',
        category: work?.category || category || author?.category || 'other',
        totalPages,
        confidence: 'high',
      };
    }
  }

  const work = findWork(working);
  if (work) {
    return {
      title: work.title,
      author: work.author,
      category: work.category || category,
      totalPages,
      confidence: 'high',
    };
  }

  const author = findAuthor(working);
  if (author) {
    working = stripAuthor(working, author);
    return {
      title: smartTitle(working),
      author: author.name,
      category: category || author.category || 'other',
      totalPages,
      confidence: 'medium',
    };
  }

  return {
    title: smartTitle(working),
    author: '',
    category: category || 'other',
    totalPages,
    confidence: 'low',
  };
}
