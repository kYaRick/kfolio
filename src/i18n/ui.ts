import type { Lang } from '@/lib/site';

/**
 * UI strings. `en` is the source of truth; `uk` must define every key
 * (a missing key fails `astro check`). Use `{name}` for parameters.
 */
const en = {
  // Layout and navigation
  'meta.title': 'Yaroslav Kyliushyk // Software Tools & Application Engineer',
  'meta.description': 'Personal CV and engineering dispatches for Yaroslav Kyliushyk.',
  'nav.cv': 'Resume (CV)',
  'nav.blog': 'Engineering Dispatches',
  'nav.blogShort': 'Dispatches',
  'nav.settings': 'Settings',
  'nav.readingMode': 'Full reading mode',
  'nav.readingModeHint': 'Full reading mode (expand all)',
  'nav.expandAll': 'Expand all',
  'nav.print': 'Print & Export Resume to PDF',
  'nav.printShort': 'Print PDF',
  'nav.loading': 'Loading...',
  'footer.repo': 'GitHub Repository',
  'footer.about': 'About',
  'footer.toTop': 'Scroll to top',

  // About modal
  'about.title': 'ABOUT',
  'about.heading': 'kfolio // Portfolio',
  'about.body':
    'Personal website, interactive CV, and engineering dispatches for Yaroslav Kyliushyk, built with Astro static generation and Markdown content.',

  // Settings modal
  'settings.title': 'SETTINGS',
  'settings.tabTheme': 'Theme & Appearance',
  'settings.tabExport': 'Resume Export',
  'settings.palette': 'Color Palette',
  'settings.language': 'Interface Language',
  'settings.bgFx': 'Interactive Background',
  'settings.bgFxDesc': 'Dynamic Canvas animations per theme (starfield, cyber grid, snowfall)',
  'settings.pdfTitle': 'A4 PDF Resume Generator',
  'settings.pdfDesc': 'Select sections to include in official printed resume:',
  'settings.sectionExperience': 'Work Experience & Projects',
  'settings.sectionToolsets': 'Toolsets & Runtimes',
  'settings.sectionEducation': 'Education & Languages',
  'settings.sectionAspirations': 'Career Aspirations & Special Ops',
  'settings.sectionBio': 'Bio & Cognitive Logs',
  'settings.blogLocked': 'Blog export is disabled (print allowed only for CV)',
  'settings.export': 'Generate & Export PDF',
  'print.blogBlocked': 'Blog export is disabled. Print is available only for the official CV.',

  // CV cards
  'identity.title': 'IDENTITY & CORE PROFILE',
  'identity.emblem': 'State Emblem of Ukraine',
  'identity.united24': 'Support United24',
  'identity.platform': 'Platform:',
  'identity.location': 'Location:',
  'identity.photoHover': 'hover to decode',
  'identity.photoWipe': 'wipe the glass',
  'contacts.title': 'DIRECT ENDPOINTS',
  'contacts.copyEmail': 'Copy email',
  'contacts.copyLink': 'Copy {name}',
  'contacts.copied': 'Copied!',
  'education.title': 'EDUCATION & LANGUAGES',
  'education.languages': 'Languages:',
  'humor.title': 'SHORT BIO & COGNITIVE LOGS',
  'humor.reveal': 'Reveal punchline',
  'humor.deadLanguages': '† Good command of dead languages:',
  'humor.hobbies': 'Hobbies & Downtime:',
  'toolsets.title': 'TOOLSETS & RUNTIMES',
  'toolsets.showMore': '+ Show {count} more skill categories',
  'toolsets.collapse': 'Collapse extra skills',
  'experience.title': 'PROFESSIONAL EXPERIENCE',
  'experience.toggleHint': 'Collapse or expand all jobs',
  'experience.collapseAll': 'Collapse all',
  'experience.expandAll': 'Expand all',
  'experience.current': 'ACTIVE',
  'experience.duties': 'Key duties & deliverables:',
  'aspirations.title': 'CAREER ASPIRATIONS & SPECIAL OPS',
  'aspirations.defense': 'Defense & Sensitive Initiatives:',
  'aspirations.personal': 'HomeLab & Automation:',

  // Blog
  'blog.title': 'Engineering Dispatches // Yaroslav Kyliushyk',
  'blog.description': 'Engineering notes, experiments with Linux, .NET, and AI.',
  'blog.author': 'AUTHOR',
  'blog.authorBio':
    'Field notes on systems engineering, NixOS homelab setups, 3D printing, embedded microcontrollers, and .NET tooling.',
  'blog.tags': 'TOPICS & TAGS',
  'blog.feed': 'ENGINEERING DISPATCHES',
  'blog.feedDesc':
    'System architecture overviews, server configurations, hardware findings, and experiments with modern tooling.',
  'blog.read': 'Read Article',
  'blog.back': 'Back to Dispatches',
  'blog.recent': 'RECENT DISPATCHES',
  'blog.viewAll': 'View All',
  'blog.empty': 'Posts are being drafted.',

  // 404
  'notFound.title': '404 // Page not found or under maintenance // kfolio',
  'notFound.description': 'The requested page was not found, or the resource is under scheduled maintenance.',
  'notFound.heading': 'HTTP 404 // NOT FOUND OR MAINTENANCE',
  'notFound.error': '[404] Nothing lives at this address, or it moved.',
  'notFound.notice': '[503 / Notice] The resource may also be on a short break while static data updates.',
  'notFound.body':
    'The link you followed is outdated or has a typo. Use the links below to get back to the CV or the blog.',
  'notFound.home': 'Main CV',
  'notFound.blog': 'Engineering blog',
  'notFound.report': 'Report an issue',
} as const;

