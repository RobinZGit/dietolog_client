import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { StaticDataSource } from '../model/static.datasource';
import { DataService } from '../service/data.service';
import { MatrixService } from '../service/matrix.service';
import { OptimisationService } from '../service/optimisation.service';

@Component({
  selector: 'app-products-and-nutrients',
  templateUrl: './products-and-nutrients.component.html',
  styleUrls: ['./products-and-nutrients.component.css']
})
export class ProductsAndNutrientsComponent implements OnInit{

mainHeader:string='ДИЕТОЛОГ'
classFilter =  ''

//------------------------------------------------------------------------------
localData: boolean =true //==false - берем данные из БД сервисом java.  ==true - берем из локального класса StaticDataSource
//------------------------------------------------------------------------------

products?: any
nutrients?: any
currentInfo?: any
allInfo?: any
recommendedProducts?: any
notRecommendedProducts?: any
pcopy: any[] = [] //вспомогательный
pHist:any[] =[] //для навигации
nHist:any[] =[] //для навигации
indHist: number = -1

keyForLocalStorageProducts: string = 'rz_dietolog_configuration_products'
keyForLocalStorageNutrients: string = 'rz_dietolog_configuration_nutrients'
keyForLocalStorageParams: string = 'rz_dietolog_configuration_params'

params: any ={textSort:'',sortByNutrient:-1,valued_ontop:false,sortBySubstr:false,topCountRecommendedProducts:5}
focusedNutrient: any = {isDirty:false,nutrientId:-1,val:0}
sInfo: any = ''

constructor(private dataService:DataService,private staticDataSource:StaticDataSource, private optimisationServise:OptimisationService, private matrix:MatrixService){
  this.params.textSort=''
  this.params.sortByNutrient = -1
  this.params.valued_ontop = false
  this.params.sortBySubstr = false
  this.params.topCountRecommendedProducts = 5 //для подсветки рекомендованных (и не) продуктов. отбирать столько рекомендованных (и не) продуктов на каждый нутриент
}


ngOnInit(): void{
    try{this.findProducts()}catch(e){}
    try{this.findNutrients()}catch(e){}
    //долго this.findInfo()
    if (this.localData)
       try{
          this.allInfo = this.staticDataSource.getInfo()
       }catch(e){}
    try{//загружаем сохраненную в браузере конфигурацию
      if((localStorage.getItem(this.keyForLocalStorageProducts)!==null)
         &&(localStorage.getItem(this.keyForLocalStorageNutrients)!==null)
         &&(localStorage.getItem(this.keyForLocalStorageParams)!==null)){
        this.products = JSON.parse(String(localStorage.getItem(this.keyForLocalStorageProducts)))
        this.nutrients = JSON.parse(String(localStorage.getItem(this.keyForLocalStorageNutrients)))
        this.params = JSON.parse(String(localStorage.getItem(this.keyForLocalStorageParams)))
        this.recalcNutrients()
      }
    }catch(e){}
}

//долго..
/*
findInfo(){
  try{
    this.dataService.findInfo()
    .subscribe((ai:any)=>
        { //пересчет количеств нутриентов в выбранных продуктах
          this.allInfo = ai
          this.nutrients.filter((n:any)=>n.excluded==0).map((nutr:any)=>
                              this.products.forEach((pp:any)=> {
                                                                ai.filter((i:any)=>i.nutrient==nutr._id)
                                                                  .forEach((i:any)=>{
                                                                                        if((pp._id==i.product)&&(nutr._id==i.nutrient))
                                                                                          try{nutr.val= Number(nutr.val)+pp.val*Number(i.value)/100
                                                                                            }catch(e){}
                                                                                      })
                                                                              }))
        })
  }catch(e){alert('angular findInfo() error')}
}
*/

findProducts(){
  if (this.localData){
    if (this.products!=undefined) this.pcopy = this.products.slice()//для сохранения введенных количеств
                                                                                          this.products=this.staticDataSource.getProducts()
                                                                                          if(this.pcopy.length>0) this.products.map((p:any)=>{p.val = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].val})
                                                                                          if(this.pcopy.length>0) this.products.map((p:any)=>{p.excluded = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].excluded})
                                                                                          //this.finalSorting()
                                                                                          this.lightRecommendedProducts()
                                                                                          this.finalSorting()
  }else{

    this.dataService.findProducts('', this.params.sortByNutrient).subscribe((v:string[])=>{
                                                                                          if (this.products!=undefined) this.pcopy = this.products.slice()//для сохранения введенных количеств
                                                                                          this.products=v
                                                                                          if(this.pcopy.length>0) this.products.map((p:any)=>{p.val = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].val})
                                                                                          if(this.pcopy.length>0) this.products.map((p:any)=>{p.excluded = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].excluded})
                                                                                          //this.finalSorting()
                                                                                          this.lightRecommendedProducts()
                                                                                          this.finalSorting()
                                                                                          })
  }
}

