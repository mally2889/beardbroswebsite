import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const INCLUDE_RE = /<!--\s*@include\s+([^\s]+)\s*-->/g;

/**
 * Replaces <!--@include partials/foo.html--> tokens with the contents of
 * src/<path>, resolved relative to the project root. Runs identically for
 * `vite` (dev) and `vite build` via the transformIndexHtml hook.
 */
export function htmlPartials(root) {
  const srcDir = resolve(root, 'src');

  function inject(html) {
    return html.replace(INCLUDE_RE, (match, relPath) => {
      const filePath = resolve(srcDir, relPath);
      if (!existsSync(filePath)) {
        throw new Error(`html-partials: include not found: ${relPath}`);
      }
      return readFileSync(filePath, 'utf-8');
    });
  }

  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return inject(html);
      },
    },
    configureServer(server) {
      server.watcher.add(resolve(srcDir, 'partials'));
      server.watcher.on('change', (file) => {
        if (file.startsWith(resolve(srcDir, 'partials'))) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
