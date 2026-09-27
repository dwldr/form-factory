import { Component, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "./store";
@Component({
  template: `<section class="response-paper account-page">
    <h1>Choose a demo account</h1>
    <p class="muted">Account switching is simulated in this browser.</p>
    <div class="account-options">
      <button class="secondary" (click)="choose('derek')">
        Derek Wilder · Administrator</button
      ><button class="secondary" (click)="choose('alex')">
        Alex Morgan · Viewer</button
      ><button class="secondary" (click)="choose('guest')">
        Continue signed out
      </button>
    </div>
  </section>`,
})
export class Account {
  store = inject(Store);
  route = inject(ActivatedRoute);
  router = inject(Router);
  choose(user: string) {
    this.store.setAccount(user);
    const next = this.route.snapshot.queryParamMap.get("returnTo") ?? "/";
    void this.router.navigateByUrl(
      next.startsWith("/") && !next.startsWith("//") ? next : "/",
    );
  }
}
