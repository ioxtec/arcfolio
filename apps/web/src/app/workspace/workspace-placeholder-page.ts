import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-workspace-placeholder-page',
  template: `
    <section class="placeholder">
      <h1>{{ title }}</h1>
      <p>Ten obszar przygotujemy w kolejnym etapie.</p>
    </section>
  `,
  styles: `
    .placeholder{min-height:65dvh;display:grid;place-content:center;text-align:center;color:var(--muted)}
    h1{margin:0;color:var(--ink);font-size:clamp(2.2rem,4vw,3.2rem);letter-spacing:-.05em}
    p{margin:12px 0 0}
  `,
})
export class WorkspacePlaceholderPage {
  protected readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
