import { IR } from "./ir";
import { WorldHex, useGameState, useSetGameState } from "./state";

export function ForestContent({ hex }: { hex: WorldHex.T }) {
  const { shinobi } = useGameState((state) => ({
    shinobi: IR.list(state.shinobi).find((s) => !s.task) ?? null,
  }));
  return (
    <>
      {hex.explored ? (
        "explored"
      ) : (
        <>
          <p>unexplored</p>
          <button disabled={!shinobi}>explore</button>{" "}
          {shinobi ? `(send ${shinobi.id})` : "(No available shinobi)"}
        </>
      )}
    </>
  );
}

export function SelectedHexWindowContent() {
  const setGameState = useSetGameState();
  const { ui, selectedHex } = useGameState((state) => ({
    ui: state.ui,
    selectedHex: state.ui.selectedHex
      ? state.world.record[state.ui.selectedHex]
      : null,
  }));

  if (!selectedHex) return null;

  let el = null;
  switch (selectedHex.what) {
    case "forest":
      el = <ForestContent hex={selectedHex} />;
  }

  return (
    <>
      <h3>Hex ({selectedHex.id})</h3>
      <p>{selectedHex.what}</p>
      {el}
    </>
  );
}
