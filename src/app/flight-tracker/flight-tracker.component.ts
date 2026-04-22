import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FlightService } from '../services/flight.service';
import { FlightStatus } from '../models';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';

@Component({
  selector: 'app-flight-tracker',
  standalone: true,
  imports: [CommonModule, WeatherWidgetComponent],
  templateUrl: './flight-tracker.component.html',
  styleUrl: './flight-tracker.component.css'
})
export class FlightTrackerComponent implements OnInit, OnDestroy {
  flightNumber: string = '';
  flightDataList: FlightStatus[] = [];
  loading: boolean = true;
  expandedIndex: number = 0; // First flight expanded by default

  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private flightService: FlightService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.flightNumber = id;
        this.loadFlightData();
      }
    });
  }

  loadFlightData() {
    this.loading = true;
    this.flightService.trackFlight(this.flightNumber).subscribe(data => {
      this.flightDataList = data || [];
      this.expandedIndex = 0; // reset
      this.loading = false;
    });
  }

  toggleExpand(index: number) {
    if (this.expandedIndex === index) {
      this.expandedIndex = -1; // collapse
    } else {
      this.expandedIndex = index;
    }
  }

  getProgressPercentage(flight: FlightStatus): number {
    if (!flight) return 0;
    if (flight.status === 'Landed') return 100;
    if (flight.status === 'Scheduled' || flight.status === 'Cancelled') return 0;
    
    return (flight.distanceTravelledKm / flight.totalDistanceKm) * 100;
  }

  getStatusBadgeClass(flight: FlightStatus): string {
    if (!flight) return 'badge';
    switch (flight.status) {
      case 'In Air': return 'badge badge-success';
      case 'Scheduled': return 'badge badge-secondary';
      case 'Landed': return 'badge badge-secondary';
      case 'Delayed': return 'badge badge-warning';
      case 'Cancelled': return 'badge badge-danger';
      default: return 'badge';
    }
  }

  formatLocalTime(date: Date | null, timeZoneLabel: string): string {
    if (!date) return '';
    // Aviationstack returns local times tagged with UTC offset (e.g. +00:00).
    // This means the Date object's UTC time IS the local time.
    // By formatting with timeZone: 'UTC', we get the accurate local time regardless of user's timezone.
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      console.warn('Error formatting time:', e);
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    }
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
