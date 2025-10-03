import { Injectable, Scope } from '@nestjs/common';
import type { Task, TaskStatus } from '@workspace/types/discord-bot';

/**
 * Service responsible for managing an ordered collection of tasks in-memory.
 *
 * The service stores tasks in a Map for quick lookup and a separate array to
 * preserve insertion/order. It is registered as a transient Nest provider so
 * each consumer receives a fresh instance.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class TasksService {
  private taskMap: Map<string, Task> = new Map();
  private order: string[] = [];

  /**
   * Construct a new TasksService instance.
   *
   * The constructor performs no work; internal maps are initialized lazily.
   */
  constructor() {}

  /**
   * Return a short emoji that represents the provided task status.
   *
   * @param status - The status of a task.
   * @returns A single emoji string suitable for compact display of status.
   */
  getEmoji(status: TaskStatus): string {
    switch (status) {
      case 'draft':
        return '📋';
      case 'skip':
        return '🚫';
      case 'pending':
        return '📍';
      case 'success':
        return '✅';
      case 'warn':
        return '⚠️';
      case 'danger':
        return '🚨';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Replace the current in-memory tasks with the given ordered array.
   *
   * This clears any existing tasks and re-populates the internal lookup Map
   * and order array using the provided tasks' `id` property to preserve the
   * supplied ordering.
   *
   * @param tasks - Array of tasks to load into the service.
   */
  fromArray(tasks: Task[]) {
    this.taskMap.clear();
    this.order = [];
    for (const t of tasks) {
      this.taskMap.set(t.id, t);
      this.order.push(t.id);
    }
  }

  /**
   * Return the tasks in their preserved order as an array.
   *
   * @returns Ordered array of tasks currently stored in the service.
   */
  toArray(): Task[] {
    return this.order.map((id) => this.taskMap.get(id)!).filter(Boolean);
  }

  /**
   * Render the given tasks (or the service's tasks if none provided) as a
   * fenced Markdown block suitable for posting to Discord.
   *
   * Each line contains the status emoji, task name and an optional memo.
   *
   * @param tasks - Optional array of tasks to render; defaults to internal tasks.
   * @returns A string containing a markdown fenced code block with task lines.
   */
  toMarkdownBlock(tasks?: Task[]): string {
    const arr = tasks ?? this.toArray();
    const messages = ['```markdown'];
    for (const task of arr) {
      messages.push(`- ${this.getEmoji(task.status)} ${task.name} ${task.memo ? `(📝: ${task.memo})` : ''}`);
    }
    messages.push('```');
    return messages.join('\n');
  }

  /**
   * Apply status updates to tasks by id and return the updated ordered array.
   *
   * The method ignores updates for unknown ids. Only the `status` and `id`
   * fields from each update are merged onto the existing task object.
   *
   * @param updates - Array of objects containing `id` and new `status`.
   * @returns The service's tasks as an ordered array after applying updates.
   */
  updateTask(updates: { id: string; status: TaskStatus }[]) {
    for (const upd of updates) {
      const prev = this.taskMap.get(upd.id);
      if (!prev) continue;
      this.taskMap.set(upd.id, { ...prev, ...upd });
    }
    return this.toArray();
  }

  /**
   * Mark a task as `success` and return the updated tasks.
   * @param id - The id of the task to mark.
   * @returns Updated ordered array of tasks.
   */
  markSuccess(id: string): Task[] {
    return this.updateTask([{ id, status: 'success' }]);
  }

  /**
   * Mark a task as `draft` and return the updated tasks.
   * @param id - The id of the task to mark.
   * @returns Updated ordered array of tasks.
   */
  markDraft(id: string): Task[] {
    return this.updateTask([{ id, status: 'draft' }]);
  }

  /**
   * Mark a task as `skip` and return the updated tasks.
   * @param id - The id of the task to mark.
   * @returns Updated ordered array of tasks.
   */
  markSkip(id: string): Task[] {
    return this.updateTask([{ id, status: 'skip' }]);
  }

  /**
   * Mark a task as `pending` and return the updated tasks.
   * @param id - The id of the task to mark.
   * @returns Updated ordered array of tasks.
   */
  markPending(id: string): Task[] {
    return this.updateTask([{ id, status: 'pending' }]);
  }

  /**
   * Mark a task as `warn` and return the updated tasks.
   * @param id - The id of the task to mark.
   * @returns Updated ordered array of tasks.
   */
  markWarn(id: string): Task[] {
    return this.updateTask([{ id, status: 'warn' }]);
  }

  /**
   * Mark a task as `danger` and return the updated tasks.
   * @param id - The id of the task to mark.
   * @returns Updated ordered array of tasks.
   */
  markDanger(id: string): Task[] {
    return this.updateTask([{ id, status: 'danger' }]);
  }

  /**
   * Mark a task as `error` and return the updated tasks.
   * @param id - The id of the task to mark.
   * @returns Updated ordered array of tasks.
   */
  markError(id: string): Task[] {
    return this.updateTask([{ id, status: 'error' }]);
  }
}
