import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  @ViewChild('loadingBar')
  loadingBar!: ElementRef;
  percentage = 0;
  private animationStartTime: number | null = null;
  private animationDuration = 2800;
  private animationFrameId: number | null = null;

  constructor(
    private router: Router, 
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    if (!this.loadingService.getLoading()) {
      this.navigateToHome();
    } else {
      this.startLoading();
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  startLoading() {
    this.animationStartTime = performance.now();
    this.animateLoading();
  }

  animateLoading() {
    const currentTime = performance.now();
    const elapsedTime = currentTime - (this.animationStartTime || currentTime);
    
    if (elapsedTime < this.animationDuration) {
      this.percentage = Math.min(100, Math.floor((elapsedTime / this.animationDuration) * 100));
      this.animationFrameId = requestAnimationFrame(() => this.animateLoading());
    } else {
      this.percentage = 100;
      this.loadingService.setLoading(false);
      this.navigateToHome();
    }
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}