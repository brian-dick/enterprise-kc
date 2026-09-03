import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, User } from './in-memory-data';
import { TaskService } from './task.service';

interface TaskRow {
  id: number;
  title: string;
  description: string;
  descriptionTooltip: string | null;
  assignedTo: string;
  dateEntered: string;
  dateCompleted: string | null;
}

type SortColumn = keyof TaskRow;
type SortDirection = 'asc' | 'desc';

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly taskService = inject(TaskService);
  protected readonly tasks = signal<TaskRow[]>([]);
  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly isModalOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal(false);
  protected readonly editingTaskId = signal<number | null>(null);
  protected readonly showCompletedTasks = signal(false);
  protected readonly sortColumn = signal<SortColumn>('id');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected newTask = this.createEmptyTask();

  constructor() {
    this.loadData();
  }

  protected openNewTaskModal(): void {
		this.editingTaskId.set(null);
    this.newTask = this.createEmptyTask();
    this.submitError.set(false);
    this.isModalOpen.set(true);
  }

  protected openTaskModal(taskId: number): void {
    const task = this.loadedTasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    this.editingTaskId.set(task.id);
    this.newTask = {
      title: task.Title,
      description: task.Description,
      assignedToUserID: task.AssignedToUserID,
      taskCompleted: task.DateCompleted !== null,
    };
    this.submitError.set(false);
    this.isModalOpen.set(true);
  }

  protected closeNewTaskModal(): void {
    if (!this.isSubmitting()) {
      this.isModalOpen.set(false);
    }
  }

  protected toggleCompletedTasks(): void {
    this.showCompletedTasks.update((showCompleted) => !showCompleted);
    this.loadData();
  }

  protected sortBy(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.tasks.set(this.sortRows(this.tasks()));
  }

  protected submitNewTask(): void {
    this.isSubmitting.set(true);
    this.submitError.set(false);

    const taskData = {
      Title: this.newTask.title,
      Description: this.newTask.description,
      AssignedToUserID: this.newTask.assignedToUserID,
    };
    const editingTaskId = this.editingTaskId();
    const existingTask = editingTaskId === null
      ? undefined
      : this.loadedTasks.find((task) => task.id === editingTaskId);
    const request = editingTaskId === null
      ? this.taskService.createTask({
        ...taskData,
        DateEntered: new Date().toISOString(),
        DateCompleted: null,
      })
      : this.taskService.updateTask({
        id: editingTaskId,
        ...taskData,
        DateEntered: existingTask!.DateEntered,
        DateCompleted: this.newTask.taskCompleted ? new Date().toISOString() : null,
      });

    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isModalOpen.set(false);
        this.loadData();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set(true);
      },
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(false);

    this.taskService.getTaskData().subscribe({
      next: ({ tasks, users }) => {
        this.loadedTasks = tasks;
        this.users.set(users);
        const usersById = new Map(users.map((user) => [user.id, user]));

        this.tasks.set(this.sortRows(
          tasks
            .filter((task) => this.showCompletedTasks() || task.DateCompleted === null)
            .map((task) => {
            const user = task.AssignedToUserID === null
              ? undefined
              : usersById.get(task.AssignedToUserID);

            return {
              id: task.id,
              title: task.Title,
              description: task.Description.length > 30
                ? `${task.Description.slice(0, 30)}...`
                : task.Description,
              descriptionTooltip: task.Description.length > 30 ? task.Description : null,
              assignedTo: user ? `${user.FirstName} ${user.LastName}` : 'Unassigned',
              dateEntered: task.DateEntered,
              dateCompleted: task.DateCompleted,
            };
            }),
          ));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadedTasks: Task[] = [];

  private createEmptyTask() {
    return {
      title: '',
      description: '',
      assignedToUserID: null as number | null,
      taskCompleted: false,
    };
  }

  private sortRows(rows: TaskRow[]): TaskRow[] {
    const column = this.sortColumn();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...rows].sort((left, right) => {
      const leftValue = left[column] ?? '';
      const rightValue = right[column] ?? '';
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });

      return comparison * direction;
    });
  }
}
