import { Component, computed, input } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'full';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.html',
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  classes = computed(() => {
    const base = `
      inline-flex
      items-center
      justify-center
      gap-2
      rounded-full
      font-semibold
      transition-all
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-offset-2
      disabled:pointer-events-none
      disabled:opacity-50
      cursor-pointer
    `;

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      full: 'px-8 py-4 text-lg w-full'
    };

    const variants = {
      primary: `
        bg-secondary
        text-white
        shadow-lg
        hover:bg-secondary/90
        hover:scale-105
        active:scale-95
        focus:ring-secondary
      `,

      outline: `
        border
        border-primary
        text-primary
        hover:bg-primary
        hover:text-white
        focus:ring-primary
      `,

      ghost: `
        text-primary
        hover:bg-slate-100
        focus:ring-primary
      `,

      danger: `
        bg-red-600
        text-white
        hover:bg-red-700
        focus:ring-red-600
      `,
    };

    return `${base} ${sizes[this.size()]} ${variants[this.variant()]}`;
  });
}
