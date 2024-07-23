import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoadingGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.router.navigate(['/home']);
        resolve(false);
      }, 3000);
    });
  }
}