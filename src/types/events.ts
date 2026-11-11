export interface GlobalEvents {
  id: number;
  description: string;
  cost: number;
  influence: 'positive' | 'negative';
}

export interface LocaleEvents {
  id: number;
  description: string;
  cost: number;
  role: 'reachtruck' | 'picker';
  influence: 'positive' | 'negative';
}
