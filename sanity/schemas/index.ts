import { defineType, defineField } from 'sanity';

const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'titleJa', title: 'Title (Japanese)', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: 'pillar', title: 'Pillar', type: 'string', options: { list: ['FASHION', 'EAT', 'CULTURE', 'EXPERIENCE', 'CRAFT', 'FAMILY'] }, validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 3 }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'heroCaption', title: 'Hero Caption', type: 'string' }),
    defineField({ name: 'heroImageUrl', title: 'Hero Image URL', type: 'url' }),
    defineField({ name: 'gallery', title: 'Gallery', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }, { type: 'image', options: { hotspot: true }, fields: [{ name: 'caption', type: 'string', title: 'Caption' }, { name: 'alt', type: 'string', title: 'Alt Text' }] }] }),
    defineField({
      name: 'bodyJa',
      title: 'Body (Japanese / 日本語本文)',
      type: 'text',
      rows: 10,
      description: '記事内容を日本語で確認・編集するためのフィールド。ここを編集すると英語本文の更新基準になります（/input ページの「翻訳して更新」から body を上書きできます）。',
    }),

    // === COMMON FILTERS ===
    defineField({ name: 'area', title: 'Area (Prefecture)', type: 'string', options: { list: ['Tokyo', 'Osaka', 'Kyoto', 'Fukuoka', 'Okayama', 'Kurume', 'Hokkaido', 'Okinawa', 'Nagoya', 'Kobe', 'Other'] } }),
    defineField({ name: 'neighborhood', title: 'Neighborhood', type: 'string' }),
    defineField({ name: 'editorRating', title: "The Editor's Rating", type: 'number', options: { list: [1, 2, 3] }, description: '1=Worth a Visit, 2=Highly Recommended, 3=Must Go' }),

    // === EAT FILTERS ===
    defineField({ name: 'eatGenre', title: 'EAT: Genre', type: 'string', options: { list: ['Ramen', 'Sushi', 'Yakitori', 'Yakiniku', 'Curry', 'Soba / Udon', 'Italian', 'French', 'Chinese', 'Cafe', 'Bar', 'Izakaya', 'Bakery', 'Sweets', 'Other'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'bookingDifficulty', title: 'EAT: Booking Difficulty', type: 'string', options: { list: ['Walk-in OK', 'Easy to book', 'Book ahead', 'Hard to get'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'drinks', title: 'EAT: Drinks', type: 'array', of: [{ type: 'string' }], options: { list: ['Sake', 'Natural Wine', 'Craft Beer', 'Whisky / Bourbon', 'Cocktails', 'Shochu / Awamori', 'Non-alcohol', 'No drinks (food only)'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'scene', title: 'EAT: Scene', type: 'array', of: [{ type: 'string' }], options: { list: ['Solo dining', 'Date', 'Business dinner', 'Friends', 'Late night (after 22:00)', 'Breakfast / Brunch', 'Takeout', 'Family'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),
    defineField({ name: 'eatPriceRange', title: 'EAT: Price Range', type: 'string', options: { list: ['~¥1,000', '~¥3,000', '~¥5,000', '~¥10,000', '¥10,000+'] }, hidden: ({ document }) => document?.pillar !== 'EAT' }),

    // === FASHION FILTERS ===
    defineField({ name: 'fashionCategory', title: 'FASHION: Category', type: 'string', options: { list: ['Denim', 'Sneakers', 'Outerwear', 'Knitwear', 'Shirts', 'Pants', 'Eyewear', 'Bags', 'Accessories', 'Leather shoes', 'Vintage'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),
    defineField({ name: 'fashionType', title: 'FASHION: Type', type: 'string', options: { list: ['Brand profile', 'Shop guide', 'Collection', 'Buying guide', 'Styling'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),
    defineField({ name: 'articleType', title: 'FASHION: Article Type', type: 'string', options: { list: ['Brand Profile', 'Shop Guide', 'Collection Review', 'Street Style', 'Trend Analysis'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),
    defineField({ name: 'fashionPriceRange', title: 'FASHION: Price Range', type: 'string', options: { list: ['~¥10,000', '~¥30,000', '~¥50,000', '~¥100,000', '¥100,000+'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),
    defineField({ name: 'fashionFeature', title: 'FASHION: Features', type: 'array', of: [{ type: 'string' }], options: { list: ['Made in Japan', 'Selvedge', 'Vintage', 'Sustainable', 'One-of-a-kind / Limited'] }, hidden: ({ document }) => document?.pillar !== 'FASHION' }),

    // === CULTURE FILTERS ===
    defineField({ name: 'cultureCategory', title: 'CULTURE: Category', type: 'string', options: { list: ['Music / Club', 'Art / Exhibition', 'Film', 'Architecture / Design', 'Festival / Event', 'Books / Magazines'] }, hidden: ({ document }) => document?.pillar !== 'CULTURE' }),
    defineField({ name: 'cultureVibe', title: 'CULTURE: Vibe', type: 'array', of: [{ type: 'string' }], options: { list: ['Solo-friendly', 'Date spot', 'Deep / Niche', 'Beginner-friendly', 'English available'] }, hidden: ({ document }) => document?.pillar !== 'CULTURE' }),
    defineField({ name: 'cultureTime', title: 'CULTURE: Time', type: 'string', options: { list: ['Daytime', 'Evening', 'Late night'] }, hidden: ({ document }) => document?.pillar !== 'CULTURE' }),

    // === EXPERIENCE FILTERS ===
    defineField({ name: 'experienceCategory', title: 'EXPERIENCE: Category', type: 'string', options: { list: ['Neighborhood walk', 'Shopping route', 'Onsen / Sento', 'Day trip', 'Seasonal event', 'Shrine / Temple'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),
    defineField({ name: 'experienceFor', title: 'EXPERIENCE: For', type: 'array', of: [{ type: 'string' }], options: { list: ['First time in Japan', 'Repeat visitor', 'Residents', 'Weekend plan', 'Rainy day'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),
    defineField({ name: 'experienceDuration', title: 'EXPERIENCE: Duration', type: 'string', options: { list: ['Half day', 'Full day', '1 night 2 days'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),
    defineField({ name: 'experienceSeason', title: 'EXPERIENCE: Season', type: 'string', options: { list: ['Spring', 'Summer', 'Autumn', 'Winter', 'Year-round'] }, hidden: ({ document }) => document?.pillar !== 'EXPERIENCE' }),

    // === CRAFT FILTERS ===
    defineField({ name: 'craftCategory', title: 'CRAFT: Category', type: 'string', options: { list: ['Denim', 'Sneakers', 'Indigo / Dyeing', 'Ceramics', 'Eyewear', 'Woodwork', 'Leather', 'Textile / Weaving'] }, hidden: ({ document }) => document?.pillar !== 'CRAFT' }),
    defineField({ name: 'craftType', title: 'CRAFT: Type', type: 'string', options: { list: ['Factory visit', 'Artisan interview', 'Material explainer', 'Process documentary', 'Buying guide'] }, hidden: ({ document }) => document?.pillar !== 'CRAFT' }),
    defineField({ name: 'craftVisit', title: 'CRAFT: Visit', type: 'string', options: { list: ['Open (by reservation)', 'Open (walk-in)', 'Not open (article only)', 'Workshop available'] }, hidden: ({ document }) => document?.pillar !== 'CRAFT' }),

    // === EXISTING FIELDS ===
    defineField({ name: 'locationName', title: 'Location Name', type: 'string' }),
    defineField({ name: 'locationNameJa', title: 'Location Name (Japanese)', type: 'string' }),
    defineField({ name: 'officialUrl', title: 'Official Website', type: 'url' }),
    defineField({ name: 'googleMapsUrl', title: 'Google Maps URL', type: 'url' }),
    defineField({ name: 'tabelogUrl', title: 'Tabelog URL', type: 'url' }),
    defineField({ name: 'address', title: 'Address', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', description: '電話番号 (国番号なしでOK: 例 03-1234-5678)' }),
    defineField({
      name: 'priceRange',
      title: 'EAT: Price Range (high-end tiers)',
      type: 'string',
      options: { list: ['~¥10,000', '¥10,000~¥30,000', '¥30,000~¥50,000', '¥50,000~'] },
      hidden: ({ document }) => document?.pillar !== 'EAT',
      description: '高級店向けの価格帯。カジュアルな店舗は eatPriceRange を使用。',
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'readTime', title: 'Read Time', type: 'string' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['draft', 'review', 'published'], layout: 'radio' },
      initialValue: 'draft',
      description: 'draft / review はサイト側のクエリでフィルタされ公開ページには表示されません。published のみ表示されます。既存記事は status 未設定として扱われ、自動的に公開状態になります。',
    }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'sourceType', title: 'Source Type', type: 'string', options: { list: ['kentaro-initiated', 'ai-curated'] } }),
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

export const schemaTypes = [article, lineSession];