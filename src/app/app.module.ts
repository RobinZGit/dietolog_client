import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProductsAndNutrientsComponent } from './products-and-nutrients/products-and-nutrients.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { StaticDataSource } from './model/static.datasource';

@NgModule({
  declarations: [
    AppComponent,
    ProductsAndNutrientsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [StaticDataSource],
  bootstrap: [AppComponent]
})
export class AppModule { }
