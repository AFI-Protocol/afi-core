/**
 * 🧪 Mentor Registry Unit Test
 * ------------------------------------------
 * Tests mentor registration and signal-tag pairing logic
 */

import { MentorRegistry } from '../runtime/mentor_registry';

describe('MentorRegistry', () => {
  let registry: MentorRegistry;

  beforeEach(() => {
    registry = new MentorRegistry();
  });

  test('registers and retrieves mentor by ID', async () => {
    const mentor = { id: 'm-001', name: 'Athena', tags: ['macro'], active: true };
    await registry.registerMentor(mentor);

    const found = await registry.getMentorById('m-001');
    expect(found?.name).toBe('Athena');
  });

  test('retrieves mentors by tag', async () => {
    await registry.registerMentor({ id: 'm-002', name: 'Hermes', tags: ['sentiment'], active: true });

    const mentors = await registry.getMentorsByTag('sentiment');
    expect(mentors.length).toBeGreaterThan(0);
  });

  test('pairs mentor based on matching tag', async () => {
    await registry.registerMentor({ id: 'm-003', name: 'Apollo', tags: ['risk'], active: true });

    const match = await registry.simulateMentorPairing(['risk']);
    expect(match?.name).toBe('Apollo');
  });

  test('returns null when no mentors match', async () => {
    const match = await registry.simulateMentorPairing(['nonexistent']);
    expect(match).toBeNull();
  });
});
