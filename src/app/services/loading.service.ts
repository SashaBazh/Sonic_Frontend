import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private isLoading = true;

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  getLoading(): boolean {
    return this.isLoading;
  }
}