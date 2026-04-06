/**
 * ISO 3166-1 alpha-2 ↔ 한국어 표시명 (Intl.DisplayNames, type: region)
 * UI에는 한글명, 저장/API에는 2자 코드(대문자)만 사용.
 */

export type IsoAlpha2KoEntry = { code: string; nameKo: string };

let optionsCache: IsoAlpha2KoEntry[] | null = null;
let labelByCodeCache: Map<string, string> | null = null;

function buildAlpha2RegionLabelsKo(): IsoAlpha2KoEntry[] {
  if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined') {
    try {
      const dn = new Intl.DisplayNames(['ko'], { type: 'region' });
      const list: IsoAlpha2KoEntry[] = [];
      for (let i = 0; i < 26; i++) {
        for (let j = 0; j < 26; j++) {
          const code = String.fromCharCode(65 + i) + String.fromCharCode(65 + j);
          const name = dn.of(code);
          if (name != null && name.length > 0 && name !== code) {
            list.push({ code, nameKo: name });
          }
        }
      }
      list.sort((a, b) => a.nameKo.localeCompare(b.nameKo, 'ko'));
      return list;
    } catch {
      /* fall through */
    }
  }
  return [
    { code: 'KR', nameKo: '대한민국' },
    { code: 'US', nameKo: '미국' },
    { code: 'CN', nameKo: '중국' },
    { code: 'JP', nameKo: '일본' },
    { code: 'DE', nameKo: '독일' },
    { code: 'VN', nameKo: '베트남' },
    { code: 'HU', nameKo: '헝가리' },
    { code: 'GB', nameKo: '영국' },
    { code: 'FR', nameKo: '프랑스' },
    { code: 'AU', nameKo: '호주' },
  ];
}

function ensureCache(): void {
  if (optionsCache) return;
  optionsCache = buildAlpha2RegionLabelsKo();
  labelByCodeCache = new Map(optionsCache.map((e) => [e.code, e.nameKo]));
}

export function getIso3166Alpha2KoOptions(): ReadonlyArray<IsoAlpha2KoEntry> {
  ensureCache();
  return optionsCache!;
}

/** 저장값(alpha-2) → UI 표시용 한글명. 알 수 없으면 코드 그대로. */
export function countryKoLabelFromCode(code: string | undefined | null): string {
  ensureCache();
  const c = String(code ?? '').trim().toUpperCase();
  if (!c) return '';
  return labelByCodeCache!.get(c) ?? c;
}
