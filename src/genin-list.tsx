import {
  JSX,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/compat";

import "./genin-list.css";

import { animationFrames } from "rxjs";
import { useToast } from "./components/toast";
import {
  SHINOBI_IDLE_TASK_TIMEOUT_BASE,
  SHINOBI_INJURED_TIMEOUT_BASE,
} from "./constant";
import { Genin, useGameState } from "./state";
import { assert, when } from "./util";

const Messages = function Messages({ id }: { id: Genin.Id }) {
  const [lockedToBottom, setLockedToBottom] = useState<undefined | boolean>();
  const { messages } = useGameState(
    (state) => ({
      messages: state.genin.record[id].messages,
    }),
    { debug: "messages" }
  );

  const ulRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    assert(ulRef.current && ulRef.current.parentElement);
    if (typeof lockedToBottom === "undefined") {
      setLockedToBottom(true);
      ulRef.current.parentElement.scroll({
        top: Number.MAX_SAFE_INTEGER,
        behavior: "instant",
      });
    }
  }, [lockedToBottom]);

  useEffect(() => {
    assert(ulRef.current && ulRef.current.parentElement);
    if (typeof lockedToBottom === "undefined") return;
    else if (lockedToBottom)
      ulRef.current.parentElement.scroll({
        top: Number.MAX_SAFE_INTEGER,
        behavior: "smooth",
      });
  }, [lockedToBottom, messages.length]);

  return (
    <ul ref={ulRef} id="shinobi-message-list">
      {messages.map((message) => {
        let el: null | JSX.Element;
        switch (message.type) {
          case "task-failed": {
            // TODO Need a TimeSince component
            const since = ((Date.now() - message.when) / 1e3).toFixed(0);
            el = (
              <>
                <p>
                  Failed task "{message.task.name}" {since}s ago
                </p>
              </>
            );
            break;
          }
          case "task-success": {
            const since = ((Date.now() - message.when) / 1e3).toFixed(0);
            el = (
              <>
                <p>
                  Completed task "{message.task.name}"" {since}s ago
                </p>
                <p>Received {message.task.points} points</p>
              </>
            );
            break;
          }
          default:
            el = <span>???</span>;
        }
        return <li key={message.when}>{el}</li>;
      })}
    </ul>
  );
};

function ProgressBar({ behavior }: { behavior: Genin.Behavior }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const sub = animationFrames().subscribe(() => setNow(() => Date.now()));
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const timeout = when(
    [behavior.type === "idle", SHINOBI_IDLE_TASK_TIMEOUT_BASE],
    [behavior.type === "assigned-task", SHINOBI_IDLE_TASK_TIMEOUT_BASE],
    [behavior.type === "injured", SHINOBI_INJURED_TIMEOUT_BASE]
  );
  const until = behavior.since + timeout;

  return <progress max={100} value={100 - (100 * (until - now)) / timeout} />;
}

function Behavior({ id }: { id: Genin.Id }) {
  const { behavior } = useGameState((state) => {
    const shinobi = state.genin.record[id];
    return {
      behavior: shinobi.behavior,
    };
  });
  return (
    <>
      <div>
        {behavior.type === "idle" && <>(IDLE)</>}
        {behavior.type === "assigned-task" && <>({behavior.task.name})</>}
        {behavior.type === "injured" && <>(INJURED)</>}
        {behavior.type === "available" && <>(AVAILABLE)</>}
      </div>
      {behavior.type !== "available" && <ProgressBar behavior={behavior} />}
    </>
  );
}

function GeninCardContent({ id }: { id: Genin.Id }) {
  const { name } = useGameState((state) => {
    const shinobi = state.genin.record[id];
    return {
      name: shinobi.name,
    };
  });

  const { openToast } = useToast();

  const handleClickMessages = () => {
    openToast(`${id}'s messages`, <Messages id={id} />);
  };

  return (
    <>
      <div className="genin-name">
        <h4>{name}</h4>
        <button onClick={handleClickMessages}>Messages</button>
      </div>
      <Behavior id={id} />
      {false && <Messages id={id} />}
    </>
  );
}

export function GeninList() {
  const { shinobiIds } = useGameState((state) => ({
    shinobiIds: state.genin.ids,
  }));
  return (
    <ul id="genin-list">
      {shinobiIds.map((id) => (
        <li key={id} className="card">
          <GeninCardContent id={id} />
        </li>
      ))}
    </ul>
  );
}
