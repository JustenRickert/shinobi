import "./village.css";

import { png } from "./assets";
import { useToast } from "./components/toast";
import {
  Genin,
  ShinobiInTraining,
  Task,
  useGameState,
  useSetGameState,
} from "./state";
import { assignTaskToShinobi } from "./state/actions";
import { IR, assert } from "./util";

function useShinobiGraduation(id: ShinobiInTraining.Id) {
  const { shinobi, points } = useGameState((state) => ({
    points: state.points,
    shinobi: state.shinobiInTraining.record[id],
  }));
  const setGameState = useSetGameState();
  const cost = ShinobiInTraining.cost(shinobi);

  return {
    cost,
    disabled: points < cost,
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

function ShinobiInTrainingToast({ id }: { id: ShinobiInTraining.Id }) {
  const { cost, buy, disabled } = useShinobiGraduation(id);
  const { closeToast } = useToast();
  const handleClick = () => {
    closeToast();
    buy();
  };
  return (
    <div className="shinobi-in-training-toast">
      <p>Cost to graduate: {cost}</p>
      <div>
        <button disabled={disabled} onClick={handleClick}>
          Graduate Shinobi
        </button>
      </div>
    </div>
  );
}

function ShinobiInTrainingSquare({ id }: { id: ShinobiInTraining.Id }) {
  const { shinobi } = useGameState((state) => ({
    shinobi: state.shinobiInTraining.record[id],
  }));
  const { openToast } = useToast();
  const handleClick = () => {
    openToast(`Student ${shinobi.name}`, <ShinobiInTrainingToast id={id} />);
  };
  return (
    <li>
      <button onClick={handleClick} className="card shinobi-in-training">
        <div>
          <img height={48} width={48} src={png("baby-shinobi")}></img>
        </div>
        <div className="information">
          <h5>{shinobi.name}</h5>
          <p>level: {shinobi.level}</p>
          <p>
            {shinobi.affinityType}{" "}
            {shinobi.jutsuTypes.map((type) => (
              <span>{type}</span>
            ))}
          </p>
        </div>
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

// function ProgressBar({ behavior }: { behavior: Genin.Behavior }) {
//   const [now, setNow] = useState(() => Date.now());
//   useEffect(() => {
//     const sub = animationFrames().subscribe(() => setNow(() => Date.now()));
//     return () => {
//       sub.unsubscribe();
//     };
//   }, []);

//   // const timeout = when(
//   //   [behavior.type === "idle", SHINOBI_IDLE_TASK_TIMEOUT_BASE],
//   //   [behavior.type === "assigned-task", SHINOBI_IDLE_TASK_TIMEOUT_BASE],
//   //   [behavior.type === "injured", SHINOBI_INJURED_TIMEOUT_BASE]
//   // );
//   const until = behavior.since + timeout;

//   return <progress max={100} value={100 - (100 * (until - now)) / timeout} />;
// }

function ShinobiInTrainingContent() {
  const { ids } = useGameState((state) => ({
    ids: state.shinobiInTraining.ids,
  }));
  return (
    <>
      <h3>Shinobi Academy</h3>
      {!ids.length ? (
        <p>No students :o</p>
      ) : (
        <ul className="shinobi-in-training-list">
          {ids.map((id) => (
            <ShinobiInTrainingSquare key={id} id={id} />
          ))}
        </ul>
      )}
    </>
  );
}

export function VillageContent() {
  const { tasks } = useGameState((state) => ({
    tasks: IR.list(state.village.tasks),
  }));

  return (
    <div id="village">
      <h2>Village</h2>

      <ShinobiInTrainingContent />

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
