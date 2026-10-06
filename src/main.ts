import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { App } from './app/app.component';
import { DashboardComponent } from './app/pages/dashboard.component';
import { CampanasComponent } from './app/pages/campanas.component';
import { PerfilComponent } from './app/pages/perfil.component';
import { MapaComponent } from './app/pages/mapa.component';
import { LoginComponent } from './app/auth/login.component';
import { RegisterComponent } from './app/auth/register.component';
import { FeedComponent } from './app/pages/feed.component';
import { ChatComponent } from './app/pages/chat.component';
import { authGuard } from './app/guards/auth.guard';

bootstrapApplication(App, {
  providers: [
    provideRouter(
      [
        { path: '',         component: DashboardComponent, canActivate: [authGuard] },
        { path: 'mapa',     component: MapaComponent, canActivate: [authGuard] },
        { path: 'campanas', component: CampanasComponent },
        { path: 'perfil',   component: PerfilComponent, canActivate: [authGuard] },
        { path: 'login',    component: LoginComponent },
        { path: 'register', component: RegisterComponent },
        { path: 'feed',     component: FeedComponent, canActivate: [authGuard] },
        { path: 'chat',     component: ChatComponent, canActivate: [authGuard] },
        { path: '**',       redirectTo: 'login' },
      ],
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withFetch()),
  ],
}).catch((err) => console.error(err));
