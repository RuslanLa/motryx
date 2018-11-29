import { observable, autoRun } from "./observable";

class State {
  @observable
  value: number = 2;
}

const state = new State();
autoRun(() => {
  console.log(state.value);
});

state.value = 3;
setTimeout(() => {
  state.value = 4;
}, 1000);
