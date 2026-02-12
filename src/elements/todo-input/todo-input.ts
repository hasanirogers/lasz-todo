import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ZustandController } from '../../controllers/zustand';
import todoStore from '../../stores/todo';
import styles from './todo-input.css?inline';

@customElement('todo-input')
export class TodoInput extends LitElement {
  static styles = [unsafeCSS(styles)];

  // use zustand controller to automate subcribe/unsubscribe which prevents memory leaks
  @state()
  private todoState = new ZustandController(
    this,
    todoStore,
    () => ({}), // only select what you use, in our case we use nothing here
    (state) => ({ add: state.addTodo }) // addToto becomes "add" in actions via the reactive controller
  );

  @property()
  label: string = 'Add';

  @query('input')
  todoInput!: HTMLInputElement;

  render() {
    return html`
      <input />
      <button @click=${() => this.handleClick()}>${this.label}</button>
    `;
  }

  private handleClick() {
    this.todoState.actions &&
      this.todoState.actions.add({
        value: this.todoInput.value,
        checked: false,
      });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'todo-input': TodoInput;
  }
}
