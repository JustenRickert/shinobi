import { Shinobi, Task, useGameState, useGameUpdate } from "./state";
import { assert } from "./util";

function usePoints() {
  return useGameState((state) => ({
    points: state.points,
    pointsSpent: state.pointsSpent,
  }));
}

function useShinobiPurchasing(shinobi: Shinobi.T) {
  const update = useGameUpdate();
  const cost = Shinobi.cost(shinobi);
  return {
    cost,
    buy: () => {
      update((state) => ({
        ...state,
        points: state.points - cost,
        pointsSpent: state.pointsSpent + cost,
        village: {
          ...state.village,
          shinobiInTraining: state.village.shinobiInTraining.filter(
            (s) => s.id !== shinobi.id
          ),
        },
        shinobi: {
          ids: state.shinobi.ids.concat(shinobi.id),
          record: {
            ...state.shinobi.record,
            [shinobi.id]: shinobi,
          },
        },
      }));
    },
  };
}

function HireShinobiButton({ shinobi }: { shinobi: Shinobi.T }) {
  const { points, pointsSpent } = usePoints();
  const { cost, buy } = useShinobiPurchasing(shinobi);
  return (
    <li>
      <button
        disabled={points < cost}
        onClick={() => {
          buy();
        }}
      >
        Hire {shinobi.name} ({shinobi.level}), {cost}
      </button>
    </li>
  );
}

function useSuggestedShinobiAssignment() {
  const { shinobi } = useGameState((state) => ({
    shinobi: state.shinobi.ids.map((id) => state.shinobi.record[id]),
  }));
  return shinobi.find((s) => !s.assignedTask) ?? null;
}

function AssignTaskButton({ task }: { task: Task.T }) {
  const update = useGameUpdate();

  const selectedShinobi = useSuggestedShinobiAssignment();

  const assignShinobi = () => {
    assert(selectedShinobi);
    update((state) => ({
      ...state,
      shinobi: {
        ...state.shinobi,
        record: {
          ...state.shinobi.record,
          [selectedShinobi.id]: {
            ...state.shinobi.record[selectedShinobi.id],
            assignedTask: task,
          },
        },
      },
      village: {
        ...state.village,
        tasks: state.village.tasks.filter((t) => t.id !== task.id),
      },
    }));
  };

  return (
    <li>
      <button disabled={!selectedShinobi} onClick={assignShinobi}>
        {task.name}
      </button>
    </li>
  );
}

export function Village() {
  const { hireableShinobi, tasks } = useGameState((state) => ({
    hireableShinobi: state.village.shinobiInTraining,
    tasks: state.village.tasks,
  }));

  return (
    <div id="village">
      <h2>Village</h2>

      {Boolean(hireableShinobi.length) && (
        <>
          <h3>Graduate Shinobi</h3>
          <ul>
            {hireableShinobi.map((shinobi) => (
              <HireShinobiButton key={shinobi.id} shinobi={shinobi} />
            ))}
          </ul>
        </>
      )}

      {Boolean(tasks.length) && (
        <>
          <h3>Assign task</h3>
          <ul>
            {tasks.map((task) => (
              <AssignTaskButton key={task.id} task={task} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
