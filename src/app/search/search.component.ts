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
  suggestions: {type: 'Airport' | 'Flight', label: string, code: string}[] = [];
  showSuggestions: boolean = false;
  
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  constructor(private router: Router, private flightService: FlightService) {}

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length === 0) {
          return of([]);
        }
        return this.flightService.getSuggestions(query);
      })
    ).subscribe(results => {
      this.suggestions = results;
      this.showSuggestions = results.length > 0;
    });
  }

  onInput() {
    this.searchSubject.next(this.searchQuery);
  }

  hideSuggestions() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200); // small delay to allow click on suggestion
  }

  onFocus() {
    if (this.searchQuery.trim().length > 0) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  selectSuggestion(suggestion: any) {
    this.searchQuery = suggestion.code;
    this.showSuggestions = false;
    this.onSearch();
  }

  onSearch() {
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

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}
