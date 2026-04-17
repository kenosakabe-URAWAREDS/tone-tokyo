import { defineType, defineField } from 'sanity';

const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO & AEO' },
    { name: 'editorial', title: 'Editorial Meta' },
    { name: 'system', title: 'System (read-only)' },
  ],
  fields: [
    // === CONTENT ===
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'titleJa', title: 'Title (Japanese)', type: 'string', group: 'content' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', group: 'content', options: { source: 'title', maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: 'pillar', title: 'Pillar', type: 'string', group: 'content', options: { list: ['FASHION', 'EAT', 'CULTURE', 'EXPERIENCE', 'CRAFT', 'FAMILY'] }, validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', group: 'content', rows: 3 }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', group: 'content', options: { hotspot: true } }),
    defineField({ name: 'heroCaption', title: 'Hero Caption', type: 'string', group: 'content' }),
    defineField({ name: 'heroImageUrl', title: 'Hero Image URL', type: 'url', group: 'content' }),
    defineField({ name: 'gallery', title: 'Gallery', type: 'array', group: 'content', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'caption', type: 'string', title: 'Caption' },
            { name: 'alt', type: 'string', title: 'Alt Text' },
          ],
        },
      ],
      // Body-level validation does double duty: it blocks publishing
      // while forbidden AI-leftover markers are still in the text, and
      // it enforces the Editorial minimum word count. Keeping both
      // checks here (rather than on separate fields) means the editor
      // sees one clear error per issue on the field that actually
      // contains the offending content.
      validation: (Rule) =>
        Rule.custom((value, context) => {
          let bodyText = '';
          if (Array.isArray(value)) {
            bodyText = (value as Array<Record<string, unknown>>)
              .filter((b) => b && b._type === 'block' && Array.isArray((b as { children?: unknown }).children))
              .map((b) => {
                const children = (b as { children: Array<{ text?: unknown }> }).children;
                return children.map((c) => (c && typeof c.text === 'string' ? c.text : '')).join('');
              })
              .join('\n');
          } else if (typeof value === 'string') {
            bodyText = value;
          }
          const forbidden = [
            { name: '[NEEDS VERIFICATION]', re: /\[NEEDS VERIFICATION\]/i },
            { name: '[TODO]', re: /\[TODO\]/i },
            { name: '[PLACEHOLDER]', re: /\[PLACEHOLDER\]/i },
            { name: '[FIXME]', re: /\[FIXME\]/i },
            { name: '[TBD]', re: /\[TBD\]/i },
          ];
          for (const { name, re } of forbidden) {
            if (re.test(bodyText)) {
              return `Body contains forbidden marker ${name}. Remove before publishing.`;
            }
          }
          const doc = context.document as { articleType?: string } | undefined;
          if (doc?.articleType === 'editorial') {
            const wc = bodyText.trim().split(/\s+/).filter(Boolean).length;
            if (wc > 0 && wc < 800) {
              return `Editorial articles require at least 800 words (currently ${wc}).`;
            }
          }
          return true;
        }),
    }),
    defineField({
      name: 'bodyJa',
      title: 'Body (Japanese / 日本語本文)',
      type: 'text',
      group: 'content',
      rows: 10,
      description: '記事内容を日本語で確認・編集するためのフィールド。ここを編集すると英語本文の更新基準になります（/input ページの「翻訳して更新」から body を上書きできます）。',
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', group: 'content', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'readTime', title: 'Read Time', type: 'string', group: 'content' }),

    // === EDITORIAL ===
    defineField({
      name: 'articleType',
      title: 'Article Type',
      type: 'string',
      group: 'editorial',
      options: {
        list: [
          { title: 'Editorial (deep, long-form)', value: 'editorial' },
          { title: 'News (short, factual)', value: 'news' },
        ],
        layout: 'radio',
      },
      initialValue: 'editorial',
      validation: (Rule) => Rule.required(),
      description: 'Editorial = 800-2000 words, prof-editor quality. News = 200-400 words, factual quick dispatch.',
    }),

    // === COMMON FILTERS ===
    defineField({ name: 'area', title: 'Area (Prefecture)', type: 'string', group: 'editorial', options: { list: ['Tokyo', 'Osaka', 'Kyoto', 'Fukuoka', 'Okayama', 'Kurume', 'Hokkaido', 'Okinawa', 'Nagoya', 'Kobe', 'Other'] } }),
    defineField({ name: 'neighborhood', title: 'Neighborhood', type: 'string', group: 'editorial' }),
    defineField({ name: 'editorRating', title: "The Editor's Rating", type: 'number', group: 'editorial', options: { list: [1, 2, 3] }, description: '1=Worth a Visit, 2=Highly Recommended, 3=Must Go' }),

    // === EAT FILTERS ===
    defineField({ name: 'eatGenre', title: 'EAT: Genre', type: 'string', group: 'editorial', options: { list: ['Ramen', 'Sushi', 'Yakitori', 'Yakiniku', 'Curry', 'Soba / Udon', 'Italian', 'French', 'Chinese', 'Cafe', 'Bar', 'Izakaya', 'Bakery', 'Sweets', 'Other'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'bookingDifficulty', title: 'EAT: Booking Difficulty', type: 'string', group: 'editorial', options: { list: ['Walk-in OK', 'Easy to book', 'Book ahead', 'Hard to get'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'drinks', title: 'EAT: Drinks', type: 'array', group: 'editorial', of: [{ type: 'string' }], options: { list: ['Sake', 'Natural Wine', 'Craft Beer', 'Whisky / Bourbon', 'Cocktails', 'Shochu / Awamori', 'Non-alcohol', 'No drinks (food only)'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'scene', title: 'EAT: Scene', type: 'array', group: 'editorial', of: [{ type: 'string' }], options: { list: ['Solo dining', 'Date', 'Business dinner', 'Friends', 'Late night (after 22:00)', 'Breakfast / Brunch', 'Takeout', 'Family'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'eatPriceRange', title: 'EAT: Price Range', type: 'string', group: 'editorial', options: { list: ['~¥1,000', '~¥3,000', '~¥5,000', '~¥10,000', '¥10,000+'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),

    // === FASHION FILTERS ===
    // NOTE: The old FASHION-specific `articleType` field (values:
    // "Brand Profile / Shop Guide / Collection Review / Street Style /
    // Trend Analysis") was removed in Part 3 to avoid a name collision
    // with the new doc-level articleType (editorial/news). It was
    // functionally redundant with `fashionType`. Migration unsets any
    // lingering data on existing docs.
    defineField({ name: 'fashionCategory', title: 'FASHION: Category', type: 'string', group: 'editorial', options: { list: ['Denim', 'Sneakers', 'Outerwear', 'Knitwear', 'Shirts', 'Pants', 'Eyewear', 'Bags', 'Accessories', 'Leather shoes', 'Vintage'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),
    defineField({ name: 'fashionType', title: 'FASHION: Type', type: 'string', group: 'editorial', options: { list: ['Brand profile', 'Shop guide', 'Collection', 'Buying guide', 'Styling'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),
    defineField({ name: 'fashionPriceRange', title: 'FASHION: Price Range', type: 'string', group: 'editorial', options: { list: ['~¥10,000', '~¥30,000', '~¥50,000', '~¥100,000', '¥100,000+'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),
    defineField({ name: 'fashionFeature', title: 'FASHION: Features', type: 'array', group: 'editorial', of: [{ type: 'string' }], options: { list: ['Made in Japan', 'Selvedge', 'Vintage', 'Sustainable', 'One-of-a-kind / Limited'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),

    // === CULTURE FILTERS ===
    defineField({ name: 'cultureCategory', title: 'CULTURE: Category', type: 'string', group: 'editorial', options: { list: ['Music / Club', 'Art / Exhibition', 'Film', 'Architecture / Design', 'Festival / Event', 'Books / Magazines'] }, hidden: ({ document }) => document?.pillar !== 'CULTURE' }),
    defineField({ name: 'cultureVibe', title: 'CULTURE: Vibe', type: 'array', group: 'editorial', of: [{ type: 'string' }], options: { list: ['Solo-friendly', 'Date spot', 'Deep / Niche', 'Beginner-friendly', 'English available'] }, hidden: ({ document }) => document?.pillar !== 'CULTURE' }),
    defineField({ name: 'cultureTime', title: 'CULTURE: Time', type: 'string', group: 'editorial', options: { list: ['Daytime', 'Evening', 'Late night'] }, hidden: ({ document }) => document?.pillar !== 'CULTURE' }),

    // === EXPERIENCE FILTERS ===
    defineField({ name: 'experienceCategory', title: 'EXPERIENCE: Category', type: 'string', group: 'editorial', options: { list: ['Neighborhood walk', 'Shopping route', 'Onsen / Sento', 'Day trip', 'Seasonal event', 'Shrine / Temple'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),
    defineField({ name: 'experienceFor', title: 'EXPERIENCE: For', type: 'array', group: 'editorial', of: [{ type: 'string' }], options: { list: ['First time in Japan', 'Repeat visitor', 'Residents', 'Weekend plan', 'Rainy day'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),
    defineField({ name: 'experienceDuration', title: 'EXPERIENCE: Duration', type: 'string', group: 'editorial', options: { list: ['Half day', 'Full day', '1 night 2 days'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),
    defineField({ name: 'experienceSeason', title: 'EXPERIENCE: Season', type: 'string', group: 'editorial', options: { list: ['Spring', 'Summer', 'Autumn', 'Winter', 'Year-round'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),

    // === CRAFT FILTERS ===
    defineField({ name: 'craftCategory', title: 'CRAFT: Category', type: 'string', group: 'editorial', options: { list: ['Denim', 'Sneakers', 'Indigo / Dyeing', 'Ceramics', 'Eyewear', 'Woodwork', 'Leather', 'Textile / Weaving'] }, hidden: ({ document }) => document?.pillar !== 'CRAFT' }),
    defineField({ name: 'craftType', title: 'CRAFT: Type', type: 'string', group: 'editorial', options: { list: ['Factory visit', 'Artisan interview', 'Material explainer', 'Process documentary', 'Buying guide'] }, hidden: ({ document }) => document?.pillar !== 'CRAFT' }),
    defineField({ name: 'craftVisit', title: 'CRAFT: Visit', type: 'string', group: 'editorial', options: { list: ['Open (by reservation)', 'Open (walk-in)', 'Not open (article only)', 'Workshop available'] }, hidden: ({ document }) => document?.pillar !== 'CRAFT' }),

    // === EXISTING LOCATION / CONTACT ===
    defineField({ name: 'locationName', title: 'Location Name', type: 'string', group: 'editorial' }),
    defineField({ name: 'locationNameJa', title: 'Location Name (Japanese)', type: 'string', group: 'editorial' }),
    defineField({ name: 'officialUrl', title: 'Official Website', type: 'url', group: 'editorial' }),
    defineField({ name: 'googleMapsUrl', title: 'Google Maps URL', type: 'url', group: 'editorial' }),
    defineField({ name: 'tabelogUrl', title: 'Tabelog URL', type: 'url', group: 'editorial' }),
    defineField({ name: 'address', title: 'Address', type: 'string', group: 'editorial' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'editorial', description: '電話番号 (国番号なしでOK: 例 03-1234-5678)' }),
    defineField({ name: 'hours', title: 'Hours', type: 'string', group: 'editorial', description: '営業時間 (例: 11:30–14:00 / 18:00–22:00, 月休)' }),
    defineField({ name: 'websiteUrl', title: 'Website URL', type: 'url', group: 'editorial', description: 'Independent website (officialUrl と同義 — 新規エディタが書き込む先)' }),
    defineField({ name: 'referenceUrls', title: 'Reference URLs', type: 'array', group: 'editorial', of: [{ type: 'url' }], description: '参考URL (Instagram, EC, YouTube など)' }),

    // === JAPANESE ABROAD SERIES ===
    defineField({
      name: 'isJapaneseAbroad',
      title: 'Japanese Abroad series',
      type: 'boolean',
      group: 'editorial',
      initialValue: false,
      description: 'Check this for articles about Japanese restaurants or Japanese-brand shops located outside Japan.',
    }),
    defineField({
      name: 'city',
      title: 'City (abroad)',
      type: 'string',
      group: 'editorial',
      description: 'e.g. "London", "Paris", "New York". Leave empty for Japan articles.',
      hidden: ({ document }) => !document?.isJapaneseAbroad,
    }),
    defineField({
      name: 'country',
      title: 'Country (abroad)',
      type: 'string',
      group: 'editorial',
      description: 'e.g. "UK", "France", "USA". Leave empty for Japan articles.',
      hidden: ({ document }) => !document?.isJapaneseAbroad,
    }),
    defineField({
      name: 'priceRange',
      title: 'EAT: Price Range (high-end tiers)',
      type: 'string',
      group: 'editorial',
      options: { list: ['~¥10,000', '¥10,000~¥30,000', '¥30,000~¥50,000', '¥50,000~'] },
      hidden: ({ document }) => document?.pillar !== 'EAT',
      description: '高級店向けの価格帯。カジュアルな店舗は eatPriceRange を使用。',
    }),

    // === BRAND MENTIONS (NEW) ===
    defineField({
      name: 'brandMentions',
      title: 'Brand Mentions (Blues Inc. / KAKEHASHI)',
      type: 'array',
      group: 'editorial',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'KURO', value: 'kuro' },
              { title: 'VONN', value: 'vonn' },
              { title: 'THE BLUE STORE', value: 'the_blue_store' },
              { title: 'AIZOME REWEAR', value: 'aizome_rewear' },
              { title: 'LYNARC', value: 'lynarc' },
              { title: 'PRAS', value: 'pras' },
              { title: 'INDIO & SELVEDGE', value: 'indio_selvedge' },
              { title: 'THE UNION', value: 'the_union' },
              { title: 'Rylee+Cru', value: 'rylee_cru' },
              { title: 'Quincy Mae', value: 'quincy_mae' },
              { title: 'Noralee', value: 'noralee' },
              { title: 'CRT Jeans & Sports', value: 'crt' },
            ],
          },
        },
      ],
      description: 'Brands with a disclosure-relevant relationship to The Editor. Feeds the auto-generated disclosure block.',
    }),
    defineField({
      name: 'brandMentionLevel',
      title: 'Brand Mention Level',
      type: 'number',
      group: 'editorial',
      options: {
        list: [
          { title: 'Level 0: no mention', value: 0 },
          { title: 'Level 1: contextual mention (no disclosure)', value: 1 },
          { title: 'Level 2: parallel listing (brief disclosure)', value: 2 },
          { title: 'Level 3: subject of article (full disclosure required)', value: 3 },
        ],
        layout: 'radio',
      },
      initialValue: 0,
      description: 'If brandMentions is non-empty, choose Level 1 or higher.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as { brandMentions?: unknown[] } | undefined;
          const mentions = doc?.brandMentions;
          if (Array.isArray(mentions) && mentions.length > 0 && (typeof value !== 'number' || value < 1)) {
            return 'Articles with brand mentions require Level 1 or higher.';
          }
          return true;
        }),
    }),

    // === STATUS / WORKFLOW ===
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'editorial',
      options: { list: ['draft', 'review', 'published', 'scheduled'], layout: 'radio' },
      initialValue: 'draft',
      description: 'draft / review はサイト側のクエリでフィルタされ公開ページには表示されません。published のみ表示されます。既存記事は status 未設定として扱われ、自動的に公開状態になります。',
    }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime', group: 'editorial' }),
    defineField({ name: 'scheduledAt', title: 'Scheduled Publish At', type: 'datetime', group: 'editorial', description: '予約公開日時。この時刻になると自動で published に切り替わります。' }),
    defineField({ name: 'sourceType', title: 'Source Type', type: 'string', group: 'editorial', options: { list: ['kentaro-initiated', 'ai-curated'] } }),

    // === SEO / AEO ===
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo', description: '検索結果に表示されるタイトル（空なら title を使用）' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', group: 'seo', rows: 3, description: 'メタディスクリプション（120〜160文字推奨）' }),
    defineField({
      name: 'answerBlock',
      title: 'Answer Block (30-80 words)',
      type: 'text',
      group: 'seo',
      rows: 4,
      description: 'AEO向け冒頭サマリー。記事の本質を 30-80 語で要約（Editorial 記事は必須）。',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as { articleType?: string } | undefined;
          if (doc?.articleType === 'editorial') {
            if (!value || typeof value !== 'string' || !value.trim()) {
              return 'Editorial articles require an Answer Block.';
            }
            const wc = value.trim().split(/\s+/).filter(Boolean).length;
            if (wc < 30) return `Answer Block needs at least 30 words (currently ${wc}).`;
            if (wc > 80) return `Answer Block must be 80 words or fewer (currently ${wc}).`;
          }
          return true;
        }),
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      group: 'seo',
      of: [
        {
          type: 'object',
          name: 'faq',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required().min(10).max(200),
            },
            {
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required().min(20).max(500),
            },
          ],
          preview: { select: { title: 'question' } },
        },
      ],
      description: 'Feeds the FAQPage JSON-LD on the article page. Editorial articles require at least one FAQ.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as { articleType?: string } | undefined;
          if (doc?.articleType === 'editorial') {
            if (!Array.isArray(value) || value.length < 1) {
              return 'Editorial articles require at least one FAQ.';
            }
          }
          return true;
        }),
    }),

    // === SYSTEM (read-only / hidden) ===
    defineField({
      name: 'disclosure',
      title: 'Disclosure (auto-generated)',
      type: 'text',
      group: 'system',
      rows: 5,
      readOnly: true,
      description: 'Auto-generated downstream from brandMentions + brandMentionLevel. Do not edit by hand.',
    }),
    defineField({
      name: 'aiGenerationScore',
      title: 'AI Generation Score',
      type: 'object',
      group: 'system',
      readOnly: true,
      fields: [
        { name: 'overall', title: 'Overall Score (0-100)', type: 'number' },
        { name: 'properNounDensity', title: 'Proper Noun Density', type: 'number' },
        { name: 'specificNumbers', title: 'Specific Numbers Count', type: 'number' },
        { name: 'sensoryConcreteness', title: 'Sensory Concreteness', type: 'number' },
        { name: 'personalBias', title: 'Personal Bias', type: 'number' },
        { name: 'rhythmVariation', title: 'Rhythm Variation', type: 'number' },
        { name: 'evaluatedAt', title: 'Evaluated At', type: 'datetime' },
        { name: 'passed', title: 'Passed Threshold', type: 'boolean' },
      ],
      description: 'AI-generation score. Populated automatically by Part 6 scoring pipeline.',
    }),
    defineField({
      name: 'hasForbiddenMarkers',
      title: 'Has Forbidden Markers',
      type: 'boolean',
      group: 'system',
      hidden: true,
      initialValue: false,
      description: 'True if body contains [NEEDS VERIFICATION] / [TODO] / etc. Used as a publish block.',
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'pillar', media: 'heroImage' } },
});

/**
 * Ephemeral session state for the LINE bot's templated multi-turn flow.
 *
 * One document per LINE user (id deterministically derived from
 * userId in app/api/line-webhook/route.ts so reads are O(1) by id).
 * Lifecycle: created when the user sends a photo → updated as they
 * answer pillar-specific questions → deleted once the article is
 * generated. Stale sessions can be cleaned with a Studio query.
 */
const lineSession = defineType({
  name: 'lineSession',
  title: 'LINE Session (ephemeral)',
  type: 'document',
  fields: [
    defineField({ name: 'userId', title: 'LINE User ID', type: 'string' }),
    defineField({
      name: 'state',
      title: 'State',
      type: 'string',
      options: { list: ['awaiting-pillar', 'collecting'] },
    }),
    defineField({
      name: 'pillar',
      title: 'Pillar',
      type: 'string',
      options: { list: ['FASHION', 'EAT', 'CULTURE', 'EXPERIENCE', 'CRAFT', 'FAMILY'] },
    }),
    defineField({
      name: 'answers',
      title: 'Collected text answers',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'imageAsset',
      title: 'Pending photo',
      type: 'image',
      description: 'Uploaded immediately on receipt; promoted to article.heroImage when the session resolves.',
    }),
    defineField({ name: 'googleMapsUrl', type: 'url' }),
    defineField({ name: 'tabelogUrl', type: 'url' }),
    defineField({ name: 'officialUrl', type: 'url' }),
    defineField({ name: 'updatedAt', type: 'datetime' }),
  ],
  preview: { select: { title: 'userId', subtitle: 'state' } },
});

/**
 * Inbox of unprocessed ideas captured from LINE / web. Each
 * stockpile holds the raw text + uploaded photos that LINE Bot or
 * the editor dashboard collected. The /editor app lists these in
 * the "ネタ帳" tab and uses one as the seed for AI article
 * generation. After translate-and-save promotes a stockpile into a
 * draft article, its `status` flips to "used" so it drops off the
 * inbox.
 */
const stockpile = defineType({
  name: 'stockpile',
  title: 'Stockpile (ネタ帳)',
  type: 'document',
  fields: [
    defineField({ name: 'memo', title: 'Memo', type: 'text', rows: 6 }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'receivedAt', title: 'Received At', type: 'datetime' }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: { list: ['line', 'web'] },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['new', 'used'], layout: 'radio' },
      initialValue: 'new',
    }),
    defineField({ name: 'googleMapsUrl', title: 'Google Maps URL', type: 'url' }),
    defineField({ name: 'tabelogUrl', title: 'Tabelog URL', type: 'url' }),
    defineField({ name: 'lineUserId', title: 'LINE User ID (audit only)', type: 'string' }),
  ],
  preview: {
    select: { title: 'memo', subtitle: 'status', media: 'images.0' },
    prepare({ title, subtitle, media }) {
      return {
        title: (title as string)?.slice(0, 60) || '(no memo)',
        subtitle,
        media,
      };
    },
  },
});

const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'image' }),
    defineField({ name: 'takenAt', title: 'Taken At', type: 'datetime' }),
    defineField({ name: 'latitude', title: 'Latitude', type: 'number' }),
    defineField({ name: 'longitude', title: 'Longitude', type: 'number' }),
    defineField({ name: 'placeName', title: 'Place Name', type: 'string' }),
    defineField({ name: 'placeNameJa', title: 'Place Name (JA)', type: 'string' }),
    defineField({ name: 'googlePlaceId', title: 'Google Place ID', type: 'string' }),
    defineField({ name: 'area', title: 'Area', type: 'string' }),
    defineField({ name: 'groupId', title: 'Group ID', type: 'string' }),
    defineField({ name: 'cameraModel', title: 'Camera Model', type: 'string' }),
    defineField({ name: 'isRecommended', title: 'AI Recommended', type: 'boolean', initialValue: false }),
    defineField({ name: 'uploadedAt', title: 'Uploaded At', type: 'datetime' }),
    defineField({ name: 'source', title: 'Source', type: 'string', options: { list: ['library', 'line', 'input'] } }),
    defineField({ name: 'usedInArticle', title: 'Used In Article', type: 'reference', to: [{ type: 'article' }] }),
    defineField({ name: 'fileSize', title: 'File Size', type: 'number' }),
  ],
  preview: {
    select: { title: 'placeName', subtitle: 'area', media: 'image' },
    prepare({ title, subtitle, media }) {
      return { title: title || '(unnamed)', subtitle: subtitle || '', media };
    },
  },
});

export const schemaTypes = [article, lineSession, stockpile, photo];
