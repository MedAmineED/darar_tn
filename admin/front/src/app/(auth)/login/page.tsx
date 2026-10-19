'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { LanguageSwitch } from '@/components/layout/language-switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InterfaceStrings } from '@/config/strings';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/providers/auth-provider';

const createLoginSchema = (strings: InterfaceStrings) =>
  z.object({
    email: z.string().email(strings.login.invalidEmail),
    password: z.string().min(1, strings.login.passwordRequired),
  });

type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginPage() {
  const { strings, t } = useLocale();
  const router = useRouter();
  const { login, status } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(createLoginSchema(strings)),
    defaultValues: { email: '', password: '' },
  });

  // Already signed in → skip the login screen.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
      router.replace('/dashboard');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-end">
          <LanguageSwitch />
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-container font-heading text-2xl font-bold text-primary-on">
            {t('د', 'D')}
          </div>
          <h1 className="font-heading text-2xl font-semibold text-on-surface">
            {strings.appName}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {strings.appSubtitle}
          </p>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-6 shadow-card sm:p-8">
          <h2 className="font-heading text-lg font-semibold text-on-surface">
            {strings.login.title}
          </h2>
          <p className="mb-6 mt-1 text-sm text-on-surface-variant">
            {strings.login.subtitle}
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="email">{strings.login.email}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder={strings.login.emailPlaceholder}
                hasError={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">{strings.login.password}</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                placeholder={strings.login.passwordPlaceholder}
                hasError={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              {isSubmitting ? strings.login.submitting : strings.login.submit}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
