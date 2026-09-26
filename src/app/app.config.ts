import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      {
        path: "",
        loadComponent: () => import("./dashboard").then((m) => m.Dashboard),
        title: "Home · Form Factory",
      },
      {
        path: "forms",
        loadComponent: () => import("./dashboard").then((m) => m.Dashboard),
        title: "My Forms · Form Factory",
      },
      {
        path: "shared",
        loadComponent: () => import("./dashboard").then((m) => m.Dashboard),
        title: "Shared with Me · Form Factory",
      },
      {
        path: "templates",
        loadComponent: () => import("./templates").then((m) => m.Templates),
        title: "Templates · Form Factory",
      },
      {
        path: "insights",
        loadComponent: () => import("./insights").then((m) => m.Insights),
        title: "Insights · Form Factory",
      },
      {
        path: "settings",
        loadComponent: () => import("./team").then((m) => m.Team),
        title: "Team Settings · Form Factory",
      },
      {
        path: "members",
        loadComponent: () => import("./team").then((m) => m.Team),
        title: "Members · Form Factory",
      },
      {
        path: "forms/:id/edit",
        loadComponent: () => import("./editor").then((m) => m.Editor),
        title: "Edit form · Form Factory",
      },
      {
        path: "forms/:id/view",
        loadComponent: () => import("./viewer").then((m) => m.Viewer),
        title: "View form · Form Factory",
      },
      { path: "**", redirectTo: "" },
    ]),
  ],
};
