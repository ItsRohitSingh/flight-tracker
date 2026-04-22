import { Injectable } from '@angular/core';
import { FlightStatus, AirportSchedule, WeatherInfo } from '../models';
import { Observable, of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  constructor() { }

  getFlightStatus(flightNumber: string): Observable<FlightStatus | null> {
    const fn = flightNumber.toUpperCase();
    
    // Default mock data
    const mockFlight: FlightStatus = {
      flightNumber: fn,
      airline: 'AeroTrack Airways',
      aircraft: 'Boeing 787-9 Dreamliner',
      status: 'In Air',
      origin: { code: 'JFK', city: 'New York', name: 'John F. Kennedy International' },
      destination: { code: 'LHR', city: 'London', name: 'Heathrow Airport' },
      stops: [],
      
      scheduledDepartureTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      actualDepartureTime: new Date(Date.now() - 2.8 * 60 * 60 * 1000),
      scheduledArrivalTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      estimatedArrivalTime: new Date(Date.now() + 3.8 * 60 * 60 * 1000),
      
      totalDurationHours: 7,
      timeTravelledHours: 3.2,
      timeRemainingHours: 3.8,
      
      totalDistanceKm: 5540,
      distanceTravelledKm: 2500,
      remainingDistanceKm: 3040
    };

    // Make variations based on search input just for demo purposes
    if (fn.includes('1')) {
       mockFlight.status = 'Scheduled';
       mockFlight.timeTravelledHours = 0;
       mockFlight.distanceTravelledKm = 0;
       mockFlight.timeRemainingHours = mockFlight.totalDurationHours;
       mockFlight.remainingDistanceKm = mockFlight.totalDistanceKm;
       mockFlight.actualDepartureTime = null;
    } else if (fn.includes('9')) {
       mockFlight.status = 'Landed';
       mockFlight.timeTravelledHours = mockFlight.totalDurationHours;
       mockFlight.distanceTravelledKm = mockFlight.totalDistanceKm;
       mockFlight.timeRemainingHours = 0;
       mockFlight.remainingDistanceKm = 0;
       mockFlight.stops = [{ code: 'KEF', city: 'Reykjavik' }];
    }

    // Return observable with 800ms delay to simulate network
    return of(mockFlight).pipe(delay(800));
  }

  getAirportSchedule(airportCode: string, hours: number): Observable<AirportSchedule[]> {
    const baseTime = Date.now();
    const schedules: AirportSchedule[] = [];
    const types: ('Arrival' | 'Departure')[] = ['Arrival', 'Departure'];
    const airlines = ['Delta', 'American', 'United', 'Emirates', 'British Airways', 'Lufthansa'];
    
    // Generate 15 random schedules within the requested timeframe
    for (let i = 0; i < 15; i++) {
      const isArrival = Math.random() > 0.5;
      const type = isArrival ? 'Arrival' : 'Departure';
      const timeOffset = Math.random() * hours * 60 * 60 * 1000;
      
      schedules.push({
        airportCode: airportCode.toUpperCase(),
        type,
        flightNumber: `${airlines[Math.floor(Math.random() * airlines.length)].substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        time: new Date(baseTime + timeOffset),
        status: Math.random() > 0.8 ? 'Delayed' : 'On Time',
        otherAirportCode: ['LAX', 'DXB', 'FRA', 'CDG', 'HND', 'SYD'][Math.floor(Math.random() * 6)]
      });
    }
    
    // Sort chronologically
    schedules.sort((a, b) => a.time.getTime() - b.time.getTime());

    return of(schedules).pipe(delay(600));
  }

  getSuggestions(query: string): Observable<{type: 'Airport' | 'Flight', label: string, code: string}[]> {
    if (!query) return of([]);
    const q = query.toLowerCase();
    
    // Mock suggestions list
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

    return of(results).pipe(delay(200));
  }

  getWeather(locationCode: string): Observable<WeatherInfo> {
    const conditions = [
      { condition: 'Sunny', icon: 'fa-sun', tempOffset: 5 },
      { condition: 'Cloudy', icon: 'fa-cloud', tempOffset: 0 },
      { condition: 'Partly Cloudy', icon: 'fa-cloud-sun', tempOffset: 2 },
      { condition: 'Rain', icon: 'fa-cloud-rain', tempOffset: -5 },
      { condition: 'Thunderstorm', icon: 'fa-bolt', tempOffset: -8 }
    ];

    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const baseTemp = 20; // 20C base
    
    return of({
      locationCode: locationCode.toUpperCase(),
      city: this.getCityName(locationCode),
      temperatureC: baseTemp + randomCondition.tempOffset + Math.floor(Math.random() * 10 - 5),
      condition: randomCondition.condition,
      icon: randomCondition.icon,
      humidity: Math.floor(Math.random() * 60) + 30,
      windSpeedKmh: Math.floor(Math.random() * 40) + 5
    }).pipe(delay(400));
  }

  private getCityName(code: string): string {
    const codes: {[key: string]: string} = {
      'JFK': 'New York',
      'LHR': 'London',
      'LAX': 'Los Angeles',
      'DXB': 'Dubai',
      'FRA': 'Frankfurt',
      'HND': 'Tokyo'
    };
    return codes[code.toUpperCase()] || 'Unknown City';
  }
}
