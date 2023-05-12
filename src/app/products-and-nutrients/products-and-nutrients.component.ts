import { Component, OnInit} from '@angular/core';
import { DataService } from '../service/data.service';

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

finalSorting(){
  this.products.sort((u:any,v:any)=>{return ((u.rownumber>=v.rownumber)?1:-1)}) //"обнуление" сортировки!
  this.products.sort((u:any,v:any)=>{return (((u.val<=v.val)?100:-100)*(this.valued_ontop?1:0)
                                             +((u.name.toUpperCase().indexOf(this.textSort.toUpperCase())<=v.name.toUpperCase().indexOf(this.textSort.toUpperCase()))?10:-10)*(this.sortBySubstr?1:0)
                                             +((u.rownumber>=v.rownumber)?1:-1)
                                             )
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
НЕ РАБОТАЕТ СОВМЕСТНАЯ СОРТИРОВКА ПО ДВУМ ГАЛКАМ
ПРОВЕРИТЬ ЗЕФИР 300 - косяки в подсветке
ограничение размеров таблиц и стилим
Пайпы в количества нутриентов и продуктов (+авто ввод только чисел)
ЭКСЕЛЬ
рекомендация какой продукт добавить  в контекстном меню нутриента и в экселе (вариант - подсветка продуктов с нулевыми количествами)
...
...
...пересчет по нормам, колонка для собств норм...
*/


}
