// runtime/mentor_registry.ts

export class MentorRegistry {
  private mentors: string[] = [];

  constructor() {
    // Initialize with no mentors; can be extended later
  }

  registerMentor(mentorId: string): void {
    this.mentors.push(mentorId);
  }

  listMentors(): string[] {
    return this.mentors;
  }

  // Placeholder for async-safe archetype pairing logic
  async pairMentor(_signalId: string): Promise<string | null> {
    // For now, return the first mentor if available
    return this.mentors.length > 0 ? this.mentors[0] : null;
  }
}

export default new MentorRegistry();