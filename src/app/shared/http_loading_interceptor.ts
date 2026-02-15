import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpLoadingState } from './http_loading_state';

export const httpLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingState = inject(HttpLoadingState);
  loadingState.begin();
  return next(req).pipe(finalize(() => loadingState.end()));
};


