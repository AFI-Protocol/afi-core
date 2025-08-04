export class MentorRegistry {
    mentors = new Map();
    registerMentor(mentor) {
        const now = Date.now();
        this.mentors.set(mentor.id, {
            version: mentor.version ?? "1.0.0",
            capabilities: mentor.capabilities ?? [],
            reputation: mentor.reputation ?? 0,
            lastActive: mentor.lastActive ?? now,
            ...mentor,
        });
        console.log(`Mentor ${mentor.name} registered with ID: ${mentor.id}`);
    }
    register(mentor) {
        this.registerMentor(mentor);
    }
    getMentor(id) {
        return this.mentors.get(id);
    }
    getMentorById(id) {
        return this.mentors.get(id);
    }
    getAllMentors() {
        return Array.from(this.mentors.values());
    }
    getMentorsByTag(tag) {
        return Array.from(this.mentors.values()).filter((m) => m.tags?.includes(tag));
    }
    simulateMentorPairing(tags) {
        for (const tag of tags) {
            const match = this.getMentorsByTag(tag)[0];
            if (match)
                return match;
        }
        return null;
    }
    updateReputation(id, delta) {
        const mentor = this.mentors.get(id);
        if (mentor) {
            mentor.reputation = (mentor.reputation ?? 0) + delta;
            mentor.lastActive = Date.now();
        }
    }
}
export const globalMentorRegistry = new MentorRegistry();
//# sourceMappingURL=mentor_registry.js.map