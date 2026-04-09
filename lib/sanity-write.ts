import { createClient } from 'next-sanity';

/**
 * Server-only Sanity client with the write token. Centralized so the
 * /editor APIs and the legacy create-article route share one
 * configuration. Never import this in client components.
 */
export const sanityWrite = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});
