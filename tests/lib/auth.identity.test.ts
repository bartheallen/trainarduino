import { describe, expect, it } from 'vitest';
import { buildGoogleProfileIdentity, getGoogleAuthRedirectUrl } from '@/lib/auth';

describe('Google profile identity helpers', () => {
  it('prefers a Google username before full name, then given_name/family_name and local email fallback', async () => {
    const profile = await buildGoogleProfileIdentity({
      id: 'user-123',
      email: 'jane.doe@gmail.com',
      user_metadata: {
        preferred_username: 'jane-doe',
        given_name: 'Jane',
        family_name: 'Doe',
        full_name: 'Jane Doe',
        name: 'Jane Doe',
        picture: 'https://example.com/avatar.jpg',
      },
    });

    expect(profile.username).toBe('jane_doe');
    expect(profile.display_name).toBe('Jane Doe');
  });

  it('uses the local email part only as the last-resort fallback and adds a numeric suffix on duplicates', async () => {
    const profile = await buildGoogleProfileIdentity({
      id: 'user-456',
      email: 'alice.smith@gmail.com',
      user_metadata: {
        name: 'Alice Smith',
      },
    }, ['alice_smith', 'alice_smith_2']);

    expect(profile.username).toBe('alice_smith_3');
  });

  it('does not keep mutating an existing profile username when the user logs in again', async () => {
    const profile = await buildGoogleProfileIdentity({
      id: 'user-789',
      email: 'john.smith@gmail.com',
      user_metadata: {
        preferred_username: 'john-smith',
        full_name: 'John Smith',
      },
    }, ['john_smith']);

    expect(profile.username).toBe('john_smith_2');
  });

  it('keeps signup and signin Google OAuth flows distinct in the redirect URL', async () => {
    expect(await getGoogleAuthRedirectUrl('signup')).toContain('flow=signup');
    expect(await getGoogleAuthRedirectUrl('signin')).toContain('flow=signin');
  });
});
