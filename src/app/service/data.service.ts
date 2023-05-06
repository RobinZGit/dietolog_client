import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private url = 'http://localhost:8080' //todo  в отдельный класс appConfig.ts
  constructor(private http: HttpClient) { }

findProducts(sFilter:string)  {
  let params = new HttpParams().set("filter",sFilter)
  return this.http.get<string>(this.url+'/api/products')
}

findNutrients(sFilter:string)  {
  let params = new HttpParams().set("filter",sFilter)
  return this.http.get<string>(this.url+'/api/nutrients')
}
}
