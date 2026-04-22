import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FlightService } from '../services/flight.service';
import { FlightStatus } from '../models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-route-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-search.component.html',
  styleUrl: './route-search.component.css'
})
export class RouteSearchComponent implements OnInit, OnDestroy {
  origin: string = '';
  destination: string = '';
  
  flights: FlightStatus[] = [];
  loading: boolean = true;
  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private flightService: FlightService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.origin = params.get('origin') || '';
      this.destination = params.get('destination') || '';
      
      this.loadFlights();
    });
  }

  loadFlights() {
    this.loading = true;
    this.flightService.searchRoute(this.origin, this.destination).subscribe({
      next: (results) => {
        this.flights = results;
        this.loading = false;
      },
      error: () => {
        this.flights = [];
        this.loading = false;
      }
    });
  }

  goToFlight(flightNumber: string) {
    this.router.navigate(['/flight', flightNumber]);
  }

  getStatusBadgeClass(flight: FlightStatus): string {
    const status = flight.status;
    if (status === 'In Air') return 'badge badge-success';
    if (status === 'Scheduled') return 'badge badge-primary';
    if (status === 'Landed') return 'badge badge-secondary';
    if (status === 'Delayed' || status === 'Cancelled') return 'badge badge-danger';
    return 'badge badge-secondary';
  }

  formatLocalTime(date: Date | null, timeZone: string): string {
    if (!date) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC', // the date objects are "fake UTC" 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return 'Invalid Time';
    }
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
