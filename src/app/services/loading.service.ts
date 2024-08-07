import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private isLoadingSubject = new BehaviorSubject<boolean>(true);

  setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  getLoading(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }
}