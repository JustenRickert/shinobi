import { useGameState } from "./state";

export function ShinobiList() {
  const { shinobiIds } = useGameState((state) => ({
    shinobiIds: state.shinobi.ids,
  }));
  if (!shinobiIds.length) return <p>No shinobi yet :(</p>;
  return (
    <ul>
      {shinobiIds.map((id) => (
        <li>{id}</li>
      ))}
    </ul>
  );
}
