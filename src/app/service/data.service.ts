import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class DataService {
  private url = 'http://localhost:8080' //todo  в отдельный класс appConfig.ts
  constructor(private http: HttpClient) { }

findProducts(sFilter:string, sorting:number)  {
  let params = new HttpParams().append("filter",'%'+sFilter+'%').append("sorting",sorting)
  return this.http.get<string[]>(this.url+'/api/products',{params:params})
}

getProductHint(productId:number)  {
  let params = new HttpParams().append("productId",productId)
  return this.http.get<string>(this.url+'/api/product_hint',{params:params})
}

findNutrients(sFilter:string)  {
  let params = new HttpParams().set("filter",sFilter)
  return this.http.get<string>(this.url+'/api/nutrients')
}
/*
findInfoByProductId(productId:number)  {
  let params = new HttpParams().append("productId",productId)
  return this.http.get<string>(this.url+'/api/info',{params:params})
}
*/
findInfoByProductList(productList:string)  {
  let params = new HttpParams().append("productList",productList)
  return this.http.get<string>(this.url+'/api/info',{params:params})
}

findInfo()  {
  //let params = new HttpParams()
  return this.http.get<string>(this.url+'/api/info_all')//,{params:params})
}

norm2(str: String)  {
  //let params = new HttpParams()
  return this.http.post<string>(this.url+'/api/norm2',str)//,{params:params})
}

//возвращает массив продуктов, в корторых максимальное содержание какого-либо нутриента из sNutrientsNeeded.
//Отбирает по topCount продукта для каждого нутриента
findRecommendedProducts(sNutrientsNeeded:string, excludedProductstList:string, topCountRecommendedProducts:number)  {
  let params = new HttpParams().append("nutrientList",sNutrientsNeeded).append("excludedProductstList",excludedProductstList).append("topCountRecommendedProducts",topCountRecommendedProducts)
  return this.http.get<string>(this.url+'/api/recommended_products',{params:params})
}
}
