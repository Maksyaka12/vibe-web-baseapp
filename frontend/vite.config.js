import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function inlineCss() {
  return {
    name: 'inline-css-plugin',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx || !ctx.bundle) return html;
        const tags = [];
        for (const [fileName, file] of Object.entries(ctx.bundle)) {
          if (fileName.endsWith('.css') && file.type === 'asset' && file.source) {
            tags.push({
              tag: 'style',
              attrs: { 'data-inlined-css': fileName },
              children: typeof file.source === 'string' ? file.source : file.source.toString(),
              injectTo: 'head',
            });
          }
        }
        return tags;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCss()],
})
