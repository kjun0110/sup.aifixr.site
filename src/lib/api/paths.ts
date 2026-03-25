/**
 * KJ main.py 마운트와 동일한 API prefix (게이트웨이 Base 뒤에 이어붙임)
 */
export const API_PREFIX = {
  IAM: "/api/iam",
  SUPPLY_CHAIN: "/api/supply-chain",
  DATA_MGMT: "/api/data-mgmt",
  INVITATION: "/api/invitation",
  DATA_CONTRACT: "/api/data-contract",
  NOTIFICATION: "/api/notification",
  PCF: "/api/pcf",
} as const;

/** 루트 헬스 (KJ main) */
export const PATH_HEALTH = "/health";

/** 스모크용 (KJ main) */
export const PATH_API_TEST = "/api/test";

