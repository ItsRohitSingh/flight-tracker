import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError, shareReplay } from 'rxjs';
import { WeatherInfo } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private cache = new Map<string, Observable<WeatherInfo>>();

  constructor(private http: HttpClient) { }

  getWeatherForLocation(locationCode: string, providedCityName?: string): Observable<WeatherInfo> {
    const city = providedCityName || this.getCityName(locationCode);
    
    // If no API key is provided, return empty or fallback
    if (environment.openWeatherMapApiKey === 'YOUR_OPENWEATHERMAP_API_KEY_HERE') {
      console.warn('OpenWeatherMap API key is not configured. Falling back to empty weather data.');
      return of(this.getFallbackWeather(locationCode, city));
    }

    const cacheKey = city.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const obs = this.http.get<any>(`${this.apiUrl}?q=${city}&appid=${environment.openWeatherMapApiKey}&units=metric`).pipe(
      map(data => ({
        locationCode: locationCode.toUpperCase(),
        city: data.name,
        temperatureC: Math.round(data.main.temp),
        condition: data.weather[0].main,
        icon: this.mapWeatherIcon(data.weather[0].icon),
        humidity: data.main.humidity,
        windSpeedKmh: Math.round(data.wind.speed * 3.6) // m/s to km/h
      })),
      catchError(err => {
        console.error('Error fetching weather', err);
        this.cache.delete(cacheKey); // clear cache on error so it can be retried
        return of(this.getFallbackWeather(locationCode, city));
      }),
      shareReplay(1)
    );

    this.cache.set(cacheKey, obs);
    return obs;
  }

  private mapWeatherIcon(iconCode: string): string {
    // OpenWeatherMap icon codes mapping to FontAwesome
    const iconMap: {[key: string]: string} = {
      '01d': 'fa-sun',
      '01n': 'fa-moon',
      '02d': 'fa-cloud-sun',
      '02n': 'fa-cloud-moon',
      '03d': 'fa-cloud',
      '03n': 'fa-cloud',
      '04d': 'fa-cloud',
      '04n': 'fa-cloud',
      '09d': 'fa-cloud-showers-heavy',
      '09n': 'fa-cloud-showers-heavy',
      '10d': 'fa-cloud-sun-rain',
      '10n': 'fa-cloud-moon-rain',
      '11d': 'fa-bolt',
      '11n': 'fa-bolt',
      '13d': 'fa-snowflake',
      '13n': 'fa-snowflake',
      '50d': 'fa-smog',
      '50n': 'fa-smog',
    };
    return iconMap[iconCode] || 'fa-cloud';
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
    return codes[code.toUpperCase()] || 'London'; // Default fallback
  }

  private getFallbackWeather(code: string, city: string): WeatherInfo {
    return {
      locationCode: code.toUpperCase(),
      city: city,
      temperatureC: 0,
      condition: 'Unknown',
      icon: 'fa-cloud',
      humidity: 0,
      windSpeedKmh: 0
    };
  }
}
