import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
       
  private window: any;
  tg: any;
  
  constructor(@Inject(Document) private _document: Document) {
    this.window = this._document.defaultView;
    if (this.window && this.window.Telegram && this.window.Telegram.WebApp) {
      this.tg = this.window.Telegram.WebApp;
    } else {
      console.error('Telegram WebApp SDK is not loaded or not available.');
    }
  }
}

