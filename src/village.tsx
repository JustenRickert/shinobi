import { Shinobi, Task, useGameState, useSetGameState } from "./state";
import { assignTaskToShinobi } from "./state/actions";
import { IR, assert } from "./util";

function usePoints() {
  return useGameState((state) => ({
    points: state.points,
    pointsSpent: state.pointsSpent,
  }));
}

function useShinobiPurchasing(shinobi: Shinobi.T) {
  const update = useSetGameState();
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
        shinobi: IR.add(shinobi, state.shinobi),
      }));
    },
  };
}

function GraduateShinobiButton({ shinobi }: { shinobi: Shinobi.T }) {
  const { points } = usePoints();
  const { cost, buy } = useShinobiPurchasing(shinobi);
  return (
    <li>
      <button
        disabled={points < cost}
        onClick={() => {
          buy();
        }}
      >
        Graduate {shinobi.name} ({shinobi.level}), {cost}
      </button>
    </li>
  );
}

function useSuggestedShinobiAssignment() {
  const { shinobi } = useGameState((state) => ({
    shinobi: IR.list(state.shinobi),
  }));
  return shinobi.find((s) => s.behavior.type === "idle") ?? null;
}

function AssignTaskButton({ task }: { task: Task.T }) {
  const setGameState = useSetGameState();

  const selectedShinobi = useSuggestedShinobiAssignment();

  const handleClick = () => {
    assert(selectedShinobi);
    setGameState((state) =>
      assignTaskToShinobi(task, selectedShinobi.id, state)
    );
  };

  return (
    <li>
      <button disabled={!selectedShinobi} onClick={handleClick}>
        {task.name} ({task.level})
      </button>
    </li>
  );
}

export function Village() {
  const { shinobiInTraining, tasks } = useGameState((state) => ({
    shinobiInTraining: state.village.shinobiInTraining,
    tasks: IR.list(state.village.tasks),
  }));

  return (
    <div id="village">
      <h2>Village</h2>

      {Boolean(shinobiInTraining.length) && (
        <>
          <h3>Graduate Shinobi</h3>
          <ul>
            {shinobiInTraining.map((shinobi) => (
              <GraduateShinobiButton key={shinobi.id} shinobi={shinobi} />
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
