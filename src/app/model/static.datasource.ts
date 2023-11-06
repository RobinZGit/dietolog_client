import { Injectable } from "@angular/core";
//import { Observable } from "rxjs/internal/Observable";

@Injectable()
export class StaticDataSource {

getNutrients(): any {
    return this.nutrients;
}

getProducts(): any {
  return this.products;
}

getInfo(): any {
  return this.info.filter((i:any)=>{return this.products.filter((p:any)=>{return p._id==i.product}).length>0})
                  .filter((i:any)=>{return this.nutrients.filter((n:any)=>{return n._id==i.nutrient}).length>0});
}

getInfoOne(productid:number,nutrientid:number): any {
  return this.info.filter((i:any)=>{return productid==i.product})
                  .filter((i:any)=>{return nutrientid==i.nutrient});
}

getInfoProductsSortedByNutrientValue(nutrientid:number): any {
  return this.info.filter((i:any)=>{return nutrientid==i.nutrient})
                  .sort((i1:any,i2:any)=>{return (i2.value - i1.value)})
}

getInfoNutrientsSortedByPercentInProduct(productid:number): any {
  return this.info.filter((i:any)=>{return productid==i.product})
                  .sort((i1:any,i2:any)=>{return (Number(i2.perc1on100gr/*.replaceAll(',','.')*/)-Number(i1.perc1on100gr/*.replaceAll(',','.')*/))})
}

//продукт с максимальным содержанием nutrientid, только не проверять products.excluded>0)
getInfoProductMax(nutrientid:number, products:number[], pExcluded:string): any {
  try{
    return this.info.filter((i:any)=>{return nutrientid==i.nutrient})
                    .filter((i:any)=>{ if (products.filter((p:any)=>{return (p._id==i.product)&&(p.excluded==0)&&(pExcluded.indexOf(','+p._id+',')<0)}).length>0)  return true; else return false})
                    .sort((i1:any,i2:any)=>{return (i2.value - i1.value)})[0]
  }catch(e){return []}
}

recalcPerc1on100gr(){
  this.info.forEach((i:any)=>{try{
                                   let nutr = this.nutrients.filter((n:any)=>{return n._id==i.nutrient})[0]
                                   if (nutr != undefined) i.perc1on100gr= Math.round(100*i.value/nutr.min_dailyrate)
                                 }catch(e){}
                             })
}

findInfoByProductListStatic(nutrientList:string, excludedProductstList:string, topCountRecommendedProducts:number){
  "select _id, product, nutrient, value, perc1on100gr , rn from (  \n" +
  "    select _id, product, nutrient, cast(value as text) value, cast(perc1on100gr as text) perc1on100gr  \n" +
  "         , row_number() OVER (PARTITION BY i.nutrient ORDER BY i.perc1on100gr DESC ) rn  \n" +
  "    from info i  where position(','||i.nutrient||',' in :nutrientList) > 0  \n" +
  "                       and position(','||i.product||',' in :excludedProductstList) <= 0  \n" +
  ") ZZ where rn<=:topCountRecommendedProducts  \n"

  let aRet:any =[]
  let count=0
  let currentNId = -1
  this.info.filter((i:any)=>{return this.products.filter((p:any)=>{return p._id==i.product}).length>0})
          .filter((i:any)=>{return this.nutrients.filter((n:any)=>{return n._id==i.nutrient}).length>0})
          .filter((i:any)=>{return (nutrientList.indexOf(','+i.nutrient+',')>=0)&&(excludedProductstList.indexOf(','+i.product+',')<0) })
          .sort((i1:any,i2:any)=>{return (i1.nutrient - i2.nutrient)})
          .sort((i1:any,i2:any)=>{ if (i1.nutrient == i2.nutrient) return (Number(i2.perc1on100gr/*.replaceAll(',','.')*/)-Number(i1.perc1on100gr/*.replaceAll(',','.')*/)); else return (i1.nutrient - i2.nutrient) })
          .forEach((v:any,ind:number)=>{
                                          if(((v.nutrient==currentNId)||(currentNId<0))&&(count<topCountRecommendedProducts)){
                                            aRet.push(v)
                                            count++
                                          }
                                          if((v.nutrient!=currentNId)&&(currentNId>=0)) count = 0
                                          currentNId = v.nutrient
                                        })
  //alert(JSON.stringify(aRet))
  return aRet
}
/*
select
'{''hint'': '''
                 ||n.name||', основные продукты:'||'\n'||'\n'||(select string_agg(name||' - '||cast(value as text)||' '||units||' на 100гр. ('||perc1on100gr||'% сут.нормы)'   ,'\n')
																	 from (select p.name, i.value, i.perc1on100gr
																		   from info i left join products p on p._id=i.product
																		   where i.nutrient=n._id order by i.value desc limit 20) ZZ)  ||''''
				 || ', ''_id'': '||n._id
				 || ', ''name'': '''||name
				 || ''' ,''units'': '''||units
				 || ''', ''val'': '||0
				 || ', ''min_dailyrate'': '||min_dailyrate
				 || ', ''max_dailyrate'': '||max_dailyrate
				 || ', ''koeff_to_miligr'': '||(case n.units when 'г' then 1000 when 'мг' then 1 when 'мкг' then 0.001 when 'кКал' then 100000 else 1 end)
				 || ', ''excluded'': '||0
				 ||'},'
				 from nutrients n
				 order by coalesce(n.min_dailyrate,-1)*(case n.units when 'г' then 1000 when 'мг' then 1 when 'мкг' then 0.001 when 'кКал' then 100000 else 1 end) desc,n._id
*/
private nutrients: any = [
  {
      "info": "",
      "hint": "",
      "_id": 3,
      "name": "Калорийность",
      "units": "кКал",
      "val": 0,
      "min_dailyrate": 2500,
      "max_dailyrate": 3000,
      "koeff_to_miligr": 100000,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/carbohydrates.html",
      "hint": "",
      "_id": 2,
      "name": "Углеводы",
      "units": "г",
      "val": 0,
      "min_dailyrate": 400,
      "max_dailyrate": 500,
      "koeff_to_miligr": 1000,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/food-components/starch.html",
      "hint": "",
      "_id": 53,
      "name": "Крахмал",
      "units": "г",
      "val": 0,
      "min_dailyrate": 350,
      "max_dailyrate": 450,
      "koeff_to_miligr": 1000,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/fats.html",
      "hint": "",
      "_id": 1,
      "name": "Жиры",
      "units": "г",
      "val": 0,
      "min_dailyrate": 100,
      "max_dailyrate": 100,
      "koeff_to_miligr": 1000,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/proteins.html",
      "hint": "",
      "_id": 0,
      "name": "Белки",
      "units": "г",
      "val": 0,
      "min_dailyrate": 80,
      "max_dailyrate": 100,
      "koeff_to_miligr": 1000,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/food-components/glucose.html",
      "hint": "",
      "_id": 45,
      "name": "Сахара",
      "units": "г",
      "val": 0,
      "min_dailyrate": 50,
      "max_dailyrate": 100,
      "koeff_to_miligr": 1000,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/food-components/cellulose.html",
      "hint": "",
      "_id": 46,
      "name": "Пищевые волокна",
      "units": "г",
      "val": 0,
      "min_dailyrate": 25,
      "max_dailyrate": 40,
      "koeff_to_miligr": 1000,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/sodium.html",
      "hint": "",
      "_id": 22,
      "name": "Натрий (Na)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 4000,
      "max_dailyrate": 6000,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/chlorine.html",
      "hint": "",
      "_id": 25,
      "name": "Хлор (Cl)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 4000,
      "max_dailyrate": 7000,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/potassium.html",
      "hint": "",
      "_id": 18,
      "name": "Калий (K)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 3000,
      "max_dailyrate": 5000,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/sulfur.html",
      "hint": "",
      "_id": 23,
      "name": "Сера (S)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 1000,
      "max_dailyrate": 1000,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/phosphorus.html",
      "hint": "",
      "_id": 24,
      "name": "Фосфор (P)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 1000,
      "max_dailyrate": 1200,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/calcium.html",
      "hint": "",
      "_id": 19,
      "name": "Кальций (Ca)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 800,
      "max_dailyrate": 1000,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/products-containing-vitamin-b4.html",
      "hint": "",
      "_id": 16,
      "name": "Витамин В4",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 500,
      "max_dailyrate": 1000,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/magnesium.html",
      "hint": "",
      "_id": 21,
      "name": "Магний (Mg)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 400,
      "max_dailyrate": 500,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/food-components/sterols.html",
      "hint": "",
      "_id": 47,
      "name": "Холестерин",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 300,
      "max_dailyrate": 600,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/vitamin-c.html",
      "hint": "",
      "_id": 11,
      "name": "Витамин С",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 70,
      "max_dailyrate": 100,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/silicon.html",
      "hint": "",
      "_id": 20,
      "name": "Кремний (Si)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 20,
      "max_dailyrate": 30,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/products-containing-vitamin-pp.html",
      "hint": "",
      "_id": 15,
      "name": "Витамин РР",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 16,
      "max_dailyrate": 28,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/products-containing-vitamin-b3.html",
      "hint": "",
      "_id": 7,
      "name": "Витамин В3",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 15,
      "max_dailyrate": 25,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/vitamin-e.html",
      "hint": "",
      "_id": 13,
      "name": "Витамин Е",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 15,
      "max_dailyrate": 15,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/iron.html",
      "hint": "",
      "_id": 17,
      "name": "Железо (Fe)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 10,
      "max_dailyrate": 18,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/zinc.html",
      "hint": "",
      "_id": 43,
      "name": "Цинк (Zn)",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 10,
      "max_dailyrate": 15,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/manganese.html",
      "hint": "",
      "_id": 32,
      "name": "Марганец (Mn)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 5000,
      "max_dailyrate": 10000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/vitamin-b5-sources.html",
      "hint": "",
      "_id": 52,
      "name": "Витамин В5",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 5000,
      "max_dailyrate": 10000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/products-containing-vitamin-b6.html",
      "hint": "",
      "_id": 8,
      "name": "Витамин В6",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 2,
      "max_dailyrate": 2,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/vanadium.html",
      "hint": "",
      "_id": 28,
      "name": "Ванадий (V)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 2000,
      "max_dailyrate": 2000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/products-containing-vitamin-b1.html",
      "hint": "",
      "_id": 5,
      "name": "Витамин В1",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 1.6,
      "max_dailyrate": 2.5,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/vitamin-a.html",
      "hint": "",
      "_id": 4,
      "name": "Витамин А",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 1500,
      "max_dailyrate": 2000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/products-containing-vitamin-b2.html",
      "hint": "",
      "_id": 6,
      "name": "Витамин В2",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 1.5,
      "max_dailyrate": 2.5,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/products-containing-vitamin-h.html",
      "hint": "",
      "_id": 14,
      "name": "Витамин Н",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 1500,
      "max_dailyrate": 3000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/copper.html",
      "hint": "",
      "_id": 33,
      "name": "Медь (Cu)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 1500,
      "max_dailyrate": 3000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/fluorine.html",
      "hint": "",
      "_id": 41,
      "name": "Фтор (F)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 1500,
      "max_dailyrate": 2000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/boron.html",
      "hint": "",
      "_id": 27,
      "name": "Бор (B)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 600,
      "max_dailyrate": 2000,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/molybdenum.html",
      "hint": "",
      "_id": 34,
      "name": "Молибден (Mo)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 500,
      "max_dailyrate": 500,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/vitamin-b9.html",
      "hint": "",
      "_id": 9,
      "name": "Витамин В9",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 400,
      "max_dailyrate": 400,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/chromium.html",
      "hint": "",
      "_id": 42,
      "name": "Хром (Cr)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 200,
      "max_dailyrate": 250,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/iodine.html",
      "hint": "",
      "_id": 29,
      "name": "Йод (I)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 100,
      "max_dailyrate": 150,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/cobalt.html",
      "hint": "",
      "_id": 30,
      "name": "Кобальт (Co)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 100,
      "max_dailyrate": 1200,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/selenium.html",
      "hint": "",
      "_id": 38,
      "name": "Селен (Se)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 50,
      "max_dailyrate": 70,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/minerals/nickel.html",
      "hint": "",
      "_id": 35,
      "name": "Никель (Ni)",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 30,
      "max_dailyrate": 35,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/vitamin-d.html",
      "hint": "",
      "_id": 12,
      "name": "Витамин D",
      "units": "мг",
      "val": 0,
      "min_dailyrate": 0.01,
      "max_dailyrate": 0.015,
      "koeff_to_miligr": 1,
      "excluded": 0
  },
  {
      "info": "https://edaplus.info/vitamins/vitamin-b12.html",
      "hint": "",
      "_id": 10,
      "name": "Витамин В12",
      "units": "мкг",
      "val": 0,
      "min_dailyrate": 3,
      "max_dailyrate": 3,
      "koeff_to_miligr": 0.001,
      "excluded": 0
  }
]


/*select
                  '{''hint'': '''
                 || p.name||', основные нутриенты:\n\n'||(select string_agg(name||' - '||cast(value as text)||' '||units||' на 100гр. ('||perc1on100gr||'% сут.нормы)','\n')  from (select * from(select n.name,i.value, i.perc1on100gr, n.units from info i left join nutrients n on n._id=i.nutrient where i.product=p._id order by to_number(coalesce(i.perc1on100gr,'0'),'999999D99') desc limit 20)ZZZ) ZZ)
                 || ''',''rownumber'':'|| row_number() over(order by p._id )--row_number() over(order by COALESCE(ii.value,0) desc,p._id)
				 || ', ''_id'': '||p._id
				 || ', ''name'': '''||name
				 || ''' ,''lowercase'': '''||lowercase
				 || ''', ''val'': '||0
				 || ', ''isrecommended'': '||0
				 || ', ''isnotrecommended'': '||0
				 || ', ''excluded'': '||0
				 ||'},'
                 from products p
                -- left join info ii on --ii.nutrient=sorting and
				--                      ii.product =p._id
                --where  p.name like '%пре%'
				order by p._id
                -- order by COALESCE(ii.value,0) desc,p._id  */
private products: any = [
  {
      "hint": "",
      "rownumber": 1,
      "_id": 1,
      "name": "Вино сухое белое",
      "lowercase": "вино сухое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 2,
      "_id": 2,
      "name": "Вино сухое красное",
      "lowercase": "вино сухое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 3,
      "_id": 3,
      "name": "Вино ликерное",
      "lowercase": "вино ликерное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 4,
      "_id": 4,
      "name": "Вино столовое красное",
      "lowercase": "вино столовое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 5,
      "_id": 5,
      "name": "Вино полудесертное",
      "lowercase": "вино полудесертное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 6,
      "_id": 6,
      "name": "Вино полусладкое белое и красное",
      "lowercase": "вино полусладкое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 7,
      "_id": 7,
      "name": "Коньяк",
      "lowercase": "коньяк",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 8,
      "_id": 8,
      "name": "Ликер вишневый",
      "lowercase": "ликер",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 9,
      "_id": 9,
      "name": "Водка",
      "lowercase": "водка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 10,
      "_id": 10,
      "name": "Пиво",
      "lowercase": "пиво",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 11,
      "_id": 11,
      "name": "Вино десертное",
      "lowercase": "вино",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 12,
      "_id": 12,
      "name": "Вино крепкое",
      "lowercase": "вино",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 13,
      "_id": 14,
      "name": "Наливка «Сливянка»",
      "lowercase": "наливка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 14,
      "_id": 15,
      "name": "Пиво светлое",
      "lowercase": "пиво",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 15,
      "_id": 16,
      "name": "Пиво темное, 13% сусла",
      "lowercase": "пиво",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 16,
      "_id": 17,
      "name": "Пиво темное, 20% сусла",
      "lowercase": "пиво",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 17,
      "_id": 20,
      "name": "Текила Санрайз, консервированная",
      "lowercase": "текила",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 18,
      "_id": 21,
      "name": "Апельсиновый напиток, с витамином C",
      "lowercase": "апельсиновый напиток",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 19,
      "_id": 22,
      "name": "Вино, безалкогольное",
      "lowercase": "вино",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 20,
      "_id": 23,
      "name": "Виноградный напиток",
      "lowercase": "виноградный напиток",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 21,
      "_id": 24,
      "name": "Вода, бутилированная",
      "lowercase": "вода",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 22,
      "_id": 25,
      "name": "Вода, водопроводная",
      "lowercase": "вода",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 23,
      "_id": 26,
      "name": "Sprite, с лимонно-лаймовым вкусом",
      "lowercase": "sprite",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 24,
      "_id": 27,
      "name": "Coca-Cola",
      "lowercase": "coca-cola",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 25,
      "_id": 28,
      "name": "Какао, со сгущенным молоком и сахаром",
      "lowercase": "какао",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 26,
      "_id": 29,
      "name": "Кисель вишневый",
      "lowercase": "кисель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 27,
      "_id": 30,
      "name": "Кисель из клюквы",
      "lowercase": "кисель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 28,
      "_id": 31,
      "name": "Кисель из кураги",
      "lowercase": "кисель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 29,
      "_id": 32,
      "name": "Кисель сливовый",
      "lowercase": "кисель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 30,
      "_id": 33,
      "name": "Кисель из сушеных яблок",
      "lowercase": "кисель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 31,
      "_id": 34,
      "name": "Кисель из яблок",
      "lowercase": "кисель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 32,
      "_id": 35,
      "name": "Компот вишневый",
      "lowercase": "компот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 33,
      "_id": 36,
      "name": "Компот грушевый",
      "lowercase": "компот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 34,
      "_id": 37,
      "name": "Компот из абрикосов",
      "lowercase": "компот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 35,
      "_id": 38,
      "name": "Компот из айвы",
      "lowercase": "компот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 36,
      "_id": 39,
      "name": "Компот из крыжовника и черной смородины",
      "lowercase": "компот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 37,
      "_id": 40,
      "name": "Компот из персиков",
      "lowercase": "компот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 38,
      "_id": 41,
      "name": "Компот из черешни",
      "lowercase": "компот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 39,
      "_id": 42,
      "name": "Кофе жареный в зернах",
      "lowercase": "кофе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 40,
      "_id": 43,
      "name": "Кофе с молоком",
      "lowercase": "кофе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 41,
      "_id": 44,
      "name": "Кофе со сгущенным молоком",
      "lowercase": "кофе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 42,
      "_id": 45,
      "name": "Кофе черный без сахара",
      "lowercase": "кофе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 43,
      "_id": 46,
      "name": "Кофе быстрорастворимый, без кофеина",
      "lowercase": "кофе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 44,
      "_id": 47,
      "name": "Кофе натуральный, со сгущенкой и сахаром",
      "lowercase": "кофе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 45,
      "_id": 48,
      "name": "Кофе растворимый, без кофеина, порошок",
      "lowercase": "кофе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 46,
      "_id": 49,
      "name": "Кофе растворимый, обычный, порошок",
      "lowercase": "кофе растворимый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 47,
      "_id": 50,
      "name": "Напиток апельсиновый",
      "lowercase": "напиток апельсиновый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 48,
      "_id": 51,
      "name": "Абрикосовый сок, консервированный",
      "lowercase": "абрикосовый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 49,
      "_id": 52,
      "name": "Айвовый сок, консервированный",
      "lowercase": "айвовый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 50,
      "_id": 53,
      "name": "Ананасовый сок, консервированный",
      "lowercase": "ананасовый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 51,
      "_id": 54,
      "name": "Апельсиновый сок, консервированный",
      "lowercase": "апельсиновый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 52,
      "_id": 55,
      "name": "Виноградный сок, консервированный",
      "lowercase": "виноградный сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 53,
      "_id": 56,
      "name": "Вишневый сок, консервированный",
      "lowercase": "вишневый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 54,
      "_id": 57,
      "name": "Гранатовый сок, консервированный",
      "lowercase": "гранатовый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 55,
      "_id": 58,
      "name": "Грейпфрутовый сок, консервированный",
      "lowercase": "грейпфрутовый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 56,
      "_id": 59,
      "name": "Клюквенный сок, неподслащенный",
      "lowercase": "клюквенный сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 57,
      "_id": 60,
      "name": "Лаймовый сок, консервированный",
      "lowercase": "лаймовый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 58,
      "_id": 61,
      "name": "Лимонный сок, сырой",
      "lowercase": "лимонный сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 59,
      "_id": 62,
      "name": "Мандариновый сок, консервированный",
      "lowercase": "мандариновый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 60,
      "_id": 63,
      "name": "Морковный сок, консервированный",
      "lowercase": "морковный сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 61,
      "_id": 64,
      "name": "Персиковый сок, консервированный",
      "lowercase": "персиковый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 62,
      "_id": 65,
      "name": "Свекольный сок, консервированный",
      "lowercase": "свекольный сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 63,
      "_id": 66,
      "name": "Сливовый сок, консервированный",
      "lowercase": "сливовый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 64,
      "_id": 67,
      "name": "Сок шиповника",
      "lowercase": "сок шиповника",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 65,
      "_id": 68,
      "name": "Томатный сок",
      "lowercase": "томатный сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 66,
      "_id": 69,
      "name": "Черноплодно-рябиновый сок",
      "lowercase": "черноплодно-рябиновый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 67,
      "_id": 70,
      "name": "Черносмородиновый сок",
      "lowercase": "черносмородиновый сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 68,
      "_id": 71,
      "name": "Яблочный сок",
      "lowercase": "яблочный сок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 69,
      "_id": 72,
      "name": "Хлебный квас",
      "lowercase": "хлебный квас",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 70,
      "_id": 73,
      "name": "Чай с лимоном",
      "lowercase": "чай с лимоном",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 71,
      "_id": 74,
      "name": "Чай с сахаром",
      "lowercase": "чай с сахаром",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 72,
      "_id": 75,
      "name": "Чай с молоком",
      "lowercase": "чай с молоком",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 73,
      "_id": 76,
      "name": "Минеральная вода «Боржоми»",
      "lowercase": "минеральная вода боржоми",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 74,
      "_id": 77,
      "name": "Минеральная вода «Ессентуки № 4»",
      "lowercase": "минеральная вода ессентуки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 75,
      "_id": 78,
      "name": "Минеральная вода «Нарзан»",
      "lowercase": "минеральная вода нарзан",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 76,
      "_id": 79,
      "name": "Бараний жир топленый",
      "lowercase": "бараний жир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 77,
      "_id": 80,
      "name": "Говяжий жир топленый",
      "lowercase": "говяжий жир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 78,
      "_id": 81,
      "name": "Жир гусиный",
      "lowercase": "жир гусиный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 79,
      "_id": 82,
      "name": "Рыбий жир",
      "lowercase": "рыбий жир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 80,
      "_id": 83,
      "name": "Жир кондитерский",
      "lowercase": "жир кондитерский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 81,
      "_id": 84,
      "name": "Жир кондитерский твердый",
      "lowercase": "жир кондитерский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 82,
      "_id": 85,
      "name": "Жир костный топленый",
      "lowercase": "жир костный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 83,
      "_id": 86,
      "name": "Жир кулинарный",
      "lowercase": "жир кулинарный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 84,
      "_id": 87,
      "name": "Куриный жир",
      "lowercase": "куриный жир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 85,
      "_id": 88,
      "name": "Майонез «Провансаль»",
      "lowercase": "майонез провансаль",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 86,
      "_id": 89,
      "name": "Майонез диетический",
      "lowercase": "майонез диетический",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 87,
      "_id": 90,
      "name": "Майонез столовый, молочный",
      "lowercase": "майонез столовый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 88,
      "_id": 91,
      "name": "Маргарин «Здоровье»",
      "lowercase": "маргарин здоровье",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 89,
      "_id": 92,
      "name": "Маргарин «Экстра»",
      "lowercase": "маргарин экстра",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 90,
      "_id": 93,
      "name": "Маргарин из соевого или кукурузного масла",
      "lowercase": "маргарин",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 91,
      "_id": 94,
      "name": "Маргарин низкокалорийный, 60%",
      "lowercase": "маргарин низкокалорийный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 92,
      "_id": 95,
      "name": "Маргарин сливочный",
      "lowercase": "маргарин сливочный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 93,
      "_id": 96,
      "name": "Масло «Бутербродное» сладко-сливочное",
      "lowercase": "масло бутербродное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 94,
      "_id": 97,
      "name": "Масло «Крестьянское» сливочное",
      "lowercase": "масло крестьянское",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 95,
      "_id": 98,
      "name": "Масло «Любительское» сладко-сливочное",
      "lowercase": "масло любительское",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 96,
      "_id": 99,
      "name": "Арахисовое масло",
      "lowercase": "арахисовое масло",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 97,
      "_id": 100,
      "name": "Горчичное масло",
      "lowercase": "горчичное масло",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 98,
      "_id": 101,
      "name": "Масло какао",
      "lowercase": "масло какао",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 99,
      "_id": 102,
      "name": "Масло кокосовое",
      "lowercase": "масло кокосовое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 100,
      "_id": 103,
      "name": "Масло конопляное",
      "lowercase": "масло конопляное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 101,
      "_id": 104,
      "name": "Масло кукурузное",
      "lowercase": "масло кукурузное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 102,
      "_id": 105,
      "name": "Масло кунжутное",
      "lowercase": "масло кунжутное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 103,
      "_id": 106,
      "name": "Льняное масло",
      "lowercase": "льняное масло",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 104,
      "_id": 107,
      "name": "Оливковое масло, рафинированное",
      "lowercase": "оливковое масло",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 105,
      "_id": 108,
      "name": "Пальмовое масло",
      "lowercase": "пальмовое масло",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 106,
      "_id": 109,
      "name": "Подсолнечное масло",
      "lowercase": "подсолнечное масло",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 107,
      "_id": 110,
      "name": "Масло соевое",
      "lowercase": "масло соевое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 108,
      "_id": 111,
      "name": "Масло топленое",
      "lowercase": "масло топленое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 109,
      "_id": 112,
      "name": "Сало свинина",
      "lowercase": "сало свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 110,
      "_id": 113,
      "name": "Шпик свинина",
      "lowercase": "шпик свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 111,
      "_id": 114,
      "name": "Сало соленое, свинина",
      "lowercase": "сало соленое, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 112,
      "_id": 115,
      "name": "Баранки",
      "lowercase": "баранки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 113,
      "_id": 116,
      "name": "Баранки сдобные",
      "lowercase": "баранки сдобные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 114,
      "_id": 117,
      "name": "Батон нарезной, пшеница, 1 сорт",
      "lowercase": "батон нарезной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 115,
      "_id": 118,
      "name": "Батон нарезной, пшеница, высший сорт",
      "lowercase": "батон нарезной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 116,
      "_id": 119,
      "name": "Батон, пшеница 1 сорт",
      "lowercase": "батон",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 117,
      "_id": 120,
      "name": "Бублики",
      "lowercase": "бублики",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 118,
      "_id": 121,
      "name": "Бублики с изюмом",
      "lowercase": "бублики с изюмом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 119,
      "_id": 122,
      "name": "Бублики с овсяными отрубями",
      "lowercase": "бублики с овсяными отрубями",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 120,
      "_id": 123,
      "name": "Булка ярославская сдобная",
      "lowercase": "булка ярославская сдобная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 121,
      "_id": 124,
      "name": "Булка городская",
      "lowercase": "булка городская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 122,
      "_id": 125,
      "name": "Булочка повышенной калорийности",
      "lowercase": "булочка повышенной калорийности",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 123,
      "_id": 126,
      "name": "Булочка молочная",
      "lowercase": "булочка молочная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 124,
      "_id": 127,
      "name": "Булочка сдобная",
      "lowercase": "булочка сдобная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 125,
      "_id": 128,
      "name": "Булочка столичная",
      "lowercase": "булочка столичная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 126,
      "_id": 129,
      "name": "Булочка столичная с молочной сывороткой",
      "lowercase": "булочка столичная с молочной сывороткой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 127,
      "_id": 130,
      "name": "Вафли с жировыми начинками",
      "lowercase": "вафли с жировыми начинками",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 128,
      "_id": 131,
      "name": "Вафли с фруктово-ягодными начинками",
      "lowercase": "вафли с фруктово-ягодными начинками",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 129,
      "_id": 132,
      "name": "Галеты из муки высшего сорта",
      "lowercase": "галеты из муки высшего сорта",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 130,
      "_id": 133,
      "name": "Галеты из муки первого сорта",
      "lowercase": "галеты из муки первого сорта",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 131,
      "_id": 134,
      "name": "Гренки обычные",
      "lowercase": "гренки обычные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 132,
      "_id": 135,
      "name": "Дрожжи прессованные",
      "lowercase": "дрожжи прессованные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 133,
      "_id": 136,
      "name": "Запеканка из тыквы",
      "lowercase": "запеканка из тыквы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 134,
      "_id": 137,
      "name": "Запеканка капустная",
      "lowercase": "запеканка капустная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 135,
      "_id": 138,
      "name": "Запеканка картофельная с овощами",
      "lowercase": "запеканка картофельная с овощами",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 136,
      "_id": 139,
      "name": "Запеканка морковная",
      "lowercase": "запеканка морковная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 137,
      "_id": 140,
      "name": "Запеканка рисовая",
      "lowercase": "запеканка рисовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 138,
      "_id": 141,
      "name": "Запеканка рисовая с творогом",
      "lowercase": "запеканка рисовая с творогом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 139,
      "_id": 142,
      "name": "Клецки",
      "lowercase": "клецки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 140,
      "_id": 143,
      "name": "Крекеры молочные",
      "lowercase": "крекеры молочные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 141,
      "_id": 144,
      "name": "Крекеры пшеничные",
      "lowercase": "крекеры пшеничные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 142,
      "_id": 145,
      "name": "Крекеры с отрубями",
      "lowercase": "крекеры с отрубями",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 143,
      "_id": 146,
      "name": "Круассаны сливочные",
      "lowercase": "круассаны сливочные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 144,
      "_id": 147,
      "name": "Круассаны сырные",
      "lowercase": "круассаны сырные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 145,
      "_id": 148,
      "name": "Круассаны яблочные",
      "lowercase": "круассаны яблочные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 146,
      "_id": 149,
      "name": "Оладьи из тыквы",
      "lowercase": "оладьи из тыквы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 147,
      "_id": 150,
      "name": "Печенье овсяное",
      "lowercase": "печенье овсяное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 148,
      "_id": 151,
      "name": "Печенье сахарное",
      "lowercase": "печенье сахарное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 149,
      "_id": 152,
      "name": "Печенье сдобное",
      "lowercase": "печенье сдобное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 150,
      "_id": 153,
      "name": "Пирожки картофельные с морковью",
      "lowercase": "пирожки картофельные с морковью",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 151,
      "_id": 154,
      "name": "Пирожки жареные, с капустой",
      "lowercase": "пирожки жареные, с капустой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 152,
      "_id": 155,
      "name": "Пирожное с кремовой начинкой",
      "lowercase": "пирожное с кремовой начинкой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 153,
      "_id": 156,
      "name": "Пряники заварные",
      "lowercase": "пряники заварные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 154,
      "_id": 157,
      "name": "Рожки к чаю",
      "lowercase": "рожки к чаю",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 155,
      "_id": 158,
      "name": "Сдоба выборгская с маком",
      "lowercase": "сдоба выборгская с маком",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 156,
      "_id": 159,
      "name": "Сдоба обыкновенная",
      "lowercase": "сдоба обыкновенная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 157,
      "_id": 160,
      "name": "Соломка сладкая",
      "lowercase": "соломка сладкая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 158,
      "_id": 161,
      "name": "Сушки",
      "lowercase": "сушки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 159,
      "_id": 162,
      "name": "Хлеб формовой из обойной муки",
      "lowercase": "хлеб формовой из обойной муки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 160,
      "_id": 163,
      "name": "Хлеб белый, малокалорийный",
      "lowercase": "хлеб белый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 161,
      "_id": 164,
      "name": "Хлеб Бородинский",
      "lowercase": "хлеб бородинский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 162,
      "_id": 165,
      "name": "Хлеб Зерновой",
      "lowercase": "хлеб зерновой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 163,
      "_id": 166,
      "name": "Хлеб из грубой ржаной муки",
      "lowercase": "хлеб ржаной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 164,
      "_id": 167,
      "name": "Хлеб из овсяной муки",
      "lowercase": "хлеб овсяной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 165,
      "_id": 168,
      "name": "Хлеб овсяный, малокалорийный",
      "lowercase": "хлеб овсяный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 166,
      "_id": 169,
      "name": "Хлеб паляница",
      "lowercase": "хлеб паляница",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 167,
      "_id": 170,
      "name": "Хлеб подовый (из муки 2 сорта)",
      "lowercase": "хлеб подовый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 168,
      "_id": 171,
      "name": "Хлеб подовый (из обойной муки)",
      "lowercase": "хлеб подовый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 169,
      "_id": 172,
      "name": "Хлеб пшеничный",
      "lowercase": "хлеб пшеничный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 170,
      "_id": 173,
      "name": "Хлеб пшеничный, малокалорийный",
      "lowercase": "хлеб пшеничный, малокалорийный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 171,
      "_id": 174,
      "name": "Хлеб пшеничный, подовый",
      "lowercase": "хлеб пшеничный, подовый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 172,
      "_id": 175,
      "name": "Хлеб пшеничный из муки высшего сорта",
      "lowercase": "хлеб пшеничный из муки высшего сорта",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 173,
      "_id": 176,
      "name": "Хлеб ржаной",
      "lowercase": "хлеб ржаной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 174,
      "_id": 177,
      "name": "Хлеб ржаной, малокалорийный",
      "lowercase": "хлеб ржаной, малокалорийный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 175,
      "_id": 178,
      "name": "Хлеб Рижский",
      "lowercase": "хлеб рижский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 176,
      "_id": 179,
      "name": "Хлеб с овсяными отрубями",
      "lowercase": "хлеб с овсяными отрубями",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 177,
      "_id": 180,
      "name": "Хлеб Соловецкий",
      "lowercase": "хлеб соловецкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 178,
      "_id": 181,
      "name": "Хлебцы докторские",
      "lowercase": "хлебцы докторские",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 179,
      "_id": 182,
      "name": "Батон нарезной",
      "lowercase": "батон нарезной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 180,
      "_id": 183,
      "name": "Хлеб диетический белково-отрубный",
      "lowercase": "хлеб диетический белково-отрубный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 181,
      "_id": 184,
      "name": "Меланж",
      "lowercase": "меланж",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 182,
      "_id": 185,
      "name": "Сухой белок",
      "lowercase": "сухой белок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 183,
      "_id": 186,
      "name": "Яйцо куриное, белок",
      "lowercase": "яйцо куриное, белок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 184,
      "_id": 187,
      "name": "Желток сухой",
      "lowercase": "желток сухой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 185,
      "_id": 188,
      "name": "Яйцо куриное, желток",
      "lowercase": "яйцо куриное, желток",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 186,
      "_id": 189,
      "name": "Омлет из яичного порошка",
      "lowercase": "омлет из яичного порошка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 187,
      "_id": 190,
      "name": "Яичница глазунья",
      "lowercase": "яичница глазунья",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 188,
      "_id": 191,
      "name": "Яичный порошок",
      "lowercase": "яичный порошок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 189,
      "_id": 192,
      "name": "Яйцо куриное отварное",
      "lowercase": "яйцо куриное отварное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 190,
      "_id": 193,
      "name": "Яйцо куриное, целое",
      "lowercase": "яйцо куриное, целое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 191,
      "_id": 194,
      "name": "Яйцо перепелиное, целое",
      "lowercase": "яйцо перепелиное, целое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 192,
      "_id": 195,
      "name": "Яйцо утиное, цельное",
      "lowercase": "яйцо утиное, цельное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 193,
      "_id": 196,
      "name": "Яйцо под майонезом",
      "lowercase": "яйцо под майонезом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 194,
      "_id": 197,
      "name": "Ацидофилин нежирный",
      "lowercase": "ацидофилин нежирный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 195,
      "_id": 198,
      "name": "Ацидофилин, 1%",
      "lowercase": "ацидофилин, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 196,
      "_id": 199,
      "name": "Ацидофилин, 3.2%",
      "lowercase": "ацидофилин, 3.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 197,
      "_id": 200,
      "name": "Ацидофилин сладкий, 3.2%",
      "lowercase": "ацидофилин сладкий, 3.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 198,
      "_id": 201,
      "name": "Варенец, 2.5%",
      "lowercase": "варенец, 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 199,
      "_id": 202,
      "name": "Йогурт, 1.5%",
      "lowercase": "йогурт, 1.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 200,
      "_id": 203,
      "name": "Йогурт, 3.2%",
      "lowercase": "йогурт, 3.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 201,
      "_id": 204,
      "name": "Йогурт, 6.0%",
      "lowercase": "йогурт, 6.0%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 202,
      "_id": 205,
      "name": "Йогурт ванильный, 1.25%",
      "lowercase": "йогурт ванильный, 1.25%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 203,
      "_id": 206,
      "name": "Йогурт плодово-ягодный, 1.5%",
      "lowercase": "йогурт плодово-ягодный, 1.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 204,
      "_id": 207,
      "name": "Йогурт с ванильным вкусом, 0.2%",
      "lowercase": "йогурт с ванильным вкусом, 0.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 205,
      "_id": 208,
      "name": "Йогурт с лимонным вкусом, 0.2%",
      "lowercase": "йогурт с лимонным вкусом, 0.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 206,
      "_id": 209,
      "name": "Йогурт сладкий, 3.2%",
      "lowercase": "йогурт сладкий, 3.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 207,
      "_id": 210,
      "name": "Йогурт сладкий, 6.0%",
      "lowercase": "йогурт сладкий, 6.0%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 208,
      "_id": 211,
      "name": "Йогурт фруктовый, 1.4%",
      "lowercase": "йогурт фруктовый, 1.4%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 209,
      "_id": 212,
      "name": "Йогурт шоколадный из обезжиренного молока",
      "lowercase": "йогурт шоколадный из обезжиренного молока",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 210,
      "_id": 213,
      "name": "Кефир, 1%",
      "lowercase": "кефир, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 211,
      "_id": 214,
      "name": "Кефир, 2.5%",
      "lowercase": "кефир, 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 212,
      "_id": 215,
      "name": "Кефир, 3.2%",
      "lowercase": "кефир, 3.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 213,
      "_id": 216,
      "name": "Кефир нежирный, 0.05%",
      "lowercase": "кефир нежирный, 0.05%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 214,
      "_id": 217,
      "name": "Крем творожный с ванилином, 5%",
      "lowercase": "крем творожный с ванилином, 5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 215,
      "_id": 218,
      "name": "Кумыс из кобыльего молока, 1%",
      "lowercase": "кумыс из кобыльего молока, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 216,
      "_id": 219,
      "name": "Кумыс из коровьего молока, 0.05%",
      "lowercase": "кумыс из коровьего молока, 0.05%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 217,
      "_id": 220,
      "name": "Лапшевник с творогом",
      "lowercase": "лапшевник с творогом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 218,
      "_id": 221,
      "name": "Масло сливочное без соли, 81%",
      "lowercase": "масло сливочное без соли, 81%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 219,
      "_id": 222,
      "name": "Масло сливочное соленое, 81%",
      "lowercase": "масло сливочное соленое, 81%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 220,
      "_id": 223,
      "name": "Масло сухое, обезвоженное, 100%",
      "lowercase": "масло сухое, обезвоженное, 100%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 221,
      "_id": 224,
      "name": "Масса творожная «Московская», с ванилином",
      "lowercase": "масса творожная «московская», с ванилином",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 222,
      "_id": 225,
      "name": "Масса творожная «Особая», с изюмом",
      "lowercase": "масса творожная «особая», с изюмом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 223,
      "_id": 226,
      "name": "Молоко сгущенное с сахаром «Дружба»",
      "lowercase": "молоко сгущенное с сахаром «дружба»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 224,
      "_id": 227,
      "name": "Молоко «Можайское» стерилизованное, 3%",
      "lowercase": "молоко «можайское» стерилизованное, 3%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 225,
      "_id": 228,
      "name": "Молоко сгущенное «Славянское», 0.2%",
      "lowercase": "молоко сгущенное «славянское», 0.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 226,
      "_id": 229,
      "name": "Молоко белковое",
      "lowercase": "молоко белковое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 227,
      "_id": 230,
      "name": "Молоко буйволиное",
      "lowercase": "молоко буйволиное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 228,
      "_id": 231,
      "name": "Молоко верблюжье",
      "lowercase": "молоко верблюжье",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 229,
      "_id": 232,
      "name": "Молоко кобылье",
      "lowercase": "молоко кобылье",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 230,
      "_id": 233,
      "name": "Молоко козье, 4.2%",
      "lowercase": "молоко козье, 4.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 231,
      "_id": 234,
      "name": "Молоко сгущенное с сахаром, 9%",
      "lowercase": "молоко сгущенное с сахаром, 9%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 232,
      "_id": 235,
      "name": "Молоко коровье, 3.6%",
      "lowercase": "молоко коровье, 3.6%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 233,
      "_id": 236,
      "name": "Молоко овечье, 7.7%",
      "lowercase": "молоко овечье, 7.7%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 234,
      "_id": 237,
      "name": "Молоко пастеризованное, 0.05%",
      "lowercase": "молоко пастеризованное, 0.05%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 235,
      "_id": 238,
      "name": "Молоко пастеризованное, 1.5%",
      "lowercase": "молоко пастеризованное, 1.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 236,
      "_id": 239,
      "name": "Молоко пастеризованное, 2.5%",
      "lowercase": "молоко пастеризованное, 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 237,
      "_id": 240,
      "name": "Молоко пастеризованное, 3.5%",
      "lowercase": "молоко пастеризованное, 3.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 238,
      "_id": 241,
      "name": "Молоко питьевое, 1%",
      "lowercase": "молоко питьевое, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 239,
      "_id": 242,
      "name": "Молоко питьевое, обезжиренное",
      "lowercase": "молоко питьевое, обезжиренное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 240,
      "_id": 243,
      "name": "Молоко сгущенное с сахаром, 5%",
      "lowercase": "молоко сгущенное с сахаром, 5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 241,
      "_id": 244,
      "name": "Молоко сгущенное с сахаром, 8.5%",
      "lowercase": "молоко сгущенное с сахаром, 8.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 242,
      "_id": 245,
      "name": "Молоко сгущенное стерилизованное, 7.8%",
      "lowercase": "молоко сгущенное стерилизованное, 7.8%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 243,
      "_id": 246,
      "name": "Молоко сгущенное стерилизованное, 0.2%",
      "lowercase": "молоко сгущенное стерилизованное, 0.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 244,
      "_id": 247,
      "name": "Молоко стерилизованное, 3.5%",
      "lowercase": "молоко стерилизованное, 3.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 245,
      "_id": 248,
      "name": "Молоко стерилизованное, 1.5%",
      "lowercase": "молоко стерилизованное, 1.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 246,
      "_id": 249,
      "name": "Молоко стерилизованное, 2.5%",
      "lowercase": "молоко стерилизованное, 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 247,
      "_id": 250,
      "name": "Молоко стерилизованное, 3.2%",
      "lowercase": "молоко стерилизованное, 3.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 248,
      "_id": 251,
      "name": "Молоко сухое, 1%",
      "lowercase": "молоко сухое, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 249,
      "_id": 252,
      "name": "Молоко сухое цельное, 25%",
      "lowercase": "молоко сухое цельное, 25%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 250,
      "_id": 253,
      "name": "Молоко сухое цельное, 27%",
      "lowercase": "молоко сухое цельное, 27%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 251,
      "_id": 254,
      "name": "Молоко топленое нежирное, 0.05%",
      "lowercase": "молоко топленое нежирное, 0.05%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 252,
      "_id": 255,
      "name": "Молоко топленое, 1%",
      "lowercase": "молоко топленое, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 253,
      "_id": 256,
      "name": "Молоко топленое, 4%",
      "lowercase": "молоко топленое, 4%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 254,
      "_id": 257,
      "name": "Молоко цельное, 3.25%",
      "lowercase": "молоко цельное, 3.25%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 255,
      "_id": 258,
      "name": "Молочная сыворотка, 0.1%",
      "lowercase": "молочная сыворотка, 0.1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 256,
      "_id": 259,
      "name": "Мороженое «Крем-брюле»",
      "lowercase": "мороженое «крем-брюле»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 257,
      "_id": 260,
      "name": "Мороженое «Молочное»",
      "lowercase": "мороженое «молочное»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 258,
      "_id": 261,
      "name": "Мороженое молочное в шоколадной глазури",
      "lowercase": "мороженое молочное в шоколадной глазури",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 259,
      "_id": 262,
      "name": "Мороженое молочное с плодами и ягодами",
      "lowercase": "мороженое молочное с плодами и ягодами",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 260,
      "_id": 263,
      "name": "Мороженое молочное, шоколадное",
      "lowercase": "мороженое молочное, шоколадное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 261,
      "_id": 264,
      "name": "Пломбир",
      "lowercase": "пломбир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 262,
      "_id": 265,
      "name": "Пломбир в шоколадной глазури",
      "lowercase": "пломбир в шоколадной глазури",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 263,
      "_id": 266,
      "name": "Крем-брюле, пломбир",
      "lowercase": "крем-брюле",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 264,
      "_id": 267,
      "name": "Пломбир с плодами и ягодами",
      "lowercase": "пломбир с плодами и ягодами",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 265,
      "_id": 268,
      "name": "Пломбир шоколадный",
      "lowercase": "пломбир шоколадный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 266,
      "_id": 269,
      "name": "Мороженое сливочное",
      "lowercase": "мороженое сливочное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 267,
      "_id": 270,
      "name": "Мороженое сливочное в шоколадной глазури",
      "lowercase": "мороженое сливочное в шоколадной глазури",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 268,
      "_id": 271,
      "name": "Крем-брюле, сливочное мороженое",
      "lowercase": "крем-брюле сливочное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 269,
      "_id": 272,
      "name": "Мороженое сливочное с плодами и ягодами",
      "lowercase": "мороженое сливочное с плодами и ягодами",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 270,
      "_id": 273,
      "name": "Мороженое сливочное, шоколадное",
      "lowercase": "мороженое сливочное, шоколадное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 271,
      "_id": 274,
      "name": "Бифидин, напиток кисломолочный",
      "lowercase": "бифидин, напиток кисломолочный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 272,
      "_id": 275,
      "name": "Напиток «Снежок»",
      "lowercase": "напиток «снежок»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 273,
      "_id": 276,
      "name": "Напиток «Снежок», плодово-ягодный",
      "lowercase": "напиток «снежок», плодово-ягодный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 274,
      "_id": 277,
      "name": "Напиток молочный «Юбилейный», 1%",
      "lowercase": "напиток молочный «юбилейный», 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 275,
      "_id": 278,
      "name": "Напиток молочный «Юбилейный», 2.5%",
      "lowercase": "напиток молочный «юбилейный», 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 276,
      "_id": 279,
      "name": "Паста ацидофильная",
      "lowercase": "паста ацидофильная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 277,
      "_id": 280,
      "name": "Паста ацидофильная, сладкая",
      "lowercase": "паста ацидофильная, сладкая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 278,
      "_id": 281,
      "name": "Паста молочная белковая, 0.2%",
      "lowercase": "паста молочная белковая, 0.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 279,
      "_id": 282,
      "name": "Пахта «Идеал» пастеризованная",
      "lowercase": "пахта «идеал» пастеризованная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 280,
      "_id": 283,
      "name": "Продукт кисломолочный «Тонус», 2.5%",
      "lowercase": "продукт кисломолочный «тонус», 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 281,
      "_id": 284,
      "name": "Простокваша, 1%",
      "lowercase": "простокваша, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 282,
      "_id": 285,
      "name": "Простокваша, 2.5%",
      "lowercase": "простокваша, 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 283,
      "_id": 286,
      "name": "Простокваша, 3.2%",
      "lowercase": "простокваша, 3.2%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 284,
      "_id": 287,
      "name": "Простокваша нежирная, 0.05%",
      "lowercase": "простокваша нежирная, 0.05%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 285,
      "_id": 288,
      "name": "Ряженка, 1%",
      "lowercase": "ряженка, 1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 286,
      "_id": 289,
      "name": "Ряженка, 2.5%",
      "lowercase": "ряженка, 2.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 287,
      "_id": 290,
      "name": "Ряженка, 4%",
      "lowercase": "ряженка, 4%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 288,
      "_id": 291,
      "name": "Ряженка, 6%",
      "lowercase": "ряженка, 6%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 289,
      "_id": 292,
      "name": "Сливки взбитые, под давлением, 22%",
      "lowercase": "сливки взбитые, под давлением, 22%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 290,
      "_id": 293,
      "name": "Сливки пастеризованные, 10%",
      "lowercase": "сливки пастеризованные, 10%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 291,
      "_id": 294,
      "name": "Сливки пастеризованные, 20%",
      "lowercase": "сливки пастеризованные, 20%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 292,
      "_id": 295,
      "name": "Сливки пастеризованные, 35%",
      "lowercase": "сливки пастеризованные, 35%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 293,
      "_id": 296,
      "name": "Сливки пастеризованные, 8%",
      "lowercase": "сливки пастеризованные, 8%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 294,
      "_id": 297,
      "name": "Сливки питьевые, взбитые, 31%",
      "lowercase": "сливки питьевые, взбитые, 31%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 295,
      "_id": 298,
      "name": "Сливки питьевые, взбитые, 37%",
      "lowercase": "сливки питьевые, взбитые, 37%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 296,
      "_id": 299,
      "name": "Сливки питьевые, 11%",
      "lowercase": "сливки питьевые, 11%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 297,
      "_id": 300,
      "name": "Сливки питьевые обезжиренные, 1.4%",
      "lowercase": "сливки питьевые обезжиренные, 1.4%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 298,
      "_id": 301,
      "name": "Сливки питьевые столовые, 19%",
      "lowercase": "сливки питьевые столовые, 19%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 299,
      "_id": 302,
      "name": "Сливки сгущенные с сахаром, 19%",
      "lowercase": "сливки сгущенные с сахаром, 19%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 300,
      "_id": 303,
      "name": "Сливки стерилизованные, 10%",
      "lowercase": "сливки стерилизованные, 10%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 301,
      "_id": 304,
      "name": "Сливки стерилизованные, 25%",
      "lowercase": "сливки стерилизованные, 25%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 302,
      "_id": 305,
      "name": "Сливки сухие, 42.7%",
      "lowercase": "сливки сухие, 42.7%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 303,
      "_id": 306,
      "name": "Сметана «Домашняя»",
      "lowercase": "сметана «домашняя»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 304,
      "_id": 307,
      "name": "Сметана, 10%",
      "lowercase": "сметана, 10%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 305,
      "_id": 308,
      "name": "Сметана, 15%",
      "lowercase": "сметана, 15%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 306,
      "_id": 309,
      "name": "Сметана, 20%",
      "lowercase": "сметана, 20%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 307,
      "_id": 310,
      "name": "Сметана, 25%",
      "lowercase": "сметана, 25%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 308,
      "_id": 311,
      "name": "Сметана, 30%",
      "lowercase": "сметана, 30%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 309,
      "_id": 312,
      "name": "Сметана культивированная, 20%",
      "lowercase": "сметана культивированная, 20%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 310,
      "_id": 313,
      "name": "Сметана культивированная, 12%",
      "lowercase": "сметана культивированная, 12%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 311,
      "_id": 314,
      "name": "Сметана обезжиренная",
      "lowercase": "сметана обезжиренная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 312,
      "_id": 315,
      "name": "Сыр козий",
      "lowercase": "сыр козий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 313,
      "_id": 316,
      "name": "Сыр фондю",
      "lowercase": "сыр фондю",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 314,
      "_id": 317,
      "name": "Сыр «Адыгейский» мягкий",
      "lowercase": "сыр «адыгейский» мягкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 315,
      "_id": 318,
      "name": "Сыр «Бийский», твердый",
      "lowercase": "сыр «бийский», твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 316,
      "_id": 319,
      "name": "Сыр бри, мягкий",
      "lowercase": "сыр бри, мягкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 317,
      "_id": 320,
      "name": "Сыр брик",
      "lowercase": "сыр брик",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 318,
      "_id": 321,
      "name": "Сыр гауда",
      "lowercase": "сыр гауда",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 319,
      "_id": 322,
      "name": "Сыр гейтост",
      "lowercase": "сыр гейтост",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 320,
      "_id": 323,
      "name": "Сыр «Голландский», брусковый",
      "lowercase": "сыр «голландский», брусковый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 321,
      "_id": 324,
      "name": "Сыр «Голландский», круглый",
      "lowercase": "сыр «голландский», круглый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 322,
      "_id": 325,
      "name": "Сыр голубой",
      "lowercase": "сыр голубой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 323,
      "_id": 326,
      "name": "Сыр грюйер",
      "lowercase": "сыр грюйер",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 324,
      "_id": 327,
      "name": "Сыр домашний, 4%",
      "lowercase": "сыр домашний, 4%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 325,
      "_id": 328,
      "name": "Сыр домашний нежирный, 0.6%",
      "lowercase": "сыр домашний нежирный, 0.6%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 326,
      "_id": 329,
      "name": "Сыр «Золушка» плавленный",
      "lowercase": "сыр «золушка» плавленный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 327,
      "_id": 330,
      "name": "Сыр камамбер, 24%",
      "lowercase": "сыр камамбер, 24%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 328,
      "_id": 331,
      "name": "Сыр козий полутвердый, 30%",
      "lowercase": "сыр козий полутвердый, 30%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 329,
      "_id": 332,
      "name": "Сыр козий твердый",
      "lowercase": "сыр козий твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 330,
      "_id": 333,
      "name": "Сыр «Колбасный», плавленный",
      "lowercase": "сыр «колбасный», плавленный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 331,
      "_id": 334,
      "name": "Сыр «Колби»",
      "lowercase": "сыр «колби»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 332,
      "_id": 335,
      "name": "Сыр «Костромской» твердый, 26.1%",
      "lowercase": "сыр «костромской» твердый, 26.1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 333,
      "_id": 336,
      "name": "Сыр «Латвийский» твердый",
      "lowercase": "сыр «латвийский» твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 334,
      "_id": 337,
      "name": "Сыр лимбургер",
      "lowercase": "сыр лимбургер",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 335,
      "_id": 338,
      "name": "Сыр чеддер маложирный",
      "lowercase": "сыр чеддер маложирный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 336,
      "_id": 339,
      "name": "Сыр «Медовый» плавленный",
      "lowercase": "сыр «медовый» плавленный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 337,
      "_id": 340,
      "name": "Сыр мексиканский кесо чихуахуа, 30%",
      "lowercase": "сыр мексиканский кесо чихуахуа, 30%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 338,
      "_id": 341,
      "name": "Сыр мексиканский с наполнителем, 19%",
      "lowercase": "сыр мексиканский с наполнителем, 19%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 339,
      "_id": 342,
      "name": "Сыр монтерей, 30%",
      "lowercase": "сыр монтерей, 30%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 340,
      "_id": 343,
      "name": "Сыр монтерей маложирный",
      "lowercase": "сыр монтерей маложирный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 341,
      "_id": 344,
      "name": "Сыр моцарелла, 16%",
      "lowercase": "сыр моцарелла, 16%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 342,
      "_id": 345,
      "name": "Сыр моцарелла, 20%",
      "lowercase": "сыр моцарелла, 20%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 343,
      "_id": 346,
      "name": "Сыр моцарелла из цельного молока, 22%",
      "lowercase": "сыр моцарелла из цельного молока, 22%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 344,
      "_id": 347,
      "name": "Сыр моцарелла из цельного молока, 25%",
      "lowercase": "сыр моцарелла из цельного молока, 25%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 345,
      "_id": 348,
      "name": "Сыр моцарелла, обезжиренный",
      "lowercase": "сыр моцарелла, обезжиренный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 346,
      "_id": 349,
      "name": "Сыр «Мюнстер»",
      "lowercase": "сыр «мюнстер»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 347,
      "_id": 350,
      "name": "Сыр «Мюнстер», маложирный",
      "lowercase": "сыр «мюнстер», маложирный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 348,
      "_id": 351,
      "name": "Сыр «Мятный» плавленный, 19.1%",
      "lowercase": "сыр «мятный» плавленный, 19.1%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 349,
      "_id": 352,
      "name": "Сыр невшатель, полумягкий",
      "lowercase": "сыр невшатель, полумягкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 350,
      "_id": 353,
      "name": "Сыр пармезан, 27%",
      "lowercase": "сыр пармезан, 27%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 351,
      "_id": 354,
      "name": "Сыр пармезан сухой тертый, 20%",
      "lowercase": "сыр пармезан сухой тертый, 20%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 352,
      "_id": 355,
      "name": "Сыр пармезан твердый, 26%",
      "lowercase": "сыр пармезан твердый, 26%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 353,
      "_id": 356,
      "name": "Сыр пармезан тертый, 29%",
      "lowercase": "сыр пармезан тертый, 29%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 354,
      "_id": 357,
      "name": "Сыр «Порт Де Салют»",
      "lowercase": "сыр «порт де салют»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 355,
      "_id": 358,
      "name": "Сыр «Пошехонский», твердый",
      "lowercase": "сыр «пошехонский», твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 356,
      "_id": 359,
      "name": "Сыр «Прибалтийский» полутвердый",
      "lowercase": "сыр «прибалтийский» полутвердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 357,
      "_id": 360,
      "name": "Сыр проволоне, 27%",
      "lowercase": "сыр проволоне, 27%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 358,
      "_id": 361,
      "name": "Сыр проволоне, 18%",
      "lowercase": "сыр проволоне, 18%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 359,
      "_id": 362,
      "name": "Сыр рикотта, 8%",
      "lowercase": "сыр рикотта, 8%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 360,
      "_id": 363,
      "name": "Сыр рикотта из цельного молока, 13%",
      "lowercase": "сыр рикотта из цельного молока, 13%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 361,
      "_id": 364,
      "name": "Сыр «Рокфор»",
      "lowercase": "сыр «рокфор»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 362,
      "_id": 365,
      "name": "Сыр «Рокфор» мягкий",
      "lowercase": "сыр «рокфор» мягкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 363,
      "_id": 366,
      "name": "Сыр «Романо» из овечьего молока",
      "lowercase": "сыр «романо» из овечьего молока",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 364,
      "_id": 367,
      "name": "Сыр «Российский» плавленный",
      "lowercase": "сыр «российский» плавленный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 365,
      "_id": 368,
      "name": "Сыр «Российский» твердый",
      "lowercase": "сыр «российский» твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 366,
      "_id": 369,
      "name": "Сыр «Русский камамбер» мягкий",
      "lowercase": "сыр «русский камамбер» мягкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 367,
      "_id": 370,
      "name": "Сыр с тмином",
      "lowercase": "сыр с тмином",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 368,
      "_id": 371,
      "name": "Сыр «Сказка» плавленный",
      "lowercase": "сыр «сказка» плавленный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 369,
      "_id": 372,
      "name": "Сыр «Сластена» плавленный",
      "lowercase": "сыр «сластена» плавленный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 370,
      "_id": 373,
      "name": "Сыр сливочный",
      "lowercase": "сыр сливочный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 371,
      "_id": 374,
      "name": "Сыр сливочный, маложирный",
      "lowercase": "сыр сливочный, маложирный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 372,
      "_id": 375,
      "name": "Сыр сливочный обезжиренный",
      "lowercase": "сыр сливочный обезжиренный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 373,
      "_id": 376,
      "name": "Сыр «Советский» твердый",
      "lowercase": "сыр «советский» твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 374,
      "_id": 377,
      "name": "Сыр «Сулугуни»",
      "lowercase": "сыр «сулугуни»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 375,
      "_id": 378,
      "name": "Сыр «Сусанинский» твердый",
      "lowercase": "сыр «сусанинский» твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 376,
      "_id": 379,
      "name": "Сыр тильзит",
      "lowercase": "сыр тильзит",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 377,
      "_id": 380,
      "name": "Сыр «Угличский» твердый",
      "lowercase": "сыр «угличский» твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 378,
      "_id": 381,
      "name": "Сыр фета",
      "lowercase": "сыр фета",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 379,
      "_id": 382,
      "name": "Сыр фонтина",
      "lowercase": "сыр фонтина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 380,
      "_id": 383,
      "name": "Сыр «Чеддер»",
      "lowercase": "сыр «чеддер»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 381,
      "_id": 384,
      "name": "Сыр швейцарский",
      "lowercase": "сыр швейцарский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 382,
      "_id": 385,
      "name": "Сыр швейцарский маложирный",
      "lowercase": "сыр швейцарский маложирный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 383,
      "_id": 386,
      "name": "Сыр швейцарский твердый",
      "lowercase": "сыр швейцарский твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 384,
      "_id": 387,
      "name": "Сыр «Эдам»",
      "lowercase": "сыр «эдам»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 385,
      "_id": 388,
      "name": "Сыр «Эмментальский»",
      "lowercase": "сыр «эмментальский»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 386,
      "_id": 389,
      "name": "Сыр «Ярославский» твердый",
      "lowercase": "сыр «ярославский» твердый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 387,
      "_id": 390,
      "name": "Сырки творожные детские",
      "lowercase": "сырки творожные детские",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 388,
      "_id": 391,
      "name": "Сырки глазированные с ванилином",
      "lowercase": "сырки глазированные с ванилином",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 389,
      "_id": 392,
      "name": "Масса творожная сладкая с ванилином",
      "lowercase": "масса творожная сладкая с ванилином",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 390,
      "_id": 393,
      "name": "Творог «Крестьянский»",
      "lowercase": "творог «крестьянский»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 391,
      "_id": 394,
      "name": "Творог «Столовый»",
      "lowercase": "творог «столовый»",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 392,
      "_id": 395,
      "name": "Творог жирный",
      "lowercase": "творог жирный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 393,
      "_id": 396,
      "name": "Творог мягкий диетический, 4%",
      "lowercase": "творог мягкий диетический, 4%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 394,
      "_id": 397,
      "name": "Творог мягкий диетический, 0.6%",
      "lowercase": "творог мягкий диетический, 0.6%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 395,
      "_id": 398,
      "name": "Творог диетический, плодово-ягодный, 0.5%",
      "lowercase": "творог диетический, плодово-ягодный, 0.5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 396,
      "_id": 399,
      "name": "Творог мягкий диетический, 11%",
      "lowercase": "творог мягкий диетический, 11%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 397,
      "_id": 400,
      "name": "Топпинг обезжиренный, 5%",
      "lowercase": "топпинг обезжиренный, 5%",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 398,
      "_id": 401,
      "name": "Жир животный топленый",
      "lowercase": "жир животный топленый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 399,
      "_id": 404,
      "name": "Гусиный жир",
      "lowercase": "гусиный жир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 400,
      "_id": 405,
      "name": "Жир из печени трески",
      "lowercase": "жир из печени трески",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 401,
      "_id": 407,
      "name": "Индюшачий жир",
      "lowercase": "индюшачий жир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 402,
      "_id": 408,
      "name": "Масло «Вологодское» сладко-сливочное",
      "lowercase": "масло «вологодское» сладко-сливочное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 403,
      "_id": 409,
      "name": "Масло «Крестьянское» сливочное, соленое",
      "lowercase": "масло «крестьянское» сливочное, соленое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 404,
      "_id": 411,
      "name": "Голубь, белое мясо без кожи, сырое",
      "lowercase": "голубь, белое мясо без кожи, сырое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 405,
      "_id": 412,
      "name": "Гусь, 1 категории",
      "lowercase": "гусь, 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 406,
      "_id": 413,
      "name": "Гусь, 2 категории",
      "lowercase": "гусь, 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 407,
      "_id": 414,
      "name": "Гусята, 1 категории",
      "lowercase": "гусята, 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 408,
      "_id": 415,
      "name": "Индейка, 1 категории",
      "lowercase": "индейка, 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 409,
      "_id": 416,
      "name": "Индейка, 2 категории",
      "lowercase": "индейка, 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 410,
      "_id": 417,
      "name": "Желудок индейки, сырой",
      "lowercase": "желудок индейки, сырой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 411,
      "_id": 418,
      "name": "Желудок куриный",
      "lowercase": "желудок куриный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 412,
      "_id": 419,
      "name": "Желудок цыпленка",
      "lowercase": "желудок цыпленка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 413,
      "_id": 420,
      "name": "Индейка, белое мясо жаренное",
      "lowercase": "индейка, белое мясо жаренное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 414,
      "_id": 421,
      "name": "Индейка, темное мясо",
      "lowercase": "индейка, темное мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 415,
      "_id": 422,
      "name": "Индейка отварная",
      "lowercase": "индейка отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 416,
      "_id": 423,
      "name": "Курица, 1 категории",
      "lowercase": "курица, 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 417,
      "_id": 424,
      "name": "Курица, 2 категории",
      "lowercase": "курица, 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 418,
      "_id": 425,
      "name": "Курица для жарки, белое мясо",
      "lowercase": "курица для жарки, белое мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 419,
      "_id": 426,
      "name": "Курица для жарки, темное мясо",
      "lowercase": "курица для жарки, темное мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 420,
      "_id": 427,
      "name": "Курица отварная",
      "lowercase": "курица отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 421,
      "_id": 428,
      "name": "Фарш куриный",
      "lowercase": "фарш куриный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 422,
      "_id": 429,
      "name": "Окорочок куриный",
      "lowercase": "окорочок куриный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 423,
      "_id": 430,
      "name": "Перепел",
      "lowercase": "перепел",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 424,
      "_id": 431,
      "name": "Перепел грудки",
      "lowercase": "перепел грудки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 425,
      "_id": 432,
      "name": "Печень гусиная",
      "lowercase": "печень гусиная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 426,
      "_id": 433,
      "name": "Печень индейка",
      "lowercase": "печень индейка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 427,
      "_id": 434,
      "name": "Печень куриная",
      "lowercase": "печень куриная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 428,
      "_id": 435,
      "name": "Печень, утка домашняя",
      "lowercase": "печень, утка домашняя",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 429,
      "_id": 436,
      "name": "Сердечки, индейка",
      "lowercase": "сердечки, индейка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 430,
      "_id": 437,
      "name": "Сердечки, курица",
      "lowercase": "сердечки, курица",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 431,
      "_id": 438,
      "name": "Страус, внешняя часть",
      "lowercase": "страус, внешняя часть",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 432,
      "_id": 439,
      "name": "Страус, внутренняя часть ноги",
      "lowercase": "страус, внутренняя часть ноги",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 433,
      "_id": 440,
      "name": "Страус, вырезка",
      "lowercase": "страус, вырезка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 434,
      "_id": 441,
      "name": "Утка дикая, грудки",
      "lowercase": "утка дикая, грудки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 435,
      "_id": 442,
      "name": "Утка дикая, мясо с кожицей",
      "lowercase": "утка дикая, мясо с кожицей",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 436,
      "_id": 443,
      "name": "Утка домашняя, 1 категории",
      "lowercase": "утка домашняя, 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 437,
      "_id": 444,
      "name": "Утка домашняя, 2 категории",
      "lowercase": "утка домашняя, 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 438,
      "_id": 445,
      "name": "Утка жареная",
      "lowercase": "утка жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 439,
      "_id": 446,
      "name": "Утка отварная",
      "lowercase": "утка отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 440,
      "_id": 447,
      "name": "Фазан, грудки",
      "lowercase": "фазан, грудки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 441,
      "_id": 448,
      "name": "Фазан, ножки",
      "lowercase": "фазан, ножки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 442,
      "_id": 449,
      "name": "Цыплята бройлеры, 1 категории",
      "lowercase": "цыплята бройлеры, 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 443,
      "_id": 450,
      "name": "Цыплята бройлеры, 2 категории",
      "lowercase": "цыплята бройлеры, 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 444,
      "_id": 451,
      "name": "Цыпленок табака",
      "lowercase": "цыпленок табака",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 445,
      "_id": 452,
      "name": "Азу из говядины",
      "lowercase": "азу из говядины",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 446,
      "_id": 453,
      "name": "Антрекот из говядины",
      "lowercase": "антрекот из говядины",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 447,
      "_id": 454,
      "name": "Бефстроганов из говядины",
      "lowercase": "бефстроганов из говядины",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 448,
      "_id": 455,
      "name": "Биточки паровые, говядина",
      "lowercase": "биточки паровые, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 449,
      "_id": 456,
      "name": "Биточки с рисом, говядина",
      "lowercase": "биточки с рисом, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 450,
      "_id": 457,
      "name": "Бифштекс из говядины",
      "lowercase": "бифштекс из говядины",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 451,
      "_id": 458,
      "name": "Бифштекс рубленый, говядина",
      "lowercase": "бифштекс рубленый, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 452,
      "_id": 459,
      "name": "Бифштекс с яйцом, говядина",
      "lowercase": "бифштекс с яйцом, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 453,
      "_id": 460,
      "name": "Говядина жареная",
      "lowercase": "говядина жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 454,
      "_id": 461,
      "name": "Говядина отварная",
      "lowercase": "говядина отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 455,
      "_id": 462,
      "name": "Говядина, солонина",
      "lowercase": "говядина, солонина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 456,
      "_id": 463,
      "name": "Говядина тушеная, консервы",
      "lowercase": "говядина тушеная, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 457,
      "_id": 464,
      "name": "Гуляш говяжий, консервы",
      "lowercase": "гуляш говяжий, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 458,
      "_id": 465,
      "name": "Рубец говяжий, сырой",
      "lowercase": "рубец говяжий, сырой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 459,
      "_id": 466,
      "name": "Консервы «Завтрак туриста», говядина",
      "lowercase": "консервы «завтрак туриста», говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 460,
      "_id": 467,
      "name": "Легкие, говядина, сырые",
      "lowercase": "легкие, говядина, сырые",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 461,
      "_id": 468,
      "name": "Мозги, говядина, сырые",
      "lowercase": "мозги, говядина, сырые",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 462,
      "_id": 469,
      "name": "Говядина, 1 категории",
      "lowercase": "говядина, 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 463,
      "_id": 470,
      "name": "Говядина, 2 категории",
      "lowercase": "говядина, 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 464,
      "_id": 471,
      "name": "Говядина в белом соусе, консервы",
      "lowercase": "говядина в белом соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 465,
      "_id": 472,
      "name": "Мясо духовое, говядина",
      "lowercase": "мясо духовое, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 466,
      "_id": 473,
      "name": "Паштет говяжий, консервы",
      "lowercase": "паштет говяжий, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 467,
      "_id": 474,
      "name": "Паштет из печени, говядина",
      "lowercase": "паштет из печени, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 468,
      "_id": 475,
      "name": "Паштет печеночный говяжий, консервы",
      "lowercase": "паштет печеночный говяжий, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 469,
      "_id": 476,
      "name": "Печень говяжья, сырая",
      "lowercase": "печень говяжья, сырая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 470,
      "_id": 477,
      "name": "Печень говяжья, тушеная",
      "lowercase": "печень говяжья, тушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 471,
      "_id": 478,
      "name": "Почки говядина",
      "lowercase": "почки говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 472,
      "_id": 479,
      "name": "Почки жареные в соусе, говядина",
      "lowercase": "почки жареные в соусе, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 473,
      "_id": 480,
      "name": "Почки говядина, тушеные",
      "lowercase": "почки говядина, тушеные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 474,
      "_id": 481,
      "name": "Стейк, говядина",
      "lowercase": "стейк, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 475,
      "_id": 482,
      "name": "Сало нутряное, говядина",
      "lowercase": "сало нутряное, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 476,
      "_id": 483,
      "name": "Селезенка, говядина",
      "lowercase": "селезенка, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 477,
      "_id": 484,
      "name": "Сердце, говядина",
      "lowercase": "сердце, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 478,
      "_id": 485,
      "name": "Тимус, говядина",
      "lowercase": "тимус, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 479,
      "_id": 486,
      "name": "Язык, говядина",
      "lowercase": "язык, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 480,
      "_id": 487,
      "name": "Язык отварной, говядина",
      "lowercase": "язык отварной, говядина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 481,
      "_id": 488,
      "name": "Мясо, телятина 1 категории",
      "lowercase": "мясо, телятина 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 482,
      "_id": 489,
      "name": "Мясо, телятина 2 категории",
      "lowercase": "мясо, телятина 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 483,
      "_id": 490,
      "name": "Печень, телятина",
      "lowercase": "печень, телятина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 484,
      "_id": 491,
      "name": "Поджелудочная железа, телятина",
      "lowercase": "поджелудочная железа, телятина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 485,
      "_id": 492,
      "name": "Почки, телятина",
      "lowercase": "почки, телятина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 486,
      "_id": 493,
      "name": "Селезенка, телятина",
      "lowercase": "селезенка, телятина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 487,
      "_id": 494,
      "name": "Сердце, телятина",
      "lowercase": "сердце, телятина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 488,
      "_id": 495,
      "name": "Язык, телятина",
      "lowercase": "язык, телятина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 489,
      "_id": 496,
      "name": "Жир нутряной, свинина",
      "lowercase": "жир нутряной, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 490,
      "_id": 497,
      "name": "Вырезка, свинина",
      "lowercase": "вырезка, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 491,
      "_id": 498,
      "name": "Вырезка свинина, только мясо",
      "lowercase": "вырезка свинина, только мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 492,
      "_id": 499,
      "name": "Легкие, свинина",
      "lowercase": "легкие, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 493,
      "_id": 500,
      "name": "Мозги, свинина",
      "lowercase": "мозги, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 494,
      "_id": 501,
      "name": "Мясо, свинина беконная",
      "lowercase": "мясо, свинина беконная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 495,
      "_id": 502,
      "name": "Мясо, свинина жирная",
      "lowercase": "мясо, свинина жирная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 496,
      "_id": 503,
      "name": "Мясо, свинина без жира",
      "lowercase": "мясо, свинина без жира",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 497,
      "_id": 504,
      "name": "Ножки, свинина",
      "lowercase": "ножки, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 498,
      "_id": 505,
      "name": "Печень, свинина",
      "lowercase": "печень, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 499,
      "_id": 506,
      "name": "Потроха, свинина",
      "lowercase": "потроха, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 500,
      "_id": 507,
      "name": "Почки, свинина",
      "lowercase": "почки, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 501,
      "_id": 508,
      "name": "Сало, свинина",
      "lowercase": "сало, свинина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 502,
      "_id": 509,
      "name": "Свинина, отварная",
      "lowercase": "свинина, отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 503,
      "_id": 510,
      "name": "Баранина отварная",
      "lowercase": "баранина отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 504,
      "_id": 511,
      "name": "Баранина, селезенка",
      "lowercase": "баранина, селезенка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 505,
      "_id": 512,
      "name": "Жир, баранина",
      "lowercase": "жир, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 506,
      "_id": 513,
      "name": "Легкие, баранина",
      "lowercase": "легкие, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 507,
      "_id": 514,
      "name": "Мозги, баранина",
      "lowercase": "мозги, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 508,
      "_id": 515,
      "name": "Мясо, баранина 1 категории",
      "lowercase": "мясо, баранина 1 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 509,
      "_id": 516,
      "name": "Мясо, баранина 2 категории",
      "lowercase": "мясо, баранина 2 категории",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 510,
      "_id": 517,
      "name": "Поджелудочная железа, баранина",
      "lowercase": "поджелудочная железа, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 511,
      "_id": 518,
      "name": "Почки, баранина",
      "lowercase": "почки, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 512,
      "_id": 519,
      "name": "Сердце, баранина",
      "lowercase": "сердце, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 513,
      "_id": 520,
      "name": "Язык, баранина",
      "lowercase": "язык, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 514,
      "_id": 521,
      "name": "Язык тушеный, баранина",
      "lowercase": "язык тушеный, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 515,
      "_id": 522,
      "name": "Шницель, баранина",
      "lowercase": "шницель, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 516,
      "_id": 523,
      "name": "Сердце тушеное, баранина",
      "lowercase": "сердце тушеное, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 517,
      "_id": 524,
      "name": "Рагу, баранина",
      "lowercase": "рагу, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 518,
      "_id": 525,
      "name": "Почки тушеные, баранина",
      "lowercase": "почки тушеные, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 519,
      "_id": 526,
      "name": "Поджарка, баранина",
      "lowercase": "поджарка, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 520,
      "_id": 527,
      "name": "Печень тушеная, баранина",
      "lowercase": "печень тушеная, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 521,
      "_id": 528,
      "name": "Котлеты отбивные, баранина",
      "lowercase": "котлеты отбивные, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 522,
      "_id": 529,
      "name": "Завтрак туриста, баранина",
      "lowercase": "завтрак туриста, баранина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 523,
      "_id": 530,
      "name": "Баранина, тушеная",
      "lowercase": "баранина, тушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 524,
      "_id": 531,
      "name": "Баранина, отварная",
      "lowercase": "баранина, отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 525,
      "_id": 532,
      "name": "Баранина, жареная",
      "lowercase": "баранина, жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 526,
      "_id": 533,
      "name": "Акула, мороженая",
      "lowercase": "акула, мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 527,
      "_id": 534,
      "name": "Катран, мороженый",
      "lowercase": "катран, мороженый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 528,
      "_id": 535,
      "name": "Анчоус, атлантический",
      "lowercase": "анчоус, атлантический",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 529,
      "_id": 536,
      "name": "Балык холодного копчения, осетр",
      "lowercase": "балык холодного копчения, осетр",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 530,
      "_id": 537,
      "name": "Берикс, мороженый",
      "lowercase": "берикс, мороженый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 531,
      "_id": 538,
      "name": "Вобла, холодного копчения",
      "lowercase": "вобла, холодного копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 532,
      "_id": 539,
      "name": "Горбуша",
      "lowercase": "горбуша",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 533,
      "_id": 540,
      "name": "Горбуша в томатном соусе, консервы",
      "lowercase": "горбуша в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 534,
      "_id": 541,
      "name": "Горбуша, запеченная",
      "lowercase": "горбуша, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 535,
      "_id": 542,
      "name": "Горбуша, отварная",
      "lowercase": "горбуша, отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 536,
      "_id": 543,
      "name": "Горбуша соленая",
      "lowercase": "горбуша соленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 537,
      "_id": 544,
      "name": "Горбыль волнистый, атлантический",
      "lowercase": "горбыль волнистый, атлантический",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 538,
      "_id": 545,
      "name": "Желтоперка, мороженая",
      "lowercase": "желтоперка, мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 539,
      "_id": 546,
      "name": "Зеленоглазка, мороженая",
      "lowercase": "зеленоглазка, мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 540,
      "_id": 547,
      "name": "Зразы из судака",
      "lowercase": "зразы из судака",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 541,
      "_id": 548,
      "name": "Зубан мороженый",
      "lowercase": "зубан мороженый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 542,
      "_id": 549,
      "name": "Зубатка пятнистая",
      "lowercase": "зубатка пятнистая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 543,
      "_id": 550,
      "name": "Зубатка атлантическая, запеченная",
      "lowercase": "зубатка атлантическая, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 544,
      "_id": 551,
      "name": "Зубатка жареная",
      "lowercase": "зубатка жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 545,
      "_id": 552,
      "name": "Зубатка запеченная в сметанном соусе",
      "lowercase": "зубатка запеченная в сметанном соусе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 546,
      "_id": 553,
      "name": "Зубатка отварная",
      "lowercase": "зубатка отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 547,
      "_id": 554,
      "name": "Икра зернистая, белуга",
      "lowercase": "икра зернистая, белуга",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 548,
      "_id": 555,
      "name": "Икра зернистая, горбуша",
      "lowercase": "икра зернистая, горбуша",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 549,
      "_id": 556,
      "name": "Икра зернистая, кета",
      "lowercase": "икра зернистая, кета",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 550,
      "_id": 557,
      "name": "Икра пробойная, минтай",
      "lowercase": "икра пробойная, минтай",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 551,
      "_id": 558,
      "name": "Икра зернистая, осетр",
      "lowercase": "икра зернистая, осетр",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 552,
      "_id": 559,
      "name": "Икра паюсная, осетр",
      "lowercase": "икра паюсная, осетр",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 553,
      "_id": 560,
      "name": "Икра зернистая, севрюга",
      "lowercase": "икра зернистая, севрюга",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 554,
      "_id": 561,
      "name": "Камбала азово-черноморская, мороженая",
      "lowercase": "камбала азово-черноморская, мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 555,
      "_id": 562,
      "name": "Камбала и камбалообразные, запеченная",
      "lowercase": "камбала и камбалообразные, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 556,
      "_id": 563,
      "name": "Камбала дальневосточная",
      "lowercase": "камбала дальневосточная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 557,
      "_id": 564,
      "name": "Камбала обжаренная в масле, консервы",
      "lowercase": "камбала обжаренная в масле, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 558,
      "_id": 565,
      "name": "Карась",
      "lowercase": "карась",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 559,
      "_id": 566,
      "name": "Карп",
      "lowercase": "карп",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 560,
      "_id": 567,
      "name": "Карп жареный",
      "lowercase": "карп жареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 561,
      "_id": 568,
      "name": "Карп запеченный",
      "lowercase": "карп запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 562,
      "_id": 569,
      "name": "Кета",
      "lowercase": "кета",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 563,
      "_id": 570,
      "name": "Кета запеченная",
      "lowercase": "кета запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 564,
      "_id": 571,
      "name": "Кета соленая",
      "lowercase": "кета соленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 565,
      "_id": 572,
      "name": "Кефаль полосатая",
      "lowercase": "кефаль полосатая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 566,
      "_id": 573,
      "name": "Кефаль полосатая, запеченная",
      "lowercase": "кефаль полосатая, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 567,
      "_id": 574,
      "name": "Килька балтийская, горячего копчения",
      "lowercase": "килька балтийская, горячего копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 568,
      "_id": 575,
      "name": "Килька балтийская, мороженая",
      "lowercase": "килька балтийская, мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 569,
      "_id": 576,
      "name": "Килька балтийская, соленая",
      "lowercase": "килька балтийская, соленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 570,
      "_id": 577,
      "name": "Килька каспийская, мороженая",
      "lowercase": "килька каспийская, мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 571,
      "_id": 578,
      "name": "Китовые мясо",
      "lowercase": "китовые мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 572,
      "_id": 579,
      "name": "Корюшка радужная, запеченная",
      "lowercase": "корюшка радужная, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 573,
      "_id": 580,
      "name": "Корюшка радужная",
      "lowercase": "корюшка радужная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 574,
      "_id": 581,
      "name": "Лемонема, мороженая",
      "lowercase": "лемонема, мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 575,
      "_id": 582,
      "name": "Лещ морской, мороженый",
      "lowercase": "лещ морской, мороженый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 576,
      "_id": 583,
      "name": "Лещ",
      "lowercase": "лещ",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 577,
      "_id": 584,
      "name": "Лещ в томатном соусе, консервы",
      "lowercase": "лещ в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 578,
      "_id": 585,
      "name": "Лещ вяленый",
      "lowercase": "лещ вяленый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 579,
      "_id": 586,
      "name": "Лещ горячего копчения",
      "lowercase": "лещ горячего копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 580,
      "_id": 587,
      "name": "Лещ холодного копчения",
      "lowercase": "лещ холодного копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 581,
      "_id": 588,
      "name": "Лосось атлантический, запеченный",
      "lowercase": "лосось атлантический, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 582,
      "_id": 589,
      "name": "Лосось атлантический",
      "lowercase": "лосось атлантический",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 583,
      "_id": 590,
      "name": "Макрурус малоглазый, мороженный",
      "lowercase": "макрурус малоглазый, мороженный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 584,
      "_id": 591,
      "name": "Макрурус тупорылый, мороженный",
      "lowercase": "макрурус тупорылый, мороженный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 585,
      "_id": 592,
      "name": "Минтай атлантический, запеченный",
      "lowercase": "минтай атлантический, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 586,
      "_id": 593,
      "name": "Минтай атлантический",
      "lowercase": "минтай атлантический",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 587,
      "_id": 594,
      "name": "Мойва, весенняя",
      "lowercase": "мойва, весенняя",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 588,
      "_id": 595,
      "name": "Мойва, осенняя",
      "lowercase": "мойва, осенняя",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 589,
      "_id": 596,
      "name": "Морская щука, запеченная",
      "lowercase": "морская щука, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 590,
      "_id": 597,
      "name": "Морской черт, запеченный",
      "lowercase": "морской черт, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 591,
      "_id": 598,
      "name": "Морской черт",
      "lowercase": "морской черт",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 592,
      "_id": 599,
      "name": "Навага беломорская",
      "lowercase": "навага беломорская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 593,
      "_id": 600,
      "name": "Навага жареная",
      "lowercase": "навага жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 594,
      "_id": 601,
      "name": "Налим, запеченный",
      "lowercase": "налим, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 595,
      "_id": 602,
      "name": "Налим",
      "lowercase": "налим",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 596,
      "_id": 603,
      "name": "Нерка красная",
      "lowercase": "нерка красная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 597,
      "_id": 604,
      "name": "Окунь морской, атлантический запеченный",
      "lowercase": "окунь морской, атлантический запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 598,
      "_id": 605,
      "name": "Окунь морской, атлантический",
      "lowercase": "окунь морской, атлантический",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 599,
      "_id": 606,
      "name": "Окунь морской",
      "lowercase": "окунь морской",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 600,
      "_id": 607,
      "name": "Окунь морской, отварной",
      "lowercase": "окунь морской, отварной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 601,
      "_id": 608,
      "name": "Окунь морской, тихоокеанский, запеченный",
      "lowercase": "окунь морской, тихоокеанский, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 602,
      "_id": 609,
      "name": "Окунь морской, тихоокеанский",
      "lowercase": "окунь морской, тихоокеанский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 603,
      "_id": 610,
      "name": "Окунь полосатый, запеченный",
      "lowercase": "окунь полосатый, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 604,
      "_id": 611,
      "name": "Окунь полосатый",
      "lowercase": "окунь полосатый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 605,
      "_id": 612,
      "name": "Окунь речной, запеченный",
      "lowercase": "окунь речной, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 606,
      "_id": 613,
      "name": "Окунь речной",
      "lowercase": "окунь речной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 607,
      "_id": 614,
      "name": "Окунь горячего копчения",
      "lowercase": "окунь горячего копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 608,
      "_id": 615,
      "name": "Окунь жареный",
      "lowercase": "окунь жареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 609,
      "_id": 616,
      "name": "Осетр в томатном соусе, консервы",
      "lowercase": "осетр в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 610,
      "_id": 617,
      "name": "Осетр каспийский",
      "lowercase": "осетр каспийский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 611,
      "_id": 618,
      "name": "Осетр отварной",
      "lowercase": "осетр отварной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 612,
      "_id": 619,
      "name": "Осетр запеченный",
      "lowercase": "осетр запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 613,
      "_id": 620,
      "name": "Осетр копченый",
      "lowercase": "осетр копченый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 614,
      "_id": 621,
      "name": "Палтус белокорый",
      "lowercase": "палтус белокорый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 615,
      "_id": 622,
      "name": "Палтус запеченный",
      "lowercase": "палтус запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 616,
      "_id": 623,
      "name": "Палтус",
      "lowercase": "палтус",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 617,
      "_id": 624,
      "name": "Палтус гренландский",
      "lowercase": "палтус гренландский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 618,
      "_id": 625,
      "name": "Палтус гренландский, запеченный",
      "lowercase": "палтус гренландский, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 619,
      "_id": 626,
      "name": "Палтус европейский, запеченный",
      "lowercase": "палтус европейский, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 620,
      "_id": 627,
      "name": "Палтус европейский",
      "lowercase": "палтус европейский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 621,
      "_id": 628,
      "name": "Пеламида",
      "lowercase": "пеламида",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 622,
      "_id": 629,
      "name": "Печень трески, консервы",
      "lowercase": "печень трески, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 623,
      "_id": 630,
      "name": "Пикша",
      "lowercase": "пикша",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 624,
      "_id": 631,
      "name": "Пикша запеченная",
      "lowercase": "пикша запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 625,
      "_id": 632,
      "name": "Пикша копченая",
      "lowercase": "пикша копченая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 626,
      "_id": 633,
      "name": "Путассу",
      "lowercase": "путассу",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 627,
      "_id": 634,
      "name": "Рыба-меч запеченный",
      "lowercase": "рыба-меч запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 628,
      "_id": 635,
      "name": "Рыба-меч",
      "lowercase": "рыба-меч",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 629,
      "_id": 636,
      "name": "Сазан в томатном соусе, консервы",
      "lowercase": "сазан в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 630,
      "_id": 637,
      "name": "Салака",
      "lowercase": "салака",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 631,
      "_id": 638,
      "name": "Салака горячего копчения",
      "lowercase": "салака горячего копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 632,
      "_id": 639,
      "name": "Салилота мороженая",
      "lowercase": "салилота мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 633,
      "_id": 640,
      "name": "Сардина атлантическая в масле, консервы",
      "lowercase": "сардина атлантическая в масле, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 634,
      "_id": 641,
      "name": "Сардина мороженая",
      "lowercase": "сардина мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 635,
      "_id": 642,
      "name": "Сардина тихоокеанская в томатном соусе, консервы",
      "lowercase": "сардина тихоокеанская в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 636,
      "_id": 643,
      "name": "Севрюга",
      "lowercase": "севрюга",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 637,
      "_id": 644,
      "name": "Севрюга в томатном соусе, консервы",
      "lowercase": "севрюга в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 638,
      "_id": 645,
      "name": "Сельдь атлантическая, жирная",
      "lowercase": "сельдь атлантическая, жирная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 639,
      "_id": 646,
      "name": "Сельдь атлантическая, запеченная",
      "lowercase": "сельдь атлантическая, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 640,
      "_id": 647,
      "name": "Сельдь атлантическая, копченая",
      "lowercase": "сельдь атлантическая, копченая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 641,
      "_id": 648,
      "name": "Сельдь атлантическая, маринованная",
      "lowercase": "сельдь атлантическая, маринованная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 642,
      "_id": 649,
      "name": "Сельдь атлантическая, нежирная",
      "lowercase": "сельдь атлантическая, нежирная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 643,
      "_id": 650,
      "name": "Сельдь атлантическая, среднесоленая",
      "lowercase": "сельдь атлантическая, среднесоленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 644,
      "_id": 651,
      "name": "Сельдь иваси, специального посола",
      "lowercase": "сельдь иваси, специального посола",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 645,
      "_id": 652,
      "name": "Сельдь рубленая",
      "lowercase": "сельдь рубленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 646,
      "_id": 653,
      "name": "Сельдь с луком",
      "lowercase": "сельдь с луком",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 647,
      "_id": 654,
      "name": "Сельдь тихоакеанская",
      "lowercase": "сельдь тихоакеанская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 648,
      "_id": 655,
      "name": "Сельдь тихоокеанская, жирная",
      "lowercase": "сельдь тихоокеанская, жирная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 649,
      "_id": 656,
      "name": "Сельдь тихоокеанская, запеченная",
      "lowercase": "сельдь тихоокеанская, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 650,
      "_id": 657,
      "name": "Сельдь тихоокеанская, нежирная",
      "lowercase": "сельдь тихоокеанская, нежирная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 651,
      "_id": 658,
      "name": "Сельдь тихоокеанская, среднесоленая",
      "lowercase": "сельдь тихоокеанская, среднесоленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 652,
      "_id": 659,
      "name": "Семга соленая",
      "lowercase": "семга соленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 653,
      "_id": 660,
      "name": "Сиг копченый",
      "lowercase": "сиг копченый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 654,
      "_id": 661,
      "name": "Сиг запеченный",
      "lowercase": "сиг запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 655,
      "_id": 662,
      "name": "Сиг",
      "lowercase": "сиг",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 656,
      "_id": 663,
      "name": "Сквама мороженая",
      "lowercase": "сквама мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 657,
      "_id": 664,
      "name": "Скумбрия атлантическая, запеченная",
      "lowercase": "скумбрия атлантическая, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 658,
      "_id": 665,
      "name": "Скумбрия атлантическая",
      "lowercase": "скумбрия атлантическая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 659,
      "_id": 666,
      "name": "Скумбрия испанская, запеченная",
      "lowercase": "скумбрия испанская, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 660,
      "_id": 667,
      "name": "Скумбрия испанская",
      "lowercase": "скумбрия испанская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 661,
      "_id": 668,
      "name": "Скумбрия королевская, запеченная",
      "lowercase": "скумбрия королевская, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 662,
      "_id": 669,
      "name": "Скумбрия королевская",
      "lowercase": "скумбрия королевская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 663,
      "_id": 670,
      "name": "Скумбрия соленая",
      "lowercase": "скумбрия соленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 664,
      "_id": 671,
      "name": "Скумбрия атлантическая, жирная",
      "lowercase": "скумбрия атлантическая, жирная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 665,
      "_id": 672,
      "name": "Скумбрия дальневосточная",
      "lowercase": "скумбрия дальневосточная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 666,
      "_id": 673,
      "name": "Скумбрия курильская натуральная, консервы",
      "lowercase": "скумбрия курильская натуральная, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 667,
      "_id": 674,
      "name": "Скумбрия в масле, консервы",
      "lowercase": "скумбрия в масле, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 668,
      "_id": 675,
      "name": "Скумбрия натуральная, консервы",
      "lowercase": "скумбрия натуральная, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 669,
      "_id": 676,
      "name": "Скумбрия холодного копчения",
      "lowercase": "скумбрия холодного копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 670,
      "_id": 677,
      "name": "Сом",
      "lowercase": "сом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 671,
      "_id": 678,
      "name": "Сом в томатном соусе, консервы",
      "lowercase": "сом в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 672,
      "_id": 679,
      "name": "Ставрида атлантическая холодного копчения",
      "lowercase": "ставрида атлантическая холодного копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 673,
      "_id": 680,
      "name": "Ставрида",
      "lowercase": "ставрида",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 674,
      "_id": 681,
      "name": "Ставрида жареная",
      "lowercase": "ставрида жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 675,
      "_id": 682,
      "name": "Ставрида отварная",
      "lowercase": "ставрида отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 676,
      "_id": 683,
      "name": "Судак запеченный",
      "lowercase": "судак запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 677,
      "_id": 684,
      "name": "Судак",
      "lowercase": "судак",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 678,
      "_id": 685,
      "name": "Судак в томатном соусе, консервы",
      "lowercase": "судак в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 679,
      "_id": 686,
      "name": "Судак отварной",
      "lowercase": "судак отварной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 680,
      "_id": 687,
      "name": "Терпуг запеченный",
      "lowercase": "терпуг запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 681,
      "_id": 688,
      "name": "Терпуг",
      "lowercase": "терпуг",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 682,
      "_id": 689,
      "name": "Треска",
      "lowercase": "треска",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 683,
      "_id": 690,
      "name": "Треска горячего копчения",
      "lowercase": "треска горячего копчения",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 684,
      "_id": 691,
      "name": "Треска жареная",
      "lowercase": "треска жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 685,
      "_id": 692,
      "name": "Треска запеченная",
      "lowercase": "треска запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 686,
      "_id": 693,
      "name": "Треска копченая в масле, консервы",
      "lowercase": "треска копченая в масле, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 687,
      "_id": 694,
      "name": "Треска отварная",
      "lowercase": "треска отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 688,
      "_id": 695,
      "name": "Треска соленая",
      "lowercase": "треска соленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 689,
      "_id": 696,
      "name": "Треска тушеная",
      "lowercase": "треска тушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 690,
      "_id": 697,
      "name": "Треска тихоокеанская запеченная",
      "lowercase": "треска тихоокеанская запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 691,
      "_id": 698,
      "name": "Треска тихоокеанская",
      "lowercase": "треска тихоокеанская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 692,
      "_id": 699,
      "name": "Тунец желтоперый",
      "lowercase": "тунец желтоперый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 693,
      "_id": 700,
      "name": "Тунец желтоперый, запеченный",
      "lowercase": "тунец желтоперый, запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 694,
      "_id": 701,
      "name": "Тунец полосатый",
      "lowercase": "тунец полосатый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 695,
      "_id": 702,
      "name": "Тунец полосатый запеченный",
      "lowercase": "тунец полосатый запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 696,
      "_id": 703,
      "name": "Тунец",
      "lowercase": "тунец",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 697,
      "_id": 704,
      "name": "Тунец в масле, консервы",
      "lowercase": "тунец в масле, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 698,
      "_id": 705,
      "name": "Тунец натуральный, консервы",
      "lowercase": "тунец натуральный, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 699,
      "_id": 706,
      "name": "Угорь",
      "lowercase": "угорь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 700,
      "_id": 707,
      "name": "Угорь запеченный",
      "lowercase": "угорь запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 701,
      "_id": 708,
      "name": "Форель радужная, запеченная",
      "lowercase": "форель радужная, запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 702,
      "_id": 709,
      "name": "Форель радужная",
      "lowercase": "форель радужная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 703,
      "_id": 710,
      "name": "Форель запеченная",
      "lowercase": "форель запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 704,
      "_id": 711,
      "name": "Форель",
      "lowercase": "форель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 705,
      "_id": 712,
      "name": "Ханос запеченный",
      "lowercase": "ханос запеченный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 706,
      "_id": 713,
      "name": "Ханос",
      "lowercase": "ханос",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 707,
      "_id": 714,
      "name": "Хек припущенный",
      "lowercase": "хек припущенный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 708,
      "_id": 715,
      "name": "Хек серебристый",
      "lowercase": "хек серебристый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 709,
      "_id": 716,
      "name": "Шпроты в масле, консервы",
      "lowercase": "шпроты в масле, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 710,
      "_id": 717,
      "name": "Щука морская",
      "lowercase": "щука морская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 711,
      "_id": 718,
      "name": "Щука",
      "lowercase": "щука",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 712,
      "_id": 719,
      "name": "Щука в томатном соусе, консервы",
      "lowercase": "щука в томатном соусе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 713,
      "_id": 720,
      "name": "Щука отварная",
      "lowercase": "щука отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 714,
      "_id": 721,
      "name": "Кальмар, филе",
      "lowercase": "кальмар, филе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 715,
      "_id": 722,
      "name": "Краб камчатский, мясо",
      "lowercase": "краб камчатский, мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 716,
      "_id": 723,
      "name": "Краб натуральный, консервы",
      "lowercase": "краб натуральный, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 717,
      "_id": 724,
      "name": "Креветка антарктическая, варено-мороженая",
      "lowercase": "креветка антарктическая, варено-мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 718,
      "_id": 725,
      "name": "Креветка антарктическая, консервы",
      "lowercase": "креветка антарктическая, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 719,
      "_id": 726,
      "name": "Креветка антарктическая, варено-мороженая",
      "lowercase": "креветка антарктическая, варено-мороженая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 720,
      "_id": 728,
      "name": "Креветка дальневосточная, мясо",
      "lowercase": "креветка дальневосточная, мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 721,
      "_id": 729,
      "name": "Медуза сушеная, соленая",
      "lowercase": "медуза сушеная, соленая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 722,
      "_id": 730,
      "name": "Мидии",
      "lowercase": "мидии",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 723,
      "_id": 731,
      "name": "Гребешок приготовленный на пару",
      "lowercase": "гребешок приготовленный на пару",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 724,
      "_id": 732,
      "name": "Гребешок жареный в панировке",
      "lowercase": "гребешок жареный в панировке",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 725,
      "_id": 733,
      "name": "Гребешок, имитация из сурими",
      "lowercase": "гребешок, имитация из сурими",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 726,
      "_id": 734,
      "name": "Гребешок",
      "lowercase": "гребешок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 727,
      "_id": 735,
      "name": "Кальмары жареные",
      "lowercase": "кальмары жареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 728,
      "_id": 736,
      "name": "Каракатица вареная",
      "lowercase": "каракатица вареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 729,
      "_id": 737,
      "name": "Каракатица",
      "lowercase": "каракатица",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 730,
      "_id": 738,
      "name": "Мидии голубые вареные",
      "lowercase": "мидии голубые вареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 731,
      "_id": 739,
      "name": "Мидии голубые",
      "lowercase": "мидии голубые",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 732,
      "_id": 740,
      "name": "Морское ушко",
      "lowercase": "морское ушко",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 733,
      "_id": 741,
      "name": "Морское ушко, жареные",
      "lowercase": "морское ушко, жареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 734,
      "_id": 742,
      "name": "Осминог вареный",
      "lowercase": "осминог вареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 735,
      "_id": 743,
      "name": "Осминог",
      "lowercase": "осминог",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 736,
      "_id": 744,
      "name": "Рапана",
      "lowercase": "рапана",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 737,
      "_id": 745,
      "name": "Трубач вареный",
      "lowercase": "трубач вареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 738,
      "_id": 746,
      "name": "Трубач",
      "lowercase": "трубач",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 739,
      "_id": 747,
      "name": "Устрицы восточные, вареные",
      "lowercase": "устрицы восточные, вареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 740,
      "_id": 748,
      "name": "Устрицы восточные запеченные",
      "lowercase": "устрицы восточные запеченные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 741,
      "_id": 749,
      "name": "Устрицы восточные",
      "lowercase": "устрицы восточные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 742,
      "_id": 750,
      "name": "Устрицы восточные, консервированные",
      "lowercase": "устрицы восточные, консервированные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 743,
      "_id": 751,
      "name": "Устрицы тихоокеанские, вареные",
      "lowercase": "устрицы тихоокеанские, вареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 744,
      "_id": 752,
      "name": "Устрицы тихоокеанские",
      "lowercase": "устрицы тихоокеанские",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 745,
      "_id": 753,
      "name": "Лангуст",
      "lowercase": "лангуст",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 746,
      "_id": 754,
      "name": "Омар",
      "lowercase": "омар",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 747,
      "_id": 755,
      "name": "Раки морские, вареные",
      "lowercase": "раки морские, вареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 748,
      "_id": 756,
      "name": "Раки речные",
      "lowercase": "раки речные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 749,
      "_id": 757,
      "name": "Раки речные, вареные",
      "lowercase": "раки речные, вареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 750,
      "_id": 758,
      "name": "Краб голубой, вареный",
      "lowercase": "краб голубой, вареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 751,
      "_id": 759,
      "name": "Краб голубой, консервированный",
      "lowercase": "краб голубой, консервированный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 752,
      "_id": 761,
      "name": "Курага, сушеные абрикосы",
      "lowercase": "курага абрикосы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 753,
      "_id": 762,
      "name": "Абрикосы",
      "lowercase": "абрикосы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 754,
      "_id": 763,
      "name": "Урюк",
      "lowercase": "урюк",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 755,
      "_id": 764,
      "name": "Абрикосы замороженные, подслащенные",
      "lowercase": "абрикосы замороженные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 756,
      "_id": 765,
      "name": "Авокадо",
      "lowercase": "авокадо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 757,
      "_id": 766,
      "name": "Авокадо, Калифорния",
      "lowercase": "авокадо, калифорния",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 758,
      "_id": 767,
      "name": "Авокадо, Флорида",
      "lowercase": "авокадо, флорида",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 759,
      "_id": 768,
      "name": "Айва",
      "lowercase": "айва",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 760,
      "_id": 769,
      "name": "Алыча",
      "lowercase": "алыча",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 761,
      "_id": 770,
      "name": "Ананас",
      "lowercase": "ананас ананасы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 762,
      "_id": 771,
      "name": "Ананас консервированный",
      "lowercase": "ананас консервированный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 763,
      "_id": 772,
      "name": "Ананасы замороженные, подслащенные",
      "lowercase": "ананасы замороженные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 764,
      "_id": 773,
      "name": "Ананасы, экстра сладкие сорта",
      "lowercase": "ананасы, экстра сладкие сорта",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 765,
      "_id": 774,
      "name": "Апельсин",
      "lowercase": "апельсин",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 766,
      "_id": 775,
      "name": "Апельсин Навель",
      "lowercase": "апельсин навель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 767,
      "_id": 776,
      "name": "Апельсин калифорнийский",
      "lowercase": "апельсин калифорнийский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 768,
      "_id": 777,
      "name": "Апельсиновая кожура",
      "lowercase": "апельсиновая кожура",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 769,
      "_id": 778,
      "name": "Арбуз",
      "lowercase": "арбуз",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 770,
      "_id": 779,
      "name": "Банан",
      "lowercase": "банан",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 771,
      "_id": 780,
      "name": "Бананы индийские",
      "lowercase": "бананы индийские",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 772,
      "_id": 781,
      "name": "Бананы обезвоженные",
      "lowercase": "бананы обезвоженные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 773,
      "_id": 782,
      "name": "Брусника",
      "lowercase": "брусника",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 774,
      "_id": 783,
      "name": "Бузина",
      "lowercase": "бузина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 775,
      "_id": 784,
      "name": "Виноград",
      "lowercase": "виноград",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 776,
      "_id": 785,
      "name": "Виноград сушеный, кишмиш",
      "lowercase": "виноград сушеный, кишмиш",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 777,
      "_id": 786,
      "name": "Виноград, американского вида",
      "lowercase": "виноград, американского вида",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 778,
      "_id": 787,
      "name": "Виноград мускатный",
      "lowercase": "виноград мускатный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 779,
      "_id": 788,
      "name": "Вишня",
      "lowercase": "вишня",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 780,
      "_id": 789,
      "name": "Вишня замороженная",
      "lowercase": "вишня замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 781,
      "_id": 790,
      "name": "Голубика",
      "lowercase": "голубика",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 782,
      "_id": 791,
      "name": "Гранат",
      "lowercase": "гранат",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 783,
      "_id": 792,
      "name": "Грейпфрут",
      "lowercase": "грейпфрут",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 784,
      "_id": 793,
      "name": "Грейпфрут с сахаром",
      "lowercase": "грейпфрут с сахаром",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 785,
      "_id": 794,
      "name": "Грейпфрут белый, Флорида",
      "lowercase": "грейпфрут белый, флорида",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 786,
      "_id": 795,
      "name": "Грейпфрут белый, Калифорнийский",
      "lowercase": "грейпфрут белый, калифорнийский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 787,
      "_id": 796,
      "name": "Грейпфрут белый",
      "lowercase": "грейпфрут белый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 788,
      "_id": 797,
      "name": "Грейпфрут розовый или красный",
      "lowercase": "грейпфрут розовый или красный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 789,
      "_id": 798,
      "name": "Грейпфрут розовый или красный, Флориды",
      "lowercase": "грейпфрут розовый или красный, флориды",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 790,
      "_id": 799,
      "name": "Грейпфрут розовый или красный, Калифорнийский",
      "lowercase": "грейпфрут розовый или красный, калифорнийский",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 791,
      "_id": 800,
      "name": "Груша",
      "lowercase": "груша",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 792,
      "_id": 801,
      "name": "Груша сушеная",
      "lowercase": "груша сушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 793,
      "_id": 802,
      "name": "Грушевый нектар консервированный",
      "lowercase": "грушевый нектар консервированный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 794,
      "_id": 804,
      "name": "Гуава",
      "lowercase": "гуава",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 795,
      "_id": 805,
      "name": "Гуава, нектар консервированный",
      "lowercase": "гуава, нектар консервированный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 796,
      "_id": 806,
      "name": "Дыня",
      "lowercase": "дыня дынка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 797,
      "_id": 807,
      "name": "Ежевика",
      "lowercase": "ежевика",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 798,
      "_id": 808,
      "name": "Ежевика замороженная",
      "lowercase": "ежевика замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 799,
      "_id": 809,
      "name": "Земляника садовая",
      "lowercase": "земляника садовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 800,
      "_id": 810,
      "name": "Изюм",
      "lowercase": "изюм",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 801,
      "_id": 811,
      "name": "Изюм золотой, без косточек",
      "lowercase": "изюм золотой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 802,
      "_id": 812,
      "name": "Изюм с косточками",
      "lowercase": "изюм с косточками",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 803,
      "_id": 813,
      "name": "Инжир",
      "lowercase": "инжир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 804,
      "_id": 814,
      "name": "Инжир сушеный",
      "lowercase": "инжир сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 805,
      "_id": 815,
      "name": "Киви",
      "lowercase": "киви",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 806,
      "_id": 816,
      "name": "Киви пюре",
      "lowercase": "киви пюре",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 807,
      "_id": 817,
      "name": "Киви золотой",
      "lowercase": "киви золотой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 808,
      "_id": 818,
      "name": "Клубника замороженная",
      "lowercase": "клубника замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 809,
      "_id": 819,
      "name": "Клубника замороженная, подслащенная",
      "lowercase": "клубника замороженная, подслащенная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 810,
      "_id": 820,
      "name": "Клубника",
      "lowercase": "клубника",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 811,
      "_id": 821,
      "name": "Клюква",
      "lowercase": "клюква",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 812,
      "_id": 822,
      "name": "Клюква сушеная",
      "lowercase": "клюква сушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 813,
      "_id": 823,
      "name": "Крыжовник",
      "lowercase": "крыжовник",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 814,
      "_id": 824,
      "name": "Лайм",
      "lowercase": "лайм",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 815,
      "_id": 825,
      "name": "Лимон",
      "lowercase": "лимон",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 816,
      "_id": 826,
      "name": "Лимон без кожуры",
      "lowercase": "лимон без кожуры",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 817,
      "_id": 827,
      "name": "Лимонная кожура",
      "lowercase": "лимонная кожура",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 818,
      "_id": 828,
      "name": "Малина",
      "lowercase": "малина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 819,
      "_id": 829,
      "name": "Малина замороженная, подслащенная",
      "lowercase": "малина замороженная, подслащенная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 820,
      "_id": 830,
      "name": "Манго нектар консервированный",
      "lowercase": "манго нектар консервированный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 821,
      "_id": 831,
      "name": "Манго",
      "lowercase": "манго",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 822,
      "_id": 832,
      "name": "Мандарин",
      "lowercase": "мандарин мандарины",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 823,
      "_id": 833,
      "name": "Маслины консервированные",
      "lowercase": "маслины консервированные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 824,
      "_id": 834,
      "name": "Нектарин",
      "lowercase": "нектарин",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 825,
      "_id": 835,
      "name": "Облепиха",
      "lowercase": "облепиха",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 826,
      "_id": 836,
      "name": "Оливки зеленые, маринованные",
      "lowercase": "оливки зеленые, маринованные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 827,
      "_id": 837,
      "name": "Персик",
      "lowercase": "персик",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 828,
      "_id": 838,
      "name": "Персик сушеный",
      "lowercase": "персик сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 829,
      "_id": 839,
      "name": "Рябина садовая красная",
      "lowercase": "рябина садовая красная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 830,
      "_id": 840,
      "name": "Рябина черноплодная",
      "lowercase": "рябина черноплодная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 831,
      "_id": 841,
      "name": "Слива",
      "lowercase": "слива",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 832,
      "_id": 842,
      "name": "Слива сушеная",
      "lowercase": "слива сушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 833,
      "_id": 843,
      "name": "Смородина белая",
      "lowercase": "смородина белая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 834,
      "_id": 844,
      "name": "Смородина красная",
      "lowercase": "смородина красная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 835,
      "_id": 845,
      "name": "Смородина черная",
      "lowercase": "смородина черная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 836,
      "_id": 846,
      "name": "Тутовая ягода",
      "lowercase": "тутовая ягода",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 837,
      "_id": 847,
      "name": "Терн",
      "lowercase": "терн",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 838,
      "_id": 848,
      "name": "Фейхоа",
      "lowercase": "фейхоа",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 839,
      "_id": 849,
      "name": "Финики",
      "lowercase": "финики",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 840,
      "_id": 850,
      "name": "Хурма",
      "lowercase": "хурма",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 841,
      "_id": 851,
      "name": "Хурма американская",
      "lowercase": "хурма американская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 842,
      "_id": 852,
      "name": "Хурма японская",
      "lowercase": "хурма японская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 843,
      "_id": 853,
      "name": "Черешня",
      "lowercase": "черешня",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 844,
      "_id": 854,
      "name": "Черешня замороженная, подслащенная",
      "lowercase": "черешня замороженная, подслащенная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 845,
      "_id": 855,
      "name": "Черника",
      "lowercase": "черника",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 846,
      "_id": 856,
      "name": "Черника замороженная",
      "lowercase": "черника замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 847,
      "_id": 857,
      "name": "Шиповник",
      "lowercase": "шиповник",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 848,
      "_id": 858,
      "name": "Шиповник сухой",
      "lowercase": "шиповник сухой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 849,
      "_id": 859,
      "name": "Яблоки",
      "lowercase": "яблоки яблоко",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 850,
      "_id": 860,
      "name": "Яблоки сушеные",
      "lowercase": "яблоки яблоко сушеные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 851,
      "_id": 861,
      "name": "Яблоки замороженные",
      "lowercase": "яблоки замороженные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 852,
      "_id": 862,
      "name": "Яблоки без кожицы",
      "lowercase": "яблоки без кожицы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 853,
      "_id": 863,
      "name": "Артишок замороженный",
      "lowercase": "артишок замороженный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 854,
      "_id": 864,
      "name": "Артишок",
      "lowercase": "артишок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 855,
      "_id": 865,
      "name": "Спаржа",
      "lowercase": "спаржа",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 856,
      "_id": 866,
      "name": "Спаржа вареная",
      "lowercase": "спаржа вареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 857,
      "_id": 867,
      "name": "Спаржа замороженная",
      "lowercase": "спаржа замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 858,
      "_id": 868,
      "name": "Баклажаны",
      "lowercase": "баклажаны",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 859,
      "_id": 869,
      "name": "Баклажан отварной",
      "lowercase": "баклажан отварной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 860,
      "_id": 870,
      "name": "Брокколи вареная",
      "lowercase": "брокколи вареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 861,
      "_id": 871,
      "name": "Брокколи замороженная",
      "lowercase": "брокколи замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 862,
      "_id": 872,
      "name": "Брокколи листья",
      "lowercase": "брокколи листья",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 863,
      "_id": 873,
      "name": "Брокколи цветки",
      "lowercase": "брокколи цветки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 864,
      "_id": 874,
      "name": "Брюква",
      "lowercase": "брюква",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 865,
      "_id": 875,
      "name": "Брюква вареная",
      "lowercase": "брюква вареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 866,
      "_id": 876,
      "name": "Брюссельская капуста",
      "lowercase": "брюссельская капуста",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 867,
      "_id": 877,
      "name": "Васаби корень",
      "lowercase": "васаби корень",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 868,
      "_id": 878,
      "name": "Виноградные листья",
      "lowercase": "виноградные листья",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 869,
      "_id": 879,
      "name": "Виноградные листья, консервированные",
      "lowercase": "виноградные листья, консервированные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 870,
      "_id": 880,
      "name": "Горох в стручках",
      "lowercase": "горох в стручках",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 871,
      "_id": 881,
      "name": "Горох в стручках вареный",
      "lowercase": "горох в стручках вареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 872,
      "_id": 882,
      "name": "Горох в стручках, замороженный",
      "lowercase": "горох в стручках, замороженный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 873,
      "_id": 883,
      "name": "Горошек зеленый, вареный без соли",
      "lowercase": "горошек зеленый, вареный без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 874,
      "_id": 884,
      "name": "Горошек зеленый, замороженный",
      "lowercase": "горошек зеленый, замороженный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 875,
      "_id": 885,
      "name": "Горошек зеленый, консервированный",
      "lowercase": "горошек зеленый, консервированный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 876,
      "_id": 886,
      "name": "Горошек зеленый, консервированный, стандартная упаковка",
      "lowercase": "горошек зеленый, консервированный, стандартная упаковка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 877,
      "_id": 887,
      "name": "Горошек зеленый",
      "lowercase": "горошек зеленый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 878,
      "_id": 888,
      "name": "Грибы жареные (сушеные)",
      "lowercase": "грибы жареные (сушеные)",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 879,
      "_id": 889,
      "name": "Грибы жареные в сметанном соусе",
      "lowercase": "грибы жареные в сметанном соусе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 880,
      "_id": 890,
      "name": "Грибы жареные с картофелем",
      "lowercase": "грибы жареные с картофелем",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 881,
      "_id": 891,
      "name": "Грибы белые сушеные",
      "lowercase": "грибы белые сушеные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 882,
      "_id": 892,
      "name": "Грибы белые",
      "lowercase": "грибы белые",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 883,
      "_id": 893,
      "name": "Грибы запеченные в сметанном соусе",
      "lowercase": "грибы запеченные в сметанном соусе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 884,
      "_id": 894,
      "name": "Лисички",
      "lowercase": "лисички грибы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 885,
      "_id": 895,
      "name": "Митаки",
      "lowercase": "митаки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 886,
      "_id": 896,
      "name": "Опята",
      "lowercase": "опята грибы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 887,
      "_id": 897,
      "name": "Подберезовики",
      "lowercase": "подберезовики грибы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 888,
      "_id": 898,
      "name": "Подосиновики",
      "lowercase": "подосиновики",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 889,
      "_id": 899,
      "name": "Сморчок",
      "lowercase": "сморчок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 890,
      "_id": 900,
      "name": "Сыроежки",
      "lowercase": "сыроежки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 891,
      "_id": 901,
      "name": "Шампиньоны",
      "lowercase": "шампиньоны грибы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 892,
      "_id": 902,
      "name": "Шитаки",
      "lowercase": "шитаки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 893,
      "_id": 903,
      "name": "Зеленые соевые бобы, замороженные",
      "lowercase": "зеленые соевые бобы, замороженные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 894,
      "_id": 904,
      "name": "Драники картофельные",
      "lowercase": "драники картофельные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 895,
      "_id": 905,
      "name": "Зразы картофельные",
      "lowercase": "зразы картофельные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 896,
      "_id": 906,
      "name": "Икра из баклажанов, консервы",
      "lowercase": "икра из баклажанов, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 897,
      "_id": 907,
      "name": "Икра из кабачков, консервы",
      "lowercase": "икра из кабачков, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 898,
      "_id": 908,
      "name": "Имбирь корень",
      "lowercase": "имбирь корень",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 899,
      "_id": 909,
      "name": "Кабачки",
      "lowercase": "кабачки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 900,
      "_id": 910,
      "name": "Кабачки жареные",
      "lowercase": "кабачки жареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 901,
      "_id": 911,
      "name": "Капуста белокочанная",
      "lowercase": "капуста белокочанная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 902,
      "_id": 912,
      "name": "Капуста жареная",
      "lowercase": "капуста жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 903,
      "_id": 913,
      "name": "Капуста запеченная",
      "lowercase": "капуста запеченная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 904,
      "_id": 914,
      "name": "Капуста квашеная",
      "lowercase": "капуста квашеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 905,
      "_id": 915,
      "name": "Капуста отварная",
      "lowercase": "капуста отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 906,
      "_id": 916,
      "name": "Капуста тушеная",
      "lowercase": "капуста тушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 907,
      "_id": 917,
      "name": "Капуста цветная жареная",
      "lowercase": "капуста цветная жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 908,
      "_id": 918,
      "name": "Капуста цветная отварная",
      "lowercase": "капуста цветная отварная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 909,
      "_id": 919,
      "name": "Капуста кале сырая",
      "lowercase": "капуста кале сырая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 910,
      "_id": 920,
      "name": "Капуста кале замороженная",
      "lowercase": "капуста кале замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 911,
      "_id": 921,
      "name": "Капуста кале вареная, без соли",
      "lowercase": "капуста кале вареная, без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 912,
      "_id": 922,
      "name": "Капуста пак-чой",
      "lowercase": "капуста пак-чой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 913,
      "_id": 923,
      "name": "Капуста пак-чой вареная, без соли",
      "lowercase": "капуста пак-чой вареная, без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 914,
      "_id": 924,
      "name": "Кольраби",
      "lowercase": "кольраби",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 915,
      "_id": 925,
      "name": "Капуста красная",
      "lowercase": "капуста красная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 916,
      "_id": 926,
      "name": "Капуста краснокочанная",
      "lowercase": "капуста краснокочанная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 917,
      "_id": 927,
      "name": "Картофель",
      "lowercase": "картофель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 918,
      "_id": 928,
      "name": "Картофель отварной",
      "lowercase": "картофель отварной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 919,
      "_id": 929,
      "name": "Картофель сушеный",
      "lowercase": "картофель сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 920,
      "_id": 930,
      "name": "Картофель фри без соли, замороженный",
      "lowercase": "картофель фри без соли, замороженный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 921,
      "_id": 931,
      "name": "Картофель запеченный с кожурой",
      "lowercase": "картофель запеченный с кожурой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 922,
      "_id": 932,
      "name": "Картофель вареный без кожуры, без соли",
      "lowercase": "картофель вареный без кожуры, без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 923,
      "_id": 933,
      "name": "Картофель вареный без кожуры, с солью",
      "lowercase": "картофель вареный без кожуры, с солью",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 924,
      "_id": 934,
      "name": "Картофель вареный в кожуре, без соли",
      "lowercase": "картофель вареный в кожуре, без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 925,
      "_id": 935,
      "name": "Картофель вареный в кожуре, с солью",
      "lowercase": "картофель вареный в кожуре, с солью",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 926,
      "_id": 936,
      "name": "Картофель жаренный брусочками",
      "lowercase": "картофель жаренный брусочками",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 927,
      "_id": 937,
      "name": "Картофель, жаренный во фритюре",
      "lowercase": "картофель, жаренный во фритюре",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 928,
      "_id": 938,
      "name": "Картофель замороженный, неприготовленный",
      "lowercase": "картофель замороженный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 929,
      "_id": 939,
      "name": "Картофель запеченный в сметанном соусе",
      "lowercase": "картофель запеченный в сметанном соусе",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 930,
      "_id": 940,
      "name": "Картофель запеченный с яйцом",
      "lowercase": "картофель запеченный с яйцом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 931,
      "_id": 941,
      "name": "Картофель запеченный по-домашнему с маргарином",
      "lowercase": "картофель запеченный по-домашнему с маргарином",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 932,
      "_id": 942,
      "name": "Картофельное пюре с молоком",
      "lowercase": "картофельное пюре с молоком",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 933,
      "_id": 943,
      "name": "Картофельное пюре обезвоженное, гранулы",
      "lowercase": "картофельное пюре обезвоженное, гранулы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 934,
      "_id": 944,
      "name": "Картофельное пюре обезвоженное, хлопья без молока",
      "lowercase": "картофельное пюре обезвоженное, хлопья без молока",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 935,
      "_id": 945,
      "name": "Каша из тыквы",
      "lowercase": "каша из тыквы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 936,
      "_id": 946,
      "name": "Кетчуп",
      "lowercase": "кетчуп",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 937,
      "_id": 947,
      "name": "Кетчуп с низким содержанием натрия",
      "lowercase": "кетчуп с низким содержанием натрия",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 938,
      "_id": 948,
      "name": "Кольраби вареная, без соли",
      "lowercase": "кольраби вареная, без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 939,
      "_id": 949,
      "name": "Кольраби вареная, с солью",
      "lowercase": "кольраби вареная, с солью",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 940,
      "_id": 950,
      "name": "Котлеты капустные",
      "lowercase": "котлеты капустные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 941,
      "_id": 951,
      "name": "Котлеты картофельные",
      "lowercase": "котлеты картофельные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 942,
      "_id": 952,
      "name": "Котлеты картофельные с творогом",
      "lowercase": "котлеты картофельные с творогом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 943,
      "_id": 953,
      "name": "Котлеты морковные",
      "lowercase": "котлеты морковные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 944,
      "_id": 954,
      "name": "Котлеты свекольные",
      "lowercase": "котлеты свекольные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 945,
      "_id": 955,
      "name": "Крахмал картофельный",
      "lowercase": "крахмал картофельный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 946,
      "_id": 956,
      "name": "Кукуруза белая, вареная",
      "lowercase": "кукуруза белая, вареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 947,
      "_id": 957,
      "name": "Кукуруза белая, консервированная без соли",
      "lowercase": "кукуруза белая, консервированная без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 948,
      "_id": 958,
      "name": "Кукуруза белая",
      "lowercase": "кукуруза белая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 949,
      "_id": 959,
      "name": "Кукуруза желтая, вареная без соли",
      "lowercase": "кукуруза желтая, вареная без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 950,
      "_id": 960,
      "name": "Кукуруза желтая, консервированная, без соли",
      "lowercase": "кукуруза желтая, консервированная, без соли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 951,
      "_id": 961,
      "name": "Лук жареный",
      "lowercase": "лук жареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 952,
      "_id": 962,
      "name": "Лук зеленый, перо",
      "lowercase": "лук зеленый, перо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 953,
      "_id": 963,
      "name": "Лук маринованный",
      "lowercase": "лук",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 954,
      "_id": 964,
      "name": "Лук порей",
      "lowercase": "лук порей",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 955,
      "_id": 965,
      "name": "Лук порей, вареный без соли",
      "lowercase": "лук порей",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 956,
      "_id": 966,
      "name": "Лук порей замороженный, обезвоженный",
      "lowercase": "лук порей",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 957,
      "_id": 967,
      "name": "Лук репчатый",
      "lowercase": "лук репчатый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 958,
      "_id": 968,
      "name": "Лук репчатый вареный, с солью",
      "lowercase": "лук репчатый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 959,
      "_id": 969,
      "name": "Лук, молодая зелень",
      "lowercase": "лук",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 960,
      "_id": 970,
      "name": "Лук-шалот замороженный, обезвоженный",
      "lowercase": "лук-шалот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 961,
      "_id": 971,
      "name": "Лук-шалот",
      "lowercase": "лук-шалот",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 962,
      "_id": 972,
      "name": "Морковь отварная",
      "lowercase": "морковь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 963,
      "_id": 973,
      "name": "Морковь замороженная",
      "lowercase": "морковь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 964,
      "_id": 974,
      "name": "Морковь консервированная",
      "lowercase": "морковь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 965,
      "_id": 975,
      "name": "Морковь красная",
      "lowercase": "морковь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 966,
      "_id": 976,
      "name": "Морковь молодая",
      "lowercase": "морковь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 967,
      "_id": 977,
      "name": "Агар-агар, морские водоросли, сухие",
      "lowercase": "агар-агар водоросли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 968,
      "_id": 978,
      "name": "Агар-агар, морские водоросли",
      "lowercase": "агар-агар водоросли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 969,
      "_id": 979,
      "name": "Вакаме, морские водоросли",
      "lowercase": "вакаме водоросли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 970,
      "_id": 980,
      "name": "Ирландский мох, морские водоросли",
      "lowercase": "ирландский мох водоросли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 971,
      "_id": 981,
      "name": "Келп, морские водоросли",
      "lowercase": "келп водоросли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 972,
      "_id": 982,
      "name": "Лавер, морские водоросли",
      "lowercase": "лавер водоросли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 973,
      "_id": 983,
      "name": "Спирулина, морские водоросли",
      "lowercase": "спирулина водоросли",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 974,
      "_id": 984,
      "name": "Огурцы",
      "lowercase": "огурцы огурец",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 975,
      "_id": 985,
      "name": "Огурцы парниковые",
      "lowercase": "огурцы огурец",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 976,
      "_id": 986,
      "name": "Огурцы соленые",
      "lowercase": "огурцы огурец",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 977,
      "_id": 987,
      "name": "Огурец без кожуры",
      "lowercase": "огурец",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 978,
      "_id": 988,
      "name": "Одуванчик, листья",
      "lowercase": "одуванчик",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 979,
      "_id": 989,
      "name": "Оливки, мякоть",
      "lowercase": "оливки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 980,
      "_id": 990,
      "name": "Оливки, консервы",
      "lowercase": "оливки",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 981,
      "_id": 991,
      "name": "Пастернак, корень",
      "lowercase": "пастернак",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 982,
      "_id": 992,
      "name": "Пастернак",
      "lowercase": "пастернак",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 983,
      "_id": 993,
      "name": "Пастернак вареный без соли",
      "lowercase": "пастернак",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 984,
      "_id": 994,
      "name": "Перец анчо, сушеный",
      "lowercase": "перец анчо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 985,
      "_id": 995,
      "name": "Паприка",
      "lowercase": "паприка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 986,
      "_id": 996,
      "name": "Перец чили, острый, высушенный",
      "lowercase": "перец чили",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 987,
      "_id": 997,
      "name": "Перец чили острый, красный",
      "lowercase": "перец чили",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 988,
      "_id": 998,
      "name": "Перец чили острый, зеленый",
      "lowercase": "перец чили",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 989,
      "_id": 999,
      "name": "Перец сладкий, желтый",
      "lowercase": "перец сладкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 990,
      "_id": 1000,
      "name": "Перец сладкий, зеленый",
      "lowercase": "перец сладкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 991,
      "_id": 1001,
      "name": "Перец сладкий, красный",
      "lowercase": "перец сладкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 992,
      "_id": 1002,
      "name": "Перец сладкий, красный, вареный без соли",
      "lowercase": "перец сладкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 993,
      "_id": 1003,
      "name": "Перец, фаршированный овощами",
      "lowercase": "перец",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 994,
      "_id": 1004,
      "name": "Петрушка",
      "lowercase": "петрушка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 995,
      "_id": 1005,
      "name": "Петрушка, корень",
      "lowercase": "петрушка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 996,
      "_id": 1006,
      "name": "Петрушка замороженная, обезвоженная",
      "lowercase": "петрушка",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 997,
      "_id": 1007,
      "name": "Помидоры без кожицы, консервы",
      "lowercase": "помидоры",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 998,
      "_id": 1008,
      "name": "Помидоры жареные",
      "lowercase": "помидоры",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 999,
      "_id": 1009,
      "name": "Помидоры с кожицей, консервы",
      "lowercase": "помидоры",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1000,
      "_id": 1010,
      "name": "Портулак",
      "lowercase": "портулак",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1001,
      "_id": 1011,
      "name": "Портулак вареный",
      "lowercase": "портулак",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1002,
      "_id": 1012,
      "name": "Ревень",
      "lowercase": "ревень",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1003,
      "_id": 1013,
      "name": "Редис",
      "lowercase": "редис",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1004,
      "_id": 1014,
      "name": "Редька черная",
      "lowercase": "редька",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1005,
      "_id": 1015,
      "name": "Репа",
      "lowercase": "репа",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1006,
      "_id": 1016,
      "name": "Салат",
      "lowercase": "салат",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1007,
      "_id": 1017,
      "name": "Салат зеленый, листья",
      "lowercase": "салат зеленый, листья",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1008,
      "_id": 1018,
      "name": "Салат, красные листья",
      "lowercase": "салат, красные листья",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1009,
      "_id": 1019,
      "name": "Свекла",
      "lowercase": "свекла",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1010,
      "_id": 1020,
      "name": "Свекла вареная",
      "lowercase": "свекла",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1011,
      "_id": 1021,
      "name": "Свекла, листья",
      "lowercase": "свекла",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1012,
      "_id": 1022,
      "name": "Сельдерей, зелень",
      "lowercase": "сельдерей",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1013,
      "_id": 1023,
      "name": "Сельдерей, корень",
      "lowercase": "сельдерей корень",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1014,
      "_id": 1024,
      "name": "Сельдерей корневой, вареный",
      "lowercase": "сельдерей",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1015,
      "_id": 1025,
      "name": "Соевые бобы, зеленые",
      "lowercase": "соя соевые",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1016,
      "_id": 1026,
      "name": "Соевые бобы зеленые, вареные",
      "lowercase": "соя соевые",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1017,
      "_id": 1027,
      "name": "Томатная паста, консервы",
      "lowercase": "томатная паста",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1018,
      "_id": 1028,
      "name": "Томатное пюре, консервы",
      "lowercase": "томатное пюре",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1019,
      "_id": 1029,
      "name": "Щавель",
      "lowercase": "щавель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1020,
      "_id": 1030,
      "name": "Щавель вареный",
      "lowercase": "щавель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1021,
      "_id": 1031,
      "name": "Шпинат",
      "lowercase": "шпинат",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1022,
      "_id": 1032,
      "name": "Шпинат вареный",
      "lowercase": "шпинат",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1023,
      "_id": 1033,
      "name": "Шпинат замороженный",
      "lowercase": "шпинат",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1024,
      "_id": 1034,
      "name": "Шпинат-пюре, консервы",
      "lowercase": "шпинат",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1025,
      "_id": 1035,
      "name": "Чеснок, луковица",
      "lowercase": "чеснок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1026,
      "_id": 1036,
      "name": "Цикорий, корень сырой",
      "lowercase": "цикорий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1027,
      "_id": 1037,
      "name": "Хрен",
      "lowercase": "хрен",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1028,
      "_id": 1038,
      "name": "Фасоль, стручок",
      "lowercase": "фасоль, стручок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1029,
      "_id": 1039,
      "name": "Фасоль стручковая, консервы",
      "lowercase": "фасоль",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1030,
      "_id": 1040,
      "name": "Фенхель, луковица",
      "lowercase": "фенхель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1031,
      "_id": 1041,
      "name": "Укроп",
      "lowercase": "укроп",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1032,
      "_id": 1042,
      "name": "Томаты, желтые",
      "lowercase": "томаты помидоры",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1033,
      "_id": 1043,
      "name": "Томаты, зеленые",
      "lowercase": "томаты помидоры",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1034,
      "_id": 1044,
      "name": "Томаты грунтовые",
      "lowercase": "томаты грунтовые помидоры",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1035,
      "_id": 1045,
      "name": "Топинамбур",
      "lowercase": "топинамбур",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1036,
      "_id": 1046,
      "name": "Турнепс",
      "lowercase": "турнепс",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1037,
      "_id": 1047,
      "name": "Тыква",
      "lowercase": "тыква",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1038,
      "_id": 1048,
      "name": "Тыква жареная",
      "lowercase": "тыква жареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1039,
      "_id": 1049,
      "name": "Тыква вареная",
      "lowercase": "тыква вареная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1040,
      "_id": 1050,
      "name": "Патиссон",
      "lowercase": "патиссон",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1041,
      "_id": 1051,
      "name": "Патиссон вареный",
      "lowercase": "патиссон вареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1042,
      "_id": 1052,
      "name": "Цуккини с кожурой",
      "lowercase": "цуккини с кожурой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1043,
      "_id": 1053,
      "name": "Цуккини с кожурой, вареные без соли",
      "lowercase": "цуккини вареные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1044,
      "_id": 1054,
      "name": "Цуккини с кожурой, замороженные",
      "lowercase": "цуккини замороженные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1045,
      "_id": 1055,
      "name": "Арахис «Валенсия», жаренный на масле без соли",
      "lowercase": "арахис жаренный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1046,
      "_id": 1056,
      "name": "Арахис «Валенсия», жаренный на масле, с солью",
      "lowercase": "арахис жаренный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1047,
      "_id": 1057,
      "name": "Арахис «Валенсия»",
      "lowercase": "арахис",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1048,
      "_id": 1058,
      "name": "Арахис «Вирджиния», жаренный на масле, без соли",
      "lowercase": "арахис жаренный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1049,
      "_id": 1059,
      "name": "Арахис «Вирджиния», жаренный на масле, с солью",
      "lowercase": "арахис жаренный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1050,
      "_id": 1060,
      "name": "Арахис «Вирджиния»",
      "lowercase": "арахис",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1051,
      "_id": 1061,
      "name": "Арахисовое масло, без соли",
      "lowercase": "арахисовое масло",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1052,
      "_id": 1062,
      "name": "Горох лущеный",
      "lowercase": "горох лущеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1053,
      "_id": 1063,
      "name": "Горох отварной",
      "lowercase": "горох отварной",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1054,
      "_id": 1064,
      "name": "Горох",
      "lowercase": "горох",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1055,
      "_id": 1065,
      "name": "Горошек зеленый",
      "lowercase": "горошек зеленый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1056,
      "_id": 1066,
      "name": "Горошек зеленый, консервы",
      "lowercase": "горошек зеленый консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1057,
      "_id": 1067,
      "name": "Соя, бобы",
      "lowercase": "соя бобы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1058,
      "_id": 1068,
      "name": "Фасоль, зерно",
      "lowercase": "фасоль, зерно",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1059,
      "_id": 1069,
      "name": "Чечевица, зерно",
      "lowercase": "чечевица зерно",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1060,
      "_id": 1070,
      "name": "Кунжут, семена",
      "lowercase": "кунжут семена",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1061,
      "_id": 1072,
      "name": "Каштаны китайские, сырые",
      "lowercase": "каштаны китайские",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1062,
      "_id": 1073,
      "name": "Каштаны европейские сушеные, очищенные",
      "lowercase": "каштаны сушеные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1063,
      "_id": 1074,
      "name": "Каштаны японские, сушеные",
      "lowercase": "каштаны японские",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1064,
      "_id": 1075,
      "name": "Кокосовое молоко, свежее",
      "lowercase": "кокосовое молоко",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1065,
      "_id": 1076,
      "name": "Кокосовая вода",
      "lowercase": "кокосовая вода",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1066,
      "_id": 1077,
      "name": "Мякоть кокоса, свежая",
      "lowercase": "мякоть кокоса",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1067,
      "_id": 1078,
      "name": "Арахис",
      "lowercase": "арахис орех",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1068,
      "_id": 1079,
      "name": "Грецкий орех",
      "lowercase": "грецкий орех",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1069,
      "_id": 1080,
      "name": "Желудь сырой",
      "lowercase": "желудь сырой",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1070,
      "_id": 1081,
      "name": "Желудь сушеный",
      "lowercase": "желудь сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1071,
      "_id": 1082,
      "name": "Кешью",
      "lowercase": "кешью орех",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1072,
      "_id": 1083,
      "name": "Лещина",
      "lowercase": "лещина",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1073,
      "_id": 1084,
      "name": "Миндаль",
      "lowercase": "миндаль",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1074,
      "_id": 1085,
      "name": "Фундук",
      "lowercase": "фундук орех",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1075,
      "_id": 1086,
      "name": "Миндаль жареный, ядро",
      "lowercase": "миндаль жареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1076,
      "_id": 1087,
      "name": "Фундук жареный, ядро",
      "lowercase": "фундук жареный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1077,
      "_id": 1088,
      "name": "Какао бобы, зерно",
      "lowercase": "какао бобы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1078,
      "_id": 1089,
      "name": "Семена подсолнечника, высушенные",
      "lowercase": "семена семечки подсолнух",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1079,
      "_id": 1090,
      "name": "Семена подсолнечника, поджаренные",
      "lowercase": "семена семечки подсолнух",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1080,
      "_id": 1092,
      "name": "Семена тыква, жаренные с солью",
      "lowercase": "семена семечки тыква",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1081,
      "_id": 1093,
      "name": "Горчица столовая",
      "lowercase": "горчица столовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1082,
      "_id": 1094,
      "name": "Перечная мята",
      "lowercase": "перечная мята",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1083,
      "_id": 1095,
      "name": "Порошок горчичный",
      "lowercase": "порошок горчичный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1084,
      "_id": 1096,
      "name": "Розмарин",
      "lowercase": "розмарин",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1085,
      "_id": 1097,
      "name": "Соль поваренная пищевая",
      "lowercase": "соль поваренная пищевая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1086,
      "_id": 1098,
      "name": "Уксус яблочный",
      "lowercase": "уксус яблочный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1087,
      "_id": 1099,
      "name": "Винный уксус",
      "lowercase": "винный уксус",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1088,
      "_id": 1100,
      "name": "Анис, семена",
      "lowercase": "анис, семена",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1089,
      "_id": 1101,
      "name": "Базилик, сушеный",
      "lowercase": "базилик, сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1090,
      "_id": 1102,
      "name": "Душистый перец, молотый",
      "lowercase": "душистый перец, молотый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1091,
      "_id": 1103,
      "name": "Имбирь, молотый",
      "lowercase": "имбирь, молотый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1092,
      "_id": 1104,
      "name": "Кардамон",
      "lowercase": "кардамон",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1093,
      "_id": 1105,
      "name": "Карри, порошок",
      "lowercase": "карри, порошок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1094,
      "_id": 1106,
      "name": "Кориандр, листья сушеные",
      "lowercase": "кориандр, листья сушеные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1095,
      "_id": 1107,
      "name": "Кориандр, семена",
      "lowercase": "кориандр, семена",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1096,
      "_id": 1108,
      "name": "Корица, молотая",
      "lowercase": "корица, молотая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1097,
      "_id": 1109,
      "name": "Куркума, молотая",
      "lowercase": "куркума, молотая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1098,
      "_id": 1110,
      "name": "Лавровый лист",
      "lowercase": "лавровый лист",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1099,
      "_id": 1111,
      "name": "Лук, порошок",
      "lowercase": "лук, порошок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1100,
      "_id": 1112,
      "name": "Майоран сушеный",
      "lowercase": "майоран сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1101,
      "_id": 1113,
      "name": "Мак, семена",
      "lowercase": "мак, семена",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1102,
      "_id": 1114,
      "name": "Гвоздика молотая",
      "lowercase": "гвоздика молотая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1103,
      "_id": 1115,
      "name": "Муксатный орех, молотый",
      "lowercase": "муксатный орех, молотый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1104,
      "_id": 1116,
      "name": "Мята свежая",
      "lowercase": "мята свежая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1105,
      "_id": 1117,
      "name": "Мята сушеная",
      "lowercase": "мята сушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1106,
      "_id": 1118,
      "name": "Орегано сушеный",
      "lowercase": "орегано сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1107,
      "_id": 1119,
      "name": "Паприка, стручковый перец",
      "lowercase": "паприка, стручковый перец",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1108,
      "_id": 1120,
      "name": "Перец чили, порошок",
      "lowercase": "перец чили, порошок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1109,
      "_id": 1121,
      "name": "Перец белый",
      "lowercase": "перец белый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1110,
      "_id": 1122,
      "name": "Перец красный",
      "lowercase": "перец красный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1111,
      "_id": 1123,
      "name": "Перец черный",
      "lowercase": "перец черный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1112,
      "_id": 1124,
      "name": "Петрушка сушеная",
      "lowercase": "петрушка сушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1113,
      "_id": 1125,
      "name": "Розмарин сушеный",
      "lowercase": "розмарин сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1114,
      "_id": 1126,
      "name": "Тимьян сушеный",
      "lowercase": "тимьян сушеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1115,
      "_id": 1127,
      "name": "Тмин, семена",
      "lowercase": "тмин, семена",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1116,
      "_id": 1128,
      "name": "Укроп, зелень сушеная",
      "lowercase": "укроп, зелень сушеная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1117,
      "_id": 1129,
      "name": "Укроп, семена",
      "lowercase": "укроп, семена",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1118,
      "_id": 1130,
      "name": "Фенхель, семена",
      "lowercase": "фенхель, семена",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1119,
      "_id": 1131,
      "name": "Чеснок, порошок",
      "lowercase": "чеснок, порошок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1120,
      "_id": 1132,
      "name": "Шалфей молотый",
      "lowercase": "шалфей молотый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1121,
      "_id": 1133,
      "name": "Мука из гречихи, диетическая",
      "lowercase": "мука из гречихи, диетическая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1122,
      "_id": 1134,
      "name": "Гречиха, зерно",
      "lowercase": "гречиха, зерно",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1123,
      "_id": 1135,
      "name": "Кукуруза, зерно продовольственное",
      "lowercase": "кукуруза зерно",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1124,
      "_id": 1136,
      "name": "Просо, зерно продовольственное",
      "lowercase": "просо зерно",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1125,
      "_id": 1137,
      "name": "Ячмень, зерно продовольственное",
      "lowercase": "ячмень зерно",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1126,
      "_id": 1138,
      "name": "Каша гречневая из крупы ядрица",
      "lowercase": "каша гречневая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1127,
      "_id": 1139,
      "name": "Каша перловая",
      "lowercase": "каша перловая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1128,
      "_id": 1140,
      "name": "Каша пшенная",
      "lowercase": "каша пшенная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1129,
      "_id": 1141,
      "name": "Каша рисовая",
      "lowercase": "каша рисовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1130,
      "_id": 1142,
      "name": "Каша ячневая",
      "lowercase": "каша ячневая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1131,
      "_id": 1143,
      "name": "Крахмал кукурузный",
      "lowercase": "крахмал кукурузный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1132,
      "_id": 1144,
      "name": "Перловая крупа",
      "lowercase": "перловая крупа",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1133,
      "_id": 1145,
      "name": "Крупа продел, гречиха",
      "lowercase": "крупа продел",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1134,
      "_id": 1146,
      "name": "Пшено шлифованное, крупа",
      "lowercase": "пшено шлифованное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1135,
      "_id": 1147,
      "name": "Крупа рисовая",
      "lowercase": "крупа рисовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1136,
      "_id": 1148,
      "name": "Крупа ядрица, гречиха",
      "lowercase": "крупа ядрица гречиха",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1137,
      "_id": 1149,
      "name": "Крупа ячневая",
      "lowercase": "крупа ячневая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1138,
      "_id": 1150,
      "name": "Крупа кукурузная",
      "lowercase": "крупа кукурузная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1139,
      "_id": 1151,
      "name": "Крупа манная",
      "lowercase": "крупа манная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1140,
      "_id": 1152,
      "name": "Крупа «Артек»",
      "lowercase": "крупа артек",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1141,
      "_id": 1153,
      "name": "Крупа «Полтавская»",
      "lowercase": "крупа полтавская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1142,
      "_id": 1154,
      "name": "Мука кукурузная",
      "lowercase": "мука кукурузная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1143,
      "_id": 1155,
      "name": "Лапша китайская",
      "lowercase": "лапша китайская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1144,
      "_id": 1156,
      "name": "Лапша рисовая, сухая",
      "lowercase": "лапша рисовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1145,
      "_id": 1157,
      "name": "Лапша яичная, сухая",
      "lowercase": "лапша яичная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1146,
      "_id": 1158,
      "name": "Лапша японская соба, сухая",
      "lowercase": "лапша японская",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1147,
      "_id": 1159,
      "name": "Макароны, из муки 1 сорта",
      "lowercase": "макароны",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1148,
      "_id": 1160,
      "name": "Макароны из муки высшего сорта",
      "lowercase": "макароны",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1149,
      "_id": 1161,
      "name": "Макароны отварные",
      "lowercase": "макароны отварные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1150,
      "_id": 1162,
      "name": "Макароны яичные",
      "lowercase": "макароны яичные",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1151,
      "_id": 1163,
      "name": "Овес, зерно продовольственное",
      "lowercase": "овес",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1152,
      "_id": 1164,
      "name": "Каша из хлопьев «Геркулес»",
      "lowercase": "каша геркулес",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1153,
      "_id": 1165,
      "name": "Каша овсяная",
      "lowercase": "каша овсяная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1154,
      "_id": 1166,
      "name": "Овсяная крупа",
      "lowercase": "овсяная крупа",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1155,
      "_id": 1167,
      "name": "Толокно, овес",
      "lowercase": "толокно",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1156,
      "_id": 1168,
      "name": "Хлопья овсяные «Геркулес»",
      "lowercase": "хлопья овсяные геркулес",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1157,
      "_id": 1171,
      "name": "Пшеница, зерно мягких пород",
      "lowercase": "пшеница",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1158,
      "_id": 1172,
      "name": "Пшеница, зерно твердых пород",
      "lowercase": "пшеница",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1159,
      "_id": 1173,
      "name": "Мука 1 сорта из мягкой пшеницы",
      "lowercase": "мука пшеница",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1160,
      "_id": 1174,
      "name": "Мука 1 сорта из твердой пшеницы",
      "lowercase": "мука пшеница",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1161,
      "_id": 1175,
      "name": "Мука 2 сорта, из мягкой пшеницы",
      "lowercase": "мука пшеница",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1162,
      "_id": 1176,
      "name": "Мука высшего сорта",
      "lowercase": "мука высшего сорта",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1163,
      "_id": 1177,
      "name": "Мука обойная, пшеница",
      "lowercase": "мука обойная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1164,
      "_id": 1178,
      "name": "Рис, зерно продовольственное",
      "lowercase": "рис",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1165,
      "_id": 1179,
      "name": "Рис коричневый, длиннозерный",
      "lowercase": "рис коричневый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1166,
      "_id": 1180,
      "name": "Рис коричневый, среднезерный",
      "lowercase": "рис коричневый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1167,
      "_id": 1181,
      "name": "Мука рисовая, диетическая",
      "lowercase": "мука рисовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1168,
      "_id": 1182,
      "name": "Мука рисовая, из белого риса",
      "lowercase": "мука рисовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1169,
      "_id": 1183,
      "name": "Мука рисовая, из коричневого риса",
      "lowercase": "мука рисовая",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1170,
      "_id": 1184,
      "name": "Рожь молотая, жареная",
      "lowercase": "рожь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1171,
      "_id": 1185,
      "name": "Рожь, зерно продовольственное",
      "lowercase": "рожь",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1172,
      "_id": 1186,
      "name": "Мука ржаная, обдирная",
      "lowercase": "мука ржаная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1173,
      "_id": 1187,
      "name": "Мука ржаная, обойная",
      "lowercase": "мука ржаная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1174,
      "_id": 1188,
      "name": "Соевая мука, необезжиренная",
      "lowercase": "соевая мука",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1175,
      "_id": 1189,
      "name": "Ячмень, лущеный",
      "lowercase": "ячмень лущеный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1176,
      "_id": 1190,
      "name": "Сахар-песок",
      "lowercase": "сахар-песок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1177,
      "_id": 1191,
      "name": "Сахар-рафинад",
      "lowercase": "сахар-рафинад",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1178,
      "_id": 1192,
      "name": "Карамель глазированная",
      "lowercase": "карамель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1179,
      "_id": 1193,
      "name": "Рыбий жир из печени трески",
      "lowercase": "рыбий жир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1180,
      "_id": 1194,
      "name": "Мед пчелиный",
      "lowercase": "мед пчелиный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1181,
      "_id": 1195,
      "name": "Карамель леденцовая",
      "lowercase": "карамель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1182,
      "_id": 1196,
      "name": "Карамель с молочной начинкой",
      "lowercase": "карамель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1183,
      "_id": 1197,
      "name": "Карамель с фруктово-ягодной начинкой",
      "lowercase": "карамель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1184,
      "_id": 1198,
      "name": "Карамель с шоколадно-ореховой начинкой",
      "lowercase": "карамель",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1185,
      "_id": 1199,
      "name": "Драже сахарное",
      "lowercase": "драже",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1186,
      "_id": 1200,
      "name": "Ирис полутвердый",
      "lowercase": "ирис",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1187,
      "_id": 1201,
      "name": "Ирис тираженный с орехом",
      "lowercase": "ирис",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1188,
      "_id": 1202,
      "name": "Мармелад желейный",
      "lowercase": "мармелад желейный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1189,
      "_id": 1203,
      "name": "Пастила",
      "lowercase": "пастила",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1190,
      "_id": 1204,
      "name": "Пастила, глазированная шоколадом",
      "lowercase": "пастила",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1191,
      "_id": 1205,
      "name": "Зефир",
      "lowercase": "зефир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1192,
      "_id": 1206,
      "name": "Зефир, глазированный шоколадом",
      "lowercase": "зефир",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1193,
      "_id": 1207,
      "name": "Халва тахинно-арахисовая",
      "lowercase": "халва",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1194,
      "_id": 1208,
      "name": "Халва",
      "lowercase": "халва",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1195,
      "_id": 1209,
      "name": "Халва тахинно-шоколадная",
      "lowercase": "халва",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1196,
      "_id": 1210,
      "name": "Какао-порошок",
      "lowercase": "какао-порошок",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1197,
      "_id": 1211,
      "name": "Шоколад горький",
      "lowercase": "шоколад горький",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1198,
      "_id": 1212,
      "name": "Шоколад молочно-ореховый",
      "lowercase": "шоколад молочно-ореховый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1199,
      "_id": 1213,
      "name": "Шоколад молочно-ореховый с изюмом",
      "lowercase": "шоколад изюмом",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1200,
      "_id": 1214,
      "name": "Шоколад полугорький",
      "lowercase": "шоколад полугорький",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1201,
      "_id": 1215,
      "name": "Шоколад сладкий",
      "lowercase": "шоколад сладкий",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1202,
      "_id": 1216,
      "name": "Шоколад сливочный",
      "lowercase": "шоколад сливочный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1203,
      "_id": 1217,
      "name": "Шоколад молочный",
      "lowercase": "шоколад молочный",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1204,
      "_id": 1218,
      "name": "Шоколадная паста",
      "lowercase": "шоколадная паста",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1205,
      "_id": 1219,
      "name": "Плитки кондитерские",
      "lowercase": "плитки кондитерские",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1206,
      "_id": 1220,
      "name": "Пирожное слоеное с белковым кремом",
      "lowercase": "пирожное слоеное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1207,
      "_id": 1221,
      "name": "Пирожное бисквитное с белковым кремом",
      "lowercase": "пирожное бисквитное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1208,
      "_id": 1222,
      "name": "Пирожное заварное с кремом",
      "lowercase": "пирожное заварное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1209,
      "_id": 1223,
      "name": "Сироп из шиповника",
      "lowercase": "сироп шиповника",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1210,
      "_id": 1224,
      "name": "Яблочно-абрикосовый напиток",
      "lowercase": "яблочно-абрикосовый напиток",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1211,
      "_id": 1225,
      "name": "Яблочно-морковный напиток",
      "lowercase": "яблочно-морковный напиток",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1212,
      "_id": 1226,
      "name": "Компот из яблок, консервы",
      "lowercase": "компот из яблок, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1213,
      "_id": 1227,
      "name": "Яблоки в сиропе, консервы",
      "lowercase": "яблоки в сиропе, консервы",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1214,
      "_id": 1231,
      "name": "Пиво светлое, 20% сусла",
      "lowercase": "пиво светлое, 20% сусла",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1215,
      "_id": 1232,
      "name": "Пиво светлое, 11% сусла",
      "lowercase": "пиво светлое, 11% сусла",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1216,
      "_id": 1233,
      "name": "Вино сладкое белое и красное",
      "lowercase": "вино сладкое белое и красное",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1217,
      "_id": 1234,
      "name": "Жир свиной топленый",
      "lowercase": "жир свиной топленый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1218,
      "_id": 1235,
      "name": "Масло сладко-сливочное несоленое",
      "lowercase": "масло сладко-сливочное несоленое",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1219,
      "_id": 1236,
      "name": "Шпик свиной соленый",
      "lowercase": "шпик свиной соленый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1220,
      "_id": 1237,
      "name": "Брюссельская капуста, замороженная",
      "lowercase": "брюссельская капуста замороженная",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1221,
      "_id": 1238,
      "name": "Конина первой категории",
      "lowercase": "конина мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1222,
      "_id": 1239,
      "name": "Конина второй категории",
      "lowercase": "конина мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1223,
      "_id": 1240,
      "name": "Кролик, мясо",
      "lowercase": "кролик мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1224,
      "_id": 1241,
      "name": "Оленина первой категории",
      "lowercase": "оленина мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1225,
      "_id": 1242,
      "name": "Поросята",
      "lowercase": "поросята мясо",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1226,
      "_id": 1243,
      "name": "Чай черный, байховый",
      "lowercase": "чай черный, байховый",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1227,
      "_id": 1244,
      "name": "Тритикале",
      "lowercase": "тритикале",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1228,
      "_id": 1245,
      "name": "Сорго",
      "lowercase": "сорго",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1229,
      "_id": 1246,
      "name": "Маш",
      "lowercase": "маш мунг",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1230,
      "_id": 1247,
      "name": "Нут",
      "lowercase": "нут нагут",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  },
  {
      "hint": "",
      "rownumber": 1231,
      "_id": 1248,
      "name": "Гречневая крупа, продел",
      "lowercase": "гречневая крупа, продел",
      "val": 0,
      "isrecommended": 0,
      "isnotrecommended": 0,
      "excluded": 0,
      "fastdegree": ""
  }
];






/*
select
       '{''_id'': '||i._id
		|| ', ''product'': '||product
		|| ', ''nutrient'': '||nutrient
		|| ', ''value'': '''||cast(value as text)||''''
		|| ', ''perc1on100gr'': '''||cast(perc1on100gr as text) ||''''
		||'},'
from info i -- where i._id<10
*/
private info: any = [
  {
      "_id": 1,
      "product": 1,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2,
      "product": 1,
      "nutrient": 2,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3,
      "product": 1,
      "nutrient": 3,
      "value": "64",
      "perc1on100gr": "0"
  },
  {
      "_id": 4,
      "product": 1,
      "nutrient": 46,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5,
      "product": 1,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 6,
      "product": 1,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 7,
      "product": 2,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 8,
      "product": 2,
      "nutrient": 2,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 9,
      "product": 2,
      "nutrient": 3,
      "value": "64",
      "perc1on100gr": "0"
  },
  {
      "_id": 10,
      "product": 2,
      "nutrient": 45,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 11,
      "product": 2,
      "nutrient": 46,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 12,
      "product": 2,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 14,
      "product": 3,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 15,
      "product": 3,
      "nutrient": 2,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 16,
      "product": 3,
      "nutrient": 3,
      "value": "212",
      "perc1on100gr": "0"
  },
  {
      "_id": 17,
      "product": 3,
      "nutrient": 45,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 18,
      "product": 3,
      "nutrient": 46,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 19,
      "product": 4,
      "nutrient": 0,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 20,
      "product": 4,
      "nutrient": 2,
      "value": "2.61",
      "perc1on100gr": "0"
  },
  {
      "_id": 21,
      "product": 4,
      "nutrient": 3,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 22,
      "product": 4,
      "nutrient": 45,
      "value": "0.62",
      "perc1on100gr": "0"
  },
  {
      "_id": 23,
      "product": 4,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 24,
      "product": 4,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 25,
      "product": 5,
      "nutrient": 0,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 26,
      "product": 5,
      "nutrient": 2,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 27,
      "product": 5,
      "nutrient": 3,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 28,
      "product": 5,
      "nutrient": 45,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 29,
      "product": 5,
      "nutrient": 46,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 30,
      "product": 5,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 31,
      "product": 5,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 32,
      "product": 5,
      "nutrient": 18,
      "value": "160",
      "perc1on100gr": "0"
  },
  {
      "_id": 33,
      "product": 5,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 34,
      "product": 5,
      "nutrient": 21,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 35,
      "product": 1,
      "nutrient": 16,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 36,
      "product": 1,
      "nutrient": 18,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 37,
      "product": 1,
      "nutrient": 19,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 38,
      "product": 1,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 39,
      "product": 1,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 40,
      "product": 11,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 41,
      "product": 11,
      "nutrient": 2,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 42,
      "product": 11,
      "nutrient": 3,
      "value": "172",
      "perc1on100gr": "0"
  },
  {
      "_id": 52,
      "product": 12,
      "nutrient": 0,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 53,
      "product": 12,
      "nutrient": 2,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 54,
      "product": 12,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 55,
      "product": 12,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 56,
      "product": 12,
      "nutrient": 18,
      "value": "150",
      "perc1on100gr": "0"
  },
  {
      "_id": 57,
      "product": 12,
      "nutrient": 19,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 58,
      "product": 12,
      "nutrient": 21,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 59,
      "product": 12,
      "nutrient": 22,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 60,
      "product": 12,
      "nutrient": 24,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 61,
      "product": 12,
      "nutrient": 17,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 69,
      "product": 1,
      "nutrient": 24,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 70,
      "product": 1,
      "nutrient": 17,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 72,
      "product": 1,
      "nutrient": 45,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 73,
      "product": 2,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 74,
      "product": 2,
      "nutrient": 18,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 75,
      "product": 2,
      "nutrient": 19,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 76,
      "product": 2,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 77,
      "product": 2,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 78,
      "product": 2,
      "nutrient": 24,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 80,
      "product": 3,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 81,
      "product": 3,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 82,
      "product": 3,
      "nutrient": 18,
      "value": "160",
      "perc1on100gr": "0"
  },
  {
      "_id": 83,
      "product": 3,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 84,
      "product": 3,
      "nutrient": 21,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 85,
      "product": 3,
      "nutrient": 22,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 86,
      "product": 3,
      "nutrient": 24,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 87,
      "product": 3,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 88,
      "product": 4,
      "nutrient": 8,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 89,
      "product": 4,
      "nutrient": 15,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 90,
      "product": 4,
      "nutrient": 18,
      "value": "127",
      "perc1on100gr": "0"
  },
  {
      "_id": 91,
      "product": 4,
      "nutrient": 19,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 92,
      "product": 4,
      "nutrient": 21,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 93,
      "product": 4,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 94,
      "product": 4,
      "nutrient": 24,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 95,
      "product": 4,
      "nutrient": 17,
      "value": "0.46",
      "perc1on100gr": "0"
  },
  {
      "_id": 96,
      "product": 4,
      "nutrient": 32,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 97,
      "product": 4,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 98,
      "product": 4,
      "nutrient": 38,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 99,
      "product": 4,
      "nutrient": 41,
      "value": "104.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 100,
      "product": 4,
      "nutrient": 43,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 103,
      "product": 5,
      "nutrient": 22,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 104,
      "product": 5,
      "nutrient": 24,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 105,
      "product": 5,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 108,
      "product": 6,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 109,
      "product": 6,
      "nutrient": 2,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 112,
      "product": 6,
      "nutrient": 46,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 113,
      "product": 6,
      "nutrient": 45,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 114,
      "product": 6,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 115,
      "product": 6,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 116,
      "product": 6,
      "nutrient": 18,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 117,
      "product": 6,
      "nutrient": 19,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 118,
      "product": 6,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 119,
      "product": 6,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 120,
      "product": 6,
      "nutrient": 24,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 121,
      "product": 6,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 122,
      "product": 7,
      "nutrient": 2,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 123,
      "product": 7,
      "nutrient": 3,
      "value": "239",
      "perc1on100gr": "0"
  },
  {
      "_id": 124,
      "product": 7,
      "nutrient": 45,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 125,
      "product": 7,
      "nutrient": 46,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 126,
      "product": 7,
      "nutrient": 18,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 127,
      "product": 7,
      "nutrient": 19,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 128,
      "product": 7,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 131,
      "product": 8,
      "nutrient": 2,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 132,
      "product": 8,
      "nutrient": 3,
      "value": "299",
      "perc1on100gr": "0"
  },
  {
      "_id": 133,
      "product": 8,
      "nutrient": 45,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 134,
      "product": 8,
      "nutrient": 46,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 135,
      "product": 8,
      "nutrient": 18,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 136,
      "product": 8,
      "nutrient": 19,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 137,
      "product": 8,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 141,
      "product": 9,
      "nutrient": 2,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 143,
      "product": 9,
      "nutrient": 3,
      "value": "235",
      "perc1on100gr": "0"
  },
  {
      "_id": 144,
      "product": 9,
      "nutrient": 45,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 145,
      "product": 9,
      "nutrient": 18,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 146,
      "product": 9,
      "nutrient": 19,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 147,
      "product": 9,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 149,
      "product": 14,
      "nutrient": 2,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 151,
      "product": 14,
      "nutrient": 3,
      "value": "215",
      "perc1on100gr": "0"
  },
  {
      "_id": 152,
      "product": 14,
      "nutrient": 45,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 153,
      "product": 14,
      "nutrient": 18,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 154,
      "product": 14,
      "nutrient": 19,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 155,
      "product": 14,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 157,
      "product": 10,
      "nutrient": 2,
      "value": "3.55",
      "perc1on100gr": "0"
  },
  {
      "_id": 158,
      "product": 10,
      "nutrient": 0,
      "value": "0.46",
      "perc1on100gr": "0"
  },
  {
      "_id": 160,
      "product": 10,
      "nutrient": 3,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 161,
      "product": 10,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 162,
      "product": 10,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 163,
      "product": 10,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 164,
      "product": 10,
      "nutrient": 9,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 165,
      "product": 10,
      "nutrient": 10,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 166,
      "product": 10,
      "nutrient": 15,
      "value": "0.51",
      "perc1on100gr": "0"
  },
  {
      "_id": 167,
      "product": 10,
      "nutrient": 16,
      "value": "10.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 168,
      "product": 10,
      "nutrient": 18,
      "value": "27",
      "perc1on100gr": "0"
  },
  {
      "_id": 169,
      "product": 10,
      "nutrient": 19,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 170,
      "product": 10,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 171,
      "product": 10,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 172,
      "product": 10,
      "nutrient": 24,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 173,
      "product": 10,
      "nutrient": 17,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 174,
      "product": 10,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 175,
      "product": 10,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 176,
      "product": 10,
      "nutrient": 38,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 177,
      "product": 10,
      "nutrient": 41,
      "value": "44.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 178,
      "product": 10,
      "nutrient": 43,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 181,
      "product": 11,
      "nutrient": 46,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 183,
      "product": 11,
      "nutrient": 45,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 184,
      "product": 11,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 185,
      "product": 11,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 186,
      "product": 11,
      "nutrient": 18,
      "value": "160",
      "perc1on100gr": "0"
  },
  {
      "_id": 187,
      "product": 11,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 188,
      "product": 11,
      "nutrient": 21,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 189,
      "product": 11,
      "nutrient": 22,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 190,
      "product": 11,
      "nutrient": 24,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 191,
      "product": 11,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 195,
      "product": 15,
      "nutrient": 2,
      "value": "1.64",
      "perc1on100gr": "0"
  },
  {
      "_id": 196,
      "product": 15,
      "nutrient": 0,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 198,
      "product": 15,
      "nutrient": 3,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 199,
      "product": 15,
      "nutrient": 45,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 200,
      "product": 15,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 202,
      "product": 15,
      "nutrient": 52,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 203,
      "product": 15,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 204,
      "product": 15,
      "nutrient": 9,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 205,
      "product": 15,
      "nutrient": 10,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 206,
      "product": 15,
      "nutrient": 15,
      "value": "0.39",
      "perc1on100gr": "0"
  },
  {
      "_id": 207,
      "product": 15,
      "nutrient": 16,
      "value": "8.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 208,
      "product": 15,
      "nutrient": 18,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 209,
      "product": 15,
      "nutrient": 19,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 210,
      "product": 15,
      "nutrient": 21,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 211,
      "product": 15,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 212,
      "product": 15,
      "nutrient": 24,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 213,
      "product": 15,
      "nutrient": 17,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 214,
      "product": 15,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 215,
      "product": 15,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 217,
      "product": 15,
      "nutrient": 41,
      "value": "45.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 218,
      "product": 15,
      "nutrient": 43,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 220,
      "product": 16,
      "nutrient": 2,
      "value": "5.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 221,
      "product": 16,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 223,
      "product": 16,
      "nutrient": 3,
      "value": "48",
      "perc1on100gr": "0"
  },
  {
      "_id": 224,
      "product": 16,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 226,
      "product": 16,
      "nutrient": 15,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 227,
      "product": 16,
      "nutrient": 18,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 228,
      "product": 16,
      "nutrient": 19,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 229,
      "product": 16,
      "nutrient": 21,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 230,
      "product": 16,
      "nutrient": 22,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 231,
      "product": 16,
      "nutrient": 24,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 232,
      "product": 16,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 234,
      "product": 17,
      "nutrient": 2,
      "value": "8.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 235,
      "product": 17,
      "nutrient": 0,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 237,
      "product": 17,
      "nutrient": 3,
      "value": "74",
      "perc1on100gr": "0"
  },
  {
      "_id": 238,
      "product": 17,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 240,
      "product": 17,
      "nutrient": 15,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 241,
      "product": 17,
      "nutrient": 18,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 242,
      "product": 17,
      "nutrient": 19,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 243,
      "product": 17,
      "nutrient": 21,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 244,
      "product": 17,
      "nutrient": 22,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 245,
      "product": 17,
      "nutrient": 24,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 246,
      "product": 17,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 247,
      "product": 20,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 248,
      "product": 20,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 249,
      "product": 20,
      "nutrient": 2,
      "value": "11.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 250,
      "product": 20,
      "nutrient": 3,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 251,
      "product": 20,
      "nutrient": 4,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 252,
      "product": 20,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 253,
      "product": 20,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 254,
      "product": 20,
      "nutrient": 52,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 255,
      "product": 20,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 256,
      "product": 20,
      "nutrient": 9,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 257,
      "product": 20,
      "nutrient": 11,
      "value": "19.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 258,
      "product": 20,
      "nutrient": 15,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 259,
      "product": 20,
      "nutrient": 18,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 260,
      "product": 20,
      "nutrient": 21,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 261,
      "product": 20,
      "nutrient": 22,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 262,
      "product": 20,
      "nutrient": 24,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 263,
      "product": 20,
      "nutrient": 17,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 264,
      "product": 20,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 265,
      "product": 20,
      "nutrient": 33,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 266,
      "product": 20,
      "nutrient": 43,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 269,
      "product": 21,
      "nutrient": 1,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 270,
      "product": 21,
      "nutrient": 2,
      "value": "12.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 271,
      "product": 21,
      "nutrient": 3,
      "value": "49",
      "perc1on100gr": "0"
  },
  {
      "_id": 272,
      "product": 21,
      "nutrient": 45,
      "value": "11.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 273,
      "product": 21,
      "nutrient": 52,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 274,
      "product": 21,
      "nutrient": 11,
      "value": "57.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 275,
      "product": 21,
      "nutrient": 13,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 276,
      "product": 21,
      "nutrient": 15,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 277,
      "product": 21,
      "nutrient": 16,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 278,
      "product": 21,
      "nutrient": 18,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 279,
      "product": 21,
      "nutrient": 19,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 280,
      "product": 21,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 281,
      "product": 21,
      "nutrient": 22,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 282,
      "product": 21,
      "nutrient": 24,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 283,
      "product": 21,
      "nutrient": 17,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 284,
      "product": 21,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 285,
      "product": 21,
      "nutrient": 43,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 287,
      "product": 22,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 288,
      "product": 22,
      "nutrient": 2,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 289,
      "product": 22,
      "nutrient": 3,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 290,
      "product": 22,
      "nutrient": 45,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 291,
      "product": 22,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 292,
      "product": 22,
      "nutrient": 8,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 293,
      "product": 22,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 294,
      "product": 22,
      "nutrient": 16,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 295,
      "product": 22,
      "nutrient": 18,
      "value": "88",
      "perc1on100gr": "0"
  },
  {
      "_id": 296,
      "product": 22,
      "nutrient": 19,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 297,
      "product": 22,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 298,
      "product": 22,
      "nutrient": 22,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 299,
      "product": 22,
      "nutrient": 24,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 300,
      "product": 22,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 301,
      "product": 22,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 302,
      "product": 22,
      "nutrient": 38,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 303,
      "product": 22,
      "nutrient": 43,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 305,
      "product": 23,
      "nutrient": 2,
      "value": "15.75",
      "perc1on100gr": "0"
  },
  {
      "_id": 306,
      "product": 23,
      "nutrient": 3,
      "value": "61",
      "perc1on100gr": "0"
  },
  {
      "_id": 307,
      "product": 23,
      "nutrient": 45,
      "value": "13.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 308,
      "product": 23,
      "nutrient": 11,
      "value": "31.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 309,
      "product": 23,
      "nutrient": 15,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 310,
      "product": 23,
      "nutrient": 16,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 311,
      "product": 23,
      "nutrient": 18,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 312,
      "product": 23,
      "nutrient": 19,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 313,
      "product": 23,
      "nutrient": 21,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 314,
      "product": 23,
      "nutrient": 22,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 315,
      "product": 23,
      "nutrient": 17,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 316,
      "product": 23,
      "nutrient": 32,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 317,
      "product": 23,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 318,
      "product": 23,
      "nutrient": 38,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 319,
      "product": 23,
      "nutrient": 43,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 321,
      "product": 24,
      "nutrient": 3,
      "value": "0",
      "perc1on100gr": "0"
  },
  {
      "_id": 322,
      "product": 24,
      "nutrient": 19,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 323,
      "product": 24,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 324,
      "product": 24,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 325,
      "product": 24,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 327,
      "product": 25,
      "nutrient": 19,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 328,
      "product": 25,
      "nutrient": 21,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 329,
      "product": 25,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 330,
      "product": 25,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 331,
      "product": 25,
      "nutrient": 41,
      "value": "71.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 332,
      "product": 25,
      "nutrient": 43,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 334,
      "product": 26,
      "nutrient": 0,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 335,
      "product": 26,
      "nutrient": 1,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 336,
      "product": 26,
      "nutrient": 2,
      "value": "10.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 337,
      "product": 26,
      "nutrient": 3,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 338,
      "product": 26,
      "nutrient": 45,
      "value": "8.98",
      "perc1on100gr": "0"
  },
  {
      "_id": 339,
      "product": 26,
      "nutrient": 15,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 340,
      "product": 26,
      "nutrient": 16,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 341,
      "product": 26,
      "nutrient": 18,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 342,
      "product": 26,
      "nutrient": 19,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 343,
      "product": 26,
      "nutrient": 21,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 344,
      "product": 26,
      "nutrient": 22,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 345,
      "product": 26,
      "nutrient": 17,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 346,
      "product": 26,
      "nutrient": 41,
      "value": "55.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 347,
      "product": 26,
      "nutrient": 43,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 349,
      "product": 27,
      "nutrient": 2,
      "value": "8.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 350,
      "product": 27,
      "nutrient": 3,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 351,
      "product": 27,
      "nutrient": 45,
      "value": "8.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 352,
      "product": 27,
      "nutrient": 18,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 353,
      "product": 27,
      "nutrient": 19,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 354,
      "product": 27,
      "nutrient": 21,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 355,
      "product": 27,
      "nutrient": 24,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 357,
      "product": 28,
      "nutrient": 0,
      "value": "8.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 358,
      "product": 28,
      "nutrient": 1,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 359,
      "product": 28,
      "nutrient": 2,
      "value": "51.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 360,
      "product": 28,
      "nutrient": 3,
      "value": "321",
      "perc1on100gr": "0"
  },
  {
      "_id": 361,
      "product": 28,
      "nutrient": 45,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 362,
      "product": 28,
      "nutrient": 46,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 363,
      "product": 28,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 364,
      "product": 28,
      "nutrient": 5,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 365,
      "product": 28,
      "nutrient": 6,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 366,
      "product": 28,
      "nutrient": 11,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 367,
      "product": 28,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 368,
      "product": 28,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 369,
      "product": 28,
      "nutrient": 47,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 371,
      "product": 29,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 372,
      "product": 29,
      "nutrient": 2,
      "value": "18.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 373,
      "product": 29,
      "nutrient": 3,
      "value": "78",
      "perc1on100gr": "0"
  },
  {
      "_id": 374,
      "product": 29,
      "nutrient": 45,
      "value": "14.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 375,
      "product": 29,
      "nutrient": 46,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 376,
      "product": 29,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 377,
      "product": 29,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 378,
      "product": 29,
      "nutrient": 11,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 379,
      "product": 29,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 380,
      "product": 29,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 381,
      "product": 29,
      "nutrient": 18,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 382,
      "product": 29,
      "nutrient": 19,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 383,
      "product": 29,
      "nutrient": 21,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 384,
      "product": 29,
      "nutrient": 22,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 385,
      "product": 29,
      "nutrient": 24,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 386,
      "product": 29,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 388,
      "product": 30,
      "nutrient": 2,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 389,
      "product": 30,
      "nutrient": 3,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 390,
      "product": 30,
      "nutrient": 45,
      "value": "9.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 391,
      "product": 30,
      "nutrient": 46,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 392,
      "product": 30,
      "nutrient": 11,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 393,
      "product": 30,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 394,
      "product": 30,
      "nutrient": 18,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 395,
      "product": 30,
      "nutrient": 19,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 396,
      "product": 30,
      "nutrient": 21,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 397,
      "product": 30,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 398,
      "product": 30,
      "nutrient": 24,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 399,
      "product": 30,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 401,
      "product": 31,
      "nutrient": 0,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 402,
      "product": 31,
      "nutrient": 2,
      "value": "12.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 403,
      "product": 31,
      "nutrient": 3,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 404,
      "product": 31,
      "nutrient": 45,
      "value": "9.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 405,
      "product": 31,
      "nutrient": 46,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 406,
      "product": 31,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 407,
      "product": 31,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 408,
      "product": 31,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 409,
      "product": 31,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 410,
      "product": 31,
      "nutrient": 13,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 411,
      "product": 31,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 412,
      "product": 31,
      "nutrient": 18,
      "value": "145",
      "perc1on100gr": "0"
  },
  {
      "_id": 413,
      "product": 31,
      "nutrient": 19,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 414,
      "product": 31,
      "nutrient": 21,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 415,
      "product": 31,
      "nutrient": 22,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 416,
      "product": 31,
      "nutrient": 24,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 417,
      "product": 31,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 419,
      "product": 32,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 420,
      "product": 32,
      "nutrient": 2,
      "value": "15.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 421,
      "product": 32,
      "nutrient": 3,
      "value": "63",
      "perc1on100gr": "0"
  },
  {
      "_id": 422,
      "product": 32,
      "nutrient": 45,
      "value": "12.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 423,
      "product": 32,
      "nutrient": 46,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 424,
      "product": 32,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 425,
      "product": 32,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 426,
      "product": 32,
      "nutrient": 18,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 427,
      "product": 32,
      "nutrient": 19,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 428,
      "product": 32,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 429,
      "product": 32,
      "nutrient": 22,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 430,
      "product": 32,
      "nutrient": 24,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 431,
      "product": 32,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 433,
      "product": 33,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 434,
      "product": 33,
      "nutrient": 2,
      "value": "16.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 435,
      "product": 33,
      "nutrient": 3,
      "value": "66",
      "perc1on100gr": "0"
  },
  {
      "_id": 436,
      "product": 33,
      "nutrient": 45,
      "value": "13.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 437,
      "product": 33,
      "nutrient": 46,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 438,
      "product": 33,
      "nutrient": 11,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 439,
      "product": 33,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 440,
      "product": 33,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 441,
      "product": 33,
      "nutrient": 18,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 442,
      "product": 33,
      "nutrient": 19,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 443,
      "product": 33,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 444,
      "product": 33,
      "nutrient": 22,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 445,
      "product": 33,
      "nutrient": 24,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 447,
      "product": 34,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 448,
      "product": 34,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 449,
      "product": 34,
      "nutrient": 2,
      "value": "23.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 450,
      "product": 34,
      "nutrient": 3,
      "value": "97",
      "perc1on100gr": "0"
  },
  {
      "_id": 451,
      "product": 34,
      "nutrient": 45,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 452,
      "product": 34,
      "nutrient": 46,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 453,
      "product": 34,
      "nutrient": 11,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 454,
      "product": 34,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 455,
      "product": 34,
      "nutrient": 18,
      "value": "36",
      "perc1on100gr": "0"
  },
  {
      "_id": 456,
      "product": 34,
      "nutrient": 19,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 457,
      "product": 34,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 458,
      "product": 34,
      "nutrient": 22,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 459,
      "product": 34,
      "nutrient": 24,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 460,
      "product": 34,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 462,
      "product": 35,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 463,
      "product": 35,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 464,
      "product": 35,
      "nutrient": 2,
      "value": "13.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 465,
      "product": 35,
      "nutrient": 3,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 466,
      "product": 35,
      "nutrient": 45,
      "value": "13.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 467,
      "product": 35,
      "nutrient": 46,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 468,
      "product": 35,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 469,
      "product": 35,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 470,
      "product": 35,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 471,
      "product": 35,
      "nutrient": 11,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 472,
      "product": 35,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 473,
      "product": 35,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 474,
      "product": 35,
      "nutrient": 18,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 475,
      "product": 35,
      "nutrient": 19,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 476,
      "product": 35,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 477,
      "product": 35,
      "nutrient": 22,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 478,
      "product": 35,
      "nutrient": 24,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 479,
      "product": 35,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 481,
      "product": 36,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 482,
      "product": 36,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 483,
      "product": 36,
      "nutrient": 2,
      "value": "13.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 484,
      "product": 36,
      "nutrient": 3,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 485,
      "product": 36,
      "nutrient": 45,
      "value": "13.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 486,
      "product": 36,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 487,
      "product": 36,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 488,
      "product": 36,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 489,
      "product": 36,
      "nutrient": 18,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 490,
      "product": 36,
      "nutrient": 19,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 491,
      "product": 36,
      "nutrient": 21,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 492,
      "product": 36,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 493,
      "product": 36,
      "nutrient": 24,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 494,
      "product": 36,
      "nutrient": 17,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 496,
      "product": 37,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 497,
      "product": 37,
      "nutrient": 2,
      "value": "13.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 498,
      "product": 37,
      "nutrient": 3,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 499,
      "product": 37,
      "nutrient": 45,
      "value": "13.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 500,
      "product": 37,
      "nutrient": 46,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 501,
      "product": 37,
      "nutrient": 4,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 502,
      "product": 37,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 503,
      "product": 37,
      "nutrient": 11,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 504,
      "product": 37,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 505,
      "product": 37,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 506,
      "product": 37,
      "nutrient": 18,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 507,
      "product": 37,
      "nutrient": 19,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 508,
      "product": 37,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 509,
      "product": 37,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 510,
      "product": 37,
      "nutrient": 24,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 511,
      "product": 37,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 513,
      "product": 38,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 514,
      "product": 38,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 515,
      "product": 38,
      "nutrient": 2,
      "value": "13.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 516,
      "product": 38,
      "nutrient": 3,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 517,
      "product": 38,
      "nutrient": 45,
      "value": "13.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 518,
      "product": 38,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 519,
      "product": 38,
      "nutrient": 4,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 520,
      "product": 38,
      "nutrient": 11,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 521,
      "product": 38,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 522,
      "product": 38,
      "nutrient": 18,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 523,
      "product": 38,
      "nutrient": 19,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 524,
      "product": 38,
      "nutrient": 21,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 525,
      "product": 38,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 526,
      "product": 38,
      "nutrient": 17,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 528,
      "product": 39,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 529,
      "product": 39,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 530,
      "product": 39,
      "nutrient": 2,
      "value": "13.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 531,
      "product": 39,
      "nutrient": 3,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 532,
      "product": 39,
      "nutrient": 45,
      "value": "13.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 533,
      "product": 39,
      "nutrient": 46,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 534,
      "product": 39,
      "nutrient": 4,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 535,
      "product": 39,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 536,
      "product": 39,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 537,
      "product": 39,
      "nutrient": 11,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 538,
      "product": 39,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 539,
      "product": 39,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 540,
      "product": 39,
      "nutrient": 18,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 541,
      "product": 39,
      "nutrient": 19,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 542,
      "product": 39,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 543,
      "product": 39,
      "nutrient": 22,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 544,
      "product": 39,
      "nutrient": 24,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 545,
      "product": 39,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 547,
      "product": 40,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 548,
      "product": 40,
      "nutrient": 2,
      "value": "21.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 549,
      "product": 40,
      "nutrient": 3,
      "value": "88",
      "perc1on100gr": "0"
  },
  {
      "_id": 550,
      "product": 40,
      "nutrient": 45,
      "value": "21.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 551,
      "product": 40,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 552,
      "product": 40,
      "nutrient": 4,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 553,
      "product": 40,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 554,
      "product": 40,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 555,
      "product": 40,
      "nutrient": 11,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 556,
      "product": 40,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 557,
      "product": 40,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 558,
      "product": 40,
      "nutrient": 18,
      "value": "158",
      "perc1on100gr": "0"
  },
  {
      "_id": 559,
      "product": 40,
      "nutrient": 19,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 560,
      "product": 40,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 561,
      "product": 40,
      "nutrient": 22,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 562,
      "product": 40,
      "nutrient": 24,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 563,
      "product": 40,
      "nutrient": 17,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 565,
      "product": 41,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 566,
      "product": 41,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 567,
      "product": 41,
      "nutrient": 2,
      "value": "20.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 568,
      "product": 41,
      "nutrient": 3,
      "value": "87",
      "perc1on100gr": "0"
  },
  {
      "_id": 569,
      "product": 41,
      "nutrient": 45,
      "value": "20.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 570,
      "product": 41,
      "nutrient": 46,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 571,
      "product": 41,
      "nutrient": 4,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 572,
      "product": 41,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 573,
      "product": 41,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 574,
      "product": 41,
      "nutrient": 11,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 575,
      "product": 41,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 576,
      "product": 41,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 577,
      "product": 41,
      "nutrient": 18,
      "value": "168",
      "perc1on100gr": "0"
  },
  {
      "_id": 578,
      "product": 41,
      "nutrient": 19,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 579,
      "product": 41,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 580,
      "product": 41,
      "nutrient": 22,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 581,
      "product": 41,
      "nutrient": 24,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 582,
      "product": 41,
      "nutrient": 17,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 584,
      "product": 42,
      "nutrient": 0,
      "value": "13.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 585,
      "product": 42,
      "nutrient": 1,
      "value": "14.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 586,
      "product": 42,
      "nutrient": 2,
      "value": "29.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 587,
      "product": 42,
      "nutrient": 3,
      "value": "331",
      "perc1on100gr": "0"
  },
  {
      "_id": 588,
      "product": 42,
      "nutrient": 45,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 589,
      "product": 42,
      "nutrient": 46,
      "value": "22.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 590,
      "product": 42,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 591,
      "product": 42,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 592,
      "product": 42,
      "nutrient": 13,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 593,
      "product": 42,
      "nutrient": 15,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 594,
      "product": 42,
      "nutrient": 18,
      "value": "2010",
      "perc1on100gr": "0"
  },
  {
      "_id": 595,
      "product": 42,
      "nutrient": 19,
      "value": "147",
      "perc1on100gr": "0"
  },
  {
      "_id": 596,
      "product": 42,
      "nutrient": 21,
      "value": "200",
      "perc1on100gr": "0"
  },
  {
      "_id": 597,
      "product": 42,
      "nutrient": 22,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 598,
      "product": 42,
      "nutrient": 24,
      "value": "198",
      "perc1on100gr": "0"
  },
  {
      "_id": 599,
      "product": 42,
      "nutrient": 17,
      "value": "5.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 601,
      "product": 43,
      "nutrient": 0,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 602,
      "product": 43,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 603,
      "product": 43,
      "nutrient": 2,
      "value": "11.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 604,
      "product": 43,
      "nutrient": 3,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 605,
      "product": 43,
      "nutrient": 45,
      "value": "11.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 606,
      "product": 43,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 607,
      "product": 43,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 608,
      "product": 43,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 609,
      "product": 43,
      "nutrient": 15,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 610,
      "product": 43,
      "nutrient": 18,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 611,
      "product": 43,
      "nutrient": 19,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 612,
      "product": 43,
      "nutrient": 24,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 613,
      "product": 43,
      "nutrient": 47,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 615,
      "product": 44,
      "nutrient": 0,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 616,
      "product": 44,
      "nutrient": 1,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 617,
      "product": 44,
      "nutrient": 2,
      "value": "10.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 618,
      "product": 44,
      "nutrient": 3,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 619,
      "product": 44,
      "nutrient": 45,
      "value": "10.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 620,
      "product": 44,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 621,
      "product": 44,
      "nutrient": 11,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 622,
      "product": 44,
      "nutrient": 15,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 623,
      "product": 44,
      "nutrient": 18,
      "value": "48",
      "perc1on100gr": "0"
  },
  {
      "_id": 624,
      "product": 44,
      "nutrient": 19,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 625,
      "product": 44,
      "nutrient": 24,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 626,
      "product": 44,
      "nutrient": 47,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 628,
      "product": 45,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 629,
      "product": 45,
      "nutrient": 1,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 630,
      "product": 45,
      "nutrient": 2,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 631,
      "product": 45,
      "nutrient": 3,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 632,
      "product": 45,
      "nutrient": 45,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 633,
      "product": 45,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 634,
      "product": 45,
      "nutrient": 18,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 635,
      "product": 45,
      "nutrient": 19,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 636,
      "product": 45,
      "nutrient": 24,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 638,
      "product": 46,
      "nutrient": 0,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 639,
      "product": 46,
      "nutrient": 2,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 640,
      "product": 46,
      "nutrient": 3,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 641,
      "product": 46,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 642,
      "product": 46,
      "nutrient": 15,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 643,
      "product": 46,
      "nutrient": 18,
      "value": "36",
      "perc1on100gr": "0"
  },
  {
      "_id": 644,
      "product": 46,
      "nutrient": 19,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 645,
      "product": 46,
      "nutrient": 21,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 646,
      "product": 46,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 647,
      "product": 46,
      "nutrient": 24,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 648,
      "product": 46,
      "nutrient": 17,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 649,
      "product": 46,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 650,
      "product": 46,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 651,
      "product": 46,
      "nutrient": 38,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 652,
      "product": 46,
      "nutrient": 41,
      "value": "70.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 653,
      "product": 46,
      "nutrient": 43,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 656,
      "product": 47,
      "nutrient": 0,
      "value": "8.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 657,
      "product": 47,
      "nutrient": 1,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 658,
      "product": 47,
      "nutrient": 2,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 659,
      "product": 47,
      "nutrient": 3,
      "value": "324",
      "perc1on100gr": "0"
  },
  {
      "_id": 660,
      "product": 47,
      "nutrient": 45,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 661,
      "product": 47,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 662,
      "product": 47,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 663,
      "product": 47,
      "nutrient": 6,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 664,
      "product": 47,
      "nutrient": 11,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 665,
      "product": 47,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 666,
      "product": 47,
      "nutrient": 15,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 667,
      "product": 47,
      "nutrient": 47,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 669,
      "product": 48,
      "nutrient": 0,
      "value": "11.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 670,
      "product": 48,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 671,
      "product": 48,
      "nutrient": 2,
      "value": "42.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 672,
      "product": 48,
      "nutrient": 3,
      "value": "224",
      "perc1on100gr": "0"
  },
  {
      "_id": 673,
      "product": 48,
      "nutrient": 6,
      "value": "1.36",
      "perc1on100gr": "0"
  },
  {
      "_id": 674,
      "product": 48,
      "nutrient": 52,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 675,
      "product": 48,
      "nutrient": 15,
      "value": "28.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 676,
      "product": 48,
      "nutrient": 16,
      "value": "101.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 677,
      "product": 48,
      "nutrient": 18,
      "value": "3501",
      "perc1on100gr": "0"
  },
  {
      "_id": 678,
      "product": 48,
      "nutrient": 19,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 679,
      "product": 48,
      "nutrient": 21,
      "value": "311",
      "perc1on100gr": "0"
  },
  {
      "_id": 680,
      "product": 48,
      "nutrient": 22,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 681,
      "product": 48,
      "nutrient": 24,
      "value": "286",
      "perc1on100gr": "0"
  },
  {
      "_id": 682,
      "product": 48,
      "nutrient": 17,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 683,
      "product": 48,
      "nutrient": 32,
      "value": "1.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 684,
      "product": 48,
      "nutrient": 33,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 685,
      "product": 48,
      "nutrient": 38,
      "value": "17.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 686,
      "product": 48,
      "nutrient": 43,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 689,
      "product": 49,
      "nutrient": 0,
      "value": "12.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 690,
      "product": 49,
      "nutrient": 1,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 691,
      "product": 49,
      "nutrient": 2,
      "value": "41.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 692,
      "product": 49,
      "nutrient": 3,
      "value": "241",
      "perc1on100gr": "0"
  },
  {
      "_id": 693,
      "product": 49,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 694,
      "product": 49,
      "nutrient": 6,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 695,
      "product": 49,
      "nutrient": 52,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 696,
      "product": 49,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 697,
      "product": 49,
      "nutrient": 15,
      "value": "28.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 698,
      "product": 49,
      "nutrient": 16,
      "value": "101.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 699,
      "product": 49,
      "nutrient": 18,
      "value": "3535",
      "perc1on100gr": "0"
  },
  {
      "_id": 700,
      "product": 49,
      "nutrient": 19,
      "value": "141",
      "perc1on100gr": "0"
  },
  {
      "_id": 701,
      "product": 49,
      "nutrient": 21,
      "value": "327",
      "perc1on100gr": "0"
  },
  {
      "_id": 702,
      "product": 49,
      "nutrient": 22,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 703,
      "product": 49,
      "nutrient": 24,
      "value": "303",
      "perc1on100gr": "0"
  },
  {
      "_id": 704,
      "product": 49,
      "nutrient": 17,
      "value": "4.41",
      "perc1on100gr": "0"
  },
  {
      "_id": 705,
      "product": 49,
      "nutrient": 32,
      "value": "1.71",
      "perc1on100gr": "0"
  },
  {
      "_id": 706,
      "product": 49,
      "nutrient": 33,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 707,
      "product": 49,
      "nutrient": 38,
      "value": "12.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 708,
      "product": 49,
      "nutrient": 43,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 711,
      "product": 50,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 712,
      "product": 50,
      "nutrient": 2,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 713,
      "product": 50,
      "nutrient": 3,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 714,
      "product": 50,
      "nutrient": 45,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 715,
      "product": 50,
      "nutrient": 46,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 716,
      "product": 50,
      "nutrient": 11,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 717,
      "product": 50,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 718,
      "product": 50,
      "nutrient": 18,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 719,
      "product": 50,
      "nutrient": 19,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 720,
      "product": 50,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 721,
      "product": 50,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 722,
      "product": 50,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 723,
      "product": 50,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 725,
      "product": 51,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 726,
      "product": 51,
      "nutrient": 2,
      "value": "12.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 727,
      "product": 51,
      "nutrient": 3,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 728,
      "product": 51,
      "nutrient": 45,
      "value": "12.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 729,
      "product": 51,
      "nutrient": 46,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 730,
      "product": 51,
      "nutrient": 4,
      "value": "108",
      "perc1on100gr": "0"
  },
  {
      "_id": 731,
      "product": 51,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 732,
      "product": 51,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 733,
      "product": 51,
      "nutrient": 11,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 734,
      "product": 51,
      "nutrient": 13,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 735,
      "product": 51,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 736,
      "product": 51,
      "nutrient": 18,
      "value": "245",
      "perc1on100gr": "0"
  },
  {
      "_id": 737,
      "product": 51,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 738,
      "product": 51,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 739,
      "product": 51,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 740,
      "product": 51,
      "nutrient": 24,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 741,
      "product": 51,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 743,
      "product": 52,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 744,
      "product": 52,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 745,
      "product": 52,
      "nutrient": 2,
      "value": "11.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 746,
      "product": 52,
      "nutrient": 3,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 747,
      "product": 52,
      "nutrient": 45,
      "value": "10.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 748,
      "product": 52,
      "nutrient": 46,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 749,
      "product": 52,
      "nutrient": 4,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 750,
      "product": 52,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 751,
      "product": 52,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 752,
      "product": 52,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 753,
      "product": 52,
      "nutrient": 9,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 754,
      "product": 52,
      "nutrient": 11,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 755,
      "product": 52,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 756,
      "product": 52,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 757,
      "product": 52,
      "nutrient": 18,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 758,
      "product": 52,
      "nutrient": 19,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 759,
      "product": 52,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 761,
      "product": 52,
      "nutrient": 24,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 762,
      "product": 52,
      "nutrient": 17,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 764,
      "product": 53,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 765,
      "product": 53,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 766,
      "product": 53,
      "nutrient": 2,
      "value": "11.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 767,
      "product": 53,
      "nutrient": 3,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 768,
      "product": 53,
      "nutrient": 45,
      "value": "11.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 769,
      "product": 53,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 770,
      "product": 53,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 771,
      "product": 53,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 772,
      "product": 53,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 773,
      "product": 53,
      "nutrient": 11,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 774,
      "product": 53,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 775,
      "product": 53,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 776,
      "product": 53,
      "nutrient": 18,
      "value": "134",
      "perc1on100gr": "0"
  },
  {
      "_id": 777,
      "product": 53,
      "nutrient": 19,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 778,
      "product": 53,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 779,
      "product": 53,
      "nutrient": 22,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 780,
      "product": 53,
      "nutrient": 24,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 781,
      "product": 53,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 783,
      "product": 54,
      "nutrient": 0,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 784,
      "product": 54,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 785,
      "product": 54,
      "nutrient": 2,
      "value": "13.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 786,
      "product": 54,
      "nutrient": 3,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 787,
      "product": 54,
      "nutrient": 45,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 788,
      "product": 54,
      "nutrient": 46,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 789,
      "product": 54,
      "nutrient": 4,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 790,
      "product": 54,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 791,
      "product": 54,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 792,
      "product": 54,
      "nutrient": 11,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 793,
      "product": 54,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 794,
      "product": 54,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 795,
      "product": 54,
      "nutrient": 18,
      "value": "179",
      "perc1on100gr": "0"
  },
  {
      "_id": 796,
      "product": 54,
      "nutrient": 19,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 797,
      "product": 54,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 798,
      "product": 54,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 799,
      "product": 54,
      "nutrient": 24,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 800,
      "product": 54,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 802,
      "product": 55,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 803,
      "product": 55,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 804,
      "product": 55,
      "nutrient": 2,
      "value": "16.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 805,
      "product": 55,
      "nutrient": 3,
      "value": "70",
      "perc1on100gr": "0"
  },
  {
      "_id": 806,
      "product": 55,
      "nutrient": 45,
      "value": "16.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 807,
      "product": 55,
      "nutrient": 46,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 808,
      "product": 55,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 809,
      "product": 55,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 810,
      "product": 55,
      "nutrient": 52,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 811,
      "product": 55,
      "nutrient": 8,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 812,
      "product": 55,
      "nutrient": 9,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 813,
      "product": 55,
      "nutrient": 11,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 814,
      "product": 55,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 815,
      "product": 55,
      "nutrient": 14,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 816,
      "product": 55,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 817,
      "product": 55,
      "nutrient": 18,
      "value": "150",
      "perc1on100gr": "0"
  },
  {
      "_id": 818,
      "product": 55,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 819,
      "product": 55,
      "nutrient": 21,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 820,
      "product": 55,
      "nutrient": 22,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 821,
      "product": 55,
      "nutrient": 24,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 822,
      "product": 55,
      "nutrient": 25,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 823,
      "product": 55,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 824,
      "product": 55,
      "nutrient": 29,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 825,
      "product": 55,
      "nutrient": 30,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 826,
      "product": 55,
      "nutrient": 32,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 827,
      "product": 55,
      "nutrient": 33,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 828,
      "product": 55,
      "nutrient": 34,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 829,
      "product": 55,
      "nutrient": 41,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 830,
      "product": 55,
      "nutrient": 42,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 831,
      "product": 55,
      "nutrient": 43,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 834,
      "product": 56,
      "nutrient": 0,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 835,
      "product": 56,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 836,
      "product": 56,
      "nutrient": 2,
      "value": "11.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 837,
      "product": 56,
      "nutrient": 3,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 838,
      "product": 56,
      "nutrient": 45,
      "value": "11.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 839,
      "product": 56,
      "nutrient": 46,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 840,
      "product": 56,
      "nutrient": 4,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 841,
      "product": 56,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 842,
      "product": 56,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 843,
      "product": 56,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 844,
      "product": 56,
      "nutrient": 9,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 845,
      "product": 56,
      "nutrient": 11,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 846,
      "product": 56,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 847,
      "product": 56,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 848,
      "product": 56,
      "nutrient": 18,
      "value": "250",
      "perc1on100gr": "0"
  },
  {
      "_id": 849,
      "product": 56,
      "nutrient": 19,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 850,
      "product": 56,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 851,
      "product": 56,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 852,
      "product": 56,
      "nutrient": 24,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 853,
      "product": 56,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 856,
      "product": 57,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 857,
      "product": 57,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 858,
      "product": 57,
      "nutrient": 2,
      "value": "14.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 859,
      "product": 57,
      "nutrient": 3,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 860,
      "product": 57,
      "nutrient": 45,
      "value": "14.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 861,
      "product": 57,
      "nutrient": 46,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 862,
      "product": 57,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 863,
      "product": 57,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 864,
      "product": 57,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 865,
      "product": 57,
      "nutrient": 11,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 866,
      "product": 57,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 867,
      "product": 57,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 868,
      "product": 57,
      "nutrient": 18,
      "value": "102",
      "perc1on100gr": "0"
  },
  {
      "_id": 869,
      "product": 57,
      "nutrient": 19,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 870,
      "product": 57,
      "nutrient": 21,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 871,
      "product": 57,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 872,
      "product": 57,
      "nutrient": 24,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 873,
      "product": 57,
      "nutrient": 17,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 875,
      "product": 58,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 876,
      "product": 58,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 877,
      "product": 58,
      "nutrient": 2,
      "value": "7.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 878,
      "product": 58,
      "nutrient": 3,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 879,
      "product": 58,
      "nutrient": 45,
      "value": "7.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 880,
      "product": 58,
      "nutrient": 46,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 881,
      "product": 58,
      "nutrient": 4,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 882,
      "product": 58,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 883,
      "product": 58,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 884,
      "product": 58,
      "nutrient": 11,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 885,
      "product": 58,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 886,
      "product": 58,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 887,
      "product": 58,
      "nutrient": 18,
      "value": "162",
      "perc1on100gr": "0"
  },
  {
      "_id": 888,
      "product": 58,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 889,
      "product": 58,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 890,
      "product": 58,
      "nutrient": 22,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 891,
      "product": 58,
      "nutrient": 24,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 892,
      "product": 58,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 894,
      "product": 59,
      "nutrient": 0,
      "value": "0.39",
      "perc1on100gr": "0"
  },
  {
      "_id": 895,
      "product": 59,
      "nutrient": 1,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 896,
      "product": 59,
      "nutrient": 2,
      "value": "12.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 897,
      "product": 59,
      "nutrient": 3,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 898,
      "product": 59,
      "nutrient": 45,
      "value": "12.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 899,
      "product": 59,
      "nutrient": 46,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 900,
      "product": 59,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 901,
      "product": 59,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 902,
      "product": 59,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 903,
      "product": 59,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 904,
      "product": 59,
      "nutrient": 9,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 905,
      "product": 59,
      "nutrient": 11,
      "value": "9.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 906,
      "product": 59,
      "nutrient": 13,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 907,
      "product": 59,
      "nutrient": 15,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 908,
      "product": 59,
      "nutrient": 16,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 909,
      "product": 59,
      "nutrient": 18,
      "value": "77",
      "perc1on100gr": "0"
  },
  {
      "_id": 910,
      "product": 59,
      "nutrient": 19,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 911,
      "product": 59,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 912,
      "product": 59,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 913,
      "product": 59,
      "nutrient": 24,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 914,
      "product": 59,
      "nutrient": 17,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 915,
      "product": 59,
      "nutrient": 33,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 916,
      "product": 59,
      "nutrient": 38,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 917,
      "product": 59,
      "nutrient": 43,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 919,
      "product": 60,
      "nutrient": 0,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 920,
      "product": 60,
      "nutrient": 1,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 921,
      "product": 60,
      "nutrient": 2,
      "value": "6.69",
      "perc1on100gr": "0"
  },
  {
      "_id": 922,
      "product": 60,
      "nutrient": 3,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 923,
      "product": 60,
      "nutrient": 45,
      "value": "1.37",
      "perc1on100gr": "0"
  },
  {
      "_id": 924,
      "product": 60,
      "nutrient": 46,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 925,
      "product": 60,
      "nutrient": 4,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 926,
      "product": 60,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 927,
      "product": 60,
      "nutrient": 52,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 928,
      "product": 60,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 929,
      "product": 60,
      "nutrient": 9,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 930,
      "product": 60,
      "nutrient": 11,
      "value": "6.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 931,
      "product": 60,
      "nutrient": 13,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 932,
      "product": 60,
      "nutrient": 15,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 933,
      "product": 60,
      "nutrient": 16,
      "value": "5.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 934,
      "product": 60,
      "nutrient": 18,
      "value": "75",
      "perc1on100gr": "0"
  },
  {
      "_id": 935,
      "product": 60,
      "nutrient": 19,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 936,
      "product": 60,
      "nutrient": 21,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 937,
      "product": 60,
      "nutrient": 22,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 938,
      "product": 60,
      "nutrient": 24,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 939,
      "product": 60,
      "nutrient": 17,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 940,
      "product": 60,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 941,
      "product": 60,
      "nutrient": 33,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 942,
      "product": 60,
      "nutrient": 38,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 943,
      "product": 60,
      "nutrient": 43,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 945,
      "product": 61,
      "nutrient": 0,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 946,
      "product": 61,
      "nutrient": 1,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 947,
      "product": 61,
      "nutrient": 2,
      "value": "6.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 948,
      "product": 61,
      "nutrient": 3,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 949,
      "product": 61,
      "nutrient": 45,
      "value": "2.52",
      "perc1on100gr": "0"
  },
  {
      "_id": 950,
      "product": 61,
      "nutrient": 46,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 951,
      "product": 61,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 952,
      "product": 61,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 953,
      "product": 61,
      "nutrient": 52,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 954,
      "product": 61,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 955,
      "product": 61,
      "nutrient": 9,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 956,
      "product": 61,
      "nutrient": 11,
      "value": "38.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 957,
      "product": 61,
      "nutrient": 13,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 958,
      "product": 61,
      "nutrient": 15,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 959,
      "product": 61,
      "nutrient": 16,
      "value": "5.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 960,
      "product": 61,
      "nutrient": 18,
      "value": "103",
      "perc1on100gr": "0"
  },
  {
      "_id": 961,
      "product": 61,
      "nutrient": 19,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 962,
      "product": 61,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 963,
      "product": 61,
      "nutrient": 22,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 964,
      "product": 61,
      "nutrient": 24,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 965,
      "product": 61,
      "nutrient": 17,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 966,
      "product": 61,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 967,
      "product": 61,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 968,
      "product": 61,
      "nutrient": 38,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 969,
      "product": 61,
      "nutrient": 43,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 971,
      "product": 62,
      "nutrient": 0,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 972,
      "product": 62,
      "nutrient": 2,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 973,
      "product": 62,
      "nutrient": 3,
      "value": "45",
      "perc1on100gr": "0"
  },
  {
      "_id": 974,
      "product": 62,
      "nutrient": 45,
      "value": "9.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 975,
      "product": 62,
      "nutrient": 46,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 976,
      "product": 62,
      "nutrient": 4,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 977,
      "product": 62,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 978,
      "product": 62,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 979,
      "product": 62,
      "nutrient": 11,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 980,
      "product": 62,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 981,
      "product": 62,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 982,
      "product": 62,
      "nutrient": 18,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 983,
      "product": 62,
      "nutrient": 19,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 984,
      "product": 62,
      "nutrient": 21,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 985,
      "product": 62,
      "nutrient": 22,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 986,
      "product": 62,
      "nutrient": 24,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 987,
      "product": 62,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 989,
      "product": 63,
      "nutrient": 0,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 990,
      "product": 63,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 991,
      "product": 63,
      "nutrient": 2,
      "value": "13.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 992,
      "product": 63,
      "nutrient": 3,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 993,
      "product": 63,
      "nutrient": 45,
      "value": "12.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 994,
      "product": 63,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 995,
      "product": 63,
      "nutrient": 4,
      "value": "175",
      "perc1on100gr": "0"
  },
  {
      "_id": 996,
      "product": 63,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 997,
      "product": 63,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 998,
      "product": 63,
      "nutrient": 11,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 999,
      "product": 63,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1000,
      "product": 63,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1001,
      "product": 63,
      "nutrient": 18,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 1002,
      "product": 63,
      "nutrient": 19,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 1003,
      "product": 63,
      "nutrient": 21,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1004,
      "product": 63,
      "nutrient": 22,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 1005,
      "product": 63,
      "nutrient": 24,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 1006,
      "product": 63,
      "nutrient": 17,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1008,
      "product": 64,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1009,
      "product": 64,
      "nutrient": 2,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 1010,
      "product": 64,
      "nutrient": 3,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 1011,
      "product": 64,
      "nutrient": 45,
      "value": "15.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1012,
      "product": 64,
      "nutrient": 46,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1013,
      "product": 64,
      "nutrient": 4,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 1014,
      "product": 64,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1015,
      "product": 64,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1016,
      "product": 64,
      "nutrient": 11,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1017,
      "product": 64,
      "nutrient": 13,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1018,
      "product": 64,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1019,
      "product": 64,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 1020,
      "product": 64,
      "nutrient": 19,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1021,
      "product": 64,
      "nutrient": 21,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1022,
      "product": 64,
      "nutrient": 22,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1023,
      "product": 64,
      "nutrient": 24,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1024,
      "product": 64,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1026,
      "product": 65,
      "nutrient": 2,
      "value": "15.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1027,
      "product": 65,
      "nutrient": 3,
      "value": "61",
      "perc1on100gr": "0"
  },
  {
      "_id": 1028,
      "product": 65,
      "nutrient": 45,
      "value": "14.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1029,
      "product": 65,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1030,
      "product": 65,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1031,
      "product": 65,
      "nutrient": 11,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1032,
      "product": 65,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1033,
      "product": 65,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1034,
      "product": 65,
      "nutrient": 18,
      "value": "148",
      "perc1on100gr": "0"
  },
  {
      "_id": 1035,
      "product": 65,
      "nutrient": 19,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 1036,
      "product": 65,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 1037,
      "product": 65,
      "nutrient": 22,
      "value": "45",
      "perc1on100gr": "0"
  },
  {
      "_id": 1038,
      "product": 65,
      "nutrient": 24,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1039,
      "product": 65,
      "nutrient": 17,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1042,
      "product": 66,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1043,
      "product": 66,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1044,
      "product": 66,
      "nutrient": 2,
      "value": "15.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1045,
      "product": 66,
      "nutrient": 3,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 1046,
      "product": 66,
      "nutrient": 45,
      "value": "15.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1047,
      "product": 66,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1048,
      "product": 66,
      "nutrient": 4,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1049,
      "product": 66,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1050,
      "product": 66,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1051,
      "product": 66,
      "nutrient": 11,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1052,
      "product": 66,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1053,
      "product": 66,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1054,
      "product": 66,
      "nutrient": 18,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 1055,
      "product": 66,
      "nutrient": 19,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1056,
      "product": 66,
      "nutrient": 21,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1057,
      "product": 66,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1058,
      "product": 66,
      "nutrient": 24,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1059,
      "product": 66,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1063,
      "product": 67,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1064,
      "product": 67,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1065,
      "product": 67,
      "nutrient": 2,
      "value": "16.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1066,
      "product": 67,
      "nutrient": 3,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 1067,
      "product": 67,
      "nutrient": 45,
      "value": "14.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1068,
      "product": 67,
      "nutrient": 46,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1069,
      "product": 67,
      "nutrient": 53,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1070,
      "product": 67,
      "nutrient": 4,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 1071,
      "product": 67,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1072,
      "product": 67,
      "nutrient": 11,
      "value": "400",
      "perc1on100gr": "0"
  },
  {
      "_id": 1073,
      "product": 67,
      "nutrient": 13,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1074,
      "product": 67,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1075,
      "product": 67,
      "nutrient": 18,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 1076,
      "product": 67,
      "nutrient": 19,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1077,
      "product": 67,
      "nutrient": 21,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1078,
      "product": 67,
      "nutrient": 22,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1079,
      "product": 67,
      "nutrient": 24,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 1080,
      "product": 67,
      "nutrient": 17,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1083,
      "product": 68,
      "nutrient": 0,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1084,
      "product": 68,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1085,
      "product": 68,
      "nutrient": 2,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1086,
      "product": 68,
      "nutrient": 3,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1087,
      "product": 68,
      "nutrient": 45,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1088,
      "product": 68,
      "nutrient": 46,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1089,
      "product": 68,
      "nutrient": 53,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1090,
      "product": 68,
      "nutrient": 4,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 1091,
      "product": 68,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 1092,
      "product": 68,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 1093,
      "product": 68,
      "nutrient": 52,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1094,
      "product": 68,
      "nutrient": 8,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1095,
      "product": 68,
      "nutrient": 9,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1096,
      "product": 68,
      "nutrient": 11,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1097,
      "product": 68,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1098,
      "product": 68,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1099,
      "product": 68,
      "nutrient": 18,
      "value": "240",
      "perc1on100gr": "0"
  },
  {
      "_id": 1100,
      "product": 68,
      "nutrient": 19,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1101,
      "product": 68,
      "nutrient": 21,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1102,
      "product": 68,
      "nutrient": 22,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1103,
      "product": 68,
      "nutrient": 23,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1104,
      "product": 68,
      "nutrient": 24,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 1105,
      "product": 68,
      "nutrient": 17,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1106,
      "product": 68,
      "nutrient": 33,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1109,
      "product": 69,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1110,
      "product": 69,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1111,
      "product": 69,
      "nutrient": 2,
      "value": "12.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1112,
      "product": 69,
      "nutrient": 3,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 1113,
      "product": 69,
      "nutrient": 45,
      "value": "11.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1114,
      "product": 69,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1115,
      "product": 69,
      "nutrient": 4,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 1116,
      "product": 69,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1117,
      "product": 69,
      "nutrient": 11,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1118,
      "product": 69,
      "nutrient": 13,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1119,
      "product": 69,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1120,
      "product": 69,
      "nutrient": 18,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 1121,
      "product": 69,
      "nutrient": 19,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 1122,
      "product": 69,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1123,
      "product": 69,
      "nutrient": 22,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1124,
      "product": 69,
      "nutrient": 24,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 1125,
      "product": 69,
      "nutrient": 17,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1128,
      "product": 70,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1129,
      "product": 70,
      "nutrient": 2,
      "value": "8.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1130,
      "product": 70,
      "nutrient": 3,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 1131,
      "product": 70,
      "nutrient": 45,
      "value": "7.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1132,
      "product": 70,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1133,
      "product": 70,
      "nutrient": 4,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1134,
      "product": 70,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1135,
      "product": 70,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1136,
      "product": 70,
      "nutrient": 11,
      "value": "85.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1137,
      "product": 70,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1138,
      "product": 70,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1139,
      "product": 70,
      "nutrient": 18,
      "value": "133",
      "perc1on100gr": "0"
  },
  {
      "_id": 1140,
      "product": 70,
      "nutrient": 19,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 1141,
      "product": 70,
      "nutrient": 21,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 1142,
      "product": 70,
      "nutrient": 22,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1143,
      "product": 70,
      "nutrient": 24,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1144,
      "product": 70,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1148,
      "product": 71,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1149,
      "product": 71,
      "nutrient": 1,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1150,
      "product": 71,
      "nutrient": 2,
      "value": "10.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1151,
      "product": 71,
      "nutrient": 3,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 1152,
      "product": 71,
      "nutrient": 45,
      "value": "9.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1153,
      "product": 71,
      "nutrient": 46,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1154,
      "product": 71,
      "nutrient": 53,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1155,
      "product": 71,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1156,
      "product": 71,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1157,
      "product": 71,
      "nutrient": 52,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 1158,
      "product": 71,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1159,
      "product": 71,
      "nutrient": 9,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1160,
      "product": 71,
      "nutrient": 11,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1161,
      "product": 71,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1162,
      "product": 71,
      "nutrient": 14,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1163,
      "product": 71,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1164,
      "product": 71,
      "nutrient": 18,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 1165,
      "product": 71,
      "nutrient": 19,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1166,
      "product": 71,
      "nutrient": 21,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1167,
      "product": 71,
      "nutrient": 22,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1168,
      "product": 71,
      "nutrient": 24,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1172,
      "product": 72,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1173,
      "product": 72,
      "nutrient": 2,
      "value": "5.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1174,
      "product": 72,
      "nutrient": 3,
      "value": "27",
      "perc1on100gr": "0"
  },
  {
      "_id": 1175,
      "product": 72,
      "nutrient": 45,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1176,
      "product": 72,
      "nutrient": 46,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1177,
      "product": 72,
      "nutrient": 53,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1178,
      "product": 72,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1179,
      "product": 72,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 1180,
      "product": 72,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1181,
      "product": 72,
      "nutrient": 15,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1185,
      "product": 73,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1186,
      "product": 73,
      "nutrient": 2,
      "value": "6.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1187,
      "product": 73,
      "nutrient": 3,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 1188,
      "product": 73,
      "nutrient": 45,
      "value": "6.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1189,
      "product": 73,
      "nutrient": 46,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1190,
      "product": 73,
      "nutrient": 11,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1191,
      "product": 73,
      "nutrient": 18,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 1192,
      "product": 73,
      "nutrient": 19,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1193,
      "product": 73,
      "nutrient": 21,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1194,
      "product": 73,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1195,
      "product": 73,
      "nutrient": 24,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1196,
      "product": 73,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1199,
      "product": 74,
      "nutrient": 0,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1200,
      "product": 74,
      "nutrient": 2,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1201,
      "product": 74,
      "nutrient": 3,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 1202,
      "product": 74,
      "nutrient": 45,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1203,
      "product": 74,
      "nutrient": 18,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1204,
      "product": 74,
      "nutrient": 19,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1205,
      "product": 74,
      "nutrient": 21,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1206,
      "product": 74,
      "nutrient": 22,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1207,
      "product": 74,
      "nutrient": 24,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1208,
      "product": 74,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1211,
      "product": 75,
      "nutrient": 0,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1212,
      "product": 75,
      "nutrient": 1,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1213,
      "product": 75,
      "nutrient": 2,
      "value": "8.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1214,
      "product": 75,
      "nutrient": 3,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 1215,
      "product": 75,
      "nutrient": 45,
      "value": "8.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1216,
      "product": 75,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1217,
      "product": 75,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1218,
      "product": 75,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1219,
      "product": 75,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1220,
      "product": 75,
      "nutrient": 18,
      "value": "48",
      "perc1on100gr": "0"
  },
  {
      "_id": 1221,
      "product": 75,
      "nutrient": 19,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 1222,
      "product": 75,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1223,
      "product": 75,
      "nutrient": 22,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1224,
      "product": 75,
      "nutrient": 24,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 1225,
      "product": 75,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1226,
      "product": 75,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1229,
      "product": 76,
      "nutrient": 18,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1231,
      "product": 76,
      "nutrient": 21,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1232,
      "product": 76,
      "nutrient": 22,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 1235,
      "product": 77,
      "nutrient": 18,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1236,
      "product": 77,
      "nutrient": 19,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1237,
      "product": 77,
      "nutrient": 20,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1238,
      "product": 77,
      "nutrient": 21,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1239,
      "product": 77,
      "nutrient": 22,
      "value": "290",
      "perc1on100gr": "0"
  },
  {
      "_id": 1240,
      "product": 77,
      "nutrient": 23,
      "value": "0.83",
      "perc1on100gr": "0"
  },
  {
      "_id": 1241,
      "product": 77,
      "nutrient": 25,
      "value": "190",
      "perc1on100gr": "0"
  },
  {
      "_id": 1242,
      "product": 77,
      "nutrient": 27,
      "value": "900",
      "perc1on100gr": "0"
  },
  {
      "_id": 1243,
      "product": 77,
      "nutrient": 29,
      "value": "160",
      "perc1on100gr": "0"
  },
  {
      "_id": 1244,
      "product": 77,
      "nutrient": 41,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 1247,
      "product": 78,
      "nutrient": 18,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1248,
      "product": 78,
      "nutrient": 19,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 1249,
      "product": 78,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1250,
      "product": 78,
      "nutrient": 22,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1253,
      "product": 79,
      "nutrient": 3,
      "value": "897",
      "perc1on100gr": "0"
  },
  {
      "_id": 1254,
      "product": 79,
      "nutrient": 4,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 1255,
      "product": 79,
      "nutrient": 13,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1256,
      "product": 79,
      "nutrient": 47,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 1258,
      "product": 80,
      "nutrient": 1,
      "value": "99.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1259,
      "product": 80,
      "nutrient": 3,
      "value": "896",
      "perc1on100gr": "0"
  },
  {
      "_id": 1260,
      "product": 80,
      "nutrient": 4,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1261,
      "product": 80,
      "nutrient": 13,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1262,
      "product": 80,
      "nutrient": 18,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1263,
      "product": 80,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1264,
      "product": 80,
      "nutrient": 24,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1265,
      "product": 80,
      "nutrient": 25,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1266,
      "product": 80,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 1267,
      "product": 80,
      "nutrient": 47,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 1270,
      "product": 81,
      "nutrient": 1,
      "value": "99.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1271,
      "product": 81,
      "nutrient": 3,
      "value": "900",
      "perc1on100gr": "0"
  },
  {
      "_id": 1272,
      "product": 81,
      "nutrient": 38,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1273,
      "product": 81,
      "nutrient": 47,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 1275,
      "product": 82,
      "nutrient": 1,
      "value": "99.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1276,
      "product": 82,
      "nutrient": 3,
      "value": "898",
      "perc1on100gr": "0"
  },
  {
      "_id": 1277,
      "product": 82,
      "nutrient": 4,
      "value": "25000",
      "perc1on100gr": "0"
  },
  {
      "_id": 1278,
      "product": 82,
      "nutrient": 47,
      "value": "570",
      "perc1on100gr": "0"
  },
  {
      "_id": 1280,
      "product": 83,
      "nutrient": 1,
      "value": "99.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1281,
      "product": 83,
      "nutrient": 3,
      "value": "897",
      "perc1on100gr": "0"
  },
  {
      "_id": 1282,
      "product": 83,
      "nutrient": 13,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1284,
      "product": 84,
      "nutrient": 1,
      "value": "99.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1285,
      "product": 84,
      "nutrient": 3,
      "value": "898",
      "perc1on100gr": "0"
  },
  {
      "_id": 1287,
      "product": 85,
      "nutrient": 1,
      "value": "99.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1288,
      "product": 85,
      "nutrient": 3,
      "value": "897",
      "perc1on100gr": "0"
  },
  {
      "_id": 1289,
      "product": 85,
      "nutrient": 4,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1290,
      "product": 85,
      "nutrient": 47,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 1292,
      "product": 86,
      "nutrient": 1,
      "value": "99.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1293,
      "product": 86,
      "nutrient": 3,
      "value": "897",
      "perc1on100gr": "0"
  },
  {
      "_id": 1294,
      "product": 86,
      "nutrient": 13,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 1296,
      "product": 87,
      "nutrient": 1,
      "value": "99.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1297,
      "product": 87,
      "nutrient": 3,
      "value": "897",
      "perc1on100gr": "0"
  },
  {
      "_id": 1298,
      "product": 87,
      "nutrient": 12,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1299,
      "product": 87,
      "nutrient": 13,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1300,
      "product": 87,
      "nutrient": 16,
      "value": "122.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1301,
      "product": 87,
      "nutrient": 38,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1302,
      "product": 87,
      "nutrient": 47,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 1304,
      "product": 88,
      "nutrient": 0,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1305,
      "product": 88,
      "nutrient": 1,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 1306,
      "product": 88,
      "nutrient": 2,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1307,
      "product": 88,
      "nutrient": 3,
      "value": "629",
      "perc1on100gr": "0"
  },
  {
      "_id": 1308,
      "product": 88,
      "nutrient": 4,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1309,
      "product": 88,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1310,
      "product": 88,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 1311,
      "product": 88,
      "nutrient": 13,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 1312,
      "product": 88,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1313,
      "product": 88,
      "nutrient": 18,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 1314,
      "product": 88,
      "nutrient": 19,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 1315,
      "product": 88,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1316,
      "product": 88,
      "nutrient": 22,
      "value": "508",
      "perc1on100gr": "0"
  },
  {
      "_id": 1317,
      "product": 88,
      "nutrient": 24,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 1318,
      "product": 88,
      "nutrient": 17,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1319,
      "product": 88,
      "nutrient": 47,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 1322,
      "product": 89,
      "nutrient": 0,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1323,
      "product": 89,
      "nutrient": 1,
      "value": "33.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1324,
      "product": 89,
      "nutrient": 2,
      "value": "6.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1325,
      "product": 89,
      "nutrient": 3,
      "value": "333",
      "perc1on100gr": "0"
  },
  {
      "_id": 1326,
      "product": 89,
      "nutrient": 45,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1327,
      "product": 89,
      "nutrient": 13,
      "value": "6.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 1328,
      "product": 89,
      "nutrient": 52,
      "value": "24.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1329,
      "product": 89,
      "nutrient": 16,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1330,
      "product": 89,
      "nutrient": 18,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 1331,
      "product": 89,
      "nutrient": 22,
      "value": "733",
      "perc1on100gr": "0"
  },
  {
      "_id": 1332,
      "product": 89,
      "nutrient": 38,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1335,
      "product": 90,
      "nutrient": 0,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1336,
      "product": 90,
      "nutrient": 1,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 1337,
      "product": 90,
      "nutrient": 2,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1338,
      "product": 90,
      "nutrient": 3,
      "value": "627",
      "perc1on100gr": "0"
  },
  {
      "_id": 1339,
      "product": 90,
      "nutrient": 45,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1340,
      "product": 90,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1341,
      "product": 90,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1342,
      "product": 90,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 1343,
      "product": 90,
      "nutrient": 13,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 1344,
      "product": 90,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1345,
      "product": 90,
      "nutrient": 18,
      "value": "63",
      "perc1on100gr": "0"
  },
  {
      "_id": 1346,
      "product": 90,
      "nutrient": 19,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 1347,
      "product": 90,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 1348,
      "product": 90,
      "nutrient": 22,
      "value": "513",
      "perc1on100gr": "0"
  },
  {
      "_id": 1349,
      "product": 90,
      "nutrient": 24,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 1350,
      "product": 90,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1351,
      "product": 90,
      "nutrient": 47,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 1354,
      "product": 91,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1355,
      "product": 91,
      "nutrient": 1,
      "value": "82",
      "perc1on100gr": "0"
  },
  {
      "_id": 1356,
      "product": 91,
      "nutrient": 2,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1357,
      "product": 91,
      "nutrient": 3,
      "value": "743",
      "perc1on100gr": "0"
  },
  {
      "_id": 1358,
      "product": 91,
      "nutrient": 45,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1359,
      "product": 91,
      "nutrient": 4,
      "value": "3000",
      "perc1on100gr": "0"
  },
  {
      "_id": 1360,
      "product": 91,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1361,
      "product": 91,
      "nutrient": 13,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 1362,
      "product": 91,
      "nutrient": 18,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 1363,
      "product": 91,
      "nutrient": 19,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 1364,
      "product": 91,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1365,
      "product": 91,
      "nutrient": 22,
      "value": "82",
      "perc1on100gr": "0"
  },
  {
      "_id": 1366,
      "product": 91,
      "nutrient": 24,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 1369,
      "product": 92,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1370,
      "product": 92,
      "nutrient": 1,
      "value": "82",
      "perc1on100gr": "0"
  },
  {
      "_id": 1371,
      "product": 92,
      "nutrient": 2,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1372,
      "product": 92,
      "nutrient": 3,
      "value": "744",
      "perc1on100gr": "0"
  },
  {
      "_id": 1373,
      "product": 92,
      "nutrient": 45,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1374,
      "product": 92,
      "nutrient": 4,
      "value": "1500",
      "perc1on100gr": "0"
  },
  {
      "_id": 1375,
      "product": 92,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1376,
      "product": 92,
      "nutrient": 13,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1377,
      "product": 92,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1378,
      "product": 92,
      "nutrient": 18,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 1379,
      "product": 92,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1380,
      "product": 92,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1381,
      "product": 92,
      "nutrient": 22,
      "value": "138",
      "perc1on100gr": "0"
  },
  {
      "_id": 1382,
      "product": 92,
      "nutrient": 24,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1385,
      "product": 93,
      "nutrient": 0,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1386,
      "product": 93,
      "nutrient": 1,
      "value": "80.71",
      "perc1on100gr": "0"
  },
  {
      "_id": 1387,
      "product": 93,
      "nutrient": 2,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1388,
      "product": 93,
      "nutrient": 3,
      "value": "717",
      "perc1on100gr": "0"
  },
  {
      "_id": 1389,
      "product": 93,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1390,
      "product": 93,
      "nutrient": 9,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1391,
      "product": 93,
      "nutrient": 13,
      "value": "5.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 1392,
      "product": 93,
      "nutrient": 52,
      "value": "75",
      "perc1on100gr": "0"
  },
  {
      "_id": 1393,
      "product": 93,
      "nutrient": 18,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1394,
      "product": 93,
      "nutrient": 19,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1395,
      "product": 93,
      "nutrient": 21,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1396,
      "product": 93,
      "nutrient": 22,
      "value": "654",
      "perc1on100gr": "0"
  },
  {
      "_id": 1397,
      "product": 93,
      "nutrient": 24,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1398,
      "product": 93,
      "nutrient": 17,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1399,
      "product": 93,
      "nutrient": 43,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 1402,
      "product": 94,
      "nutrient": 0,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1403,
      "product": 94,
      "nutrient": 1,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 1404,
      "product": 94,
      "nutrient": 2,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1405,
      "product": 94,
      "nutrient": 3,
      "value": "545",
      "perc1on100gr": "0"
  },
  {
      "_id": 1406,
      "product": 94,
      "nutrient": 45,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1407,
      "product": 94,
      "nutrient": 4,
      "value": "600",
      "perc1on100gr": "0"
  },
  {
      "_id": 1408,
      "product": 94,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1409,
      "product": 94,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1410,
      "product": 94,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1411,
      "product": 94,
      "nutrient": 18,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1412,
      "product": 94,
      "nutrient": 19,
      "value": "151",
      "perc1on100gr": "0"
  },
  {
      "_id": 1413,
      "product": 94,
      "nutrient": 21,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1414,
      "product": 94,
      "nutrient": 22,
      "value": "129",
      "perc1on100gr": "0"
  },
  {
      "_id": 1415,
      "product": 94,
      "nutrient": 24,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1418,
      "product": 95,
      "nutrient": 0,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1419,
      "product": 95,
      "nutrient": 1,
      "value": "82",
      "perc1on100gr": "0"
  },
  {
      "_id": 1420,
      "product": 95,
      "nutrient": 2,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1421,
      "product": 95,
      "nutrient": 3,
      "value": "743",
      "perc1on100gr": "0"
  },
  {
      "_id": 1422,
      "product": 95,
      "nutrient": 45,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1423,
      "product": 95,
      "nutrient": 4,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1424,
      "product": 95,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1425,
      "product": 95,
      "nutrient": 13,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1426,
      "product": 95,
      "nutrient": 18,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1427,
      "product": 95,
      "nutrient": 19,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1428,
      "product": 95,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1429,
      "product": 95,
      "nutrient": 22,
      "value": "154",
      "perc1on100gr": "0"
  },
  {
      "_id": 1430,
      "product": 95,
      "nutrient": 24,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1431,
      "product": 95,
      "nutrient": 47,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 1434,
      "product": 96,
      "nutrient": 0,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1435,
      "product": 96,
      "nutrient": 1,
      "value": "61.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1436,
      "product": 96,
      "nutrient": 2,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1437,
      "product": 96,
      "nutrient": 3,
      "value": "566",
      "perc1on100gr": "0"
  },
  {
      "_id": 1438,
      "product": 96,
      "nutrient": 45,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1439,
      "product": 96,
      "nutrient": 4,
      "value": "400",
      "perc1on100gr": "0"
  },
  {
      "_id": 1440,
      "product": 96,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1441,
      "product": 96,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1442,
      "product": 96,
      "nutrient": 13,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1443,
      "product": 96,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1444,
      "product": 96,
      "nutrient": 18,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 1445,
      "product": 96,
      "nutrient": 19,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 1446,
      "product": 96,
      "nutrient": 21,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1447,
      "product": 96,
      "nutrient": 22,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1448,
      "product": 96,
      "nutrient": 24,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 1449,
      "product": 96,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1450,
      "product": 96,
      "nutrient": 47,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 1453,
      "product": 97,
      "nutrient": 0,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1454,
      "product": 97,
      "nutrient": 1,
      "value": "72.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1455,
      "product": 97,
      "nutrient": 2,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1456,
      "product": 97,
      "nutrient": 3,
      "value": "661",
      "perc1on100gr": "0"
  },
  {
      "_id": 1457,
      "product": 97,
      "nutrient": 45,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1458,
      "product": 97,
      "nutrient": 4,
      "value": "425",
      "perc1on100gr": "0"
  },
  {
      "_id": 1459,
      "product": 97,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1460,
      "product": 97,
      "nutrient": 6,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1461,
      "product": 97,
      "nutrient": 12,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1462,
      "product": 97,
      "nutrient": 13,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1463,
      "product": 97,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1464,
      "product": 97,
      "nutrient": 18,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 1465,
      "product": 97,
      "nutrient": 19,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 1466,
      "product": 97,
      "nutrient": 22,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1467,
      "product": 97,
      "nutrient": 24,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 1468,
      "product": 97,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1469,
      "product": 97,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 1470,
      "product": 97,
      "nutrient": 43,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1471,
      "product": 97,
      "nutrient": 47,
      "value": "170",
      "perc1on100gr": "0"
  },
  {
      "_id": 1474,
      "product": 98,
      "nutrient": 0,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1475,
      "product": 98,
      "nutrient": 1,
      "value": "78",
      "perc1on100gr": "0"
  },
  {
      "_id": 1476,
      "product": 98,
      "nutrient": 2,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1477,
      "product": 98,
      "nutrient": 3,
      "value": "709",
      "perc1on100gr": "0"
  },
  {
      "_id": 1478,
      "product": 98,
      "nutrient": 45,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1479,
      "product": 98,
      "nutrient": 4,
      "value": "450",
      "perc1on100gr": "0"
  },
  {
      "_id": 1480,
      "product": 98,
      "nutrient": 6,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 1481,
      "product": 98,
      "nutrient": 13,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1482,
      "product": 98,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1483,
      "product": 98,
      "nutrient": 18,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 1484,
      "product": 98,
      "nutrient": 19,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1485,
      "product": 98,
      "nutrient": 22,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1486,
      "product": 98,
      "nutrient": 24,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 1487,
      "product": 98,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1488,
      "product": 98,
      "nutrient": 43,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1489,
      "product": 98,
      "nutrient": 47,
      "value": "170",
      "perc1on100gr": "0"
  },
  {
      "_id": 1492,
      "product": 99,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1493,
      "product": 99,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1494,
      "product": 99,
      "nutrient": 13,
      "value": "16.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1495,
      "product": 99,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1497,
      "product": 100,
      "nutrient": 1,
      "value": "99.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1498,
      "product": 100,
      "nutrient": 3,
      "value": "898",
      "perc1on100gr": "0"
  },
  {
      "_id": 1499,
      "product": 100,
      "nutrient": 4,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1500,
      "product": 100,
      "nutrient": 13,
      "value": "9.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1502,
      "product": 101,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1503,
      "product": 101,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1504,
      "product": 101,
      "nutrient": 13,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1505,
      "product": 101,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1507,
      "product": 102,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1508,
      "product": 102,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1509,
      "product": 102,
      "nutrient": 13,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1510,
      "product": 102,
      "nutrient": 19,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1511,
      "product": 102,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1513,
      "product": 103,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1514,
      "product": 103,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1516,
      "product": 104,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1517,
      "product": 104,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1518,
      "product": 104,
      "nutrient": 13,
      "value": "18.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1519,
      "product": 104,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1521,
      "product": 105,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1522,
      "product": 105,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1523,
      "product": 105,
      "nutrient": 13,
      "value": "8.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1525,
      "product": 106,
      "nutrient": 1,
      "value": "99.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1526,
      "product": 106,
      "nutrient": 3,
      "value": "898",
      "perc1on100gr": "0"
  },
  {
      "_id": 1527,
      "product": 106,
      "nutrient": 13,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1528,
      "product": 106,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1530,
      "product": 107,
      "nutrient": 1,
      "value": "99.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1531,
      "product": 107,
      "nutrient": 3,
      "value": "898",
      "perc1on100gr": "0"
  },
  {
      "_id": 1532,
      "product": 107,
      "nutrient": 13,
      "value": "12.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1533,
      "product": 107,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1534,
      "product": 107,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1536,
      "product": 108,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1537,
      "product": 108,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1538,
      "product": 108,
      "nutrient": 13,
      "value": "33.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1539,
      "product": 108,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1541,
      "product": 109,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1542,
      "product": 109,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1543,
      "product": 109,
      "nutrient": 13,
      "value": "44",
      "perc1on100gr": "0"
  },
  {
      "_id": 1544,
      "product": 109,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1546,
      "product": 110,
      "nutrient": 1,
      "value": "99.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1547,
      "product": 110,
      "nutrient": 3,
      "value": "899",
      "perc1on100gr": "0"
  },
  {
      "_id": 1548,
      "product": 110,
      "nutrient": 13,
      "value": "17.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1549,
      "product": 110,
      "nutrient": 24,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1551,
      "product": 111,
      "nutrient": 0,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1552,
      "product": 111,
      "nutrient": 1,
      "value": "99",
      "perc1on100gr": "0"
  },
  {
      "_id": 1553,
      "product": 111,
      "nutrient": 3,
      "value": "892",
      "perc1on100gr": "0"
  },
  {
      "_id": 1554,
      "product": 111,
      "nutrient": 4,
      "value": "600",
      "perc1on100gr": "0"
  },
  {
      "_id": 1555,
      "product": 111,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1556,
      "product": 111,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1557,
      "product": 111,
      "nutrient": 18,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1558,
      "product": 111,
      "nutrient": 19,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1559,
      "product": 111,
      "nutrient": 22,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1560,
      "product": 111,
      "nutrient": 24,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1561,
      "product": 111,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1562,
      "product": 111,
      "nutrient": 47,
      "value": "220",
      "perc1on100gr": "0"
  },
  {
      "_id": 1565,
      "product": 112,
      "nutrient": 0,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1566,
      "product": 112,
      "nutrient": 1,
      "value": "92.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1567,
      "product": 112,
      "nutrient": 3,
      "value": "841",
      "perc1on100gr": "0"
  },
  {
      "_id": 1568,
      "product": 112,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1569,
      "product": 112,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1570,
      "product": 112,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1571,
      "product": 112,
      "nutrient": 18,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1572,
      "product": 112,
      "nutrient": 19,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1573,
      "product": 112,
      "nutrient": 22,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 1574,
      "product": 112,
      "nutrient": 24,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1575,
      "product": 112,
      "nutrient": 47,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 1578,
      "product": 113,
      "nutrient": 0,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1579,
      "product": 113,
      "nutrient": 1,
      "value": "92.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1580,
      "product": 113,
      "nutrient": 3,
      "value": "841",
      "perc1on100gr": "0"
  },
  {
      "_id": 1581,
      "product": 113,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1582,
      "product": 113,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1583,
      "product": 113,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1584,
      "product": 113,
      "nutrient": 18,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1585,
      "product": 113,
      "nutrient": 19,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1586,
      "product": 113,
      "nutrient": 22,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 1587,
      "product": 113,
      "nutrient": 24,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1588,
      "product": 113,
      "nutrient": 47,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 1591,
      "product": 114,
      "nutrient": 0,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1592,
      "product": 114,
      "nutrient": 1,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 1593,
      "product": 114,
      "nutrient": 3,
      "value": "816",
      "perc1on100gr": "0"
  },
  {
      "_id": 1594,
      "product": 114,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1595,
      "product": 114,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1596,
      "product": 114,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1597,
      "product": 114,
      "nutrient": 18,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1598,
      "product": 114,
      "nutrient": 19,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1599,
      "product": 114,
      "nutrient": 22,
      "value": "1170",
      "perc1on100gr": "0"
  },
  {
      "_id": 1600,
      "product": 114,
      "nutrient": 24,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1601,
      "product": 114,
      "nutrient": 47,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 1604,
      "product": 115,
      "nutrient": 0,
      "value": "10.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1605,
      "product": 115,
      "nutrient": 1,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1606,
      "product": 115,
      "nutrient": 2,
      "value": "64.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1607,
      "product": 115,
      "nutrient": 3,
      "value": "311",
      "perc1on100gr": "0"
  },
  {
      "_id": 1608,
      "product": 115,
      "nutrient": 45,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1609,
      "product": 115,
      "nutrient": 46,
      "value": "4.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1610,
      "product": 115,
      "nutrient": 53,
      "value": "62.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1611,
      "product": 115,
      "nutrient": 5,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 1612,
      "product": 115,
      "nutrient": 6,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 1613,
      "product": 115,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1614,
      "product": 115,
      "nutrient": 15,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1615,
      "product": 115,
      "nutrient": 18,
      "value": "175",
      "perc1on100gr": "0"
  },
  {
      "_id": 1616,
      "product": 115,
      "nutrient": 19,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 1617,
      "product": 115,
      "nutrient": 21,
      "value": "44",
      "perc1on100gr": "0"
  },
  {
      "_id": 1618,
      "product": 115,
      "nutrient": 22,
      "value": "575",
      "perc1on100gr": "0"
  },
  {
      "_id": 1619,
      "product": 115,
      "nutrient": 24,
      "value": "114",
      "perc1on100gr": "0"
  },
  {
      "_id": 1620,
      "product": 115,
      "nutrient": 17,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1623,
      "product": 116,
      "nutrient": 0,
      "value": "8.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1624,
      "product": 116,
      "nutrient": 1,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1625,
      "product": 116,
      "nutrient": 2,
      "value": "60.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1626,
      "product": 116,
      "nutrient": 3,
      "value": "348",
      "perc1on100gr": "0"
  },
  {
      "_id": 1627,
      "product": 116,
      "nutrient": 45,
      "value": "6.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1628,
      "product": 116,
      "nutrient": 46,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1629,
      "product": 116,
      "nutrient": 53,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 1630,
      "product": 116,
      "nutrient": 5,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1631,
      "product": 116,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 1632,
      "product": 116,
      "nutrient": 13,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1633,
      "product": 116,
      "nutrient": 15,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1634,
      "product": 116,
      "nutrient": 18,
      "value": "102",
      "perc1on100gr": "0"
  },
  {
      "_id": 1635,
      "product": 116,
      "nutrient": 19,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 1636,
      "product": 116,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1637,
      "product": 116,
      "nutrient": 22,
      "value": "472",
      "perc1on100gr": "0"
  },
  {
      "_id": 1638,
      "product": 116,
      "nutrient": 24,
      "value": "72",
      "perc1on100gr": "0"
  },
  {
      "_id": 1639,
      "product": 116,
      "nutrient": 17,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1642,
      "product": 117,
      "nutrient": 0,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1643,
      "product": 117,
      "nutrient": 1,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1644,
      "product": 117,
      "nutrient": 2,
      "value": "50.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1645,
      "product": 117,
      "nutrient": 3,
      "value": "259",
      "perc1on100gr": "0"
  },
  {
      "_id": 1646,
      "product": 117,
      "nutrient": 45,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1647,
      "product": 117,
      "nutrient": 46,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1648,
      "product": 117,
      "nutrient": 53,
      "value": "46.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1649,
      "product": 117,
      "nutrient": 5,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1650,
      "product": 117,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 1651,
      "product": 117,
      "nutrient": 52,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1652,
      "product": 117,
      "nutrient": 8,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1653,
      "product": 117,
      "nutrient": 9,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 1654,
      "product": 117,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1655,
      "product": 117,
      "nutrient": 14,
      "value": "1.86",
      "perc1on100gr": "0"
  },
  {
      "_id": 1656,
      "product": 117,
      "nutrient": 16,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 1657,
      "product": 117,
      "nutrient": 18,
      "value": "131",
      "perc1on100gr": "0"
  },
  {
      "_id": 1658,
      "product": 117,
      "nutrient": 19,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 1659,
      "product": 117,
      "nutrient": 20,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1660,
      "product": 117,
      "nutrient": 21,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 1661,
      "product": 117,
      "nutrient": 22,
      "value": "429",
      "perc1on100gr": "0"
  },
  {
      "_id": 1662,
      "product": 117,
      "nutrient": 23,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 1663,
      "product": 117,
      "nutrient": 24,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 1664,
      "product": 117,
      "nutrient": 25,
      "value": "713",
      "perc1on100gr": "0"
  },
  {
      "_id": 1665,
      "product": 117,
      "nutrient": 17,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1666,
      "product": 117,
      "nutrient": 29,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1667,
      "product": 117,
      "nutrient": 30,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1668,
      "product": 117,
      "nutrient": 32,
      "value": "0.84",
      "perc1on100gr": "0"
  },
  {
      "_id": 1669,
      "product": 117,
      "nutrient": 33,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1670,
      "product": 117,
      "nutrient": 34,
      "value": "13.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1671,
      "product": 117,
      "nutrient": 41,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 1672,
      "product": 117,
      "nutrient": 42,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1673,
      "product": 117,
      "nutrient": 43,
      "value": "0.74",
      "perc1on100gr": "0"
  },
  {
      "_id": 1676,
      "product": 118,
      "nutrient": 0,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1677,
      "product": 118,
      "nutrient": 1,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1678,
      "product": 118,
      "nutrient": 2,
      "value": "51.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1679,
      "product": 118,
      "nutrient": 3,
      "value": "262",
      "perc1on100gr": "0"
  },
  {
      "_id": 1680,
      "product": 118,
      "nutrient": 45,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1681,
      "product": 118,
      "nutrient": 46,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1682,
      "product": 118,
      "nutrient": 53,
      "value": "48.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1683,
      "product": 118,
      "nutrient": 5,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 1684,
      "product": 118,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 1685,
      "product": 118,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1686,
      "product": 118,
      "nutrient": 15,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1687,
      "product": 118,
      "nutrient": 18,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 1688,
      "product": 118,
      "nutrient": 19,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 1689,
      "product": 118,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1690,
      "product": 118,
      "nutrient": 22,
      "value": "427",
      "perc1on100gr": "0"
  },
  {
      "_id": 1691,
      "product": 118,
      "nutrient": 24,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 1692,
      "product": 118,
      "nutrient": 17,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1695,
      "product": 119,
      "nutrient": 0,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1696,
      "product": 119,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1697,
      "product": 119,
      "nutrient": 2,
      "value": "49.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1698,
      "product": 119,
      "nutrient": 3,
      "value": "238",
      "perc1on100gr": "0"
  },
  {
      "_id": 1699,
      "product": 119,
      "nutrient": 45,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1700,
      "product": 119,
      "nutrient": 46,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1701,
      "product": 119,
      "nutrient": 53,
      "value": "47.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1702,
      "product": 119,
      "nutrient": 5,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1703,
      "product": 119,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 1704,
      "product": 119,
      "nutrient": 13,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1705,
      "product": 119,
      "nutrient": 15,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1706,
      "product": 119,
      "nutrient": 18,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 1707,
      "product": 119,
      "nutrient": 19,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 1708,
      "product": 119,
      "nutrient": 21,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 1709,
      "product": 119,
      "nutrient": 22,
      "value": "443",
      "perc1on100gr": "0"
  },
  {
      "_id": 1710,
      "product": 119,
      "nutrient": 24,
      "value": "89",
      "perc1on100gr": "0"
  },
  {
      "_id": 1711,
      "product": 119,
      "nutrient": 17,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1714,
      "product": 120,
      "nutrient": 0,
      "value": "9.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1715,
      "product": 120,
      "nutrient": 1,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1716,
      "product": 120,
      "nutrient": 2,
      "value": "57.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1717,
      "product": 120,
      "nutrient": 3,
      "value": "276",
      "perc1on100gr": "0"
  },
  {
      "_id": 1718,
      "product": 120,
      "nutrient": 45,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1719,
      "product": 120,
      "nutrient": 46,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1720,
      "product": 120,
      "nutrient": 53,
      "value": "55.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1721,
      "product": 120,
      "nutrient": 5,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1722,
      "product": 120,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 1723,
      "product": 120,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1724,
      "product": 120,
      "nutrient": 15,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1725,
      "product": 120,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 1726,
      "product": 120,
      "nutrient": 19,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 1727,
      "product": 120,
      "nutrient": 21,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 1728,
      "product": 120,
      "nutrient": 22,
      "value": "501",
      "perc1on100gr": "0"
  },
  {
      "_id": 1729,
      "product": 120,
      "nutrient": 24,
      "value": "99",
      "perc1on100gr": "0"
  },
  {
      "_id": 1730,
      "product": 120,
      "nutrient": 17,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1733,
      "product": 121,
      "nutrient": 0,
      "value": "9.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1734,
      "product": 121,
      "nutrient": 1,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1735,
      "product": 121,
      "nutrient": 2,
      "value": "52.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1736,
      "product": 121,
      "nutrient": 3,
      "value": "273",
      "perc1on100gr": "0"
  },
  {
      "_id": 1737,
      "product": 121,
      "nutrient": 45,
      "value": "5.98",
      "perc1on100gr": "0"
  },
  {
      "_id": 1738,
      "product": 121,
      "nutrient": 46,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1739,
      "product": 121,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 1740,
      "product": 121,
      "nutrient": 5,
      "value": "0.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 1741,
      "product": 121,
      "nutrient": 6,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 1742,
      "product": 121,
      "nutrient": 52,
      "value": "0.51",
      "perc1on100gr": "0"
  },
  {
      "_id": 1743,
      "product": 121,
      "nutrient": 8,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 1744,
      "product": 121,
      "nutrient": 9,
      "value": "111",
      "perc1on100gr": "0"
  },
  {
      "_id": 1745,
      "product": 121,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1746,
      "product": 121,
      "nutrient": 13,
      "value": "0.31",
      "perc1on100gr": "0"
  },
  {
      "_id": 1747,
      "product": 121,
      "nutrient": 15,
      "value": "3.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 1748,
      "product": 121,
      "nutrient": 16,
      "value": "15.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1749,
      "product": 121,
      "nutrient": 18,
      "value": "148",
      "perc1on100gr": "0"
  },
  {
      "_id": 1750,
      "product": 121,
      "nutrient": 19,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 1751,
      "product": 121,
      "nutrient": 21,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 1752,
      "product": 121,
      "nutrient": 22,
      "value": "433",
      "perc1on100gr": "0"
  },
  {
      "_id": 1753,
      "product": 121,
      "nutrient": 24,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 1754,
      "product": 121,
      "nutrient": 17,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1755,
      "product": 121,
      "nutrient": 32,
      "value": "0.88",
      "perc1on100gr": "0"
  },
  {
      "_id": 1756,
      "product": 121,
      "nutrient": 33,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1757,
      "product": 121,
      "nutrient": 38,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 1758,
      "product": 121,
      "nutrient": 41,
      "value": "14.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1759,
      "product": 121,
      "nutrient": 43,
      "value": "1.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1762,
      "product": 122,
      "nutrient": 1,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1763,
      "product": 122,
      "nutrient": 2,
      "value": "49.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1764,
      "product": 122,
      "nutrient": 3,
      "value": "255",
      "perc1on100gr": "0"
  },
  {
      "_id": 1765,
      "product": 122,
      "nutrient": 45,
      "value": "1.63",
      "perc1on100gr": "0"
  },
  {
      "_id": 1766,
      "product": 122,
      "nutrient": 46,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1767,
      "product": 122,
      "nutrient": 4,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1768,
      "product": 122,
      "nutrient": 5,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 1769,
      "product": 122,
      "nutrient": 6,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 1770,
      "product": 122,
      "nutrient": 52,
      "value": "0.45",
      "perc1on100gr": "0"
  },
  {
      "_id": 1771,
      "product": 122,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1772,
      "product": 122,
      "nutrient": 9,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 1773,
      "product": 122,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1774,
      "product": 122,
      "nutrient": 13,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 1775,
      "product": 122,
      "nutrient": 15,
      "value": "2.96",
      "perc1on100gr": "0"
  },
  {
      "_id": 1776,
      "product": 122,
      "nutrient": 16,
      "value": "15.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1777,
      "product": 122,
      "nutrient": 18,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 1778,
      "product": 122,
      "nutrient": 19,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1779,
      "product": 122,
      "nutrient": 21,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 1780,
      "product": 122,
      "nutrient": 22,
      "value": "590",
      "perc1on100gr": "0"
  },
  {
      "_id": 1781,
      "product": 122,
      "nutrient": 24,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 1782,
      "product": 122,
      "nutrient": 17,
      "value": "3.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 1783,
      "product": 122,
      "nutrient": 32,
      "value": "0.86",
      "perc1on100gr": "0"
  },
  {
      "_id": 1784,
      "product": 122,
      "nutrient": 33,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1785,
      "product": 122,
      "nutrient": 38,
      "value": "34.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1786,
      "product": 122,
      "nutrient": 43,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1789,
      "product": 123,
      "nutrient": 0,
      "value": "7.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1790,
      "product": 123,
      "nutrient": 1,
      "value": "5.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1791,
      "product": 123,
      "nutrient": 2,
      "value": "53.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1792,
      "product": 123,
      "nutrient": 3,
      "value": "294",
      "perc1on100gr": "0"
  },
  {
      "_id": 1793,
      "product": 123,
      "nutrient": 45,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1794,
      "product": 123,
      "nutrient": 46,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1795,
      "product": 123,
      "nutrient": 53,
      "value": "46.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1796,
      "product": 123,
      "nutrient": 5,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1797,
      "product": 123,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 1798,
      "product": 123,
      "nutrient": 52,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1799,
      "product": 123,
      "nutrient": 8,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1800,
      "product": 123,
      "nutrient": 9,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 1801,
      "product": 123,
      "nutrient": 13,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1802,
      "product": 123,
      "nutrient": 14,
      "value": "1.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1803,
      "product": 123,
      "nutrient": 15,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1804,
      "product": 123,
      "nutrient": 16,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 1805,
      "product": 123,
      "nutrient": 18,
      "value": "132",
      "perc1on100gr": "0"
  },
  {
      "_id": 1806,
      "product": 123,
      "nutrient": 19,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 1807,
      "product": 123,
      "nutrient": 21,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 1808,
      "product": 123,
      "nutrient": 22,
      "value": "279",
      "perc1on100gr": "0"
  },
  {
      "_id": 1809,
      "product": 123,
      "nutrient": 23,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 1810,
      "product": 123,
      "nutrient": 24,
      "value": "86",
      "perc1on100gr": "0"
  },
  {
      "_id": 1811,
      "product": 123,
      "nutrient": 25,
      "value": "485",
      "perc1on100gr": "0"
  },
  {
      "_id": 1812,
      "product": 123,
      "nutrient": 17,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1813,
      "product": 123,
      "nutrient": 29,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1814,
      "product": 123,
      "nutrient": 30,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1815,
      "product": 123,
      "nutrient": 32,
      "value": "0.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 1816,
      "product": 123,
      "nutrient": 33,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1817,
      "product": 123,
      "nutrient": 34,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1818,
      "product": 123,
      "nutrient": 41,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 1819,
      "product": 123,
      "nutrient": 42,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1820,
      "product": 123,
      "nutrient": 43,
      "value": "0.73",
      "perc1on100gr": "0"
  },
  {
      "_id": 1823,
      "product": 124,
      "nutrient": 0,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1824,
      "product": 124,
      "nutrient": 1,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1825,
      "product": 124,
      "nutrient": 2,
      "value": "52.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1826,
      "product": 124,
      "nutrient": 3,
      "value": "265",
      "perc1on100gr": "0"
  },
  {
      "_id": 1827,
      "product": 124,
      "nutrient": 45,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1828,
      "product": 124,
      "nutrient": 46,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1829,
      "product": 124,
      "nutrient": 53,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 1830,
      "product": 124,
      "nutrient": 5,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 1831,
      "product": 124,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 1832,
      "product": 124,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1833,
      "product": 124,
      "nutrient": 15,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1834,
      "product": 124,
      "nutrient": 18,
      "value": "97",
      "perc1on100gr": "0"
  },
  {
      "_id": 1835,
      "product": 124,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 1836,
      "product": 124,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1837,
      "product": 124,
      "nutrient": 22,
      "value": "437",
      "perc1on100gr": "0"
  },
  {
      "_id": 1838,
      "product": 124,
      "nutrient": 24,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 1841,
      "product": 125,
      "nutrient": 0,
      "value": "7.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1842,
      "product": 125,
      "nutrient": 1,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1843,
      "product": 125,
      "nutrient": 2,
      "value": "53.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1844,
      "product": 125,
      "nutrient": 3,
      "value": "337",
      "perc1on100gr": "0"
  },
  {
      "_id": 1845,
      "product": 125,
      "nutrient": 45,
      "value": "22.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1846,
      "product": 125,
      "nutrient": 46,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1847,
      "product": 125,
      "nutrient": 53,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 1848,
      "product": 125,
      "nutrient": 4,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 1849,
      "product": 125,
      "nutrient": 5,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1850,
      "product": 125,
      "nutrient": 6,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1851,
      "product": 125,
      "nutrient": 13,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1852,
      "product": 125,
      "nutrient": 15,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1853,
      "product": 125,
      "nutrient": 18,
      "value": "266",
      "perc1on100gr": "0"
  },
  {
      "_id": 1854,
      "product": 125,
      "nutrient": 19,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 1855,
      "product": 125,
      "nutrient": 21,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 1856,
      "product": 125,
      "nutrient": 22,
      "value": "234",
      "perc1on100gr": "0"
  },
  {
      "_id": 1857,
      "product": 125,
      "nutrient": 24,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 1858,
      "product": 125,
      "nutrient": 17,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1859,
      "product": 125,
      "nutrient": 47,
      "value": "72",
      "perc1on100gr": "0"
  },
  {
      "_id": 1862,
      "product": 126,
      "nutrient": 0,
      "value": "8.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1863,
      "product": 126,
      "nutrient": 1,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1864,
      "product": 126,
      "nutrient": 2,
      "value": "50.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1865,
      "product": 126,
      "nutrient": 3,
      "value": "257",
      "perc1on100gr": "0"
  },
  {
      "_id": 1866,
      "product": 126,
      "nutrient": 45,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1867,
      "product": 126,
      "nutrient": 46,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1868,
      "product": 126,
      "nutrient": 53,
      "value": "48.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1869,
      "product": 126,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1870,
      "product": 126,
      "nutrient": 5,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 1871,
      "product": 126,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 1872,
      "product": 126,
      "nutrient": 13,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1873,
      "product": 126,
      "nutrient": 15,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1874,
      "product": 126,
      "nutrient": 18,
      "value": "157",
      "perc1on100gr": "0"
  },
  {
      "_id": 1875,
      "product": 126,
      "nutrient": 19,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 1876,
      "product": 126,
      "nutrient": 21,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1877,
      "product": 126,
      "nutrient": 22,
      "value": "359",
      "perc1on100gr": "0"
  },
  {
      "_id": 1878,
      "product": 126,
      "nutrient": 24,
      "value": "105",
      "perc1on100gr": "0"
  },
  {
      "_id": 1879,
      "product": 126,
      "nutrient": 47,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1882,
      "product": 127,
      "nutrient": 0,
      "value": "7.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1883,
      "product": 127,
      "nutrient": 1,
      "value": "9.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1884,
      "product": 127,
      "nutrient": 2,
      "value": "55.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1885,
      "product": 127,
      "nutrient": 3,
      "value": "339",
      "perc1on100gr": "0"
  },
  {
      "_id": 1886,
      "product": 127,
      "nutrient": 45,
      "value": "15.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1887,
      "product": 127,
      "nutrient": 46,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1888,
      "product": 127,
      "nutrient": 53,
      "value": "39.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1889,
      "product": 127,
      "nutrient": 4,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 1890,
      "product": 127,
      "nutrient": 5,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 1891,
      "product": 127,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 1892,
      "product": 127,
      "nutrient": 13,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1893,
      "product": 127,
      "nutrient": 15,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1894,
      "product": 127,
      "nutrient": 18,
      "value": "114",
      "perc1on100gr": "0"
  },
  {
      "_id": 1895,
      "product": 127,
      "nutrient": 19,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 1896,
      "product": 127,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1897,
      "product": 127,
      "nutrient": 22,
      "value": "268",
      "perc1on100gr": "0"
  },
  {
      "_id": 1898,
      "product": 127,
      "nutrient": 24,
      "value": "89",
      "perc1on100gr": "0"
  },
  {
      "_id": 1899,
      "product": 127,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1900,
      "product": 127,
      "nutrient": 47,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 1903,
      "product": 128,
      "nutrient": 0,
      "value": "8.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1904,
      "product": 128,
      "nutrient": 1,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1905,
      "product": 128,
      "nutrient": 2,
      "value": "53.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1906,
      "product": 128,
      "nutrient": 3,
      "value": "269",
      "perc1on100gr": "0"
  },
  {
      "_id": 1907,
      "product": 128,
      "nutrient": 45,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1908,
      "product": 128,
      "nutrient": 46,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1909,
      "product": 128,
      "nutrient": 53,
      "value": "52.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1910,
      "product": 128,
      "nutrient": 5,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1911,
      "product": 128,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1912,
      "product": 128,
      "nutrient": 18,
      "value": "117",
      "perc1on100gr": "0"
  },
  {
      "_id": 1913,
      "product": 128,
      "nutrient": 19,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 1914,
      "product": 128,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1915,
      "product": 128,
      "nutrient": 22,
      "value": "456",
      "perc1on100gr": "0"
  },
  {
      "_id": 1916,
      "product": 128,
      "nutrient": 24,
      "value": "82",
      "perc1on100gr": "0"
  },
  {
      "_id": 1919,
      "product": 129,
      "nutrient": 0,
      "value": "8.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1920,
      "product": 129,
      "nutrient": 1,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1921,
      "product": 129,
      "nutrient": 2,
      "value": "53.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1922,
      "product": 129,
      "nutrient": 3,
      "value": "269",
      "perc1on100gr": "0"
  },
  {
      "_id": 1923,
      "product": 129,
      "nutrient": 45,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1924,
      "product": 129,
      "nutrient": 46,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1925,
      "product": 129,
      "nutrient": 53,
      "value": "51.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1926,
      "product": 129,
      "nutrient": 5,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 1927,
      "product": 129,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 1928,
      "product": 129,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1929,
      "product": 129,
      "nutrient": 15,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1930,
      "product": 129,
      "nutrient": 18,
      "value": "127",
      "perc1on100gr": "0"
  },
  {
      "_id": 1931,
      "product": 129,
      "nutrient": 19,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 1932,
      "product": 129,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 1933,
      "product": 129,
      "nutrient": 22,
      "value": "456",
      "perc1on100gr": "0"
  },
  {
      "_id": 1934,
      "product": 129,
      "nutrient": 24,
      "value": "87",
      "perc1on100gr": "0"
  },
  {
      "_id": 1937,
      "product": 130,
      "nutrient": 0,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1938,
      "product": 130,
      "nutrient": 1,
      "value": "30.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1939,
      "product": 130,
      "nutrient": 2,
      "value": "62.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1940,
      "product": 130,
      "nutrient": 3,
      "value": "542",
      "perc1on100gr": "0"
  },
  {
      "_id": 1941,
      "product": 130,
      "nutrient": 45,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 1942,
      "product": 130,
      "nutrient": 46,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1943,
      "product": 130,
      "nutrient": 53,
      "value": "24.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1944,
      "product": 130,
      "nutrient": 4,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1945,
      "product": 130,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 1946,
      "product": 130,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 1947,
      "product": 130,
      "nutrient": 13,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1948,
      "product": 130,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1949,
      "product": 130,
      "nutrient": 18,
      "value": "48",
      "perc1on100gr": "0"
  },
  {
      "_id": 1950,
      "product": 130,
      "nutrient": 19,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1951,
      "product": 130,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1952,
      "product": 130,
      "nutrient": 22,
      "value": "89",
      "perc1on100gr": "0"
  },
  {
      "_id": 1953,
      "product": 130,
      "nutrient": 24,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 1954,
      "product": 130,
      "nutrient": 17,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1955,
      "product": 130,
      "nutrient": 47,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1958,
      "product": 131,
      "nutrient": 0,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 1959,
      "product": 131,
      "nutrient": 1,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1960,
      "product": 131,
      "nutrient": 2,
      "value": "77.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1961,
      "product": 131,
      "nutrient": 3,
      "value": "354",
      "perc1on100gr": "0"
  },
  {
      "_id": 1962,
      "product": 131,
      "nutrient": 45,
      "value": "67.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1963,
      "product": 131,
      "nutrient": 46,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 1964,
      "product": 131,
      "nutrient": 53,
      "value": "10.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1965,
      "product": 131,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1966,
      "product": 131,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 1967,
      "product": 131,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1968,
      "product": 131,
      "nutrient": 13,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1969,
      "product": 131,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1970,
      "product": 131,
      "nutrient": 18,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 1971,
      "product": 131,
      "nutrient": 19,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 1972,
      "product": 131,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 1973,
      "product": 131,
      "nutrient": 22,
      "value": "49",
      "perc1on100gr": "0"
  },
  {
      "_id": 1974,
      "product": 131,
      "nutrient": 24,
      "value": "36",
      "perc1on100gr": "0"
  },
  {
      "_id": 1975,
      "product": 131,
      "nutrient": 17,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 1976,
      "product": 131,
      "nutrient": 47,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1979,
      "product": 132,
      "nutrient": 0,
      "value": "9.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1980,
      "product": 132,
      "nutrient": 1,
      "value": "10.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1981,
      "product": 132,
      "nutrient": 2,
      "value": "65.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1982,
      "product": 132,
      "nutrient": 3,
      "value": "393",
      "perc1on100gr": "0"
  },
  {
      "_id": 1983,
      "product": 132,
      "nutrient": 45,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 1984,
      "product": 132,
      "nutrient": 46,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 1985,
      "product": 132,
      "nutrient": 53,
      "value": "64.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 1986,
      "product": 132,
      "nutrient": 4,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 1987,
      "product": 132,
      "nutrient": 5,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 1988,
      "product": 132,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 1989,
      "product": 132,
      "nutrient": 13,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 1990,
      "product": 132,
      "nutrient": 15,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 1991,
      "product": 132,
      "nutrient": 18,
      "value": "133",
      "perc1on100gr": "0"
  },
  {
      "_id": 1992,
      "product": 132,
      "nutrient": 19,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 1993,
      "product": 132,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 1994,
      "product": 132,
      "nutrient": 22,
      "value": "550",
      "perc1on100gr": "0"
  },
  {
      "_id": 1995,
      "product": 132,
      "nutrient": 24,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 1996,
      "product": 132,
      "nutrient": 17,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 1997,
      "product": 132,
      "nutrient": 47,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2000,
      "product": 133,
      "nutrient": 0,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2001,
      "product": 133,
      "nutrient": 1,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2002,
      "product": 133,
      "nutrient": 2,
      "value": "69.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2003,
      "product": 133,
      "nutrient": 3,
      "value": "345",
      "perc1on100gr": "0"
  },
  {
      "_id": 2004,
      "product": 133,
      "nutrient": 45,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2005,
      "product": 133,
      "nutrient": 46,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2006,
      "product": 133,
      "nutrient": 53,
      "value": "66.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2007,
      "product": 133,
      "nutrient": 5,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2008,
      "product": 133,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2009,
      "product": 133,
      "nutrient": 13,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2010,
      "product": 133,
      "nutrient": 15,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2011,
      "product": 133,
      "nutrient": 18,
      "value": "191",
      "perc1on100gr": "0"
  },
  {
      "_id": 2012,
      "product": 133,
      "nutrient": 19,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 2013,
      "product": 133,
      "nutrient": 21,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 2014,
      "product": 133,
      "nutrient": 22,
      "value": "697",
      "perc1on100gr": "0"
  },
  {
      "_id": 2015,
      "product": 133,
      "nutrient": 24,
      "value": "125",
      "perc1on100gr": "0"
  },
  {
      "_id": 2016,
      "product": 133,
      "nutrient": 17,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2019,
      "product": 134,
      "nutrient": 0,
      "value": "11.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2020,
      "product": 134,
      "nutrient": 1,
      "value": "6.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2021,
      "product": 134,
      "nutrient": 2,
      "value": "68.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2022,
      "product": 134,
      "nutrient": 3,
      "value": "407",
      "perc1on100gr": "0"
  },
  {
      "_id": 2023,
      "product": 134,
      "nutrient": 46,
      "value": "5.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2024,
      "product": 134,
      "nutrient": 5,
      "value": "0.62",
      "perc1on100gr": "0"
  },
  {
      "_id": 2025,
      "product": 134,
      "nutrient": 6,
      "value": "0.27",
      "perc1on100gr": "0"
  },
  {
      "_id": 2026,
      "product": 134,
      "nutrient": 52,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 2027,
      "product": 134,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2028,
      "product": 134,
      "nutrient": 9,
      "value": "132",
      "perc1on100gr": "0"
  },
  {
      "_id": 2029,
      "product": 134,
      "nutrient": 15,
      "value": "5.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 2030,
      "product": 134,
      "nutrient": 18,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 2031,
      "product": 134,
      "nutrient": 19,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 2032,
      "product": 134,
      "nutrient": 21,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 2033,
      "product": 134,
      "nutrient": 22,
      "value": "698",
      "perc1on100gr": "0"
  },
  {
      "_id": 2034,
      "product": 134,
      "nutrient": 24,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 2035,
      "product": 134,
      "nutrient": 17,
      "value": "4.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2036,
      "product": 134,
      "nutrient": 32,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2037,
      "product": 134,
      "nutrient": 33,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2038,
      "product": 134,
      "nutrient": 38,
      "value": "37.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2039,
      "product": 134,
      "nutrient": 43,
      "value": "0.89",
      "perc1on100gr": "0"
  },
  {
      "_id": 2042,
      "product": 135,
      "nutrient": 0,
      "value": "12.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2043,
      "product": 135,
      "nutrient": 1,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2044,
      "product": 135,
      "nutrient": 2,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2045,
      "product": 135,
      "nutrient": 3,
      "value": "109",
      "perc1on100gr": "0"
  },
  {
      "_id": 2046,
      "product": 135,
      "nutrient": 45,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2047,
      "product": 135,
      "nutrient": 5,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2048,
      "product": 135,
      "nutrient": 6,
      "value": "0.68",
      "perc1on100gr": "0"
  },
  {
      "_id": 2049,
      "product": 135,
      "nutrient": 52,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2050,
      "product": 135,
      "nutrient": 8,
      "value": "0.58",
      "perc1on100gr": "0"
  },
  {
      "_id": 2051,
      "product": 135,
      "nutrient": 9,
      "value": "550",
      "perc1on100gr": "0"
  },
  {
      "_id": 2052,
      "product": 135,
      "nutrient": 13,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2053,
      "product": 135,
      "nutrient": 14,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 2054,
      "product": 135,
      "nutrient": 15,
      "value": "11.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2055,
      "product": 135,
      "nutrient": 18,
      "value": "590",
      "perc1on100gr": "0"
  },
  {
      "_id": 2056,
      "product": 135,
      "nutrient": 19,
      "value": "27",
      "perc1on100gr": "0"
  },
  {
      "_id": 2057,
      "product": 135,
      "nutrient": 21,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 2058,
      "product": 135,
      "nutrient": 22,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2059,
      "product": 135,
      "nutrient": 24,
      "value": "400",
      "perc1on100gr": "0"
  },
  {
      "_id": 2060,
      "product": 135,
      "nutrient": 25,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2061,
      "product": 135,
      "nutrient": 17,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2062,
      "product": 135,
      "nutrient": 29,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2063,
      "product": 135,
      "nutrient": 32,
      "value": "4.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2064,
      "product": 135,
      "nutrient": 33,
      "value": "0.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 2065,
      "product": 135,
      "nutrient": 34,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2066,
      "product": 135,
      "nutrient": 43,
      "value": "1.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2067,
      "product": 135,
      "nutrient": 47,
      "value": "260",
      "perc1on100gr": "0"
  },
  {
      "_id": 2070,
      "product": 136,
      "nutrient": 0,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2071,
      "product": 136,
      "nutrient": 1,
      "value": "6.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2072,
      "product": 136,
      "nutrient": 2,
      "value": "16.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2073,
      "product": 136,
      "nutrient": 3,
      "value": "137",
      "perc1on100gr": "0"
  },
  {
      "_id": 2074,
      "product": 136,
      "nutrient": 45,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2075,
      "product": 136,
      "nutrient": 46,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2076,
      "product": 136,
      "nutrient": 53,
      "value": "11.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2077,
      "product": 136,
      "nutrient": 4,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 2078,
      "product": 136,
      "nutrient": 5,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 2079,
      "product": 136,
      "nutrient": 6,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 2080,
      "product": 136,
      "nutrient": 11,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2081,
      "product": 136,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2082,
      "product": 136,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2083,
      "product": 136,
      "nutrient": 18,
      "value": "245",
      "perc1on100gr": "0"
  },
  {
      "_id": 2084,
      "product": 136,
      "nutrient": 19,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 2085,
      "product": 136,
      "nutrient": 21,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 2086,
      "product": 136,
      "nutrient": 22,
      "value": "400",
      "perc1on100gr": "0"
  },
  {
      "_id": 2087,
      "product": 136,
      "nutrient": 24,
      "value": "102",
      "perc1on100gr": "0"
  },
  {
      "_id": 2088,
      "product": 136,
      "nutrient": 17,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2089,
      "product": 136,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2092,
      "product": 137,
      "nutrient": 0,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2093,
      "product": 137,
      "nutrient": 1,
      "value": "5.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2094,
      "product": 137,
      "nutrient": 2,
      "value": "13.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2095,
      "product": 137,
      "nutrient": 3,
      "value": "114",
      "perc1on100gr": "0"
  },
  {
      "_id": 2096,
      "product": 137,
      "nutrient": 45,
      "value": "4.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2097,
      "product": 137,
      "nutrient": 46,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2098,
      "product": 137,
      "nutrient": 53,
      "value": "8.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2099,
      "product": 137,
      "nutrient": 4,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2100,
      "product": 137,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 2101,
      "product": 137,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 2102,
      "product": 137,
      "nutrient": 11,
      "value": "22.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2103,
      "product": 137,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2104,
      "product": 137,
      "nutrient": 15,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2105,
      "product": 137,
      "nutrient": 18,
      "value": "284",
      "perc1on100gr": "0"
  },
  {
      "_id": 2106,
      "product": 137,
      "nutrient": 19,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 2107,
      "product": 137,
      "nutrient": 21,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 2108,
      "product": 137,
      "nutrient": 22,
      "value": "293",
      "perc1on100gr": "0"
  },
  {
      "_id": 2109,
      "product": 137,
      "nutrient": 24,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2110,
      "product": 137,
      "nutrient": 17,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2111,
      "product": 137,
      "nutrient": 47,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2114,
      "product": 138,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2115,
      "product": 138,
      "nutrient": 1,
      "value": "5.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2116,
      "product": 138,
      "nutrient": 2,
      "value": "17.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2117,
      "product": 138,
      "nutrient": 3,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 2118,
      "product": 138,
      "nutrient": 45,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2119,
      "product": 138,
      "nutrient": 46,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2120,
      "product": 138,
      "nutrient": 53,
      "value": "15.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2121,
      "product": 138,
      "nutrient": 4,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 2122,
      "product": 138,
      "nutrient": 5,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2123,
      "product": 138,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2124,
      "product": 138,
      "nutrient": 11,
      "value": "5.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2125,
      "product": 138,
      "nutrient": 13,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2126,
      "product": 138,
      "nutrient": 15,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2127,
      "product": 138,
      "nutrient": 18,
      "value": "489",
      "perc1on100gr": "0"
  },
  {
      "_id": 2128,
      "product": 138,
      "nutrient": 19,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 2129,
      "product": 138,
      "nutrient": 21,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2130,
      "product": 138,
      "nutrient": 22,
      "value": "375",
      "perc1on100gr": "0"
  },
  {
      "_id": 2131,
      "product": 138,
      "nutrient": 24,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 2132,
      "product": 138,
      "nutrient": 17,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2133,
      "product": 138,
      "nutrient": 47,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 2136,
      "product": 139,
      "nutrient": 0,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2137,
      "product": 139,
      "nutrient": 1,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2138,
      "product": 139,
      "nutrient": 2,
      "value": "17.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2139,
      "product": 139,
      "nutrient": 3,
      "value": "128",
      "perc1on100gr": "0"
  },
  {
      "_id": 2140,
      "product": 139,
      "nutrient": 45,
      "value": "9.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2141,
      "product": 139,
      "nutrient": 46,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2142,
      "product": 139,
      "nutrient": 53,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2143,
      "product": 139,
      "nutrient": 4,
      "value": "1030",
      "perc1on100gr": "0"
  },
  {
      "_id": 2144,
      "product": 139,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2145,
      "product": 139,
      "nutrient": 6,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2146,
      "product": 139,
      "nutrient": 11,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2147,
      "product": 139,
      "nutrient": 13,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2148,
      "product": 139,
      "nutrient": 15,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2149,
      "product": 139,
      "nutrient": 18,
      "value": "227",
      "perc1on100gr": "0"
  },
  {
      "_id": 2150,
      "product": 139,
      "nutrient": 19,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 2151,
      "product": 139,
      "nutrient": 21,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2152,
      "product": 139,
      "nutrient": 22,
      "value": "402",
      "perc1on100gr": "0"
  },
  {
      "_id": 2153,
      "product": 139,
      "nutrient": 24,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 2154,
      "product": 139,
      "nutrient": 17,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2155,
      "product": 139,
      "nutrient": 47,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2158,
      "product": 140,
      "nutrient": 0,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2159,
      "product": 140,
      "nutrient": 1,
      "value": "5.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2160,
      "product": 140,
      "nutrient": 2,
      "value": "19.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2161,
      "product": 140,
      "nutrient": 3,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 2162,
      "product": 140,
      "nutrient": 45,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2163,
      "product": 140,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 2164,
      "product": 140,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 2165,
      "product": 140,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 2166,
      "product": 140,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2167,
      "product": 140,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2168,
      "product": 140,
      "nutrient": 18,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 2169,
      "product": 140,
      "nutrient": 19,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 2170,
      "product": 140,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 2171,
      "product": 140,
      "nutrient": 22,
      "value": "452",
      "perc1on100gr": "0"
  },
  {
      "_id": 2172,
      "product": 140,
      "nutrient": 24,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2173,
      "product": 140,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2174,
      "product": 140,
      "nutrient": 47,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2177,
      "product": 141,
      "nutrient": 0,
      "value": "5.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2178,
      "product": 141,
      "nutrient": 1,
      "value": "7.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2179,
      "product": 141,
      "nutrient": 2,
      "value": "26.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2180,
      "product": 141,
      "nutrient": 3,
      "value": "189",
      "perc1on100gr": "0"
  },
  {
      "_id": 2181,
      "product": 141,
      "nutrient": 45,
      "value": "6.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2182,
      "product": 141,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2183,
      "product": 141,
      "nutrient": 53,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 2184,
      "product": 141,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2185,
      "product": 141,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2186,
      "product": 141,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2187,
      "product": 141,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2188,
      "product": 141,
      "nutrient": 15,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2189,
      "product": 141,
      "nutrient": 18,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 2190,
      "product": 141,
      "nutrient": 19,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 2191,
      "product": 141,
      "nutrient": 21,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 2192,
      "product": 141,
      "nutrient": 22,
      "value": "332",
      "perc1on100gr": "0"
  },
  {
      "_id": 2193,
      "product": 141,
      "nutrient": 24,
      "value": "86",
      "perc1on100gr": "0"
  },
  {
      "_id": 2194,
      "product": 141,
      "nutrient": 17,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2195,
      "product": 141,
      "nutrient": 47,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 2198,
      "product": 142,
      "nutrient": 0,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2199,
      "product": 142,
      "nutrient": 1,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2200,
      "product": 142,
      "nutrient": 2,
      "value": "19.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2201,
      "product": 142,
      "nutrient": 3,
      "value": "131",
      "perc1on100gr": "0"
  },
  {
      "_id": 2202,
      "product": 142,
      "nutrient": 45,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2203,
      "product": 142,
      "nutrient": 46,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2204,
      "product": 142,
      "nutrient": 53,
      "value": "18.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2205,
      "product": 142,
      "nutrient": 4,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2206,
      "product": 142,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 2207,
      "product": 142,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 2208,
      "product": 142,
      "nutrient": 13,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2209,
      "product": 142,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2210,
      "product": 142,
      "nutrient": 18,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2211,
      "product": 142,
      "nutrient": 19,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 2212,
      "product": 142,
      "nutrient": 21,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2213,
      "product": 142,
      "nutrient": 22,
      "value": "142",
      "perc1on100gr": "0"
  },
  {
      "_id": 2214,
      "product": 142,
      "nutrient": 24,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 2215,
      "product": 142,
      "nutrient": 17,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2216,
      "product": 142,
      "nutrient": 47,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 2219,
      "product": 143,
      "nutrient": 0,
      "value": "7.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2220,
      "product": 143,
      "nutrient": 1,
      "value": "15.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2221,
      "product": 143,
      "nutrient": 2,
      "value": "67.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2222,
      "product": 143,
      "nutrient": 3,
      "value": "455",
      "perc1on100gr": "0"
  },
  {
      "_id": 2223,
      "product": 143,
      "nutrient": 45,
      "value": "16.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 2224,
      "product": 143,
      "nutrient": 46,
      "value": "1.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2225,
      "product": 143,
      "nutrient": 4,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2226,
      "product": 143,
      "nutrient": 5,
      "value": "0.54",
      "perc1on100gr": "0"
  },
  {
      "_id": 2227,
      "product": 143,
      "nutrient": 6,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2228,
      "product": 143,
      "nutrient": 52,
      "value": "0.41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2229,
      "product": 143,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 2230,
      "product": 143,
      "nutrient": 9,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 2231,
      "product": 143,
      "nutrient": 10,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2232,
      "product": 143,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2233,
      "product": 143,
      "nutrient": 13,
      "value": "1.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 2234,
      "product": 143,
      "nutrient": 52,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2235,
      "product": 143,
      "nutrient": 15,
      "value": "4.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 2236,
      "product": 143,
      "nutrient": 16,
      "value": "13.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2237,
      "product": 143,
      "nutrient": 18,
      "value": "114",
      "perc1on100gr": "0"
  },
  {
      "_id": 2238,
      "product": 143,
      "nutrient": 19,
      "value": "172",
      "perc1on100gr": "0"
  },
  {
      "_id": 2239,
      "product": 143,
      "nutrient": 21,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 2240,
      "product": 143,
      "nutrient": 22,
      "value": "592",
      "perc1on100gr": "0"
  },
  {
      "_id": 2241,
      "product": 143,
      "nutrient": 24,
      "value": "303",
      "perc1on100gr": "0"
  },
  {
      "_id": 2242,
      "product": 143,
      "nutrient": 17,
      "value": "3.58",
      "perc1on100gr": "0"
  },
  {
      "_id": 2243,
      "product": 143,
      "nutrient": 32,
      "value": "0.55",
      "perc1on100gr": "0"
  },
  {
      "_id": 2244,
      "product": 143,
      "nutrient": 33,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2245,
      "product": 143,
      "nutrient": 38,
      "value": "15.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2246,
      "product": 143,
      "nutrient": 43,
      "value": "0.67",
      "perc1on100gr": "0"
  },
  {
      "_id": 2247,
      "product": 143,
      "nutrient": 47,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2250,
      "product": 144,
      "nutrient": 0,
      "value": "8.95",
      "perc1on100gr": "0"
  },
  {
      "_id": 2251,
      "product": 144,
      "nutrient": 1,
      "value": "17.36",
      "perc1on100gr": "0"
  },
  {
      "_id": 2252,
      "product": 144,
      "nutrient": 2,
      "value": "63.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2253,
      "product": 144,
      "nutrient": 3,
      "value": "456",
      "perc1on100gr": "0"
  },
  {
      "_id": 2254,
      "product": 144,
      "nutrient": 45,
      "value": "13.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2255,
      "product": 144,
      "nutrient": 46,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2256,
      "product": 144,
      "nutrient": 53,
      "value": "47.97",
      "perc1on100gr": "0"
  },
  {
      "_id": 2257,
      "product": 144,
      "nutrient": 5,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2258,
      "product": 144,
      "nutrient": 6,
      "value": "0.29",
      "perc1on100gr": "0"
  },
  {
      "_id": 2259,
      "product": 144,
      "nutrient": 52,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2260,
      "product": 144,
      "nutrient": 8,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 2261,
      "product": 144,
      "nutrient": 9,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 2262,
      "product": 144,
      "nutrient": 10,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2263,
      "product": 144,
      "nutrient": 13,
      "value": "1.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2264,
      "product": 144,
      "nutrient": 52,
      "value": "35.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2265,
      "product": 144,
      "nutrient": 15,
      "value": "4.98",
      "perc1on100gr": "0"
  },
  {
      "_id": 2266,
      "product": 144,
      "nutrient": 16,
      "value": "27.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2267,
      "product": 144,
      "nutrient": 18,
      "value": "207",
      "perc1on100gr": "0"
  },
  {
      "_id": 2268,
      "product": 144,
      "nutrient": 19,
      "value": "81",
      "perc1on100gr": "0"
  },
  {
      "_id": 2269,
      "product": 144,
      "nutrient": 21,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 2270,
      "product": 144,
      "nutrient": 22,
      "value": "918",
      "perc1on100gr": "0"
  },
  {
      "_id": 2271,
      "product": 144,
      "nutrient": 24,
      "value": "257",
      "perc1on100gr": "0"
  },
  {
      "_id": 2272,
      "product": 144,
      "nutrient": 17,
      "value": "4.69",
      "perc1on100gr": "0"
  },
  {
      "_id": 2273,
      "product": 144,
      "nutrient": 32,
      "value": "2.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2274,
      "product": 144,
      "nutrient": 33,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2275,
      "product": 144,
      "nutrient": 38,
      "value": "12.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2276,
      "product": 144,
      "nutrient": 43,
      "value": "1.73",
      "perc1on100gr": "0"
  },
  {
      "_id": 2279,
      "product": 145,
      "nutrient": 0,
      "value": "9.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2280,
      "product": 145,
      "nutrient": 1,
      "value": "14.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2281,
      "product": 145,
      "nutrient": 2,
      "value": "63.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2282,
      "product": 145,
      "nutrient": 3,
      "value": "416",
      "perc1on100gr": "0"
  },
  {
      "_id": 2283,
      "product": 145,
      "nutrient": 45,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2284,
      "product": 145,
      "nutrient": 46,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2285,
      "product": 145,
      "nutrient": 53,
      "value": "62.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2286,
      "product": 145,
      "nutrient": 5,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 2287,
      "product": 145,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 2288,
      "product": 145,
      "nutrient": 13,
      "value": "6.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2289,
      "product": 145,
      "nutrient": 15,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2290,
      "product": 145,
      "nutrient": 18,
      "value": "151",
      "perc1on100gr": "0"
  },
  {
      "_id": 2291,
      "product": 145,
      "nutrient": 19,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 2292,
      "product": 145,
      "nutrient": 21,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 2293,
      "product": 145,
      "nutrient": 22,
      "value": "430",
      "perc1on100gr": "0"
  },
  {
      "_id": 2294,
      "product": 145,
      "nutrient": 24,
      "value": "107",
      "perc1on100gr": "0"
  },
  {
      "_id": 2295,
      "product": 145,
      "nutrient": 17,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2298,
      "product": 146,
      "nutrient": 0,
      "value": "8.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2299,
      "product": 146,
      "nutrient": 1,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2300,
      "product": 146,
      "nutrient": 2,
      "value": "43.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2301,
      "product": 146,
      "nutrient": 3,
      "value": "406",
      "perc1on100gr": "0"
  },
  {
      "_id": 2302,
      "product": 146,
      "nutrient": 45,
      "value": "11.26",
      "perc1on100gr": "0"
  },
  {
      "_id": 2303,
      "product": 146,
      "nutrient": 46,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2304,
      "product": 146,
      "nutrient": 4,
      "value": "206",
      "perc1on100gr": "0"
  },
  {
      "_id": 2305,
      "product": 146,
      "nutrient": 5,
      "value": "0.39",
      "perc1on100gr": "0"
  },
  {
      "_id": 2306,
      "product": 146,
      "nutrient": 6,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2307,
      "product": 146,
      "nutrient": 52,
      "value": "0.86",
      "perc1on100gr": "0"
  },
  {
      "_id": 2308,
      "product": 146,
      "nutrient": 8,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2309,
      "product": 146,
      "nutrient": 9,
      "value": "88",
      "perc1on100gr": "0"
  },
  {
      "_id": 2310,
      "product": 146,
      "nutrient": 10,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2311,
      "product": 146,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2312,
      "product": 146,
      "nutrient": 13,
      "value": "0.84",
      "perc1on100gr": "0"
  },
  {
      "_id": 2313,
      "product": 146,
      "nutrient": 52,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2314,
      "product": 146,
      "nutrient": 15,
      "value": "2.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2315,
      "product": 146,
      "nutrient": 16,
      "value": "38.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2316,
      "product": 146,
      "nutrient": 18,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 2317,
      "product": 146,
      "nutrient": 19,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 2318,
      "product": 146,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2319,
      "product": 146,
      "nutrient": 22,
      "value": "347",
      "perc1on100gr": "0"
  },
  {
      "_id": 2320,
      "product": 146,
      "nutrient": 24,
      "value": "105",
      "perc1on100gr": "0"
  },
  {
      "_id": 2321,
      "product": 146,
      "nutrient": 17,
      "value": "2.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2322,
      "product": 146,
      "nutrient": 32,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2323,
      "product": 146,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2324,
      "product": 146,
      "nutrient": 38,
      "value": "22.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2325,
      "product": 146,
      "nutrient": 43,
      "value": "0.75",
      "perc1on100gr": "0"
  },
  {
      "_id": 2326,
      "product": 146,
      "nutrient": 47,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 2329,
      "product": 147,
      "nutrient": 0,
      "value": "9.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2330,
      "product": 147,
      "nutrient": 1,
      "value": "20.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2331,
      "product": 147,
      "nutrient": 2,
      "value": "44.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2332,
      "product": 147,
      "nutrient": 3,
      "value": "414",
      "perc1on100gr": "0"
  },
  {
      "_id": 2333,
      "product": 147,
      "nutrient": 45,
      "value": "11.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 2334,
      "product": 147,
      "nutrient": 46,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2335,
      "product": 147,
      "nutrient": 4,
      "value": "204",
      "perc1on100gr": "0"
  },
  {
      "_id": 2336,
      "product": 147,
      "nutrient": 5,
      "value": "0.52",
      "perc1on100gr": "0"
  },
  {
      "_id": 2337,
      "product": 147,
      "nutrient": 6,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2338,
      "product": 147,
      "nutrient": 52,
      "value": "0.84",
      "perc1on100gr": "0"
  },
  {
      "_id": 2339,
      "product": 147,
      "nutrient": 8,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2340,
      "product": 147,
      "nutrient": 9,
      "value": "74",
      "perc1on100gr": "0"
  },
  {
      "_id": 2341,
      "product": 147,
      "nutrient": 10,
      "value": "0.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 2342,
      "product": 147,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2343,
      "product": 147,
      "nutrient": 13,
      "value": "1.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 2344,
      "product": 147,
      "nutrient": 52,
      "value": "10.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2345,
      "product": 147,
      "nutrient": 15,
      "value": "2.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2346,
      "product": 147,
      "nutrient": 16,
      "value": "38.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2347,
      "product": 147,
      "nutrient": 18,
      "value": "132",
      "perc1on100gr": "0"
  },
  {
      "_id": 2348,
      "product": 147,
      "nutrient": 19,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 2349,
      "product": 147,
      "nutrient": 21,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2350,
      "product": 147,
      "nutrient": 22,
      "value": "361",
      "perc1on100gr": "0"
  },
  {
      "_id": 2351,
      "product": 147,
      "nutrient": 24,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 2352,
      "product": 147,
      "nutrient": 17,
      "value": "2.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 2353,
      "product": 147,
      "nutrient": 32,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 2354,
      "product": 147,
      "nutrient": 33,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2355,
      "product": 147,
      "nutrient": 38,
      "value": "26.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2356,
      "product": 147,
      "nutrient": 43,
      "value": "0.94",
      "perc1on100gr": "0"
  },
  {
      "_id": 2357,
      "product": 147,
      "nutrient": 47,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 2360,
      "product": 148,
      "nutrient": 0,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2361,
      "product": 148,
      "nutrient": 1,
      "value": "8.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2362,
      "product": 148,
      "nutrient": 2,
      "value": "34.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2363,
      "product": 148,
      "nutrient": 3,
      "value": "254",
      "perc1on100gr": "0"
  },
  {
      "_id": 2364,
      "product": 148,
      "nutrient": 46,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2365,
      "product": 148,
      "nutrient": 4,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 2366,
      "product": 148,
      "nutrient": 5,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2367,
      "product": 148,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2368,
      "product": 148,
      "nutrient": 52,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2369,
      "product": 148,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2370,
      "product": 148,
      "nutrient": 9,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 2371,
      "product": 148,
      "nutrient": 10,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2372,
      "product": 148,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2373,
      "product": 148,
      "nutrient": 18,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 2374,
      "product": 148,
      "nutrient": 19,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 2375,
      "product": 148,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 2376,
      "product": 148,
      "nutrient": 22,
      "value": "274",
      "perc1on100gr": "0"
  },
  {
      "_id": 2377,
      "product": 148,
      "nutrient": 24,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 2378,
      "product": 148,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2379,
      "product": 148,
      "nutrient": 32,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2380,
      "product": 148,
      "nutrient": 33,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 2381,
      "product": 148,
      "nutrient": 38,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2382,
      "product": 148,
      "nutrient": 43,
      "value": "1.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2383,
      "product": 148,
      "nutrient": 47,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 2386,
      "product": 149,
      "nutrient": 0,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2387,
      "product": 149,
      "nutrient": 1,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2388,
      "product": 149,
      "nutrient": 2,
      "value": "19.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2389,
      "product": 149,
      "nutrient": 3,
      "value": "158",
      "perc1on100gr": "0"
  },
  {
      "_id": 2390,
      "product": 149,
      "nutrient": 45,
      "value": "8.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2391,
      "product": 149,
      "nutrient": 46,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2392,
      "product": 149,
      "nutrient": 53,
      "value": "11.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2393,
      "product": 149,
      "nutrient": 4,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 2394,
      "product": 149,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2395,
      "product": 149,
      "nutrient": 6,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2396,
      "product": 149,
      "nutrient": 11,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2397,
      "product": 149,
      "nutrient": 13,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2398,
      "product": 149,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2399,
      "product": 149,
      "nutrient": 18,
      "value": "189",
      "perc1on100gr": "0"
  },
  {
      "_id": 2400,
      "product": 149,
      "nutrient": 19,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2401,
      "product": 149,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 2402,
      "product": 149,
      "nutrient": 22,
      "value": "274",
      "perc1on100gr": "0"
  },
  {
      "_id": 2403,
      "product": 149,
      "nutrient": 24,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 2404,
      "product": 149,
      "nutrient": 17,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2405,
      "product": 149,
      "nutrient": 47,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 2408,
      "product": 150,
      "nutrient": 0,
      "value": "6.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2409,
      "product": 150,
      "nutrient": 1,
      "value": "18.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2410,
      "product": 150,
      "nutrient": 2,
      "value": "65.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2411,
      "product": 150,
      "nutrient": 3,
      "value": "450",
      "perc1on100gr": "0"
  },
  {
      "_id": 2412,
      "product": 150,
      "nutrient": 45,
      "value": "24.66",
      "perc1on100gr": "0"
  },
  {
      "_id": 2413,
      "product": 150,
      "nutrient": 46,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2414,
      "product": 150,
      "nutrient": 4,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2415,
      "product": 150,
      "nutrient": 5,
      "value": "0.27",
      "perc1on100gr": "0"
  },
  {
      "_id": 2416,
      "product": 150,
      "nutrient": 6,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2417,
      "product": 150,
      "nutrient": 52,
      "value": "0.39",
      "perc1on100gr": "0"
  },
  {
      "_id": 2418,
      "product": 150,
      "nutrient": 8,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2419,
      "product": 150,
      "nutrient": 9,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 2420,
      "product": 150,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2421,
      "product": 150,
      "nutrient": 13,
      "value": "0.26",
      "perc1on100gr": "0"
  },
  {
      "_id": 2422,
      "product": 150,
      "nutrient": 52,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2423,
      "product": 150,
      "nutrient": 15,
      "value": "2.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2424,
      "product": 150,
      "nutrient": 16,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 2425,
      "product": 150,
      "nutrient": 18,
      "value": "142",
      "perc1on100gr": "0"
  },
  {
      "_id": 2426,
      "product": 150,
      "nutrient": 19,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 2427,
      "product": 150,
      "nutrient": 21,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2428,
      "product": 150,
      "nutrient": 22,
      "value": "383",
      "perc1on100gr": "0"
  },
  {
      "_id": 2429,
      "product": 150,
      "nutrient": 24,
      "value": "138",
      "perc1on100gr": "0"
  },
  {
      "_id": 2430,
      "product": 150,
      "nutrient": 17,
      "value": "2.58",
      "perc1on100gr": "0"
  },
  {
      "_id": 2431,
      "product": 150,
      "nutrient": 32,
      "value": "0.84",
      "perc1on100gr": "0"
  },
  {
      "_id": 2432,
      "product": 150,
      "nutrient": 33,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 2433,
      "product": 150,
      "nutrient": 38,
      "value": "9.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2434,
      "product": 150,
      "nutrient": 43,
      "value": "0.79",
      "perc1on100gr": "0"
  },
  {
      "_id": 2437,
      "product": 151,
      "nutrient": 0,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2438,
      "product": 151,
      "nutrient": 1,
      "value": "9.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2439,
      "product": 151,
      "nutrient": 2,
      "value": "74.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2440,
      "product": 151,
      "nutrient": 3,
      "value": "417",
      "perc1on100gr": "0"
  },
  {
      "_id": 2441,
      "product": 151,
      "nutrient": 45,
      "value": "23.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2442,
      "product": 151,
      "nutrient": 46,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2443,
      "product": 151,
      "nutrient": 53,
      "value": "50.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2444,
      "product": 151,
      "nutrient": 4,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2445,
      "product": 151,
      "nutrient": 5,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2446,
      "product": 151,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 2447,
      "product": 151,
      "nutrient": 13,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2448,
      "product": 151,
      "nutrient": 15,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2449,
      "product": 151,
      "nutrient": 18,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 2450,
      "product": 151,
      "nutrient": 19,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 2451,
      "product": 151,
      "nutrient": 21,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 2452,
      "product": 151,
      "nutrient": 22,
      "value": "330",
      "perc1on100gr": "0"
  },
  {
      "_id": 2453,
      "product": 151,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 2454,
      "product": 151,
      "nutrient": 17,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2455,
      "product": 151,
      "nutrient": 47,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2458,
      "product": 152,
      "nutrient": 0,
      "value": "6.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2459,
      "product": 152,
      "nutrient": 1,
      "value": "16.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2460,
      "product": 152,
      "nutrient": 2,
      "value": "68.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2461,
      "product": 152,
      "nutrient": 3,
      "value": "451",
      "perc1on100gr": "0"
  },
  {
      "_id": 2462,
      "product": 152,
      "nutrient": 45,
      "value": "34.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2463,
      "product": 152,
      "nutrient": 46,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2464,
      "product": 152,
      "nutrient": 53,
      "value": "34.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2465,
      "product": 152,
      "nutrient": 4,
      "value": "126",
      "perc1on100gr": "0"
  },
  {
      "_id": 2466,
      "product": 152,
      "nutrient": 5,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2467,
      "product": 152,
      "nutrient": 6,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2468,
      "product": 152,
      "nutrient": 13,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2469,
      "product": 152,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2470,
      "product": 152,
      "nutrient": 18,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 2471,
      "product": 152,
      "nutrient": 19,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2472,
      "product": 152,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 2473,
      "product": 152,
      "nutrient": 22,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 2474,
      "product": 152,
      "nutrient": 24,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 2475,
      "product": 152,
      "nutrient": 17,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2476,
      "product": 152,
      "nutrient": 47,
      "value": "70",
      "perc1on100gr": "0"
  },
  {
      "_id": 2479,
      "product": 153,
      "nutrient": 0,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2480,
      "product": 153,
      "nutrient": 1,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2481,
      "product": 153,
      "nutrient": 2,
      "value": "18.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2482,
      "product": 153,
      "nutrient": 3,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 2483,
      "product": 153,
      "nutrient": 45,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2484,
      "product": 153,
      "nutrient": 46,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2485,
      "product": 153,
      "nutrient": 53,
      "value": "16.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2486,
      "product": 153,
      "nutrient": 4,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 2487,
      "product": 153,
      "nutrient": 5,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2488,
      "product": 153,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2489,
      "product": 153,
      "nutrient": 11,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2490,
      "product": 153,
      "nutrient": 13,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2491,
      "product": 153,
      "nutrient": 15,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2492,
      "product": 153,
      "nutrient": 18,
      "value": "497",
      "perc1on100gr": "0"
  },
  {
      "_id": 2493,
      "product": 153,
      "nutrient": 19,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2494,
      "product": 153,
      "nutrient": 21,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 2495,
      "product": 153,
      "nutrient": 22,
      "value": "364",
      "perc1on100gr": "0"
  },
  {
      "_id": 2496,
      "product": 153,
      "nutrient": 24,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 2497,
      "product": 153,
      "nutrient": 17,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2500,
      "product": 154,
      "nutrient": 0,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2501,
      "product": 154,
      "nutrient": 1,
      "value": "10.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2502,
      "product": 154,
      "nutrient": 2,
      "value": "28.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2503,
      "product": 154,
      "nutrient": 3,
      "value": "230",
      "perc1on100gr": "0"
  },
  {
      "_id": 2504,
      "product": 154,
      "nutrient": 45,
      "value": "4.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2505,
      "product": 154,
      "nutrient": 46,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2506,
      "product": 154,
      "nutrient": 53,
      "value": "24.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2507,
      "product": 154,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2508,
      "product": 154,
      "nutrient": 5,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 2509,
      "product": 154,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 2510,
      "product": 154,
      "nutrient": 11,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2511,
      "product": 154,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2512,
      "product": 154,
      "nutrient": 15,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2513,
      "product": 154,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 2514,
      "product": 154,
      "nutrient": 19,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 2515,
      "product": 154,
      "nutrient": 21,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2516,
      "product": 154,
      "nutrient": 22,
      "value": "389",
      "perc1on100gr": "0"
  },
  {
      "_id": 2517,
      "product": 154,
      "nutrient": 24,
      "value": "64",
      "perc1on100gr": "0"
  },
  {
      "_id": 2518,
      "product": 154,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2519,
      "product": 154,
      "nutrient": 47,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2522,
      "product": 155,
      "nutrient": 0,
      "value": "3.47",
      "perc1on100gr": "0"
  },
  {
      "_id": 2523,
      "product": 155,
      "nutrient": 1,
      "value": "11.54",
      "perc1on100gr": "0"
  },
  {
      "_id": 2524,
      "product": 155,
      "nutrient": 2,
      "value": "63.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2525,
      "product": 155,
      "nutrient": 3,
      "value": "374",
      "perc1on100gr": "0"
  },
  {
      "_id": 2526,
      "product": 155,
      "nutrient": 45,
      "value": "37.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2527,
      "product": 155,
      "nutrient": 46,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2528,
      "product": 155,
      "nutrient": 53,
      "value": "17.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2529,
      "product": 155,
      "nutrient": 4,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2530,
      "product": 155,
      "nutrient": 5,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 2531,
      "product": 155,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 2532,
      "product": 155,
      "nutrient": 52,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2533,
      "product": 155,
      "nutrient": 9,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 2534,
      "product": 155,
      "nutrient": 10,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2535,
      "product": 155,
      "nutrient": 11,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2536,
      "product": 155,
      "nutrient": 12,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2537,
      "product": 155,
      "nutrient": 13,
      "value": "0.62",
      "perc1on100gr": "0"
  },
  {
      "_id": 2538,
      "product": 155,
      "nutrient": 52,
      "value": "9.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2539,
      "product": 155,
      "nutrient": 16,
      "value": "37.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2540,
      "product": 155,
      "nutrient": 18,
      "value": "71",
      "perc1on100gr": "0"
  },
  {
      "_id": 2541,
      "product": 155,
      "nutrient": 19,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2542,
      "product": 155,
      "nutrient": 21,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2543,
      "product": 155,
      "nutrient": 22,
      "value": "512",
      "perc1on100gr": "0"
  },
  {
      "_id": 2544,
      "product": 155,
      "nutrient": 24,
      "value": "185",
      "perc1on100gr": "0"
  },
  {
      "_id": 2545,
      "product": 155,
      "nutrient": 17,
      "value": "1.36",
      "perc1on100gr": "0"
  },
  {
      "_id": 2546,
      "product": 155,
      "nutrient": 32,
      "value": "0.31",
      "perc1on100gr": "0"
  },
  {
      "_id": 2547,
      "product": 155,
      "nutrient": 33,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 2548,
      "product": 155,
      "nutrient": 38,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2549,
      "product": 155,
      "nutrient": 43,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2550,
      "product": 155,
      "nutrient": 47,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2553,
      "product": 156,
      "nutrient": 0,
      "value": "5.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2554,
      "product": 156,
      "nutrient": 1,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2555,
      "product": 156,
      "nutrient": 2,
      "value": "75",
      "perc1on100gr": "0"
  },
  {
      "_id": 2556,
      "product": 156,
      "nutrient": 3,
      "value": "366",
      "perc1on100gr": "0"
  },
  {
      "_id": 2557,
      "product": 156,
      "nutrient": 45,
      "value": "36.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2558,
      "product": 156,
      "nutrient": 46,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2559,
      "product": 156,
      "nutrient": 53,
      "value": "38.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2560,
      "product": 156,
      "nutrient": 5,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2561,
      "product": 156,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 2562,
      "product": 156,
      "nutrient": 13,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2563,
      "product": 156,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2564,
      "product": 156,
      "nutrient": 18,
      "value": "71",
      "perc1on100gr": "0"
  },
  {
      "_id": 2565,
      "product": 156,
      "nutrient": 19,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2566,
      "product": 156,
      "nutrient": 21,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2567,
      "product": 156,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2568,
      "product": 156,
      "nutrient": 24,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 2569,
      "product": 156,
      "nutrient": 17,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2572,
      "product": 157,
      "nutrient": 0,
      "value": "8.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2573,
      "product": 157,
      "nutrient": 1,
      "value": "5.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2574,
      "product": 157,
      "nutrient": 2,
      "value": "56.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2575,
      "product": 157,
      "nutrient": 3,
      "value": "312",
      "perc1on100gr": "0"
  },
  {
      "_id": 2576,
      "product": 157,
      "nutrient": 45,
      "value": "9.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2577,
      "product": 157,
      "nutrient": 46,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2578,
      "product": 157,
      "nutrient": 53,
      "value": "47.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2579,
      "product": 157,
      "nutrient": 4,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 2580,
      "product": 157,
      "nutrient": 5,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 2581,
      "product": 157,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2582,
      "product": 157,
      "nutrient": 13,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2583,
      "product": 157,
      "nutrient": 15,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2584,
      "product": 157,
      "nutrient": 18,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 2585,
      "product": 157,
      "nutrient": 19,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2586,
      "product": 157,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 2587,
      "product": 157,
      "nutrient": 22,
      "value": "290",
      "perc1on100gr": "0"
  },
  {
      "_id": 2588,
      "product": 157,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 2589,
      "product": 157,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2590,
      "product": 157,
      "nutrient": 47,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2593,
      "product": 158,
      "nutrient": 0,
      "value": "7.47",
      "perc1on100gr": "0"
  },
  {
      "_id": 2594,
      "product": 158,
      "nutrient": 1,
      "value": "5.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2595,
      "product": 158,
      "nutrient": 2,
      "value": "59.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2596,
      "product": 158,
      "nutrient": 3,
      "value": "304",
      "perc1on100gr": "0"
  },
  {
      "_id": 2597,
      "product": 158,
      "nutrient": 45,
      "value": "12.72",
      "perc1on100gr": "0"
  },
  {
      "_id": 2598,
      "product": 158,
      "nutrient": 46,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2599,
      "product": 158,
      "nutrient": 53,
      "value": "42.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2600,
      "product": 158,
      "nutrient": 4,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2601,
      "product": 158,
      "nutrient": 5,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 2602,
      "product": 158,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 2603,
      "product": 158,
      "nutrient": 52,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 2604,
      "product": 158,
      "nutrient": 8,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2605,
      "product": 158,
      "nutrient": 9,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 2606,
      "product": 158,
      "nutrient": 13,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2607,
      "product": 158,
      "nutrient": 14,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2608,
      "product": 158,
      "nutrient": 15,
      "value": "0.92",
      "perc1on100gr": "0"
  },
  {
      "_id": 2609,
      "product": 158,
      "nutrient": 16,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2610,
      "product": 158,
      "nutrient": 18,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 2611,
      "product": 158,
      "nutrient": 19,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2612,
      "product": 158,
      "nutrient": 21,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 2613,
      "product": 158,
      "nutrient": 22,
      "value": "285",
      "perc1on100gr": "0"
  },
  {
      "_id": 2614,
      "product": 158,
      "nutrient": 23,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 2615,
      "product": 158,
      "nutrient": 24,
      "value": "80",
      "perc1on100gr": "0"
  },
  {
      "_id": 2616,
      "product": 158,
      "nutrient": 25,
      "value": "477",
      "perc1on100gr": "0"
  },
  {
      "_id": 2617,
      "product": 158,
      "nutrient": 17,
      "value": "1.51",
      "perc1on100gr": "0"
  },
  {
      "_id": 2618,
      "product": 158,
      "nutrient": 29,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2619,
      "product": 158,
      "nutrient": 30,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2620,
      "product": 158,
      "nutrient": 32,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 2621,
      "product": 158,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2622,
      "product": 158,
      "nutrient": 34,
      "value": "9.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2623,
      "product": 158,
      "nutrient": 41,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 2624,
      "product": 158,
      "nutrient": 42,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2625,
      "product": 158,
      "nutrient": 43,
      "value": "0.51",
      "perc1on100gr": "0"
  },
  {
      "_id": 2628,
      "product": 159,
      "nutrient": 0,
      "value": "8.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2629,
      "product": 159,
      "nutrient": 1,
      "value": "5.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2630,
      "product": 159,
      "nutrient": 2,
      "value": "54.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2631,
      "product": 159,
      "nutrient": 3,
      "value": "301",
      "perc1on100gr": "0"
  },
  {
      "_id": 2632,
      "product": 159,
      "nutrient": 45,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2633,
      "product": 159,
      "nutrient": 46,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2634,
      "product": 159,
      "nutrient": 53,
      "value": "47.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2635,
      "product": 159,
      "nutrient": 4,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 2636,
      "product": 159,
      "nutrient": 5,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2637,
      "product": 159,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2638,
      "product": 159,
      "nutrient": 13,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2639,
      "product": 159,
      "nutrient": 15,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2640,
      "product": 159,
      "nutrient": 18,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 2641,
      "product": 159,
      "nutrient": 19,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 2642,
      "product": 159,
      "nutrient": 21,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2643,
      "product": 159,
      "nutrient": 22,
      "value": "433",
      "perc1on100gr": "0"
  },
  {
      "_id": 2644,
      "product": 159,
      "nutrient": 24,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 2645,
      "product": 159,
      "nutrient": 17,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2646,
      "product": 159,
      "nutrient": 47,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 2649,
      "product": 160,
      "nutrient": 0,
      "value": "9.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2650,
      "product": 160,
      "nutrient": 1,
      "value": "6.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2651,
      "product": 160,
      "nutrient": 2,
      "value": "69.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2652,
      "product": 160,
      "nutrient": 3,
      "value": "372",
      "perc1on100gr": "0"
  },
  {
      "_id": 2653,
      "product": 160,
      "nutrient": 45,
      "value": "13.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2654,
      "product": 160,
      "nutrient": 46,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2655,
      "product": 160,
      "nutrient": 53,
      "value": "55.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2656,
      "product": 160,
      "nutrient": 5,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2657,
      "product": 160,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2658,
      "product": 160,
      "nutrient": 13,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2659,
      "product": 160,
      "nutrient": 15,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2660,
      "product": 160,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 2661,
      "product": 160,
      "nutrient": 19,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2662,
      "product": 160,
      "nutrient": 21,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 2663,
      "product": 160,
      "nutrient": 22,
      "value": "233",
      "perc1on100gr": "0"
  },
  {
      "_id": 2664,
      "product": 160,
      "nutrient": 24,
      "value": "99",
      "perc1on100gr": "0"
  },
  {
      "_id": 2665,
      "product": 160,
      "nutrient": 17,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2668,
      "product": 161,
      "nutrient": 0,
      "value": "10.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2669,
      "product": 161,
      "nutrient": 1,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2670,
      "product": 161,
      "nutrient": 2,
      "value": "71.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2671,
      "product": 161,
      "nutrient": 3,
      "value": "331",
      "perc1on100gr": "0"
  },
  {
      "_id": 2672,
      "product": 161,
      "nutrient": 45,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2673,
      "product": 161,
      "nutrient": 46,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2674,
      "product": 161,
      "nutrient": 53,
      "value": "66.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2675,
      "product": 161,
      "nutrient": 5,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2676,
      "product": 161,
      "nutrient": 6,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2677,
      "product": 161,
      "nutrient": 13,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2678,
      "product": 161,
      "nutrient": 15,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2679,
      "product": 161,
      "nutrient": 18,
      "value": "185",
      "perc1on100gr": "0"
  },
  {
      "_id": 2680,
      "product": 161,
      "nutrient": 19,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 2681,
      "product": 161,
      "nutrient": 21,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 2682,
      "product": 161,
      "nutrient": 22,
      "value": "605",
      "perc1on100gr": "0"
  },
  {
      "_id": 2683,
      "product": 161,
      "nutrient": 24,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 2686,
      "product": 162,
      "nutrient": 0,
      "value": "6.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2687,
      "product": 162,
      "nutrient": 1,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2688,
      "product": 162,
      "nutrient": 2,
      "value": "33.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2689,
      "product": 162,
      "nutrient": 3,
      "value": "174",
      "perc1on100gr": "0"
  },
  {
      "_id": 2690,
      "product": 162,
      "nutrient": 45,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2691,
      "product": 162,
      "nutrient": 46,
      "value": "8.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2692,
      "product": 162,
      "nutrient": 53,
      "value": "32.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2693,
      "product": 162,
      "nutrient": 5,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 2694,
      "product": 162,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2695,
      "product": 162,
      "nutrient": 52,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2696,
      "product": 162,
      "nutrient": 8,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 2697,
      "product": 162,
      "nutrient": 9,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 2698,
      "product": 162,
      "nutrient": 13,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2699,
      "product": 162,
      "nutrient": 15,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2700,
      "product": 162,
      "nutrient": 18,
      "value": "245",
      "perc1on100gr": "0"
  },
  {
      "_id": 2701,
      "product": 162,
      "nutrient": 19,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 2702,
      "product": 162,
      "nutrient": 21,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 2703,
      "product": 162,
      "nutrient": 22,
      "value": "610",
      "perc1on100gr": "0"
  },
  {
      "_id": 2704,
      "product": 162,
      "nutrient": 23,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 2705,
      "product": 162,
      "nutrient": 24,
      "value": "158",
      "perc1on100gr": "0"
  },
  {
      "_id": 2706,
      "product": 162,
      "nutrient": 25,
      "value": "980",
      "perc1on100gr": "0"
  },
  {
      "_id": 2707,
      "product": 162,
      "nutrient": 17,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2708,
      "product": 162,
      "nutrient": 29,
      "value": "5.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2709,
      "product": 162,
      "nutrient": 32,
      "value": "1.61",
      "perc1on100gr": "0"
  },
  {
      "_id": 2710,
      "product": 162,
      "nutrient": 33,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 2711,
      "product": 162,
      "nutrient": 34,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2712,
      "product": 162,
      "nutrient": 41,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 2713,
      "product": 162,
      "nutrient": 42,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2714,
      "product": 162,
      "nutrient": 43,
      "value": "1.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2717,
      "product": 163,
      "nutrient": 0,
      "value": "8.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2718,
      "product": 163,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2719,
      "product": 163,
      "nutrient": 2,
      "value": "34.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2720,
      "product": 163,
      "nutrient": 3,
      "value": "207",
      "perc1on100gr": "0"
  },
  {
      "_id": 2721,
      "product": 163,
      "nutrient": 45,
      "value": "4.76",
      "perc1on100gr": "0"
  },
  {
      "_id": 2722,
      "product": 163,
      "nutrient": 46,
      "value": "9.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2723,
      "product": 163,
      "nutrient": 5,
      "value": "0.41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2724,
      "product": 163,
      "nutrient": 6,
      "value": "0.29",
      "perc1on100gr": "0"
  },
  {
      "_id": 2725,
      "product": 163,
      "nutrient": 52,
      "value": "0.46",
      "perc1on100gr": "0"
  },
  {
      "_id": 2726,
      "product": 163,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 2727,
      "product": 163,
      "nutrient": 9,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 2728,
      "product": 163,
      "nutrient": 10,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 2729,
      "product": 163,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2730,
      "product": 163,
      "nutrient": 13,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2731,
      "product": 163,
      "nutrient": 52,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2732,
      "product": 163,
      "nutrient": 15,
      "value": "3.64",
      "perc1on100gr": "0"
  },
  {
      "_id": 2733,
      "product": 163,
      "nutrient": 16,
      "value": "14.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2734,
      "product": 163,
      "nutrient": 18,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 2735,
      "product": 163,
      "nutrient": 19,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 2736,
      "product": 163,
      "nutrient": 21,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2737,
      "product": 163,
      "nutrient": 22,
      "value": "453",
      "perc1on100gr": "0"
  },
  {
      "_id": 2738,
      "product": 163,
      "nutrient": 24,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 2739,
      "product": 163,
      "nutrient": 17,
      "value": "3.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2740,
      "product": 163,
      "nutrient": 32,
      "value": "0.39",
      "perc1on100gr": "0"
  },
  {
      "_id": 2741,
      "product": 163,
      "nutrient": 33,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2742,
      "product": 163,
      "nutrient": 38,
      "value": "21.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2743,
      "product": 163,
      "nutrient": 43,
      "value": "1.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 2746,
      "product": 164,
      "nutrient": 0,
      "value": "6.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2747,
      "product": 164,
      "nutrient": 1,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2748,
      "product": 164,
      "nutrient": 2,
      "value": "39.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2749,
      "product": 164,
      "nutrient": 3,
      "value": "201",
      "perc1on100gr": "0"
  },
  {
      "_id": 2750,
      "product": 164,
      "nutrient": 45,
      "value": "5.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2751,
      "product": 164,
      "nutrient": 46,
      "value": "7.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2752,
      "product": 164,
      "nutrient": 53,
      "value": "34.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2753,
      "product": 164,
      "nutrient": 5,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 2754,
      "product": 164,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2755,
      "product": 164,
      "nutrient": 13,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2756,
      "product": 164,
      "nutrient": 15,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2757,
      "product": 164,
      "nutrient": 18,
      "value": "235",
      "perc1on100gr": "0"
  },
  {
      "_id": 2758,
      "product": 164,
      "nutrient": 19,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 2759,
      "product": 164,
      "nutrient": 21,
      "value": "49",
      "perc1on100gr": "0"
  },
  {
      "_id": 2760,
      "product": 164,
      "nutrient": 22,
      "value": "246",
      "perc1on100gr": "0"
  },
  {
      "_id": 2761,
      "product": 164,
      "nutrient": 24,
      "value": "157",
      "perc1on100gr": "0"
  },
  {
      "_id": 2762,
      "product": 164,
      "nutrient": 17,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2765,
      "product": 165,
      "nutrient": 0,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2766,
      "product": 165,
      "nutrient": 1,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2767,
      "product": 165,
      "nutrient": 2,
      "value": "45.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2768,
      "product": 165,
      "nutrient": 3,
      "value": "228",
      "perc1on100gr": "0"
  },
  {
      "_id": 2769,
      "product": 165,
      "nutrient": 45,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2770,
      "product": 165,
      "nutrient": 46,
      "value": "6.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2771,
      "product": 165,
      "nutrient": 53,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 2772,
      "product": 165,
      "nutrient": 5,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 2773,
      "product": 165,
      "nutrient": 6,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 2774,
      "product": 165,
      "nutrient": 13,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2775,
      "product": 165,
      "nutrient": 15,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2776,
      "product": 165,
      "nutrient": 18,
      "value": "196",
      "perc1on100gr": "0"
  },
  {
      "_id": 2777,
      "product": 165,
      "nutrient": 19,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 2778,
      "product": 165,
      "nutrient": 21,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 2779,
      "product": 165,
      "nutrient": 22,
      "value": "223",
      "perc1on100gr": "0"
  },
  {
      "_id": 2780,
      "product": 165,
      "nutrient": 24,
      "value": "199",
      "perc1on100gr": "0"
  },
  {
      "_id": 2781,
      "product": 165,
      "nutrient": 17,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2784,
      "product": 166,
      "nutrient": 0,
      "value": "8.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2785,
      "product": 166,
      "nutrient": 1,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2786,
      "product": 166,
      "nutrient": 2,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 2787,
      "product": 166,
      "nutrient": 3,
      "value": "250",
      "perc1on100gr": "0"
  },
  {
      "_id": 2788,
      "product": 166,
      "nutrient": 45,
      "value": "0.53",
      "perc1on100gr": "0"
  },
  {
      "_id": 2789,
      "product": 166,
      "nutrient": 46,
      "value": "6.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2790,
      "product": 166,
      "nutrient": 5,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2791,
      "product": 166,
      "nutrient": 6,
      "value": "0.31",
      "perc1on100gr": "0"
  },
  {
      "_id": 2792,
      "product": 166,
      "nutrient": 52,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2793,
      "product": 166,
      "nutrient": 8,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 2794,
      "product": 166,
      "nutrient": 9,
      "value": "93",
      "perc1on100gr": "0"
  },
  {
      "_id": 2795,
      "product": 166,
      "nutrient": 13,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2796,
      "product": 166,
      "nutrient": 52,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2797,
      "product": 166,
      "nutrient": 15,
      "value": "3.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 2798,
      "product": 166,
      "nutrient": 16,
      "value": "14.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2799,
      "product": 166,
      "nutrient": 18,
      "value": "208",
      "perc1on100gr": "0"
  },
  {
      "_id": 2800,
      "product": 166,
      "nutrient": 19,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 2801,
      "product": 166,
      "nutrient": 21,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 2802,
      "product": 166,
      "nutrient": 22,
      "value": "671",
      "perc1on100gr": "0"
  },
  {
      "_id": 2803,
      "product": 166,
      "nutrient": 24,
      "value": "178",
      "perc1on100gr": "0"
  },
  {
      "_id": 2804,
      "product": 166,
      "nutrient": 17,
      "value": "2.87",
      "perc1on100gr": "0"
  },
  {
      "_id": 2805,
      "product": 166,
      "nutrient": 32,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2806,
      "product": 166,
      "nutrient": 33,
      "value": "0.29",
      "perc1on100gr": "0"
  },
  {
      "_id": 2807,
      "product": 166,
      "nutrient": 38,
      "value": "24.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2808,
      "product": 166,
      "nutrient": 43,
      "value": "1.48",
      "perc1on100gr": "0"
  },
  {
      "_id": 2811,
      "product": 167,
      "nutrient": 0,
      "value": "8.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2812,
      "product": 167,
      "nutrient": 1,
      "value": "4.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2813,
      "product": 167,
      "nutrient": 2,
      "value": "44.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2814,
      "product": 167,
      "nutrient": 3,
      "value": "269",
      "perc1on100gr": "0"
  },
  {
      "_id": 2815,
      "product": 167,
      "nutrient": 45,
      "value": "8.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 2816,
      "product": 167,
      "nutrient": 46,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2817,
      "product": 167,
      "nutrient": 4,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2818,
      "product": 167,
      "nutrient": 5,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2819,
      "product": 167,
      "nutrient": 6,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2820,
      "product": 167,
      "nutrient": 52,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 2821,
      "product": 167,
      "nutrient": 8,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2822,
      "product": 167,
      "nutrient": 9,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 2823,
      "product": 167,
      "nutrient": 10,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2824,
      "product": 167,
      "nutrient": 13,
      "value": "0.48",
      "perc1on100gr": "0"
  },
  {
      "_id": 2825,
      "product": 167,
      "nutrient": 52,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2826,
      "product": 167,
      "nutrient": 15,
      "value": "3.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 2827,
      "product": 167,
      "nutrient": 16,
      "value": "14.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2828,
      "product": 167,
      "nutrient": 18,
      "value": "142",
      "perc1on100gr": "0"
  },
  {
      "_id": 2829,
      "product": 167,
      "nutrient": 19,
      "value": "66",
      "perc1on100gr": "0"
  },
  {
      "_id": 2830,
      "product": 167,
      "nutrient": 21,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 2831,
      "product": 167,
      "nutrient": 22,
      "value": "470",
      "perc1on100gr": "0"
  },
  {
      "_id": 2832,
      "product": 167,
      "nutrient": 24,
      "value": "126",
      "perc1on100gr": "0"
  },
  {
      "_id": 2833,
      "product": 167,
      "nutrient": 17,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2834,
      "product": 167,
      "nutrient": 32,
      "value": "0.94",
      "perc1on100gr": "0"
  },
  {
      "_id": 2835,
      "product": 167,
      "nutrient": 33,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2836,
      "product": 167,
      "nutrient": 38,
      "value": "24.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2837,
      "product": 167,
      "nutrient": 43,
      "value": "1.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 2840,
      "product": 168,
      "nutrient": 0,
      "value": "7.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2841,
      "product": 168,
      "nutrient": 1,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2842,
      "product": 168,
      "nutrient": 2,
      "value": "43.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2843,
      "product": 168,
      "nutrient": 3,
      "value": "210",
      "perc1on100gr": "0"
  },
  {
      "_id": 2844,
      "product": 168,
      "nutrient": 5,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 2845,
      "product": 168,
      "nutrient": 6,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 2846,
      "product": 168,
      "nutrient": 52,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 2847,
      "product": 168,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 2848,
      "product": 168,
      "nutrient": 9,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 2849,
      "product": 168,
      "nutrient": 10,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2850,
      "product": 168,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2851,
      "product": 168,
      "nutrient": 15,
      "value": "3.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 2852,
      "product": 168,
      "nutrient": 18,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 2853,
      "product": 168,
      "nutrient": 19,
      "value": "112",
      "perc1on100gr": "0"
  },
  {
      "_id": 2854,
      "product": 168,
      "nutrient": 21,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2855,
      "product": 168,
      "nutrient": 22,
      "value": "388",
      "perc1on100gr": "0"
  },
  {
      "_id": 2856,
      "product": 168,
      "nutrient": 24,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 2857,
      "product": 168,
      "nutrient": 17,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2858,
      "product": 168,
      "nutrient": 32,
      "value": "0.54",
      "perc1on100gr": "0"
  },
  {
      "_id": 2859,
      "product": 168,
      "nutrient": 33,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2860,
      "product": 168,
      "nutrient": 38,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2861,
      "product": 168,
      "nutrient": 43,
      "value": "0.83",
      "perc1on100gr": "0"
  },
  {
      "_id": 2864,
      "product": 169,
      "nutrient": 0,
      "value": "8.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2865,
      "product": 169,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2866,
      "product": 169,
      "nutrient": 2,
      "value": "49.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2867,
      "product": 169,
      "nutrient": 3,
      "value": "243",
      "perc1on100gr": "0"
  },
  {
      "_id": 2868,
      "product": 169,
      "nutrient": 45,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2869,
      "product": 169,
      "nutrient": 46,
      "value": "3.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2870,
      "product": 169,
      "nutrient": 53,
      "value": "47.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2871,
      "product": 169,
      "nutrient": 5,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 2872,
      "product": 169,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2873,
      "product": 169,
      "nutrient": 13,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2874,
      "product": 169,
      "nutrient": 15,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2875,
      "product": 169,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 2876,
      "product": 169,
      "nutrient": 19,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2877,
      "product": 169,
      "nutrient": 21,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 2878,
      "product": 169,
      "nutrient": 22,
      "value": "453",
      "perc1on100gr": "0"
  },
  {
      "_id": 2879,
      "product": 169,
      "nutrient": 24,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 2880,
      "product": 169,
      "nutrient": 17,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2883,
      "product": 170,
      "nutrient": 0,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2884,
      "product": 170,
      "nutrient": 1,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2885,
      "product": 170,
      "nutrient": 2,
      "value": "45.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2886,
      "product": 170,
      "nutrient": 3,
      "value": "228",
      "perc1on100gr": "0"
  },
  {
      "_id": 2887,
      "product": 170,
      "nutrient": 45,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2888,
      "product": 170,
      "nutrient": 46,
      "value": "4.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2889,
      "product": 170,
      "nutrient": 53,
      "value": "42.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2890,
      "product": 170,
      "nutrient": 5,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2891,
      "product": 170,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 2892,
      "product": 170,
      "nutrient": 13,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2893,
      "product": 170,
      "nutrient": 15,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2894,
      "product": 170,
      "nutrient": 18,
      "value": "185",
      "perc1on100gr": "0"
  },
  {
      "_id": 2895,
      "product": 170,
      "nutrient": 19,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 2896,
      "product": 170,
      "nutrient": 21,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 2897,
      "product": 170,
      "nutrient": 22,
      "value": "374",
      "perc1on100gr": "0"
  },
  {
      "_id": 2898,
      "product": 170,
      "nutrient": 24,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 2899,
      "product": 170,
      "nutrient": 17,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2902,
      "product": 171,
      "nutrient": 0,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2903,
      "product": 171,
      "nutrient": 1,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 2904,
      "product": 171,
      "nutrient": 2,
      "value": "40.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2905,
      "product": 171,
      "nutrient": 3,
      "value": "208",
      "perc1on100gr": "0"
  },
  {
      "_id": 2906,
      "product": 171,
      "nutrient": 45,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2907,
      "product": 171,
      "nutrient": 46,
      "value": "6.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2908,
      "product": 171,
      "nutrient": 53,
      "value": "37.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2909,
      "product": 171,
      "nutrient": 5,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 2910,
      "product": 171,
      "nutrient": 6,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 2911,
      "product": 171,
      "nutrient": 13,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2912,
      "product": 171,
      "nutrient": 15,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2913,
      "product": 171,
      "nutrient": 18,
      "value": "217",
      "perc1on100gr": "0"
  },
  {
      "_id": 2914,
      "product": 171,
      "nutrient": 19,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2915,
      "product": 171,
      "nutrient": 21,
      "value": "66",
      "perc1on100gr": "0"
  },
  {
      "_id": 2916,
      "product": 171,
      "nutrient": 22,
      "value": "356",
      "perc1on100gr": "0"
  },
  {
      "_id": 2917,
      "product": 171,
      "nutrient": 24,
      "value": "234",
      "perc1on100gr": "0"
  },
  {
      "_id": 2918,
      "product": 171,
      "nutrient": 17,
      "value": "4.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2921,
      "product": 172,
      "nutrient": 0,
      "value": "10.91",
      "perc1on100gr": "0"
  },
  {
      "_id": 2922,
      "product": 172,
      "nutrient": 1,
      "value": "3.64",
      "perc1on100gr": "0"
  },
  {
      "_id": 2923,
      "product": 172,
      "nutrient": 2,
      "value": "43.91",
      "perc1on100gr": "0"
  },
  {
      "_id": 2924,
      "product": 172,
      "nutrient": 3,
      "value": "266",
      "perc1on100gr": "0"
  },
  {
      "_id": 2925,
      "product": 172,
      "nutrient": 45,
      "value": "5.75",
      "perc1on100gr": "0"
  },
  {
      "_id": 2926,
      "product": 172,
      "nutrient": 46,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2927,
      "product": 172,
      "nutrient": 5,
      "value": "0.37",
      "perc1on100gr": "0"
  },
  {
      "_id": 2928,
      "product": 172,
      "nutrient": 6,
      "value": "0.31",
      "perc1on100gr": "0"
  },
  {
      "_id": 2929,
      "product": 172,
      "nutrient": 52,
      "value": "0.82",
      "perc1on100gr": "0"
  },
  {
      "_id": 2930,
      "product": 172,
      "nutrient": 8,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 2931,
      "product": 172,
      "nutrient": 9,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 2932,
      "product": 172,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2933,
      "product": 172,
      "nutrient": 13,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2934,
      "product": 172,
      "nutrient": 52,
      "value": "4.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2935,
      "product": 172,
      "nutrient": 15,
      "value": "5.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 2936,
      "product": 172,
      "nutrient": 16,
      "value": "18.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2937,
      "product": 172,
      "nutrient": 18,
      "value": "184",
      "perc1on100gr": "0"
  },
  {
      "_id": 2938,
      "product": 172,
      "nutrient": 19,
      "value": "142",
      "perc1on100gr": "0"
  },
  {
      "_id": 2939,
      "product": 172,
      "nutrient": 21,
      "value": "48",
      "perc1on100gr": "0"
  },
  {
      "_id": 2940,
      "product": 172,
      "nutrient": 22,
      "value": "521",
      "perc1on100gr": "0"
  },
  {
      "_id": 2941,
      "product": 172,
      "nutrient": 24,
      "value": "155",
      "perc1on100gr": "0"
  },
  {
      "_id": 2942,
      "product": 172,
      "nutrient": 17,
      "value": "3.46",
      "perc1on100gr": "0"
  },
  {
      "_id": 2943,
      "product": 172,
      "nutrient": 32,
      "value": "1.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 2944,
      "product": 172,
      "nutrient": 33,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2945,
      "product": 172,
      "nutrient": 38,
      "value": "28.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2946,
      "product": 172,
      "nutrient": 43,
      "value": "1.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 2949,
      "product": 173,
      "nutrient": 0,
      "value": "9.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2950,
      "product": 173,
      "nutrient": 1,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2951,
      "product": 173,
      "nutrient": 2,
      "value": "31.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2952,
      "product": 173,
      "nutrient": 3,
      "value": "198",
      "perc1on100gr": "0"
  },
  {
      "_id": 2953,
      "product": 173,
      "nutrient": 45,
      "value": "3.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 2954,
      "product": 173,
      "nutrient": 46,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 2955,
      "product": 173,
      "nutrient": 5,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 2956,
      "product": 173,
      "nutrient": 6,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2957,
      "product": 173,
      "nutrient": 52,
      "value": "0.65",
      "perc1on100gr": "0"
  },
  {
      "_id": 2958,
      "product": 173,
      "nutrient": 8,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 2959,
      "product": 173,
      "nutrient": 9,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 2960,
      "product": 173,
      "nutrient": 11,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2961,
      "product": 173,
      "nutrient": 13,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 2962,
      "product": 173,
      "nutrient": 52,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2963,
      "product": 173,
      "nutrient": 15,
      "value": "3.88",
      "perc1on100gr": "0"
  },
  {
      "_id": 2964,
      "product": 173,
      "nutrient": 16,
      "value": "18.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 2965,
      "product": 173,
      "nutrient": 18,
      "value": "122",
      "perc1on100gr": "0"
  },
  {
      "_id": 2966,
      "product": 173,
      "nutrient": 19,
      "value": "80",
      "perc1on100gr": "0"
  },
  {
      "_id": 2967,
      "product": 173,
      "nutrient": 21,
      "value": "39",
      "perc1on100gr": "0"
  },
  {
      "_id": 2968,
      "product": 173,
      "nutrient": 22,
      "value": "511",
      "perc1on100gr": "0"
  },
  {
      "_id": 2969,
      "product": 173,
      "nutrient": 24,
      "value": "102",
      "perc1on100gr": "0"
  },
  {
      "_id": 2970,
      "product": 173,
      "nutrient": 17,
      "value": "2.96",
      "perc1on100gr": "0"
  },
  {
      "_id": 2971,
      "product": 173,
      "nutrient": 32,
      "value": "0.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 2972,
      "product": 173,
      "nutrient": 33,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 2973,
      "product": 173,
      "nutrient": 38,
      "value": "30.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 2974,
      "product": 173,
      "nutrient": 43,
      "value": "1.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 2977,
      "product": 174,
      "nutrient": 0,
      "value": "7.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 2978,
      "product": 174,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2979,
      "product": 174,
      "nutrient": 2,
      "value": "48.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2980,
      "product": 174,
      "nutrient": 3,
      "value": "235",
      "perc1on100gr": "0"
  },
  {
      "_id": 2981,
      "product": 174,
      "nutrient": 45,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 2982,
      "product": 174,
      "nutrient": 46,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2983,
      "product": 174,
      "nutrient": 53,
      "value": "46.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2984,
      "product": 174,
      "nutrient": 5,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 2985,
      "product": 174,
      "nutrient": 6,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 2986,
      "product": 174,
      "nutrient": 13,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 2987,
      "product": 174,
      "nutrient": 15,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2988,
      "product": 174,
      "nutrient": 18,
      "value": "133",
      "perc1on100gr": "0"
  },
  {
      "_id": 2989,
      "product": 174,
      "nutrient": 19,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 2990,
      "product": 174,
      "nutrient": 21,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 2991,
      "product": 174,
      "nutrient": 22,
      "value": "378",
      "perc1on100gr": "0"
  },
  {
      "_id": 2992,
      "product": 174,
      "nutrient": 24,
      "value": "87",
      "perc1on100gr": "0"
  },
  {
      "_id": 2993,
      "product": 174,
      "nutrient": 17,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2996,
      "product": 175,
      "nutrient": 0,
      "value": "7.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 2997,
      "product": 175,
      "nutrient": 1,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 2998,
      "product": 175,
      "nutrient": 2,
      "value": "49.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 2999,
      "product": 175,
      "nutrient": 3,
      "value": "235",
      "perc1on100gr": "0"
  },
  {
      "_id": 3000,
      "product": 175,
      "nutrient": 45,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3001,
      "product": 175,
      "nutrient": 46,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3002,
      "product": 175,
      "nutrient": 53,
      "value": "48.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3003,
      "product": 175,
      "nutrient": 5,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3004,
      "product": 175,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3005,
      "product": 175,
      "nutrient": 52,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 3006,
      "product": 175,
      "nutrient": 8,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3007,
      "product": 175,
      "nutrient": 9,
      "value": "22.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3008,
      "product": 175,
      "nutrient": 13,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3009,
      "product": 175,
      "nutrient": 14,
      "value": "1.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 3010,
      "product": 175,
      "nutrient": 15,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3011,
      "product": 175,
      "nutrient": 16,
      "value": "37.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3012,
      "product": 175,
      "nutrient": 18,
      "value": "93",
      "perc1on100gr": "0"
  },
  {
      "_id": 3013,
      "product": 175,
      "nutrient": 19,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 3014,
      "product": 175,
      "nutrient": 20,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3015,
      "product": 175,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3016,
      "product": 175,
      "nutrient": 22,
      "value": "499",
      "perc1on100gr": "0"
  },
  {
      "_id": 3017,
      "product": 175,
      "nutrient": 23,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 3018,
      "product": 175,
      "nutrient": 24,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 3019,
      "product": 175,
      "nutrient": 25,
      "value": "824",
      "perc1on100gr": "0"
  },
  {
      "_id": 3020,
      "product": 175,
      "nutrient": 17,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3021,
      "product": 175,
      "nutrient": 30,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3022,
      "product": 175,
      "nutrient": 32,
      "value": "0.45",
      "perc1on100gr": "0"
  },
  {
      "_id": 3023,
      "product": 175,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3024,
      "product": 175,
      "nutrient": 34,
      "value": "10.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3025,
      "product": 175,
      "nutrient": 41,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 3026,
      "product": 175,
      "nutrient": 42,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3027,
      "product": 175,
      "nutrient": 43,
      "value": "0.53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3030,
      "product": 176,
      "nutrient": 0,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3031,
      "product": 176,
      "nutrient": 1,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3032,
      "product": 176,
      "nutrient": 2,
      "value": "42.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3033,
      "product": 176,
      "nutrient": 3,
      "value": "258",
      "perc1on100gr": "0"
  },
  {
      "_id": 3034,
      "product": 176,
      "nutrient": 45,
      "value": "3.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 3035,
      "product": 176,
      "nutrient": 46,
      "value": "5.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3036,
      "product": 176,
      "nutrient": 5,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 3037,
      "product": 176,
      "nutrient": 6,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 3038,
      "product": 176,
      "nutrient": 52,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 3039,
      "product": 176,
      "nutrient": 8,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3040,
      "product": 176,
      "nutrient": 9,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 3041,
      "product": 176,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3042,
      "product": 176,
      "nutrient": 13,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 3043,
      "product": 176,
      "nutrient": 52,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3044,
      "product": 176,
      "nutrient": 15,
      "value": "3.81",
      "perc1on100gr": "0"
  },
  {
      "_id": 3045,
      "product": 176,
      "nutrient": 16,
      "value": "14.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3046,
      "product": 176,
      "nutrient": 18,
      "value": "166",
      "perc1on100gr": "0"
  },
  {
      "_id": 3047,
      "product": 176,
      "nutrient": 19,
      "value": "73",
      "perc1on100gr": "0"
  },
  {
      "_id": 3048,
      "product": 176,
      "nutrient": 21,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 3049,
      "product": 176,
      "nutrient": 22,
      "value": "660",
      "perc1on100gr": "0"
  },
  {
      "_id": 3050,
      "product": 176,
      "nutrient": 24,
      "value": "125",
      "perc1on100gr": "0"
  },
  {
      "_id": 3051,
      "product": 176,
      "nutrient": 17,
      "value": "2.83",
      "perc1on100gr": "0"
  },
  {
      "_id": 3052,
      "product": 176,
      "nutrient": 32,
      "value": "0.82",
      "perc1on100gr": "0"
  },
  {
      "_id": 3053,
      "product": 176,
      "nutrient": 33,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 3054,
      "product": 176,
      "nutrient": 38,
      "value": "30.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3055,
      "product": 176,
      "nutrient": 41,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 3056,
      "product": 176,
      "nutrient": 43,
      "value": "1.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3059,
      "product": 177,
      "nutrient": 0,
      "value": "9.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3060,
      "product": 177,
      "nutrient": 1,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3061,
      "product": 177,
      "nutrient": 2,
      "value": "28.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3062,
      "product": 177,
      "nutrient": 3,
      "value": "203",
      "perc1on100gr": "0"
  },
  {
      "_id": 3063,
      "product": 177,
      "nutrient": 45,
      "value": "2.29",
      "perc1on100gr": "0"
  },
  {
      "_id": 3064,
      "product": 177,
      "nutrient": 46,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3065,
      "product": 177,
      "nutrient": 5,
      "value": "0.37",
      "perc1on100gr": "0"
  },
  {
      "_id": 3066,
      "product": 177,
      "nutrient": 6,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 3067,
      "product": 177,
      "nutrient": 52,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3068,
      "product": 177,
      "nutrient": 8,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3069,
      "product": 177,
      "nutrient": 9,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 3070,
      "product": 177,
      "nutrient": 10,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3071,
      "product": 177,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3072,
      "product": 177,
      "nutrient": 13,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 3073,
      "product": 177,
      "nutrient": 52,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3074,
      "product": 177,
      "nutrient": 15,
      "value": "2.53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3075,
      "product": 177,
      "nutrient": 16,
      "value": "14.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3076,
      "product": 177,
      "nutrient": 18,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 3077,
      "product": 177,
      "nutrient": 19,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 3078,
      "product": 177,
      "nutrient": 21,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 3079,
      "product": 177,
      "nutrient": 22,
      "value": "513",
      "perc1on100gr": "0"
  },
  {
      "_id": 3080,
      "product": 177,
      "nutrient": 24,
      "value": "78",
      "perc1on100gr": "0"
  },
  {
      "_id": 3081,
      "product": 177,
      "nutrient": 17,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3082,
      "product": 177,
      "nutrient": 32,
      "value": "0.45",
      "perc1on100gr": "0"
  },
  {
      "_id": 3083,
      "product": 177,
      "nutrient": 33,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3084,
      "product": 177,
      "nutrient": 38,
      "value": "27.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3085,
      "product": 177,
      "nutrient": 43,
      "value": "0.66",
      "perc1on100gr": "0"
  },
  {
      "_id": 3088,
      "product": 178,
      "nutrient": 0,
      "value": "5.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3089,
      "product": 178,
      "nutrient": 1,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3090,
      "product": 178,
      "nutrient": 2,
      "value": "49.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3091,
      "product": 178,
      "nutrient": 3,
      "value": "232",
      "perc1on100gr": "0"
  },
  {
      "_id": 3092,
      "product": 178,
      "nutrient": 45,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3093,
      "product": 178,
      "nutrient": 46,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3094,
      "product": 178,
      "nutrient": 53,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 3095,
      "product": 178,
      "nutrient": 5,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3096,
      "product": 178,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3097,
      "product": 178,
      "nutrient": 13,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3098,
      "product": 178,
      "nutrient": 15,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3099,
      "product": 178,
      "nutrient": 18,
      "value": "155",
      "perc1on100gr": "0"
  },
  {
      "_id": 3100,
      "product": 178,
      "nutrient": 19,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 3101,
      "product": 178,
      "nutrient": 21,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3102,
      "product": 178,
      "nutrient": 22,
      "value": "437",
      "perc1on100gr": "0"
  },
  {
      "_id": 3103,
      "product": 178,
      "nutrient": 24,
      "value": "106",
      "perc1on100gr": "0"
  },
  {
      "_id": 3104,
      "product": 178,
      "nutrient": 17,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3107,
      "product": 179,
      "nutrient": 0,
      "value": "10.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3108,
      "product": 179,
      "nutrient": 1,
      "value": "4.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3109,
      "product": 179,
      "nutrient": 2,
      "value": "35.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3110,
      "product": 179,
      "nutrient": 3,
      "value": "236",
      "perc1on100gr": "0"
  },
  {
      "_id": 3111,
      "product": 179,
      "nutrient": 45,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3112,
      "product": 179,
      "nutrient": 46,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3113,
      "product": 179,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3114,
      "product": 179,
      "nutrient": 5,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3115,
      "product": 179,
      "nutrient": 6,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 3116,
      "product": 179,
      "nutrient": 52,
      "value": "0.58",
      "perc1on100gr": "0"
  },
  {
      "_id": 3117,
      "product": 179,
      "nutrient": 8,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3118,
      "product": 179,
      "nutrient": 9,
      "value": "81",
      "perc1on100gr": "0"
  },
  {
      "_id": 3119,
      "product": 179,
      "nutrient": 13,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 3120,
      "product": 179,
      "nutrient": 52,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3121,
      "product": 179,
      "nutrient": 15,
      "value": "4.83",
      "perc1on100gr": "0"
  },
  {
      "_id": 3122,
      "product": 179,
      "nutrient": 16,
      "value": "14.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3123,
      "product": 179,
      "nutrient": 18,
      "value": "147",
      "perc1on100gr": "0"
  },
  {
      "_id": 3124,
      "product": 179,
      "nutrient": 19,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 3125,
      "product": 179,
      "nutrient": 21,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 3126,
      "product": 179,
      "nutrient": 22,
      "value": "407",
      "perc1on100gr": "0"
  },
  {
      "_id": 3127,
      "product": 179,
      "nutrient": 24,
      "value": "141",
      "perc1on100gr": "0"
  },
  {
      "_id": 3128,
      "product": 179,
      "nutrient": 17,
      "value": "3.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3129,
      "product": 179,
      "nutrient": 32,
      "value": "0.78",
      "perc1on100gr": "0"
  },
  {
      "_id": 3130,
      "product": 179,
      "nutrient": 33,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3131,
      "product": 179,
      "nutrient": 38,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 3132,
      "product": 179,
      "nutrient": 43,
      "value": "0.89",
      "perc1on100gr": "0"
  },
  {
      "_id": 3135,
      "product": 180,
      "nutrient": 0,
      "value": "8.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3136,
      "product": 180,
      "nutrient": 1,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3137,
      "product": 180,
      "nutrient": 2,
      "value": "47.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3138,
      "product": 180,
      "nutrient": 3,
      "value": "237",
      "perc1on100gr": "0"
  },
  {
      "_id": 3139,
      "product": 180,
      "nutrient": 45,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3140,
      "product": 180,
      "nutrient": 46,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3141,
      "product": 180,
      "nutrient": 53,
      "value": "45.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3142,
      "product": 180,
      "nutrient": 4,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3143,
      "product": 180,
      "nutrient": 5,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 3144,
      "product": 180,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3145,
      "product": 180,
      "nutrient": 13,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3146,
      "product": 180,
      "nutrient": 15,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3147,
      "product": 180,
      "nutrient": 18,
      "value": "254",
      "perc1on100gr": "0"
  },
  {
      "_id": 3148,
      "product": 180,
      "nutrient": 19,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3149,
      "product": 180,
      "nutrient": 21,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 3150,
      "product": 180,
      "nutrient": 22,
      "value": "412",
      "perc1on100gr": "0"
  },
  {
      "_id": 3151,
      "product": 180,
      "nutrient": 24,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 3152,
      "product": 180,
      "nutrient": 17,
      "value": "4.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3155,
      "product": 181,
      "nutrient": 0,
      "value": "8.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3156,
      "product": 181,
      "nutrient": 1,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3157,
      "product": 181,
      "nutrient": 2,
      "value": "46.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3158,
      "product": 181,
      "nutrient": 3,
      "value": "242",
      "perc1on100gr": "0"
  },
  {
      "_id": 3159,
      "product": 181,
      "nutrient": 45,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3160,
      "product": 181,
      "nutrient": 46,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3161,
      "product": 181,
      "nutrient": 53,
      "value": "42.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3162,
      "product": 181,
      "nutrient": 5,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3163,
      "product": 181,
      "nutrient": 6,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3164,
      "product": 181,
      "nutrient": 13,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3165,
      "product": 181,
      "nutrient": 15,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3166,
      "product": 181,
      "nutrient": 18,
      "value": "225",
      "perc1on100gr": "0"
  },
  {
      "_id": 3167,
      "product": 181,
      "nutrient": 19,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 3168,
      "product": 181,
      "nutrient": 21,
      "value": "63",
      "perc1on100gr": "0"
  },
  {
      "_id": 3169,
      "product": 181,
      "nutrient": 22,
      "value": "343",
      "perc1on100gr": "0"
  },
  {
      "_id": 3170,
      "product": 181,
      "nutrient": 24,
      "value": "172",
      "perc1on100gr": "0"
  },
  {
      "_id": 3171,
      "product": 181,
      "nutrient": 17,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3172,
      "product": 181,
      "nutrient": 47,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3175,
      "product": 182,
      "nutrient": 0,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3176,
      "product": 182,
      "nutrient": 1,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3177,
      "product": 182,
      "nutrient": 2,
      "value": "51.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3178,
      "product": 182,
      "nutrient": 3,
      "value": "250",
      "perc1on100gr": "0"
  },
  {
      "_id": 3179,
      "product": 182,
      "nutrient": 5,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3180,
      "product": 182,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3181,
      "product": 182,
      "nutrient": 15,
      "value": "1.51",
      "perc1on100gr": "0"
  },
  {
      "_id": 3182,
      "product": 182,
      "nutrient": 18,
      "value": "125",
      "perc1on100gr": "0"
  },
  {
      "_id": 3183,
      "product": 182,
      "nutrient": 19,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3184,
      "product": 182,
      "nutrient": 21,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 3185,
      "product": 182,
      "nutrient": 22,
      "value": "402",
      "perc1on100gr": "0"
  },
  {
      "_id": 3186,
      "product": 182,
      "nutrient": 24,
      "value": "82",
      "perc1on100gr": "0"
  },
  {
      "_id": 3187,
      "product": 182,
      "nutrient": 17,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3188,
      "product": 183,
      "nutrient": 0,
      "value": "23.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3189,
      "product": 183,
      "nutrient": 1,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3190,
      "product": 183,
      "nutrient": 2,
      "value": "15.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3191,
      "product": 183,
      "nutrient": 3,
      "value": "182",
      "perc1on100gr": "0"
  },
  {
      "_id": 3192,
      "product": 183,
      "nutrient": 46,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3193,
      "product": 183,
      "nutrient": 5,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3194,
      "product": 183,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3195,
      "product": 183,
      "nutrient": 15,
      "value": "3.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3196,
      "product": 183,
      "nutrient": 18,
      "value": "254",
      "perc1on100gr": "0"
  },
  {
      "_id": 3197,
      "product": 183,
      "nutrient": 19,
      "value": "70",
      "perc1on100gr": "0"
  },
  {
      "_id": 3198,
      "product": 183,
      "nutrient": 21,
      "value": "106",
      "perc1on100gr": "0"
  },
  {
      "_id": 3199,
      "product": 183,
      "nutrient": 22,
      "value": "268",
      "perc1on100gr": "0"
  },
  {
      "_id": 3200,
      "product": 183,
      "nutrient": 24,
      "value": "267",
      "perc1on100gr": "0"
  },
  {
      "_id": 3201,
      "product": 183,
      "nutrient": 17,
      "value": "8.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3203,
      "product": 184,
      "nutrient": 0,
      "value": "12.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3204,
      "product": 184,
      "nutrient": 1,
      "value": "11.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3205,
      "product": 184,
      "nutrient": 2,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3206,
      "product": 184,
      "nutrient": 3,
      "value": "157",
      "perc1on100gr": "0"
  },
  {
      "_id": 3207,
      "product": 184,
      "nutrient": 4,
      "value": "350",
      "perc1on100gr": "0"
  },
  {
      "_id": 3208,
      "product": 184,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3209,
      "product": 184,
      "nutrient": 6,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 3210,
      "product": 184,
      "nutrient": 15,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 3211,
      "product": 184,
      "nutrient": 18,
      "value": "153",
      "perc1on100gr": "0"
  },
  {
      "_id": 3212,
      "product": 184,
      "nutrient": 19,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 3213,
      "product": 184,
      "nutrient": 21,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 3214,
      "product": 184,
      "nutrient": 22,
      "value": "71",
      "perc1on100gr": "0"
  },
  {
      "_id": 3215,
      "product": 184,
      "nutrient": 24,
      "value": "185",
      "perc1on100gr": "0"
  },
  {
      "_id": 3216,
      "product": 184,
      "nutrient": 17,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3218,
      "product": 185,
      "nutrient": 0,
      "value": "82.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3219,
      "product": 185,
      "nutrient": 1,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3220,
      "product": 185,
      "nutrient": 2,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3221,
      "product": 185,
      "nutrient": 3,
      "value": "350",
      "perc1on100gr": "0"
  },
  {
      "_id": 3222,
      "product": 185,
      "nutrient": 6,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3223,
      "product": 185,
      "nutrient": 18,
      "value": "1067",
      "perc1on100gr": "0"
  },
  {
      "_id": 3224,
      "product": 185,
      "nutrient": 19,
      "value": "75",
      "perc1on100gr": "0"
  },
  {
      "_id": 3225,
      "product": 185,
      "nutrient": 21,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 3226,
      "product": 185,
      "nutrient": 22,
      "value": "1297",
      "perc1on100gr": "0"
  },
  {
      "_id": 3227,
      "product": 185,
      "nutrient": 24,
      "value": "194",
      "perc1on100gr": "0"
  },
  {
      "_id": 3228,
      "product": 185,
      "nutrient": 17,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3230,
      "product": 186,
      "nutrient": 0,
      "value": "11.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3231,
      "product": 186,
      "nutrient": 2,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3232,
      "product": 186,
      "nutrient": 3,
      "value": "48",
      "perc1on100gr": "0"
  },
  {
      "_id": 3233,
      "product": 186,
      "nutrient": 45,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3234,
      "product": 186,
      "nutrient": 6,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3235,
      "product": 186,
      "nutrient": 52,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 3236,
      "product": 186,
      "nutrient": 8,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 3237,
      "product": 186,
      "nutrient": 9,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3238,
      "product": 186,
      "nutrient": 10,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3239,
      "product": 186,
      "nutrient": 14,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3240,
      "product": 186,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3241,
      "product": 186,
      "nutrient": 16,
      "value": "39",
      "perc1on100gr": "0"
  },
  {
      "_id": 3242,
      "product": 186,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 3243,
      "product": 186,
      "nutrient": 19,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 3244,
      "product": 186,
      "nutrient": 21,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3245,
      "product": 186,
      "nutrient": 22,
      "value": "189",
      "perc1on100gr": "0"
  },
  {
      "_id": 3246,
      "product": 186,
      "nutrient": 23,
      "value": "187",
      "perc1on100gr": "0"
  },
  {
      "_id": 3247,
      "product": 186,
      "nutrient": 24,
      "value": "27",
      "perc1on100gr": "0"
  },
  {
      "_id": 3248,
      "product": 186,
      "nutrient": 25,
      "value": "172",
      "perc1on100gr": "0"
  },
  {
      "_id": 3249,
      "product": 186,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3250,
      "product": 186,
      "nutrient": 29,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3251,
      "product": 186,
      "nutrient": 30,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3252,
      "product": 186,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 3253,
      "product": 186,
      "nutrient": 33,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3254,
      "product": 186,
      "nutrient": 34,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3255,
      "product": 186,
      "nutrient": 42,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3256,
      "product": 186,
      "nutrient": 43,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 3259,
      "product": 187,
      "nutrient": 0,
      "value": "31.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3260,
      "product": 187,
      "nutrient": 1,
      "value": "52.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3261,
      "product": 187,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3262,
      "product": 187,
      "nutrient": 3,
      "value": "612",
      "perc1on100gr": "0"
  },
  {
      "_id": 3263,
      "product": 187,
      "nutrient": 45,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3264,
      "product": 187,
      "nutrient": 4,
      "value": "2227",
      "perc1on100gr": "0"
  },
  {
      "_id": 3265,
      "product": 187,
      "nutrient": 5,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 3266,
      "product": 187,
      "nutrient": 6,
      "value": "0.47",
      "perc1on100gr": "0"
  },
  {
      "_id": 3267,
      "product": 187,
      "nutrient": 13,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3268,
      "product": 187,
      "nutrient": 15,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3269,
      "product": 187,
      "nutrient": 18,
      "value": "249",
      "perc1on100gr": "0"
  },
  {
      "_id": 3270,
      "product": 187,
      "nutrient": 19,
      "value": "262",
      "perc1on100gr": "0"
  },
  {
      "_id": 3271,
      "product": 187,
      "nutrient": 21,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 3272,
      "product": 187,
      "nutrient": 22,
      "value": "99",
      "perc1on100gr": "0"
  },
  {
      "_id": 3273,
      "product": 187,
      "nutrient": 23,
      "value": "328",
      "perc1on100gr": "0"
  },
  {
      "_id": 3274,
      "product": 187,
      "nutrient": 24,
      "value": "1047",
      "perc1on100gr": "0"
  },
  {
      "_id": 3275,
      "product": 187,
      "nutrient": 25,
      "value": "984",
      "perc1on100gr": "0"
  },
  {
      "_id": 3276,
      "product": 187,
      "nutrient": 17,
      "value": "12.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3277,
      "product": 187,
      "nutrient": 29,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 3278,
      "product": 187,
      "nutrient": 30,
      "value": "80",
      "perc1on100gr": "0"
  },
  {
      "_id": 3279,
      "product": 187,
      "nutrient": 32,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3280,
      "product": 187,
      "nutrient": 33,
      "value": "0.48",
      "perc1on100gr": "0"
  },
  {
      "_id": 3281,
      "product": 187,
      "nutrient": 34,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 3282,
      "product": 187,
      "nutrient": 42,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3283,
      "product": 187,
      "nutrient": 43,
      "value": "1.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 3284,
      "product": 187,
      "nutrient": 47,
      "value": "2453",
      "perc1on100gr": "0"
  },
  {
      "_id": 3287,
      "product": 188,
      "nutrient": 0,
      "value": "16.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3288,
      "product": 188,
      "nutrient": 1,
      "value": "31.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3289,
      "product": 188,
      "nutrient": 3,
      "value": "354",
      "perc1on100gr": "0"
  },
  {
      "_id": 3290,
      "product": 188,
      "nutrient": 4,
      "value": "908",
      "perc1on100gr": "0"
  },
  {
      "_id": 3291,
      "product": 188,
      "nutrient": 5,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 3292,
      "product": 188,
      "nutrient": 6,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 3293,
      "product": 188,
      "nutrient": 52,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3294,
      "product": 188,
      "nutrient": 8,
      "value": "0.46",
      "perc1on100gr": "0"
  },
  {
      "_id": 3295,
      "product": 188,
      "nutrient": 9,
      "value": "22.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3296,
      "product": 188,
      "nutrient": 10,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3297,
      "product": 188,
      "nutrient": 12,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3298,
      "product": 188,
      "nutrient": 13,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3299,
      "product": 188,
      "nutrient": 14,
      "value": "56",
      "perc1on100gr": "0"
  },
  {
      "_id": 3300,
      "product": 188,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3301,
      "product": 188,
      "nutrient": 16,
      "value": "800",
      "perc1on100gr": "0"
  },
  {
      "_id": 3302,
      "product": 188,
      "nutrient": 18,
      "value": "129",
      "perc1on100gr": "0"
  },
  {
      "_id": 3303,
      "product": 188,
      "nutrient": 19,
      "value": "135",
      "perc1on100gr": "0"
  },
  {
      "_id": 3304,
      "product": 188,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3305,
      "product": 188,
      "nutrient": 22,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 3306,
      "product": 188,
      "nutrient": 23,
      "value": "170",
      "perc1on100gr": "0"
  },
  {
      "_id": 3307,
      "product": 188,
      "nutrient": 24,
      "value": "542",
      "perc1on100gr": "0"
  },
  {
      "_id": 3308,
      "product": 188,
      "nutrient": 25,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 3309,
      "product": 188,
      "nutrient": 17,
      "value": "6.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3310,
      "product": 188,
      "nutrient": 29,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 3311,
      "product": 188,
      "nutrient": 30,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 3312,
      "product": 188,
      "nutrient": 32,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3313,
      "product": 188,
      "nutrient": 33,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3314,
      "product": 188,
      "nutrient": 34,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3315,
      "product": 188,
      "nutrient": 42,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3316,
      "product": 188,
      "nutrient": 43,
      "value": "3.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3317,
      "product": 188,
      "nutrient": 47,
      "value": "1510",
      "perc1on100gr": "0"
  },
  {
      "_id": 3320,
      "product": 189,
      "nutrient": 0,
      "value": "10.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3321,
      "product": 189,
      "nutrient": 1,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3322,
      "product": 189,
      "nutrient": 2,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3323,
      "product": 189,
      "nutrient": 3,
      "value": "200",
      "perc1on100gr": "0"
  },
  {
      "_id": 3324,
      "product": 189,
      "nutrient": 45,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3325,
      "product": 189,
      "nutrient": 4,
      "value": "217",
      "perc1on100gr": "0"
  },
  {
      "_id": 3326,
      "product": 189,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3327,
      "product": 189,
      "nutrient": 6,
      "value": "0.39",
      "perc1on100gr": "0"
  },
  {
      "_id": 3328,
      "product": 189,
      "nutrient": 13,
      "value": "0.47",
      "perc1on100gr": "0"
  },
  {
      "_id": 3329,
      "product": 189,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3330,
      "product": 189,
      "nutrient": 18,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 3331,
      "product": 189,
      "nutrient": 19,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 3332,
      "product": 189,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3333,
      "product": 189,
      "nutrient": 22,
      "value": "504",
      "perc1on100gr": "0"
  },
  {
      "_id": 3334,
      "product": 189,
      "nutrient": 24,
      "value": "193",
      "perc1on100gr": "0"
  },
  {
      "_id": 3335,
      "product": 189,
      "nutrient": 17,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3336,
      "product": 189,
      "nutrient": 47,
      "value": "454",
      "perc1on100gr": "0"
  },
  {
      "_id": 3339,
      "product": 190,
      "nutrient": 0,
      "value": "12.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3340,
      "product": 190,
      "nutrient": 1,
      "value": "20.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3341,
      "product": 190,
      "nutrient": 2,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3342,
      "product": 190,
      "nutrient": 3,
      "value": "243",
      "perc1on100gr": "0"
  },
  {
      "_id": 3343,
      "product": 190,
      "nutrient": 45,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3344,
      "product": 190,
      "nutrient": 4,
      "value": "225",
      "perc1on100gr": "0"
  },
  {
      "_id": 3345,
      "product": 190,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3346,
      "product": 190,
      "nutrient": 6,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 3347,
      "product": 190,
      "nutrient": 13,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3348,
      "product": 190,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3349,
      "product": 190,
      "nutrient": 18,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 3350,
      "product": 190,
      "nutrient": 19,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 3351,
      "product": 190,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3352,
      "product": 190,
      "nutrient": 22,
      "value": "404",
      "perc1on100gr": "0"
  },
  {
      "_id": 3353,
      "product": 190,
      "nutrient": 24,
      "value": "218",
      "perc1on100gr": "0"
  },
  {
      "_id": 3354,
      "product": 190,
      "nutrient": 17,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3355,
      "product": 190,
      "nutrient": 47,
      "value": "548",
      "perc1on100gr": "0"
  },
  {
      "_id": 3358,
      "product": 191,
      "nutrient": 0,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 3359,
      "product": 191,
      "nutrient": 1,
      "value": "37.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3360,
      "product": 191,
      "nutrient": 2,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3361,
      "product": 191,
      "nutrient": 3,
      "value": "542",
      "perc1on100gr": "0"
  },
  {
      "_id": 3362,
      "product": 191,
      "nutrient": 4,
      "value": "925",
      "perc1on100gr": "0"
  },
  {
      "_id": 3363,
      "product": 191,
      "nutrient": 5,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3364,
      "product": 191,
      "nutrient": 6,
      "value": "1.64",
      "perc1on100gr": "0"
  },
  {
      "_id": 3365,
      "product": 191,
      "nutrient": 52,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3366,
      "product": 191,
      "nutrient": 8,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3367,
      "product": 191,
      "nutrient": 9,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3368,
      "product": 191,
      "nutrient": 12,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3369,
      "product": 191,
      "nutrient": 13,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3370,
      "product": 191,
      "nutrient": 15,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3371,
      "product": 191,
      "nutrient": 16,
      "value": "900",
      "perc1on100gr": "0"
  },
  {
      "_id": 3372,
      "product": 191,
      "nutrient": 18,
      "value": "448",
      "perc1on100gr": "0"
  },
  {
      "_id": 3373,
      "product": 191,
      "nutrient": 19,
      "value": "193",
      "perc1on100gr": "0"
  },
  {
      "_id": 3374,
      "product": 191,
      "nutrient": 21,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 3375,
      "product": 191,
      "nutrient": 22,
      "value": "436",
      "perc1on100gr": "0"
  },
  {
      "_id": 3376,
      "product": 191,
      "nutrient": 23,
      "value": "625",
      "perc1on100gr": "0"
  },
  {
      "_id": 3377,
      "product": 191,
      "nutrient": 24,
      "value": "795",
      "perc1on100gr": "0"
  },
  {
      "_id": 3378,
      "product": 191,
      "nutrient": 25,
      "value": "581",
      "perc1on100gr": "0"
  },
  {
      "_id": 3379,
      "product": 191,
      "nutrient": 17,
      "value": "8.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3380,
      "product": 191,
      "nutrient": 29,
      "value": "64",
      "perc1on100gr": "0"
  },
  {
      "_id": 3381,
      "product": 191,
      "nutrient": 30,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3382,
      "product": 191,
      "nutrient": 32,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3383,
      "product": 191,
      "nutrient": 33,
      "value": "0.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3384,
      "product": 191,
      "nutrient": 34,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 3385,
      "product": 191,
      "nutrient": 41,
      "value": "200",
      "perc1on100gr": "0"
  },
  {
      "_id": 3386,
      "product": 191,
      "nutrient": 42,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3387,
      "product": 191,
      "nutrient": 43,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3388,
      "product": 191,
      "nutrient": 47,
      "value": "2050",
      "perc1on100gr": "0"
  },
  {
      "_id": 3391,
      "product": 192,
      "nutrient": 0,
      "value": "12.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3392,
      "product": 192,
      "nutrient": 1,
      "value": "11.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3393,
      "product": 192,
      "nutrient": 2,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3394,
      "product": 192,
      "nutrient": 3,
      "value": "157",
      "perc1on100gr": "0"
  },
  {
      "_id": 3395,
      "product": 192,
      "nutrient": 4,
      "value": "255",
      "perc1on100gr": "0"
  },
  {
      "_id": 3396,
      "product": 192,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3397,
      "product": 192,
      "nutrient": 6,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 3398,
      "product": 192,
      "nutrient": 13,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3399,
      "product": 192,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3400,
      "product": 192,
      "nutrient": 18,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 3401,
      "product": 192,
      "nutrient": 19,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 3402,
      "product": 192,
      "nutrient": 21,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3403,
      "product": 192,
      "nutrient": 22,
      "value": "134",
      "perc1on100gr": "0"
  },
  {
      "_id": 3404,
      "product": 192,
      "nutrient": 24,
      "value": "192",
      "perc1on100gr": "0"
  },
  {
      "_id": 3405,
      "product": 192,
      "nutrient": 17,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3406,
      "product": 192,
      "nutrient": 47,
      "value": "570",
      "perc1on100gr": "0"
  },
  {
      "_id": 3409,
      "product": 193,
      "nutrient": 0,
      "value": "12.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3410,
      "product": 193,
      "nutrient": 1,
      "value": "11.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3411,
      "product": 193,
      "nutrient": 2,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3412,
      "product": 193,
      "nutrient": 3,
      "value": "157",
      "perc1on100gr": "0"
  },
  {
      "_id": 3413,
      "product": 193,
      "nutrient": 4,
      "value": "255",
      "perc1on100gr": "0"
  },
  {
      "_id": 3414,
      "product": 193,
      "nutrient": 5,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3415,
      "product": 193,
      "nutrient": 6,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 3416,
      "product": 193,
      "nutrient": 52,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3417,
      "product": 193,
      "nutrient": 8,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3418,
      "product": 193,
      "nutrient": 9,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3419,
      "product": 193,
      "nutrient": 10,
      "value": "0.52",
      "perc1on100gr": "0"
  },
  {
      "_id": 3420,
      "product": 193,
      "nutrient": 12,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3421,
      "product": 193,
      "nutrient": 13,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3422,
      "product": 193,
      "nutrient": 14,
      "value": "20.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3423,
      "product": 193,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3424,
      "product": 193,
      "nutrient": 16,
      "value": "251",
      "perc1on100gr": "0"
  },
  {
      "_id": 3425,
      "product": 193,
      "nutrient": 18,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 3426,
      "product": 193,
      "nutrient": 19,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 3427,
      "product": 193,
      "nutrient": 21,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3428,
      "product": 193,
      "nutrient": 22,
      "value": "134",
      "perc1on100gr": "0"
  },
  {
      "_id": 3429,
      "product": 193,
      "nutrient": 23,
      "value": "176",
      "perc1on100gr": "0"
  },
  {
      "_id": 3430,
      "product": 193,
      "nutrient": 24,
      "value": "192",
      "perc1on100gr": "0"
  },
  {
      "_id": 3431,
      "product": 193,
      "nutrient": 25,
      "value": "156",
      "perc1on100gr": "0"
  },
  {
      "_id": 3432,
      "product": 193,
      "nutrient": 17,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3433,
      "product": 193,
      "nutrient": 29,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 3434,
      "product": 193,
      "nutrient": 30,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 3435,
      "product": 193,
      "nutrient": 32,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3436,
      "product": 193,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3437,
      "product": 193,
      "nutrient": 34,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3438,
      "product": 193,
      "nutrient": 41,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 3439,
      "product": 193,
      "nutrient": 42,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3440,
      "product": 193,
      "nutrient": 43,
      "value": "1.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3441,
      "product": 193,
      "nutrient": 47,
      "value": "570",
      "perc1on100gr": "0"
  },
  {
      "_id": 3444,
      "product": 194,
      "nutrient": 0,
      "value": "11.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3445,
      "product": 194,
      "nutrient": 1,
      "value": "13.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3446,
      "product": 194,
      "nutrient": 2,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3447,
      "product": 194,
      "nutrient": 3,
      "value": "168",
      "perc1on100gr": "0"
  },
  {
      "_id": 3448,
      "product": 194,
      "nutrient": 4,
      "value": "477",
      "perc1on100gr": "0"
  },
  {
      "_id": 3449,
      "product": 194,
      "nutrient": 5,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3450,
      "product": 194,
      "nutrient": 6,
      "value": "0.65",
      "perc1on100gr": "0"
  },
  {
      "_id": 3451,
      "product": 194,
      "nutrient": 8,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3452,
      "product": 194,
      "nutrient": 9,
      "value": "5.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3453,
      "product": 194,
      "nutrient": 13,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3454,
      "product": 194,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3455,
      "product": 194,
      "nutrient": 16,
      "value": "507",
      "perc1on100gr": "0"
  },
  {
      "_id": 3456,
      "product": 194,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 3457,
      "product": 194,
      "nutrient": 19,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 3458,
      "product": 194,
      "nutrient": 21,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3459,
      "product": 194,
      "nutrient": 22,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 3460,
      "product": 194,
      "nutrient": 23,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 3461,
      "product": 194,
      "nutrient": 24,
      "value": "218",
      "perc1on100gr": "0"
  },
  {
      "_id": 3462,
      "product": 194,
      "nutrient": 25,
      "value": "147",
      "perc1on100gr": "0"
  },
  {
      "_id": 3463,
      "product": 194,
      "nutrient": 17,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3464,
      "product": 194,
      "nutrient": 30,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3465,
      "product": 194,
      "nutrient": 32,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3466,
      "product": 194,
      "nutrient": 33,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3467,
      "product": 194,
      "nutrient": 34,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3468,
      "product": 194,
      "nutrient": 42,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3469,
      "product": 194,
      "nutrient": 47,
      "value": "600",
      "perc1on100gr": "0"
  },
  {
      "_id": 3472,
      "product": 195,
      "nutrient": 0,
      "value": "12.81",
      "perc1on100gr": "0"
  },
  {
      "_id": 3473,
      "product": 195,
      "nutrient": 1,
      "value": "13.77",
      "perc1on100gr": "0"
  },
  {
      "_id": 3474,
      "product": 195,
      "nutrient": 2,
      "value": "1.45",
      "perc1on100gr": "0"
  },
  {
      "_id": 3475,
      "product": 195,
      "nutrient": 3,
      "value": "185",
      "perc1on100gr": "0"
  },
  {
      "_id": 3476,
      "product": 195,
      "nutrient": 45,
      "value": "0.93",
      "perc1on100gr": "0"
  },
  {
      "_id": 3477,
      "product": 195,
      "nutrient": 4,
      "value": "194",
      "perc1on100gr": "0"
  },
  {
      "_id": 3478,
      "product": 195,
      "nutrient": 5,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3479,
      "product": 195,
      "nutrient": 6,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3480,
      "product": 195,
      "nutrient": 52,
      "value": "1.86",
      "perc1on100gr": "0"
  },
  {
      "_id": 3481,
      "product": 195,
      "nutrient": 8,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3482,
      "product": 195,
      "nutrient": 9,
      "value": "80",
      "perc1on100gr": "0"
  },
  {
      "_id": 3483,
      "product": 195,
      "nutrient": 10,
      "value": "5.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3484,
      "product": 195,
      "nutrient": 12,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3485,
      "product": 195,
      "nutrient": 13,
      "value": "1.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 3486,
      "product": 195,
      "nutrient": 52,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3487,
      "product": 195,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3488,
      "product": 195,
      "nutrient": 16,
      "value": "263.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3489,
      "product": 195,
      "nutrient": 18,
      "value": "222",
      "perc1on100gr": "0"
  },
  {
      "_id": 3490,
      "product": 195,
      "nutrient": 19,
      "value": "64",
      "perc1on100gr": "0"
  },
  {
      "_id": 3491,
      "product": 195,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3492,
      "product": 195,
      "nutrient": 22,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 3493,
      "product": 195,
      "nutrient": 24,
      "value": "220",
      "perc1on100gr": "0"
  },
  {
      "_id": 3494,
      "product": 195,
      "nutrient": 17,
      "value": "3.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 3495,
      "product": 195,
      "nutrient": 32,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3496,
      "product": 195,
      "nutrient": 33,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 3497,
      "product": 195,
      "nutrient": 38,
      "value": "36.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3498,
      "product": 195,
      "nutrient": 43,
      "value": "1.41",
      "perc1on100gr": "0"
  },
  {
      "_id": 3499,
      "product": 195,
      "nutrient": 47,
      "value": "884",
      "perc1on100gr": "0"
  },
  {
      "_id": 3502,
      "product": 196,
      "nutrient": 0,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3503,
      "product": 196,
      "nutrient": 1,
      "value": "24.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3504,
      "product": 196,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3505,
      "product": 196,
      "nutrient": 3,
      "value": "256",
      "perc1on100gr": "0"
  },
  {
      "_id": 3506,
      "product": 196,
      "nutrient": 45,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3507,
      "product": 196,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3508,
      "product": 196,
      "nutrient": 53,
      "value": "2.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3509,
      "product": 196,
      "nutrient": 4,
      "value": "170",
      "perc1on100gr": "0"
  },
  {
      "_id": 3510,
      "product": 196,
      "nutrient": 5,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3511,
      "product": 196,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3512,
      "product": 196,
      "nutrient": 13,
      "value": "10.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3513,
      "product": 196,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3514,
      "product": 196,
      "nutrient": 18,
      "value": "193",
      "perc1on100gr": "0"
  },
  {
      "_id": 3515,
      "product": 196,
      "nutrient": 19,
      "value": "33",
      "perc1on100gr": "0"
  },
  {
      "_id": 3516,
      "product": 196,
      "nutrient": 21,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 3517,
      "product": 196,
      "nutrient": 22,
      "value": "210",
      "perc1on100gr": "0"
  },
  {
      "_id": 3518,
      "product": 196,
      "nutrient": 24,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 3519,
      "product": 196,
      "nutrient": 17,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3520,
      "product": 196,
      "nutrient": 47,
      "value": "147",
      "perc1on100gr": "0"
  },
  {
      "_id": 3523,
      "product": 197,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3524,
      "product": 197,
      "nutrient": 1,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3525,
      "product": 197,
      "nutrient": 2,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3526,
      "product": 197,
      "nutrient": 3,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 3527,
      "product": 197,
      "nutrient": 45,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3528,
      "product": 197,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3529,
      "product": 197,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3530,
      "product": 197,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3531,
      "product": 197,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3532,
      "product": 197,
      "nutrient": 18,
      "value": "145",
      "perc1on100gr": "0"
  },
  {
      "_id": 3533,
      "product": 197,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 3534,
      "product": 197,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3535,
      "product": 197,
      "nutrient": 22,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3536,
      "product": 197,
      "nutrient": 24,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 3537,
      "product": 197,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3540,
      "product": 198,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3541,
      "product": 198,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3542,
      "product": 198,
      "nutrient": 2,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3543,
      "product": 198,
      "nutrient": 3,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 3544,
      "product": 198,
      "nutrient": 45,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3545,
      "product": 198,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3546,
      "product": 198,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3547,
      "product": 198,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3548,
      "product": 198,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3549,
      "product": 198,
      "nutrient": 18,
      "value": "145",
      "perc1on100gr": "0"
  },
  {
      "_id": 3550,
      "product": 198,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 3551,
      "product": 198,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3552,
      "product": 198,
      "nutrient": 22,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3553,
      "product": 198,
      "nutrient": 24,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 3554,
      "product": 198,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3555,
      "product": 198,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3558,
      "product": 199,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3559,
      "product": 199,
      "nutrient": 1,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3560,
      "product": 199,
      "nutrient": 2,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3561,
      "product": 199,
      "nutrient": 3,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 3562,
      "product": 199,
      "nutrient": 45,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3563,
      "product": 199,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3564,
      "product": 199,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3565,
      "product": 199,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3566,
      "product": 199,
      "nutrient": 52,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 3567,
      "product": 199,
      "nutrient": 10,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 3568,
      "product": 199,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3569,
      "product": 199,
      "nutrient": 14,
      "value": "3.63",
      "perc1on100gr": "0"
  },
  {
      "_id": 3570,
      "product": 199,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3571,
      "product": 199,
      "nutrient": 16,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 3572,
      "product": 199,
      "nutrient": 18,
      "value": "145",
      "perc1on100gr": "0"
  },
  {
      "_id": 3573,
      "product": 199,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 3574,
      "product": 199,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3575,
      "product": 199,
      "nutrient": 22,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3576,
      "product": 199,
      "nutrient": 23,
      "value": "27",
      "perc1on100gr": "0"
  },
  {
      "_id": 3577,
      "product": 199,
      "nutrient": 24,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 3578,
      "product": 199,
      "nutrient": 25,
      "value": "99",
      "perc1on100gr": "0"
  },
  {
      "_id": 3579,
      "product": 199,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3580,
      "product": 199,
      "nutrient": 29,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3581,
      "product": 199,
      "nutrient": 30,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3582,
      "product": 199,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 3583,
      "product": 199,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 3584,
      "product": 199,
      "nutrient": 34,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3585,
      "product": 199,
      "nutrient": 38,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3586,
      "product": 199,
      "nutrient": 41,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 3587,
      "product": 199,
      "nutrient": 42,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3588,
      "product": 199,
      "nutrient": 43,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3589,
      "product": 199,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3592,
      "product": 200,
      "nutrient": 0,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3593,
      "product": 200,
      "nutrient": 1,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3594,
      "product": 200,
      "nutrient": 2,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3595,
      "product": 200,
      "nutrient": 3,
      "value": "77",
      "perc1on100gr": "0"
  },
  {
      "_id": 3596,
      "product": 200,
      "nutrient": 45,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3597,
      "product": 200,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3598,
      "product": 200,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3599,
      "product": 200,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3600,
      "product": 200,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3601,
      "product": 200,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3602,
      "product": 200,
      "nutrient": 18,
      "value": "145",
      "perc1on100gr": "0"
  },
  {
      "_id": 3603,
      "product": 200,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 3604,
      "product": 200,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3605,
      "product": 200,
      "nutrient": 22,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3606,
      "product": 200,
      "nutrient": 24,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 3607,
      "product": 200,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3608,
      "product": 200,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3611,
      "product": 201,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3612,
      "product": 201,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3613,
      "product": 201,
      "nutrient": 3,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3614,
      "product": 201,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3615,
      "product": 201,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3616,
      "product": 201,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3617,
      "product": 201,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3618,
      "product": 201,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3619,
      "product": 201,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3620,
      "product": 201,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 3621,
      "product": 201,
      "nutrient": 19,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 3622,
      "product": 201,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3623,
      "product": 201,
      "nutrient": 22,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 3624,
      "product": 201,
      "nutrient": 24,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 3625,
      "product": 201,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3626,
      "product": 201,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3629,
      "product": 202,
      "nutrient": 0,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3630,
      "product": 202,
      "nutrient": 1,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3631,
      "product": 202,
      "nutrient": 2,
      "value": "5.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3632,
      "product": 202,
      "nutrient": 3,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 3633,
      "product": 202,
      "nutrient": 45,
      "value": "5.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3634,
      "product": 202,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 3635,
      "product": 202,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3636,
      "product": 202,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3637,
      "product": 202,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3638,
      "product": 202,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3639,
      "product": 202,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 3640,
      "product": 202,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 3641,
      "product": 202,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3642,
      "product": 202,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3643,
      "product": 202,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 3644,
      "product": 202,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3645,
      "product": 202,
      "nutrient": 47,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3648,
      "product": 203,
      "nutrient": 0,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3649,
      "product": 203,
      "nutrient": 1,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3650,
      "product": 203,
      "nutrient": 2,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3651,
      "product": 203,
      "nutrient": 3,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 3652,
      "product": 203,
      "nutrient": 45,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3653,
      "product": 203,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3654,
      "product": 203,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3655,
      "product": 203,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3656,
      "product": 203,
      "nutrient": 52,
      "value": "0.31",
      "perc1on100gr": "0"
  },
  {
      "_id": 3657,
      "product": 203,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3658,
      "product": 203,
      "nutrient": 10,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 3659,
      "product": 203,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3660,
      "product": 203,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3661,
      "product": 203,
      "nutrient": 16,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 3662,
      "product": 203,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3665,
      "product": 204,
      "nutrient": 0,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3666,
      "product": 204,
      "nutrient": 1,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3667,
      "product": 204,
      "nutrient": 2,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3668,
      "product": 204,
      "nutrient": 3,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 3669,
      "product": 204,
      "nutrient": 45,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3670,
      "product": 204,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3671,
      "product": 204,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3672,
      "product": 204,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3673,
      "product": 204,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3674,
      "product": 204,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3675,
      "product": 204,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3676,
      "product": 204,
      "nutrient": 18,
      "value": "147",
      "perc1on100gr": "0"
  },
  {
      "_id": 3677,
      "product": 204,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 3678,
      "product": 204,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3679,
      "product": 204,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3680,
      "product": 204,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 3681,
      "product": 204,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3682,
      "product": 204,
      "nutrient": 47,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3685,
      "product": 205,
      "nutrient": 0,
      "value": "4.93",
      "perc1on100gr": "0"
  },
  {
      "_id": 3686,
      "product": 205,
      "nutrient": 1,
      "value": "1.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 3687,
      "product": 205,
      "nutrient": 2,
      "value": "13.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3688,
      "product": 205,
      "nutrient": 3,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 3689,
      "product": 205,
      "nutrient": 45,
      "value": "13.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3690,
      "product": 205,
      "nutrient": 4,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3691,
      "product": 205,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3692,
      "product": 205,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3693,
      "product": 205,
      "nutrient": 52,
      "value": "0.55",
      "perc1on100gr": "0"
  },
  {
      "_id": 3694,
      "product": 205,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3695,
      "product": 205,
      "nutrient": 9,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3696,
      "product": 205,
      "nutrient": 10,
      "value": "0.53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3697,
      "product": 205,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3698,
      "product": 205,
      "nutrient": 13,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 3699,
      "product": 205,
      "nutrient": 52,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3700,
      "product": 205,
      "nutrient": 15,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3701,
      "product": 205,
      "nutrient": 16,
      "value": "15.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3702,
      "product": 205,
      "nutrient": 18,
      "value": "219",
      "perc1on100gr": "0"
  },
  {
      "_id": 3703,
      "product": 205,
      "nutrient": 19,
      "value": "171",
      "perc1on100gr": "0"
  },
  {
      "_id": 3704,
      "product": 205,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3705,
      "product": 205,
      "nutrient": 22,
      "value": "66",
      "perc1on100gr": "0"
  },
  {
      "_id": 3706,
      "product": 205,
      "nutrient": 24,
      "value": "135",
      "perc1on100gr": "0"
  },
  {
      "_id": 3707,
      "product": 205,
      "nutrient": 17,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3708,
      "product": 205,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 3709,
      "product": 205,
      "nutrient": 38,
      "value": "4.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3710,
      "product": 205,
      "nutrient": 41,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3711,
      "product": 205,
      "nutrient": 43,
      "value": "0.83",
      "perc1on100gr": "0"
  },
  {
      "_id": 3712,
      "product": 205,
      "nutrient": 47,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3715,
      "product": 206,
      "nutrient": 0,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3716,
      "product": 206,
      "nutrient": 1,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3717,
      "product": 206,
      "nutrient": 2,
      "value": "14.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3718,
      "product": 206,
      "nutrient": 3,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 3719,
      "product": 206,
      "nutrient": 45,
      "value": "14.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3720,
      "product": 206,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 3721,
      "product": 206,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3722,
      "product": 206,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3723,
      "product": 206,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3724,
      "product": 206,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3725,
      "product": 206,
      "nutrient": 18,
      "value": "137",
      "perc1on100gr": "0"
  },
  {
      "_id": 3726,
      "product": 206,
      "nutrient": 19,
      "value": "112",
      "perc1on100gr": "0"
  },
  {
      "_id": 3727,
      "product": 206,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3728,
      "product": 206,
      "nutrient": 22,
      "value": "45",
      "perc1on100gr": "0"
  },
  {
      "_id": 3729,
      "product": 206,
      "nutrient": 24,
      "value": "86",
      "perc1on100gr": "0"
  },
  {
      "_id": 3730,
      "product": 206,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3731,
      "product": 206,
      "nutrient": 47,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3734,
      "product": 207,
      "nutrient": 0,
      "value": "3.86",
      "perc1on100gr": "0"
  },
  {
      "_id": 3735,
      "product": 207,
      "nutrient": 1,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 3736,
      "product": 207,
      "nutrient": 2,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3737,
      "product": 207,
      "nutrient": 3,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 3738,
      "product": 207,
      "nutrient": 45,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3739,
      "product": 207,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3740,
      "product": 207,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3741,
      "product": 207,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3742,
      "product": 207,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3743,
      "product": 207,
      "nutrient": 9,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3744,
      "product": 207,
      "nutrient": 10,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 3745,
      "product": 207,
      "nutrient": 11,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3746,
      "product": 207,
      "nutrient": 15,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 3747,
      "product": 207,
      "nutrient": 16,
      "value": "15.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3748,
      "product": 207,
      "nutrient": 18,
      "value": "177",
      "perc1on100gr": "0"
  },
  {
      "_id": 3749,
      "product": 207,
      "nutrient": 19,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 3750,
      "product": 207,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3751,
      "product": 207,
      "nutrient": 22,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 3752,
      "product": 207,
      "nutrient": 24,
      "value": "109",
      "perc1on100gr": "0"
  },
  {
      "_id": 3753,
      "product": 207,
      "nutrient": 17,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3754,
      "product": 207,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3755,
      "product": 207,
      "nutrient": 38,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3756,
      "product": 207,
      "nutrient": 41,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3757,
      "product": 207,
      "nutrient": 43,
      "value": "0.67",
      "perc1on100gr": "0"
  },
  {
      "_id": 3758,
      "product": 207,
      "nutrient": 47,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3761,
      "product": 208,
      "nutrient": 0,
      "value": "3.86",
      "perc1on100gr": "0"
  },
  {
      "_id": 3762,
      "product": 208,
      "nutrient": 1,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 3763,
      "product": 208,
      "nutrient": 2,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3764,
      "product": 208,
      "nutrient": 3,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 3765,
      "product": 208,
      "nutrient": 45,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3766,
      "product": 208,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3767,
      "product": 208,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3768,
      "product": 208,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3769,
      "product": 208,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3770,
      "product": 208,
      "nutrient": 9,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3771,
      "product": 208,
      "nutrient": 10,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 3772,
      "product": 208,
      "nutrient": 11,
      "value": "1.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3773,
      "product": 208,
      "nutrient": 15,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 3774,
      "product": 208,
      "nutrient": 16,
      "value": "15.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3775,
      "product": 208,
      "nutrient": 18,
      "value": "177",
      "perc1on100gr": "0"
  },
  {
      "_id": 3776,
      "product": 208,
      "nutrient": 19,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 3777,
      "product": 208,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3778,
      "product": 208,
      "nutrient": 22,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 3779,
      "product": 208,
      "nutrient": 24,
      "value": "109",
      "perc1on100gr": "0"
  },
  {
      "_id": 3780,
      "product": 208,
      "nutrient": 17,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3781,
      "product": 208,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3782,
      "product": 208,
      "nutrient": 38,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3783,
      "product": 208,
      "nutrient": 41,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3784,
      "product": 208,
      "nutrient": 43,
      "value": "0.67",
      "perc1on100gr": "0"
  },
  {
      "_id": 3785,
      "product": 208,
      "nutrient": 47,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3788,
      "product": 209,
      "nutrient": 0,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3789,
      "product": 209,
      "nutrient": 1,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3790,
      "product": 209,
      "nutrient": 2,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3791,
      "product": 209,
      "nutrient": 3,
      "value": "87",
      "perc1on100gr": "0"
  },
  {
      "_id": 3792,
      "product": 209,
      "nutrient": 45,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3793,
      "product": 209,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3794,
      "product": 209,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3795,
      "product": 209,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3796,
      "product": 209,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3797,
      "product": 209,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3798,
      "product": 209,
      "nutrient": 18,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 3799,
      "product": 209,
      "nutrient": 19,
      "value": "119",
      "perc1on100gr": "0"
  },
  {
      "_id": 3800,
      "product": 209,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3801,
      "product": 209,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3802,
      "product": 209,
      "nutrient": 24,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 3803,
      "product": 209,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3804,
      "product": 209,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3807,
      "product": 210,
      "nutrient": 0,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3808,
      "product": 210,
      "nutrient": 1,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3809,
      "product": 210,
      "nutrient": 2,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3810,
      "product": 210,
      "nutrient": 3,
      "value": "112",
      "perc1on100gr": "0"
  },
  {
      "_id": 3811,
      "product": 210,
      "nutrient": 45,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3812,
      "product": 210,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3813,
      "product": 210,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3814,
      "product": 210,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3815,
      "product": 210,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3816,
      "product": 210,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3817,
      "product": 210,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3818,
      "product": 210,
      "nutrient": 18,
      "value": "137",
      "perc1on100gr": "0"
  },
  {
      "_id": 3819,
      "product": 210,
      "nutrient": 19,
      "value": "122",
      "perc1on100gr": "0"
  },
  {
      "_id": 3820,
      "product": 210,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3821,
      "product": 210,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3822,
      "product": 210,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 3823,
      "product": 210,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3824,
      "product": 210,
      "nutrient": 47,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3827,
      "product": 211,
      "nutrient": 0,
      "value": "4.86",
      "perc1on100gr": "0"
  },
  {
      "_id": 3828,
      "product": 211,
      "nutrient": 1,
      "value": "1.41",
      "perc1on100gr": "0"
  },
  {
      "_id": 3829,
      "product": 211,
      "nutrient": 2,
      "value": "18.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3830,
      "product": 211,
      "nutrient": 3,
      "value": "105",
      "perc1on100gr": "0"
  },
  {
      "_id": 3831,
      "product": 211,
      "nutrient": 45,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3832,
      "product": 211,
      "nutrient": 4,
      "value": "131",
      "perc1on100gr": "0"
  },
  {
      "_id": 3833,
      "product": 211,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3834,
      "product": 211,
      "nutrient": 6,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 3835,
      "product": 211,
      "nutrient": 52,
      "value": "0.54",
      "perc1on100gr": "0"
  },
  {
      "_id": 3836,
      "product": 211,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3837,
      "product": 211,
      "nutrient": 9,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 3838,
      "product": 211,
      "nutrient": 10,
      "value": "0.52",
      "perc1on100gr": "0"
  },
  {
      "_id": 3839,
      "product": 211,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3840,
      "product": 211,
      "nutrient": 13,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 3841,
      "product": 211,
      "nutrient": 52,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3842,
      "product": 211,
      "nutrient": 15,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3843,
      "product": 211,
      "nutrient": 16,
      "value": "15.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3844,
      "product": 211,
      "nutrient": 18,
      "value": "194",
      "perc1on100gr": "0"
  },
  {
      "_id": 3845,
      "product": 211,
      "nutrient": 19,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 3846,
      "product": 211,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 3847,
      "product": 211,
      "nutrient": 22,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 3848,
      "product": 211,
      "nutrient": 24,
      "value": "113",
      "perc1on100gr": "0"
  },
  {
      "_id": 3849,
      "product": 211,
      "nutrient": 17,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3850,
      "product": 211,
      "nutrient": 32,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3851,
      "product": 211,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 3852,
      "product": 211,
      "nutrient": 38,
      "value": "3.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3853,
      "product": 211,
      "nutrient": 43,
      "value": "0.82",
      "perc1on100gr": "0"
  },
  {
      "_id": 3854,
      "product": 211,
      "nutrient": 47,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 3857,
      "product": 212,
      "nutrient": 0,
      "value": "3.53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3858,
      "product": 212,
      "nutrient": 2,
      "value": "22.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 3859,
      "product": 212,
      "nutrient": 3,
      "value": "112",
      "perc1on100gr": "0"
  },
  {
      "_id": 3860,
      "product": 212,
      "nutrient": 45,
      "value": "14.97",
      "perc1on100gr": "0"
  },
  {
      "_id": 3861,
      "product": 212,
      "nutrient": 46,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3862,
      "product": 212,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3863,
      "product": 212,
      "nutrient": 6,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 3864,
      "product": 212,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3865,
      "product": 212,
      "nutrient": 9,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3866,
      "product": 212,
      "nutrient": 10,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3867,
      "product": 212,
      "nutrient": 15,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 3868,
      "product": 212,
      "nutrient": 16,
      "value": "15.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3869,
      "product": 212,
      "nutrient": 18,
      "value": "339",
      "perc1on100gr": "0"
  },
  {
      "_id": 3870,
      "product": 212,
      "nutrient": 19,
      "value": "88",
      "perc1on100gr": "0"
  },
  {
      "_id": 3871,
      "product": 212,
      "nutrient": 21,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 3872,
      "product": 212,
      "nutrient": 22,
      "value": "135",
      "perc1on100gr": "0"
  },
  {
      "_id": 3873,
      "product": 212,
      "nutrient": 24,
      "value": "166",
      "perc1on100gr": "0"
  },
  {
      "_id": 3874,
      "product": 212,
      "nutrient": 17,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 3875,
      "product": 212,
      "nutrient": 33,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3876,
      "product": 212,
      "nutrient": 38,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3877,
      "product": 212,
      "nutrient": 41,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 3878,
      "product": 212,
      "nutrient": 43,
      "value": "1.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 3879,
      "product": 212,
      "nutrient": 47,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3883,
      "product": 213,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3884,
      "product": 213,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3885,
      "product": 213,
      "nutrient": 2,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3886,
      "product": 213,
      "nutrient": 3,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 3887,
      "product": 213,
      "nutrient": 45,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3888,
      "product": 213,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3889,
      "product": 213,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3890,
      "product": 213,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3891,
      "product": 213,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3892,
      "product": 213,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 3893,
      "product": 213,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 3894,
      "product": 213,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3895,
      "product": 213,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3896,
      "product": 213,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 3897,
      "product": 213,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3898,
      "product": 213,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3901,
      "product": 214,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3902,
      "product": 214,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3903,
      "product": 214,
      "nutrient": 2,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3904,
      "product": 214,
      "nutrient": 3,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 3905,
      "product": 214,
      "nutrient": 45,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3906,
      "product": 214,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3907,
      "product": 214,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3908,
      "product": 214,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3909,
      "product": 214,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3910,
      "product": 214,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3911,
      "product": 214,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 3912,
      "product": 214,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 3913,
      "product": 214,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3914,
      "product": 214,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3915,
      "product": 214,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 3916,
      "product": 214,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3917,
      "product": 214,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3920,
      "product": 215,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3921,
      "product": 215,
      "nutrient": 1,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3922,
      "product": 215,
      "nutrient": 2,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3923,
      "product": 215,
      "nutrient": 3,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 3924,
      "product": 215,
      "nutrient": 45,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3925,
      "product": 215,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 3926,
      "product": 215,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3927,
      "product": 215,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3928,
      "product": 215,
      "nutrient": 52,
      "value": "0.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3929,
      "product": 215,
      "nutrient": 8,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 3930,
      "product": 215,
      "nutrient": 9,
      "value": "7.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3931,
      "product": 215,
      "nutrient": 10,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3932,
      "product": 215,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3933,
      "product": 215,
      "nutrient": 13,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 3934,
      "product": 215,
      "nutrient": 15,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 3935,
      "product": 215,
      "nutrient": 16,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 3936,
      "product": 215,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 3937,
      "product": 215,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 3938,
      "product": 215,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 3939,
      "product": 215,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3940,
      "product": 215,
      "nutrient": 23,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 3941,
      "product": 215,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 3942,
      "product": 215,
      "nutrient": 25,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 3943,
      "product": 215,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3944,
      "product": 215,
      "nutrient": 29,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3945,
      "product": 215,
      "nutrient": 30,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3946,
      "product": 215,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 3947,
      "product": 215,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 3948,
      "product": 215,
      "nutrient": 34,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3949,
      "product": 215,
      "nutrient": 38,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3950,
      "product": 215,
      "nutrient": 41,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 3951,
      "product": 215,
      "nutrient": 42,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3952,
      "product": 215,
      "nutrient": 43,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3953,
      "product": 215,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 3957,
      "product": 216,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3958,
      "product": 216,
      "nutrient": 1,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 3959,
      "product": 216,
      "nutrient": 2,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3960,
      "product": 216,
      "nutrient": 3,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 3961,
      "product": 216,
      "nutrient": 45,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3962,
      "product": 216,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 3963,
      "product": 216,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3964,
      "product": 216,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 3965,
      "product": 216,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3966,
      "product": 216,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 3967,
      "product": 216,
      "nutrient": 19,
      "value": "126",
      "perc1on100gr": "0"
  },
  {
      "_id": 3968,
      "product": 216,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3969,
      "product": 216,
      "nutrient": 22,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 3970,
      "product": 216,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 3971,
      "product": 216,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3974,
      "product": 217,
      "nutrient": 0,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 3975,
      "product": 217,
      "nutrient": 1,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3976,
      "product": 217,
      "nutrient": 2,
      "value": "19.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3977,
      "product": 217,
      "nutrient": 3,
      "value": "167",
      "perc1on100gr": "0"
  },
  {
      "_id": 3978,
      "product": 217,
      "nutrient": 45,
      "value": "19.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 3979,
      "product": 217,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 3980,
      "product": 217,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 3981,
      "product": 217,
      "nutrient": 6,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3982,
      "product": 217,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3983,
      "product": 217,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3984,
      "product": 217,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 3985,
      "product": 217,
      "nutrient": 18,
      "value": "84",
      "perc1on100gr": "0"
  },
  {
      "_id": 3986,
      "product": 217,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 3987,
      "product": 217,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 3988,
      "product": 217,
      "nutrient": 22,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 3989,
      "product": 217,
      "nutrient": 24,
      "value": "165",
      "perc1on100gr": "0"
  },
  {
      "_id": 3990,
      "product": 217,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 3991,
      "product": 217,
      "nutrient": 47,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 3994,
      "product": 218,
      "nutrient": 0,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3995,
      "product": 218,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 3996,
      "product": 218,
      "nutrient": 2,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3997,
      "product": 218,
      "nutrient": 3,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 3998,
      "product": 218,
      "nutrient": 45,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 3999,
      "product": 218,
      "nutrient": 4,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 4000,
      "product": 218,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4001,
      "product": 218,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4002,
      "product": 218,
      "nutrient": 52,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4003,
      "product": 218,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4004,
      "product": 218,
      "nutrient": 10,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 4005,
      "product": 218,
      "nutrient": 11,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4006,
      "product": 218,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4007,
      "product": 218,
      "nutrient": 14,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4008,
      "product": 218,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4009,
      "product": 218,
      "nutrient": 16,
      "value": "23.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4010,
      "product": 218,
      "nutrient": 18,
      "value": "77",
      "perc1on100gr": "0"
  },
  {
      "_id": 4011,
      "product": 218,
      "nutrient": 19,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 4012,
      "product": 218,
      "nutrient": 21,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 4013,
      "product": 218,
      "nutrient": 22,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4014,
      "product": 218,
      "nutrient": 24,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 4015,
      "product": 218,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4016,
      "product": 218,
      "nutrient": 30,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4017,
      "product": 218,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4018,
      "product": 218,
      "nutrient": 43,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4019,
      "product": 218,
      "nutrient": 47,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4023,
      "product": 219,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4024,
      "product": 219,
      "nutrient": 1,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4025,
      "product": 219,
      "nutrient": 2,
      "value": "6.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4026,
      "product": 219,
      "nutrient": 3,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 4027,
      "product": 219,
      "nutrient": 45,
      "value": "6.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4028,
      "product": 219,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4029,
      "product": 219,
      "nutrient": 6,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4030,
      "product": 219,
      "nutrient": 11,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4031,
      "product": 219,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4032,
      "product": 219,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4033,
      "product": 219,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4034,
      "product": 219,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4035,
      "product": 219,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4036,
      "product": 219,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 4037,
      "product": 219,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4040,
      "product": 220,
      "nutrient": 0,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4041,
      "product": 220,
      "nutrient": 1,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4042,
      "product": 220,
      "nutrient": 2,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4043,
      "product": 220,
      "nutrient": 3,
      "value": "180",
      "perc1on100gr": "0"
  },
  {
      "_id": 4044,
      "product": 220,
      "nutrient": 45,
      "value": "4.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4045,
      "product": 220,
      "nutrient": 46,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4046,
      "product": 220,
      "nutrient": 53,
      "value": "15.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4047,
      "product": 220,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4048,
      "product": 220,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4049,
      "product": 220,
      "nutrient": 6,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 4050,
      "product": 220,
      "nutrient": 11,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4051,
      "product": 220,
      "nutrient": 13,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4052,
      "product": 220,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4053,
      "product": 220,
      "nutrient": 18,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 4054,
      "product": 220,
      "nutrient": 19,
      "value": "64",
      "perc1on100gr": "0"
  },
  {
      "_id": 4055,
      "product": 220,
      "nutrient": 21,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4056,
      "product": 220,
      "nutrient": 22,
      "value": "291",
      "perc1on100gr": "0"
  },
  {
      "_id": 4057,
      "product": 220,
      "nutrient": 24,
      "value": "93",
      "perc1on100gr": "0"
  },
  {
      "_id": 4058,
      "product": 220,
      "nutrient": 17,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4059,
      "product": 220,
      "nutrient": 47,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 4062,
      "product": 221,
      "nutrient": 0,
      "value": "0.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 4063,
      "product": 221,
      "nutrient": 1,
      "value": "81.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4064,
      "product": 221,
      "nutrient": 2,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4065,
      "product": 221,
      "nutrient": 3,
      "value": "717",
      "perc1on100gr": "0"
  },
  {
      "_id": 4066,
      "product": 221,
      "nutrient": 45,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4067,
      "product": 221,
      "nutrient": 4,
      "value": "684",
      "perc1on100gr": "0"
  },
  {
      "_id": 4068,
      "product": 221,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4069,
      "product": 221,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4070,
      "product": 221,
      "nutrient": 52,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4071,
      "product": 221,
      "nutrient": 10,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 4072,
      "product": 221,
      "nutrient": 12,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4073,
      "product": 221,
      "nutrient": 13,
      "value": "2.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4074,
      "product": 221,
      "nutrient": 52,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4075,
      "product": 221,
      "nutrient": 15,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4076,
      "product": 221,
      "nutrient": 16,
      "value": "18.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4077,
      "product": 221,
      "nutrient": 18,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4078,
      "product": 221,
      "nutrient": 19,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4079,
      "product": 221,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4080,
      "product": 221,
      "nutrient": 22,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4081,
      "product": 221,
      "nutrient": 24,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4082,
      "product": 221,
      "nutrient": 17,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4083,
      "product": 221,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4084,
      "product": 221,
      "nutrient": 38,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4085,
      "product": 221,
      "nutrient": 41,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4086,
      "product": 221,
      "nutrient": 43,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4087,
      "product": 221,
      "nutrient": 47,
      "value": "215",
      "perc1on100gr": "0"
  },
  {
      "_id": 4090,
      "product": 222,
      "nutrient": 0,
      "value": "0.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 4091,
      "product": 222,
      "nutrient": 1,
      "value": "81.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4092,
      "product": 222,
      "nutrient": 2,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4093,
      "product": 222,
      "nutrient": 3,
      "value": "717",
      "perc1on100gr": "0"
  },
  {
      "_id": 4094,
      "product": 222,
      "nutrient": 45,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4095,
      "product": 222,
      "nutrient": 4,
      "value": "684",
      "perc1on100gr": "0"
  },
  {
      "_id": 4096,
      "product": 222,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4097,
      "product": 222,
      "nutrient": 6,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4098,
      "product": 222,
      "nutrient": 52,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4099,
      "product": 222,
      "nutrient": 9,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4100,
      "product": 222,
      "nutrient": 10,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 4101,
      "product": 222,
      "nutrient": 12,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4102,
      "product": 222,
      "nutrient": 13,
      "value": "2.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4103,
      "product": 222,
      "nutrient": 52,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4104,
      "product": 222,
      "nutrient": 15,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4105,
      "product": 222,
      "nutrient": 16,
      "value": "18.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4106,
      "product": 222,
      "nutrient": 18,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4107,
      "product": 222,
      "nutrient": 19,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4108,
      "product": 222,
      "nutrient": 21,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4109,
      "product": 222,
      "nutrient": 22,
      "value": "714",
      "perc1on100gr": "0"
  },
  {
      "_id": 4110,
      "product": 222,
      "nutrient": 24,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4111,
      "product": 222,
      "nutrient": 17,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4112,
      "product": 222,
      "nutrient": 38,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4113,
      "product": 222,
      "nutrient": 41,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4114,
      "product": 222,
      "nutrient": 43,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4115,
      "product": 222,
      "nutrient": 47,
      "value": "215",
      "perc1on100gr": "0"
  },
  {
      "_id": 4118,
      "product": 223,
      "nutrient": 0,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 4119,
      "product": 223,
      "nutrient": 1,
      "value": "99.48",
      "perc1on100gr": "0"
  },
  {
      "_id": 4120,
      "product": 223,
      "nutrient": 3,
      "value": "876",
      "perc1on100gr": "0"
  },
  {
      "_id": 4121,
      "product": 223,
      "nutrient": 4,
      "value": "840",
      "perc1on100gr": "0"
  },
  {
      "_id": 4122,
      "product": 223,
      "nutrient": 6,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4123,
      "product": 223,
      "nutrient": 52,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4124,
      "product": 223,
      "nutrient": 10,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4125,
      "product": 223,
      "nutrient": 12,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4126,
      "product": 223,
      "nutrient": 13,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4127,
      "product": 223,
      "nutrient": 52,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4128,
      "product": 223,
      "nutrient": 15,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 4129,
      "product": 223,
      "nutrient": 16,
      "value": "22.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4130,
      "product": 223,
      "nutrient": 18,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4131,
      "product": 223,
      "nutrient": 19,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4132,
      "product": 223,
      "nutrient": 22,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4133,
      "product": 223,
      "nutrient": 24,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4134,
      "product": 223,
      "nutrient": 43,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4135,
      "product": 223,
      "nutrient": 47,
      "value": "256",
      "perc1on100gr": "0"
  },
  {
      "_id": 4137,
      "product": 224,
      "nutrient": 0,
      "value": "11.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4138,
      "product": 224,
      "nutrient": 1,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 4139,
      "product": 224,
      "nutrient": 2,
      "value": "14.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4140,
      "product": 224,
      "nutrient": 3,
      "value": "287",
      "perc1on100gr": "0"
  },
  {
      "_id": 4141,
      "product": 224,
      "nutrient": 45,
      "value": "14.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4142,
      "product": 224,
      "nutrient": 4,
      "value": "126",
      "perc1on100gr": "0"
  },
  {
      "_id": 4143,
      "product": 224,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4144,
      "product": 224,
      "nutrient": 6,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4145,
      "product": 224,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4146,
      "product": 224,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4147,
      "product": 224,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4148,
      "product": 224,
      "nutrient": 18,
      "value": "112",
      "perc1on100gr": "0"
  },
  {
      "_id": 4149,
      "product": 224,
      "nutrient": 19,
      "value": "135",
      "perc1on100gr": "0"
  },
  {
      "_id": 4150,
      "product": 224,
      "nutrient": 21,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 4151,
      "product": 224,
      "nutrient": 22,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 4152,
      "product": 224,
      "nutrient": 24,
      "value": "200",
      "perc1on100gr": "0"
  },
  {
      "_id": 4153,
      "product": 224,
      "nutrient": 17,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4154,
      "product": 224,
      "nutrient": 47,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 4157,
      "product": 225,
      "nutrient": 0,
      "value": "7.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4158,
      "product": 225,
      "nutrient": 1,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 4159,
      "product": 225,
      "nutrient": 2,
      "value": "27.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4160,
      "product": 225,
      "nutrient": 3,
      "value": "345",
      "perc1on100gr": "0"
  },
  {
      "_id": 4161,
      "product": 225,
      "nutrient": 45,
      "value": "27.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4162,
      "product": 225,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4163,
      "product": 225,
      "nutrient": 4,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 4164,
      "product": 225,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4165,
      "product": 225,
      "nutrient": 6,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4166,
      "product": 225,
      "nutrient": 11,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4167,
      "product": 225,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4168,
      "product": 225,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4169,
      "product": 225,
      "nutrient": 18,
      "value": "165",
      "perc1on100gr": "0"
  },
  {
      "_id": 4170,
      "product": 225,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4171,
      "product": 225,
      "nutrient": 21,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 4172,
      "product": 225,
      "nutrient": 22,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 4173,
      "product": 225,
      "nutrient": 24,
      "value": "170",
      "perc1on100gr": "0"
  },
  {
      "_id": 4174,
      "product": 225,
      "nutrient": 17,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4175,
      "product": 225,
      "nutrient": 47,
      "value": "69",
      "perc1on100gr": "0"
  },
  {
      "_id": 4178,
      "product": 226,
      "nutrient": 0,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4179,
      "product": 226,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4180,
      "product": 226,
      "nutrient": 2,
      "value": "54.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4181,
      "product": 226,
      "nutrient": 3,
      "value": "271",
      "perc1on100gr": "0"
  },
  {
      "_id": 4182,
      "product": 226,
      "nutrient": 45,
      "value": "54.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4183,
      "product": 226,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4184,
      "product": 226,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4185,
      "product": 226,
      "nutrient": 11,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4186,
      "product": 226,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4187,
      "product": 226,
      "nutrient": 18,
      "value": "380",
      "perc1on100gr": "0"
  },
  {
      "_id": 4188,
      "product": 226,
      "nutrient": 19,
      "value": "317",
      "perc1on100gr": "0"
  },
  {
      "_id": 4189,
      "product": 226,
      "nutrient": 21,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4190,
      "product": 226,
      "nutrient": 22,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 4191,
      "product": 226,
      "nutrient": 24,
      "value": "229",
      "perc1on100gr": "0"
  },
  {
      "_id": 4192,
      "product": 226,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4193,
      "product": 226,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4196,
      "product": 227,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4197,
      "product": 227,
      "nutrient": 1,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4198,
      "product": 227,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4199,
      "product": 227,
      "nutrient": 3,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 4200,
      "product": 227,
      "nutrient": 45,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4201,
      "product": 227,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4202,
      "product": 227,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4203,
      "product": 227,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4204,
      "product": 227,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4205,
      "product": 227,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4206,
      "product": 227,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4207,
      "product": 227,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4208,
      "product": 227,
      "nutrient": 19,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 4209,
      "product": 227,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4210,
      "product": 227,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4211,
      "product": 227,
      "nutrient": 24,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 4212,
      "product": 227,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4213,
      "product": 227,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4216,
      "product": 228,
      "nutrient": 0,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4217,
      "product": 228,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4218,
      "product": 228,
      "nutrient": 2,
      "value": "57.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4219,
      "product": 228,
      "nutrient": 3,
      "value": "261",
      "perc1on100gr": "0"
  },
  {
      "_id": 4220,
      "product": 228,
      "nutrient": 45,
      "value": "57.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4221,
      "product": 228,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4222,
      "product": 228,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4223,
      "product": 228,
      "nutrient": 11,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4224,
      "product": 228,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4225,
      "product": 228,
      "nutrient": 18,
      "value": "380",
      "perc1on100gr": "0"
  },
  {
      "_id": 4226,
      "product": 228,
      "nutrient": 19,
      "value": "317",
      "perc1on100gr": "0"
  },
  {
      "_id": 4227,
      "product": 228,
      "nutrient": 21,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4228,
      "product": 228,
      "nutrient": 22,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 4229,
      "product": 228,
      "nutrient": 24,
      "value": "229",
      "perc1on100gr": "0"
  },
  {
      "_id": 4230,
      "product": 228,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4233,
      "product": 229,
      "nutrient": 0,
      "value": "4.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4234,
      "product": 229,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4235,
      "product": 229,
      "nutrient": 2,
      "value": "6.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4236,
      "product": 229,
      "nutrient": 3,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 4237,
      "product": 229,
      "nutrient": 45,
      "value": "6.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4238,
      "product": 229,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4239,
      "product": 229,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4240,
      "product": 229,
      "nutrient": 11,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4241,
      "product": 229,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4242,
      "product": 229,
      "nutrient": 18,
      "value": "157",
      "perc1on100gr": "0"
  },
  {
      "_id": 4243,
      "product": 229,
      "nutrient": 19,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 4244,
      "product": 229,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4245,
      "product": 229,
      "nutrient": 22,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 4246,
      "product": 229,
      "nutrient": 24,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 4247,
      "product": 229,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4248,
      "product": 229,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4251,
      "product": 230,
      "nutrient": 0,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4252,
      "product": 230,
      "nutrient": 1,
      "value": "7.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4253,
      "product": 230,
      "nutrient": 2,
      "value": "4.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4254,
      "product": 230,
      "nutrient": 3,
      "value": "106",
      "perc1on100gr": "0"
  },
  {
      "_id": 4255,
      "product": 230,
      "nutrient": 4,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 4256,
      "product": 230,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4257,
      "product": 230,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4258,
      "product": 230,
      "nutrient": 52,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4259,
      "product": 230,
      "nutrient": 8,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4260,
      "product": 230,
      "nutrient": 10,
      "value": "0.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4261,
      "product": 230,
      "nutrient": 11,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4262,
      "product": 230,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4263,
      "product": 230,
      "nutrient": 15,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4264,
      "product": 230,
      "nutrient": 18,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 4265,
      "product": 230,
      "nutrient": 19,
      "value": "174",
      "perc1on100gr": "0"
  },
  {
      "_id": 4266,
      "product": 230,
      "nutrient": 21,
      "value": "18",
      "perc1on100gr": "0"
  },
  {
      "_id": 4267,
      "product": 230,
      "nutrient": 22,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 4268,
      "product": 230,
      "nutrient": 24,
      "value": "109",
      "perc1on100gr": "0"
  },
  {
      "_id": 4269,
      "product": 230,
      "nutrient": 25,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 4270,
      "product": 230,
      "nutrient": 17,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4271,
      "product": 230,
      "nutrient": 29,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4272,
      "product": 230,
      "nutrient": 30,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4273,
      "product": 230,
      "nutrient": 32,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4274,
      "product": 230,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4275,
      "product": 230,
      "nutrient": 34,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4276,
      "product": 230,
      "nutrient": 41,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 4277,
      "product": 230,
      "nutrient": 43,
      "value": "0.57",
      "perc1on100gr": "0"
  },
  {
      "_id": 4278,
      "product": 230,
      "nutrient": 47,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 4281,
      "product": 231,
      "nutrient": 0,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4282,
      "product": 231,
      "nutrient": 1,
      "value": "5.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4283,
      "product": 231,
      "nutrient": 2,
      "value": "4.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4284,
      "product": 231,
      "nutrient": 3,
      "value": "82",
      "perc1on100gr": "0"
  },
  {
      "_id": 4285,
      "product": 231,
      "nutrient": 4,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 4286,
      "product": 231,
      "nutrient": 5,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 4287,
      "product": 231,
      "nutrient": 6,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4288,
      "product": 231,
      "nutrient": 10,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4289,
      "product": 231,
      "nutrient": 11,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4290,
      "product": 231,
      "nutrient": 18,
      "value": "180",
      "perc1on100gr": "0"
  },
  {
      "_id": 4291,
      "product": 231,
      "nutrient": 19,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 4292,
      "product": 231,
      "nutrient": 22,
      "value": "70",
      "perc1on100gr": "0"
  },
  {
      "_id": 4293,
      "product": 231,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4294,
      "product": 231,
      "nutrient": 30,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4295,
      "product": 231,
      "nutrient": 43,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4298,
      "product": 232,
      "nutrient": 0,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4299,
      "product": 232,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4300,
      "product": 232,
      "nutrient": 2,
      "value": "5.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4301,
      "product": 232,
      "nutrient": 3,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 4302,
      "product": 232,
      "nutrient": 4,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 4303,
      "product": 232,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4304,
      "product": 232,
      "nutrient": 6,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4305,
      "product": 232,
      "nutrient": 52,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 4306,
      "product": 232,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4307,
      "product": 232,
      "nutrient": 9,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4308,
      "product": 232,
      "nutrient": 10,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 4309,
      "product": 232,
      "nutrient": 11,
      "value": "9.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4310,
      "product": 232,
      "nutrient": 13,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 4311,
      "product": 232,
      "nutrient": 14,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4312,
      "product": 232,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4313,
      "product": 232,
      "nutrient": 16,
      "value": "23.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4314,
      "product": 232,
      "nutrient": 18,
      "value": "64",
      "perc1on100gr": "0"
  },
  {
      "_id": 4315,
      "product": 232,
      "nutrient": 19,
      "value": "89",
      "perc1on100gr": "0"
  },
  {
      "_id": 4316,
      "product": 232,
      "nutrient": 21,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4317,
      "product": 232,
      "nutrient": 22,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4318,
      "product": 232,
      "nutrient": 24,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 4319,
      "product": 232,
      "nutrient": 17,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 4320,
      "product": 232,
      "nutrient": 30,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4321,
      "product": 232,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4322,
      "product": 232,
      "nutrient": 43,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4325,
      "product": 233,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4326,
      "product": 233,
      "nutrient": 1,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4327,
      "product": 233,
      "nutrient": 2,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4328,
      "product": 233,
      "nutrient": 3,
      "value": "68",
      "perc1on100gr": "0"
  },
  {
      "_id": 4329,
      "product": 233,
      "nutrient": 4,
      "value": "63",
      "perc1on100gr": "0"
  },
  {
      "_id": 4330,
      "product": 233,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4331,
      "product": 233,
      "nutrient": 6,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4332,
      "product": 233,
      "nutrient": 52,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4333,
      "product": 233,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4334,
      "product": 233,
      "nutrient": 9,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4335,
      "product": 233,
      "nutrient": 10,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4336,
      "product": 233,
      "nutrient": 11,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4337,
      "product": 233,
      "nutrient": 12,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4338,
      "product": 233,
      "nutrient": 13,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4339,
      "product": 233,
      "nutrient": 15,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4340,
      "product": 233,
      "nutrient": 16,
      "value": "14.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4341,
      "product": 233,
      "nutrient": 18,
      "value": "145",
      "perc1on100gr": "0"
  },
  {
      "_id": 4342,
      "product": 233,
      "nutrient": 19,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 4343,
      "product": 233,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4344,
      "product": 233,
      "nutrient": 22,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 4345,
      "product": 233,
      "nutrient": 24,
      "value": "89",
      "perc1on100gr": "0"
  },
  {
      "_id": 4346,
      "product": 233,
      "nutrient": 25,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 4347,
      "product": 233,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4348,
      "product": 233,
      "nutrient": 29,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4349,
      "product": 233,
      "nutrient": 32,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4350,
      "product": 233,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4351,
      "product": 233,
      "nutrient": 34,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4352,
      "product": 233,
      "nutrient": 47,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4355,
      "product": 234,
      "nutrient": 0,
      "value": "7.91",
      "perc1on100gr": "0"
  },
  {
      "_id": 4356,
      "product": 234,
      "nutrient": 1,
      "value": "8.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4357,
      "product": 234,
      "nutrient": 2,
      "value": "54.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4358,
      "product": 234,
      "nutrient": 3,
      "value": "321",
      "perc1on100gr": "0"
  },
  {
      "_id": 4359,
      "product": 234,
      "nutrient": 45,
      "value": "48.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 4360,
      "product": 234,
      "nutrient": 4,
      "value": "74",
      "perc1on100gr": "0"
  },
  {
      "_id": 4361,
      "product": 234,
      "nutrient": 5,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4362,
      "product": 234,
      "nutrient": 6,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 4363,
      "product": 234,
      "nutrient": 52,
      "value": "0.75",
      "perc1on100gr": "0"
  },
  {
      "_id": 4364,
      "product": 234,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4365,
      "product": 234,
      "nutrient": 9,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4366,
      "product": 234,
      "nutrient": 10,
      "value": "0.44",
      "perc1on100gr": "0"
  },
  {
      "_id": 4367,
      "product": 234,
      "nutrient": 11,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4368,
      "product": 234,
      "nutrient": 12,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4369,
      "product": 234,
      "nutrient": 13,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4370,
      "product": 234,
      "nutrient": 52,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4371,
      "product": 234,
      "nutrient": 15,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4372,
      "product": 234,
      "nutrient": 16,
      "value": "89.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4373,
      "product": 234,
      "nutrient": 18,
      "value": "371",
      "perc1on100gr": "0"
  },
  {
      "_id": 4374,
      "product": 234,
      "nutrient": 19,
      "value": "284",
      "perc1on100gr": "0"
  },
  {
      "_id": 4375,
      "product": 234,
      "nutrient": 21,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 4376,
      "product": 234,
      "nutrient": 22,
      "value": "127",
      "perc1on100gr": "0"
  },
  {
      "_id": 4377,
      "product": 234,
      "nutrient": 24,
      "value": "253",
      "perc1on100gr": "0"
  },
  {
      "_id": 4378,
      "product": 234,
      "nutrient": 17,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 4379,
      "product": 234,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4380,
      "product": 234,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4381,
      "product": 234,
      "nutrient": 38,
      "value": "14.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4382,
      "product": 234,
      "nutrient": 43,
      "value": "0.94",
      "perc1on100gr": "0"
  },
  {
      "_id": 4383,
      "product": 234,
      "nutrient": 47,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4386,
      "product": 235,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4387,
      "product": 235,
      "nutrient": 1,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4388,
      "product": 235,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4389,
      "product": 235,
      "nutrient": 3,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 4390,
      "product": 235,
      "nutrient": 45,
      "value": "4.84",
      "perc1on100gr": "0"
  },
  {
      "_id": 4391,
      "product": 235,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4392,
      "product": 235,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4393,
      "product": 235,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4394,
      "product": 235,
      "nutrient": 52,
      "value": "0.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 4395,
      "product": 235,
      "nutrient": 8,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4396,
      "product": 235,
      "nutrient": 9,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4397,
      "product": 235,
      "nutrient": 10,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4398,
      "product": 235,
      "nutrient": 11,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4399,
      "product": 235,
      "nutrient": 12,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4400,
      "product": 235,
      "nutrient": 13,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4401,
      "product": 235,
      "nutrient": 16,
      "value": "23.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4402,
      "product": 235,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4403,
      "product": 235,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4404,
      "product": 235,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4405,
      "product": 235,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4406,
      "product": 235,
      "nutrient": 23,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 4407,
      "product": 235,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 4408,
      "product": 235,
      "nutrient": 25,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 4409,
      "product": 235,
      "nutrient": 17,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 4410,
      "product": 235,
      "nutrient": 29,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4411,
      "product": 235,
      "nutrient": 30,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4412,
      "product": 235,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4413,
      "product": 235,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4414,
      "product": 235,
      "nutrient": 34,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4415,
      "product": 235,
      "nutrient": 38,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4416,
      "product": 235,
      "nutrient": 41,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 4417,
      "product": 235,
      "nutrient": 42,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4418,
      "product": 235,
      "nutrient": 43,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4419,
      "product": 235,
      "nutrient": 47,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4422,
      "product": 236,
      "nutrient": 0,
      "value": "5.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4423,
      "product": 236,
      "nutrient": 1,
      "value": "7.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4424,
      "product": 236,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4425,
      "product": 236,
      "nutrient": 3,
      "value": "111",
      "perc1on100gr": "0"
  },
  {
      "_id": 4426,
      "product": 236,
      "nutrient": 45,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4427,
      "product": 236,
      "nutrient": 4,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 4428,
      "product": 236,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4429,
      "product": 236,
      "nutrient": 6,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 4430,
      "product": 236,
      "nutrient": 52,
      "value": "0.41",
      "perc1on100gr": "0"
  },
  {
      "_id": 4431,
      "product": 236,
      "nutrient": 9,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4432,
      "product": 236,
      "nutrient": 10,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4433,
      "product": 236,
      "nutrient": 11,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4434,
      "product": 236,
      "nutrient": 13,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 4435,
      "product": 236,
      "nutrient": 15,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 4436,
      "product": 236,
      "nutrient": 16,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4437,
      "product": 236,
      "nutrient": 18,
      "value": "198",
      "perc1on100gr": "0"
  },
  {
      "_id": 4438,
      "product": 236,
      "nutrient": 19,
      "value": "178",
      "perc1on100gr": "0"
  },
  {
      "_id": 4439,
      "product": 236,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4440,
      "product": 236,
      "nutrient": 22,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 4441,
      "product": 236,
      "nutrient": 24,
      "value": "158",
      "perc1on100gr": "0"
  },
  {
      "_id": 4442,
      "product": 236,
      "nutrient": 25,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 4443,
      "product": 236,
      "nutrient": 17,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4444,
      "product": 236,
      "nutrient": 29,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4445,
      "product": 236,
      "nutrient": 30,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4446,
      "product": 236,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4447,
      "product": 236,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4448,
      "product": 236,
      "nutrient": 34,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4449,
      "product": 236,
      "nutrient": 38,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4450,
      "product": 236,
      "nutrient": 43,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 4451,
      "product": 236,
      "nutrient": 47,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4454,
      "product": 237,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4455,
      "product": 237,
      "nutrient": 1,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4456,
      "product": 237,
      "nutrient": 2,
      "value": "4.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4457,
      "product": 237,
      "nutrient": 3,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4458,
      "product": 237,
      "nutrient": 45,
      "value": "4.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4459,
      "product": 237,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4460,
      "product": 237,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4461,
      "product": 237,
      "nutrient": 11,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4462,
      "product": 237,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4463,
      "product": 237,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 4464,
      "product": 237,
      "nutrient": 19,
      "value": "126",
      "perc1on100gr": "0"
  },
  {
      "_id": 4465,
      "product": 237,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4466,
      "product": 237,
      "nutrient": 22,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 4467,
      "product": 237,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 4468,
      "product": 237,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4471,
      "product": 238,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4472,
      "product": 238,
      "nutrient": 1,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4473,
      "product": 238,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4474,
      "product": 238,
      "nutrient": 3,
      "value": "45",
      "perc1on100gr": "0"
  },
  {
      "_id": 4475,
      "product": 238,
      "nutrient": 45,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4476,
      "product": 238,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4477,
      "product": 238,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4478,
      "product": 238,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4479,
      "product": 238,
      "nutrient": 11,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4480,
      "product": 238,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4481,
      "product": 238,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4482,
      "product": 238,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4483,
      "product": 238,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4484,
      "product": 238,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4485,
      "product": 238,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 4486,
      "product": 238,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4487,
      "product": 238,
      "nutrient": 47,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4490,
      "product": 239,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4491,
      "product": 239,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4492,
      "product": 239,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4493,
      "product": 239,
      "nutrient": 3,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 4494,
      "product": 239,
      "nutrient": 45,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4495,
      "product": 239,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4496,
      "product": 239,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4497,
      "product": 239,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4498,
      "product": 239,
      "nutrient": 11,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4499,
      "product": 239,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4500,
      "product": 239,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4501,
      "product": 239,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4502,
      "product": 239,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4503,
      "product": 239,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4504,
      "product": 239,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 4505,
      "product": 239,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4506,
      "product": 239,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4509,
      "product": 240,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4510,
      "product": 240,
      "nutrient": 1,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4511,
      "product": 240,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4512,
      "product": 240,
      "nutrient": 3,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 4513,
      "product": 240,
      "nutrient": 45,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4514,
      "product": 240,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4515,
      "product": 240,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4516,
      "product": 240,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4517,
      "product": 240,
      "nutrient": 11,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4518,
      "product": 240,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4519,
      "product": 240,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4520,
      "product": 240,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4521,
      "product": 240,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4522,
      "product": 240,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4523,
      "product": 240,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4524,
      "product": 240,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 4525,
      "product": 240,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4526,
      "product": 240,
      "nutrient": 47,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4529,
      "product": 241,
      "nutrient": 0,
      "value": "3.37",
      "perc1on100gr": "0"
  },
  {
      "_id": 4530,
      "product": 241,
      "nutrient": 1,
      "value": "0.97",
      "perc1on100gr": "0"
  },
  {
      "_id": 4531,
      "product": 241,
      "nutrient": 2,
      "value": "4.99",
      "perc1on100gr": "0"
  },
  {
      "_id": 4532,
      "product": 241,
      "nutrient": 3,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 4533,
      "product": 241,
      "nutrient": 45,
      "value": "5.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4534,
      "product": 241,
      "nutrient": 4,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4535,
      "product": 241,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4536,
      "product": 241,
      "nutrient": 6,
      "value": "0.19",
      "perc1on100gr": "0"
  },
  {
      "_id": 4537,
      "product": 241,
      "nutrient": 52,
      "value": "0.36",
      "perc1on100gr": "0"
  },
  {
      "_id": 4538,
      "product": 241,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4539,
      "product": 241,
      "nutrient": 9,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4540,
      "product": 241,
      "nutrient": 10,
      "value": "0.47",
      "perc1on100gr": "0"
  },
  {
      "_id": 4541,
      "product": 241,
      "nutrient": 13,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4542,
      "product": 241,
      "nutrient": 52,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4543,
      "product": 241,
      "nutrient": 15,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4544,
      "product": 241,
      "nutrient": 16,
      "value": "17.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4545,
      "product": 241,
      "nutrient": 18,
      "value": "150",
      "perc1on100gr": "0"
  },
  {
      "_id": 4546,
      "product": 241,
      "nutrient": 19,
      "value": "125",
      "perc1on100gr": "0"
  },
  {
      "_id": 4547,
      "product": 241,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4548,
      "product": 241,
      "nutrient": 22,
      "value": "44",
      "perc1on100gr": "0"
  },
  {
      "_id": 4549,
      "product": 241,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 4550,
      "product": 241,
      "nutrient": 17,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4551,
      "product": 241,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4552,
      "product": 241,
      "nutrient": 38,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4553,
      "product": 241,
      "nutrient": 41,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4554,
      "product": 241,
      "nutrient": 43,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 4555,
      "product": 241,
      "nutrient": 47,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4558,
      "product": 242,
      "nutrient": 0,
      "value": "3.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4559,
      "product": 242,
      "nutrient": 1,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 4560,
      "product": 242,
      "nutrient": 2,
      "value": "4.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 4561,
      "product": 242,
      "nutrient": 3,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 4562,
      "product": 242,
      "nutrient": 45,
      "value": "4.85",
      "perc1on100gr": "0"
  },
  {
      "_id": 4563,
      "product": 242,
      "nutrient": 4,
      "value": "137",
      "perc1on100gr": "0"
  },
  {
      "_id": 4564,
      "product": 242,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4565,
      "product": 242,
      "nutrient": 6,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4566,
      "product": 242,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4567,
      "product": 242,
      "nutrient": 9,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4568,
      "product": 242,
      "nutrient": 10,
      "value": "0.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 4569,
      "product": 242,
      "nutrient": 11,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4570,
      "product": 242,
      "nutrient": 12,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4571,
      "product": 242,
      "nutrient": 13,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4572,
      "product": 242,
      "nutrient": 15,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4573,
      "product": 242,
      "nutrient": 16,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4574,
      "product": 242,
      "nutrient": 18,
      "value": "166",
      "perc1on100gr": "0"
  },
  {
      "_id": 4575,
      "product": 242,
      "nutrient": 19,
      "value": "204",
      "perc1on100gr": "0"
  },
  {
      "_id": 4576,
      "product": 242,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4577,
      "product": 242,
      "nutrient": 22,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 4578,
      "product": 242,
      "nutrient": 24,
      "value": "101",
      "perc1on100gr": "0"
  },
  {
      "_id": 4579,
      "product": 242,
      "nutrient": 17,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4580,
      "product": 242,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4581,
      "product": 242,
      "nutrient": 38,
      "value": "2.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4582,
      "product": 242,
      "nutrient": 43,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4583,
      "product": 242,
      "nutrient": 47,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4586,
      "product": 243,
      "nutrient": 0,
      "value": "7.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4587,
      "product": 243,
      "nutrient": 1,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4588,
      "product": 243,
      "nutrient": 2,
      "value": "55.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4589,
      "product": 243,
      "nutrient": 3,
      "value": "295",
      "perc1on100gr": "0"
  },
  {
      "_id": 4590,
      "product": 243,
      "nutrient": 45,
      "value": "55.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4591,
      "product": 243,
      "nutrient": 4,
      "value": "27",
      "perc1on100gr": "0"
  },
  {
      "_id": 4592,
      "product": 243,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4593,
      "product": 243,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4594,
      "product": 243,
      "nutrient": 11,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4595,
      "product": 243,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4596,
      "product": 243,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4597,
      "product": 243,
      "nutrient": 18,
      "value": "380",
      "perc1on100gr": "0"
  },
  {
      "_id": 4598,
      "product": 243,
      "nutrient": 19,
      "value": "317",
      "perc1on100gr": "0"
  },
  {
      "_id": 4599,
      "product": 243,
      "nutrient": 21,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4600,
      "product": 243,
      "nutrient": 22,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 4601,
      "product": 243,
      "nutrient": 24,
      "value": "229",
      "perc1on100gr": "0"
  },
  {
      "_id": 4602,
      "product": 243,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4603,
      "product": 243,
      "nutrient": 47,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4606,
      "product": 244,
      "nutrient": 0,
      "value": "7.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4607,
      "product": 244,
      "nutrient": 1,
      "value": "8.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4608,
      "product": 244,
      "nutrient": 2,
      "value": "55.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4609,
      "product": 244,
      "nutrient": 3,
      "value": "328",
      "perc1on100gr": "0"
  },
  {
      "_id": 4610,
      "product": 244,
      "nutrient": 45,
      "value": "55.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4611,
      "product": 244,
      "nutrient": 4,
      "value": "45",
      "perc1on100gr": "0"
  },
  {
      "_id": 4612,
      "product": 244,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4613,
      "product": 244,
      "nutrient": 6,
      "value": "0.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 4614,
      "product": 244,
      "nutrient": 52,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4615,
      "product": 244,
      "nutrient": 8,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4616,
      "product": 244,
      "nutrient": 10,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4617,
      "product": 244,
      "nutrient": 11,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4618,
      "product": 244,
      "nutrient": 12,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4619,
      "product": 244,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4620,
      "product": 244,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4621,
      "product": 244,
      "nutrient": 16,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4622,
      "product": 244,
      "nutrient": 18,
      "value": "365",
      "perc1on100gr": "0"
  },
  {
      "_id": 4623,
      "product": 244,
      "nutrient": 19,
      "value": "307",
      "perc1on100gr": "0"
  },
  {
      "_id": 4624,
      "product": 244,
      "nutrient": 21,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4625,
      "product": 244,
      "nutrient": 22,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 4626,
      "product": 244,
      "nutrient": 23,
      "value": "70",
      "perc1on100gr": "0"
  },
  {
      "_id": 4627,
      "product": 244,
      "nutrient": 24,
      "value": "219",
      "perc1on100gr": "0"
  },
  {
      "_id": 4628,
      "product": 244,
      "nutrient": 25,
      "value": "238",
      "perc1on100gr": "0"
  },
  {
      "_id": 4629,
      "product": 244,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4630,
      "product": 244,
      "nutrient": 29,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4631,
      "product": 244,
      "nutrient": 30,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4632,
      "product": 244,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4633,
      "product": 244,
      "nutrient": 33,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4634,
      "product": 244,
      "nutrient": 38,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4635,
      "product": 244,
      "nutrient": 41,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 4636,
      "product": 244,
      "nutrient": 43,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4637,
      "product": 244,
      "nutrient": 47,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4640,
      "product": 245,
      "nutrient": 0,
      "value": "6.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4641,
      "product": 245,
      "nutrient": 1,
      "value": "7.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4642,
      "product": 245,
      "nutrient": 2,
      "value": "10.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4643,
      "product": 245,
      "nutrient": 3,
      "value": "138",
      "perc1on100gr": "0"
  },
  {
      "_id": 4644,
      "product": 245,
      "nutrient": 45,
      "value": "10.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4645,
      "product": 245,
      "nutrient": 4,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 4646,
      "product": 245,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4647,
      "product": 245,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4648,
      "product": 245,
      "nutrient": 11,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4649,
      "product": 245,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4650,
      "product": 245,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4651,
      "product": 245,
      "nutrient": 18,
      "value": "318",
      "perc1on100gr": "0"
  },
  {
      "_id": 4652,
      "product": 245,
      "nutrient": 19,
      "value": "283",
      "perc1on100gr": "0"
  },
  {
      "_id": 4653,
      "product": 245,
      "nutrient": 21,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4654,
      "product": 245,
      "nutrient": 22,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 4655,
      "product": 245,
      "nutrient": 24,
      "value": "224",
      "perc1on100gr": "0"
  },
  {
      "_id": 4656,
      "product": 245,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4657,
      "product": 245,
      "nutrient": 47,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 4660,
      "product": 246,
      "nutrient": 0,
      "value": "6.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4661,
      "product": 246,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4662,
      "product": 246,
      "nutrient": 2,
      "value": "10.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4663,
      "product": 246,
      "nutrient": 3,
      "value": "71",
      "perc1on100gr": "0"
  },
  {
      "_id": 4664,
      "product": 246,
      "nutrient": 45,
      "value": "10.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4665,
      "product": 246,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4666,
      "product": 246,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4667,
      "product": 246,
      "nutrient": 11,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4668,
      "product": 246,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4669,
      "product": 246,
      "nutrient": 18,
      "value": "318",
      "perc1on100gr": "0"
  },
  {
      "_id": 4670,
      "product": 246,
      "nutrient": 19,
      "value": "282",
      "perc1on100gr": "0"
  },
  {
      "_id": 4671,
      "product": 246,
      "nutrient": 21,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4672,
      "product": 246,
      "nutrient": 22,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 4673,
      "product": 246,
      "nutrient": 24,
      "value": "224",
      "perc1on100gr": "0"
  },
  {
      "_id": 4674,
      "product": 246,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4677,
      "product": 247,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4678,
      "product": 247,
      "nutrient": 1,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4679,
      "product": 247,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4680,
      "product": 247,
      "nutrient": 3,
      "value": "63",
      "perc1on100gr": "0"
  },
  {
      "_id": 4681,
      "product": 247,
      "nutrient": 45,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4682,
      "product": 247,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4683,
      "product": 247,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4684,
      "product": 247,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4685,
      "product": 247,
      "nutrient": 9,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4686,
      "product": 247,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4687,
      "product": 247,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4688,
      "product": 247,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4689,
      "product": 247,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4690,
      "product": 247,
      "nutrient": 19,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 4691,
      "product": 247,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4692,
      "product": 247,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4693,
      "product": 247,
      "nutrient": 24,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 4694,
      "product": 247,
      "nutrient": 25,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 4695,
      "product": 247,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4696,
      "product": 247,
      "nutrient": 29,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4697,
      "product": 247,
      "nutrient": 30,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4698,
      "product": 247,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4699,
      "product": 247,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 4700,
      "product": 247,
      "nutrient": 34,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4701,
      "product": 247,
      "nutrient": 38,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4702,
      "product": 247,
      "nutrient": 41,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 4703,
      "product": 247,
      "nutrient": 42,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4704,
      "product": 247,
      "nutrient": 43,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4705,
      "product": 247,
      "nutrient": 47,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4708,
      "product": 248,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4709,
      "product": 248,
      "nutrient": 1,
      "value": "1.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4710,
      "product": 248,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4711,
      "product": 248,
      "nutrient": 3,
      "value": "45",
      "perc1on100gr": "0"
  },
  {
      "_id": 4712,
      "product": 248,
      "nutrient": 45,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4713,
      "product": 248,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4714,
      "product": 248,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4715,
      "product": 248,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4716,
      "product": 248,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4717,
      "product": 248,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4718,
      "product": 248,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4719,
      "product": 248,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4720,
      "product": 248,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4721,
      "product": 248,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4722,
      "product": 248,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 4723,
      "product": 248,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4724,
      "product": 248,
      "nutrient": 47,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4727,
      "product": 249,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4728,
      "product": 249,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4729,
      "product": 249,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4730,
      "product": 249,
      "nutrient": 3,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 4731,
      "product": 249,
      "nutrient": 45,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4732,
      "product": 249,
      "nutrient": 4,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4733,
      "product": 249,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4734,
      "product": 249,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4735,
      "product": 249,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4736,
      "product": 249,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4737,
      "product": 249,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4738,
      "product": 249,
      "nutrient": 19,
      "value": "120",
      "perc1on100gr": "0"
  },
  {
      "_id": 4739,
      "product": 249,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4740,
      "product": 249,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4741,
      "product": 249,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 4742,
      "product": 249,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4743,
      "product": 249,
      "nutrient": 47,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4746,
      "product": 250,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4747,
      "product": 250,
      "nutrient": 1,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4748,
      "product": 250,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4749,
      "product": 250,
      "nutrient": 3,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 4750,
      "product": 250,
      "nutrient": 45,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4751,
      "product": 250,
      "nutrient": 4,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4752,
      "product": 250,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4753,
      "product": 250,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4754,
      "product": 250,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4755,
      "product": 250,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4756,
      "product": 250,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4757,
      "product": 250,
      "nutrient": 19,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 4758,
      "product": 250,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4759,
      "product": 250,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4760,
      "product": 250,
      "nutrient": 24,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 4761,
      "product": 250,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4762,
      "product": 250,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4765,
      "product": 251,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4766,
      "product": 251,
      "nutrient": 2,
      "value": "49.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4767,
      "product": 251,
      "nutrient": 3,
      "value": "358",
      "perc1on100gr": "0"
  },
  {
      "_id": 4768,
      "product": 251,
      "nutrient": 45,
      "value": "49.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4769,
      "product": 251,
      "nutrient": 5,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4770,
      "product": 251,
      "nutrient": 6,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4771,
      "product": 251,
      "nutrient": 52,
      "value": "3.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4772,
      "product": 251,
      "nutrient": 8,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4773,
      "product": 251,
      "nutrient": 9,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 4774,
      "product": 251,
      "nutrient": 10,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4775,
      "product": 251,
      "nutrient": 11,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4776,
      "product": 251,
      "nutrient": 12,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4777,
      "product": 251,
      "nutrient": 14,
      "value": "15.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4778,
      "product": 251,
      "nutrient": 15,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4779,
      "product": 251,
      "nutrient": 16,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 4780,
      "product": 251,
      "nutrient": 18,
      "value": "1224",
      "perc1on100gr": "0"
  },
  {
      "_id": 4781,
      "product": 251,
      "nutrient": 19,
      "value": "1155",
      "perc1on100gr": "0"
  },
  {
      "_id": 4782,
      "product": 251,
      "nutrient": 21,
      "value": "160",
      "perc1on100gr": "0"
  },
  {
      "_id": 4783,
      "product": 251,
      "nutrient": 22,
      "value": "442",
      "perc1on100gr": "0"
  },
  {
      "_id": 4784,
      "product": 251,
      "nutrient": 23,
      "value": "338",
      "perc1on100gr": "0"
  },
  {
      "_id": 4785,
      "product": 251,
      "nutrient": 24,
      "value": "920",
      "perc1on100gr": "0"
  },
  {
      "_id": 4786,
      "product": 251,
      "nutrient": 25,
      "value": "920",
      "perc1on100gr": "0"
  },
  {
      "_id": 4787,
      "product": 251,
      "nutrient": 17,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4788,
      "product": 251,
      "nutrient": 29,
      "value": "55",
      "perc1on100gr": "0"
  },
  {
      "_id": 4789,
      "product": 251,
      "nutrient": 30,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4790,
      "product": 251,
      "nutrient": 32,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 4791,
      "product": 251,
      "nutrient": 33,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4792,
      "product": 251,
      "nutrient": 34,
      "value": "36",
      "perc1on100gr": "0"
  },
  {
      "_id": 4793,
      "product": 251,
      "nutrient": 38,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4794,
      "product": 251,
      "nutrient": 41,
      "value": "150",
      "perc1on100gr": "0"
  },
  {
      "_id": 4795,
      "product": 251,
      "nutrient": 42,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 4796,
      "product": 251,
      "nutrient": 43,
      "value": "3.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4797,
      "product": 251,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4800,
      "product": 252,
      "nutrient": 0,
      "value": "26",
      "perc1on100gr": "0"
  },
  {
      "_id": 4801,
      "product": 252,
      "nutrient": 1,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 4802,
      "product": 252,
      "nutrient": 2,
      "value": "37.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4803,
      "product": 252,
      "nutrient": 3,
      "value": "479",
      "perc1on100gr": "0"
  },
  {
      "_id": 4804,
      "product": 252,
      "nutrient": 45,
      "value": "37.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4805,
      "product": 252,
      "nutrient": 4,
      "value": "138",
      "perc1on100gr": "0"
  },
  {
      "_id": 4806,
      "product": 252,
      "nutrient": 5,
      "value": "0.27",
      "perc1on100gr": "0"
  },
  {
      "_id": 4807,
      "product": 252,
      "nutrient": 6,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4808,
      "product": 252,
      "nutrient": 52,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4809,
      "product": 252,
      "nutrient": 8,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4810,
      "product": 252,
      "nutrient": 9,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 4811,
      "product": 252,
      "nutrient": 10,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4812,
      "product": 252,
      "nutrient": 11,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4813,
      "product": 252,
      "nutrient": 12,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 4814,
      "product": 252,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4815,
      "product": 252,
      "nutrient": 14,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4816,
      "product": 252,
      "nutrient": 15,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4817,
      "product": 252,
      "nutrient": 16,
      "value": "81",
      "perc1on100gr": "0"
  },
  {
      "_id": 4818,
      "product": 252,
      "nutrient": 18,
      "value": "1200",
      "perc1on100gr": "0"
  },
  {
      "_id": 4819,
      "product": 252,
      "nutrient": 19,
      "value": "1000",
      "perc1on100gr": "0"
  },
  {
      "_id": 4820,
      "product": 252,
      "nutrient": 21,
      "value": "119",
      "perc1on100gr": "0"
  },
  {
      "_id": 4821,
      "product": 252,
      "nutrient": 22,
      "value": "400",
      "perc1on100gr": "0"
  },
  {
      "_id": 4822,
      "product": 252,
      "nutrient": 23,
      "value": "260",
      "perc1on100gr": "0"
  },
  {
      "_id": 4823,
      "product": 252,
      "nutrient": 24,
      "value": "790",
      "perc1on100gr": "0"
  },
  {
      "_id": 4824,
      "product": 252,
      "nutrient": 25,
      "value": "820",
      "perc1on100gr": "0"
  },
  {
      "_id": 4825,
      "product": 252,
      "nutrient": 17,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4826,
      "product": 252,
      "nutrient": 29,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4827,
      "product": 252,
      "nutrient": 30,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4828,
      "product": 252,
      "nutrient": 32,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4829,
      "product": 252,
      "nutrient": 33,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4830,
      "product": 252,
      "nutrient": 34,
      "value": "36",
      "perc1on100gr": "0"
  },
  {
      "_id": 4831,
      "product": 252,
      "nutrient": 38,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4832,
      "product": 252,
      "nutrient": 41,
      "value": "110",
      "perc1on100gr": "0"
  },
  {
      "_id": 4833,
      "product": 252,
      "nutrient": 42,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 4834,
      "product": 252,
      "nutrient": 43,
      "value": "3.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 4835,
      "product": 252,
      "nutrient": 47,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 4838,
      "product": 253,
      "nutrient": 1,
      "value": "26.71",
      "perc1on100gr": "0"
  },
  {
      "_id": 4839,
      "product": 253,
      "nutrient": 2,
      "value": "38.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 4840,
      "product": 253,
      "nutrient": 3,
      "value": "496",
      "perc1on100gr": "0"
  },
  {
      "_id": 4841,
      "product": 253,
      "nutrient": 45,
      "value": "38.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 4842,
      "product": 253,
      "nutrient": 4,
      "value": "258",
      "perc1on100gr": "0"
  },
  {
      "_id": 4843,
      "product": 253,
      "nutrient": 5,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 4844,
      "product": 253,
      "nutrient": 6,
      "value": "1.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4845,
      "product": 253,
      "nutrient": 52,
      "value": "2.27",
      "perc1on100gr": "0"
  },
  {
      "_id": 4846,
      "product": 253,
      "nutrient": 8,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4847,
      "product": 253,
      "nutrient": 9,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 4848,
      "product": 253,
      "nutrient": 10,
      "value": "3.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 4849,
      "product": 253,
      "nutrient": 11,
      "value": "8.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 4850,
      "product": 253,
      "nutrient": 12,
      "value": "10.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4851,
      "product": 253,
      "nutrient": 13,
      "value": "0.58",
      "perc1on100gr": "0"
  },
  {
      "_id": 4852,
      "product": 253,
      "nutrient": 52,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4853,
      "product": 253,
      "nutrient": 15,
      "value": "0.65",
      "perc1on100gr": "0"
  },
  {
      "_id": 4854,
      "product": 253,
      "nutrient": 16,
      "value": "119.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4855,
      "product": 253,
      "nutrient": 18,
      "value": "1330",
      "perc1on100gr": "0"
  },
  {
      "_id": 4856,
      "product": 253,
      "nutrient": 19,
      "value": "912",
      "perc1on100gr": "0"
  },
  {
      "_id": 4857,
      "product": 253,
      "nutrient": 21,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 4858,
      "product": 253,
      "nutrient": 22,
      "value": "371",
      "perc1on100gr": "0"
  },
  {
      "_id": 4859,
      "product": 253,
      "nutrient": 24,
      "value": "776",
      "perc1on100gr": "0"
  },
  {
      "_id": 4860,
      "product": 253,
      "nutrient": 17,
      "value": "0.47",
      "perc1on100gr": "0"
  },
  {
      "_id": 4861,
      "product": 253,
      "nutrient": 32,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4862,
      "product": 253,
      "nutrient": 33,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 4863,
      "product": 253,
      "nutrient": 38,
      "value": "16.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4864,
      "product": 253,
      "nutrient": 43,
      "value": "3.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 4865,
      "product": 253,
      "nutrient": 47,
      "value": "97",
      "perc1on100gr": "0"
  },
  {
      "_id": 4868,
      "product": 254,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4869,
      "product": 254,
      "nutrient": 1,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4870,
      "product": 254,
      "nutrient": 2,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4871,
      "product": 254,
      "nutrient": 3,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4872,
      "product": 254,
      "nutrient": 45,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4873,
      "product": 254,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4874,
      "product": 254,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4875,
      "product": 254,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4876,
      "product": 254,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4877,
      "product": 254,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4878,
      "product": 254,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 4879,
      "product": 254,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4880,
      "product": 254,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4881,
      "product": 254,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 4882,
      "product": 254,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4885,
      "product": 255,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4886,
      "product": 255,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4887,
      "product": 255,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4888,
      "product": 255,
      "nutrient": 3,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 4889,
      "product": 255,
      "nutrient": 45,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4890,
      "product": 255,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4891,
      "product": 255,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4892,
      "product": 255,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4893,
      "product": 255,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4894,
      "product": 255,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4895,
      "product": 255,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 4896,
      "product": 255,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4897,
      "product": 255,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4898,
      "product": 255,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 4899,
      "product": 255,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4900,
      "product": 255,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4903,
      "product": 256,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4904,
      "product": 256,
      "nutrient": 1,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4905,
      "product": 256,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4906,
      "product": 256,
      "nutrient": 3,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 4907,
      "product": 256,
      "nutrient": 45,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4908,
      "product": 256,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 4909,
      "product": 256,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 4910,
      "product": 256,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 4911,
      "product": 256,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4912,
      "product": 256,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4913,
      "product": 256,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4914,
      "product": 256,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 4915,
      "product": 256,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 4916,
      "product": 256,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4917,
      "product": 256,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 4918,
      "product": 256,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 4919,
      "product": 256,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4920,
      "product": 256,
      "nutrient": 47,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 4923,
      "product": 257,
      "nutrient": 0,
      "value": "3.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 4924,
      "product": 257,
      "nutrient": 1,
      "value": "3.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 4925,
      "product": 257,
      "nutrient": 2,
      "value": "4.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4926,
      "product": 257,
      "nutrient": 3,
      "value": "61",
      "perc1on100gr": "0"
  },
  {
      "_id": 4927,
      "product": 257,
      "nutrient": 45,
      "value": "5.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4928,
      "product": 257,
      "nutrient": 4,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 4929,
      "product": 257,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 4930,
      "product": 257,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 4931,
      "product": 257,
      "nutrient": 52,
      "value": "0.37",
      "perc1on100gr": "0"
  },
  {
      "_id": 4932,
      "product": 257,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4933,
      "product": 257,
      "nutrient": 9,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4934,
      "product": 257,
      "nutrient": 10,
      "value": "0.45",
      "perc1on100gr": "0"
  },
  {
      "_id": 4935,
      "product": 257,
      "nutrient": 12,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4936,
      "product": 257,
      "nutrient": 13,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 4937,
      "product": 257,
      "nutrient": 15,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4938,
      "product": 257,
      "nutrient": 16,
      "value": "14.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 4939,
      "product": 257,
      "nutrient": 18,
      "value": "132",
      "perc1on100gr": "0"
  },
  {
      "_id": 4940,
      "product": 257,
      "nutrient": 19,
      "value": "113",
      "perc1on100gr": "0"
  },
  {
      "_id": 4941,
      "product": 257,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4942,
      "product": 257,
      "nutrient": 22,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 4943,
      "product": 257,
      "nutrient": 24,
      "value": "84",
      "perc1on100gr": "0"
  },
  {
      "_id": 4944,
      "product": 257,
      "nutrient": 17,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4945,
      "product": 257,
      "nutrient": 33,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4946,
      "product": 257,
      "nutrient": 38,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4947,
      "product": 257,
      "nutrient": 43,
      "value": "0.37",
      "perc1on100gr": "0"
  },
  {
      "_id": 4948,
      "product": 257,
      "nutrient": 47,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4951,
      "product": 258,
      "nutrient": 0,
      "value": "0.76",
      "perc1on100gr": "0"
  },
  {
      "_id": 4952,
      "product": 258,
      "nutrient": 1,
      "value": "0.09",
      "perc1on100gr": "0"
  },
  {
      "_id": 4953,
      "product": 258,
      "nutrient": 2,
      "value": "5.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4954,
      "product": 258,
      "nutrient": 3,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 4955,
      "product": 258,
      "nutrient": 45,
      "value": "5.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 4956,
      "product": 258,
      "nutrient": 4,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4957,
      "product": 258,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4958,
      "product": 258,
      "nutrient": 6,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 4959,
      "product": 258,
      "nutrient": 52,
      "value": "0.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 4960,
      "product": 258,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 4961,
      "product": 258,
      "nutrient": 9,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 4962,
      "product": 258,
      "nutrient": 10,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 4963,
      "product": 258,
      "nutrient": 11,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4964,
      "product": 258,
      "nutrient": 15,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 4965,
      "product": 258,
      "nutrient": 16,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4966,
      "product": 258,
      "nutrient": 18,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 4967,
      "product": 258,
      "nutrient": 19,
      "value": "103",
      "perc1on100gr": "0"
  },
  {
      "_id": 4968,
      "product": 258,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4969,
      "product": 258,
      "nutrient": 22,
      "value": "48",
      "perc1on100gr": "0"
  },
  {
      "_id": 4970,
      "product": 258,
      "nutrient": 24,
      "value": "78",
      "perc1on100gr": "0"
  },
  {
      "_id": 4971,
      "product": 258,
      "nutrient": 17,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 4972,
      "product": 258,
      "nutrient": 38,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 4973,
      "product": 258,
      "nutrient": 43,
      "value": "0.43",
      "perc1on100gr": "0"
  },
  {
      "_id": 4974,
      "product": 258,
      "nutrient": 47,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4977,
      "product": 259,
      "nutrient": 0,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4978,
      "product": 259,
      "nutrient": 1,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4979,
      "product": 259,
      "nutrient": 2,
      "value": "22.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4980,
      "product": 259,
      "nutrient": 3,
      "value": "138",
      "perc1on100gr": "0"
  },
  {
      "_id": 4981,
      "product": 259,
      "nutrient": 45,
      "value": "22.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 4982,
      "product": 259,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 4983,
      "product": 259,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 4984,
      "product": 259,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4985,
      "product": 259,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 4986,
      "product": 259,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4987,
      "product": 259,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4988,
      "product": 259,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 4989,
      "product": 259,
      "nutrient": 19,
      "value": "131",
      "perc1on100gr": "0"
  },
  {
      "_id": 4990,
      "product": 259,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 4991,
      "product": 259,
      "nutrient": 22,
      "value": "46",
      "perc1on100gr": "0"
  },
  {
      "_id": 4992,
      "product": 259,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 4993,
      "product": 259,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 4994,
      "product": 259,
      "nutrient": 47,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 4997,
      "product": 260,
      "nutrient": 0,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 4998,
      "product": 260,
      "nutrient": 1,
      "value": "3.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 4999,
      "product": 260,
      "nutrient": 2,
      "value": "21.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5000,
      "product": 260,
      "nutrient": 3,
      "value": "132",
      "perc1on100gr": "0"
  },
  {
      "_id": 5001,
      "product": 260,
      "nutrient": 45,
      "value": "21.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5002,
      "product": 260,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5003,
      "product": 260,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5004,
      "product": 260,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5005,
      "product": 260,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5006,
      "product": 260,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5007,
      "product": 260,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5008,
      "product": 260,
      "nutrient": 18,
      "value": "148",
      "perc1on100gr": "0"
  },
  {
      "_id": 5009,
      "product": 260,
      "nutrient": 19,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 5010,
      "product": 260,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5011,
      "product": 260,
      "nutrient": 22,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 5012,
      "product": 260,
      "nutrient": 24,
      "value": "101",
      "perc1on100gr": "0"
  },
  {
      "_id": 5013,
      "product": 260,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5014,
      "product": 260,
      "nutrient": 47,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5017,
      "product": 261,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5018,
      "product": 261,
      "nutrient": 1,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5019,
      "product": 261,
      "nutrient": 2,
      "value": "21.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5020,
      "product": 261,
      "nutrient": 3,
      "value": "231",
      "perc1on100gr": "0"
  },
  {
      "_id": 5021,
      "product": 261,
      "nutrient": 45,
      "value": "19.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5022,
      "product": 261,
      "nutrient": 46,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5023,
      "product": 261,
      "nutrient": 53,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5024,
      "product": 261,
      "nutrient": 4,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 5025,
      "product": 261,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5026,
      "product": 261,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5027,
      "product": 261,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5028,
      "product": 261,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5029,
      "product": 261,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5030,
      "product": 261,
      "nutrient": 18,
      "value": "182",
      "perc1on100gr": "0"
  },
  {
      "_id": 5031,
      "product": 261,
      "nutrient": 19,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 5032,
      "product": 261,
      "nutrient": 21,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 5033,
      "product": 261,
      "nutrient": 22,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 5034,
      "product": 261,
      "nutrient": 24,
      "value": "107",
      "perc1on100gr": "0"
  },
  {
      "_id": 5035,
      "product": 261,
      "nutrient": 17,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5036,
      "product": 261,
      "nutrient": 47,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 5039,
      "product": 262,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5040,
      "product": 262,
      "nutrient": 1,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5041,
      "product": 262,
      "nutrient": 2,
      "value": "21.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5042,
      "product": 262,
      "nutrient": 3,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5043,
      "product": 262,
      "nutrient": 45,
      "value": "21.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5044,
      "product": 262,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5045,
      "product": 262,
      "nutrient": 4,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5046,
      "product": 262,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5047,
      "product": 262,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5048,
      "product": 262,
      "nutrient": 11,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5049,
      "product": 262,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5050,
      "product": 262,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5051,
      "product": 262,
      "nutrient": 18,
      "value": "97",
      "perc1on100gr": "0"
  },
  {
      "_id": 5052,
      "product": 262,
      "nutrient": 19,
      "value": "72",
      "perc1on100gr": "0"
  },
  {
      "_id": 5053,
      "product": 262,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5054,
      "product": 262,
      "nutrient": 22,
      "value": "39",
      "perc1on100gr": "0"
  },
  {
      "_id": 5055,
      "product": 262,
      "nutrient": 24,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 5056,
      "product": 262,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5057,
      "product": 262,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5060,
      "product": 263,
      "nutrient": 0,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5061,
      "product": 263,
      "nutrient": 1,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5062,
      "product": 263,
      "nutrient": 2,
      "value": "22.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5063,
      "product": 263,
      "nutrient": 3,
      "value": "133",
      "perc1on100gr": "0"
  },
  {
      "_id": 5064,
      "product": 263,
      "nutrient": 45,
      "value": "20.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5065,
      "product": 263,
      "nutrient": 46,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5066,
      "product": 263,
      "nutrient": 53,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5067,
      "product": 263,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5068,
      "product": 263,
      "nutrient": 5,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5069,
      "product": 263,
      "nutrient": 6,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5070,
      "product": 263,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5071,
      "product": 263,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5072,
      "product": 263,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5073,
      "product": 263,
      "nutrient": 18,
      "value": "168",
      "perc1on100gr": "0"
  },
  {
      "_id": 5074,
      "product": 263,
      "nutrient": 19,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 5075,
      "product": 263,
      "nutrient": 21,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 5076,
      "product": 263,
      "nutrient": 22,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 5077,
      "product": 263,
      "nutrient": 24,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 5078,
      "product": 263,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5079,
      "product": 263,
      "nutrient": 47,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5082,
      "product": 264,
      "nutrient": 0,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5083,
      "product": 264,
      "nutrient": 1,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5084,
      "product": 264,
      "nutrient": 2,
      "value": "20.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5085,
      "product": 264,
      "nutrient": 3,
      "value": "232",
      "perc1on100gr": "0"
  },
  {
      "_id": 5086,
      "product": 264,
      "nutrient": 45,
      "value": "20.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5087,
      "product": 264,
      "nutrient": 4,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 5088,
      "product": 264,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5089,
      "product": 264,
      "nutrient": 6,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5090,
      "product": 264,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5091,
      "product": 264,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5092,
      "product": 264,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5093,
      "product": 264,
      "nutrient": 18,
      "value": "162",
      "perc1on100gr": "0"
  },
  {
      "_id": 5094,
      "product": 264,
      "nutrient": 19,
      "value": "159",
      "perc1on100gr": "0"
  },
  {
      "_id": 5095,
      "product": 264,
      "nutrient": 21,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5096,
      "product": 264,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5097,
      "product": 264,
      "nutrient": 24,
      "value": "114",
      "perc1on100gr": "0"
  },
  {
      "_id": 5098,
      "product": 264,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5099,
      "product": 264,
      "nutrient": 47,
      "value": "44",
      "perc1on100gr": "0"
  },
  {
      "_id": 5102,
      "product": 265,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5103,
      "product": 265,
      "nutrient": 1,
      "value": "24",
      "perc1on100gr": "0"
  },
  {
      "_id": 5104,
      "product": 265,
      "nutrient": 2,
      "value": "21.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5105,
      "product": 265,
      "nutrient": 3,
      "value": "310",
      "perc1on100gr": "0"
  },
  {
      "_id": 5106,
      "product": 265,
      "nutrient": 45,
      "value": "19.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5107,
      "product": 265,
      "nutrient": 46,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5108,
      "product": 265,
      "nutrient": 53,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5109,
      "product": 265,
      "nutrient": 4,
      "value": "101",
      "perc1on100gr": "0"
  },
  {
      "_id": 5110,
      "product": 265,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5111,
      "product": 265,
      "nutrient": 6,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 5112,
      "product": 265,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5113,
      "product": 265,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5114,
      "product": 265,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5115,
      "product": 265,
      "nutrient": 18,
      "value": "194",
      "perc1on100gr": "0"
  },
  {
      "_id": 5116,
      "product": 265,
      "nutrient": 19,
      "value": "133",
      "perc1on100gr": "0"
  },
  {
      "_id": 5117,
      "product": 265,
      "nutrient": 21,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 5118,
      "product": 265,
      "nutrient": 22,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 5119,
      "product": 265,
      "nutrient": 24,
      "value": "117",
      "perc1on100gr": "0"
  },
  {
      "_id": 5120,
      "product": 265,
      "nutrient": 17,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5121,
      "product": 265,
      "nutrient": 47,
      "value": "49",
      "perc1on100gr": "0"
  },
  {
      "_id": 5124,
      "product": 266,
      "nutrient": 0,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5125,
      "product": 266,
      "nutrient": 1,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5126,
      "product": 266,
      "nutrient": 2,
      "value": "22.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5127,
      "product": 266,
      "nutrient": 3,
      "value": "240",
      "perc1on100gr": "0"
  },
  {
      "_id": 5128,
      "product": 266,
      "nutrient": 45,
      "value": "22.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5129,
      "product": 266,
      "nutrient": 4,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 5130,
      "product": 266,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5131,
      "product": 266,
      "nutrient": 6,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5132,
      "product": 266,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5133,
      "product": 266,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5134,
      "product": 266,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5135,
      "product": 266,
      "nutrient": 18,
      "value": "166",
      "perc1on100gr": "0"
  },
  {
      "_id": 5136,
      "product": 266,
      "nutrient": 19,
      "value": "158",
      "perc1on100gr": "0"
  },
  {
      "_id": 5137,
      "product": 266,
      "nutrient": 21,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 5138,
      "product": 266,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5139,
      "product": 266,
      "nutrient": 24,
      "value": "113",
      "perc1on100gr": "0"
  },
  {
      "_id": 5140,
      "product": 266,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5141,
      "product": 266,
      "nutrient": 47,
      "value": "44",
      "perc1on100gr": "0"
  },
  {
      "_id": 5144,
      "product": 267,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5145,
      "product": 267,
      "nutrient": 1,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 5146,
      "product": 267,
      "nutrient": 2,
      "value": "21.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5147,
      "product": 267,
      "nutrient": 3,
      "value": "206",
      "perc1on100gr": "0"
  },
  {
      "_id": 5148,
      "product": 267,
      "nutrient": 45,
      "value": "21.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5149,
      "product": 267,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5150,
      "product": 267,
      "nutrient": 4,
      "value": "71",
      "perc1on100gr": "0"
  },
  {
      "_id": 5151,
      "product": 267,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5152,
      "product": 267,
      "nutrient": 6,
      "value": "0.21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5153,
      "product": 267,
      "nutrient": 11,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5154,
      "product": 267,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5155,
      "product": 267,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5156,
      "product": 267,
      "nutrient": 18,
      "value": "155",
      "perc1on100gr": "0"
  },
  {
      "_id": 5157,
      "product": 267,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5158,
      "product": 267,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5159,
      "product": 267,
      "nutrient": 22,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 5160,
      "product": 267,
      "nutrient": 24,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 5161,
      "product": 267,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5162,
      "product": 267,
      "nutrient": 47,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 5165,
      "product": 268,
      "nutrient": 0,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5166,
      "product": 268,
      "nutrient": 1,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5167,
      "product": 268,
      "nutrient": 2,
      "value": "21.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5168,
      "product": 268,
      "nutrient": 3,
      "value": "231",
      "perc1on100gr": "0"
  },
  {
      "_id": 5169,
      "product": 268,
      "nutrient": 45,
      "value": "20.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5170,
      "product": 268,
      "nutrient": 46,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5171,
      "product": 268,
      "nutrient": 53,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5172,
      "product": 268,
      "nutrient": 4,
      "value": "73",
      "perc1on100gr": "0"
  },
  {
      "_id": 5173,
      "product": 268,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5174,
      "product": 268,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5175,
      "product": 268,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5176,
      "product": 268,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5177,
      "product": 268,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5178,
      "product": 268,
      "nutrient": 18,
      "value": "153",
      "perc1on100gr": "0"
  },
  {
      "_id": 5179,
      "product": 268,
      "nutrient": 19,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 5180,
      "product": 268,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5181,
      "product": 268,
      "nutrient": 22,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 5182,
      "product": 268,
      "nutrient": 24,
      "value": "93",
      "perc1on100gr": "0"
  },
  {
      "_id": 5183,
      "product": 268,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5184,
      "product": 268,
      "nutrient": 47,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 5187,
      "product": 269,
      "nutrient": 0,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5188,
      "product": 269,
      "nutrient": 1,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5189,
      "product": 269,
      "nutrient": 2,
      "value": "20.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 5190,
      "product": 269,
      "nutrient": 3,
      "value": "184",
      "perc1on100gr": "0"
  },
  {
      "_id": 5191,
      "product": 269,
      "nutrient": 45,
      "value": "20.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 5192,
      "product": 269,
      "nutrient": 4,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 5193,
      "product": 269,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5194,
      "product": 269,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5195,
      "product": 269,
      "nutrient": 52,
      "value": "0.35",
      "perc1on100gr": "0"
  },
  {
      "_id": 5196,
      "product": 269,
      "nutrient": 8,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 5197,
      "product": 269,
      "nutrient": 9,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5198,
      "product": 269,
      "nutrient": 10,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 5199,
      "product": 269,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5200,
      "product": 269,
      "nutrient": 12,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5201,
      "product": 269,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5202,
      "product": 269,
      "nutrient": 14,
      "value": "2.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 5203,
      "product": 269,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5204,
      "product": 269,
      "nutrient": 16,
      "value": "9.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5205,
      "product": 269,
      "nutrient": 18,
      "value": "156",
      "perc1on100gr": "0"
  },
  {
      "_id": 5206,
      "product": 269,
      "nutrient": 19,
      "value": "148",
      "perc1on100gr": "0"
  },
  {
      "_id": 5207,
      "product": 269,
      "nutrient": 21,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5208,
      "product": 269,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5209,
      "product": 269,
      "nutrient": 23,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 5210,
      "product": 269,
      "nutrient": 24,
      "value": "107",
      "perc1on100gr": "0"
  },
  {
      "_id": 5211,
      "product": 269,
      "nutrient": 25,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 5212,
      "product": 269,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5213,
      "product": 269,
      "nutrient": 29,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 5214,
      "product": 269,
      "nutrient": 30,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5215,
      "product": 269,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5216,
      "product": 269,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5217,
      "product": 269,
      "nutrient": 34,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5218,
      "product": 269,
      "nutrient": 41,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5219,
      "product": 269,
      "nutrient": 42,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5220,
      "product": 269,
      "nutrient": 43,
      "value": "0.32",
      "perc1on100gr": "0"
  },
  {
      "_id": 5221,
      "product": 269,
      "nutrient": 47,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 5224,
      "product": 270,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5225,
      "product": 270,
      "nutrient": 1,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 5226,
      "product": 270,
      "nutrient": 2,
      "value": "20.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5227,
      "product": 270,
      "nutrient": 3,
      "value": "271",
      "perc1on100gr": "0"
  },
  {
      "_id": 5228,
      "product": 270,
      "nutrient": 45,
      "value": "18.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5229,
      "product": 270,
      "nutrient": 46,
      "value": "1.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5230,
      "product": 270,
      "nutrient": 53,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5231,
      "product": 270,
      "nutrient": 4,
      "value": "77",
      "perc1on100gr": "0"
  },
  {
      "_id": 5232,
      "product": 270,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5233,
      "product": 270,
      "nutrient": 6,
      "value": "0.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5234,
      "product": 270,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5235,
      "product": 270,
      "nutrient": 13,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5236,
      "product": 270,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5237,
      "product": 270,
      "nutrient": 18,
      "value": "189",
      "perc1on100gr": "0"
  },
  {
      "_id": 5238,
      "product": 270,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5239,
      "product": 270,
      "nutrient": 21,
      "value": "39",
      "perc1on100gr": "0"
  },
  {
      "_id": 5240,
      "product": 270,
      "nutrient": 22,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 5241,
      "product": 270,
      "nutrient": 24,
      "value": "112",
      "perc1on100gr": "0"
  },
  {
      "_id": 5242,
      "product": 270,
      "nutrient": 17,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5243,
      "product": 270,
      "nutrient": 47,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 5246,
      "product": 271,
      "nutrient": 0,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5247,
      "product": 271,
      "nutrient": 1,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5248,
      "product": 271,
      "nutrient": 2,
      "value": "21.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5249,
      "product": 271,
      "nutrient": 3,
      "value": "191",
      "perc1on100gr": "0"
  },
  {
      "_id": 5250,
      "product": 271,
      "nutrient": 45,
      "value": "21.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5251,
      "product": 271,
      "nutrient": 4,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 5252,
      "product": 271,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5253,
      "product": 271,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5254,
      "product": 271,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5255,
      "product": 271,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5256,
      "product": 271,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5257,
      "product": 271,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 5258,
      "product": 271,
      "nutrient": 19,
      "value": "133",
      "perc1on100gr": "0"
  },
  {
      "_id": 5259,
      "product": 271,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5260,
      "product": 271,
      "nutrient": 22,
      "value": "49",
      "perc1on100gr": "0"
  },
  {
      "_id": 5261,
      "product": 271,
      "nutrient": 24,
      "value": "103",
      "perc1on100gr": "0"
  },
  {
      "_id": 5262,
      "product": 271,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5263,
      "product": 271,
      "nutrient": 47,
      "value": "29",
      "perc1on100gr": "0"
  },
  {
      "_id": 5266,
      "product": 272,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5267,
      "product": 272,
      "nutrient": 1,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5268,
      "product": 272,
      "nutrient": 2,
      "value": "20.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5269,
      "product": 272,
      "nutrient": 3,
      "value": "166",
      "perc1on100gr": "0"
  },
  {
      "_id": 5270,
      "product": 272,
      "nutrient": 45,
      "value": "20.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5271,
      "product": 272,
      "nutrient": 46,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5272,
      "product": 272,
      "nutrient": 4,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 5273,
      "product": 272,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5274,
      "product": 272,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5275,
      "product": 272,
      "nutrient": 11,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5276,
      "product": 272,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5277,
      "product": 272,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5278,
      "product": 272,
      "nutrient": 18,
      "value": "170",
      "perc1on100gr": "0"
  },
  {
      "_id": 5279,
      "product": 272,
      "nutrient": 19,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 5280,
      "product": 272,
      "nutrient": 21,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 5281,
      "product": 272,
      "nutrient": 22,
      "value": "49",
      "perc1on100gr": "0"
  },
  {
      "_id": 5282,
      "product": 272,
      "nutrient": 24,
      "value": "104",
      "perc1on100gr": "0"
  },
  {
      "_id": 5283,
      "product": 272,
      "nutrient": 17,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5284,
      "product": 272,
      "nutrient": 47,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 5287,
      "product": 273,
      "nutrient": 0,
      "value": "3.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5288,
      "product": 273,
      "nutrient": 1,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5289,
      "product": 273,
      "nutrient": 2,
      "value": "21.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5290,
      "product": 273,
      "nutrient": 3,
      "value": "185",
      "perc1on100gr": "0"
  },
  {
      "_id": 5291,
      "product": 273,
      "nutrient": 45,
      "value": "19.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5292,
      "product": 273,
      "nutrient": 46,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5293,
      "product": 273,
      "nutrient": 53,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5294,
      "product": 273,
      "nutrient": 4,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 5295,
      "product": 273,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5296,
      "product": 273,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5297,
      "product": 273,
      "nutrient": 11,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5298,
      "product": 273,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5299,
      "product": 273,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5300,
      "product": 273,
      "nutrient": 18,
      "value": "158",
      "perc1on100gr": "0"
  },
  {
      "_id": 5301,
      "product": 273,
      "nutrient": 19,
      "value": "125",
      "perc1on100gr": "0"
  },
  {
      "_id": 5302,
      "product": 273,
      "nutrient": 21,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5303,
      "product": 273,
      "nutrient": 22,
      "value": "44",
      "perc1on100gr": "0"
  },
  {
      "_id": 5304,
      "product": 273,
      "nutrient": 24,
      "value": "101",
      "perc1on100gr": "0"
  },
  {
      "_id": 5305,
      "product": 273,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5306,
      "product": 273,
      "nutrient": 47,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 5309,
      "product": 274,
      "nutrient": 0,
      "value": "3.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5310,
      "product": 274,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5311,
      "product": 274,
      "nutrient": 2,
      "value": "5.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5312,
      "product": 274,
      "nutrient": 3,
      "value": "61",
      "perc1on100gr": "0"
  },
  {
      "_id": 5313,
      "product": 274,
      "nutrient": 45,
      "value": "5.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5314,
      "product": 274,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5315,
      "product": 274,
      "nutrient": 5,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 5316,
      "product": 274,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5317,
      "product": 274,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5318,
      "product": 274,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5319,
      "product": 274,
      "nutrient": 18,
      "value": "129",
      "perc1on100gr": "0"
  },
  {
      "_id": 5320,
      "product": 274,
      "nutrient": 19,
      "value": "108",
      "perc1on100gr": "0"
  },
  {
      "_id": 5321,
      "product": 274,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5322,
      "product": 274,
      "nutrient": 22,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 5323,
      "product": 274,
      "nutrient": 24,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 5324,
      "product": 274,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5325,
      "product": 274,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5328,
      "product": 275,
      "nutrient": 0,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5329,
      "product": 275,
      "nutrient": 1,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5330,
      "product": 275,
      "nutrient": 2,
      "value": "10.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5331,
      "product": 275,
      "nutrient": 3,
      "value": "79",
      "perc1on100gr": "0"
  },
  {
      "_id": 5332,
      "product": 275,
      "nutrient": 45,
      "value": "10.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5333,
      "product": 275,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5334,
      "product": 275,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5335,
      "product": 275,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5336,
      "product": 275,
      "nutrient": 11,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5337,
      "product": 275,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5338,
      "product": 275,
      "nutrient": 18,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 5339,
      "product": 275,
      "nutrient": 19,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 5340,
      "product": 275,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5341,
      "product": 275,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5342,
      "product": 275,
      "nutrient": 24,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 5343,
      "product": 275,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5344,
      "product": 275,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5347,
      "product": 276,
      "nutrient": 0,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5348,
      "product": 276,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5349,
      "product": 276,
      "nutrient": 2,
      "value": "12.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5350,
      "product": 276,
      "nutrient": 3,
      "value": "69",
      "perc1on100gr": "0"
  },
  {
      "_id": 5351,
      "product": 276,
      "nutrient": 45,
      "value": "12.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5352,
      "product": 276,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5353,
      "product": 276,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5354,
      "product": 276,
      "nutrient": 11,
      "value": "1.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5355,
      "product": 276,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5356,
      "product": 276,
      "nutrient": 18,
      "value": "123",
      "perc1on100gr": "0"
  },
  {
      "_id": 5357,
      "product": 276,
      "nutrient": 19,
      "value": "109",
      "perc1on100gr": "0"
  },
  {
      "_id": 5358,
      "product": 276,
      "nutrient": 21,
      "value": "13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5359,
      "product": 276,
      "nutrient": 22,
      "value": "45",
      "perc1on100gr": "0"
  },
  {
      "_id": 5360,
      "product": 276,
      "nutrient": 24,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 5361,
      "product": 276,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5362,
      "product": 276,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5365,
      "product": 277,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5366,
      "product": 277,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5367,
      "product": 277,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5368,
      "product": 277,
      "nutrient": 3,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 5369,
      "product": 277,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5370,
      "product": 277,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5371,
      "product": 277,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5372,
      "product": 277,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5373,
      "product": 277,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5374,
      "product": 277,
      "nutrient": 18,
      "value": "150",
      "perc1on100gr": "0"
  },
  {
      "_id": 5375,
      "product": 277,
      "nutrient": 19,
      "value": "125",
      "perc1on100gr": "0"
  },
  {
      "_id": 5376,
      "product": 277,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5377,
      "product": 277,
      "nutrient": 22,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 5378,
      "product": 277,
      "nutrient": 24,
      "value": "73",
      "perc1on100gr": "0"
  },
  {
      "_id": 5379,
      "product": 277,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5380,
      "product": 277,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5383,
      "product": 278,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5384,
      "product": 278,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5385,
      "product": 278,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5386,
      "product": 278,
      "nutrient": 3,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 5387,
      "product": 278,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5388,
      "product": 278,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5389,
      "product": 278,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5390,
      "product": 278,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5391,
      "product": 278,
      "nutrient": 11,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5392,
      "product": 278,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5393,
      "product": 278,
      "nutrient": 18,
      "value": "136",
      "perc1on100gr": "0"
  },
  {
      "_id": 5394,
      "product": 278,
      "nutrient": 19,
      "value": "121",
      "perc1on100gr": "0"
  },
  {
      "_id": 5395,
      "product": 278,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5396,
      "product": 278,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5397,
      "product": 278,
      "nutrient": 24,
      "value": "94",
      "perc1on100gr": "0"
  },
  {
      "_id": 5398,
      "product": 278,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5399,
      "product": 278,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5402,
      "product": 279,
      "nutrient": 0,
      "value": "5.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5403,
      "product": 279,
      "nutrient": 1,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5404,
      "product": 279,
      "nutrient": 2,
      "value": "20.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5405,
      "product": 279,
      "nutrient": 3,
      "value": "143",
      "perc1on100gr": "0"
  },
  {
      "_id": 5406,
      "product": 279,
      "nutrient": 45,
      "value": "20.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5407,
      "product": 279,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5408,
      "product": 279,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 5409,
      "product": 279,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5410,
      "product": 279,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5411,
      "product": 279,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5412,
      "product": 279,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5413,
      "product": 279,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 5414,
      "product": 279,
      "nutrient": 19,
      "value": "137",
      "perc1on100gr": "0"
  },
  {
      "_id": 5415,
      "product": 279,
      "nutrient": 21,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5416,
      "product": 279,
      "nutrient": 22,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 5417,
      "product": 279,
      "nutrient": 24,
      "value": "103",
      "perc1on100gr": "0"
  },
  {
      "_id": 5418,
      "product": 279,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5419,
      "product": 279,
      "nutrient": 47,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 5422,
      "product": 280,
      "nutrient": 0,
      "value": "6.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5423,
      "product": 280,
      "nutrient": 1,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5424,
      "product": 280,
      "nutrient": 2,
      "value": "25.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5425,
      "product": 280,
      "nutrient": 3,
      "value": "203",
      "perc1on100gr": "0"
  },
  {
      "_id": 5426,
      "product": 280,
      "nutrient": 45,
      "value": "25.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5427,
      "product": 280,
      "nutrient": 4,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 5428,
      "product": 280,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 5429,
      "product": 280,
      "nutrient": 6,
      "value": "0.27",
      "perc1on100gr": "0"
  },
  {
      "_id": 5430,
      "product": 280,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5431,
      "product": 280,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5432,
      "product": 280,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5433,
      "product": 280,
      "nutrient": 18,
      "value": "141",
      "perc1on100gr": "0"
  },
  {
      "_id": 5434,
      "product": 280,
      "nutrient": 19,
      "value": "126",
      "perc1on100gr": "0"
  },
  {
      "_id": 5435,
      "product": 280,
      "nutrient": 21,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5436,
      "product": 280,
      "nutrient": 22,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 5437,
      "product": 280,
      "nutrient": 24,
      "value": "100",
      "perc1on100gr": "0"
  },
  {
      "_id": 5438,
      "product": 280,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5439,
      "product": 280,
      "nutrient": 47,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5442,
      "product": 281,
      "nutrient": 0,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5443,
      "product": 281,
      "nutrient": 1,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5444,
      "product": 281,
      "nutrient": 2,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5445,
      "product": 281,
      "nutrient": 3,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 5446,
      "product": 281,
      "nutrient": 45,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5447,
      "product": 281,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5448,
      "product": 281,
      "nutrient": 6,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5449,
      "product": 281,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5450,
      "product": 281,
      "nutrient": 15,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5451,
      "product": 281,
      "nutrient": 18,
      "value": "112",
      "perc1on100gr": "0"
  },
  {
      "_id": 5452,
      "product": 281,
      "nutrient": 19,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 5453,
      "product": 281,
      "nutrient": 21,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 5454,
      "product": 281,
      "nutrient": 22,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 5455,
      "product": 281,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5458,
      "product": 282,
      "nutrient": 0,
      "value": "3.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5459,
      "product": 282,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5460,
      "product": 282,
      "nutrient": 2,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5461,
      "product": 282,
      "nutrient": 3,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 5462,
      "product": 282,
      "nutrient": 45,
      "value": "4.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5463,
      "product": 282,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5464,
      "product": 282,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5465,
      "product": 282,
      "nutrient": 52,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 5466,
      "product": 282,
      "nutrient": 8,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5467,
      "product": 282,
      "nutrient": 10,
      "value": "0.42",
      "perc1on100gr": "0"
  },
  {
      "_id": 5468,
      "product": 282,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5469,
      "product": 282,
      "nutrient": 14,
      "value": "3.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5470,
      "product": 282,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5471,
      "product": 282,
      "nutrient": 16,
      "value": "46.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5472,
      "product": 283,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5473,
      "product": 283,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5474,
      "product": 283,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5475,
      "product": 283,
      "nutrient": 3,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 5476,
      "product": 283,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5477,
      "product": 283,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5478,
      "product": 283,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5479,
      "product": 283,
      "nutrient": 6,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 5480,
      "product": 283,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5481,
      "product": 283,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5482,
      "product": 283,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 5483,
      "product": 283,
      "nutrient": 19,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 5484,
      "product": 283,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5485,
      "product": 283,
      "nutrient": 22,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 5486,
      "product": 283,
      "nutrient": 24,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5487,
      "product": 283,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5488,
      "product": 283,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5491,
      "product": 284,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5492,
      "product": 284,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5493,
      "product": 284,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5494,
      "product": 284,
      "nutrient": 3,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 5495,
      "product": 284,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5496,
      "product": 284,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5497,
      "product": 284,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5498,
      "product": 284,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5499,
      "product": 284,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5500,
      "product": 284,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 5501,
      "product": 284,
      "nutrient": 19,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 5502,
      "product": 284,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5503,
      "product": 284,
      "nutrient": 22,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 5504,
      "product": 284,
      "nutrient": 24,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5505,
      "product": 284,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5506,
      "product": 284,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5509,
      "product": 285,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5510,
      "product": 285,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5511,
      "product": 285,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5512,
      "product": 285,
      "nutrient": 3,
      "value": "53",
      "perc1on100gr": "0"
  },
  {
      "_id": 5513,
      "product": 285,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5514,
      "product": 285,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5515,
      "product": 285,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5516,
      "product": 285,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5517,
      "product": 285,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5518,
      "product": 285,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5519,
      "product": 285,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 5520,
      "product": 285,
      "nutrient": 19,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 5521,
      "product": 285,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5522,
      "product": 285,
      "nutrient": 22,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 5523,
      "product": 285,
      "nutrient": 24,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5524,
      "product": 285,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5525,
      "product": 285,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5528,
      "product": 286,
      "nutrient": 0,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5529,
      "product": 286,
      "nutrient": 1,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5530,
      "product": 286,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5531,
      "product": 286,
      "nutrient": 3,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 5532,
      "product": 286,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5533,
      "product": 286,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5534,
      "product": 286,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5535,
      "product": 286,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5536,
      "product": 286,
      "nutrient": 52,
      "value": "0.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 5537,
      "product": 286,
      "nutrient": 8,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5538,
      "product": 286,
      "nutrient": 9,
      "value": "7.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5539,
      "product": 286,
      "nutrient": 10,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 5540,
      "product": 286,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5541,
      "product": 286,
      "nutrient": 14,
      "value": "3.39",
      "perc1on100gr": "0"
  },
  {
      "_id": 5542,
      "product": 286,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5543,
      "product": 286,
      "nutrient": 16,
      "value": "43",
      "perc1on100gr": "0"
  },
  {
      "_id": 5544,
      "product": 286,
      "nutrient": 18,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 5545,
      "product": 286,
      "nutrient": 19,
      "value": "118",
      "perc1on100gr": "0"
  },
  {
      "_id": 5546,
      "product": 286,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5547,
      "product": 286,
      "nutrient": 22,
      "value": "51",
      "perc1on100gr": "0"
  },
  {
      "_id": 5548,
      "product": 286,
      "nutrient": 23,
      "value": "28",
      "perc1on100gr": "0"
  },
  {
      "_id": 5549,
      "product": 286,
      "nutrient": 24,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5550,
      "product": 286,
      "nutrient": 25,
      "value": "98",
      "perc1on100gr": "0"
  },
  {
      "_id": 5551,
      "product": 286,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5552,
      "product": 286,
      "nutrient": 29,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5553,
      "product": 286,
      "nutrient": 30,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5554,
      "product": 286,
      "nutrient": 32,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5555,
      "product": 286,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5556,
      "product": 286,
      "nutrient": 34,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5557,
      "product": 286,
      "nutrient": 38,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5558,
      "product": 286,
      "nutrient": 41,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 5559,
      "product": 286,
      "nutrient": 42,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5560,
      "product": 286,
      "nutrient": 43,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5561,
      "product": 286,
      "nutrient": 47,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5564,
      "product": 287,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5565,
      "product": 287,
      "nutrient": 1,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 5566,
      "product": 287,
      "nutrient": 2,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5567,
      "product": 287,
      "nutrient": 3,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 5568,
      "product": 287,
      "nutrient": 45,
      "value": "3.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5569,
      "product": 287,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5570,
      "product": 287,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5571,
      "product": 287,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5572,
      "product": 287,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5573,
      "product": 287,
      "nutrient": 18,
      "value": "152",
      "perc1on100gr": "0"
  },
  {
      "_id": 5574,
      "product": 287,
      "nutrient": 19,
      "value": "126",
      "perc1on100gr": "0"
  },
  {
      "_id": 5575,
      "product": 287,
      "nutrient": 21,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5576,
      "product": 287,
      "nutrient": 22,
      "value": "52",
      "perc1on100gr": "0"
  },
  {
      "_id": 5577,
      "product": 287,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 5578,
      "product": 287,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5581,
      "product": 288,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5582,
      "product": 288,
      "nutrient": 1,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5583,
      "product": 288,
      "nutrient": 2,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5584,
      "product": 288,
      "nutrient": 3,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 5585,
      "product": 288,
      "nutrient": 45,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5586,
      "product": 288,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5587,
      "product": 288,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5588,
      "product": 288,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5589,
      "product": 288,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5590,
      "product": 288,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 5591,
      "product": 288,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5592,
      "product": 288,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 5593,
      "product": 288,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5594,
      "product": 288,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 5595,
      "product": 288,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5596,
      "product": 288,
      "nutrient": 47,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5599,
      "product": 289,
      "nutrient": 1,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5600,
      "product": 289,
      "nutrient": 2,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5601,
      "product": 289,
      "nutrient": 3,
      "value": "54",
      "perc1on100gr": "0"
  },
  {
      "_id": 5602,
      "product": 289,
      "nutrient": 45,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5603,
      "product": 289,
      "nutrient": 4,
      "value": "21",
      "perc1on100gr": "0"
  },
  {
      "_id": 5604,
      "product": 289,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5605,
      "product": 289,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5606,
      "product": 289,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5607,
      "product": 289,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5608,
      "product": 289,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 5609,
      "product": 289,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5610,
      "product": 289,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 5611,
      "product": 289,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5612,
      "product": 289,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 5613,
      "product": 289,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5614,
      "product": 289,
      "nutrient": 47,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5617,
      "product": 290,
      "nutrient": 0,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5618,
      "product": 290,
      "nutrient": 1,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5619,
      "product": 290,
      "nutrient": 2,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5620,
      "product": 290,
      "nutrient": 3,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 5621,
      "product": 290,
      "nutrient": 45,
      "value": "4.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5622,
      "product": 290,
      "nutrient": 4,
      "value": "32",
      "perc1on100gr": "0"
  },
  {
      "_id": 5623,
      "product": 290,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5624,
      "product": 290,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5625,
      "product": 290,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5626,
      "product": 290,
      "nutrient": 13,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5627,
      "product": 290,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5628,
      "product": 290,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 5629,
      "product": 290,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5630,
      "product": 290,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 5631,
      "product": 290,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5632,
      "product": 290,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 5633,
      "product": 290,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5634,
      "product": 290,
      "nutrient": 47,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5637,
      "product": 291,
      "nutrient": 0,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5638,
      "product": 291,
      "nutrient": 1,
      "value": "6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5639,
      "product": 291,
      "nutrient": 2,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5640,
      "product": 291,
      "nutrient": 3,
      "value": "85",
      "perc1on100gr": "0"
  },
  {
      "_id": 5641,
      "product": 291,
      "nutrient": 45,
      "value": "4.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5642,
      "product": 291,
      "nutrient": 4,
      "value": "42",
      "perc1on100gr": "0"
  },
  {
      "_id": 5643,
      "product": 291,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5644,
      "product": 291,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5645,
      "product": 291,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5646,
      "product": 291,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5647,
      "product": 291,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5648,
      "product": 291,
      "nutrient": 18,
      "value": "146",
      "perc1on100gr": "0"
  },
  {
      "_id": 5649,
      "product": 291,
      "nutrient": 19,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5650,
      "product": 291,
      "nutrient": 21,
      "value": "14",
      "perc1on100gr": "0"
  },
  {
      "_id": 5651,
      "product": 291,
      "nutrient": 22,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5652,
      "product": 291,
      "nutrient": 24,
      "value": "92",
      "perc1on100gr": "0"
  },
  {
      "_id": 5653,
      "product": 291,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5654,
      "product": 291,
      "nutrient": 47,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5657,
      "product": 292,
      "nutrient": 0,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5658,
      "product": 292,
      "nutrient": 1,
      "value": "22.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5659,
      "product": 292,
      "nutrient": 2,
      "value": "12.49",
      "perc1on100gr": "0"
  },
  {
      "_id": 5660,
      "product": 292,
      "nutrient": 3,
      "value": "257",
      "perc1on100gr": "0"
  },
  {
      "_id": 5661,
      "product": 292,
      "nutrient": 45,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5662,
      "product": 292,
      "nutrient": 4,
      "value": "188",
      "perc1on100gr": "0"
  },
  {
      "_id": 5663,
      "product": 292,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5664,
      "product": 292,
      "nutrient": 6,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 5665,
      "product": 292,
      "nutrient": 52,
      "value": "0.31",
      "perc1on100gr": "0"
  },
  {
      "_id": 5666,
      "product": 292,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5667,
      "product": 292,
      "nutrient": 9,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5668,
      "product": 292,
      "nutrient": 10,
      "value": "0.29",
      "perc1on100gr": "0"
  },
  {
      "_id": 5669,
      "product": 292,
      "nutrient": 12,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5670,
      "product": 292,
      "nutrient": 13,
      "value": "0.64",
      "perc1on100gr": "0"
  },
  {
      "_id": 5671,
      "product": 292,
      "nutrient": 52,
      "value": "1.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5672,
      "product": 292,
      "nutrient": 15,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 5673,
      "product": 292,
      "nutrient": 16,
      "value": "16.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5674,
      "product": 292,
      "nutrient": 18,
      "value": "147",
      "perc1on100gr": "0"
  },
  {
      "_id": 5675,
      "product": 292,
      "nutrient": 19,
      "value": "101",
      "perc1on100gr": "0"
  },
  {
      "_id": 5676,
      "product": 292,
      "nutrient": 21,
      "value": "11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5677,
      "product": 292,
      "nutrient": 22,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 5678,
      "product": 292,
      "nutrient": 24,
      "value": "89",
      "perc1on100gr": "0"
  },
  {
      "_id": 5679,
      "product": 292,
      "nutrient": 17,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 5680,
      "product": 292,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5681,
      "product": 292,
      "nutrient": 38,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5682,
      "product": 292,
      "nutrient": 41,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5683,
      "product": 292,
      "nutrient": 43,
      "value": "0.37",
      "perc1on100gr": "0"
  },
  {
      "_id": 5684,
      "product": 292,
      "nutrient": 47,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 5687,
      "product": 293,
      "nutrient": 0,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5688,
      "product": 293,
      "nutrient": 1,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5689,
      "product": 293,
      "nutrient": 2,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5690,
      "product": 293,
      "nutrient": 3,
      "value": "119",
      "perc1on100gr": "0"
  },
  {
      "_id": 5691,
      "product": 293,
      "nutrient": 45,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5692,
      "product": 293,
      "nutrient": 4,
      "value": "63",
      "perc1on100gr": "0"
  },
  {
      "_id": 5693,
      "product": 293,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5694,
      "product": 293,
      "nutrient": 6,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5695,
      "product": 293,
      "nutrient": 52,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 5696,
      "product": 293,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5697,
      "product": 293,
      "nutrient": 9,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5698,
      "product": 293,
      "nutrient": 10,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5699,
      "product": 293,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5700,
      "product": 293,
      "nutrient": 12,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 5701,
      "product": 293,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5702,
      "product": 293,
      "nutrient": 14,
      "value": "3.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 5703,
      "product": 293,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5704,
      "product": 293,
      "nutrient": 18,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5705,
      "product": 293,
      "nutrient": 19,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 5706,
      "product": 293,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5707,
      "product": 293,
      "nutrient": 22,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 5708,
      "product": 293,
      "nutrient": 24,
      "value": "83",
      "perc1on100gr": "0"
  },
  {
      "_id": 5709,
      "product": 293,
      "nutrient": 25,
      "value": "76",
      "perc1on100gr": "0"
  },
  {
      "_id": 5710,
      "product": 293,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5711,
      "product": 293,
      "nutrient": 29,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5712,
      "product": 293,
      "nutrient": 30,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5713,
      "product": 293,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5714,
      "product": 293,
      "nutrient": 34,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5715,
      "product": 293,
      "nutrient": 38,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5716,
      "product": 293,
      "nutrient": 41,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5717,
      "product": 293,
      "nutrient": 43,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5718,
      "product": 293,
      "nutrient": 47,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 5721,
      "product": 294,
      "nutrient": 0,
      "value": "2.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5722,
      "product": 294,
      "nutrient": 1,
      "value": "20",
      "perc1on100gr": "0"
  },
  {
      "_id": 5723,
      "product": 294,
      "nutrient": 2,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5724,
      "product": 294,
      "nutrient": 3,
      "value": "207",
      "perc1on100gr": "0"
  },
  {
      "_id": 5725,
      "product": 294,
      "nutrient": 45,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5726,
      "product": 294,
      "nutrient": 4,
      "value": "155",
      "perc1on100gr": "0"
  },
  {
      "_id": 5727,
      "product": 294,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5728,
      "product": 294,
      "nutrient": 6,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5729,
      "product": 294,
      "nutrient": 52,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5730,
      "product": 294,
      "nutrient": 8,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 5731,
      "product": 294,
      "nutrient": 9,
      "value": "7.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5732,
      "product": 294,
      "nutrient": 10,
      "value": "0.45",
      "perc1on100gr": "0"
  },
  {
      "_id": 5733,
      "product": 294,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5734,
      "product": 294,
      "nutrient": 12,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 5735,
      "product": 294,
      "nutrient": 13,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5736,
      "product": 294,
      "nutrient": 14,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5737,
      "product": 294,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5738,
      "product": 294,
      "nutrient": 16,
      "value": "47.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5739,
      "product": 294,
      "nutrient": 18,
      "value": "109",
      "perc1on100gr": "0"
  },
  {
      "_id": 5740,
      "product": 294,
      "nutrient": 19,
      "value": "86",
      "perc1on100gr": "0"
  },
  {
      "_id": 5741,
      "product": 294,
      "nutrient": 21,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5742,
      "product": 294,
      "nutrient": 22,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 5743,
      "product": 294,
      "nutrient": 24,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 5744,
      "product": 294,
      "nutrient": 25,
      "value": "72",
      "perc1on100gr": "0"
  },
  {
      "_id": 5745,
      "product": 294,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5746,
      "product": 294,
      "nutrient": 29,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5747,
      "product": 294,
      "nutrient": 30,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5748,
      "product": 294,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5749,
      "product": 294,
      "nutrient": 34,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5750,
      "product": 294,
      "nutrient": 38,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5751,
      "product": 294,
      "nutrient": 41,
      "value": "17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5752,
      "product": 294,
      "nutrient": 43,
      "value": "0.26",
      "perc1on100gr": "0"
  },
  {
      "_id": 5753,
      "product": 294,
      "nutrient": 47,
      "value": "80",
      "perc1on100gr": "0"
  },
  {
      "_id": 5756,
      "product": 295,
      "nutrient": 0,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5757,
      "product": 295,
      "nutrient": 1,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 5758,
      "product": 295,
      "nutrient": 2,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5759,
      "product": 295,
      "nutrient": 3,
      "value": "337",
      "perc1on100gr": "0"
  },
  {
      "_id": 5760,
      "product": 295,
      "nutrient": 45,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5761,
      "product": 295,
      "nutrient": 4,
      "value": "260",
      "perc1on100gr": "0"
  },
  {
      "_id": 5762,
      "product": 295,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5763,
      "product": 295,
      "nutrient": 6,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5764,
      "product": 295,
      "nutrient": 11,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5765,
      "product": 295,
      "nutrient": 13,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5766,
      "product": 295,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5767,
      "product": 295,
      "nutrient": 18,
      "value": "90",
      "perc1on100gr": "0"
  },
  {
      "_id": 5768,
      "product": 295,
      "nutrient": 19,
      "value": "86",
      "perc1on100gr": "0"
  },
  {
      "_id": 5769,
      "product": 295,
      "nutrient": 21,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5770,
      "product": 295,
      "nutrient": 22,
      "value": "31",
      "perc1on100gr": "0"
  },
  {
      "_id": 5771,
      "product": 295,
      "nutrient": 24,
      "value": "58",
      "perc1on100gr": "0"
  },
  {
      "_id": 5772,
      "product": 295,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5773,
      "product": 295,
      "nutrient": 47,
      "value": "140",
      "perc1on100gr": "0"
  },
  {
      "_id": 5776,
      "product": 296,
      "nutrient": 0,
      "value": "2.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5777,
      "product": 296,
      "nutrient": 1,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5778,
      "product": 296,
      "nutrient": 2,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5779,
      "product": 296,
      "nutrient": 3,
      "value": "102",
      "perc1on100gr": "0"
  },
  {
      "_id": 5780,
      "product": 296,
      "nutrient": 45,
      "value": "4.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5781,
      "product": 296,
      "nutrient": 4,
      "value": "50",
      "perc1on100gr": "0"
  },
  {
      "_id": 5782,
      "product": 296,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5783,
      "product": 296,
      "nutrient": 6,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5784,
      "product": 296,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5785,
      "product": 296,
      "nutrient": 13,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5786,
      "product": 296,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5787,
      "product": 296,
      "nutrient": 18,
      "value": "127",
      "perc1on100gr": "0"
  },
  {
      "_id": 5788,
      "product": 296,
      "nutrient": 19,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 5789,
      "product": 296,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5790,
      "product": 296,
      "nutrient": 22,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 5791,
      "product": 296,
      "nutrient": 24,
      "value": "88",
      "perc1on100gr": "0"
  },
  {
      "_id": 5792,
      "product": 296,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5793,
      "product": 296,
      "nutrient": 47,
      "value": "22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5796,
      "product": 297,
      "nutrient": 0,
      "value": "2.17",
      "perc1on100gr": "0"
  },
  {
      "_id": 5797,
      "product": 297,
      "nutrient": 1,
      "value": "30.91",
      "perc1on100gr": "0"
  },
  {
      "_id": 5798,
      "product": 297,
      "nutrient": 2,
      "value": "2.96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5799,
      "product": 297,
      "nutrient": 3,
      "value": "292",
      "perc1on100gr": "0"
  },
  {
      "_id": 5800,
      "product": 297,
      "nutrient": 45,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5801,
      "product": 297,
      "nutrient": 4,
      "value": "279",
      "perc1on100gr": "0"
  },
  {
      "_id": 5802,
      "product": 297,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5803,
      "product": 297,
      "nutrient": 6,
      "value": "0.13",
      "perc1on100gr": "0"
  },
  {
      "_id": 5804,
      "product": 297,
      "nutrient": 52,
      "value": "0.26",
      "perc1on100gr": "0"
  },
  {
      "_id": 5805,
      "product": 297,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5806,
      "product": 297,
      "nutrient": 9,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5807,
      "product": 297,
      "nutrient": 10,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5808,
      "product": 297,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5809,
      "product": 297,
      "nutrient": 12,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5810,
      "product": 297,
      "nutrient": 13,
      "value": "0.88",
      "perc1on100gr": "0"
  },
  {
      "_id": 5811,
      "product": 297,
      "nutrient": 52,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5812,
      "product": 297,
      "nutrient": 15,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5813,
      "product": 297,
      "nutrient": 16,
      "value": "16.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5814,
      "product": 297,
      "nutrient": 18,
      "value": "97",
      "perc1on100gr": "0"
  },
  {
      "_id": 5815,
      "product": 297,
      "nutrient": 19,
      "value": "69",
      "perc1on100gr": "0"
  },
  {
      "_id": 5816,
      "product": 297,
      "nutrient": 21,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5817,
      "product": 297,
      "nutrient": 22,
      "value": "34",
      "perc1on100gr": "0"
  },
  {
      "_id": 5818,
      "product": 297,
      "nutrient": 24,
      "value": "61",
      "perc1on100gr": "0"
  },
  {
      "_id": 5819,
      "product": 297,
      "nutrient": 17,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5820,
      "product": 297,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5821,
      "product": 297,
      "nutrient": 38,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5822,
      "product": 297,
      "nutrient": 41,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5823,
      "product": 297,
      "nutrient": 43,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 5824,
      "product": 297,
      "nutrient": 47,
      "value": "111",
      "perc1on100gr": "0"
  },
  {
      "_id": 5827,
      "product": 298,
      "nutrient": 0,
      "value": "2.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 5828,
      "product": 298,
      "nutrient": 1,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 5829,
      "product": 298,
      "nutrient": 2,
      "value": "2.79",
      "perc1on100gr": "0"
  },
  {
      "_id": 5830,
      "product": 298,
      "nutrient": 3,
      "value": "345",
      "perc1on100gr": "0"
  },
  {
      "_id": 5831,
      "product": 298,
      "nutrient": 45,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5832,
      "product": 298,
      "nutrient": 4,
      "value": "411",
      "perc1on100gr": "0"
  },
  {
      "_id": 5833,
      "product": 298,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5834,
      "product": 298,
      "nutrient": 6,
      "value": "0.11",
      "perc1on100gr": "0"
  },
  {
      "_id": 5835,
      "product": 298,
      "nutrient": 52,
      "value": "0.26",
      "perc1on100gr": "0"
  },
  {
      "_id": 5836,
      "product": 298,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5837,
      "product": 298,
      "nutrient": 9,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5838,
      "product": 298,
      "nutrient": 10,
      "value": "0.18",
      "perc1on100gr": "0"
  },
  {
      "_id": 5839,
      "product": 298,
      "nutrient": 11,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5840,
      "product": 298,
      "nutrient": 12,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5841,
      "product": 298,
      "nutrient": 13,
      "value": "1.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 5842,
      "product": 298,
      "nutrient": 52,
      "value": "3.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5843,
      "product": 298,
      "nutrient": 15,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5844,
      "product": 298,
      "nutrient": 16,
      "value": "16.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5845,
      "product": 298,
      "nutrient": 18,
      "value": "75",
      "perc1on100gr": "0"
  },
  {
      "_id": 5846,
      "product": 298,
      "nutrient": 19,
      "value": "65",
      "perc1on100gr": "0"
  },
  {
      "_id": 5847,
      "product": 298,
      "nutrient": 21,
      "value": "7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5848,
      "product": 298,
      "nutrient": 22,
      "value": "38",
      "perc1on100gr": "0"
  },
  {
      "_id": 5849,
      "product": 298,
      "nutrient": 24,
      "value": "62",
      "perc1on100gr": "0"
  },
  {
      "_id": 5850,
      "product": 298,
      "nutrient": 17,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5851,
      "product": 298,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5852,
      "product": 298,
      "nutrient": 38,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5853,
      "product": 298,
      "nutrient": 41,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5854,
      "product": 298,
      "nutrient": 43,
      "value": "0.23",
      "perc1on100gr": "0"
  },
  {
      "_id": 5855,
      "product": 298,
      "nutrient": 47,
      "value": "137",
      "perc1on100gr": "0"
  },
  {
      "_id": 5858,
      "product": 299,
      "nutrient": 0,
      "value": "2.96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5859,
      "product": 299,
      "nutrient": 1,
      "value": "11.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5860,
      "product": 299,
      "nutrient": 2,
      "value": "4.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5861,
      "product": 299,
      "nutrient": 3,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 5862,
      "product": 299,
      "nutrient": 45,
      "value": "0.16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5863,
      "product": 299,
      "nutrient": 4,
      "value": "97",
      "perc1on100gr": "0"
  },
  {
      "_id": 5864,
      "product": 299,
      "nutrient": 5,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5865,
      "product": 299,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5866,
      "product": 299,
      "nutrient": 52,
      "value": "0.29",
      "perc1on100gr": "0"
  },
  {
      "_id": 5867,
      "product": 299,
      "nutrient": 8,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5868,
      "product": 299,
      "nutrient": 9,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5869,
      "product": 299,
      "nutrient": 10,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 5870,
      "product": 299,
      "nutrient": 11,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5871,
      "product": 299,
      "nutrient": 12,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5872,
      "product": 299,
      "nutrient": 13,
      "value": "0.33",
      "perc1on100gr": "0"
  },
  {
      "_id": 5873,
      "product": 299,
      "nutrient": 52,
      "value": "1.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5874,
      "product": 299,
      "nutrient": 15,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 5875,
      "product": 299,
      "nutrient": 16,
      "value": "18.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5876,
      "product": 299,
      "nutrient": 18,
      "value": "130",
      "perc1on100gr": "0"
  },
  {
      "_id": 5877,
      "product": 299,
      "nutrient": 19,
      "value": "105",
      "perc1on100gr": "0"
  },
  {
      "_id": 5878,
      "product": 299,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5879,
      "product": 299,
      "nutrient": 22,
      "value": "41",
      "perc1on100gr": "0"
  },
  {
      "_id": 5880,
      "product": 299,
      "nutrient": 24,
      "value": "95",
      "perc1on100gr": "0"
  },
  {
      "_id": 5881,
      "product": 299,
      "nutrient": 17,
      "value": "0.07",
      "perc1on100gr": "0"
  },
  {
      "_id": 5882,
      "product": 299,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5883,
      "product": 299,
      "nutrient": 38,
      "value": "1.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5884,
      "product": 299,
      "nutrient": 41,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5885,
      "product": 299,
      "nutrient": 43,
      "value": "0.51",
      "perc1on100gr": "0"
  },
  {
      "_id": 5886,
      "product": 299,
      "nutrient": 47,
      "value": "37",
      "perc1on100gr": "0"
  },
  {
      "_id": 5889,
      "product": 300,
      "nutrient": 0,
      "value": "2.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5890,
      "product": 300,
      "nutrient": 1,
      "value": "1.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5891,
      "product": 300,
      "nutrient": 2,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5892,
      "product": 300,
      "nutrient": 3,
      "value": "59",
      "perc1on100gr": "0"
  },
  {
      "_id": 5893,
      "product": 300,
      "nutrient": 45,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5894,
      "product": 300,
      "nutrient": 4,
      "value": "12",
      "perc1on100gr": "0"
  },
  {
      "_id": 5895,
      "product": 300,
      "nutrient": 5,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 5896,
      "product": 300,
      "nutrient": 6,
      "value": "0.24",
      "perc1on100gr": "0"
  },
  {
      "_id": 5897,
      "product": 300,
      "nutrient": 52,
      "value": "0.46",
      "perc1on100gr": "0"
  },
  {
      "_id": 5898,
      "product": 300,
      "nutrient": 8,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 5899,
      "product": 300,
      "nutrient": 9,
      "value": "4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5900,
      "product": 300,
      "nutrient": 10,
      "value": "0.52",
      "perc1on100gr": "0"
  },
  {
      "_id": 5901,
      "product": 300,
      "nutrient": 11,
      "value": "0.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5902,
      "product": 300,
      "nutrient": 13,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5903,
      "product": 300,
      "nutrient": 52,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5904,
      "product": 300,
      "nutrient": 15,
      "value": "0.12",
      "perc1on100gr": "0"
  },
  {
      "_id": 5905,
      "product": 300,
      "nutrient": 16,
      "value": "15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5906,
      "product": 300,
      "nutrient": 18,
      "value": "206",
      "perc1on100gr": "0"
  },
  {
      "_id": 5907,
      "product": 300,
      "nutrient": 19,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5908,
      "product": 300,
      "nutrient": 21,
      "value": "16",
      "perc1on100gr": "0"
  },
  {
      "_id": 5909,
      "product": 300,
      "nutrient": 22,
      "value": "144",
      "perc1on100gr": "0"
  },
  {
      "_id": 5910,
      "product": 300,
      "nutrient": 24,
      "value": "151",
      "perc1on100gr": "0"
  },
  {
      "_id": 5911,
      "product": 300,
      "nutrient": 33,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5912,
      "product": 300,
      "nutrient": 38,
      "value": "2.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5913,
      "product": 300,
      "nutrient": 41,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5914,
      "product": 300,
      "nutrient": 43,
      "value": "0.81",
      "perc1on100gr": "0"
  },
  {
      "_id": 5915,
      "product": 300,
      "nutrient": 47,
      "value": "5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5918,
      "product": 301,
      "nutrient": 0,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5919,
      "product": 301,
      "nutrient": 1,
      "value": "19.31",
      "perc1on100gr": "0"
  },
  {
      "_id": 5920,
      "product": 301,
      "nutrient": 2,
      "value": "3.66",
      "perc1on100gr": "0"
  },
  {
      "_id": 5921,
      "product": 301,
      "nutrient": 3,
      "value": "195",
      "perc1on100gr": "0"
  },
  {
      "_id": 5922,
      "product": 301,
      "nutrient": 45,
      "value": "0.14",
      "perc1on100gr": "0"
  },
  {
      "_id": 5923,
      "product": 301,
      "nutrient": 4,
      "value": "181",
      "perc1on100gr": "0"
  },
  {
      "_id": 5924,
      "product": 301,
      "nutrient": 5,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5925,
      "product": 301,
      "nutrient": 6,
      "value": "0.15",
      "perc1on100gr": "0"
  },
  {
      "_id": 5926,
      "product": 301,
      "nutrient": 52,
      "value": "0.28",
      "perc1on100gr": "0"
  },
  {
      "_id": 5927,
      "product": 301,
      "nutrient": 8,
      "value": "0.03",
      "perc1on100gr": "0"
  },
  {
      "_id": 5928,
      "product": 301,
      "nutrient": 9,
      "value": "2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5929,
      "product": 301,
      "nutrient": 10,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 5930,
      "product": 301,
      "nutrient": 11,
      "value": "0.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5931,
      "product": 301,
      "nutrient": 12,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5932,
      "product": 301,
      "nutrient": 13,
      "value": "0.55",
      "perc1on100gr": "0"
  },
  {
      "_id": 5933,
      "product": 301,
      "nutrient": 52,
      "value": "1.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5934,
      "product": 301,
      "nutrient": 15,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 5935,
      "product": 301,
      "nutrient": 16,
      "value": "16.8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5936,
      "product": 301,
      "nutrient": 18,
      "value": "122",
      "perc1on100gr": "0"
  },
  {
      "_id": 5937,
      "product": 301,
      "nutrient": 19,
      "value": "96",
      "perc1on100gr": "0"
  },
  {
      "_id": 5938,
      "product": 301,
      "nutrient": 21,
      "value": "9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5939,
      "product": 301,
      "nutrient": 22,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 5940,
      "product": 301,
      "nutrient": 24,
      "value": "80",
      "perc1on100gr": "0"
  },
  {
      "_id": 5941,
      "product": 301,
      "nutrient": 17,
      "value": "0.04",
      "perc1on100gr": "0"
  },
  {
      "_id": 5942,
      "product": 301,
      "nutrient": 33,
      "value": "0.01",
      "perc1on100gr": "0"
  },
  {
      "_id": 5943,
      "product": 301,
      "nutrient": 38,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 5944,
      "product": 301,
      "nutrient": 41,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5945,
      "product": 301,
      "nutrient": 43,
      "value": "0.27",
      "perc1on100gr": "0"
  },
  {
      "_id": 5946,
      "product": 301,
      "nutrient": 47,
      "value": "66",
      "perc1on100gr": "0"
  },
  {
      "_id": 5949,
      "product": 302,
      "nutrient": 0,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 5950,
      "product": 302,
      "nutrient": 1,
      "value": "19",
      "perc1on100gr": "0"
  },
  {
      "_id": 5951,
      "product": 302,
      "nutrient": 2,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 5952,
      "product": 302,
      "nutrient": 3,
      "value": "392",
      "perc1on100gr": "0"
  },
  {
      "_id": 5953,
      "product": 302,
      "nutrient": 45,
      "value": "47",
      "perc1on100gr": "0"
  },
  {
      "_id": 5954,
      "product": 302,
      "nutrient": 4,
      "value": "115",
      "perc1on100gr": "0"
  },
  {
      "_id": 5955,
      "product": 302,
      "nutrient": 5,
      "value": "0.05",
      "perc1on100gr": "0"
  },
  {
      "_id": 5956,
      "product": 302,
      "nutrient": 6,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5957,
      "product": 302,
      "nutrient": 11,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 5958,
      "product": 302,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5959,
      "product": 302,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5960,
      "product": 302,
      "nutrient": 18,
      "value": "334",
      "perc1on100gr": "0"
  },
  {
      "_id": 5961,
      "product": 302,
      "nutrient": 19,
      "value": "250",
      "perc1on100gr": "0"
  },
  {
      "_id": 5962,
      "product": 302,
      "nutrient": 21,
      "value": "36",
      "perc1on100gr": "0"
  },
  {
      "_id": 5963,
      "product": 302,
      "nutrient": 22,
      "value": "125",
      "perc1on100gr": "0"
  },
  {
      "_id": 5964,
      "product": 302,
      "nutrient": 24,
      "value": "170",
      "perc1on100gr": "0"
  },
  {
      "_id": 5965,
      "product": 302,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5966,
      "product": 302,
      "nutrient": 47,
      "value": "67",
      "perc1on100gr": "0"
  },
  {
      "_id": 5969,
      "product": 303,
      "nutrient": 0,
      "value": "2.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 5970,
      "product": 303,
      "nutrient": 1,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5971,
      "product": 303,
      "nutrient": 2,
      "value": "4.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5972,
      "product": 303,
      "nutrient": 3,
      "value": "119",
      "perc1on100gr": "0"
  },
  {
      "_id": 5973,
      "product": 303,
      "nutrient": 45,
      "value": "4.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5974,
      "product": 303,
      "nutrient": 4,
      "value": "57",
      "perc1on100gr": "0"
  },
  {
      "_id": 5975,
      "product": 303,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5976,
      "product": 303,
      "nutrient": 6,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5977,
      "product": 303,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5978,
      "product": 303,
      "nutrient": 13,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 5979,
      "product": 303,
      "nutrient": 15,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 5980,
      "product": 303,
      "nutrient": 18,
      "value": "124",
      "perc1on100gr": "0"
  },
  {
      "_id": 5981,
      "product": 303,
      "nutrient": 19,
      "value": "91",
      "perc1on100gr": "0"
  },
  {
      "_id": 5982,
      "product": 303,
      "nutrient": 21,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 5983,
      "product": 303,
      "nutrient": 22,
      "value": "40",
      "perc1on100gr": "0"
  },
  {
      "_id": 5984,
      "product": 303,
      "nutrient": 24,
      "value": "83",
      "perc1on100gr": "0"
  },
  {
      "_id": 5985,
      "product": 303,
      "nutrient": 17,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5986,
      "product": 303,
      "nutrient": 47,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 5989,
      "product": 304,
      "nutrient": 0,
      "value": "2.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 5990,
      "product": 304,
      "nutrient": 1,
      "value": "25",
      "perc1on100gr": "0"
  },
  {
      "_id": 5991,
      "product": 304,
      "nutrient": 2,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5992,
      "product": 304,
      "nutrient": 3,
      "value": "251",
      "perc1on100gr": "0"
  },
  {
      "_id": 5993,
      "product": 304,
      "nutrient": 45,
      "value": "3.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 5994,
      "product": 304,
      "nutrient": 4,
      "value": "154",
      "perc1on100gr": "0"
  },
  {
      "_id": 5995,
      "product": 304,
      "nutrient": 5,
      "value": "0.02",
      "perc1on100gr": "0"
  },
  {
      "_id": 5996,
      "product": 304,
      "nutrient": 6,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 5997,
      "product": 304,
      "nutrient": 52,
      "value": "0.34",
      "perc1on100gr": "0"
  },
  {
      "_id": 5998,
      "product": 304,
      "nutrient": 8,
      "value": "0.08",
      "perc1on100gr": "0"
  },
  {
      "_id": 5999,
      "product": 304,
      "nutrient": 9,
      "value": "2.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 6000,
      "product": 304,
      "nutrient": 10,
      "value": "0.4",
      "perc1on100gr": "0"
  },
  {
      "_id": 6001,
      "product": 304,
      "nutrient": 11,
      "value": "0.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 6002,
      "product": 304,
      "nutrient": 13,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 6003,
      "product": 304,
      "nutrient": 14,
      "value": "3.38",
      "perc1on100gr": "0"
  },
  {
      "_id": 6004,
      "product": 304,
      "nutrient": 15,
      "value": "0.1",
      "perc1on100gr": "0"
  },
  {
      "_id": 6005,
      "product": 304,
      "nutrient": 16,
      "value": "39.3",
      "perc1on100gr": "0"
  },
  {
      "_id": 6006,
      "product": 304,
      "nutrient": 18,
      "value": "109",
      "perc1on100gr": "0"
  },
  {
      "_id": 6007,
      "product": 304,
      "nutrient": 19,
      "value": "86",
      "perc1on100gr": "0"
  },
  {
      "_id": 6008,
      "product": 304,
      "nutrient": 21,
      "value": "8",
      "perc1on100gr": "0"
  },
  {
      "_id": 6009,
      "product": 304,
      "nutrient": 22,
      "value": "35",
      "perc1on100gr": "0"
  },
  {
      "_id": 6010,
      "product": 304,
      "nutrient": 24,
      "value": "60",
      "perc1on100gr": "0"
  },
  {
      "_id": 6011,
      "product": 304,
      "nutrient": 17,
      "value": "0.2",
      "perc1on100gr": "0"
  },
  {
      "_id": 6012,
      "product": 304,
      "nutrient": 47,
      "value": "108",
      "perc1on100gr": "0"
  },
  {
      "_id": 6015,
      "product": 305,
      "nutrient": 0,
      "value": "23",
      "perc1on100gr": "0"
  },
  {
      "_id": 6016,
      "product": 305,
      "nutrient": 1,
      "value": "42.7",
      "perc1on100gr": "0"
  },
  {
      "_id": 6017,
      "product": 305,
      "nutrient": 2,
      "value": "26.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 6018,
      "product": 305,
      "nutrient": 3,
      "value": "579",
      "perc1on100gr": "0"
  },
  {
      "_id": 6019,
      "product": 305,
      "nutrient": 45,
      "value": "26.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 6020,
      "product": 305,
      "nutrient": 4,
      "value": "363",
      "perc1on100gr": "0"
  },
  {
      "_id": 6021,
      "product": 305,
      "nutrient": 5,
      "value": "0.25",
      "perc1on100gr": "0"
  },
  {
      "_id": 6022,
      "product": 305,
      "nutrient": 6,
      "value": "0.9",
      "perc1on100gr": "0"
  },
  {
      "_id": 6023,
      "product": 305,
      "nutrient": 8,
      "value": "0.22",
      "perc1on100gr": "0"
  },
  {
      "_id": 6024,
      "product": 305,
      "nutrient": 9,
      "value": "30",
      "perc1on100gr": "0"
  },
  {
      "_id": 6025,
      "product": 305,
      "nutrient": 11,
      "value": "3",
      "perc1on100gr": "0"
  },
  {
      "_id": 6026,
      "product": 305,
      "nutrient": 13,
      "value": "0.5",
      "perc1on100gr": "0"
  },
  {
      "_id": 6027,
      "product": 305,
      "nutrient": 15,
      "value": "1",
      "perc1on100gr": "0"
  },
  {
      "_id": 6028,
      "product": 305,
      "nutrient": 18,
      "value": "726",
      "perc1on100gr": "0"
  },
  {
      "_id": 6029,
      "product": 305,
      "nutrient": 19,
      "value": "700",
      "perc1on100gr": "0"
  },
  {
      "_id": 6030,
      "product": 305,
      "nutrient": 21,
      "value": "80",
      "perc1on100gr": "0"
  },
  {
      "_id": 6031,
      "product": 305,
      "nutrient": 22,
      "value": "201",
      "perc1on100gr": "0"
  },
  {
      "_id": 6032,
      "product": 305,
      "nutrient": 24,
      "value": "543",
      "perc1on100gr": "0"
  },
  {
      "_id": 6033,
      "product": 305,
      "nutrient": 17,
      "value": "0.6",
      "perc1on100gr": "0"
  },
  {
      "_id": 6034,
      "product": 305,
      "nutrient": 33,
      "value": "0.06",
      "perc1on100gr": "0"
  },
  {
      "_id": 6035,
      "product": 305,
      "nutrient": 43,
      "value": "0.83",
      "perc1on100gr": "0"
  },
  {
      "_id": 6036,
      "product": 305,
      "nutrient": 47,
      "value": "148",
      "perc1on100gr": "0"
  },
  {
      "_id": 6039,
      "product": 306,
      "nutrient": 1,
      "value": "10",
      "perc1on100gr": "0"
  },
  {
      "_id": 6040,
      "product": 306,
      "nutrient": 2,