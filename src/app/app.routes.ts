import { Routes } from '@angular/router';
import { FlightTrackerComponent } from './flight-tracker/flight-tracker.component';
import { AirportScheduleComponent } from './airport-schedule/airport-schedule.component';
import { RouteSearchComponent } from './route-search/route-search.component';

export const routes: Routes = [
  { path: 'flight/:id', component: FlightTrackerComponent },
  { path: 'airport/:code', component: AirportScheduleComponent },
  { path: 'route/:origin/:destination', component: RouteSearchComponent }
];
