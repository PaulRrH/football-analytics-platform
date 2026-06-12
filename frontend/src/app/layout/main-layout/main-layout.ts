import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

const BASE_NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Equipos', path: '/teams', icon: 'groups' },
  { label: 'Competiciones', path: '/competitions', icon: 'emoji_events' },
  { label: 'Partidos', path: '/matches', icon: 'sports_soccer' },
  { label: 'Head to Head', path: '/head-to-head', icon: 'compare_arrows' },
];

const ADMIN_NAV_LINKS: NavLink[] = [
  { label: 'Usuarios', path: '/admin/users', icon: 'manage_accounts' },
  { label: 'Auditoría', path: '/admin/audit-log', icon: 'history' },
];

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidenavOpened = signal(true);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;

  readonly navLinks = computed(() =>
    this.authService.isAdmin() ? [...BASE_NAV_LINKS, ...ADMIN_NAV_LINKS] : BASE_NAV_LINKS,
  );

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/dashboard']);
  }
}
