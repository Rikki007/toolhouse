import { TOKENS } from '../data/tokens.ts'
import type { TokenConfig, TokenId } from '../types/index.ts'

/** Получить конфиг жетона по ID */
export function getTokenConfig(tokenId: TokenId): TokenConfig {
  return TOKENS.find((t) => t.id === tokenId) ?? TOKENS[0]
}
