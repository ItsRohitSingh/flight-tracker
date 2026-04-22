import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { FlightService } from '../services/flight.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  
  // Route Search specific state
  searchType: 'track' | 'route' = 'track';
  originQuery: string = '';
  destinationQuery: string = '';
  
  // Suggestion specific state
  activeInput: 'search' | 'origin' | 'destination' = 'search';
  suggestions: {type: 'Airport' | 'Flight', label: string, code: string}[] = [];
  showSuggestions: boolean = false;
  
  private searchSubject = new Subject<{query: string, inputType: 'search' | 'origin' | 'destination'}>();
  private searchSubscription: Subscription | null = null;

  constructor(private router: Router, private flightService: FlightService) {}

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => prev.query === curr.query && prev.inputType === curr.inputType),
      switchMap(data => {
        if (data.query.trim().length === 0) {
          return of([]);
        }
        return this.flightService.getSuggestions(data.query);
      })
    ).subscribe(results => {
      // Filter out 'Flight' suggestions for origin/destination
      if (this.activeInput === 'origin' || this.activeInput === 'destination') {
        this.suggestions = results.filter(s => s.type === 'Airport');
      } else {
        this.suggestions = results;
      }
      this.showSuggestions = this.suggestions.length > 0;
    });
  }

  setSearchType(type: 'track' | 'route') {
    this.searchType = type;
    this.showSuggestions = false;
  }

  onInput(inputType: 'search' | 'origin' | 'destination') {
    this.activeInput = inputType;
    let query = '';
    if (inputType === 'search') query = this.searchQuery;
    else if (inputType === 'origin') query = this.originQuery;
    else if (inputType === 'destination') query = this.destinationQuery;
    
    this.searchSubject.next({query, inputType});
  }

  hideSuggestions() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onFocus(inputType: 'search' | 'origin' | 'destination') {
    this.activeInput = inputType;
    let query = '';
    if (inputType === 'search') query = this.searchQuery;
    else if (inputType === 'origin') query = this.originQuery;
    else if (inputType === 'destination') query = this.destinationQuery;

    if (query.trim().length > 0) {
      this.searchSubject.next({query, inputType});
    }
  }

  selectSuggestion(suggestion: any) {
    if (this.activeInput === 'search') {
      this.searchQuery = suggestion.code;
      this.showSuggestions = false;
      this.onSearchTrack();
    } else if (this.activeInput === 'origin') {
      this.originQuery = suggestion.code;
      this.showSuggestions = false;
    } else if (this.activeInput === 'destination') {
      this.destinationQuery = suggestion.code;
      this.showSuggestions = false;
    }
  }

  onSubmit() {
    if (this.searchType === 'track') {
      this.onSearchTrack();
    } else {
      this.onSearchRoute();
    }
  }

  onSearchTrack() {
    if (!this.searchQuery.trim()) return;
    
    this.showSuggestions = false;
    const query = this.searchQuery.trim().toUpperCase();
    
    // Check if it's a 3-letter airport code
    const isAirport = /^[A-Z]{3}$/.test(query);
    
    if (isAirport) {
      this.router.navigate(['/airport', query]);
    } else {
      this.router.navigate(['/flight', query]);
    }
    
    this.searchQuery = '';
  }

  onSearchRoute() {
    if (!this.originQuery.trim() || !this.destinationQuery.trim()) return;
    
    this.showSuggestions = false;
    const origin = this.originQuery.trim().toUpperCase();
    const dest = this.destinationQuery.trim().toUpperCase();
    
    this.router.navigate(['/route', origin, dest]);
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}
