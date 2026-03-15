import fs from 'node:fs';
import path from 'node:path';

export interface GozioApp {
  slug: string;
  name: string;
  icon: string;
  images: [string, string, string, string];
  appStoreUrl: string;
  googlePlayUrl: string; // placeholder — empty string for now
}

function getAppImages(slug: string): [string, string, string, string] {
  const dir = path.join(process.cwd(), 'public', 'gozio-apps', slug);
  const files = fs.readdirSync(dir);
  const screenshots = files
    .filter(f => f !== 'app-icon.webp' && f.endsWith('.webp'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/-(\d+)\.webp$/)?.[1] ?? '0');
      const numB = parseInt(b.match(/-(\d+)\.webp$/)?.[1] ?? '0');
      return numA - numB;
    })
    .map(f => `/gozio-apps/${slug}/${f}`);

  if (screenshots.length !== 4) {
    console.warn(`[gozioApps] Expected 4 screenshots for "${slug}", found ${screenshots.length}`);
  }
  return screenshots as [string, string, string, string];
}

export const gozioApps: GozioApp[] = [
  {
    slug: 'baptistjax',
    name: 'Baptist Access',
    icon: '/gozio-apps/baptistjax/app-icon.webp',
    images: getAppImages('baptistjax'),
    appStoreUrl: 'https://apps.apple.com/us/app/baptist-access/id1578565181',
    googlePlayUrl: '',
  },
  {
    slug: 'emoryhealth',
    name: 'MyEmoryHealth',
    icon: '/gozio-apps/emoryhealth/app-icon.webp',
    images: getAppImages('emoryhealth'),
    appStoreUrl: 'https://apps.apple.com/us/app/myemoryhealth/id6446915145',
    googlePlayUrl: '',
  },
  {
    slug: 'erlanger',
    name: 'ErlangerNOW',
    icon: '/gozio-apps/erlanger/app-icon.webp',
    images: getAppImages('erlanger'),
    appStoreUrl: 'https://apps.apple.com/us/app/erlangernow/id6744568424',
    googlePlayUrl: '',
  },
  {
    slug: 'grady',
    name: 'Grady GO!',
    icon: '/gozio-apps/grady/app-icon.webp',
    images: getAppImages('grady'),
    appStoreUrl: 'https://apps.apple.com/us/app/grady-go/id1376406613',
    googlePlayUrl: '',
  },
  {
    slug: 'hendrick',
    name: 'Hendrick Health',
    icon: '/gozio-apps/hendrick/app-icon.webp',
    images: getAppImages('hendrick'),
    appStoreUrl: 'https://apps.apple.com/us/app/hendrick-health/id1659678238',
    googlePlayUrl: '',
  },
  {
    slug: 'johnshopkins',
    name: 'Johns Hopkins Find Your Way',
    icon: '/gozio-apps/johnshopkins/app-icon.webp',
    images: getAppImages('johnshopkins'),
    appStoreUrl: 'https://apps.apple.com/us/app/johns-hopkins-find-your-way/id1495861981',
    googlePlayUrl: '',
  },
  {
    slug: 'mdanderson',
    name: 'MD Anderson Directions',
    icon: '/gozio-apps/mdanderson/app-icon.webp',
    images: getAppImages('mdanderson'),
    appStoreUrl: 'https://apps.apple.com/us/app/md-anderson-directions/id1659495180',
    googlePlayUrl: '',
  },
  {
    slug: 'nicklaus',
    name: "My Nicklaus Children's",
    icon: '/gozio-apps/nicklaus/app-icon.webp',
    images: getAppImages('nicklaus'),
    appStoreUrl: 'https://apps.apple.com/us/app/my-nicklaus-childrens/id1581842514',
    googlePlayUrl: '',
  },
  {
    slug: 'osf',
    name: 'My OSF',
    icon: '/gozio-apps/osf/app-icon.webp',
    images: getAppImages('osf'),
    appStoreUrl: 'https://apps.apple.com/us/app/my-osf/id6590633564',
    googlePlayUrl: '',
  },
  {
    slug: 'prisma',
    name: 'Prisma Health GO',
    icon: '/gozio-apps/prisma/app-icon.webp',
    images: getAppImages('prisma'),
    appStoreUrl: 'https://apps.apple.com/us/app/prisma-health-go/id1453905158',
    googlePlayUrl: '',
  },
  {
    slug: 'temple',
    name: 'Temple Health Now',
    icon: '/gozio-apps/temple/app-icon.webp',
    images: getAppImages('temple'),
    appStoreUrl: 'https://apps.apple.com/us/app/temple-health-now/id1603326236',
    googlePlayUrl: '',
  },
  {
    slug: 'texaschildrens',
    name: "Texas Children's",
    icon: '/gozio-apps/texaschildrens/app-icon.webp',
    images: getAppImages('texaschildrens'),
    appStoreUrl: 'https://apps.apple.com/us/app/texas-childrens/id6474006028',
    googlePlayUrl: '',
  },
  {
    slug: 'uhealth',
    name: 'University Health Go',
    icon: '/gozio-apps/uhealth/app-icon.webp',
    images: getAppImages('uhealth'),
    appStoreUrl: 'https://apps.apple.com/us/app/university-health-go/id1507680697',
    googlePlayUrl: '',
  },
  {
    slug: 'ukhealthcare',
    name: 'UK HealthCare',
    icon: '/gozio-apps/ukhealthcare/app-icon.webp',
    images: getAppImages('ukhealthcare'),
    appStoreUrl: 'https://apps.apple.com/us/app/uk-healthcare/id6740246704',
    googlePlayUrl: '',
  },
  {
    slug: 'unc',
    name: 'UNC Health',
    icon: '/gozio-apps/unc/app-icon.webp',
    images: getAppImages('unc'),
    appStoreUrl: 'https://apps.apple.com/us/app/unc-health/id1474289946',
    googlePlayUrl: '',
  },
  {
    slug: 'utmc',
    name: 'UTMC Way',
    icon: '/gozio-apps/utmc/app-icon.webp',
    images: getAppImages('utmc'),
    appStoreUrl: 'https://apps.apple.com/us/app/utmc-way/id1498707007',
    googlePlayUrl: '',
  },
  {
    slug: 'wakemed',
    name: 'WakeMed',
    icon: '/gozio-apps/wakemed/app-icon.webp',
    images: getAppImages('wakemed'),
    appStoreUrl: 'https://apps.apple.com/us/app/wakemed/id1463912146',
    googlePlayUrl: '',
  },
];
