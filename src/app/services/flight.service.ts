import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, forkJoin } from 'rxjs';
import { FlightStatus, AirportSchedule } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  // private apiUrl = '';
  private apiUrl = 'https://api.aviationstack.com/v1/flights';

  constructor(private http: HttpClient) { }

  trackFlight(flightNumber: string): Observable<FlightStatus[]> {
    if (environment.aviationstackApiKey === 'YOUR_AVIATIONSTACK_API_KEY_HERE') {
      console.warn('Aviationstack API key is not configured.');
      return of([]);
    }

    return this.http.get<any>(`${this.apiUrl}?access_key=${environment.aviationstackApiKey}&flight_iata=${flightNumber}`).pipe(
      map(response => {
        if (!response.data || response.data.length === 0) return [];

        const iataToCity: Record<string, string> = {
          'DEL': 'New Delhi',
          'BOM': 'Mumbai',
          'BLR': 'Bengaluru',
          'HYD': 'Hyderabad',
          'MAA': 'Chennai',
          'CCU': 'Kolkata',
          'AMD': 'Ahmedabad',
          'PNQ': 'Pune',
          'GOI': 'Goa',
          'COK': 'Kochi',
          'LKO': 'Lucknow',
          'PAT': 'Patna',
          'JAI': 'Jaipur',
          'TRV': 'Thiruvananthapuram',
          'BBI': 'Bhubaneswar',
          'SXR': 'Srinagar',
          'IXC': 'Chandigarh',
          'ATQ': 'Amritsar',
          'JFK': 'New York',
          'LHR': 'London',
          'LAX': 'Los Angeles',
          'DXB': 'Dubai',
          'FRA': 'Frankfurt',
          'HND': 'Tokyo',
          'SIN': 'Singapore',
          'CDG': 'Paris',
          'AMS': 'Amsterdam',
          'SYD': 'Sydney',
          'YYZ': 'Toronto'
        };

        // Map Aviationstack response to our FlightStatus model array
        const mappedFlights: FlightStatus[] = response.data.map((flight: any) => {
          const originTz = flight.departure.timezone || 'UTC';
          const destTz = flight.arrival.timezone || 'UTC';

          let destCity = iataToCity[flight.arrival.iata];
          if (!destCity) {
            // Fallback: clean up airport name to improve weather lookup chances
            destCity = flight.arrival.airport
              .replace(/ International.*$/i, '')
              .replace(/ Airport.*$/i, '')
              .replace(/\(.*?\)/g, '')
              .trim();
          }

          const scheduledDep = new Date(flight.departure.scheduled);
          const scheduledArr = new Date(flight.arrival.scheduled);

          // Helper to get offset at a specific date
          const getTzOffsetMs = (timeZone: string, date: Date) => {
            try {
              const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
              const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
              return tzDate.getTime() - utcDate.getTime();
            } catch (e) {
              return 0;
            }
          };

          // Calculate absolute UTC times
          const absDep = new Date(scheduledDep.getTime() - getTzOffsetMs(originTz, scheduledDep));
          const absArr = new Date(scheduledArr.getTime() - getTzOffsetMs(destTz, scheduledArr));

          // Duration in hours
          let totalDurationHours = (absArr.getTime() - absDep.getTime()) / 3600000;
          if (totalDurationHours <= 0) totalDurationHours = 5; // fallback

          const totalDistanceKm = Math.round(totalDurationHours * 850); // rough estimate 850 km/h

          let timeTravelledHours = 0;
          let timeRemainingHours = totalDurationHours;
          let distanceTravelledKm = 0;
          let remainingDistanceKm = totalDistanceKm;

          if (flight.flight_status === 'landed') {
            timeTravelledHours = totalDurationHours;
            timeRemainingHours = 0;
            distanceTravelledKm = totalDistanceKm;
            remainingDistanceKm = 0;
          } else if (flight.flight_status === 'active') {
             const now = new Date();
             const travelledMs = now.getTime() - absDep.getTime();
             timeTravelledHours = Math.max(0, travelledMs / 3600000);
             if (timeTravelledHours > totalDurationHours) timeTravelledHours = totalDurationHours;
             timeRemainingHours = totalDurationHours - timeTravelledHours;
             distanceTravelledKm = Math.round((timeTravelledHours / totalDurationHours) * totalDistanceKm);
             remainingDistanceKm = totalDistanceKm - distanceTravelledKm;
          }

          return {
            flightNumber: flight.flight.iata,
            airline: flight.airline.name,
            aircraft: flight.aircraft ? flight.aircraft.registration : 'Unknown Aircraft',
            status: this.mapStatus(flight.flight_status),
            flightDate: flight.flight_date,
            origin: {
              code: flight.departure.iata,
              city: flight.departure.airport,
              name: flight.departure.airport
            },
            destination: {
              code: flight.arrival.iata,
              city: destCity,
              name: flight.arrival.airport
            },
            stops: [], // Free tier doesn't easily provide stopover data

            originTimezone: originTz,
            destinationTimezone: destTz,
            scheduledDepartureTime: scheduledDep,
            actualDepartureTime: flight.departure.actual ? new Date(flight.departure.actual) : null,
            scheduledArrivalTime: scheduledArr,
            estimatedArrivalTime: flight.arrival.estimated ? new Date(flight.arrival.estimated) : null,

            totalDurationHours,
            timeTravelledHours,
            timeRemainingHours,
            totalDistanceKm,
            distanceTravelledKm,
            remainingDistanceKm
          };
        });

        // Group by flightDate or just return sorted by date (newest first). They usually come sorted.
        return mappedFlights.sort((a, b) => new Date(b.flightDate).getTime() - new Date(a.flightDate).getTime());
      }),
      catchError(err => {
        console.error('Error fetching flight', err);
        return of([]);
      })
    );
  }

  getSchedule(airportCode: string, hours: number): Observable<AirportSchedule[]> {
    if (environment.aviationstackApiKey === 'YOUR_AVIATIONSTACK_API_KEY_HERE') {
      console.warn('Aviationstack API key is not configured.');
      return of([]);
    }

    const arrivals$ = this.http.get<any>(`${this.apiUrl}?access_key=${environment.aviationstackApiKey}&arr_iata=${airportCode}&limit=100`);
    const departures$ = this.http.get<any>(`${this.apiUrl}?access_key=${environment.aviationstackApiKey}&dep_iata=${airportCode}&limit=100`);

    return forkJoin([arrivals$, departures$]).pipe(
      map(([arrData, depData]) => {
        const schedules: AirportSchedule[] = [];

        const getTzOffsetMs = (timeZone: string, date: Date) => {
          try {
            const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
            return tzDate.getTime() - utcDate.getTime();
          } catch (e) {
            return 0;
          }
        };

        const processFlight = (f: any, type: 'Arrival' | 'Departure') => {
          const airportTz = type === 'Arrival' ? (f.arrival.timezone || 'UTC') : (f.departure.timezone || 'UTC');
          const localScheduledStr = type === 'Arrival' ? f.arrival.scheduled : f.departure.scheduled;
          const fakeUtcDate = new Date(localScheduledStr);
          const absoluteUtcDate = new Date(fakeUtcDate.getTime() - getTzOffsetMs(airportTz, fakeUtcDate));

          schedules.push({
            airportCode: airportCode.toUpperCase(),
            type,
            flightNumber: f.flight.iata,
            airline: f.airline.name,
            time: fakeUtcDate,
            absoluteUtcTime: absoluteUtcDate,
            status: this.mapStatus(f.flight_status),
            otherAirportCode: type === 'Arrival' ? f.departure.iata : f.arrival.iata
          });
        };

        // Process Arrivals
        if (arrData.data) {
          arrData.data.forEach((f: any) => processFlight(f, 'Arrival'));
        }

        // Process Departures
        if (depData.data) {
          depData.data.forEach((f: any) => processFlight(f, 'Departure'));
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

  getSuggestions(query: string): Observable<{ type: 'Airport' | 'Flight', label: string, code: string }[]> {
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
