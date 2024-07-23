import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  percentage = 0;

  constructor(
    private router: Router, 
    private loadingService: LoadingService
  ) {}

  async ngOnInit() {
    if (!this.loadingService.getLoading()) {
      this.navigateToHome();
      return;
    }

    try {
      await this.loadAudioAndAnimate();
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  ngOnDestroy() {
  }

  async loadAudioAndAnimate() {
    const animationPromise = this.animateLoading();
  }


  animateLoading(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        this.percentage += 1;
        if (this.percentage >= 100) {
          clearInterval(interval);
          this.navigateToHome();
          resolve();
        }
      }, 50);
    });
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}