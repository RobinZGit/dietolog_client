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

//----------------
localData: boolean =true //==false - берем данные из БД сервисом java.  ==true - берем из локального класса StaticDataSource
//----------------

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
//topCountRecommendedProducts: number //для подсветки рекомендованных (и не) продуктов. отбирать столько рекомендованных (и не) продуктов на каждый нутриент
keyForLocalStorageProducts: string = 'rz_dietolog_configuration_products'
keyForLocalStorageNutrients: string = 'rz_dietolog_configuration_nutrients'
keyForLocalStorageParams: string = 'rz_dietolog_configuration_params'
//textFilter: string  //!не использовать! фильтрация ломает пересчет. убрал с формы
/*
textSort: string
sortByNutrient: number  //сортировка по нутриенту
valued_ontop: boolean //поместить выбранные количества сверху(в остальном сохранить сортировку по нутриенту)
sortBySubstr: boolean //поместить сверху содержащие  textSort
*/
params: any ={textSort:'',sortByNutrient:-1,valued_ontop:false,sortBySubstr:false,topCountRecommendedProducts:5}


constructor(private dataService:DataService,private staticDataSource:StaticDataSource, private optimisationServise:OptimisationService, private matrix:MatrixService){
  //this.textFilter=''
  this.params.textSort=''
  this.params.sortByNutrient = -1
  this.params.valued_ontop = false
  this.params.sortBySubstr = false
  this.params.topCountRecommendedProducts = 5 // #######   //для подсветки рекомендованных (и не) продуктов. отбирать столько рекомендованных (и не) продуктов на каждый нутриент
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

finalSorting(){
  this.products.sort((u:any,v:any)=>{ let a1 = [v.val*(this.params.valued_ontop?1:0),v.name.toUpperCase().indexOf(this.params.textSort.toUpperCase())*(this.params.sortBySubstr?1:0),v.isrecommended,-v.rownumber]
                                      let a2 = [u.val*(this.params.valued_ontop?1:0),u.name.toUpperCase().indexOf(this.params.textSort.toUpperCase())*(this.params.sortBySubstr?1:0),u.isrecommended,-u.rownumber]
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
      //if (this.indHist==this.nHist.length-2)
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
      //this.finalSorting()
      this.lightRecommendedProducts()
      this.finalSorting()
      this.saveSettings()
      this.mainHeader='ДИЕТОЛОГ'
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
            //this.finalSorting()
            this.lightRecommendedProducts()
            this.finalSorting()
            this.saveSettings()
            this.mainHeader='ДИЕТОЛОГ'
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
  //let excludedNutrientsList =','
  //this.nutrients.filter((p:any)=>p.excluded>0).forEach((p:any) => {excludedNutrientsList+=p._id+','})
  if (this.localData){
    this.recommendedProducts = this.staticDataSource.findInfoByProductListStatic(sNutrientsNeeded,excludedProductstList, this.params.topCountRecommendedProducts)
    //alert(JSON.stringify(this.recommendedProducts))
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

improveProductValues(plusVal:number){
  try{
    let newProduct = this.products.filter((p:any)=> p._id == this.recommendedProducts.sort((u:any,v:any)=> v.value-u.value)[0].product)[0]
    this.products.map((p:any)=> {if(p._id==newProduct._id) p.val+=plusVal})
    this.findProducts()
    alert('Добавлено ' + plusVal +' гр. "'+newProduct.name+'"')
  }catch(e){ alert('Не удалось подобрать продукт')}
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
  let aaInfo=[]
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
  //alert(JSON.stringify(this.recommendedProducts))
  //конвертация в двумерную
  //обнуляем
  let N=this.nutrients.filter((n:any)=>n.excluded==0).length
  for(let i=0; i<N; i++){
    let m:any=[]
    aaInfo.push(m)
    for(let j=0; j<N; j++) aaInfo[i].push(0)
  }
  //наполняем
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
  //тест, делаем обратимой for(var i=0;i<N;i++) aaInfo[i][i]=10
  //обращаем
  aaInfo = this.matrix.InverseMatrix(aaInfo)
  //aInfo.forEach((i:any)=>{})
  alert(JSON.stringify(aaInfo))
  alert(this.recommendedProducts.length)
  alert(aInfo.length)
  alert(this.nutrients.filter((v:any)=>v.excluded==0).length)
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
  localStorage.clear
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
