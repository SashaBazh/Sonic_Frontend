// transition.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransitionService {
  private isTransitioning = new BehaviorSubject<boolean>(false);
  isTransitioning$ = this.isTransitioning.asObservable();

  startTransition() {
    this.isTransitioning.next(true);
  }

  endTransition() {
    this.isTransitioning.next(false);
  }
}