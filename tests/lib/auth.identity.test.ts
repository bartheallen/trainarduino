import { describe, expect, it } from 'vitest';
import { buildGoogleProfileIdentity, getGoogleAuthRedirectUrl } from '@/lib/auth';

describe('Google profile identity helpers', () => {
  it('derives a readable username from a Google name instead of the full email', async () => {
    const profile = await buildGoogleProfileIdentity({
      id: 'user-123',
      email: 'jane.doe@gmail.com',
      user_metadata: {
        full_name: 'Jane Doe',
        picture: 'https://example.com/avatar.jpg',
      },
    });

    expect(profile.username).toBe('jane_doe');
    expect(profile.display_name).toBe('Jane Doe');
  });

  it('adds a numeric suffix for duplicate Google usernames', async () => {
    const profile = await buildGoogleProfileIdentity({
      id: 'user-456',
      email: 'alice@gmail.com',
      user_metadata: {
        full_name: 'Alice Smith',
      },
    }, ['alice_smith', 'alice_smith_2']);

    expect(profile.username).toBe('alice_smith_3');
  });

  it('keeps signup and signin Google OAuth flows distinct in the redirect URL', async () => {
    expect(await getGoogleAuthRedirectUrl('signup')).toContain('flow=signup');
    expect(await getGoogleAuthRedirectUrl('signin')).toContain('flow=signin');
  });
});
