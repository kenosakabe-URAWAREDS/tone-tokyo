import { defineType, defineField } from 'sanity';

const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: 'pillar', title: 'Pillar', type: 'string', options: { list: ['FASHION', 'EAT', 'CULTURE', 'EXPERIENCE', 'CRAFT'] }, validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 3 }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'heroCaption', title: 'Hero Caption', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }, { type: 'image', options: { hotspot: true }, fields: [{ name: 'caption', type: 'string', title: 'Caption' }, { name: 'alt', type: 'string', title: 'Alt Text' }] }] }),
    defineField({ name: 'locationName', title: 'Location Name', type: 'string' }),
    defineField({ name: 'locationNameJa', title: 'Location Name (Japanese)', type: 'string' }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'readTime', title: 'Read Time', type: 'string' }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'sourceType', title: 'Source Type', type: 'string', options: { list: ['kentaro-initiated', 'ai-curated'] } }),
  ],
  preview: { select: { title: 'title', subtitle: 'pillar', media: 'heroImage' } },
});

export const schemaTypes = [article];
