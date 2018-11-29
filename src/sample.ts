import { observable, autoRun, action } from "./observable";

class Person {
  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }
  @observable
  firstName: string | null;

  @observable
  lastName: string | null;

  @observable
  spouse: Person | null = null;

  @action
  marry(spouse: Person, takeLastName: boolean = false) {
    this.spouse = spouse;
    if (takeLastName) {
      this.lastName = spouse.lastName;
    }
  }
}

const state = new Person("Some", "Body");
const secondPerson = new Person("Second", "Person");
const thirdPerson = new Person("Third", "Dude");

let iteration = 0;
autoRun(() => {
  iteration += 1;
  console.log(
    `ITERATION: ${iteration}; firstName = ${state.firstName}; lastName = ${
      state.lastName
    }; spouse=${state.spouse}`
  );
});

state.firstName = "Name";
state.spouse = secondPerson;
state.lastName = secondPerson.lastName;

setTimeout(() => {
  state.marry(thirdPerson, true);
}, 1000);