export type UiKey = keyof typeof en;

const uk: Record<UiKey, string> = {
  'meta.title': 'Ярослав Килюшик // Software Tools & Application Engineer',
  'meta.description': 'Резюме та інженерний блог Ярослава Килюшика.',
  'nav.cv': 'Резюме (CV)',
  'nav.blog': 'Блог та інженерні нотатки',
  'nav.blogShort': 'Блог',
  'nav.settings': 'Налаштування',
  'nav.readingMode': 'Режим повного читання',
  'nav.readingModeHint': 'Режим повного читання (розгорнути все)',
  'nav.expandAll': 'Розгорнути все',
  'nav.print': 'Друк та експорт резюме в PDF',
  'nav.printShort': 'Друк PDF',
  'nav.loading': 'Завантаження...',
  'footer.repo': 'Репозиторій на GitHub',
  'footer.about': 'Про ресурс',
  'footer.toTop': 'Піднятися вгору',

  'about.title': 'ПРО РЕСУРС',
  'about.heading': 'kfolio // Портфоліо',
  'about.body':
    'Особистий веб-простір, резюме та інженерний блог Ярослава Килюшика, створений на базі Astro зі швидким статичним рендерингом та Markdown.',

  'settings.title': 'НАЛАШТУВАННЯ',
  'settings.tabTheme': 'Тема та вигляд',
  'settings.tabExport': 'Експорт резюме',
  'settings.palette': 'Колірна палітра',
  'settings.language': 'Мова інтерфейсу',
  'settings.bgFx': 'Інтерактивний фон',
  'settings.bgFxDesc': 'Динамічні анімації Canvas під тему (зоряне поле, кібер-сітка, снігопад)',
  'settings.pdfTitle': 'Експорт резюме у PDF (A4)',
  'settings.pdfDesc': 'Оберіть потрібні розділи для друку резюме:',
  'settings.sectionExperience': 'Досвід роботи та проєкти',
  'settings.sectionToolsets': 'Стек технологій та рантайми',
  'settings.sectionEducation': 'Освіта та мови спілкування',
  'settings.sectionAspirations': 'Прагнення та спецпроєкти',
  'settings.sectionBio': 'Біографія та гумор',
  'settings.blogLocked': 'Експорт блогу заблоковано (друк діє лише для резюме)',
  'settings.export': 'Експортувати у PDF',
  'print.blogBlocked': 'Експорт блогу заблоковано. Друк дозволено лише для офіційного CV.',

  'identity.title': 'ПРОФІЛЬ ТА ІДЕНТИЧНІСТЬ',
  'identity.emblem': 'Державний Герб України',
  'identity.united24': 'Підтримати фонд United24',
  'identity.platform': 'Платформа:',
  'identity.location': 'Локація:',
  'identity.photoHover': 'наведіть, щоб проявити',
  'identity.photoWipe': 'протріть скло',
  'contacts.title': 'ПРЯМІ КОНТАКТИ',
  'contacts.copyEmail': 'Скопіювати email',
  'contacts.copyLink': 'Скопіювати посилання',
  'contacts.copied': 'Скопійовано!',
  'education.title': 'ОСВІТА ТА МОВИ',
  'education.languages': 'Мови спілкування:',
  'humor.title': 'ПРО МЕНЕ ТА ГУМОР',
  'humor.reveal': 'Розкрити відповідь',
  'humor.deadLanguages': '† Володію мертвими мовами:',
  'humor.hobbies': 'Хобі та дозвілля:',
  'toolsets.title': 'СТЕК ТЕХНОЛОГІЙ ТА РАНТАЙМИ',
  'toolsets.showMore': '+ Показати ще {count} категорії навичок',
  'toolsets.collapse': 'Згорнути додаткові навички',
  'experience.title': 'ДОСВІД РОБОТИ ТА ПРОЄКТИ',
  'experience.toggleHint': 'Згорнути або розгорнути всі записи',
  'experience.collapseAll': 'Згорнути всі',
  'experience.expandAll': 'Розгорнути всі',
  'experience.current': 'ПОТОЧНА',
  'experience.duties': "Обов'язки та ключові завдання:",
  'aspirations.title': 'ПРАГНЕННЯ ТА СПЕЦПРОЄКТИ',
  'aspirations.defense': 'Оборонні та чутливі ініціативи:',
  'aspirations.personal': 'HomeLab & Automation:',

  'blog.title': 'Блог та інженерні нотатки // Ярослав Килюшик',
  'blog.description': 'Інженерні нотатки, експерименти з Linux, .NET та AI.',
  'blog.author': 'АВТОР',
  'blog.authorBio':
    'Практичні нотатки про системну інженерію, HomeLab на базі NixOS, 3D-друк, вбудовані мікроконтролери та екосистему .NET.',
  'blog.tags': 'ТЕМАТИЧНІ ТЕГИ',
  'blog.feed': 'ІНЖЕНЕРНИЙ БЛОГ ТА НОТАТКИ',
  'blog.feedDesc':
    'Огляд архітектурних рішень, досвід міграції систем, конфігурація серверів та експерименти із сучасним стеком технологій.',
  'blog.read': 'Читати статтю',
  'blog.back': 'Назад до списку статей',
  'blog.recent': 'ОСТАННІ ЗАПИСИ БЛОГУ',
  'blog.viewAll': 'Усі статті',
  'blog.empty': 'Статті готуються до публікації.',

  'notFound.title': '404 // Сторінку не знайдено або технічна перерва // kfolio',
  'notFound.description':
    'Запитувану сторінку не знайдено, або ресурс перебуває на плановому технічному обслуговуванні.',
  'notFound.heading': 'HTTP 404 // НЕ ЗНАЙДЕНО АБО ТЕХНІЧНА ПЕРЕРВА',
  'notFound.error': '[404] Сторінку за цією адресою не знайдено або переміщено.',
  'notFound.notice':
    '[503 / Notice] Ресурс також може перебувати на короткій технічній перерві для оновлення статичних даних.',
  'notFound.body':
    'Посилання, за яким ви перейшли, застаріло або містить помилку в адресі. Скористайтеся посиланнями нижче, щоб повернутися до резюме або блогу.',
  'notFound.home': 'Головна (Резюме)',
  'notFound.blog': 'Інженерний блог',
  'notFound.report': 'Повідомити про проблему',
};

const ui: Record<Lang, Record<UiKey, string>> = { en, uk };

/** Translator bound to one language: `const t = useT(lang); t('nav.cv')`. */
export function useT(lang: Lang) {
  return (key: UiKey, params?: Record<string, string | number>): string => {
    const text = ui[lang][key];
    return params ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`)) : text;
  };
}
