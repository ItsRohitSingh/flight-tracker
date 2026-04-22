import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FlightService } from '../services/flight.service';
import { AirportSchedule } from '../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-airport-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './airport-schedule.component.html',
  styleUrl: './airport-schedule.component.css'
})
export class AirportScheduleComponent implements OnInit, OnDestroy {
  airportCode: string = '';
  schedules: AirportSchedule[] = [];
  loading: boolean = true;
  
  activeTab: 'Arrival' | 'Departure' = 'Arrival';
  timeFilter: number = 4; // 4, 6, 8 hours
  
  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private flightService: FlightService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const code = params.get('code');
      if (code) {
        this.airportCode = code.toUpperCase();
        this.loadSchedule();
      }
    });
  }

  loadSchedule() {
    this.loading = true;
    this.flightService.getSchedule(this.airportCode, this.timeFilter).subscribe(data => {
      this.schedules = data;
      this.loading = false;
    });
  }

  get filteredSchedules() {
    const now = new Date();
    // Use absolute UTC times to accurately filter flights
    const maxTime = new Date(now.getTime() + this.timeFilter * 3600000);
    
    return this.schedules.filter(s => 
      s.type === this.activeTab && 
      s.absoluteUtcTime >= now && 
      s.absoluteUtcTime <= maxTime
    );
  }

  setTab(tab: 'Arrival' | 'Departure') {
    this.activeTab = tab;
  }

  onFilterChange() {
    this.loadSchedule();
  }

  getStatusClass(status: string): string {
    if (status === 'On Time') return 'badge badge-success';
    if (status === 'Delayed') return 'badge badge-warning';
    if (status === 'Cancelled') return 'badge badge-danger';
    return 'badge badge-secondary';
  }

  formatLocalTime(date: Date): string {
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return '';
    }
  }

  formatLocalDate(date: Date): string {
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return '';
    }
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
