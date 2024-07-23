import { Component, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TaskService } from '../../services/task.service';

interface Task {
  task_id: number;
  name: string;
  award: number;
  condition: string;
  image_uri?: string;
  description?: string;  
  completed?: boolean;
  loading?: boolean;    
}

@Component({
  selector: 'app-quest',
  templateUrl: './quest.component.html',
  styleUrl: './quest.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class QuestComponent {

  tasks: Task[] = [];
  selectedTask: Task | null = null;

  constructor(private http: HttpClient, private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
    this.taskService.tasks$.subscribe(
      tasks => {
        this.tasks = tasks.map(task => ({...task, loading: false}));
      },
    );
  }
  
  loadTasks() {
    this.taskService.getAvailableTasks().subscribe(
      tasks => {
        this.tasks = tasks.map(task => ({...task, loading: false}));
      },
    );
  }

  openTaskModal(task: Task) {
    this.selectedTask = task;
  }

  closeTaskModal() {
    this.selectedTask = null;
  }

  startTask(task: Task) {
    if (task.completed || task.loading) return;
  
    task.loading = true;
  
    window.open(task.condition, '_blank');
  
    setTimeout(() => {
      this.taskService.completeTask(task.task_id).subscribe(
        response => {
          task.loading = false;
          task.completed = true;
        },
        error => {
          task.loading = false;
        }
      );
    }, 5000);
  }
}