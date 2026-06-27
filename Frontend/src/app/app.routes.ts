import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { GameComponent } from './pages/game/game.component';
import { JoinCodeComponent } from './pages/game/join-code.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game/:roomCode', component: GameComponent },
  { path: 'join/:roomCode', component: JoinCodeComponent },
  { path: '**', redirectTo: '' }
];
