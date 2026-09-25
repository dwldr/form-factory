import {Component} from '@angular/core';
import {Home} from './home/home';

@Component({
  selector: 'app-root',
  imports: [Home],
  template: `
    <main>
      <header class="brand-name">
        <img class="brand-logo" src="/brand-black.svg" alt="Form Factory" aria-hidden="true" />
      </header>
      <section class="content">
        <app-home />
      </section>
    </main>
  `,
  styleUrls: ['./app.css'],
})
export class App {
  title = 'Form Factory';
}
