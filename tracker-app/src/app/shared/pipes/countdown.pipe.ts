import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'countdown', standalone: true })
export class CountdownPipe implements PipeTransform {
  transform(dateStr: string): string {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} ${days % 30} days`;
    }
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}
