import { client } from '../../../lib/sanity';
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import Link from 'next/link';

const INDIGO = "#1B3A5C";
const CHARCOAL = "#2D2D2D";
const WARM_GRAY = "#A39E93";
const OFF_WHITE = "#F8F6F1";
const CREAM = "#F0EDE6";

async function getArticle(slug: string) {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id, title, "slug": slug.current, pillar, subtitle, 
    "heroImage": heroImage.asset->url, heroCaption, 
    body, locationName, locationNameJa, tags, readTime, 
    publishedAt, sourceType
  }`;
  return client.fetch(query, { slug });
}

async function getRelatedArticles(pillar: string, currentId: string) {
  const query = `*[_type == "article" && pillar == $pillar && _id != $currentId] | order(publishedAt desc) [0...3] {
    _id, title, "slug": slug.current, pillar, subtitle,
    "heroImage": heroImage.asset->url, readTime, publishedAt
  }`;
  return client.fetch(query, { pillar, currentId });
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function pillarColor(pillar: string) {
  const colors: Record<string, string> = {
    FASHION: '#1B3A5C',
    EAT: '#8B4513',
    CULTURE: '#6B2D5B',
    EXPERIENCE: '#2D5B3A',
    CRAFT: '#5B4B2D',
  };
  return colors[pillar?.toUpperCase()] || INDIGO;
}

const fallbackImage = "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=80";

// Portable Text components for rich text rendering
const ptComponents = {
  block: {
    normal: ({ children }: any) => (
      <p style={{
        fontFamily: "'Source Serif 4', 'Noto Serif JP', Georgia, serif",
        fontSize: '1.125rem',
        lineHeight: 1.85,
        color: CHARCOAL,
        marginBottom: '1.5rem',
      }}>{children}</p>
    ),
    h2: ({ children }: any) => (
      <h2 style={{
        fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif",
        fontSize: '1.75rem',
        fontWeight: 600,
        color: CHARCOAL,
        marginTop: '3rem',
        marginBottom: '1rem',
        letterSpacing: '-0.01em',
      }}>{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 style={{
        fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif",
        fontSize: '1.35rem',
        fontWeight: 600,
        color: CHARCOAL,
        marginTop: '2.5rem',
        marginBottom: '0.75rem',
      }}>{children}</h3>
    ),
    blockquote: ({ children }: any) => (
      <blockquote style={{
        borderLeft: `3px solid ${INDIGO}`,
        paddingLeft: '1.5rem',
        margin: '2rem 0',
        fontStyle: 'italic',
        color: WARM_GRAY,
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: '1.15rem',
        lineHeight: 1.7,
      }}>{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong style={{ fontWeight: 600, color: CHARCOAL }}>{children}</strong>
    ),
    em: ({ children }: any) => (
      <em>{children}</em>
    ),
    link: ({ value, children }: any) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" style={{
        color: INDIGO,
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
      }}>{children}</a>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul style={{
        paddingLeft: '1.5rem',
        marginBottom: '1.5rem',
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: '1.125rem',
        lineHeight: 1.85,
        color: CHARCOAL,
      }}>{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol style={{
        paddingLeft: '1.5rem',
        marginBottom: '1.5rem',
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: '1.125rem',
        lineHeight: 1.85,
        color: CHARCOAL,
      }}>{children}</ol>
    ),
  },
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(article.pillar || 'FASHION', article._id);

  // If body is a string (not Portable Text), render as paragraphs
  const isPlainText = typeof article.body === 'string';

  return (
    <div style={{ background: OFF_WHITE, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(248,246,241,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${CREAM}`,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: "'DM Sans', 'Noto Sans JP', sans-serif",
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: CHARCOAL,
              }}>TONE<span style={{ color: INDIGO }}>TOKYO</span></span>
              <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '0.55rem',
                color: WARM_GRAY,
                letterSpacing: '0.1em',
              }}>音 東京</span>
            </div>
          </Link>
          <Link href="/" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            color: WARM_GRAY,
            textDecoration: 'none',
          }}>
            BACK
          </Link>
        </div>
      </header>

      {/* Hero Image */}
      <div style={{
        width: '100%',
        height: '60vh',
        minHeight: 400,
        maxHeight: 650,
        position: 'relative',
        overflow: 'hidden',
        marginTop: 52,
      }}>
        <img
          src={article.heroImage || fallbackImage}
          alt={article.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
        }} />
        {article.heroCaption && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            right: 16,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.02em',
          }}>
            {article.heroCaption}
          </div>
        )}
      </div>

      {/* Article Content */}
      <article style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '3rem 24px 4rem',
      }}>
        {/* Pillar + Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: '1.25rem',
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: pillarColor(article.pillar),
            textTransform: 'uppercase',
          }}>{article.pillar}</span>
          <span style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: WARM_GRAY,
          }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.75rem',
            color: WARM_GRAY,
          }}>
            {formatDate(article.publishedAt)}
          </span>
          {article.readTime && (
            <>
              <span style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: WARM_GRAY,
              }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.75rem',
                color: WARM_GRAY,
              }}>
                {article.readTime}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif",
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 700,
          lineHeight: 1.2,
          color: CHARCOAL,
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}>
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: '1.2rem',
            lineHeight: 1.5,
            color: WARM_GRAY,
            marginBottom: '2rem',
          }}>
            {article.subtitle}
          </p>
        )}

        {/* Author line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingBottom: '2rem',
          marginBottom: '2rem',
          borderBottom: `1px solid ${CREAM}`,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: INDIGO,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fff',
          }}>T</div>
          <div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 600,
              color: CHARCOAL,
            }}>The Editor</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.7rem',
              color: WARM_GRAY,
            }}>TONE TOKYO</div>
          </div>
        </div>

        {/* Location */}
        {article.locationName && (
          <div style={{
            background: CREAM,
            padding: '14px 18px',
            borderRadius: 8,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: '1rem' }}>📍</span>
            <div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 500,
                color: CHARCOAL,
              }}>{article.locationName}</span>
              {article.locationNameJa && (
                <span style={{
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: '0.75rem',
                  color: WARM_GRAY,
                  marginLeft: 8,
                }}>{article.locationNameJa}</span>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div>
          {isPlainText ? (
            // Plain text body — split into paragraphs
            article.body.split('\n').filter((p: string) => p.trim()).map((paragraph: string, i: number) => (
              <p key={i} style={{
                fontFamily: "'Source Serif 4', 'Noto Serif JP', Georgia, serif",
                fontSize: '1.125rem',
                lineHeight: 1.85,
                color: CHARCOAL,
                marginBottom: '1.5rem',
              }}>{paragraph}</p>
            ))
          ) : article.body ? (
            // Portable Text body
            <PortableText value={article.body} components={ptComponents} />
          ) : (
            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: '1.125rem',
              lineHeight: 1.85,
              color: WARM_GRAY,
              fontStyle: 'italic',
            }}>Full article coming soon.</p>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: `1px solid ${CREAM}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            {article.tags.map((tag: string, i: number) => (
              <span key={i} style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
                color: WARM_GRAY,
                background: CREAM,
                padding: '6px 12px',
                borderRadius: 4,
              }}>{tag}</span>
            ))}
          </div>
        )}
      </article>

      {/* Related Articles */}
      {related && related.length > 0 && (
        <section style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px 5rem',
        }}>
          <div style={{
            borderTop: `1px solid ${CREAM}`,
            paddingTop: '3rem',
          }}>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              color: WARM_GRAY,
              textTransform: 'uppercase',
              marginBottom: '2rem',
            }}>More in {article.pillar}</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {related.map((r: any) => (
                <Link key={r._id} href={`/article/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease',
                  }}>
                    <img
                      src={r.heroImage || fallbackImage}
                      alt={r.title}
                      style={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                      }}
                    />
                    <div style={{ padding: '16px 18px 20px' }}>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        color: pillarColor(r.pillar),
                        textTransform: 'uppercase',
                      }}>{r.pillar}</span>
                      <h3 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: CHARCOAL,
                        marginTop: 6,
                        lineHeight: 1.35,
                      }}>{r.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${CREAM}`,
        padding: '2rem 24px',
        textAlign: 'center',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: CHARCOAL,
          }}>TONE<span style={{ color: INDIGO }}>TOKYO</span></span>
        </Link>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.7rem',
          color: WARM_GRAY,
          marginTop: 8,
        }}>&copy; 2026</p>
      </footer>
    </div>
  );
}
