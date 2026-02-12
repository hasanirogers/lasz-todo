import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ZustandController } from '../../controllers/zustand';
import todoStore, { type ITodoItem } from '../../stores/todo';
import styles from './todo-list.css?inline';

@customElement('todo-list')
export class TodoList extends LitElement {
  static styles = [unsafeCSS(styles)];

  // use zustand controller to automate subcribe/unsubscribe which prevents memory leaks
  @state()
  private todoState = new ZustandController(
    this,
    todoStore,
    (state) => ({ list: state.todoList }),
    (state) => ({ 
      remove: state.removeTodo,
      toggle: state.todoToggle
     }) 
  );

  // @property()
  // todos: ITodoItem[] = this.todoState.todoList;

  render() {
    return this.makeTodos();
  }

  makeTodos() {
    if (this.todoState.data.list && this.todoState.data.list.length > 0) {
      const todoList = this.todoState.data.list.map((todo: ITodoItem, index: number) => html`
        <li>
          <button class="todo ${todo.checked ? 'checked' : ''}" @click=${() => this.handleChecked(index)}>${todo.value}</button>
          <button class="close" @click=${() => this.handleRemoveTodo(index)}>&times;</button>
        </li>
      `);
      return html`<ul>${todoList}</ul>`;
    }
    return html`<p>You haven't added any items yet.</p>`;
  }

  handleRemoveTodo(index: number) {
    this.todoState.actions && this.todoState.actions.remove(index);
    this.requestUpdate(); // state has been modified by lodash, so re-render
  }

  handleChecked(index: number) {
    this.todoState.actions && this.todoState.actions.toggle(index);
    this.requestUpdate(); // state has been modified by lodash, so re-render
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'todo-list': TodoList
  }
}
