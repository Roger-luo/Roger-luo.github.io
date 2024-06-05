import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import { remarkReadingTime } from "./src/utils/remark-reading-time.mjs";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [
      remarkToc,
      remarkMath,
      remarkReadingTime,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      // theme: "github-dark-default",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  scopedStyleStrategy: "where",
});
