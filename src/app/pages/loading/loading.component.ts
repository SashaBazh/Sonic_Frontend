// loading.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, NgZone  } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingService } from '../../services/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  @ViewChild('loadingBar', { static: true })
  loadingBar!: ElementRef;
  private animationStartTime: number | null = null;
  private animationDuration = 2800;
  private animationFrameId: number | null = null;
  private loadingSubscription: Subscription | null = null;
  percentage = 0;

  constructor(
    private router: Router, 
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    console.log('Component initialized');
    this.ngZone.runOutsideAngular(() => {
      this.startLoading();
    });
    this.loadingSubscription = this.loadingService.getLoading().subscribe(
      isLoading => {
        if (!isLoading) {
          this.ngZone.run(() => {
            this.navigateToHome();
          });
        }
      }
    );
  }

  ngAfterViewInit() {
    console.log('Loading bar element:', this.loadingBar);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
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
      this.cdr.detectChanges();
      this.animationFrameId = requestAnimationFrame(() => this.animateLoading());
    } else {
      this.percentage = 100;
      this.cdr.detectChanges();
      this.loadingService.setLoading(false);
    }
  }


  navigateToHome() {
    this.router.navigate(['/home']);
  }
}