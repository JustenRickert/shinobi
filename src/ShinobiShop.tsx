import { memo } from "preact/compat";

import "./ShinobiShop.css";

import {
  setGameState,
  useGameState,
  sampleShinobi,
  makeRollCost,
} from "./game";
import { deepMerge, deviationInt } from "./util";
import { GameState, ShinobiId } from "./types";

function purchaseShinobi(id: ShinobiId) {
  setGameState((state) => {
    const s = state.shop.shinobi.get(id);
    return deepMerge(state, {
      shop: {
        lastRolledTime: state.gameTime,
        shinobi: state.shop.shinobi.remove(id),
      },
      points: state.points - s.cost,
      shinobi: state.shinobi.add(s),
    });
  });
}

function resetShinobiShop() {
  setGameState((state) => {
    return deepMerge(state, {
      shop: {
        rollCost: makeRollCost(),
        shinobi: sampleShinobi(deviationInt(5, 1 / 4)),
      },
    });
  });
}

function getShinobiShopState(state: GameState) {
  return {
    points: state.points,
    shinobi: state.shop.shinobi,
    rollCost: state.shop.rollCost,
    population: state.shinobi.length,
    maxPopulation: state.villages.reduce(
      (population, village) => population + village.population,
      0
    ),
  };
}

function ShinobiShop() {
  const { points, shinobi, rollCost, population, maxPopulation } =
    useGameState(getShinobiShopState);
  return (
    <section className="shinobi-shop">
      <h3>buy shinobi</h3>
      <button disabled={rollCost > points} onClick={() => resetShinobiShop()}>
        re-roll ({rollCost})
      </button>
      <ul className="shop-list">
        <li className="borderbottom">
          <div></div>
          <div>level</div>
          <div>cost</div>
          <div></div>
        </li>
        {shinobi.list().map((s) => (
          <li>
            <div>{s.id.slice(8)}</div>
            <div>{s.level}</div>
            <div>{s.cost}</div>
            <div>
              <button
                disabled={points < s.cost || population >= maxPopulation}
                onClick={() => purchaseShinobi(s.id)}
              >
                buy
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(ShinobiShop);
