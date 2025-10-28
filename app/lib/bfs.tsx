import { Line, Person } from '../types/family';

export default function showConnections(startId: number, lines: Line[], familyData: Person[]) {
  const queue = [startId];
  const visited = new Set(queue);
  let count = 0;

  //Masquer toutes les lignes
  lines.forEach((l) => (l.line.visible = false));

  while (queue.length > 0 && count < 10) {
    const currentId = queue.shift()!; // expliquer cette ligne
    const person = familyData.find((p) => p.id === currentId);
    if (!person) continue;

    person.relations.forEach((rel) => {
      if (!visited.has(rel.id) && count < 10) {
        visited.add(rel.id);
        queue.push(rel.id);
        count++;
      }

      // Afficher la ligne correspondante
      lines.forEach((l) => {
        if (
          (l.parent === currentId && l.child === rel.id) ||
          (l.child === currentId && l.parent === rel.id)
        ) {
          l.line.visible = true;
        }
      });
    });
  }
}