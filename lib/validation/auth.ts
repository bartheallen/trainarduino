import { z } from 'zod';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const signupSchema = z.object({
  email: z.string().trim().email('Adresse email invalide.'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .regex(
      passwordPattern,
      'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.'
    ),
  username: z
    .string()
    .trim()
    .min(3, 'Le pseudo doit contenir au moins 3 caractères.')
    .max(20, 'Le pseudo doit contenir au plus 20 caractères.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Le pseudo ne peut contenir que des lettres, chiffres et underscores.'),
});

export const signinSchema = z.object({
  email: z.string().trim().email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export const emailSchema = z.object({
  email: z.string().trim().email('Adresse email invalide.'),
});

export const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .regex(
      passwordPattern,
      'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.'
    ),
});
