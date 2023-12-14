import { Shinobi, Task } from ".";
import { uniqueId } from "../util";

export type Id = `shinobi-${string}`;

export interface BehaviorAssignedTask {
  type: "assigned-task";
  task: Task.T;
}

export interface BehaviorIdle {
  type: "idle";
  since: number;
}

export interface BehaviorInjured {
  type: "injured";
  since: number;
}

export function behaviorAssignedTask(task: Task.T): BehaviorAssignedTask {
  return {
    type: "assigned-task",
    task,
  };
}

export function behaviorIdle(): BehaviorIdle {
  return {
    type: "idle",
    since: Date.now(),
  };
}

export function behaviorInjured(): BehaviorInjured {
  return {
    type: "injured",
    since: Date.now(),
  };
}

export type Message =
  | {
      type: "turned-idle";
      when: number;
    }
  | {
      type: "task-failed";
      when: number;
      task: Task.T;
    }
  | {
      type: "task-success";
      when: number;
      task: Task.T;
    };

export interface T {
  id: Id;
  name: string;
  level: number;
  behavior: BehaviorIdle | BehaviorAssignedTask | BehaviorInjured;
  messages: Message[];
}

export function make(): T {
  return {
    id: `shinobi-${uniqueId()}`,
    name: "Shinobi John",
    level: 0,
    behavior: Shinobi.behaviorIdle(),
    messages: [],
  };
}

export function addMessage(message: Message) {
  return (shinobi: Shinobi.T): Shinobi.T => ({
    ...shinobi,
    messages: shinobi.messages.concat(message).slice(0, 10),
  });
}

export function cost(shinobi: T) {
  return 5 * 1.25 ** shinobi.level;
}

function sigmoid(
  x: number,
  c?: { mid?: number; limit?: number; growth?: number }
) {
  const x0 = c?.mid ?? 0;
  const L = c?.limit ?? 1;
  const k = c?.growth ?? 1;
  return L / (1 + Math.E ** (-k * (x + x0)));
}

export function taskSuccessChance(task: Task.T, shinobi: T) {
  return sigmoid(shinobi.level - task.level, { mid: Math.log(3) });
}
