import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // 상대 경로 — zip 배포 시 index.html 기준으로 asset 참조
});
