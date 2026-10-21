export const NOT_SUPPORT_MAPPER: { [k: string]: string } = {
  approve: 'ASSET.CUSTOM.WARN.NOT_SUPPORT_APPROVE',
  transfer: 'ASSET.CUSTOM.WARN.NOT_SUPPORT_TRANSFER',
  allowance: 'ASSET.CUSTOM.WARN.NOT_SUPPORT_ALLOWANCE',
  'trc721.approve': 'ASSET.CUSTOM.WARN.NOT_SUPPORT_APPROVE',
  'trc721.allowance': 'ASSET.CUSTOM.WARN.NOT_SUPPORT_ALLOWANCE',
  'trc721.transferfrom': 'ASSET.CUSTOM.WARN.NOT_SUPPORT_TRANSFER',
};

export const TOKEN_TYPE_MAP_NAME: { [k: number]: string } = {
  5: 'TRC721',
  2: 'TRC20',
  1: 'TRC10',
};

export const OFFICIAL_WEBSITE = 'https://www.tronlink.org/';