//вспомогат для сортировки. сравнивает массивы как числа, эл-ты массива как разряды. return 1/-1/0 - a1><=a2
a1MoreA2(a1:number[],a2:number[]){
  for(let i=0;i<a1.length;i++){
    if(a1[i]>a2[i]) return 1
    if(a1[i]<a2[i]) return -1
  }
  return 0
}

//вспом. - сумма элементов массива чисел
arSumm(arr:number[]){
  return arr.reduce((acc, num) => acc + num, 0);
}

//
finalSorting(){
  this.products.sort((u:any,v:any)=>{ let a1 = [Math.abs(v.val)*(this.params.valued_ontop?1:0),   this.arSumm(this.params.textSort.split('|').map((vv:any,ind:any)=>(10000*ind+1)*v.name.toUpperCase().indexOf(vv.trim().toUpperCase())))     *(this.params.sortBySubstr?1:0),v.isrecommended,-v.rownumber]
                                      let a2 = [Math.abs(u.val)*(this.params.valued_ontop?1:0),   this.arSumm(this.params.textSort.split('|').map((vv:any,ind:any)=>(10000*ind+1)*u.name.toUpperCase().indexOf(vv.trim().toUpperCase())))     *(this.params.sortBySubstr?1:0),u.isrecommended,-u.rownumber]
                                      return this.a1MoreA2(a1,a2)
                                     })
  this.saveSettings()
}

onSelectSorting(event:any){
  this.params.sortByNutrient = event.target.value
  this.findProducts()
  this.saveSettings()
}

findNutrients(){
  /*
  this.nutrients=JSON.parse(`{v:[{norm:70,   name:"nnnutt1",  id:1},
                                 {norm:150,  name:"nnnut2",   id:2},
                                ]
                              }`)
                              */
  if (this.localData){
    if (this.nutrients!=undefined) this.pcopy = this.nutrients.slice()//для сохранения  признака excluded
    this.nutrients=this.staticDataSource.getNutrients()
    if(this.pcopy.length>0) this.nutrients.map((p:any)=>{p.excluded = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].excluded})
  }else{
    this.dataService.findNutrients('').subscribe((v:string)=>{
                              if (this.nutrients!=undefined) this.pcopy = this.nutrients.slice()//для сохранения  признака excluded
                              this.nutrients=v
                              if(this.pcopy.length>0) this.nutrients.map((p:any)=>{p.excluded = this.pcopy.filter((pp:any)=>pp._id==p._id)[0].excluded})
                          })
 }
}

