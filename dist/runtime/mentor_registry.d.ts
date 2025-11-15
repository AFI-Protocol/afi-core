export interface MentorMetadata {
    id: string;
    name: string;
    version?: string;
    capabilities?: string[];
    reputation?: number;
    lastActive?: number;
    tags?: string[];
    active?: boolean;
}
export declare class MentorRegistry {
    private mentors;
    registerMentor(mentor: MentorMetadata): void;
    register(mentor: MentorMetadata): void;
    getMentor(id: string): MentorMetadata | undefined;
    getMentorById(id: string): MentorMetadata | undefined;
    getAllMentors(): MentorMetadata[];
    getMentorsByTag(tag: string): MentorMetadata[];
    simulateMentorPairing(tags: string[]): MentorMetadata | null;
    updateReputation(id: string, delta: number): void;
}
export declare const globalMentorRegistry: MentorRegistry;
//# sourceMappingURL=mentor_registry.d.ts.map