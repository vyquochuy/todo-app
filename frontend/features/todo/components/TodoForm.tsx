"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Todo } from "@todo-app/shared";
import { createTodoSchema, updateTodoSchema } from "@todo-app/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTodo, useUpdateTodo } from "../hooks/useTodos";

// ── Types ─────────────────────────────────────────────────────

type CreateFormValues = z.infer<typeof createTodoSchema>;
type UpdateFormValues = z.infer<typeof updateTodoSchema>;

type TodoFormProps =
  | { mode: "create"; todo?: never; onSuccess: () => void }
  | { mode: "edit"; todo: Todo; onSuccess: () => void };

// ── Component ─────────────────────────────────────────────────

/**
 * Unified form for creating and editing todos.
 *
 * Uses the shared Zod schemas for validation — same rules as backend.
 * Discriminated union props ensure `todo` is required in edit mode.
 */
export function TodoForm({ mode, todo, onSuccess }: TodoFormProps) {
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();

  const schema = mode === "create" ? createTodoSchema : updateTodoSchema;
  const isPending =
    mode === "create" ? createTodo.isPending : updateTodo.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && todo
        ? {
            title: todo.title,
            description: todo.description ?? "",
          }
        : {
            title: "",
            description: "",
          },
  });

  // Focus the title field when the form mounts
  useEffect(() => {
    setFocus("title");
  }, [setFocus]);

  // Reset to latest todo values when switching between edit targets
  useEffect(() => {
    if (mode === "edit" && todo) {
      reset({ title: todo.title, description: todo.description ?? "" });
    }
  }, [todo, mode, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      createTodo.mutate(values as CreateFormValues, { onSuccess });
    } else {
      updateTodo.mutate(
        { id: todo.id, input: values as UpdateFormValues },
        { onSuccess },
      );
    }
  });

  return (
    <form id="todo-form" onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="todo-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="todo-title"
          placeholder="e.g. Finish the project report"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          {...register("title")}
        />
        {errors.title && (
          <p id="title-error" className="text-xs text-destructive" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="todo-description">
          Description{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Textarea
          id="todo-description"
          placeholder="Add more details about this task…"
          rows={3}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "desc-error" : undefined}
          {...register("description")}
        />
        {errors.description && (
          <p id="desc-error" className="text-xs text-destructive" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          id="todo-form-submit"
          type="submit"
          disabled={isPending || (mode === "edit" && !isDirty)}
        >
          {isPending
            ? mode === "create"
              ? "Adding…"
              : "Saving…"
            : mode === "create"
              ? "Add task"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
