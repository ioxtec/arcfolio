import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { BRAND_CONFIG } from './core/config/brand.config';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly brand = BRAND_CONFIG;
  private readonly documentTitle = inject(Title);

  constructor() {
    this.documentTitle.setTitle(BRAND_CONFIG.productName);
  }
}
