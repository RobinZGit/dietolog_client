import { Component, OnInit} from '@angular/core';
import { DataService } from '../service/data.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-products-and-nutrients',
  templateUrl: './products-and-nutrients.component.html',
  styleUrls: ['./products-and-nutrients.component.css']
})
export class ProductsAndNutrientsComponent implements OnInit{

products?: any
nutrients?: any
currentInfo?: any
recommendedProducts?: any
notRecommendedProducts?: any
pcopy: any[] = [] //вспомогательный
topCountRecommendedProducts: number //для подсветки рекомендованных (и не) продуктов. отбирать столько рекомендованных (и не) продуктов на каждый нутриент
keyForLocalStorageProducts: string = 'rz_dietolog_configuration_products'
keyForLocalStorageNutrients: string = 'rz_dietolog_configuration_nutrients'

//textFilter: string  //!не использовать! фильтрация ломает пересчет. убрал с формы
textSort: string
sortByNutrient: number  //сортировка по нутриенту
valued_ontop: boolean //поместить выбранные количества сверху(в остальном сохранить сортировку по нутриенту)
sortBySubstr: boolean //поместить сверху содержащие  textSort


constructor(private dataService:DataService){
  //this.textFilter=''
  this.textSort=''
  this.sortByNutrient = -1
  this.valued_ontop = false
  this.sortBySubstr = false
  this.topCountRecommendedProducts = 5 // #######   //для подсветки рекомендованных (и не) продуктов. отбирать столько рекомендованных (и не) продуктов на каждый нутриент
}


ngOnInit(): void{
    this.findProducts()
    this.findNutrients()
    try{//загружаем сохраненную в браузере конфигурацию
      if((localStorage.getItem(this.keyForLocalStorageProducts)!==null)&&(localStorage.getItem(this.keyForLocalStorageNutrients)!==null)){
        this.products = JSON.parse(String(localStorage.getItem(this.keyForLocalStorageProducts)))
        this.nutrients = JSON.parse(String(localStorage.getItem(this.keyForLocalStorageNutrients)))
        this.recalcNutrients()
      }
    }catch(e){}
}

findProducts(){
  this.dataService.findProducts('', this.sortByNutrient).subscribe((v:string[])=>{
                                                                                        if (this.products!=undefined) this.pcopy = this.products.slice()//для сохранения введенных количеств
                                                                                        this.products=v
                                                                                        if(this.pcopy.length>0) this.products.map((p:any)=>{p.val = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].val})
                                                                                        if(this.pcopy.length>0) this.products.map((p:any)=>{p.excluded = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].excluded})
                                                                                        this.finalSorting()
                                                                                        this.lightRecommendedProducts()
                                                                                        })
}

//вспомогат для сортировки. сравнивает массивы как числа, эл-ты массива как разряды. return 1/-1/0 - a1><=a2
a1MoreA2(a1:number[],a2:number[]){
  for(let i=0;i<a1.length;i++){
    if(a1[i]>a2[i]) return 1
    if(a1[i]<a2[i]) return -1
  }
  return 0
}

finalSorting(){
  this.products.sort((u:any,v:any)=>{ let a1 = [v.val*(this.valued_ontop?1:0),v.name.toUpperCase().indexOf(this.textSort.toUpperCase())*(this.sortBySubstr?1:0),-v.rownumber]
                                      let a2 = [u.val*(this.valued_ontop?1:0),u.name.toUpperCase().indexOf(this.textSort.toUpperCase())*(this.sortBySubstr?1:0),-u.rownumber]
                                      return this.a1MoreA2(a1,a2)
                                     })
}

onSelectSorting(event:any){
  this.sortByNutrient = event.target.value
  this.findProducts()
}

findNutrients(){
  /*
  this.nutrients=JSON.parse(`{v:[{norm:70,   name:"nnnutt1",  id:1},
                                 {norm:150,  name:"nnnut2",   id:2},
                                ]
                              }`)
                              */
  this.dataService.findNutrients('').subscribe((v:string)=>{this.nutrients=v})
}

//пересчет количества нутриентов при зменении кол-ва текущего продукта
recalcNutrients(){
  try{
    //обнуляем все нутриенты
    this.nutrients.map((nutr:any)=>  nutr.val= 0)
    //пересчет
    let sProducts = ','
    this.products.filter((v:any)=>v.val>0).forEach((p:any) => {sProducts+=p._id+','})
    this.dataService.findInfoByProductList(sProducts+',')
        .subscribe((ai:any)=>
            { //пересчет количеств нутриентов в выбранных продуктах
              this.currentInfo = ai
              this.nutrients.map((nutr:any)=>
                                  this.products.forEach((pp:any)=> {
                                                                     ai.filter((i:any)=>i.nutrient==nutr._id)
                                                                       .forEach((i:any)=>{
                                                                                            if((pp._id==i.product)&&(nutr._id==i.nutrient))
                                                                                              try{nutr.val= Number(nutr.val)+pp.val*Number(i.value)/100
                                                                                                 }catch(e){}
                                                                                          })
                                                                                   }))
              this.finalSorting()
              this.lightRecommendedProducts()
              localStorage.setItem(this.keyForLocalStorageProducts,JSON.stringify(this.products))
              localStorage.setItem(this.keyForLocalStorageNutrients,JSON.stringify(this.nutrients))
            })
  }catch(e){}
}

