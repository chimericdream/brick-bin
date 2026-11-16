import { describe, expect, it } from 'vitest';

import { extractSetNumbers } from './upc';

describe('extractSetNumbers', () => {
  it('finds the set number in a product title', () => {
    expect(extractSetNumbers('LEGO Icons Titanic 10294 Building Kit')).toEqual(['10294']);
    expect(
      extractSetNumbers('LEGO Technic Liebherr Crawler Crane LR 13000 42100 Building Set'),
    ).toEqual(['13000', '42100']);
  });

  it('keeps title order, so a piece count after the number does not win', () => {
    expect(extractSetNumbers('LEGO Star Wars 75192 Millennium Falcon, 7541 Pieces')).toEqual([
      '75192',
      '7541',
    ]);
  });

  it('puts bare years last and ignores short numbers, decimals and ages', () => {
    expect(extractSetNumbers('LEGO City 2024 Police Station 60316 Ages 6+')).toEqual([
      '60316',
      '2024',
    ]);
    expect(extractSetNumbers('Brick set 905 pieces 12.50 ages 8')).toEqual([]);
  });

  it('accepts a -1 suffix and repeats once', () => {
    expect(extractSetNumbers('Set 10294-1 Titanic (10294)')).toEqual(['10294']);
  });

  it('returns nothing for a title with no number', () => {
    expect(extractSetNumbers('Some plush toy')).toEqual([]);
    expect(extractSetNumbers('')).toEqual([]);
  });
});
