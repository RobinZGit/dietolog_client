import { Injectable } from "@angular/core";
//import { Observable } from "rxjs/internal/Observable";
import { Observable, from,of } from "rxjs";

@Injectable()
export class StaticDataSource {

/*select     '{''hint'': '''
                 || p.name||', основные нутриенты:\n\n'||(select string_agg(name||' - '||cast(value as text)||' '||units||' на 100гр. ('||perc1on100gr||'% сут.нормы)','\n')  from (select * from(select n.name,i.value, i.perc1on100gr, n.units from info i left join nutrients n on n._id=i.nutrient where i.product=p._id order by to_number(coalesce(i.perc1on100gr,'0'),'999999D99') desc limit 20)ZZZ) ZZ)
                 || ''',''rownumber'':'|| row_number() over(order by COALESCE(ii.value,0) desc,p._id)
				 || ', ''_id'': '||p._id
				 || ', ''name'': '''||name
				 || ''' ,''lowercase'': '''||lowercase
				 || ''', ''val'': '||0
				 || ', ''isrecommended'': '||0
				 || ', ''isnotrecommended'': '||0
				 || ', ''excluded'': '||0
				 ||'},'
                 from products p
                 left join info ii on --ii.nutrient=sorting and
				                      ii.product =p._id
                where  p.name like '%пре%'
                 order by COALESCE(ii.value,0) desc,p._id  */
private products: any = [
  "{'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':1, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0}",
  /*
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':2, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':3, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':4, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':5, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':6, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':7, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':8, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':9, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':10, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':11, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':12, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':13, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':14, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':15, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':16, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':17, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':18, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':19, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':20, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':21, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':22, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':23, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':24, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':25, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':26, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':27, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  {'hint': 'Дрожжи прессованные, основные нутриенты:\n\nВитамин В9 - 550 мкг на 100гр. (137,5% сут.нормы)\nХолестерин - 260 мг на 100гр. (84,97% сут.нормы)\nВитамин РР - 11.4 мг на 100гр. (71,25% сут.нормы)\nВитамин В2 - 0.68 мг на 100гр. (45,33% сут.нормы)\nФосфор (P) - 400 мг на 100гр. (40% сут.нормы)\nВитамин В1 - 0.6 мг на 100гр. (37,5% сут.нормы)\nЖелезо (Fe) - 3.2 мг на 100гр. (31,43% сут.нормы)\nВитамин В6 - 0.58 мг на 100гр. (29% сут.нормы)\nВитамин Н - 30 мкг на 100гр. (20% сут.нормы)\nКалий (K) - 590 мг на 100гр. (19,67% сут.нормы)\nСахара - 8.5 г на 100гр. (17% сут.нормы)\nБелки - 12.7 г на 100гр. (15,88% сут.нормы)\nМагний (Mg) - 51 мг на 100гр. (12,75% сут.нормы)\nВитамин Е - 0.8 мг на 100гр. (5,33% сут.нормы)\nКалорийность - 109 кКал на 100гр. (4,36% сут.нормы)\nЙод (I) - 4 мкг на 100гр. (4% сут.нормы)\nКальций (Ca) - 27 мг на 100гр. (3,38% сут.нормы)\nЖиры - 2.7 г на 100гр. (2,7% сут.нормы)\nУглеводы - 8.5 г на 100гр. (2,12% сут.нормы)\nМолибден (Mo) - 8 мкг на 100гр. (1,6% сут.нормы)','rownumber':28, '_id': 135, 'name': 'Дрожжи прессованные' ,'lowercase': 'дрожжи прессованные', 'val': 0, 'isrecommended': 0, 'isnotrecommended': 0, 'excluded': 0},
  */
];

//getProducts(): Observable<any[]> {
//return Observable.from([this.products]);
//}
getProducts(): any {
  return this.products;
}
}
