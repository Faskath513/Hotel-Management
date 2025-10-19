import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';

// Feature components
import { LoginComponent } from './components/login/login.component';
// import { HotelService } from './services/hotel.service'; // Uncomment when available

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LoginComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  // UI State
  mobileOpen = false;
  isCheckingAuth = true;
  
  // System Status
  apiHealthy = true;
  appVersion = '1.0.0';
  currentYear = new Date().getFullYear();
  
  // Navigation items
  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/rooms', label: 'Rooms', icon: '🛏️' },
    { path: '/guests', label: 'Guests', icon: '👥' },
    { path: '/bookings', label: 'Bookings', icon: '📅' },
    { path: '/payments', label: 'Payments', icon: '💳' },
    { path: '/reports', label: 'Reports', icon: '📈' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router
    // private hotelService: HotelService // Uncomment when available
  ) {}

  ngOnInit(): void {
    this.restoreTheme();
    this.checkApiHealth();
    this.setupRouterEvents();
    
    // Simulate auth check completion
    setTimeout(() => this.isCheckingAuth = false, 300);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // Authentication
  // ============================================
  
  get token(): string | null {
    try { 
      return localStorage.getItem('auth_token'); 
    } catch { 
      return null; 
    }
  }

  get username(): string {
    try { 
      return localStorage.getItem('auth_user') ?? 'User'; 
    } catch { 
      return 'User'; 
    }
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  onLoggedIn(): void {
    this.mobileOpen = false;
    this.isCheckingAuth = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigateByUrl('/dashboard');
  }

  doLogout(): void {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    this.mobileOpen = false;
    this.router.navigateByUrl('/');
    
    // Optional: Show logout success message
    // this.showNotification('Logged out successfully');
  }

  // ============================================
  // Navigation
  // ============================================

  private setupRouterEvents(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Close mobile menu on navigation
        this.mobileOpen = false;
        // Scroll to top on route change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile(): void {
    this.mobileOpen = false;
  }

  // ============================================
  // Theme Management
  // ============================================

  get isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  toggleDark(): void {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const theme = html.classList.contains('dark') ? 'dark' : 'light';
    
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Theme save error:', error);
    }
  }

  private restoreTheme(): void {
    try {
      const saved = localStorage.getItem('theme');
      const html = document.documentElement;
      
      // Check system preference if no saved theme
      if (!saved) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          html.classList.add('dark');
        }
      } else if (saved === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    } catch (error) {
      console.error('Theme restore error:', error);
    }
  }

  // ============================================
  // System Health
  // ============================================

  private checkApiHealth(): void {
    // Uncomment when HotelService is available
    /*
    this.hotelService.checkHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.apiHealthy = true;
        },
        error: () => {
          this.apiHealthy = false;
          console.error('API health check failed');
        }
      });
    */
    
    // Mock health check for now
    this.apiHealthy = true;
  }

  // ============================================
  // Utility Methods
  // ============================================

  trackByPath(index: number, item: any): string {
    return item.path;
  }
}