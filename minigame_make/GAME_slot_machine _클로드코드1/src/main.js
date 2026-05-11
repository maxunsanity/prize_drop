import { GameData } from './data.js';
import { Game }     from './game.js';

document.addEventListener('DOMContentLoaded', async () => {
  await GameData.loadData();
  Game.init();

  document.getElementById('btn-bet').addEventListener('click',       () => Game.changeBet());
  document.getElementById('btn-spin').addEventListener('click',      () => Game.spin());
  document.getElementById('btn-add-coins').addEventListener('click', () => Game.addDebugCoins());
});
