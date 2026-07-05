"use client";

import type { Todo } from "@todo-app/shared";
import { AnimatePresence } from "framer-motion";
import { TodoCard } from "./TodoCard";

interface TodoListProps {
  todos: Todo[];
  onEditClick: (todo: Todo) => void;
}

/**
 * Renders the list of todo cards with AnimatePresence so that
 * items animate out smoothly when deleted.
 */
export function TodoList({ todos, onEditClick }: TodoListProps) {
  return (
    <div className="space-y-2.5" role="list" aria-label="Todo list">
      <AnimatePresence mode="popLayout" initial={false}>
        {todos.map((todo) => (
          <div key={todo.id} role="listitem">
            <TodoCard todo={todo} onEditClick={onEditClick} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
