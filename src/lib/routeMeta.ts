import { getIndustryBySlug } from '@/lib/industriesData'
import { getNewsBySlug } from '@/lib/newsData'

export type PageSeo = {
  title: string
  description: string
  ogType: 'website' | 'article'
  ogImage?: string
}

type RouteMetaBase = {
  title: string
  description: string
  /** Absolute URL for og:image / twitter:image. Falls back to SITE_URL/og-default.png. */
  ogImage?: string
  /** og:type — defaults to "website". Use "article" for news posts. */
  ogType?: string
  /** robots content — defaults to "index, follow". Use "noindex" for hidden routes. */
  robots?: string
  /**
   * JSON-LD structured data for this page. When omitted, a default WebPage schema
   * is generated from the title/description/canonical. Pass `null` to suppress.
   */
  jsonLd?: object | null
}

const defaults: RouteMetaBase = {
  title: 'MoonSofts | Software consulting company for startups & remote teams',
  description:
    'MoonSofts is a software consulting company helping startups and enterprises ship with remote senior squads, AI-assisted delivery, and cloud-native engineering. Book a free consultation to align on your next program.',
}

const exact: Record<string, RouteMetaBase> = {
  '/': {
    title: 'MoonSofts | Software consulting company — startups, remote teams & AI delivery',
    description:
      'MoonSofts is a global software consulting company for startups and established product teams. Remote engineering squads, discovery through production, cloud & AI—plus a free consultation to map scope and delivery.',
  },
  '/about': {
    title: 'About MoonSofts | Global software consulting & remote delivery',
    description:
      'Our story, values, and commitments as MoonSofts—a software consulting company built for remote collaboration, startup speed, and enterprise-grade accountability.',
  },
  '/services': {
    title: 'Software consulting services | MoonSofts — discovery, squads & platforms',
    description:
      'MoonSofts services: software consulting, dedicated remote squads, platform integration, and delivery from align to operate—for startups scaling fast and enterprises modernizing safely.',
  },
  '/industries': {
    title: 'Industries we serve | MoonSofts software consulting',
    description:
      'Sector-focused software consulting from MoonSofts—e-commerce, logistics, healthcare, fintech, manufacturing, education, agriculture, hospitality, and more. Remote teams with domain context.',
  },
  '/clients': {
    title: 'Client voices & outcomes | MoonSofts software consulting',
    description:
      'Testimonials, trust signals, and delivery outcomes from MoonSofts consulting programs—remote squads startups and enterprises rely on for predictable releases.',
  },
  '/stack': {
    title: 'Technology & delivery platform | MoonSofts remote engineering',
    description:
      'How MoonSofts equips remote software teams—stack, tooling, and delivery platform practices for secure, observable, and repeatable engineering.',
  },
  '/news': {
    title: 'News & insights | MoonSofts — AI, cloud & software consulting',
    description:
      'MoonSofts newsroom: company updates and insights on AI, cloud, remote delivery, and software consulting for startup and enterprise leaders.',
  },
  '/team': {
    title: 'Leadership team | MoonSofts software consulting',
    description:
      'Meet the MoonSofts leadership team guiding our global software consulting practice and remote delivery standards.',
  },
  '/engineers': {
    title: 'Careers & engineers | MoonSofts — remote software consulting jobs',
    description:
      'Join MoonSofts—remote-friendly software consulting careers for students, graduates, and experienced engineers who care about craft and client outcomes.',
  },
  '/contact': {
    title: 'Contact MoonSofts | Free consultation & partnership inquiries',
    description:
      'Contact MoonSofts for software consulting, remote squad engagements, or careers. Start with a free consultation to discuss timelines, scope, and fit.',
  },
  '/privacy': {
    title: 'Legal, privacy & security | MoonSofts',
    description:
      'Privacy, security, and terms for MoonSofts websites and consulting engagements—how we handle data and communications.',
  },
}

function snippet(text: string, max = 158): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()
  return `${trimmed}…`
}

export function resolvePageSeo(pathname: string): PageSeo {
  const newsMatch = pathname.match(/^\/news\/([^/]+)$/)
  if (newsMatch?.[1]) {
    const article = getNewsBySlug(newsMatch[1])
    if (article) {
      return {
        title: `${article.title} | MoonSofts`,
        description: snippet(article.excerpt, 155),
        ogType: 'article',
        ogImage: article.image,
      }
    }
  }

  const industryMatch = pathname.match(/^\/industries\/([^/]+)$/)
  if (industryMatch?.[1]) {
    const sector = getIndustryBySlug(industryMatch[1])
    if (sector) {
      return {
        title: `${sector.title} | MoonSofts software consulting`,
        description: snippet(
          `${sector.body} MoonSofts provides remote software consulting and delivery for teams in this sector.`,
          158,
        ),
        ogType: 'website',
        ogImage: sector.heroImage,
      }
    }
  }

  const base = exact[pathname]
  if (base) {
    return { title: base.title, description: base.description, ogType: 'website' }
  }

  return { title: defaults.title, description: defaults.description, ogType: 'website' }
}

/** Set all <head> SEO tags for a given page. Safe to call on every route change. */
export function setPageMeta(meta: RouteMeta, pathname: string): void {
  const title = meta.title
  const description = meta.description
  const canonical = `${SITE_URL}${pathname}`
  const ogImage = meta.ogImage ?? `${SITE_URL}/og-default.png`
  const ogType = meta.ogType ?? 'website'
  const robots = meta.robots ?? 'index, follow'

  document.title = title

  setMeta('name', 'description', description)
  setMeta('name', 'robots', robots)

  // Open Graph
  setMeta('property', 'og:type', ogType)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:image', ogImage)
  setMeta('property', 'og:site_name', 'MoonSofts')

  // Twitter Card
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', ogImage)

  // Canonical
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = canonical

  // JSON-LD: use caller-supplied schema or fall back to a default WebPage node
  if (meta.jsonLd !== null) {
    const schema = meta.jsonLd ?? buildDefaultWebPageSchema(title, description, canonical)
    setJsonLd(schema)
  }
}

/** Build a minimal WebPage JSON-LD node for routes that don't supply their own. */
function buildDefaultWebPageSchema(name: string, description: string, url: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

/** Inject or replace the per-page JSON-LD <script> tag. */
function setJsonLd(data: object): void {
  let el = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-page]')
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute('data-page', 'true')
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}
