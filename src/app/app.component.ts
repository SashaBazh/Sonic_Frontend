import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { TelegramService } from './services/telegram.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private router: Router, private loadingService: LoadingService, private telegramService: TelegramService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url !== '/') {
          this.loadingService.setLoading(true);
        }
      }
    });
  }

  ngOnInit() {
    this.telegramService.expandApp();
  }

  expandApp() {
    this.telegramService.expandApp();
  }
}