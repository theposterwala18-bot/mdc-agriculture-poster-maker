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
        "universal-poster": resolve(projectRoot, "dist/universal-poster.html"),
        "owner-dashboard": resolve(projectRoot, "dist/owner-dashboard.html"),
        "smart-image-studio": resolve(projectRoot, "dist/smart-image-studio.html"),
        "tools": resolve(projectRoot, "dist/tools.html"),
        "pdf-tools": resolve(projectRoot, "dist/pdf-tools.html"),
        "passport-photo": resolve(projectRoot, "dist/passport-photo.html"),
        "card-page-maker": resolve(projectRoot, "dist/card-page-maker.html"),
        "resume-maker": resolve(projectRoot, "dist/resume-maker.html"),
        "image-format-converter": resolve(projectRoot, "dist/image-format-converter.html"),
        "ai-upscale": resolve(projectRoot, "dist/ai-upscale.html")
      }
    }
  }
};
