'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InterfaceStrings } from '@/config/strings';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Customer } from '@/lib/api/commerce-types';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';

const createSchema = (strings: InterfaceStrings) =>
  z.object({
    firstName: z.string().min(1, strings.common.required),
    lastName: z.string().min(1, strings.common.required),
    email: z
      .union([z.string().email(strings.login.invalidEmail), z.literal('')])
      .optional(),
    phone: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerFormModal({ open, onClose, customer }: Props) {
  const { strings } = useLocale();
  const c = strings.commerce.customers;
  const create = useCreateCustomer();
  const update = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema(strings)),
    values: {
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      phone: values.phone || undefined,
    };
    try {
      if (customer) {
        await update.mutateAsync({ id: customer.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(strings.common.saved);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? c.edit : c.add}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">{c.firstName}</Label>
            <Input
              id="firstName"
              hasError={!!errors.firstName}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-error">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">{c.lastName}</Label>
            <Input
              id="lastName"
              hasError={!!errors.lastName}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-error">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="email">{c.email}</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            hasError={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-error">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">{c.phone}</Label>
          <Input id="phone" dir="ltr" {...register('phone')} />
        </div>
        <div className="flex justify-start gap-3 pt-2">
          <Button
            type="submit"
            isLoading={create.isPending || update.isPending}
          >
            {strings.common.save}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
