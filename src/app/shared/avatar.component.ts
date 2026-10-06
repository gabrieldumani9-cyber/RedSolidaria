import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { initials } from '../models/models';

@Component({
  selector: 'app-avatar',
  imports: [CommonModule],
  template: `
    <div [class]="sizeClass + ' rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden ' + bgClass">
      @if (photoURL) {
        <img [src]="photoURL" [alt]="name" class="h-full w-full object-cover" />
      } @else {
        <span [class]="textClass">{{ initials }}</span>
      }
    </div>
  `,
})
export class AvatarComponent {
  @Input({ required: true }) name = '';
  @Input() photoURL = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';

  get initials(): string {
    return initials(this.name);
  }

  get sizeClass(): string {
    return { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }[this.size];
  }

  get bgClass(): string {
    return 'bg-primary-500';
  }

  get textClass(): string {
    return '';
  }
}
