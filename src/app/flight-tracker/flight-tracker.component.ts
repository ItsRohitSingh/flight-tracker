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
  flightData: FlightStatus | null = null;
  loading: boolean = true;
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
      this.flightData = data;
      this.loading = false;
    });
  }

  getProgressPercentage(): number {
    if (!this.flightData) return 0;
    if (this.flightData.status === 'Landed') return 100;
    if (this.flightData.status === 'Scheduled' || this.flightData.status === 'Cancelled') return 0;
    
    return (this.flightData.distanceTravelledKm / this.flightData.totalDistanceKm) * 100;
  }

  getStatusBadgeClass(): string {
    if (!this.flightData) return 'badge';
    switch (this.flightData.status) {
      case 'In Air': return 'badge badge-success';
      case 'Scheduled': return 'badge badge-secondary';
      case 'Landed': return 'badge badge-secondary';
      case 'Delayed': return 'badge badge-warning';
      case 'Cancelled': return 'badge badge-danger';
      default: return 'badge';
    }
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
