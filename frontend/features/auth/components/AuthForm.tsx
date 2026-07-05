"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@todo-app/shared";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, LogIn, UserPlus, Key } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register: signUp } = useAuth();

  const currentSchema = isLogin ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setApiError(null);
    reset();
  };

  const handleAutofillTestUser = () => {
    setValue("email", "test@example.com");
    setValue("password", "password123");
    clearErrors();
    setApiError(null);
  };

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      if (isLogin) {
        await login(values as LoginFormValues);
      } else {
        await signUp(values as RegisterFormValues);
      }
    } catch (err: any) {
      console.error(err);
      const message =
        err.response?.data?.message || "Something went wrong. Please try again.";
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial-gradient from-indigo-50/50 to-indigo-100/30 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/60">
        
        {/* Glow Effects */}
        <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />

        <div className="relative flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
            {isLogin ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
          </div>
          
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-1.5 text-center text-sm text-muted-foreground">
            {isLogin ? "Enter your credentials to access tasks" : "Sign up to start staying organized"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          {apiError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {apiError}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                className="pl-9 bg-background/50 dark:bg-slate-950/30"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••"
                className="pl-9 bg-background/50 dark:bg-slate-950/30"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              "Please wait..."
            ) : isLogin ? (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Options</span>
            </div>
          </div>

          {isLogin && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAutofillTestUser}
              className="w-full border-dashed border-primary/40 hover:bg-primary/5 text-primary hover:text-primary-active"
            >
              <Key className="mr-2 h-4 w-4" />
              Auto-fill Test User
            </Button>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleToggle}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium underline underline-offset-4"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
