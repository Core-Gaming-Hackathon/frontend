'use client';

import React from 'react';
import { UseFormReturn, FieldValues, Path, PathValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface FormFieldOption {
  value: string;
  label: string;
}

interface FormFieldProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  description?: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'select' | 'switch' | 'number' | 'email' | 'password';
  options?: FormFieldOption[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

export function FormField<TFieldValues extends FieldValues>({
  form,
  name,
  label,
  description,
  placeholder,
  type,
  options,
  rows = 3,
  min,
  max,
  step,
  required = false,
}: FormFieldProps<TFieldValues>) {
  const { register, setValue, watch, formState: { errors } } = form;
  const value = watch(name);
  const error = errors[name as string];
  
  // Use let instead of const for errorMessage so we can modify it
  let errorMessage = error?.message as string | undefined;

  // Get nested error messages if the error is for a nested field
  if (!errorMessage && (name as string).includes('.')) {
    const parts = (name as string).split('.');
    let currentErrors: Record<string, unknown> = errors;
    
    for (const part of parts) {
      if (!currentErrors) break;
      currentErrors = currentErrors[part] as Record<string, unknown>;
    }
    
    if (currentErrors?.message) {
      errorMessage = currentErrors.message as string;
    }
  }

  // Helper to handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setValue(name, checked as unknown as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: true });
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={name} className={errorMessage ? "text-destructive" : ""}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}

      {type === 'text' || type === 'email' || type === 'password' || type === 'number' && (
        <Input
          id={name}
          placeholder={placeholder}
          type={type}
          min={min}
          max={max}
          step={step}
          {...register(name, { valueAsNumber: type === 'number' })}
          className={errorMessage ? "border-destructive" : ""}
        />
      )}

      {type === 'textarea' && (
        <Textarea
          id={name}
          placeholder={placeholder}
          rows={rows}
          {...register(name)}
          className={errorMessage ? "border-destructive" : ""}
        />
      )}

      {type === 'select' && options && (
        <Select
          value={value || ""}
          onValueChange={val => setValue(name, val as unknown as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: true })}
        >
          <SelectTrigger className={errorMessage ? "border-destructive" : ""}>
            <SelectValue placeholder={placeholder || `Select ${label?.toLowerCase() || 'option'}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === 'switch' && (
        <div className="flex items-center space-x-2">
          <Switch
            id={name}
            checked={value || false}
            onCheckedChange={handleSwitchChange}
          />
          {placeholder && (
            <Label htmlFor={name}>{placeholder}</Label>
          )}
        </div>
      )}

      {description && !errorMessage && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}