lightRecommendedProducts(){
  //подсветка рекомендованных продуктов (исходя из недостаточного кол-ва нек-х нутриентов)
  let sNutrientsNeeded = ','
  this.currentInfo.filter((v:any)=>this.nutrientIsNeeded(this.nutrients.filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsNeeded+=i.nutrient+','})
  let excludedProductstList =','
  this.products.filter((p:any)=>p.excluded>0).forEach((p:any) => {excludedProductstList+=p._id+','})
  this.dataService.findRecommendedProducts(sNutrientsNeeded,excludedProductstList, this.topCountRecommendedProducts)
                    .subscribe((np:any)=>
                      { this.recommendedProducts = np
                        this.products.map((p:any)=>{p.isrecommended = (np.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
                      }
                    )

  //подсветка НЕ рекомендованных продуктов (исходя из недостаточного кол-ва нек-х нутриентов)
  let sNutrientsExceeded = ','
  this.currentInfo.filter((v:any)=>this.nutrientIsExceeded(this.nutrients.filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsExceeded+=i.nutrient+','})
  this.dataService.findRecommendedProducts(sNutrientsExceeded,excludedProductstList, this.topCountRecommendedProducts) //sic! findRecommendedProducts
                    .subscribe((np:any)=>
                      { this.notRecommendedProducts = np
                        this.products.map((p:any)=>{p.isnotrecommended = (np.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
                      }
                    )

}

setZeroAndRecalcNutrients(product:any){
   product.val = 0
   this.recalcNutrients()
}

//больше или меньше (true) содержание nutrient в текущей раскладке
nutrientIsNeeded(nutrient:any){
  return (nutrient.val<nutrient.min_dailyrate)
}

nutrientIsExceeded(nutrient:any){
  return (nutrient.val>nutrient.max_dailyrate)
}

getClassNutrient(nutrient:any){
  let sRet = this.nutrientIsNeeded(nutrient)?'below-norm':'within-norm'
  sRet = this.nutrientIsExceeded(nutrient)?"above-norm":sRet
  return sRet
}

getClassProduct(product: any){
  let sRet = ''
  if ((product.isrecommended==1)&&(product.isnotrecommended==0)) sRet ="recommended-product"
  if ((product.isrecommended==0)&&(product.isnotrecommended==1)) sRet ="notrecommended-product"
  if ((product.isrecommended==1)&&(product.isnotrecommended==1)) sRet ="recommended-and-not-product"
  return sRet
}

improveProductValues(plusVal:number){
  try{
    let newProduct = this.products.filter((p:any)=> p._id == this.recommendedProducts.sort((u:any,v:any)=> v.value-u.value)[0].product)[0]
    this.products.map((p:any)=> {if(p._id==newProduct._id) p.val+=plusVal})
    this.findProducts()
    alert('Добавлено ' + plusVal +' гр. "'+newProduct.name+'"')
  }catch(e){ alert('Не удалось подобрать продукт')}
}

excludeAll(checked:boolean){
  this.products.map((p:any)=>{if(p.val==0) p.excluded=checked})
}

toExcel(){
  if (this.products.filter((p:any)=>p.val>0).length==0) {
    alert('Не выбрано ни одного продукта. Генерация отчета остановлена.')
    return
  }
  //
  const wsProducts: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.products.filter((p:any)=>p.val>0));
  const wsNutrients: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.nutrients);
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  //
  XLSX.utils.book_append_sheet(workbook, wsProducts, 'Продукты');
  XLSX.utils.book_append_sheet(workbook, wsNutrients, 'Нутриенты в данной раскладке');
  XLSX.writeFile(workbook,'dietolog.xlsx');
}

/*
TODO -----------------------------------------------
ПРОВЕРИТЬ ЗЕФИР 300    Вино полудесертное 66 - косяки в подсветке - ГЛОБАЛЬНО ПОТЕСТИТь ПОПРАВИТЬ БД И ЗАПИХАТЬ ЕЕ В СЕРВИС
фильтры и сортировки загнать в один объект и сохранять\подгружать в onInit
ЭКСЕЛЬ - единицы измерения, нормальные имена колонок, колонка избыток-недостаток ыв нутриенты и сортировка по ней

...
...
...пересчет по нормам - сервис оптимизации (перебор 0 - 2000гр крупным шагом 10-50 гр),

мб добавить сgисок симптомов избытка и недостатка - и в таблицу ниже. по выбору симптома подсветка нутриентов и продуктов
*/


}
