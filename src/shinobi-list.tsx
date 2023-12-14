import { JSX, memo } from "preact/compat";

import "./shinobi-list.css";

import { Shinobi, useGameState } from "./state";

const Messages = memo(function Messages({ id }: { id: Shinobi.Id }) {
  const { messages } = useGameState(
    (state) => ({
      messages: state.shinobi.record[id].messages,
    }),
    { debug: "messages" }
  );
  return (
    <ul id="shinobi-message-list">
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
});

function Behavior({ id }: { id: Shinobi.Id }) {
  const { behavior } = useGameState((state) => {
    const shinobi = state.shinobi.record[id];
    return {
      behavior: shinobi.behavior,
    };
  });
  return (
    <>
      <>
        {behavior.type === "idle" && <>(IDLE)</>}
        {behavior.type === "assigned-task" && <>({behavior.task.name})</>}
        {behavior.type === "injured" && <>(INJURED)</>}
      </>
    </>
  );
}

function ShinobiCardContent({ id }: { id: Shinobi.Id }) {
  const { name } = useGameState((state) => {
    const shinobi = state.shinobi.record[id];
    return {
      name: shinobi.name,
    };
  });
  return (
    <>
      <h4>{name}</h4>
      <Behavior id={id} />
      {false && <Messages id={id} />}
    </>
  );
}

export function ShinobiList() {
  const { shinobiIds } = useGameState((state) => ({
    shinobiIds: state.shinobi.ids,
  }));
  return (
    <ul id="shinobi-list">
      {shinobiIds.map((id) => (
        <li key={id} className="card">
          <ShinobiCardContent id={id} />
        </li>
      ))}
    </ul>
  );
}
