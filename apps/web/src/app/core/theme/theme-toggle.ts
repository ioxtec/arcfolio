import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      type="button"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.theme() === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'"
      [attr.aria-pressed]="theme.theme() === 'dark'"
    >
      @if (theme.theme() === 'dark') {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" />
        </svg>
      }
    </button>
  `,
  styles: `
    :host { display: block; }
    button {
      display: grid;
      width: 44px;
      height: 44px;
      place-items: center;
      padding: 0;
      border: 1px solid var(--line, #cfd6e5);
      border-radius: 50%;
      background: var(--control-bg, #fff);
      color: var(--ink, #08122d);
      cursor: pointer;
      transition: border-color 150ms ease, background 150ms ease, color 150ms ease, transform 150ms ease;
    }
    button:hover { border-color: var(--accent, #3157dc); transform: translateY(-1px); }
    svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
}
