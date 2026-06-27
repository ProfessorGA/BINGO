import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeTransitionAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'scale(0.98) translateY(20px)' })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('0.4s ease-in-out', style({ opacity: 0, transform: 'scale(0.98) translateY(-20px)' }))
      ], { optional: true }),
      query(':enter', [
        animate('0.6s 0.2s ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ], { optional: true })
    ])
  ])
]);
