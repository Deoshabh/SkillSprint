/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [
    '/api/*',
    '/admin/*',
    '/email-verify/*',
    '/password-reset/*',
    '/test/*'
  ],
  additionalPaths: async (config) => [
    await config.transform(config, '/dashboard'),
    await config.transform(config, '/courses'),
    await config.transform(config, '/course-designer'),
    await config.transform(config, '/progress'),
    await config.transform(config, '/planner'),
    await config.transform(config, '/profile'),
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/email-verify/', '/password-reset/', '/test/']
      }
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://skillsprint.com'}/sitemap.xml`,
    ],
  },
  transform: async (config, path) => {
    // Custom priority for different pages
    let priority = config.priority;
    let changefreq = config.changefreq;

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.includes('/dashboard') || path.includes('/courses')) {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path.includes('/course-designer')) {
      priority = 0.8;
      changefreq = 'weekly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
