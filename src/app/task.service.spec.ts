import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TaskService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should load tasks and users through the data layer', () => {
    service.getTaskData().subscribe(({ tasks, users }) => {
      expect(tasks).toEqual([]);
      expect(users).toEqual([]);
    });

    httpTesting.expectOne('/api/tasks').flush([]);
    httpTesting.expectOne('/api/users').flush([]);
  });

  it('should create and update tasks through the data layer', () => {
    const task = {
      id: 4,
      Title: 'Review backlog',
      Description: 'Review outstanding work',
      AssignedToUserID: 1,
      DateEntered: '2026-09-03T10:00:00.000Z',
      DateCompleted: null,
    };

    service.createTask(task).subscribe((createdTask) => expect(createdTask).toEqual(task));
    const createRequest = httpTesting.expectOne('/api/tasks');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(task);
    createRequest.flush(task);

    service.updateTask(task).subscribe((updatedTask) => expect(updatedTask).toEqual(task));
    const updateRequest = httpTesting.expectOne('/api/tasks/4');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(task);
    updateRequest.flush(task);
  });
});
