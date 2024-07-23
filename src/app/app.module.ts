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
import { GameComponent } from './pages/game/game.component';
import { NftService } from '../app/services/nft.service';

@NgModule({
  declarations: [AppComponent, HomeComponent, BuynftComponent, QuestComponent, MybankComponent, MyteamComponent, LoadingComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
    
  ],
  providers: [
    NftService,
    TaskService
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }