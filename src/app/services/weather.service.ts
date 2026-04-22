import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { Observable } from 'rxjs';
import { WeatherInfo } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  constructor(private mockDataService: MockDataService) { }

  getWeatherForLocation(locationCode: string): Observable<WeatherInfo> {
    return this.mockDataService.getWeather(locationCode);
  }
}
