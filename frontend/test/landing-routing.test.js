import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

describe('NoteSphere Landing Page & Routing Suite', () => {

  test('Landing Page files and components must exist', () => {
    const requiredFiles = [
      'pages/LandingPage.jsx',
      'pages/LandingPage.css',
      'components/landing/LandingNav.jsx',
      'components/landing/LandingNav.css',
      'components/landing/HeroSection.jsx',
      'components/landing/HeroSection.css',
      'components/landing/FeaturesSection.jsx',
      'components/landing/FeaturesSection.css',
      'components/landing/PublicStoriesSection.jsx',
      'components/landing/PublicStoriesSection.css',
      'components/landing/InsightsPreviewSection.jsx',
      'components/landing/InsightsPreviewSection.css',
      'components/landing/CtaSection.jsx',
      'components/landing/CtaSection.css',
      'components/landing/LandingFooter.jsx',
      'components/landing/LandingFooter.css',
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(srcDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
    }
  });

  test('Hero section contains specified headline, description, and primary CTAs', () => {
    const heroCode = fs.readFileSync(path.join(srcDir, 'components/landing/HeroSection.jsx'), 'utf-8');

    // Headline check
    assert.match(heroCode, /Your Thoughts Deserve a/i, 'Hero must contain headline prefix');
    assert.match(heroCode, /Place of Their Own/i, 'Hero must contain headline accent');

    // Description check
    assert.match(heroCode, /Write privately, share your stories with the world/i, 'Hero must contain exact description');
    assert.match(heroCode, /Your space to write, reflect, and grow/i, 'Hero must contain closing description');

    // CTAs check
    assert.match(heroCode, /Start Writing/i, 'Hero must provide Start Writing CTA');
    assert.match(heroCode, /Explore Stories/i, 'Hero must provide Explore Stories CTA');
    assert.match(heroCode, /to="\/register"/i, 'Start Writing CTA must route to /register for visitors');
  });

  test('Features section strictly includes all 6 verified NoteSphere features', () => {
    const featuresCode = fs.readFileSync(path.join(srcDir, 'components/landing/FeaturesSection.jsx'), 'utf-8');

    const expectedFeatures = [
      'Private Journals',
      'Public Stories',
      'Communities',
      'Real-Time Chat',
      'Friends & Connections',
      'Journal Insights',
    ];

    for (const feat of expectedFeatures) {
      assert.ok(
        featuresCode.includes(feat),
        `Features section must showcase feature: ${feat}`
      );
    }
  });

  test('Public Stories Preview component fetches from real API and handles all states', () => {
    const storiesCode = fs.readFileSync(path.join(srcDir, 'components/landing/PublicStoriesSection.jsx'), 'utf-8');

    assert.match(storiesCode, /blogService\.getPublicBlogs/i, 'Must call blogService.getPublicBlogs');
    assert.match(storiesCode, /story-skeleton-card/i, 'Must render loading skeleton state');
    assert.match(storiesCode, /stories-feedback-card error/i, 'Must handle error state with retry');
    assert.match(storiesCode, /No Public Stories Yet/i, 'Must handle empty state cleanly');
    assert.match(storiesCode, /navigate\(`\/blogs\/\${targetSlug}`\)/i, 'Card click must navigate to /blogs/:slug route');
    assert.match(storiesCode, /PUBLIC/i, 'Must enforce strictly public visibility');
  });

  test('Final CTA and Footer contain required messaging and branding', () => {
    const ctaCode = fs.readFileSync(path.join(srcDir, 'components/landing/CtaSection.jsx'), 'utf-8');
    const footerCode = fs.readFileSync(path.join(srcDir, 'components/landing/LandingFooter.jsx'), 'utf-8');

    assert.match(ctaCode, /Your Next Story Starts Here/i, 'CTA must have suggested headline');
    assert.match(ctaCode, /to="\/register"/i, 'CTA must link to registration');
    assert.match(ctaCode, /to="\/login"/i, 'CTA must link to login');

    assert.match(footerCode, /Note<span>Sphere<\/span>/i, 'Footer must display NoteSphere branding');
    assert.match(footerCode, /Explore Stories/i, 'Footer must include navigation links');
  });

  test('App.jsx correctly routes unauthenticated visitors vs authenticated users', () => {
    const appCode = fs.readFileSync(path.join(srcDir, 'App.jsx'), 'utf-8');

    // 1. Root route for logged-out visitor renders LandingPage
    assert.match(
      appCode,
      /!isAuthenticated && location\.pathname === '\/'/,
      'AppShellLayout must render LandingPage for unauthenticated visitor at root'
    );

    // 2. Protected sub-routes redirect unauthenticated users to login preserving destination
    assert.match(
      appCode,
      /Navigate to=\{`\/login\?redirect=\${encodeURIComponent\(redirectParam\)}`\}/,
      'Protected sub-routes must redirect unauthenticated visitors to login with return redirect'
    );

    // 3. Authenticated users render MainLayout dashboard shell
    assert.match(
      appCode,
      /<MainLayout showRightPanel=\{true\} \/>/,
      'Authenticated users must receive MainLayout dashboard'
    );

    // 4. Direct public preview route preserved
    assert.match(
      appCode,
      /<Route path="\/blogs\/:slug" element=\{<BlogDetailPage \/>\} \/>/,
      'Direct public blog route /blogs/:slug must remain accessible'
    );

    // 5. Direct aliases for landing and explore
    assert.match(appCode, /<Route path="\/landing" element=\{<LandingPage \/>\} \/>/);
    assert.match(appCode, /<Route path="\/explore" element=\{<Navigate to="\/#stories" replace \/>\} \/>/);
  });

  test('BlogService provides getPublicBlogs endpoint method', () => {
    const blogServiceCode = fs.readFileSync(path.join(srcDir, 'api/blogService.js'), 'utf-8');

    assert.match(blogServiceCode, /getPublicBlogs:\s*\(params\s*=\s*\{\}\)\s*=>/i, 'blogService must export getPublicBlogs');
    assert.match(blogServiceCode, /request\(`\/public\/blogs\${queryString}`\)/i, 'Must call /public/blogs endpoint');
  });
});
