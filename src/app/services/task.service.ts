import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface Task {
  task_id: number;
  name: string;
  award: number;
  condition: string;
  image_uri?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public static readonly API_URL = 'https://harrypotterobamasonic.com/api/';

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  updateTasks(tasks: Task[]) {
    alert('Updating tasksSubject with: ' + JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  constructor(private http: HttpClient) { }

  getAvailableTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${TaskService.API_URL}task/`, { headers: TaskService.headers }).pipe(
      tap(tasks => {
        this.tasksSubject.next(tasks);
      }),
      catchError(error => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  completeTask(taskId: number): Observable<any> {
    return this.http.post<any>(`${TaskService.API_URL}task/`, { task_id: taskId }, { headers: TaskService.headers }).pipe(
      tap(response => {
        const currentTasks = this.tasksSubject.value;
        const updatedTasks = currentTasks.map(task =>
          task.task_id === taskId ? { ...task, completed: true } : task
        );
        this.tasksSubject.next(updatedTasks);
      }),
      catchError(this.handleError)
    );
  }

  public static get headers(): HttpHeaders {
    const telegramInitData = (window as any).Telegram?.WebApp?.initData || '';
    return new HttpHeaders()
      .set('X-Telegram-Init-Data', telegramInitData)
      .set('Content-Type', 'application/json');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error details:', error);
    return throwError(() => new Error(error.message));
  }
}