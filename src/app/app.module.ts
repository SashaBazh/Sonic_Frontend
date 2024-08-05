import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { routes } from './app.routes';
import { QuestComponent } from './pages/quest/quest.component';
import { MybankComponent } from './pages/mybank/mybank.component';
import { MyteamComponent } from './pages/myteam/myteam.component';
import { LoadingComponent } from './pages/loading/loading.component';
import { TaskService } from './services/task.service';
import { BuynftComponent } from './pages/buynft/buynft.component';
import { FormsModule } from '@angular/forms';
import { NftService } from '../app/services/nft.service';
import { TelegramService } from './services/telegram.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export function initializeApp(telegramService: TelegramService) {
  return () => telegramService.initializeApp();
}

@NgModule({
  declarations: [AppComponent, HomeComponent, BuynftComponent, QuestComponent, MybankComponent, MyteamComponent, LoadingComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,

  ],
  providers: [
    NftService,
    TaskService,
    TelegramService
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }