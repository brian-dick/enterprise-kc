import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Task, User } from './in-memory-data';

export interface NewTask {
  Title: string;
  Description: string;
  AssignedToUserID: number | null;
  DateEntered: string;
  DateCompleted: string | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  getTasks() {
    return this.http.get<Task[]>('/api/tasks');
  }

  getUsers() {
    return this.http.get<User[]>('/api/users');
  }

  getTaskData() {
    return forkJoin({
      tasks: this.getTasks(),
      users: this.getUsers(),
    });
  }

  createTask(task: NewTask) {
    return this.http.post<Task>('/api/tasks', task);
  }

  updateTask(task: Task) {
    return this.http.put<Task>(`/api/tasks/${task.id}`, task);
  }
}
