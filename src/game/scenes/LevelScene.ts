import Phaser from 'phaser';
import { tickAnimals } from '../sim/systems/animals';
import { tickEconomy } from '../sim/systems/economy';
import { tickPredators } from '../sim/systems/predators';
import { tickProduction } from '../sim/systems/production';
import { createLevelState, stepLevel, type LevelState } from '../sim/state';

/**
 * Level screen. M0 does not start it: the first playable field is M1.
 * The update loop already steps the sim by a single fixed slice so a hidden tab cannot catch up.
 */
export class LevelScene extends Phaser.Scene {
  private state: LevelState = createLevelState();

  constructor() {
    super('Level');
  }

  create(): void {
    this.state = createLevelState();
  }

  override update(_time: number, delta: number): void {
    this.state = stepLevel(this.state, delta);
    this.state = tickEconomy(this.state);
    this.state = tickProduction(this.state);
    this.state = tickAnimals(this.state);
    this.state = tickPredators(this.state);
  }
}
