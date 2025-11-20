"use client";

import TreeScene from "./components/TreeScene";
import AddMemberForm from "./components/AddMemberForm";
import { useState } from "react";
import { Person } from "./types/family";
import { createFamilyData } from "./lib/createFamilyData";

export default function Page() {
  const [familyData, setFamilyData] = useState<Person[]>(createFamilyData());

  const handleAddMember = (newMember: Omit<Person, "id">) => {
    const newId = familyData.length + 1;
    const member: Person = { id: newId, ...newMember };
    setFamilyData([...familyData, member]);
  };

  return (
    <main className="flex flex-col md:flex-row items-start justify-between gap-6">
      <div className="flex-1">
        <TreeScene />
      </div>
    </main>
  );
}
