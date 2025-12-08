export type RelationType = 
| "parent"
| "mother"
| "father"
| "child"
| "sibling"
| "son"
| "daughter"
| "sister"
| "brother"
| "spouse"
| "wife"
| "husband"
| "grandParent"
| "grandFather"
| "grandMother"
| "grandUncle"
| "grandAunt"
| "grandChild"
| "uncle"
| "aunt"
| "nephew"
| "niece"
| "cousin"
| "brotherInLaw"
| "sisterInLaw"
| "stepMother"
| "stepFather"
| "sonInLaw"
| "daughterInLaw"
| "stepBrother"
| "stepSister";

const generationShiftByRelation: Record<RelationType, number> = {
parent: -1,
mother: -1,
father: -1, 
child: +1,
sibling: +1,
son: +1,
daughter: +1,
sister: 0,
brother: 0,
spouse: 0,
wife: 0,
husband: 0,
grandParent: -2,
grandFather: -2,
grandMother: -2,
grandUncle: -2,
grandAunt: -2,
grandChild: +2,
uncle: -1,
aunt: -1,
nephew: +1,
niece: +1,
cousin: 0,
brotherInLaw: 0,
sisterInLaw: 0,
stepMother: -1,
stepFather: -1,
sonInLaw: +1,
daughterInLaw: +1,
stepBrother: 0,
stepSister: 0
}

export function computeGeneration(
    targetGeneration: number,
    relationType: RelationType
): number {
    const shift = generationShiftByRelation[relationType] ?? 0;
    return targetGeneration + shift;
}