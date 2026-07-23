/**
 * Real Instagram posts/reels — client work, embedded live via Instagram's
 * own oEmbed widget (embed.js) rather than self-hosted video files. Keyed
 * by project slug: a project's own Feed post shows its entries, live,
 * below the caption. Projects with no entry here just show the caption —
 * no fallback grid to keep in sync.
 */
export const reelsByProject = {
  'mama-nourish': [
    { url: 'https://www.instagram.com/p/DZKZ5VtNYIW/' },
    { url: 'https://www.instagram.com/p/DY1UwxXNLBj/' },
  ],
};
