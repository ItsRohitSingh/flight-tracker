import { Routes } from '@angular/router';
import { FlightTrackerComponent } from './flight-tracker/flight-tracker.component';
import { AirportScheduleComponent } from './airport-schedule/airport-schedule.component';

export const routes: Routes = [
  { path: 'flight/:id', component: FlightTrackerComponent },
  { path: 'airport/:code', component: AirportScheduleComponent },
];
