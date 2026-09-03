import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
	let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpTesting.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();

    httpTesting.expectOne('/api/tasks').flush([]);
    httpTesting.expectOne('/api/users').flush([]);
  });

  it('should display the assigned user name for each task', () => {
    const fixture = TestBed.createComponent(App);
    const longDescription = 'Prepare the monthly report for review';
    httpTesting.expectOne('/api/tasks').flush([
      {
        id: 4,
        Title: 'Prepare report',
        Description: longDescription,
        AssignedToUserID: 2,
        DateEntered: '2026-09-03',
        DateCompleted: null,
      },
    ]);
    httpTesting.expectOne('/api/users').flush([
      { id: 2, FirstName: 'RJ', LastName: 'Pericola' },
    ]);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cells = [...compiled.querySelectorAll('tbody tr:first-child td')]
      .map((cell) => cell.textContent?.trim());
    const descriptionCell = compiled.querySelector('.description-cell') as HTMLElement;
    const descriptionText = descriptionCell.querySelector('.description-text') as HTMLElement;
    const visibleDescription = descriptionText.firstChild?.textContent?.trim();

    expect(visibleDescription).toBe(`${longDescription.slice(0, 30)}...`);
    expect(descriptionText.getAttribute('title')).toBe(longDescription);
    expect(descriptionCell.querySelector('.description-tooltip')?.textContent?.trim())
      .toBe(longDescription);
    expect(cells).toEqual(['4', 'Prepare report', expect.stringContaining('Prepare the monthly report for...'), 'RJ Pericola', '2026-09-03', '']);
  });

  it('should create a task and refresh the grid', () => {
    const fixture = TestBed.createComponent(App);
    httpTesting.expectOne('/api/tasks').flush([]);
    httpTesting.expectOne('/api/users').flush([
      { id: 1, FirstName: 'Brian', LastName: 'Dick' },
    ]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.primary-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('#task-title') as HTMLInputElement;
    const description = fixture.nativeElement.querySelector('#task-description') as HTMLTextAreaElement;
    const assignee = fixture.nativeElement.querySelector('#task-assignee') as HTMLSelectElement;
    expect(title).toBeTruthy();
    expect(description.rows).toBe(3);
    expect(assignee).toBeTruthy();
    (fixture.componentInstance as any).newTask = {
      title: 'Review backlog',
      description: 'Review outstanding work',
      assignedToUserID: 1,
    };

    (fixture.componentInstance as any).submitNewTask();
    const request = httpTesting.expectOne('/api/tasks');
    expect(request.request.body).toMatchObject({
      Title: 'Review backlog',
      Description: 'Review outstanding work',
      AssignedToUserID: 1,
      DateCompleted: null,
    });
    expect(request.request.body.DateEntered).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    request.flush({
      id: 1,
      Title: 'Review backlog',
      Description: 'Review outstanding work',
      AssignedToUserID: 1,
      DateEntered: request.request.body.DateEntered,
      DateCompleted: null,
    });

    httpTesting.expectOne('/api/tasks').flush([]);
    httpTesting.expectOne('/api/users').flush([
      { id: 1, FirstName: 'Brian', LastName: 'Dick' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('should open a task from its title and mark it completed', () => {
    const fixture = TestBed.createComponent(App);
    const task = {
      id: 3,
      Title: 'Close ticket',
      Description: 'Close the support ticket',
      AssignedToUserID: 1,
      DateEntered: '2026-09-02T10:00:00.000Z',
      DateCompleted: null,
    };
    httpTesting.expectOne('/api/tasks').flush([task]);
    httpTesting.expectOne('/api/users').flush([
      { id: 1, FirstName: 'Brian', LastName: 'Dick' },
    ]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.title-cell a') as HTMLAnchorElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#task-completed')).toBeTruthy();
    expect((fixture.componentInstance as any).newTask.title).toBe('Close ticket');

    (fixture.componentInstance as any).newTask.taskCompleted = true;
    (fixture.componentInstance as any).submitNewTask();
    const request = httpTesting.expectOne('/api/tasks/3');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({
      Title: 'Close ticket',
      Description: 'Close the support ticket',
      AssignedToUserID: 1,
      DateEntered: '2026-09-02T10:00:00.000Z',
    });
    expect(request.request.body.DateCompleted).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    request.flush({ ...task, DateCompleted: request.request.body.DateCompleted });

    httpTesting.expectOne('/api/tasks').flush([{ ...task, DateCompleted: request.request.body.DateCompleted }]);
    httpTesting.expectOne('/api/users').flush([
      { id: 1, FirstName: 'Brian', LastName: 'Dick' },
    ]);
  });

  it('should hide completed tasks by default and show them after toggling', () => {
    const fixture = TestBed.createComponent(App);
    const completedTask = {
      id: 1,
      Title: 'Completed task',
      Description: '',
      AssignedToUserID: null,
      DateEntered: '2026-09-01T10:00:00.000Z',
      DateCompleted: '2026-09-02T10:00:00.000Z',
    };
    const openTask = {
      ...completedTask,
      id: 2,
      Title: 'Open task',
      DateCompleted: null,
    };
    httpTesting.expectOne('/api/tasks').flush([completedTask, openTask]);
    httpTesting.expectOne('/api/users').flush([]);
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('#show-completed-tasks') as HTMLInputElement).checked)
      .toBe(false);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.title-cell').textContent).toContain('Open task');

    (fixture.nativeElement.querySelector('#show-completed-tasks') as HTMLInputElement).click();
    httpTesting.expectOne('/api/tasks').flush([completedTask, openTask]);
    httpTesting.expectOne('/api/users').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('should sort rows by a header and reset direction for a new column', () => {
    const fixture = TestBed.createComponent(App);
    const tasks = [
      {
        id: 3,
        Title: 'Bravo',
        Description: '',
        AssignedToUserID: null,
        DateEntered: '2026-09-03T10:00:00.000Z',
        DateCompleted: null,
      },
      {
        id: 1,
        Title: 'Charlie',
        Description: '',
        AssignedToUserID: null,
        DateEntered: '2026-09-01T10:00:00.000Z',
        DateCompleted: null,
      },
      {
        id: 2,
        Title: 'Alpha',
        Description: '',
        AssignedToUserID: null,
        DateEntered: '2026-09-02T10:00:00.000Z',
        DateCompleted: null,
      },
    ];
    httpTesting.expectOne('/api/tasks').flush(tasks);
    httpTesting.expectOne('/api/users').flush([]);
    fixture.detectChanges();

    const getIds = () => [...fixture.nativeElement.querySelectorAll('.id-cell')]
      .map((cell) => cell.textContent?.trim());
    const getTitles = () => [...fixture.nativeElement.querySelectorAll('.title-cell')]
      .map((cell) => cell.textContent?.trim());

    expect(getIds()).toEqual(['1', '2', '3']);

    (fixture.nativeElement.querySelector('[data-sort="title"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(getTitles()).toEqual(['Alpha', 'Bravo', 'Charlie']);

    (fixture.nativeElement.querySelector('[data-sort="title"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(getTitles()).toEqual(['Charlie', 'Bravo', 'Alpha']);

    (fixture.nativeElement.querySelector('[data-sort="id"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(getIds()).toEqual(['1', '2', '3']);
  });
});
