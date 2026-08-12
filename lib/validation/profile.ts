import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_\-\.]+$/, 'Username can contain letters, numbers, underscore, dot and hyphen');

export const displayNameSchema = z.string().min(1).max(80).optional();

export const biographySchema = z.string().max(500).optional();

export const avatarUrlSchema = z.string().url().optional();

export const countrySchema = z.string().min(2).max(100).optional();

export const languageSchema = z.string().min(2).max(10).optional();

export const timezoneSchema = z.string().min(1).max(100).optional();

export const themePreferenceSchema = z.enum(['light', 'dark', 'system']).optional();

export const publicProfileSchema = z.boolean().optional();

export const privacySettingsSchema = z.record(z.string(), z.any()).optional();

export const learningPreferencesSchema = z.record(z.string(), z.any()).optional();

export const notificationPreferencesSchema = z.record(z.string(), z.any()).optional();

export const profileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  display_name: displayNameSchema,
  avatar_url: avatarUrlSchema,
  biography: biographySchema,
  country: countrySchema,
  preferred_language: languageSchema,
  theme_preference: themePreferenceSchema,
  timezone: timezoneSchema,
  public_profile: publicProfileSchema,
  privacy_settings: privacySettingsSchema,
  learning_preferences: learningPreferencesSchema,
  notification_preferences: notificationPreferencesSchema,
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
