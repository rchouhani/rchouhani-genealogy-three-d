export interface Relation {
    id: number;
    type: "child" | "parent" | "sibling";
}

export interface Person {
    id: number;
    name: string;
    generation: number;
    relations: Relation[];
}