import { Genin as Genin, ShinobiInTraining, Task } from ".";
import { deviationFloat, uniqueId } from "../util";

export type Id = `shinobi-${string}`;

export interface BehaviorAssignedTask {
  type: "assigned-task";
  task: Task.T;
  since: number;
}

export interface BehaviorAvailable {
  type: "available";
  since: number;
}

export interface BehaviorIdle {
  type: "idle";
  since: number;
}

export interface BehaviorInjured {
  type: "injured";
  since: number;
}

export type Behavior =
  | BehaviorIdle
  | BehaviorAssignedTask
  | BehaviorInjured
  | BehaviorAvailable;

export function behaviorAssignedTask(task: Task.T): BehaviorAssignedTask {
  return {
    type: "assigned-task",
    task,
    since: Date.now(),
  };
}

export function behaviorIdle(): BehaviorIdle {
  return {
    type: "idle",
    since: Date.now(),
  };
}

export function behaviorAvailable(): BehaviorAvailable {
  return {
    type: "available",
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
  behavior: Behavior;
  messages: Message[];
}

export function make(shinobi?: ShinobiInTraining.T): T {
  const level = shinobi?.level ?? 0;
  const name = shinobi?.name;
  return {
    id: `shinobi-${uniqueId()}`,
    name: name ?? "Genin Joe",
    level,
    behavior: behaviorAvailable(),
    messages: [],
  };
}

export function addMessage(message: Message) {
  return (shinobi: Genin.T): Genin.T => ({
    ...shinobi,
    messages: [...shinobi.messages, message].slice(-10),
  });
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

export function taskExperienceGain(task: Task.T, shinobi: T) {
  const overlevel = Math.max(0, shinobi.level - task.level);
  return Math.ceil(
    deviationFloat(5 * (1 + task.level) ** 1.15 * 0.85 ** overlevel, 0.15)
  );
}
