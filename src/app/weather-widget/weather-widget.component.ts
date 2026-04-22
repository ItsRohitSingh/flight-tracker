import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../services/weather.service';
import { WeatherInfo } from '../models';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-widget.component.html',
  styleUrl: './weather-widget.component.css'
})
export class WeatherWidgetComponent implements OnInit, OnChanges {
  @Input() locationCode!: string;
  @Input() title: string = 'Destination Weather';
  
  weatherInfo: WeatherInfo | null = null;
  loading: boolean = true;

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.loadWeather();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['locationCode'] && !changes['locationCode'].isFirstChange()) {
      this.loadWeather();
    }
  }

  private loadWeather() {
    if (!this.locationCode) return;
    
    this.loading = true;
    this.weatherService.getWeatherForLocation(this.locationCode).subscribe(data => {
      this.weatherInfo = data;
      this.loading = false;
    });
  }
}