//пересчет количества нутриентов при зменении кол-ва текущего продукта
recalcNutrients(doNotSaveHist:boolean=false, sText:any=''){
  this.mainHeader='...  ЖДИТЕ, ИДЕТ РАСЧЕТ ДАННЫХ  ...'
  //this.classFilter =  'light-filter'
  if (sText!=''){
    try{
      let conf:any = JSON.parse(''+sText)
      this.products = conf.products
      this.nutrients = conf.nutrients
      this.params = conf.params
    }catch(e) {alert(e)}
  }
  try{
    if(!doNotSaveHist){
      this.pHist.push(JSON.parse(JSON.stringify(this.products)))
      this.nHist.push(JSON.parse(JSON.stringify(this.nutrients)))
      this.indHist = this.nHist.length-1
    }
    //обнуляем все нутриенты
    this.nutrients.map((nutr:any)=>  nutr.val= 0)
    //пересчет
    let sProducts = ','
    this.products.filter((v:any)=>v.val>0).forEach((p:any) => {sProducts+=p._id+','})
    let excludedNutrientsList =','
    this.nutrients.filter((p:any)=>p.excluded>0).forEach((p:any) => {excludedNutrientsList+=p._id+','})

    if (this.localData){
      //this.classFilter =  'light-filter'
      //пересчет количеств нутриентов в выбранных продуктах
      this.nutrients.filter((n:any)=>n.excluded==0).map((nutr:any)=>
                          this.products.forEach((pp:any)=> {
                                                              this.allInfo.filter((i:any)=>i.nutrient==nutr._id)
                                                                .forEach((i:any)=>{
                                                                                    if((pp._id==i.product)&&(nutr._id==i.nutrient))
                                                                                      try{nutr.val= Number(nutr.val)+pp.val*Number(i.value)/100
                                                                                          }catch(e){}
                                                                                  })
                                                                            }))
      this.lightRecommendedProducts()
      this.finalSorting()
      this.saveSettings()
      this.mainHeader='ДИЕТОЛОГ'
      this.classFilter =  ''
      if(this.focusedNutrient.nutrientId>=0){
        this.focusedNutrient.val = this.nutrients.filter((n:any)=>n._id==this.focusedNutrient.nutrientId)[0].val
        this.focusedNutrient.isDirty = false
      }
    }else{
      this.dataService.findInfoByProductList(sProducts+',')
      .subscribe((ai:any)=>
          { //пересчет количеств нутриентов в выбранных продуктах
            this.currentInfo = ai
            this.nutrients.filter((n:any)=>n.excluded==0).map((nutr:any)=>
                                this.products.forEach((pp:any)=> {
                                                                   ai.filter((i:any)=>i.nutrient==nutr._id)
                                                                     .forEach((i:any)=>{
                                                                                          if((pp._id==i.product)&&(nutr._id==i.nutrient))
                                                                                            try{nutr.val= Number(nutr.val)+pp.val*Number(i.value)/100
                                                                                               }catch(e){}
                                                                                        })
                                                                                 }))
            this.lightRecommendedProducts()
            this.finalSorting()
            this.saveSettings()
            this.mainHeader='ДИЕТОЛОГ'
            if(this.focusedNutrient.nutrientId>=0){
              this.focusedNutrient.val = this.nutrients.filter((n:any)=>n._id==this.focusedNutrient.nutrientId)[0].val
              this.focusedNutrient.isDirty = false
            }
          })
    }
  }catch(e){}

}

