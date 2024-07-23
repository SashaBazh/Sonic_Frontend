import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MybankComponent } from './pages/mybank/mybank.component';
import { MyteamComponent } from './pages/myteam/myteam.component';
import { QuestComponent } from './pages/quest/quest.component';
import { BuynftComponent } from './pages/buynft/buynft.component';
import { GameComponent } from './pages/game/game.component';
import { LoadingComponent } from './pages/loading/loading.component';

export const routes: Routes = [
    { path: '', component: LoadingComponent,  pathMatch: 'full'},
    { path: 'home', component: HomeComponent},
    { path: 'mybank', component: MybankComponent },
    { path: 'team', component: MyteamComponent },
    { path: 'quest', component: QuestComponent },
    { path: 'buynft', component: BuynftComponent },
    { path: 'game', component: GameComponent },
    { path: 'loading', component: LoadingComponent },

];
