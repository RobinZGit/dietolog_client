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

constructor(private dataService:DataService){
  this.textFilter=''
}


ngOnInit(): void{
  this.findProducts()

  this.findNutrients()
}

findProducts(){
  //this.dataService.getProductHint(1).subscribe((v:String)=>{alert(v)})
  this.dataService.findProducts(this.textFilter).subscribe((v:string)=>{this.products=v})
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



}
