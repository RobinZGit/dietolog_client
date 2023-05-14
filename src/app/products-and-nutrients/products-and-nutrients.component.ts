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
pcopy: any[] = [] //вспомогательный
topCountRecommendedProducts: number //для подсветки рекомендованных продуктов. отбирать столько рекомендованных продуктов на каждый нутриент

textFilter: string  //!не использовать! фильтрация ломает пересчет. убрал с формы
textSort: string
sortByNutrient: number  //сортировка по нутриенту
valued_ontop: boolean //поместить выбранные количества сверху(в остальном сохранить сортировку по нутриенту)
sortBySubstr: boolean //поместить сверху содержащие  textSort


constructor(private dataService:DataService){
  this.textFilter=''
  this.textSort=''
  this.sortByNutrient = -1
  this.valued_ontop = false
  this.sortBySubstr = false
  this.topCountRecommendedProducts = 5 // #######   //для подсветки рекомендованных продуктов. отбирать столько рекомендованных продуктов на каждый нутриент
}


ngOnInit(): void{
  this.findProducts()
  this.findNutrients()
}

findProducts(){
  this.dataService.findProducts(this.textFilter, this.sortByNutrient).subscribe((v:string[])=>{
                                                                                        if (this.products!=undefined) this.pcopy = this.products.slice()//для сохранения введенных количеств
                                                                                        this.products=v
                                                                                        if(this.pcopy.length>0) this.products.map((p:any)=>{p.val = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].val})
                                                                                        this.finalSorting()
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
                                                                                            if((pp._id==i.product)&&(nutr._id==i.nutrient)) nutr.val= Number(nutr.val)+pp.val*Number(i.value)/100
                                                                                          })
                                                                                   }))
              //подсветка рекомендованных продуктов (исходя из недостаточного кол-ва нек-х нутриентов)
              let sNutrientsNeeded = ','
              this.currentInfo.filter((v:any)=>this.nutrientIsNeeded(v.nutrient)).forEach((i:any) => {sNutrientsNeeded+=i.nutrient+','})
              this.dataService.findRecommendedProducts(sNutrientsNeeded, this.topCountRecommendedProducts)
                  .subscribe((np:any)=>
                    {
                      this.products.map((p:any)=>{p.isrecommended = (np.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
                    }
                  )

            })
  }catch(e){}
}

//больше или меньше (true) содержание nutrient в текущей раскладке
nutrientIsNeeded(nutrient:any){
  let norm = 999999
  try{
    norm = Number(this.currentInfo.filter((i:any)=>i.nutrient==nutrient._id)[0].perc1on100gr)*Number(this.currentInfo.filter((i:any)=>i.nutrient==nutrient._id)[0].value)/100
  }catch(e){}
  return !(nutrient.val>=norm)
}

getClassNutrient(nutrient:any){
  return !this.nutrientIsNeeded(nutrient)?'above-norm':'below-norm'
}

getClassProduct(product: any){
  return (product.isrecommended==0)?"":"recommended-product"
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
ограничение размеров таблиц и стилим
ЭКСЕЛЬ - единицы мизмерения, нормальные имена колонок, колонка избыток-недостаток ыв нутриенты и сортировка по ней

...
...
...пересчет по нормам,
колонка для собств норм - добавить perc1on100gr в ngModel, и переориентировать пересчет на него
колонка "исключить продукт"- по выбору зачеркнутый шрифт, обнуление и запрет редактировать количество, пересчет. в пересчет и пр добавить неиспользование исключенных - передавать в сервисы как отд. строку список ид исключенных
лэйбл - Степень отклонения раскладки от нормы
кнопка "Улучшить раскладку (1 шаг)" - выбирает один из рекомендованных продуктов и добавляет его чтобы его нутриент вышел в норму. Идея в том чтобы кликать и смотреть постепенно, мб выбрасывая продукты

мб добавить свисок симптомов избытка и недостатка - и в таблицу ниже. по выбору симптома подсветка нутриентов и продуктов
*/


}
