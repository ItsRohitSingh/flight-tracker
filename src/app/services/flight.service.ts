import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { Observable } from 'rxjs';
import { FlightStatus, AirportSchedule } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FlightService {

  constructor(private mockDataService: MockDataService) { }

  trackFlight(flightNumber: string): Observable<FlightStatus | null> {
    return this.mockDataService.getFlightStatus(flightNumber);
  }

  getSchedule(airportCode: string, hours: number): Observable<AirportSchedule[]> {
    return this.mockDataService.getAirportSchedule(airportCode, hours);
  }

  getSuggestions(query: string) {
    return this.mockDataService.getSuggestions(query);
  }
}
