class Todo {
  constructor(data, selector) {
    this._data = data;
    this._templateElement = document.querySelector(selector);
  }

  _setEventListeners() {
    this._todoDeleteBtn.addEventListener("click", () => {
      this._todoElement.remove();
    });

    this._todoCheckboxEl.addEventListener("change", () => {
      this._todoNameEl.style.textDecoration = this._todoCheckboxEl.checked
        ? "line-through"
        : "none";
      this._data.completed = this._todoCheckboxEl.checked;
    });
  }

  _generateCheckboxEl() {
    this._todoCheckboxEl.checked = this._data.completed;
    this._todoCheckboxEl.id = `todo-${this._data.id}`;
    this._todoLabel.setAttribute("for", `todo-${this._data.id}`);
  }

  getView() {
    this._todoElement = this._templateElement.content
      .querySelector(".todo")
      .cloneNode(true);
    this._todoNameEl = this._todoElement.querySelector(".todo__name");
    this._todoCheckboxEl = this._todoElement.querySelector(".todo__completed");
    this._todoLabel = this._todoElement.querySelector(".todo__label");
    this._todoDeleteBtn = this._todoElement.querySelector(".todo__delete-btn");
    this._todoDate = this._todoElement.querySelector(".todo__date");
    this._todoNameEl.textContent = this._data.name;
    this._generateCheckboxEl();
    this._todoNameEl.style.textDecoration = this._todoCheckboxEl.checked
      ? "line-through"
      : "none";

    // If a due date has been set, parsing this it with `new Date` will return a
    // number. If so, we display a string version of the due date in the todo.
    this._dueDate = new Date(this._data.date);
    if (!isNaN(this._dueDate)) {
      this._todoDate.textContent = `Due: ${this._dueDate.toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      )}`;
    }

    this._setEventListeners();

    return this._todoElement;
  }
}

export default Todo;
