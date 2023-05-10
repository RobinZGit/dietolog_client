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
onCangeProductVal(product : any){
  let pVal = Number(product.val)
  if(isNaN(pVal)){
    alert('Количество продукта должно быть числом!')
    product.val = 0
  }else{
    this.dataService.findInfoByProductId(product._id).subscribe((v:any)=>
                                                               {
                                                                 this.nutrients.map((nutr:any)=> v.forEach((vv:any)=>{if(vv.nutrient==nutr._id) nutr.val= Number(nutr.val)+pVal*Number(vv.value)/100}))
                                                               })
  }
}

/*
TODO -----------------------------------------------
сортировка нутриентов?
СРАВНЕНИЕ С НОРМАМИ И ПОДСВЕТКА
ПРОВЕРКА ЦИФР
в фильтр - галка Поместить выбранные вверху
ограничение размеров таблиц и стилим
Пайпы в количества нутриентов и продуктов (+авто ввод только чисел)
...
...
...пересчет по нормам, колонка для собств норм...
*/


}
