import { Injectable } from '@angular/core';

export type ThemeMode = 'bright' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme-mode';
  private currentTheme: ThemeMode = 'dark';

  constructor() {
    this.loadTheme();
  }

  getTheme(): ThemeMode {
    return this.currentTheme;
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme === 'dark' ? 'bright' : 'dark';
    this.setTheme(newTheme);
  }

  private loadTheme(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode;
    if (saved === 'bright' || saved === 'dark') {
      this.currentTheme = saved;
    } else {
      // 預設為 dark
      this.currentTheme = 'dark';
    }
    this.applyTheme(this.currentTheme);
  }

  private saveTheme(theme: ThemeMode): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    if (theme === 'bright') {
      root.classList.remove('dark-mode');
      root.classList.add('bright-mode');
    } else {
      root.classList.remove('bright-mode');
      root.classList.add('dark-mode');
    }
  }
}
