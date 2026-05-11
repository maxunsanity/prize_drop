/* src/main.js */
import { GameData, Storage } from './data.js';
import { Mechanics } from './mechanics.js';

async function main() {
  await GameData.loadData();
  const savedState = Storage.load('ht_player_state');
  
  Mechanics.init(savedState);
  
  document.getElementById('reset-btn').addEventListener('click', () => {
    Mechanics.reset();
  });
  
  document.getElementById('cheat-btn').addEventListener('click', () => {
    Mechanics.playerState.pickaxe_count += 100;
    Mechanics.save();
    Mechanics.updateAllUI();
  });
}

main();
