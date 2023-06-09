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
    let m = A.length, n = A[0].length
    let C:any[] = [];
    for (let i = 0; i < m; i++)
     { C.push([])// C[ i ] = [];
       for (let j = 0; j < n; j++) C[ i ].push( A[ i ][j]+B[ i ][j]);
     }
    return C;
}

multMatrixNumber(a:number,A:any[])  // a - число, A - матрица (двумерный массив)
{
    let m = A.length, n = A[0].length
    let B:any = [];
    for (let i = 0; i < m; i++)
     { B[ i ] = [];
       for (let j = 0; j < n; j++) B[ i ][j] = a*A[ i ][j];
     }
    return B;
}

MultiplyMatrix(A:any[],B:any[]) :any
{
  let rowsA = A.length, colsA = A[0].length,
        rowsB = B.length, colsB = B[0].length
  let  C:any = [];
    if (colsA != rowsB) return false;
    for (let i = 0; i < rowsA; i++) C[ i ] = [];
    for (let k = 0; k < colsB; k++)
     { for (let i = 0; i < rowsA; i++)
        { let t = 0;
          for (let j = 0; j < rowsB; j++) t += A[ i ][j]*B[j][k];
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
  let N = A.length, denom = 1, exchanges = 0;
    let B:any =[]
    for (let i = 0; i < N; ++i)
     { B[ i ] = [];
       for (let j = 0; j < N; ++j) B[ i ][j] = A[ i ][j];
     }
    for (let i = 0; i < N-1; ++i)
     { let maxN = i, maxValue = Math.abs(B[ i ][ i ]);
       for (let j = i+1; j < N; ++j)
        { let value = Math.abs(B[j][ i ]);
          if (value > maxValue){ maxN = j; maxValue = value; }
        }
       if (maxN > i)
        { let temp = B[ i ]; B[ i ] = B[maxN]; B[maxN] = temp;
          ++exchanges;
        }
       else { if (maxValue == 0) return maxValue; }
       let value1 = B[ i ][ i ];
       for (let j = i+1; j < N; ++j)
        { let value2 = B[j][ i ];
          B[j][ i ] = 0;
          for (let k = i+1; k < N; ++k) B[j][k] = (B[j][k]*value1-B[ i ][k]*value2)/denom;
        }
       denom = value1;
     }
    if (exchanges%2) return -B[N-1][N-1];
    else return B[N-1][N-1];
}

MatrixRank(A:any[]) :any
{
  let m = A.length, n = A[0].length, k = (m < n ? m : n), r = 1, rank = 0;
    while (r <= k)
     { let B:any = [];
       for (let i = 0; i < r; i++) B[ i ] = [];
       for (let a = 0; a < m-r+1; a++)
        { for (let b = 0; b < n-r+1; b++)
           { for (let c = 0; c < r; c++)
              { for (let d = 0; d < r; d++) B[c][d] = A[a+c][b+d]; }
             if (this.Determinant(B) != 0) rank = r;
           }       // Функцию Determinant см. выше
        }
       r++;
     }
    return rank;
}

AdjugateMatrix(A:any[])  :any  // A - двумерный квадратный массив
{
  let N = A.length
  let adjA:any = [];
    for (let i = 0; i < N; i++)
     { adjA[ i ] = [];
       for (let j = 0; j < N; j++)
        { let B:any = [], sign = ((i+j)%2==0) ? 1 : -1;
          for (let m = 0; m < j; m++)
           { B[m] = [];
             for (let n = 0; n < i; n++)   B[m][n] = A[m][n];
             for (let n = i+1; n < N; n++) B[m][n-1] = A[m][n];
           }
          for (let m = j+1; m < N; m++)
           { B[m-1] = [];
             for (let n = 0; n < i; n++)   B[m-1][n] = A[m][n];
             for (let n = i+1; n < N; n++) B[m-1][n-1] = A[m][n];
           }
          adjA[ i ][j] = sign*this.Determinant(B);   // Функцию Determinant см. выше
        }
     }
    return adjA;
}


//??? A->AA (было А)
InverseMatrix(AA :any[])   :any // A - двумерный квадратный массив
{
  let det = this.Determinant(AA);                // Функцию Determinant см. выше
    if (det == 0) return false;
    let N = AA.length, A = this.AdjugateMatrix(AA); // Функцию AdjugateMatrix см. выше
    for (let i = 0; i < N; i++)
     { for (let j = 0; j < N; j++) A[ i ][j] /= det; }
    return A;
}

}
