import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MatrixService {

  constructor() {}

//TODO => FOREACH...

TransMatrix(A:number[][])   :any    //На входе двумерный массив
{
      let m = A.length, n = A[0].length,
      AT:number[][] = [];
      A.forEach((ai:any,i:number)=>
      //for (let i = 0; i < n; i++)
       { AT.push( []);
         //for (var j = 0; j < m; j++)
         ai.forEach((aij:any, j:number)=>
            AT[ i ].push( A[j][ i ])
         )
       }
      )
      return AT;
}

SumMatrix(A:any[],B:any[])   :any     //На входе двумерные массивы одинаковой размерности
{
    var m = A.length, n = A[0].length, C = [];
    for (var i = 0; i < m; i++)
     { C[ i ] = [];
       for (var j = 0; j < n; j++) C[ i ].push( A[ i ][j]+B[ i ][j]);
     }
    return C;
}

multMatrixNumber(a:number,A:any[])  // a - число, A - матрица (двумерный массив)
{
    var m = A.length, n = A[0].length, B = [];
    for (var i = 0; i < m; i++)
     { B[ i ] = [];
       for (var j = 0; j < n; j++) B[ i ][j] = a*A[ i ][j];
     }
    return B;
}

MultiplyMatrix(A:any[],B:any[]) :any
{
    var rowsA = A.length, colsA = A[0].length,
        rowsB = B.length, colsB = B[0].length,
        C = [];
    if (colsA != rowsB) return false;
    for (var i = 0; i < rowsA; i++) C[ i ] = [];
    for (var k = 0; k < colsB; k++)
     { for (var i = 0; i < rowsA; i++)
        { var t = 0;
          for (var j = 0; j < rowsB; j++) t += A[ i ][j]*B[j][k];
          C[ i ][k] = t;
        }
     }
    return C;
}


MatrixPow(n:number,A:any[]) :any
{
    if (n == 1) return A;     // Функцию MultiplyMatrix см. выше
    else return this.MultiplyMatrix( A, this.MatrixPow(n-1,A) );
}

Determinant(A:any[]) :any   // Используется алгоритм Барейса, сложность O(n^3)
{
    var N = A.length, B = [], denom = 1, exchanges = 0;
    for (var i = 0; i < N; ++i)
     { B[ i ] = [];
       for (var j = 0; j < N; ++j) B[ i ][j] = A[ i ][j];
     }
    for (var i = 0; i < N-1; ++i)
     { var maxN = i, maxValue = Math.abs(B[ i ][ i ]);
       for (var j = i+1; j < N; ++j)
        { var value = Math.abs(B[j][ i ]);
          if (value > maxValue){ maxN = j; maxValue = value; }
        }
       if (maxN > i)
        { var temp = B[ i ]; B[ i ] = B[maxN]; B[maxN] = temp;
          ++exchanges;
        }
       else { if (maxValue == 0) return maxValue; }
       var value1 = B[ i ][ i ];
       for (var j = i+1; j < N; ++j)
        { var value2 = B[j][ i ];
          B[j][ i ] = 0;
          for (var k = i+1; k < N; ++k) B[j][k] = (B[j][k]*value1-B[ i ][k]*value2)/denom;
        }
       denom = value1;
     }
    if (exchanges%2) return -B[N-1][N-1];
    else return B[N-1][N-1];
}

MatrixRank(A:any[]) :any
{
    var m = A.length, n = A[0].length, k = (m < n ? m : n), r = 1, rank = 0;
    while (r <= k)
     { var B = [];
       for (var i = 0; i < r; i++) B[ i ] = [];
       for (var a = 0; a < m-r+1; a++)
        { for (var b = 0; b < n-r+1; b++)
           { for (var c = 0; c < r; c++)
              { for (var d = 0; d < r; d++) B[c][d] = A[a+c][b+d]; }
             if (this.Determinant(B) != 0) rank = r;
           }       // Функцию Determinant см. выше
        }
       r++;
     }
    return rank;
}

AdjugateMatrix(A:any[])  :any  // A - двумерный квадратный массив
{
    var N = A.length, adjA = [];
    for (var i = 0; i < N; i++)
     { adjA[ i ] = [];
       for (var j = 0; j < N; j++)
        { var B = [], sign = ((i+j)%2==0) ? 1 : -1;
          for (var m = 0; m < j; m++)
           { B[m] = [];
             for (var n = 0; n < i; n++)   B[m][n] = A[m][n];
             for (var n = i+1; n < N; n++) B[m][n-1] = A[m][n];
           }
          for (var m = j+1; m < N; m++)
           { B[m-1] = [];
             for (var n = 0; n < i; n++)   B[m-1][n] = A[m][n];
             for (var n = i+1; n < N; n++) B[m-1][n-1] = A[m][n];
           }
          adjA[ i ][j] = sign*this.Determinant(B);   // Функцию Determinant см. выше
        }
     }
    return adjA;
}

InverseMatrix(A :any[])   :any // A - двумерный квадратный массив
{
    var det = this.Determinant(A);                // Функцию Determinant см. выше
    if (det == 0) return false;
    var N = A.length, A = this.AdjugateMatrix(A); // Функцию AdjugateMatrix см. выше
    for (var i = 0; i < N; i++)
     { for (var j = 0; j < N; j++) A[ i ][j] /= det; }
    return A;
}

}
