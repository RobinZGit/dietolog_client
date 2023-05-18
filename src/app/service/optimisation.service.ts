import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OptimisationService {

  constructor() { }

  maxL: number = 2000  //грамм, граница поиска для одного продукта
  NN  : number = 10    //точек разбиения

  currVector: any[]=[] //
  optimumVector: any[]=[] //
  currNorma: number = 0
  currDelta: number= 0//Math.pow(2,this.NN+1)  //число в 2-ичном предст вида 1001010011 - длины NN+1, первая цифра всегда 1. Используется для генерации приращений currVector ++== (currDelta**(maxL/NN))



  //==============================================================
  //==   ОСНОВНАЯ ПРОЦЕДУРА, ВЫХОД - ОПТИМАЛЬНЫЙ ВЕКТОР     ======
  generate(products:any,nutrients:any) : any[] {
    alert('optimisation will start here'); return[];
    this.NN = nutrients.length
    this.currDelta = Math.pow(2,this.NN+1)  //число в 2-ичном предст вида 1001010011 - длины NN+1, первая цифра всегда 1. Используется для генерации приращений currVector ++== (currDelta**(maxL/NN))
    let normPrev = 0
    let norm = 0
    let i = 0
    while (i<(products.length*this.NN)){ //.................!!!! criteria ????  -- мб передавать в параметр процедуры тип критерия
      i++
      this.oneStep()
      norm = this.norm2(this.currVector)  //..........this.norm2( НАЙТИ НУТРИЕНТЫ(this.currVector))
      if (norm<this.norm2(this.optimumVector)){   //
        this.optimumVector = this.currVector.slice()
        //return this.currVector
      }
      normPrev = norm
    }
    return this.optimumVector
  }
  //..... сделать асинх!!!!
  //===========================================================
  //===========================================================




  //евклидова норма
  norm2(vec:any[]){
    let n = 0
    vec.forEach(v=>n+=(v.val*v.val))
    return Math.sqrt(n)
  }

  //евклидово расстояние
  dist2(vec1:any[],vec2:any[]){
      let vec = vec1.slice()
      vec.map((v,i)=>v.val= (v.val - vec2[i].val))
      return this.norm2(vec)
  }

  oneStep(){
    this.currDelta += 1
    this.incCurrVector(this.currDelta)
  }

  incCurrVector(delta : number){
    //..............  !!!! TODO !!!! цикл по цифрам delta%2  и приращение  ...................
    let sDelta = this.currDelta.toString(2)
    for(let i=1;i<sDelta.length;i++) this.currVector[i-1].val= this.currVector[i-1].val + Number(sDelta[i])*this.maxL/this.NN
  }




}
