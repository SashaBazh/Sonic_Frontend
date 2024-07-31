import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
  private window: any;
  private tg: any;
  private webApp: any;

  
  constructor(@Inject(DOCUMENT) private _document: Document) {
    this.webApp = (window as any).Telegram.WebApp;
    this.window = this._document.defaultView;
    if (this.window && this.window.Telegram && this.window.Telegram.WebApp) {
      this.tg = this.window.Telegram.WebApp;
    } else {
      console.warn('Telegram WebApp SDK is not loaded or not available.');
    }
  }

  showAlert(message: string, callback?: () => void): void {
    if (this.tg && this.tg.showAlert) {
      this.tg.showAlert(message, callback);
    } else {
      console.warn('Telegram showAlert is not available. Message:', message);
      if (callback) callback();
    }
  }

  isTelegramWebAppAvailable(): boolean {
    return !!this.tg;
  }

  initializeApp(): void {
    if (this.tg) {
      this.tg.expand();
      this.tg.enableClosingConfirmation();
      this.tg.setViewportSettings({ rotate: false });
      this.tg.ready();
    }
  }

  expandApp() {
    if (this.webApp && typeof this.webApp.expand === 'function') {
      this.webApp.expand();
    } else {
      console.error('Telegram WebApp API is not available');
    }
  }
}