import { resolve } from "node:path";

const projectRoot = process.cwd();

export default {
  root: resolve(projectRoot, "dist"),
  build: {
    outDir: resolve(projectRoot, "preview-build"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "dist/index.html"),
        "general-sale": resolve(projectRoot, "dist/general-sale.html"),
        "death-bhog": resolve(projectRoot, "dist/death-bhog.html"),
        "universal-poster": resolve(projectRoot, "dist/universal-poster.html")
      }
    }
  }
};
