/**
 * 🛡️ AFI Mentor Registry
 * -------------------------------------------------------
 * Manages mentor agents responsible for validating or enriching signals.
 * Includes async-safe methods and soft archetype tagging for pairing logic.
 */

export type MentorTag = 'pattern' | 'sentiment' | 'macro' | 'risk' | 'ethics';

export interface Mentor {
  id: string;
  name: string;
  tags: MentorTag[];
  active: boolean;
}

export class MentorRegistry {
  private mentors: Mentor[] = [];

  async registerMentor(mentor: Mentor): Promise<void> {
    this.mentors.push(mentor);
  }

  async getMentorById(id: string): Promise<Mentor | null> {
    const found = this.mentors.find(m => m.id === id);
    return found ?? null;
  }

  async getMentorsByTag(tag: MentorTag): Promise<Mentor[]> {
    return this.mentors.filter(m => m.tags.includes(tag));
  }

  async getActiveMentors(): Promise<Mentor[]> {
    return this.mentors.filter(m => m.active);
  }

  async simulateMentorPairing(signalTags: MentorTag[]): Promise<Mentor | null> {
    for (const tag of signalTags) {
      const taggedMentors = await this.getMentorsByTag(tag);
      if (taggedMentors.length > 0) {
        return taggedMentors[Math.floor(Math.random() * taggedMentors.length)];
      }
    }
    return null;
  }
}

// 🧪 Example usage
(async () => {
  const registry = new MentorRegistry();

  await registry.registerMentor({
    id: 'm-101',
    name: 'Athena',
    tags: ['macro', 'ethics'],
    active: true,
  });

  const match = await registry.simulateMentorPairing(['macro', 'sentiment']);
  console.log('Paired with mentor:', match);
})();
