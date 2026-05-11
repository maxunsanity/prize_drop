import { loadSectionConfig } from './data.js';
import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', async () => {
  const sections = await loadSectionConfig();
  const canvas = document.getElementById('wheel-canvas');

  Game.init(canvas, sections);

  document.getElementById('btn-spin').addEventListener('click', () => Game.spin());
  document.getElementById('btn-bet').addEventListener('click', () => Game.changeBet());
  document.getElementById('btn-add-tokens').addEventListener('click', () => Game.addTokens());
});
