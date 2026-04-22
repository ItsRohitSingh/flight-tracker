import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, forkJoin } from 'rxjs';
import { FlightStatus, AirportSchedule } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = 'http://api.aviationstack.com/v1/flights';

  constructor(private http: HttpClient) { }

  trackFlight(flightNumber: string): Observable<FlightStatus | null> {
    if (environment.aviationstackApiKey === 'YOUR_AVIATIONSTACK_API_KEY_HERE') {
      console.warn('Aviationstack API key is not configured.');
      return of(null);
    }

    return this.http.get<any>(`${this.apiUrl}?access_key=${environment.aviationstackApiKey}&flight_iata=${flightNumber}`).pipe(
      map(response => {
        if (!response.data || response.data.length === 0) return null;
        
        const flight = response.data[0]; // Take the most recent one
        
        // Map Aviationstack response to our FlightStatus model
        const mappedFlight: FlightStatus = {
          flightNumber: flight.flight.iata,
          airline: flight.airline.name,
          aircraft: flight.aircraft ? flight.aircraft.registration : 'Unknown Aircraft',
          status: this.mapStatus(flight.flight_status),
          origin: {
            code: flight.departure.iata,
            city: flight.departure.airport,
            name: flight.departure.airport
          },
          destination: {
            code: flight.arrival.iata,
            city: flight.arrival.airport,
            name: flight.arrival.airport
          },
          stops: [], // Free tier doesn't easily provide stopover data

          scheduledDepartureTime: new Date(flight.departure.scheduled),
          actualDepartureTime: flight.departure.actual ? new Date(flight.departure.actual) : null,
          scheduledArrivalTime: new Date(flight.arrival.scheduled),
          estimatedArrivalTime: flight.arrival.estimated ? new Date(flight.arrival.estimated) : null,
          
          // Calculate mock durations since API doesn't provide explicit total distance/duration easily
          totalDurationHours: 5,
          timeTravelledHours: flight.flight_status === 'landed' ? 5 : (flight.flight_status === 'active' ? 2.5 : 0),
          timeRemainingHours: flight.flight_status === 'landed' ? 0 : (flight.flight_status === 'active' ? 2.5 : 5),
          
          totalDistanceKm: 3000,
          distanceTravelledKm: flight.flight_status === 'landed' ? 3000 : (flight.flight_status === 'active' ? 1500 : 0),
          remainingDistanceKm: flight.flight_status === 'landed' ? 0 : (flight.flight_status === 'active' ? 1500 : 3000)
        };

        return mappedFlight;
      }),
      catchError(err => {
        console.error('Error fetching flight', err);
        return of(null);
      })
    );
  }

  getSchedule(airportCode: string, hours: number): Observable<AirportSchedule[]> {
    if (environment.aviationstackApiKey === 'YOUR_AVIATIONSTACK_API_KEY_HERE') {
      console.warn('Aviationstack API key is not configured.');
      return of([]);
    }

    const arrivals$ = this.http.get<any>(`${this.apiUrl}?access_key=${environment.aviationstackApiKey}&arr_iata=${airportCode}&limit=20`);
    const departures$ = this.http.get<any>(`${this.apiUrl}?access_key=${environment.aviationstackApiKey}&dep_iata=${airportCode}&limit=20`);

    return forkJoin([arrivals$, departures$]).pipe(
      map(([arrData, depData]) => {
        const schedules: AirportSchedule[] = [];

        // Process Arrivals
        if (arrData.data) {
          arrData.data.forEach((f: any) => {
            schedules.push({
              airportCode: airportCode.toUpperCase(),
              type: 'Arrival',
              flightNumber: f.flight.iata,
              airline: f.airline.name,
              time: new Date(f.arrival.scheduled),
              status: this.mapStatus(f.flight_status),
              otherAirportCode: f.departure.iata
            });
          });
        }

        // Process Departures
        if (depData.data) {
          depData.data.forEach((f: any) => {
            schedules.push({
              airportCode: airportCode.toUpperCase(),
              type: 'Departure',
              flightNumber: f.flight.iata,
              airline: f.airline.name,
              time: new Date(f.departure.scheduled),
              status: this.mapStatus(f.flight_status),
              otherAirportCode: f.arrival.iata
            });
          });
        }

        // Sort by time
        return schedules.sort((a, b) => a.time.getTime() - b.time.getTime());
      }),
      catchError(err => {
        console.error('Error fetching schedule', err);
        return of([]);
      })
    );
  }

  getSuggestions(query: string): Observable<{type: 'Airport' | 'Flight', label: string, code: string}[]> {
    if (!query) return of([]);
    const q = query.toLowerCase();
    
    // Static local dictionary to prevent burning API limits on every keystroke
    const allItems = [
      { type: 'Airport' as const, label: 'John F. Kennedy International, New York (JFK)', code: 'JFK' },
      { type: 'Airport' as const, label: 'Heathrow Airport, London (LHR)', code: 'LHR' },
      { type: 'Airport' as const, label: 'Los Angeles International, Los Angeles (LAX)', code: 'LAX' },
      { type: 'Airport' as const, label: 'Dubai International, Dubai (DXB)', code: 'DXB' },
      { type: 'Airport' as const, label: 'Frankfurt Airport, Frankfurt (FRA)', code: 'FRA' },
      { type: 'Airport' as const, label: 'Haneda Airport, Tokyo (HND)', code: 'HND' },
      { type: 'Flight' as const, label: 'American Airlines Flight 123 (AA123)', code: 'AA123' },
      { type: 'Flight' as const, label: 'Delta Airlines Flight 456 (DL456)', code: 'DL456' },
      { type: 'Flight' as const, label: 'Emirates Flight 1 (EK1)', code: 'EK1' },
      { type: 'Flight' as const, label: 'British Airways Flight 99 (BA99)', code: 'BA99' }
    ];

    const results = allItems.filter(item => 
      item.label.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    );

    return of(results);
  }

  private mapStatus(apiStatus: string): any {
    switch (apiStatus) {
      case 'active': return 'In Air';
      case 'scheduled': return 'Scheduled';
      case 'landed': return 'Landed';
      case 'cancelled': return 'Cancelled';
      case 'incident': return 'Delayed';
      case 'diverted': return 'Delayed';
      default: return 'Scheduled';
    }
  }
}
