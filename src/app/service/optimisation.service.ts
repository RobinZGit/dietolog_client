import { Injectable } from '@angular/core';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class OptimisationService {

  constructor(private dataService: DataService) { }

  maxL: number = 2000  //грамм, граница поиска для одного продукта
  NN  : number = 10    //точек разбиения

  matrix: any[][]=[]
  currVector: any[]=[] //
  optimumVector: any[]=[] //
  currNorma: number = 0
  currDelta: any= 0n//Math.pow(2,this.NN+1)  //число в 2-ичном предст вида 1001010011 - длины NN+1, первая цифра всегда 1. Используется для генерации приращений currVector ++== (currDelta**(maxL/NN))

  keyForLocalStorageProductsOptimum: string = 'rz_dietolog_configuration_products_optimum_opt'
  keyForLocalStorageProducts: string = 'rz_dietolog_configuration_products_opt'
  keyForLocalStorageNutrients: string = 'rz_dietolog_configuration_nutrients_opt'
  keyForLocalStorageIteration: string = 'rz_dietolog_configuration_iteration_opt'

  //==============================================================
  //==   ОСНОВНАЯ ПРОЦЕДУРА, ВЫХОД - ОПТИМАЛЬНЫЙ ВЕКТОР     ======
  generate(products:any,nutrients:any)  {
    alert('optimisation will start here');
    this.NN = nutrients.filter((n:any)=>n.excluded==0).length
    this.currDelta = BigInt(Math.pow(2,this.NN+1))  //число в 2-ичном предст вида 1001010011 - длины NN+1, первая цифра всегда 1. Используется для генерации приращений currVector ++== (currDelta**(maxL/NN))
    products.forEach((p:any)=>this.currVector.push(p))
    this.currVector.forEach((p:any)=>p.val=0)
    //alert(JSON.stringify(this.currVector))
    let normPrev = 0
    let norm = 0
    let i = 0
    let sProducts = ','
    products.forEach((p:any) => {sProducts+=p._id+','})
    this.dataService.findInfoByProductList(sProducts+',')
       .subscribe({
        next:
           (ai:any)=>{
            //alert(JSON.stringify(ai.length))
            this.matrix=ai
            this.optimumVector = this.currVector
            //alert(JSON.stringify(this.optimumVector))
            while (i<(products.length*this.NN)){ //.................!!!! criteria ????  -- мб передавать в параметр процедуры тип критерия
              i++
              this.oneStep()
              if(i>5){alert(JSON.stringify(this.optimumVector.filter((p)=>p.val>0)));return this.optimumVector}; //########################### COUNT LIM ############################
              norm = this.norm2(this.currVector,nutrients)  //..........this.norm2( НАЙТИ НУТРИЕНТЫ(this.currVector))
              if (norm<this.norm2(this.optimumVector,nutrients)){   //
                this.optimumVector = this.currVector
                localStorage.setItem(this.keyForLocalStorageProductsOptimum,JSON.stringify(this.optimumVector))
                //alert(JSON.stringify(this.optimumVector))
                //return this.currVector
              }
              localStorage.setItem(this.keyForLocalStorageProducts,JSON.stringify(this.currVector))
              localStorage.setItem(this.keyForLocalStorageNutrients,JSON.stringify(nutrients))
              localStorage.setItem(this.keyForLocalStorageIteration,JSON.stringify(i))
              normPrev = norm
            }
            //alert(JSON.stringify(this.optimumVector.map((p:any)=>{p=p})))
            return this.optimumVector
           },
        error:(e)=>{return 0}

        }

       )

    //alert(this.currDelta+1n)
    //alert((this.currDelta+1).toString())


  }
  //..... сделать асинх!!!!
  //===========================================================
  //===========================================================




  //евклидова норма
  norm2(vecP:any[],vecN:any[]): number|any{
    let nRet = 0
    let vecNorm: any=[] //массив количеств  нутриентов
    vecN.filter((n:any)=>n.excluded==0).forEach((n:any)=>{vecNorm.push({_id:n._id,val:0, daily_norm:(n.min_dailyrate+n.max_dailyrate)/2})}) //обнуление количеств нутриентов
    //alert(JSON.stringify(vecNorm))
    //умножение на матрицу
    vecNorm.map((n:any)=>{this.matrix.filter((mm:any)=>{return mm.nutrient==n._id}).forEach((mmm:any)=>{vecP.forEach((p:any)=>{n.val=n.val + p.val * ((mmm.product==p._id)?(mmm.value-n.daily_norm):0)      }  )})})
    //вычисление нормы вектора количеств нутриентов
    vecNorm.forEach((v:any)=>nRet+=(v.val*v.val))
    //alert(Math.sqrt(nRet))
    return Math.sqrt(nRet)

  }

  //евклидово расстояние
  /*
  dist2(vec1:any[],vec2:any[]){
      let vec = vec1.slice()
      vec.map((v,i)=>v.val= (v.val - vec2[i].val))
      return this.norm2(vec)
  }
*/

  oneStep(){
    this.currDelta = BigInt(this.currDelta)+BigInt(1)
    this.incCurrVector(this.currDelta)
  }

  incCurrVector(delta : number){
    //..............  !!!! TODO !!!! цикл по цифрам delta%2  и приращение  ...................
    let sDelta = this.currDelta.toString(2)
    for(let i=1;i<sDelta.length;i++) this.currVector[i-1].val= this.currVector[i-1].val + Number(sDelta[i])*this.maxL/this.NN
    //alert(JSON.stringify(this.currVector))
  }





}
