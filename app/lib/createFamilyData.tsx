import { Person } from "../types/family"

export const createFamilyData = (): Person[] => [
    {
        id: 1,
        name: "Grand-père",
        generation: 0,
        relations: [
            { id: 2, type:"child" },
            { id: 3, type:"child" },
        ],
    },
    {
        id: 2,
        name: "Père",
        generation: 1,
        relations: [
            { id: 1, type:"parent"},
            { id: 4, type:"child" },
            { id: 5, type:"child" },
            { id: 3, type:"sibling" },
        ],
    },
    {
        id: 3,
        name: "Tante",
        generation: 1,
        relations: [
            { id: 1, type:"parent" },
            { id: 2, type:"sibling" },
            { id: 6, type:"child" },
        ],
    },
    {
        id: 4,
        name: "Enfant A",
        generation: 2,
        relations: [{ id: 2, type: "parent" }],
    },
    {
        id: 5,
        name: "Enfant B",
        generation: 2,
        relations: [{ id: 2, type: "parent" }],
    },
    {
        id: 6,
        name: "Cousin",
        generation: 2,
        relations: [{ id: 3, type: "parent" }],
    }
]