import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const fortezzaGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session().pipe(map(ok => ok || router.createUrlTree(['/Fortezza'], {
    queryParams: { returnUrl: state.url }
  })));
};
