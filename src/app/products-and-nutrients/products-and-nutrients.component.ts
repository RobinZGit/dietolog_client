import { Component, OnInit} from '@angular/core';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-products-and-nutrients',
  templateUrl: './products-and-nutrients.component.html',
  styleUrls: ['./products-and-nutrients.component.css']
})
export class ProductsAndNutrientsComponent implements OnInit{

//jsonProducts?: string;
//jsonNutrients?: string;
products?: any;
nutrients?: any;

textFilter: string

constructor(private dataService:DataService){
  this.textFilter=''
}


ngOnInit(): void{
  this.onFindProduct()
  this.onFindNutrients()
  //alert(JSON.stringify(this.products))
}

onFindProduct(){
  /*
  this.products=//JSON.parse(
                    { "colNames": {"val":"Количество(гр)", "name":"Наименование",  "id":"id"},
                      "list":[ {"val":100, "name":"ppp1",  "id":1},
                               {"val":50,  "name":"ppp2",  "id":2},
                          ]
                      }
                     // )
                     */

  //!ВЕРНУТЬ!
  this.dataService.findProducts(this.textFilter).subscribe((v:string)=>{this.products=v})
}

onFindNutrients(){
  /*
  this.nutrients=JSON.parse(`{v:[{norm:70,   name:"nnnutt1",  id:1},
                                 {norm:150,  name:"nnnut2",   id:2},
                                ]
                              }`)
                              */
  //!ВЕРНУТЬ!  this.dataService.findNutrients(this.textFilter).subscribe((v:string)=>{this.jsonNutrients=v})
}

}