lightRecommendedProducts(){
  //this.mainHeader='...  ЖДИТЕ, ИДЕТ РАСЧЕТ ДАННЫХ  ...'
  //подсветка рекомендованных продуктов (исходя из недостаточного кол-ва нек-х нутриентов)
  let sNutrientsNeeded = ','
  if(this.localData){
    this.allInfo.filter((v:any)=>this.nutrientIsNeeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsNeeded+=i.nutrient+','})
  }else{
    this.currentInfo.filter((v:any)=>this.nutrientIsNeeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsNeeded+=i.nutrient+','})
  }
  let excludedProductstList =','
  this.products.filter((p:any)=>p.excluded>0).forEach((p:any) => {excludedProductstList+=p._id+','})
  if (this.localData){
    this.recommendedProducts = this.staticDataSource.findInfoByProductListStatic(sNutrientsNeeded,excludedProductstList, this.params.topCountRecommendedProducts)
    this.products.map((p:any)=>{p.isrecommended = (this.recommendedProducts.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
    this.mainHeader='ДИЕТОЛОГ'
  }else{
    this.dataService.findRecommendedProducts(sNutrientsNeeded,excludedProductstList, this.params.topCountRecommendedProducts)
                    .subscribe((np:any)=>
                      { this.recommendedProducts = np
                        this.products.map((p:any)=>{p.isrecommended = (this.recommendedProducts.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
                        this.mainHeader='ДИЕТОЛОГ'
                      }
                    )
  }
  //подсветка НЕ рекомендованных продуктов (исходя из недостаточного кол-ва нек-х нутриентов)
  let sNutrientsExceeded = ','
  if(this.localData){
    this.allInfo.filter((v:any)=>this.nutrientIsExceeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsExceeded+=i.nutrient+','})
  }else{
    this.currentInfo.filter((v:any)=>this.nutrientIsExceeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsExceeded+=i.nutrient+','})
  }
  if (this.localData){
    this.notRecommendedProducts = this.staticDataSource.findInfoByProductListStatic(sNutrientsExceeded,excludedProductstList, this.params.topCountRecommendedProducts)
    this.products.map((p:any)=>{p.isnotrecommended = (this.notRecommendedProducts.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
    this.mainHeader='ДИЕТОЛОГ'
  }else{
    this.dataService.findRecommendedProducts(sNutrientsExceeded,excludedProductstList, this.params.topCountRecommendedProducts) //sic! findRecommendedProducts
                    .subscribe((np:any)=>
                      { this.notRecommendedProducts = np
                        this.products.map((p:any)=>{p.isnotrecommended = (this.notRecommendedProducts.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
                        this.mainHeader='ДИЕТОЛОГ'
                      }
                    )
  }

}

setZeroAndRecalcNutrients(product:any){
   product.val = 0
   this.recalcNutrients()
}

//больше или меньше (true) содержание nutrient в текущей раскладке
nutrientIsNeeded(nutrient:any){
  if (nutrient==undefined) return false
  return (nutrient.val<nutrient.min_dailyrate)
}

nutrientIsExceeded(nutrient:any){
  if (nutrient==undefined) return false
  return (nutrient.val>nutrient.max_dailyrate)
}

getClassNutrient(nutrient:any){
  if (nutrient==undefined) return ''
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

improveProductValues(){
  try{
    let randomNum = Math.floor(Math.random()*(this.recommendedProducts.length-1))
    let newProduct = this.recommendedProducts[randomNum].product//this.products.filter((p:any)=>p.val==0).filter((p:any)=> p._id == this.recommendedProducts.sort((u:any,v:any)=> v.value-u.value)[randomNum].product)[0]
    let pName = this.products.filter((p:any)=>p._id==newProduct)[0].name
    let nName = this.nutrients.filter((n:any)=>n._id==this.recommendedProducts[randomNum].nutrient)[0].name
    let valToNorm = 0

    try{
      let delta = (this.nutrients.filter((n:any)=>n._id==this.recommendedProducts[randomNum].nutrient)[0].min_dailyrate
                   - this.nutrients.filter((n:any)=>n._id==this.recommendedProducts[randomNum].nutrient)[0].val)
      valToNorm =  (delta>0?delta:0)  * 100/ this.recommendedProducts[randomNum].value
      if (valToNorm>200) valToNorm=200
    }catch(e){}
    this.products.map((p:any)=> {if(p._id==newProduct) p.val+=valToNorm})
    //alert(JSON.stringify(this.recommendedProducts))
    this.findProducts()
    this.recalcNutrients()
    alert('Добавлено ' + valToNorm +' гр. "'+ pName+'" для корректировки "'+ nName +'"')
  }catch(e){ alert('Не удалось подобрать продукт')}
}

setFocusedNutrient(n:any){
  if ((this.focusedNutrient.nutrientId==n._id)&&(!this.focusedNutrient.isDirty)) this.focusedNutrient.val=n.val
  if (this.focusedNutrient.nutrientId<0) this.focusedNutrient.val=n.val
  this.focusedNutrient.nutrientId=n._id
  this.focusedNutrient.isDirty=true
}

findProductToSetNutrientValue(n:any){
  try{
    if ((n._id==this.focusedNutrient.nutrientId)&& (n.val>this.focusedNutrient.val)){
      //ищем продукт с макс содержанием нутриента
        let valToNorm = 0
        let iAdd = this.staticDataSource.getInfo().filter((i:any)=>i.nutrient==n._id)
                                                  .filter((i:any)=>this.products.filter((p:any)=>((p._id==i.product)&&(p.excluded==1))).length==0)
                                                  .filter((i:any)=>this.products.filter((p:any)=>((p._id==i.product)&&(p.val==0))).length>0) //новый продукт
                                                  .sort((i1:any,i2:any)=>i2.value-i1.value)[0]
        if(iAdd!=null){
          let delta = (n.val - this.focusedNutrient.val)
          if (iAdd.value>0) valToNorm = 100*delta/iAdd.value
          if (valToNorm>200) valToNorm=200
          this.products.map((p:any)=> {if(p._id==iAdd.product) p.val+=valToNorm})
          let pName = this.products.filter((p:any)=>p._id==iAdd.product)[0].name
          let nName = this.nutrients.filter((n:any)=>n._id==iAdd.nutrient)[0].name
          this.findProducts()
          this.recalcNutrients()
          alert('Добавлено ' + valToNorm +' гр. "'+ pName+'" для корректировки "'+ nName +'"')
        }
    }else{
      if ((n._id==this.focusedNutrient.nutrientId)&& (n.val<this.focusedNutrient.val)){
        //найти продукт в раскладке с макс содержанием данного нутриента, вычесть из него. Так в цикле, пока не уменьшим до n.val
        let pNames = ''
        let valToNorm = 0
        let aDel = this.staticDataSource.getInfo().filter((i:any)=>i.nutrient==n._id)
                                                  .filter((i:any)=>this.products.filter((p:any)=>((p._id==i.product)&&(p.excluded==1))).length==0)
                                                  .filter((i:any)=>this.products.filter((p:any)=>((p._id==i.product)&&(p.val>0))).length>0) // продукт из раскладки
                                                  .sort((i1:any,i2:any)=>i2.value-i1.value)
        if(aDel!=null){
          let delta = (-n.val + this.focusedNutrient.val)
          aDel.forEach((d:any)=>
            this.products.map((p:any)=> {if(p._id==d.product) {
                                                                if (d.value>0){
                                                                  valToNorm = 100*delta/d.value
                                                                  if (valToNorm>p.val) valToNorm = p.val
                                                                }
                                                                delta = delta - valToNorm*d.value/100
                                                                p.val-=valToNorm
                                                                pNames += '"'+this.products.filter((p:any)=>p._id==d.product)[0].name + '" (на '+valToNorm+'  гр.) ; '
                                                              }})
          )
          let nName = this.nutrients.filter((n:any)=>n._id==aDel[0].nutrient)[0].name
          this.findProducts()
          this.recalcNutrients()
          alert('Уменьшены ' + pNames+' для корректировки "'+ nName +'"')
        }
      }
    }
  }catch(e){alert('Не удалось подобрать продукт')}
  this.recalcNutrients()
}

excludeAllProducts(checked:boolean){
  this.products.map((p:any)=>{if(p.val==0) p.excluded=checked})
  this.saveSettings()
}

excludeAllNutrients(checked:boolean){
  this.nutrients.map((n:any)=>{n.excluded=checked})
  this.saveSettings()
}

saveSettings(){
  localStorage.setItem(this.keyForLocalStorageProducts,JSON.stringify(this.products))
  localStorage.setItem(this.keyForLocalStorageNutrients,JSON.stringify(this.nutrients))
  localStorage.setItem(this.keyForLocalStorageParams,JSON.stringify(this.params))
}

toExcel(){
  if (this.products.filter((p:any)=>p.val>0).length==0) {
    alert('Не выбрано ни одного продукта. Генерация отчета остановлена.')
    return
  }
  //
  const wsProducts: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.products.filter((p:any)=>p.val>0));
  const wsNutrients: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.nutrients.filter((n:any)=>n.excluded==0));
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  let sTime = (new Date()).toISOString()
  //saving in loadable form
  let sConf = JSON.stringify({"params": this.params, "nutrients":this.nutrients,"products":this.products})
  let a = document.createElement('a');
  let file = new Blob([sConf], {type: 'text/plain'});
  a.href = URL.createObjectURL(file);
  a.download = 'dietolog_'+ sTime +'.dtlg';
  a.click();
  //saving in human-readable form
  XLSX.utils.book_append_sheet(workbook, wsProducts, 'Продукты');
  XLSX.utils.book_append_sheet(workbook, wsNutrients, 'Нутриенты в данной раскладке');
  XLSX.writeFile(workbook,'dietolog_'+ sTime +'.xlsx');
}

 loadFromFile(input:any) {
  //this.mainHeader='...  ЖДИТЕ, ИДЕТ РАСЧЕТ ДАННЫХ  ...'
  let file = input.files[0];
  let reader = new FileReader();
  reader.readAsText(file);
  reader.onloadend = (e)=> {
    this.recalcNutrients(false,reader.result?.toString())
  };
  reader.onerror = function() {
    alert(reader.error);
  };
}

test(){
  alert(JSON.stringify(this.products.filter((v:any)=>v.val>0)))
}

//подбор точной раскладки по нормам нутриентов
optimize(){
  let aNutr=[]
  let aRet=[]
  let aInfo=[]
  let aaInfo: any=[]
  let aaInfoCut: any=[]
  let sNutrientsNeeded = ','


  this.nutrients.filter((n:any)=>n.excluded==0).forEach((i:any) => {sNutrientsNeeded+=i.nutrient+','})
  /* ????
  if(this.localData){
    this.allInfo.filter((v:any)=>this.nutrientIsNeeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsNeeded+=i.nutrient+','})
  }else{
    this.currentInfo.filter((v:any)=>this.nutrientIsNeeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsNeeded+=i.nutrient+','})
  }
  */
  let excludedProductstList =','
  this.products.filter((p:any)=>p.excluded>0).forEach((p:any) => {excludedProductstList+=p._id+','})
  //let sNutrientsExceeded = ','
  //if(this.localData){
  //  this.allInfo.filter((v:any)=>this.nutrientIsExceeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsExceeded+=i.nutrient+','})
  //}else{
  //  this.currentInfo.filter((v:any)=>this.nutrientIsExceeded(this.nutrients.filter((n:any)=>n.excluded==0).filter((n:any)=>n._id ==  v.nutrient)[0])).forEach((i:any) => {sNutrientsExceeded+=i.nutrient+','})
 // }
  if (this.localData){
    this.recommendedProducts = this.staticDataSource.findInfoByProductListStatic(sNutrientsNeeded,excludedProductstList,1/* this.params.topCountRecommendedProducts*/)
    //this.products.map((p:any)=>{p.isrecommended = (this.recommendedProducts.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
    this.mainHeader='ДИЕТОЛОГ'
  }else{
    this.dataService.findRecommendedProducts(sNutrientsNeeded,excludedProductstList, 1/*this.params.topCountRecommendedProducts*/)
                    .subscribe((np:any)=>
                      { this.recommendedProducts = np
                        //this.products.map((p:any)=>{p.isrecommended = (this.recommendedProducts.filter((v:any)=>(v.product==p._id)).length >0)?1:0 })
                        this.mainHeader='ДИЕТОЛОГ'
                      }
                    )
  }
  //к-ты в одномерной матрице
  aInfo = this.staticDataSource.getInfo().filter((i:any)=>(this.recommendedProducts.filter((rp:any)=>rp.product==i.product)).length>0)
                                          .filter((i:any)=>this.nutrients.filter((n:any)=>n._id==i.nutrient)[0].excluded==0)
                                          .sort((i1:any,i2:any)=>i1.product-i2.product)
                                          .sort((i1:any,i2:any)=>i1.product==i2.product?i1.nutrient-i2.nutrient:0)
                                          //.forEach((i:any)=>)
  alert(JSON.stringify(this.recommendedProducts))
  //конвертация в двумерную
  //обнуляем
  let N=this.nutrients.filter((n:any)=>n.excluded==0).length

  for(let i=0; i<N; i++){
    let m:any=[]
    aaInfo.push(m)
    for(let j=0; j<N; j++) aaInfo[i].push(0)

  }
  //наполняем
  let nNorms:any = []
  let pOpt:any =[]
  let pExcluded=''
  this.nutrients.filter((n:any)=>n.excluded==0)
    .forEach((n:any,ind:number)=>{
                       nNorms.push((n.min_dailyrate+n.max_dailyrate)/2)
                       let pmax=this.staticDataSource.getInfoProductMax(n._id,this.products,pExcluded+',').product
                       pExcluded += ','+pmax
                       pOpt.push({id:pmax,val: 0 /*this.products.filter((p:any)=>{return (p._id==pmax)})[0].val*/ })
                       let fullNut = this.staticDataSource.getInfo().filter((i:any)=> {return pmax==i.product})
                       this.nutrients.filter((n2:any)=>n2.excluded==0)
                                    .forEach((nn:any,indd:number)=>{  try{
                                                                        aaInfo[ind][indd]=fullNut.filter((f:any)=>{return f.nutrient==nn._id})[0].value
                                    } catch(e){aaInfo[ind][indd]=0}
                                                                    })
                    })
  alert(" aaInfo "+JSON.stringify(aaInfo))
  alert("nNorms = "+JSON.stringify(nNorms))

  let pid:any = -1// this.recommendedProducts.filter((p:any,ind:number)=>ind==0)[0]._id
  let nid:any = -1//this.nutrients.filter((n:any)=>n.excluded==0).sort((n1:any,n2:any)=>n1._id-n2._id)[0]._id
  for(let i=0; i<N; i++){
    try{pid=this.recommendedProducts.filter((r:any)=>r.product>pid).sort((r1:any,r2:any)=>r1.product-r2.product)[0].product
    }catch(e){}
    //alert(pid)
    for(let j=0; j<N; j++){
      try{nid = this.nutrients.filter((n:any)=>n.excluded==0).sort((n1:any,n2:any)=>n1._id-n2._id)
                          .filter((n:any,ind:number)=>ind==j)[0]._id}
      catch(e){}
      let val:any
      try{val=this.staticDataSource.getInfoOne(pid,nid)[0].value
      }catch(e){}
      if (val!=undefined) aaInfo[i][j]=val
    }
  }

  /*
  //выкидываем нулевые нутриенты
  for(let i=0; i<N; i++){
    if (aaInfo[i].filter((v:number)=>v>0).length>0){
      aaInfoCut.push(aaInfo[i].splice(i,i))
    }
  }
  */
  aaInfoCut=aaInfo


  //this.sInfo = '99999'
  for(let i=0;i<aaInfoCut.length;i++){for(let j=0;j<aaInfoCut[i].length;j++) {this.sInfo+=''+aaInfoCut[i][j]+','}this.sInfo+='\n'}
  //aaInfoCut = aaInfo
  alert(" DETERMINANT= "+ this.matrix.Determinant(aaInfoCut))

  alert(aaInfoCut.length)
  alert(aaInfoCut[0].length)
  alert(" aaInfo без нулей "+JSON.stringify(aaInfoCut))
  //тест, делаем обратимой for(var i=0;i<N;i++) aaInfo[i][i]=10

  //обращаем
  aaInfoCut = this.matrix.InverseMatrix(aaInfo)
  //aInfo.forEach((i:any)=>{})
  alert(" aaInfo ОБРАТНАЯ "+JSON.stringify(aaInfoCut))

  //вычисляем итоговый набор
  if (aaInfoCut){
    for(let i=0;i<N;i++)
      for(let j=0;j<N;j++)
        pOpt[i].val+=aaInfoCut[j][i]*nNorms[j]
    //pOpt.forEach((p:any)=>{aaInfoCut.forEach((aa:any)=>{})
    //                       nNorms.forEach((n:any)=>{p.val+=0})
     //                     }
      //           )
  }

  //выводим рез-т на форму
  this.products.forEach((p:any)=>{p.val = 0
                                 pOpt.forEach((pO:any)=>{if (p._id==pO.id) p.val = pO.val
                                                        }
                                             )
                                  })
  this.recalcNutrients()

  //alert(this.recommendedProducts.length)
  //alert(aInfo.length)
  //alert(this.nutrients.filter((v:any)=>v.excluded==0).length)
  //I*p = nn
  /*
  //this.dataService.norm2('{vv: testnorm2}').subscribe((ai:any)=>alert(ai))
  //alert(0)
  try{//загружаем сохраненную в браузере конфигурацию
    if((localStorage.getItem(this.optimisationServise.keyForLocalStorageProducts)!==null)
       &&(localStorage.getItem(this.optimisationServise.keyForLocalStorageNutrients)!==null)
       //&&(localStorage.getItem(this.optimisationServise.keyForLocalStorageParams)!==null)
       ){
      this.products = JSON.parse(String(localStorage.getItem(this.optimisationServise.keyForLocalStorageProducts)))
      this.nutrients = JSON.parse(String(localStorage.getItem(this.optimisationServise.keyForLocalStorageNutrients)))
      //this.params = JSON.parse(String(localStorage.getItem(this.keyForLocalStorageParams)))
      this.recalcNutrients()
    }
  }catch(e){}
  this.optimisationServise.generate(this.products,this.nutrients)
  */
}

clear(){
  localStorage.clear()
  this.products.forEach((p:any)=>{p.val=0})
  this.recalcNutrients()
  this.ngOnInit()
}

verticalOrientation():boolean{
  return window.screen.orientation.type.toLowerCase().indexOf('portrait')>=0
}

getMainClass(classname: string):string{
  if (this.verticalOrientation()) return ''; else return classname
}

showHint(hint:any){
  alert(hint)
}

btnNextDisabled():boolean{
  return !((this.indHist>=0)&&(this.indHist<this.pHist.length-1))
}
clickNext(){
  if (!this.btnNextDisabled()){
    this.products = this.pHist[this.indHist+1]
    this.nutrients = this.nHist[this.indHist+1]
    this.recalcNutrients(true)
    this.indHist +=1
  }
}

btnPrevDisabled():boolean{
  return !(this.indHist>0)
}
clickPrev(){
  if (!this.btnPrevDisabled()){
    this.products = this.pHist[this.indHist-1]
    this.nutrients = this.nHist[this.indHist-1]
    this.recalcNutrients(true)
    this.indHist -=1
  }
}

excludeRecommended(){
  this.products.forEach((p:any)=>{if(p.isrecommended&&p.val==0){p.excluded=1}})
  this.recalcNutrients()
}

testClick(){
  let m:any=[[1,1,10,234],[1,2,89,76],[1,451,10,234],[1,2,89,88]]
  alert(JSON.stringify(  this.matrix.InverseMatrix(m)) )
  alert(JSON.stringify( this.matrix.MultiplyMatrix(m, this.matrix.InverseMatrix(m)) )  )
}

/*деплой
разово: npm install -g angular-cli-ghpages
?? ng build --base-href //dietolog_client
ng build --base-href https://robinzgit.github.io/dietolog_client/            !!!слэш в конце обязательно
ngh --dir dist\dietolog_client
*/
/*
TODO -----------------------------------------------
кнопка пересчета - и пересчет только по ней в локальном режиме
в фильтр строку поиска сразу по регулярке
добавить собщение о пересчете и какой-нибудь бледный стиль\disabled в этот моментngh --dir dist\dietolog_client

Сохранение настроек - только ненули в кол-ве а мб только ИД-кол-excl, и досчет при инициализации
{
Вывести норму отклонения в таблицу нутриентов
Матрицы и оптим по обратной матрице
}
ПРОВЕРИТЬ ЗЕФИР 300    Вино полудесертное 66 - косяки в подсветке - ГЛОБАЛЬНО ПОТЕСТИТь ПОПРАВИТЬ БД И ЗАПИХАТЬ ЕЕ В СЕРВИС
фильтры и сортировки загнать в один объект и сохранять\подгружать в onInit  - не сортирует  и не сохраняет сортировку по нутриенту - ngModel не сортирует
ЭКСЕЛЬ - единицы измерения, нормальные имена колонок, колонка избыток-недостаток ыв нутриенты и сортировка по ней

...
...
...пересчет по нормам - сервис оптимизации (перебор 0 - 2000гр крупным шагом 10-50 гр),

мб добавить сgисок симптомов избытка и недостатка - и в таблицу ниже. по выбору симптома подсветка нутриентов и продуктов
*/


}
