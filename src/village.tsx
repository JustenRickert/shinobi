import {
  Genin,
  ShinobiInTraining,
  Task,
  useGameState,
  useSetGameState,
} from "./state";
import { assignTaskToShinobi } from "./state/actions";
import { IR, assert } from "./util";

function usePoints() {
  return useGameState((state) => ({
    points: state.points,
    pointsSpent: state.pointsSpent,
  }));
}

function useShinobiPurchasing(shinobi: ShinobiInTraining.T) {
  const setGameState = useSetGameState();
  const cost = ShinobiInTraining.cost(shinobi);

  return {
    cost,
    buy: () => {
      setGameState((state) => ({
        ...state,
        points: state.points - cost,
        pointsSpent: state.pointsSpent + cost,
        shinobiInTraining: IR.remove(shinobi.id, state.shinobiInTraining),
        genin: IR.add(Genin.make(shinobi), state.genin),
      }));
    },
  };
}

function GraduateShinobiButton({ shinobi }: { shinobi: ShinobiInTraining.T }) {
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
    shinobi: IR.list(state.genin),
  }));
  return (
    shinobi.find(
      (s) => s.behavior.type === "idle" || s.behavior.type === "available"
    ) ?? null
  );
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

function Shinobi({ id }: { id: ShinobiInTraining.Id }) {
  const { shinobi } = useGameState((state) => ({
    shinobi: state.shinobiInTraining.record[id],
  }));
  assert(shinobi);
  return <GraduateShinobiButton key={shinobi.id} shinobi={shinobi} />;
}

export function VillageContent() {
  const { shinobiInTrainingIds, tasks } = useGameState((state) => ({
    shinobiInTrainingIds: state.shinobiInTraining.ids,
    tasks: IR.list(state.village.tasks),
  }));

  return (
    <div id="village">
      <h2>Village</h2>

      {
        <>
          <h3>Graduate Shinobi</h3>
          {shinobiInTrainingIds.length ? (
            <ul>
              {shinobiInTrainingIds.map((id) => (
                <Shinobi id={id} key={id} />
              ))}
            </ul>
          ) : (
            <p>None right now :(</p>
          )}
        </>
      }

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
