import { useCallback } from "preact/hooks";
import { Fragment } from "preact/jsx-runtime";

import "./VillagePanel.css";

import { setActivePanel, setGameState, useGameState } from "../game";
import {
  GameState,
  VillageId,
  VillagePanelTab,
  VillageUpgradeId,
} from "../types";
import { assert, deepMerge } from "../util";
import { allUpgrades as ALL_UPGRADES, natureUpgrades } from "../village";
import VillageMissionsTab from "./VillageMissionsTab";

function setPurchaseUpgrade({
  villageId,
  upgradeId,
}: {
  villageId: VillageId;
  upgradeId: VillageUpgradeId;
}) {
  const upgrade = ALL_UPGRADES.get(upgradeId);
  setGameState((state) =>
    deepMerge(state, {
      points: state.points - upgrade.cost,
      villages: state.villages.update(villageId, (village) => ({
        upgrades: village.upgrades.add({
          id: upgrade.id,
          gameTime: state.gameTime,
        }),
      })),
    })
  );
}

function upgradesTabL(id: VillageId) {
  return useCallback(
    (state: GameState) => {
      const village = state.villages.get(id);
      console.log("upgradesTabL", {
        state,
        village,
      });
      return {
        availableUpgrades: natureUpgrades(village.nature).filter(
          (upgrade) =>
            !village.upgrades.has(upgrade.id) &&
            upgrade.cost <= state.points &&
            upgrade.prerequisites.every((req) => village.upgrades.has(req))
        ),
      };
    },
    [id]
  );
}

function UpgradesTab({ id }: { id: VillageId }) {
  const { availableUpgrades } = useGameState(upgradesTabL(id));

  if (!availableUpgrades.length)
    return (
      <div id="upgrades-tab">
        <p>No upgrades available</p>
      </div>
    );

  return (
    <div id="upgrades-tab">
      <div />
      <div>name</div>
      <div>cost</div>
      {availableUpgrades.list().map((u) => (
        <Fragment key={u.id}>
          <div>
            <button
              onClick={() =>
                setPurchaseUpgrade({
                  villageId: id,
                  upgradeId: u.id,
                })
              }
            >
              buy
            </button>
          </div>
          <div>{u.id}</div>
          <div>{u.cost}</div>
        </Fragment>
      ))}
    </div>
  );
}

// function getTaskTabL(id: VillageId) {
//   return useCallback(
//     (state: GameState) => ({
//       inactiveShinobi: state.shinobi.filter((s) => !s.activity),
//     }),
//     [id]
//   );
// }

// function TasksTab({ id }: { id: VillageId }) {
//   const { inactiveShinobi } = useGameState(getTaskTabL(id));

//   if (!inactiveShinobi.length)
//     return (
//       <div id="tasks-tab" className="empty">
//         <p>There are no inactive shinobi</p>
//       </div>
//     );

//   return (
//     <div id="tasks-tab" className="grid">
//       <div />
//       <div className="rightalign">level</div>
//       <div className="rightalign">experience</div>
//       <div></div>
//       {inactiveShinobi
//         .list()
//         .slice(0, 5)
//         .map((s) => (
//           <Fragment key={s.id}>
//             <div>
//               <button
//                 onClick={() =>
//                   setShinobiActivity(
//                     s.id,
//                     makeTaskActivity({
//                       shinobiId: s.id,
//                       villageId: id,
//                     })
//                   )
//                 }
//               >
//                 start
//               </button>
//             </div>
//             <div>{s.id}</div>
//             <div className="rightalign">{s.level}</div>
//             <div className="rightalign">{s.experience}</div>
//           </Fragment>
//         ))}
//     </div>
//   );
// }

function tabSwitchL(state: GameState) {
  return {
    ui: state.ui,
  };
}

function TabSwitch({ id }: { id: VillageId }) {
  const { ui } = useGameState(tabSwitchL);
  assert(ui.activePanel?.what === "village");

  let content = null;
  switch (ui.activePanel.tab) {
    case VillagePanelTab.Missions:
      content = <VillageMissionsTab id={id} />;
      break;
    case VillagePanelTab.Upgrades:
      content = <UpgradesTab id={id} />;
      break;
  }

  return (
    <section id="tab-switch">
      <div>{content}</div>
      <nav>
        <ul>
          {Object.values(VillagePanelTab).map((tab) => (
            <li>
              <button
                onClick={() => setActivePanel({ what: "village", id, tab })}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

function villagePanelL(id: VillageId) {
  return useCallback(
    (state: GameState) => ({
      village: state.villages.get(id),
      shinobis: state.shinobi.list().filter((s) => !s.activity), // TODO memo?
      activities: state.shinobi.list().filter((s) => s.activity).length,
    }),
    [id]
  );
}

export default function VillagePanel({ id }: { id: VillageId }) {
  const { village, activities } = useGameState(villagePanelL(id));
  return (
    <>
      <h4>Village {id.slice(8)}</h4>
      <p>
        <b>points given</b> {village.pointsGiven}
        <br />
        <b>activities</b> {activities}
        <br />
        <b>experience given</b> {village.experienceGiven}
      </p>
      <TabSwitch id={id} />
    </>
  );
}
