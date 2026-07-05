"use client";

import type { Todo } from "@todo-app/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Edit2, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteTodo, useToggleTodo } from "../hooks/useTodos";
import { formatTodoDate } from "@/lib/utils";

interface TodoCardProps {
  todo: Todo;
  onEditClick: (todo: Todo) => void;
}

/**
 * Individual todo card.
 *
 * Displays: checkbox, title (with strikethrough when completed),
 * truncated description, created date, status badge, and a 3-dot
 * dropdown menu with View Details / Edit / Delete actions.
 *
 * Optimistic updates make toggle and delete feel instant.
 */
export function TodoCard({ todo, onEditClick }: TodoCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  const isCompleted = todo.status === "completed";

  const handleToggle = () => {
    toggleTodo.mutate(todo.id);
  };

  const handleDelete = () => {
    deleteTodo.mutate(todo.id, {
      onSuccess: () => setShowDeleteDialog(false),
    });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="group relative flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/20"
      >
        {/* Checkbox */}
        <Checkbox
          id={`todo-checkbox-${todo.id}`}
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={toggleTodo.isPending}
          className="mt-0.5 shrink-0"
          aria-label={`Mark "${todo.title}" as ${isCompleted ? "pending" : "completed"}`}
        />

        {/* Content — grows to fill available space */}
        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-medium leading-snug break-all transition-all duration-200 ${
                isCompleted
                  ? "text-muted-foreground line-through decoration-muted-foreground/50"
                  : "text-foreground"
              }`}
            >
              {todo.title}
            </p>

            <Badge
              variant={isCompleted ? "completed" : "pending"}
              className="shrink-0"
            >
              {isCompleted ? "Completed" : "Pending"}
            </Badge>
          </div>

          {/* Description — truncated to 2 lines */}
          {todo.description && (
            <p
              className={`mt-1 line-clamp-2 text-sm leading-relaxed break-all transition-colors duration-200 ${
                isCompleted
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground"
              }`}
            >
              {todo.description}
            </p>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center">
            {/* Created date */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <time dateTime={todo.createdAt}>
                {formatTodoDate(todo.createdAt)}
              </time>
            </div>
          </div>
        </div>

        {/* Options menu — always visible, aligned to right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={`todo-options-${todo.id}`}
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
              aria-label={`Options for "${todo.title}"`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              id={`todo-view-${todo.id}`}
              onClick={() => setShowDetailDialog(true)}
            >
              <Eye className="h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem
              id={`todo-edit-menu-${todo.id}`}
              onClick={() => onEditClick(todo)}
            >
              <Edit2 className="h-4 w-4" />
              Sửa task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              id={`todo-delete-menu-${todo.id}`}
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Xóa task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* View Details dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="leading-snug break-all">{todo.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <time dateTime={todo.createdAt}>
                  {formatTodoDate(todo.createdAt)}
                </time>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[50vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trạng thái:</span>
              <Badge variant={isCompleted ? "completed" : "pending"}>
                {isCompleted ? "Completed" : "Pending"}
              </Badge>
            </div>

            {todo.description ? (
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">Mô tả</p>
                <p className="whitespace-pre-wrap break-all text-sm leading-relaxed text-muted-foreground">
                  {todo.description}
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Không có mô tả.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              id="detail-edit"
              variant="outline"
              onClick={() => {
                setShowDetailDialog(false);
                onEditClick(todo);
              }}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Sửa task
            </Button>
            <Button
              id="detail-close"
              onClick={() => setShowDetailDialog(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xóa task?</DialogTitle>
            <DialogDescription>
              &ldquo;{todo.title}&rdquo; sẽ bị xóa vĩnh viễn. Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              id="delete-cancel"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteTodo.isPending}
            >
              Hủy
            </Button>
            <Button
              id="delete-confirm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTodo.isPending}
            >
              {deleteTodo.isPending ? "Đang xóa…" : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
