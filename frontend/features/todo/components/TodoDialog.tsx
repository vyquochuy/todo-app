"use client";

import type { Todo } from "@todo-app/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TodoForm } from "./TodoForm";

// ── Types ─────────────────────────────────────────────────────

type TodoDialogProps =
  | { mode: "create"; todo?: never; open: boolean; onOpenChange: (open: boolean) => void }
  | { mode: "edit"; todo: Todo; open: boolean; onOpenChange: (open: boolean) => void };

// ── Component ─────────────────────────────────────────────────

/**
 * Modal dialog wrapper for the TodoForm.
 *
 * Handles the open/close state and closes automatically
 * when the form submits successfully.
 */
export function TodoDialog({ mode, todo, open, onOpenChange }: TodoDialogProps) {
  const handleSuccess = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add new task" : "Edit task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details below to create a new task."
              : "Update the task details below."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <TodoForm mode="create" onSuccess={handleSuccess} />
        ) : (
          <TodoForm mode="edit" todo={todo} onSuccess={handleSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}
