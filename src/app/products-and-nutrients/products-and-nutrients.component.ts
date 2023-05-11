import { Component, OnInit} from '@angular/core';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-products-and-nutrients',
  templateUrl: './products-and-nutrients.component.html',
  styleUrls: ['./products-and-nutrients.component.css']
})
export class ProductsAndNutrientsComponent implements OnInit{

products?: any;
nutrients?: any;
currentInfo?: any;

textFilter: string
sorting: number

constructor(private dataService:DataService){
  this.textFilter=''
  this.sorting = -1
}


ngOnInit(): void{
  this.findProducts()
  this.findNutrients()
}

findProducts(){
  //this.dataService.getProductHint(1).subscribe((v:String)=>{alert(v)})
  this.dataService.findProducts(this.textFilter, this.sorting).subscribe((v:string)=>{this.products=v})
  this.recalcNutrients()
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

onSelectSorting(event:any){
  this.sorting = event.target.value
}


//пересчет кодичества нутриентов при зменении кол-ва текущего продукта
recalcNutrients(){
  try{
    //обнуляем все нутриенты
    this.nutrients.map((nutr:any)=>  nutr.val= 0)
    //пересчет
    let sProducts = ','
    this.products.filter((v:any)=>v.val>0).forEach((p:any) => {sProducts+=p._id+','})
    this.dataService.findInfoByProductList(sProducts+',')
        .subscribe((ai:any)=>
            { this.currentInfo = ai
              this.nutrients.map((nutr:any)=>
                                  this.products.forEach((pp:any)=> {
                                                                     ai.filter((i:any)=>i.nutrient==nutr._id)
                                                                       .forEach((i:any)=>{
                                                                                            if((pp._id==i.product)&&(nutr._id==i.nutrient)) nutr.val= Number(nutr.val)+pp.val*Number(i.value)/100
                                                                                          })
                                                                                   }))
                            })
  }catch(e){}
}

getClass(nutrient:any){
  let norm = 999999
  try{
    norm = Number(this.currentInfo.filter((i:any)=>i.nutrient==nutrient._id)[0].perc1on100gr)*Number(this.currentInfo.filter((i:any)=>i.nutrient==nutrient._id)[0].value)/100
  }catch(e){}
  return (nutrient.val>=norm)?'above-norm':'below-norm'
}

/*
TODO -----------------------------------------------
ПРОВЕРИТЬ ЗЕФИР 300 - косяки в подсветке
в фильтр - ПЕРЕЙТИ К ПРОДУКТУ
ФИЛЬТР ПО ПОДСТРОКЕ СБИВАЕТ КОЛ-ВО - УБРАТЬ???
в фильтр - галка Поместить выбранные вверху
ограничение размеров таблиц и стилим
Пайпы в количества нутриентов и продуктов (+авто ввод только чисел)
ЭКСЕЛЬ
рекомендация какой продукт добавить  в контекстном меню нутриента и в экселе (вариант - подсветка продуктов с нулевыми количествами)
...
...
...пересчет по нормам, колонка для собств норм...
*/


}
