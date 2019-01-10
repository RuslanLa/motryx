import { observable, autoRun, action } from "../observable";

interface Food {
  calorie: number;
  effect?: number;
}

export class Monkey {
  @observable
  fullness: number = 0;

  @observable
  health: number = 100;

  @action
  feed = (food: Food) => {
    this.fullness += food.calorie;
    let effect = food.effect == null ? 0 : food.effect;
    if (effect != 0) {
      this.changeHealth(effect);
    }
  };

  @action
  live = () => {
    this.changeFullness(-10);
    if (this.fullness > 0 || this.fullness <= 100) {
      this.changeHealth(-10);
    }
  };

  @action
  private changeFullness = (value: number) => {
    this.fullness += value;
    this.fullness = this.fullness > 0 ? this.fullness : 0;
    if (this.fullness >= 100) {
      this.changeHealth(-(this.fullness - 100) % 3);
    }
  };

  @action
  private changeHealth = (value: number) => {
    let health = this.health + value;
    if (health < 0) {
      health = 0;
    }

    if (health > 100) {
      health = 100;
    }
    this.health = health;
  };
}
